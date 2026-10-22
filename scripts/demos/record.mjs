#!/usr/bin/env node
// Records the site's app demos from the real IVE frontend (1.0.17 build, isolated test transport).
//   node scripts/demos/record.mjs hero-board start-queue loop-task loop-canvas loop-detect review
//   node scripts/demos/record.mjs --phone hero-board start-queue loop-task loop-canvas loop-detect review
//   DEMO_OUT=/path/for/output DEMO_FRAMES=/path/for/frames
// --phone records the same story a second time in a short, narrow window (PHONE_VIEWPORT in
// lib/fixture.mjs) and writes only the 3:4 phone cut `<name>-m.mp4` and its poster `<name>-m@2x.webp`.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, checkDist, labelPatchLog } from './lib/fixture.mjs';
import { createRecorder, encode } from './lib/recorder.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = process.env.DEMO_OUT || join(here, '../../assets/app');
const FRAMES = process.env.DEMO_FRAMES || join(process.env.TMPDIR || '/tmp', 'ive-demo-frames');
const args = process.argv.slice(2);
// --encode-only: re-encode the frames of an earlier capture (crops, CRF) without recording again.
const encodeOnly = args.includes('--encode-only');
const phone = args.includes('--phone');
const names = args.filter((a) => !a.startsWith('--'));
if (!names.length) { console.error('usage: record.mjs [--phone] [--encode-only] <clip> [clip…]'); process.exit(2); }
const framesFor = (name) => join(FRAMES, phone ? `${name}-phone` : name);
// Desktop: the clip's own settings plus what the recording measured. Phone: only the crops the
// phone recording returns (and the clip's loop dissolve, CRF 25); the desktop files stay untouched.
const settingsFor = (clip, measured = {}) => (phone
  ? { loopFade: clip.encoding?.loopFade ?? 0, crfCrop: 25, ...measured, main: false }
  : { ...(clip.encoding || {}), ...measured });
mkdirSync(OUT, { recursive: true });
console.log('frontend', JSON.stringify(await checkDist()));

if (encodeOnly) {
  for (const name of names) {
    const clip = await import(`./clips/${name}.mjs`);
    const framesDir = framesFor(name);
    const meta = JSON.parse(readFileSync(join(framesDir, 'meta.json'), 'utf8'));
    const dyn = existsSync(join(framesDir, 'encoding.json')) ? JSON.parse(readFileSync(join(framesDir, 'encoding.json'), 'utf8')) : {};
    const result = encode(framesDir, join(OUT, name), { fps: meta.fps, snaps: meta.snaps, marks: meta.marks, ...settingsFor(clip, dyn) });
    console.log(`[${name}] re-encoded ${result.seconds.toFixed(1)}s → ${result.outputs.map((o) => o.split('/').pop()).join(' ')}`);
  }
  process.exit(0);
}

const { browser, wrapped } = await launch();
try {
  let failed = 0;
  for (const name of names) {
    const clip = await import(`./clips/${name}.mjs`);
    const framesDir = framesFor(name);
    const t0 = Date.now();
    let recorder, fixture, encoding, lastPage;
    try {
      ({ fixture, encoding } = await clip.record(wrapped, async (page, context, opts = {}) => {
        lastPage = page;
        recorder = await createRecorder(page, context, { fps: 30, framesDir, name, ...opts });
        return recorder;
      }, { phone }));
      const captured = ((Date.now() - t0) / 1000).toFixed(0);
      console.log(`[${name}] ${recorder.frameCount} frames captured in ${captured}s; errors=${JSON.stringify(fixture.errors)} unexpected writes=${fixture.unexpected.filter((u) => u.method && u.method !== 'GET').map((u) => `${u.method} ${u.path}`).join(',') || 'none'}`);
      if (labelPatchLog.length) console.log(`[${name}] guided-task label patch: ${JSON.stringify(labelPatchLog.splice(0))}`);
      await fixture.context.close();
      if (encoding) writeFileSync(join(framesDir, 'encoding.json'), JSON.stringify(encoding, null, 1));
      const result = recorder.encode(join(OUT, name), settingsFor(clip, encoding || {}));
      console.log(`[${name}] encoded ${result.seconds.toFixed(1)}s → ${result.outputs.map((o) => o.split('/').pop()).join(' ')}`);
    } catch (error) {
      failed++;
      console.error(`[${name}] FAILED after ${recorder?.frameCount ?? 0} frames: ${error?.message?.split('\n').slice(0, 6).join(' | ')}`);
      const page = fixture?.page || lastPage;
      if (page) { try { await page.screenshot({ path: join(FRAMES, `${name}${phone ? '-phone' : ''}-failure.png`) }); } catch { /* ignore */ } }
      try { await (fixture?.context || page?.context())?.close(); } catch { /* ignore */ }
    }
  }
  if (failed) process.exitCode = 1;
} finally { await browser.close(); }
