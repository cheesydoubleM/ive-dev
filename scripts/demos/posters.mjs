#!/usr/bin/env node
// Poster images of the generated demos (assets/demo/posters): each scene rendered headlessly at
// its poster time, as the page shows it before the frame is ready and without JavaScript.
//   node scripts/demos/posters.mjs                  all posters
//   node scripts/demos/posters.mjs terminal board   a selection
// Needs the preview server (DEMO_BASE, default http://127.0.0.1:4180/) serving the worktree, and cwebp.
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '/Users/maximilianschwarz/Projekte/AIFOREU/ive-team/frontend/node_modules/playwright/index.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '../../assets/demo/posters');
const BASE = process.env.DEMO_BASE || 'http://127.0.0.1:4180/';
// name → scene, theme, CSS size (the @2x file is twice that), extra query, phone variant wanted
const POSTERS = {
  'board-hero': { scene: 'board', theme: 'dark', width: 1600, height: 554, params: 'variant=hero', phone: true },
  board: { scene: 'board', theme: 'dark', width: 1600, height: 1000 },
  attention: { scene: 'attention', theme: 'dark', width: 1280, height: 880 },
  'review-dark': { scene: 'review', theme: 'dark', width: 1280, height: 880 },
  terminal: { scene: 'terminal', theme: 'light', width: 1600, height: 1000, phone: true },
  terminals: { scene: 'terminals', theme: 'light', width: 1600, height: 1000, phone: true },
  start: { scene: 'start', theme: 'light', width: 1600, height: 1000, phone: true },
  autofix: { scene: 'autofix', theme: 'light', width: 1600, height: 1000, phone: true },
  pipelines: { scene: 'pipelines', theme: 'light', width: 1600, height: 1000, phone: true },
  loopdetect: { scene: 'loopdetect', theme: 'light', width: 1600, height: 1000, phone: true },
  review: { scene: 'review', theme: 'light', width: 1600, height: 1000, phone: true },
};
const PHONE = { width: 390, height: 520 };
const names = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const wanted = names.length ? Object.keys(POSTERS).filter((k) => names.includes(k) || names.includes(POSTERS[k].scene)) : Object.keys(POSTERS);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
async function shoot(url, width, height, pngPath) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url);
  await page.waitForFunction(() => window.IVE_DEMO && window.IVE_DEMO.ready, null, { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  await page.screenshot({ path: pngPath });
  await context.close();
  return errors;
}
const webp = (png, out, scale) => {
  const args = ['-quiet', '-q', '92', '-m', '6', '-sharp_yuv', ...(scale ? ['-resize', String(scale), '0'] : []), png, '-o', out];
  const r = spawnSync('cwebp', args, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('cwebp failed for ' + out);
};
try {
  for (const name of wanted) {
    const p = POSTERS[name];
    const url = `${BASE}assets/demo/frame.html?scene=${p.scene}&theme=${p.theme}${p.params ? '&' + p.params : ''}`;
    const png = join(OUT, `${name}.tmp.png`);
    const errors = await shoot(url, p.width, p.height, png);
    webp(png, join(OUT, `${name}@2x.webp`));
    webp(png, join(OUT, `${name}.webp`), p.width);
    rmSync(png, { force: true });
    let phoneNote = '';
    if (p.phone) {
      const pngM = join(OUT, `${name}-m.tmp.png`);
      await shoot(url, PHONE.width, PHONE.height, pngM);
      webp(pngM, join(OUT, `${name}-m.webp`));
      rmSync(pngM, { force: true });
      phoneNote = ` + ${name}-m.webp (${PHONE.width * 2}×${PHONE.height * 2})`;
    }
    console.log(`[${name}] ${p.width * 2}×${p.height * 2} → ${name}@2x.webp, ${name}.webp${phoneNote}${errors.length ? ' ERRORS ' + JSON.stringify(errors.slice(0, 3)) : ''}`);
  }
} finally { await browser.close(); }
