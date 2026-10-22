// Stop-motion recorder for the real IVE frontend. Playwright's fake clock (installed on
// the context before navigation) advances the app's timers one frame at a time; every
// frame is captured at 2x as a lossless PNG and ffmpeg encodes the sequence. Capture
// speed never matters, so 3200x2000 frames stay crisp at a steady frame rate.
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';

const CURSOR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="30" viewBox="0 0 22 30"><path d="M3 2.5 3 23.2 8.3 18.4 11.6 26.6 15.7 24.9 12.4 16.8 19.4 16.6Z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`;

export async function createRecorder(page, context, { fps = 30, framesDir, name = 'clip', park = [1500, 800] } = {}) {
  if (!framesDir) throw new Error('framesDir required');
  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });
  const frameMs = 1000 / fps;
  let index = 0;
  // Parked bottom right, outside the content, so posters and crops start clean.
  let mouse = { x: park[0], y: park[1] };
  let recording = false;
  const snaps = {};
  const marks = {};
  // CDP capture with the fast PNG encoder: lossless and pixel-identical to page.screenshot()
  // at device pixel ratio 2, about three times quicker at 3200x2000.
  const cdp = await context.newCDPSession(page);
  const { width: vw, height: vh } = page.viewportSize();
  const dpr = await page.evaluate(() => window.devicePixelRatio);

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
  const setPointerVisible = (visible) => page.evaluate((v) => {
    for (const id of ['demo-cursor', 'demo-click']) { const el = document.getElementById(id); if (el) el.style.visibility = v ? 'visible' : 'hidden'; }
  }, visible);

  async function capture(path) {
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, clip: { x: 0, y: 0, width: vw, height: vh, scale: dpr } });
    writeFileSync(path, Buffer.from(data, 'base64'));
  }

  async function frame(n = 1) {
    for (let i = 0; i < n; i++) {
      if (recording) {
        await context.clock.runFor(frameMs);
        await capture(join(framesDir, `f${String(index++).padStart(5, '0')}.png`));
      } else {
        await page.waitForTimeout(frameMs);
      }
    }
  }
  const seconds = (s) => Math.round(s * fps);

  const api = {
    fps, frameMs, snaps, marks,
    get frameCount() { return index; },
    async start() {
      await page.evaluate(() => document.fonts.ready);
      // A steady caret instead of a real-time blink that would flicker between frames.
      await page.addStyleTag({ content: '* { caret-animation: manual !important; }' });
      await context.clock.pauseAt(Date.now() + 2000);
      recording = true;
    },
    async stop() {
      recording = false;
      writeFileSync(join(framesDir, 'meta.json'), JSON.stringify({ fps, frames: index, snaps, marks }, null, 1));
      await context.clock.resume().catch(() => {});
    },
    /** Names the next frame, e.g. where a view changes and a segmented crop switches. */
    mark(markName) { marks[markName] = index; return index; },
    frame,
    hold: (s) => frame(seconds(s)),
    /** Records frames until `check()` holds (the app's own loading and transitions stay on camera). */
    async until(check, { maxSeconds = 6, label = 'condition' } = {}) {
      for (let i = 0; i < seconds(maxSeconds); i++) {
        if (await check()) return i;
        await frame();
      }
      if (await check()) return seconds(maxSeconds);
      throw new Error(`until: ${label} not reached within ${maxSeconds}s`);
    },
    /** Like `until`, for a locator becoming visible. */
    untilVisible(locator, opts = {}) { return api.until(() => locator.first().isVisible().catch(() => false), { label: String(locator), ...opts }); },
    // Real-time wait for the fixture's network round trips (does not advance frames).
    settle: (ms = 60) => page.waitForTimeout(ms),
    /** A pointer-free capture of the current state (posters, stills, crop sources). */
    async snap(snapName) {
      await setPointerVisible(false);
      const path = join(framesDir, `snap-${snapName}.png`);
      await capture(path);
      await setPointerVisible(true);
      snaps[snapName] = { path, frame: index };
      return path;
    },
    pointer: setPointerVisible,
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
    encode: (outBase, opts) => encode(framesDir, outBase, { fps, snaps, marks, ...opts }),
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

const frameFile = (framesDir, n) => join(framesDir, `f${String(n).padStart(5, '0')}.png`);

/**
 * PNG frames -> MP4 (H.264, BT.709 tagged, 3200x2000 master and a 1600x1000 `-s`) + lossless WebP posters.
 *  loopFade   seconds of dissolve from the last frame back into the first (0: the clip ends on its last frame)
 *  poster     snap name, frame number, or 'first' (default) for `<name>@2x.webp` / `<name>.webp`
 *  crops      [{ suffix: '-m', x, y, w, h, scale?: [w, h], poster? }] master-pixel crops, e.g. the 3:4 phone cut;
 *             with `segments: [{ from: 0 | markName, x, y, w, h }, …]` the crop switches where a view changes;
 *             with `trimFrom: markName` the cut starts at that mark and ends on the last frame
 *  stills     [{ name, snap | frame, crop?: { x, y, w, h } }] extra posters (full frame unless cropped)
 */
export function encode(framesDir, outBase, { fps = 30, loopFade = 0.7, poster = 'first', crops = [], stills = [], snaps = {}, marks = {}, crf = 24, crfSmall = 24, crfCrop = 23 } = {}) {
  let count = 0;
  while (existsSync(frameFile(framesDir, count))) count++;
  if (!count) throw new Error('No frames');
  const dur = count / fps;
  const run = (bin, args) => {
    const r = spawnSync(bin, args, { stdio: 'inherit' });
    if (r.status !== 0) throw new Error(`${bin} failed: ${args.join(' ')}`);
  };
  const ff = (args) => run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
  const seq = ['-framerate', String(fps), '-i', join(framesDir, 'f%05d.png')];
  const loop = loopFade > 0;
  const tail = loop ? ['-loop', '1', '-framerate', String(fps), '-t', String(loopFade), '-i', frameFile(framesDir, 0)] : [];
  const head = loop ? `[0:v][1:v]xfade=transition=fade:duration=${loopFade}:offset=${(dur - loopFade).toFixed(3)}` : '[0:v]null';
  // RGB frames -> BT.709 limited-range YUV, tagged, so browsers decode the colours as captured.
  const yuv = (scale = '') => `scale=${scale ? scale + ':' : ''}flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv`;
  const h264 = ['-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-tune', 'animation', '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-movflags', '+faststart', '-an'];
  const outputs = [];
  ff([...seq, ...tail, '-filter_complex', `${head},${yuv()}[v]`, '-map', '[v]', ...h264, '-crf', String(crf), `${outBase}.mp4`]);
  outputs.push(`${outBase}.mp4`);
  ff([...seq, ...tail, '-filter_complex', `${head},${yuv('1600:-2')}[v]`, '-map', '[v]', ...h264, '-crf', String(crfSmall), `${outBase}-s.mp4`]);
  outputs.push(`${outBase}-s.mp4`);

  const pick = (ref) => {
    if (ref === 'first' || ref == null) return frameFile(framesDir, 0);
    if (ref === 'last') return frameFile(framesDir, count - 1);
    if (typeof ref === 'number') return frameFile(framesDir, Math.min(ref, count - 1));
    if (snaps[ref]) return snaps[ref].path;
    throw new Error(`Unknown still source ${ref}`);
  };
  const webp = (png, out, { crop, scale } = {}) => {
    let src = png;
    if (crop || scale) {
      src = `${out}.tmp.png`;
      const vf = [crop && `crop=${crop.w}:${crop.h}:${crop.x}:${crop.y}`, scale && `scale=${scale}:flags=lanczos`].filter(Boolean).join(',');
      ff(['-i', png, '-vf', vf, src]);
    }
    run('cwebp', ['-quiet', '-lossless', '-z', '9', src, '-o', out]);
    if (src !== png) rmSync(src, { force: true });
    outputs.push(out);
  };
  const posterPng = pick(poster);
  webp(posterPng, `${outBase}@2x.webp`);
  webp(posterPng, `${outBase}.webp`, { scale: '1600:-1' });

  const at = (ref) => (typeof ref === 'number' ? ref : ref in marks ? marks[ref] : ref in snaps ? snaps[ref].frame : (() => { throw new Error(`Unknown mark ${ref}`); })());
  const cropChain = (c, scale) => `crop=${c.w}:${c.h}:${c.x}:${c.y}${scale ? `,scale=${scale[0]}:${scale[1]}:flags=lanczos` : ''}`;
  for (const c of crops) {
    const segs = (c.segments || [{ from: 0, x: c.x, y: c.y, w: c.w, h: c.h }]).map((g) => ({ ...g, from: at(g.from) })).sort((a, b) => a.from - b.from);
    let graph;
    if (c.trimFrom != null) {
      // A cut-down clip from a mark on (no dissolve back to frame 1, which shows another view).
      const start = at(c.trimFrom);
      graph = `[0:v]trim=start_frame=${start},setpts=PTS-STARTPTS,${cropChain(segs[0], c.scale)},${yuv()}[v]`;
      ff(['-framerate', String(fps), '-i', join(framesDir, 'f%05d.png'), '-filter_complex', graph, '-map', '[v]', ...h264, '-crf', String(c.crf ?? crfCrop), `${outBase}${c.suffix}.mp4`]);
      outputs.push(`${outBase}${c.suffix}.mp4`);
      webp(pick(c.poster ?? poster), `${outBase}${c.suffix}@2x.webp`, { crop: segs[0], scale: c.scale && `${c.scale[0]}:${c.scale[1]}` });
      continue;
    }
    if (segs.length === 1) graph = `${head},${cropChain(segs[0], c.scale)},${yuv()}[v]`;
    else {
      graph = `${head},split=${segs.length}${segs.map((_, i) => `[s${i}]`).join('')}`;
      segs.forEach((g, i) => {
        const end = i + 1 < segs.length ? `:end_frame=${segs[i + 1].from}` : '';
        graph += `;[s${i}]trim=start_frame=${g.from}${end},setpts=PTS-STARTPTS,${cropChain(g, c.scale)}[c${i}]`;
      });
      graph += `;${segs.map((_, i) => `[c${i}]`).join('')}concat=n=${segs.length}:v=1:a=0,${yuv()}[v]`;
    }
    ff([...seq, ...tail, '-filter_complex', graph, '-map', '[v]', ...h264, '-crf', String(c.crf ?? crfCrop), `${outBase}${c.suffix}.mp4`]);
    outputs.push(`${outBase}${c.suffix}.mp4`);
    const posterRef = c.poster ?? poster;
    const posterFrame = posterRef === 'first' || posterRef == null ? 0 : posterRef === 'last' ? count - 1 : at(posterRef);
    const seg = segs.filter((g) => g.from <= posterFrame).at(-1) || segs[0];
    webp(pick(posterRef), `${outBase}${c.suffix}@2x.webp`, { crop: seg, scale: c.scale && `${c.scale[0]}:${c.scale[1]}` });
  }
  for (const still of stills) {
    const png = pick(still.snap ?? still.frame);
    const base = join(dirname(outBase), still.name);
    webp(png, `${base}@2x.webp`, { crop: still.crop });
    if (still.small !== false && !still.crop) webp(png, `${base}.webp`, { scale: '1600:-1' });
  }
  return { frames: count, seconds: dur, outputs };
}
