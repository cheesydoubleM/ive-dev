// Bootstraps one generated demo inside frame.html: reads ?scene=…&theme=…, sizes the stage to
// the iframe (a scene's `fit` keeps its text legible by letting the app window shrink instead of
// scaling below `minScale`), loads the scene module and exposes `window.IVE_DEMO` to the parent
// page (same origin): seek, play, pause, time, duration, markers, poster. A visitor's pointer
// inside the stage pauses playback, so scrolling or clicking is never overwritten by the timer.
import { createPlayer } from './lib/timeline.js';
import { colsFor } from './lib/term.js';

const params = new URLSearchParams(location.search);
const sceneId = (params.get('scene') || 'terminal').replace(/[^a-z0-9-]/g, '');
const theme = params.get('theme') === 'dark' ? 'dark' : 'light';
document.documentElement.setAttribute('data-theme', theme);

const stage = document.getElementById('stage');
const root = document.getElementById('root');
const ctx = { width: 1600, height: 1000, scale: 1, theme, phone: params.get('phone') === '1', variant: (params.get('variant') || '').replace(/[^a-z0-9-]/g, ''), params, cols: () => 80 };

let player = null, scene = null;

// app.css answers width media queries for the iframe, but the app window is the stage: evaluate
// every width condition against the stage width instead (CSSOM, same-origin stylesheet), so the
// demo lays out like the app in a window of that size (Tailwind md:/lg: utilities, the sidebar
// width, the 40 px touch targets, the brief's wrapping).
const mediaRules = [];
function collectMediaRules() {
  for (const sheet of Array.from(document.styleSheets)) {
    if (!sheet.href || !/app\.css/.test(sheet.href)) continue;
    let rules;
    try { rules = Array.from(sheet.cssRules); } catch { continue; }
    for (const rule of rules) {
      if (!(rule instanceof CSSMediaRule)) continue;
      const text = rule.media.mediaText;
      if (!/(min|max)-width/.test(text)) continue;
      mediaRules.push({ rule, text });
    }
  }
}
const px = (v, unit) => (unit === 'rem' || unit === 'em' ? v * 16 : v);
function widthQueryMatches(text, width) {
  // every width condition must hold (the app only combines them with "and")
  let ok = true;
  text.replace(/\((min|max)-width:\s*([\d.]+)(px|rem|em)\)/g, (_, kind, v, unit) => {
    const limit = px(parseFloat(v), unit);
    if (kind === 'min' ? width < limit : width > limit) ok = false;
    return _;
  });
  return ok;
}
function applyMediaForStage(width) {
  if (!mediaRules.length) collectMediaRules();
  for (const m of mediaRules) {
    const rest = m.text.replace(/\((min|max)-width:[^)]*\)\s*(and\s*)?/g, '').replace(/\s*and\s*$/, '').trim();
    const want = widthQueryMatches(m.text, width) ? (rest || 'all') : 'not all';
    if (m.rule.media.mediaText !== want) { try { m.rule.media.mediaText = want; } catch { /* read-only */ } }
  }
}

function layout() {
  const vw = document.documentElement.clientWidth || window.innerWidth;
  const vh = document.documentElement.clientHeight || window.innerHeight;
  if (!vw || !vh) return;
  const fit = scene?.fit || {};
  const base = fit.width || 1600;
  const minScale = fit.minScale ?? 0.72;
  const scale = Math.min(fit.maxScale ?? 1, Math.max(minScale, vw / base));
  ctx.width = Math.round(vw / scale);
  ctx.height = Math.round(vh / scale);
  ctx.scale = scale;
  stage.style.width = ctx.width + 'px';
  stage.style.height = ctx.height + 'px';
  stage.style.transform = `scale(${scale})`;
  applyMediaForStage(ctx.width);
  if (player) player.relayout();
}

// Columns of a terminal slot by its live width (the first render estimates from the stage).
ctx.cols = (selector, fontSize = 13) => {
  const el = root.querySelector(selector);
  const w = el ? el.clientWidth : ctx.width - 252;
  return colsFor(w || ctx.width - 252, fontSize);
};

const post = (type, data = {}) => { try { window.parent.postMessage({ source: 'ive-demo', scene: sceneId, type, ...data }, location.origin); } catch { /* no parent */ } };

const api = window.IVE_DEMO = {
  scene: sceneId, theme, ready: false,
  seek: (t) => player && player.seek(t),
  play: () => player && player.play(),
  pause: () => player && player.pause(),
  get time() { return player ? player.time : 0; },
  get duration() { return player ? player.duration : 0; },
  get playing() { return !!player && player.playing; },
  get markers() { return player ? player.markers : []; },
  get poster() { return scene ? scene.poster ?? 0 : 0; },
  get title() { return scene ? scene.title : ''; },
  relayout: layout,
};

(async () => {
  try {
    scene = (await import(`./scenes/${sceneId}.js`)).default;
  } catch (e) {
    root.innerHTML = `<p style="padding:24px;font:13px Inter,system-ui">Demo "${sceneId}" could not load.</p>`;
    post('error', { message: String(e && e.message) });
    return;
  }
  // A scene may bring its own stylesheet (scenes/<id>.css) for markup app.css does not cover.
  if (scene.css) {
    await new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `scenes/${sceneId}.css`;
      link.onload = link.onerror = resolve;
      document.head.appendChild(link);
    });
  }
  layout();
  await document.fonts.ready.catch(() => {});
  player = createPlayer(scene, {
    stage, root, ctx,
    onTime: (time, duration) => post('time', { time, duration }),
    onEnd: () => post('ended'),
    onPlayState: (playing) => post('playstate', { playing }),
  });
  // Terminal widths are only known after the first layout: render twice.
  const at = params.has('at') ? Number(params.get('at')) : (scene.poster ?? 0);
  player.seek(Number.isFinite(at) ? at : 0);
  player.relayout();
  api.ready = true;
  new ResizeObserver(layout).observe(document.documentElement);
  // A visitor taking over: any pointer press or wheel inside the stage pauses the timer.
  const takeOver = () => { if (player.playing) { player.pause(); post('takeover'); } };
  stage.addEventListener('pointerdown', takeOver, { passive: true });
  stage.addEventListener('wheel', takeOver, { passive: true });
  stage.addEventListener('keydown', takeOver);
  // Escape inside the frame reaches the parent (closes the expanded viewer there).
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') post('key', { key: 'Escape' }); });
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || e.data.target !== 'ive-demo') return;
    const { type, time } = e.data;
    if (type === 'seek') player.seek(time);
    else if (type === 'play') player.play();
    else if (type === 'pause') player.pause();
  });
  post('ready', { duration: player.duration, markers: player.markers, poster: scene.poster ?? 0, title: scene.title });
})();
