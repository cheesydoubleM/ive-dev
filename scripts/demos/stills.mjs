#!/usr/bin/env node
// Dark stills of the real IVE 1.0.17 frontend for the Product page row "Models, modes and keys":
// the model menu, the agent mode menu and the ⌘K palette of one Orbit session, each cropped at
// 1:1 device pixels (2x) around the open menu and its chip.
//   node scripts/demos/stills.mjs            → assets/app/still-{model,mode,palette}@2x.webp
// Provenance: IVE app 1.0.17 · demo project · no provider ran.
import { mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { launch, openDemo, checkDist } from './lib/fixture.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = process.env.DEMO_OUT || join(here, '../../assets/app');
mkdirSync(OUT, { recursive: true });
console.log('frontend', JSON.stringify(await checkDist()));

// The floating layer around a piece of text: the nearest positioned ancestor (menu, popover, dialog).
async function layerBox(page, locator) {
  return locator.first().evaluate((el) => {
    let n = el;
    while (n && n !== document.body) {
      const cs = getComputedStyle(n);
      if ((cs.position === 'fixed' || cs.position === 'absolute') && n.getBoundingClientRect().width > 120) break;
      n = n.parentElement;
    }
    const r = (n || el).getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
}
const union = (a, b) => { const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y); return { x, y, width: Math.max(a.x + a.width, b.x + b.width) - x, height: Math.max(a.y + a.height, b.y + b.height) - y }; };
const pad = (b, p, vw, vh) => { const x = Math.max(0, b.x - p), y = Math.max(0, b.y - p); return { x, y, width: Math.min(vw - x, b.width + 2 * p), height: Math.min(vh - y, b.height + 2 * p) }; };

async function still(page, name, clip) {
  const png = join(OUT, `${name}.tmp.png`);
  await page.screenshot({ path: png, clip, caret: 'hide', animations: 'disabled' });
  const r = spawnSync('cwebp', ['-quiet', '-lossless', '-z', '9', png, '-o', join(OUT, `${name}@2x.webp`)], { stdio: 'inherit' });
  rmSync(png, { force: true });
  if (r.status !== 0) throw new Error('cwebp failed');
  console.log(`${name}@2x.webp ← css ${Math.round(clip.x)},${Math.round(clip.y)} ${Math.round(clip.width)}x${Math.round(clip.height)} (2x pixels)`);
}

const { browser, wrapped } = await launch();
try {
  const f = await openDemo(wrapped);
  const p = f.page;
  const { width: vw, height: vh } = p.viewportSize();
  await p.getByTitle('Open Build the workspace', { exact: true }).click();
  await p.getByText(/Activity · \d+ step/).first().waitFor();
  const tick = async (ms = 600) => { for (let t = 0; t < ms; t += 100) { await f.context.clock.runFor(100); await p.waitForTimeout(20); } };
  await tick(1200);

  const modelChip = p.locator('button', { hasText: /^Model:/ }).first();
  await modelChip.click();
  await tick();
  const opus = p.getByText(/^Opus · opus/);
  await opus.first().waitFor();
  await still(p, 'still-model', pad(union(await modelChip.boundingBox(), await layerBox(p, opus)), 16, vw, vh));
  await p.keyboard.press('Escape');
  await tick();

  const modeChip = p.locator('button', { hasText: /^Agent mode:/ }).first();
  await modeChip.click();
  await tick();
  const plan = p.getByText('Plan', { exact: true });
  await plan.first().waitFor();
  await still(p, 'still-mode', pad(union(await modeChip.boundingBox(), await layerBox(p, plan)), 16, vw, vh));
  await p.keyboard.press('Escape');
  await tick();

  await p.keyboard.press('Meta+k');
  await tick(800);
  const input = p.locator('input:focus');
  await input.first().waitFor();
  // The palette panel: the first ancestor of the search field that is panel-sized (not the backdrop).
  const panel = await input.first().evaluate((el) => {
    let n = el;
    while (n && n !== document.body) { const r = n.getBoundingClientRect(); if (r.width >= 480 && r.width <= 900 && r.height >= 300) return { x: r.x, y: r.y, width: r.width, height: r.height }; n = n.parentElement; }
    return null;
  });
  if (!panel) throw new Error('palette panel not found');
  await still(p, 'still-palette', pad(panel, 16, vw, vh));
  await p.keyboard.press('Escape');
  console.log('errors', JSON.stringify(f.errors));
  await f.context.close();
} finally { await browser.close(); }
