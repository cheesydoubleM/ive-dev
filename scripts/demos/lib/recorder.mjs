// Stop-motion recorder for the real IVE frontend. Playwright's fake clock (installed on
// the context before navigation) advances the app's timers one frame at a time; every
// frame is captured at 2x as a lossless PNG and ffmpeg encodes the sequence. Capture
// speed never matters, so 3200x2000 frames stay crisp at a steady frame rate.
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';

const CURSOR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="30" viewBox="0 0 22 30"><path d="M3 2.5 3 23.2 8.3 18.4 11.6 26.6 15.7 24.9 12.4 16.8 19.4 16.6Z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`;

export async function createRecorder(page, context, { fps = 30, framesDir, name = 'clip' } = {}) {
  if (!framesDir) throw new Error('framesDir required');
  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });
  const frameMs = 1000 / fps;
  let index = 0;
  // Parked bottom right, outside the content, so posters and crops start clean.
  let mouse = { x: 1500, y: 800 };
  let recording = false;

  // Synthetic pointer: headless captures have no cursor, but a demo needs one.
  await page.evaluate((svg) => {
    const el = document.createElement('div');
    el.id = 'demo-cursor';
    el.innerHTML = svg;
    Object.assign(el.style, { position: 'fixed', left: '-100px', top: '-100px', zIndex: 2147483647, pointerEvents: 'none', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.35))', transition: 'none' });
    document.body.appendChild(el);
    const ring = document.createElement('div');
    ring.id = 'demo-click';
    Object.assign(ring.style, { position: 'fixed', width: '26px', height: '26px', marginLeft: '-13px', marginTop: '-13px', borderRadius: '50%', border: '2px solid rgba(22,71,255,.85)', background: 'rgba(22,71,255,.18)', zIndex: 2147483646, pointerEvents: 'none', display: 'none' });
    document.body.appendChild(ring);
  }, CURSOR_SVG);
  const placeCursor = () => page.evaluate(({ x, y }) => {
    const el = document.getElementById('demo-cursor');
    if (el) { el.style.left = x + 'px'; el.style.top = y + 'px'; }
  }, mouse);
  await placeCursor();

  async function frame(n = 1) {
    for (let i = 0; i < n; i++) {
      if (recording) {
        await context.clock.runFor(frameMs);
        await page.screenshot({ path: join(framesDir, `f${String(index++).padStart(5, '0')}.png`), type: 'png', caret: 'initial', animations: 'allow', timeout: 15000 });
      } else {
        await page.waitForTimeout(frameMs);
      }
    }
  }
  const seconds = (s) => Math.round(s * fps);

  const api = {
    fps, frameMs,
    get frameCount() { return index; },
    async start() {
      await page.evaluate(() => document.fonts.ready);
      // A steady caret instead of a real-time blink that would flicker between frames.
      await page.addStyleTag({ content: '* { caret-animation: manual !important; }' });
      await context.clock.pauseAt(Date.now() + 2000);
      recording = true;
    },
    async stop() { recording = false; await context.clock.resume().catch(() => {}); },
    frame,
    hold: (s) => frame(seconds(s)),
    // Real-time wait for the fixture's network round trips (does not advance frames).
    settle: (ms = 60) => page.waitForTimeout(ms),
    async moveTo(target, { duration = 0.5, offset } = {}) {
      const to = await resolvePoint(page, target, offset);
      const from = { ...mouse };
      const n = Math.max(1, seconds(duration));
      for (let i = 1; i <= n; i++) {
        const t = i / n, e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease in-out
        mouse = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e };
        await page.mouse.move(mouse.x, mouse.y);
        await placeCursor();
        await frame();
      }
    },
    async click(target, { duration = 0.5, offset, after = 0.25 } = {}) {
      if (target) await api.moveTo(target, { duration, offset });
      await page.evaluate(({ x, y }) => { const r = document.getElementById('demo-click'); if (r) { r.style.left = x + 'px'; r.style.top = y + 'px'; r.style.display = 'block'; } }, mouse);
      await page.mouse.down();
      await frame(2);
      await page.mouse.up();
      await frame(2);
      await page.evaluate(() => { const r = document.getElementById('demo-click'); if (r) r.style.display = 'none'; });
      await api.settle();
      await frame(seconds(after));
    },
    async type(text, { cps = 20, jitter = 0.35 } = {}) {
      const per = fps / cps;
      let carry = 0;
      for (const ch of text) {
        await page.keyboard.type(ch);
        const gap = per * (1 + (Math.random() * 2 - 1) * jitter) + (/[.,;:!?]/.test(ch) ? per * 1.5 : 0) + carry;
        const n = Math.floor(gap); carry = gap - n;
        await frame(Math.max(1, n));
      }
    },
    async press(key, after = 0.1) { await page.keyboard.press(key); await api.settle(); await frame(seconds(after)); },
    async scrollBy(target, dy, { duration = 0.8 } = {}) {
      const point = await resolvePoint(page, target);
      await page.mouse.move(point.x, point.y);
      const n = Math.max(1, seconds(duration));
      let done = 0;
      for (let i = 1; i <= n; i++) {
        const t = i / n, e = 1 - Math.pow(1 - t, 3);
        const next = Math.round(dy * e);
        await page.mouse.wheel(0, next - done);
        done = next;
        await frame();
      }
    },
    // Mark the loop point so the encoder can dissolve back to the first frame.
    encode: (outBase, opts) => encode(framesDir, outBase, { fps, ...opts }),
  };
  return api;
}

