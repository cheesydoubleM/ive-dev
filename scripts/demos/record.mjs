#!/usr/bin/env node
// Records the site's app demos from the real IVE frontend.
//   node scripts/demos/record.mjs session board home review setup
//   DEMO_OUT=/path/for/output DEMO_FRAMES=/path/for/frames
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './lib/fixture.mjs';
import { createRecorder } from './lib/recorder.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = process.env.DEMO_OUT || join(here, '../../assets/app');
const FRAMES = process.env.DEMO_FRAMES || join(process.env.TMPDIR || '/tmp', 'ive-demo-frames');
const names = process.argv.slice(2);
if (!names.length) { console.error('usage: record.mjs <clip> [clip…]'); process.exit(2); }
mkdirSync(OUT, { recursive: true });

const { browser, wrapped } = await launch();
try {
  let failed = 0;
  for (const name of names) {
    const clip = await import(`./clips/${name}.mjs`);
    const framesDir = join(FRAMES, name);
    const t0 = Date.now();
    let recorder, fixture;
    try {
      ({ fixture } = await clip.record(wrapped, async (page, context) => {
        recorder = await createRecorder(page, context, { fps: 30, framesDir, name });
        return recorder;
      }));
      const captured = ((Date.now() - t0) / 1000).toFixed(0);
      console.log(`[${name}] ${recorder.frameCount} frames captured in ${captured}s; errors=${JSON.stringify(fixture.errors)} unexpected=${fixture.unexpected.map((u) => u.path).join(',') || 'none'}`);
      await fixture.context.close();
      const result = recorder.encode(join(OUT, name), { stills: clip.stills || [] });
      console.log(`[${name}] encoded ${result.seconds.toFixed(1)}s → ${join(OUT, name)}.{mp4,-s.mp4,@2x.webp,webp}`);
    } catch (error) {
      failed++;
      console.error(`[${name}] FAILED after ${recorder?.frameCount ?? 0} frames: ${error?.message?.split('\n').slice(0, 6).join(' | ')}`);
      if (fixture?.page) { try { await fixture.page.screenshot({ path: join(FRAMES, `${name}-failure.png`) }); } catch { /* ignore */ } }
      try { await fixture?.context.close(); } catch { /* ignore */ }
    }
  }
  if (failed) process.exitCode = 1;
} finally { await browser.close(); }
