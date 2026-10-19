// Screenshots of one homepage section for review: light + dark, desktop (1440) + phone (390),
// at several scroll positions for scroll-driven sections.
//   SITE_URL=http://127.0.0.1:4176 node scripts/demos/shot-section.mjs <sectionId> <outDir>
import { chromium } from '/Users/maximilianschwarz/Projekte/AIFOREU/ive-team/frontend/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
const [id, outDir = `review/shots/${process.argv[2]}`] = process.argv.slice(2);
if (!id) { console.error('usage: shot-section.mjs <sectionId> [outDir]'); process.exit(2); }
mkdirSync(outDir, { recursive: true });
const BASE = process.env.SITE_URL || 'http://127.0.0.1:4176';
const browser = await chromium.launch();
const report = { errors: [], shots: [] };
try {
  for (const theme of ['light', 'dark']) {
    for (const [device, width, height, dsf] of [['desktop', 1440, 900, 2], ['phone', 390, 844, 3]]) {
      const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dsf, isMobile: device === 'phone', hasTouch: device === 'phone' });
      await ctx.addInitScript((t) => { try { localStorage.setItem('ive-theme', t); } catch {} }, theme);
      const page = await ctx.newPage();
      page.on('pageerror', (e) => report.errors.push(`${theme}/${device}: ${e.message}`));
      page.on('console', (m) => { if (m.type() === 'error') report.errors.push(`${theme}/${device} console: ${m.text()}`); });
      await page.goto(BASE + '/', { waitUntil: 'load' });
      await page.waitForTimeout(600);
      const box = await page.evaluate((i) => { const el = document.getElementById(i); if (!el) return null; const r = el.getBoundingClientRect(); return { top: r.top + window.scrollY, height: r.height }; }, id);
      if (!box) { report.errors.push(`no #${id}`); await ctx.close(); continue; }
      const steps = box.height > height * 1.6 ? [0, 0.35, 0.7, 0.95] : [0];
      for (const f of steps) {
        const y = Math.max(0, Math.round(box.top + (box.height - height) * f));
        await page.evaluate((v) => window.scrollTo(0, v), y);
        await page.waitForTimeout(f === 0 ? 1600 : 900);
        const file = join(outDir, `${theme}-${device}-${Math.round(f * 100)}.png`);
        await page.screenshot({ path: file });
        report.shots.push(file);
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (overflow) report.errors.push(`${theme}/${device}: horizontal overflow`);
      await ctx.close();
    }
  }
} finally { await browser.close(); }
console.log(JSON.stringify(report, null, 1));