async function resolvePoint(page, target, offset) {
  if (Array.isArray(target)) return { x: target[0], y: target[1] };
  if (target && typeof target.boundingBox === 'function') {
    const box = await target.boundingBox();
    if (!box) throw new Error('Target has no bounding box');
    const o = offset || { x: 0.5, y: 0.5 };
    return { x: box.x + box.width * o.x, y: box.y + box.height * o.y };
  }
  throw new Error('Unknown target');
}

/**
 * PNG frames -> MP4 (H.264, 3200x2000 and a 1600x1000 rendition) + lossless WebP posters.
 * The loop dissolves from the last frame back into the first. `stills` exports extra
 * frames as posters: [{ name, frame }].
 */
export function encode(framesDir, outBase, { fps = 30, loopFade = 0.7, stills = [] } = {}) {
  const count = (() => { let n = 0; while (existsSync(join(framesDir, `f${String(n).padStart(5, '0')}.png`))) n++; return n; })();
  if (!count) throw new Error('No frames');
  const dur = count / fps;
  const run = (bin, args) => {
    const r = spawnSync(bin, args, { stdio: 'inherit' });
    if (r.status !== 0) throw new Error(`${bin} failed: ${args.join(' ')}`);
  };
  const ff = (args) => run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
  const first = join(framesDir, 'f00000.png');
  const seq = ['-framerate', String(fps), '-i', join(framesDir, 'f%05d.png')];
  const tail = ['-loop', '1', '-framerate', String(fps), '-t', String(loopFade), '-i', first];
  const fade = `[0:v][1:v]xfade=transition=fade:duration=${loopFade}:offset=${(dur - loopFade).toFixed(3)}`;
  const h264 = ['-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an'];
  ff([...seq, ...tail, '-filter_complex', `${fade},format=yuv420p[v]`, '-map', '[v]', ...h264, '-crf', '19', `${outBase}.mp4`]);
  ff([...seq, ...tail, '-filter_complex', `${fade},scale=1600:-2:flags=lanczos,format=yuv420p[v]`, '-map', '[v]', ...h264, '-crf', '20', `${outBase}-s.mp4`]);
  const poster = (png, base) => {
    run('cwebp', ['-quiet', '-lossless', '-z', '9', png, '-o', `${base}@2x.webp`]);
    const small = `${base}.small.png`;
    ff(['-i', png, '-vf', 'scale=1600:-1:flags=lanczos', small]);
    run('cwebp', ['-quiet', '-lossless', '-z', '9', small, '-o', `${base}.webp`]);
    rmSync(small, { force: true });
  };
  poster(first, outBase);
  for (const still of stills) poster(join(framesDir, `f${String(Math.min(still.frame, count - 1)).padStart(5, '0')}.png`), join(dirname(outBase), still.name));
  return { frames: count, seconds: dur };
}
