#!/usr/bin/env node
// Reference dumps of the real IVE frontend for the generated demos (assets/demo): runs a clip's
// story through the same test transport as record.mjs, but instead of filming it writes the
// page's DOM (outerHTML) and a 2x screenshot at every snap, mark and hold. The generated scenes
// copy their markup from these dumps so they match the app's own DOM and stylesheet.
//   node scripts/demos/snapshot.mjs --light terminal terminals start-queue loop-task loop-canvas loop-detect review
//   node scripts/demos/snapshot.mjs hero-board          (dark theme, as the hero shows it)
//   DEMO_REF=/path/for/dumps
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, checkDist, setDefaultTheme } from './lib/fixture.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const REF = process.env.DEMO_REF || join(process.env.TMPDIR || '/tmp', 'ive-demo-ref');
const args = process.argv.slice(2);
const light = args.includes('--light');
const phone = args.includes('--phone');
const names = args.filter((a) => !a.startsWith('--'));
if (!names.length) { console.error('usage: snapshot.mjs [--light] [--phone] <clip> [clip…]'); process.exit(2); }
setDefaultTheme(light ? 'light' : 'dark');
console.log('frontend', JSON.stringify(await checkDist()), light ? 'light' : 'dark');

/** A recorder stand-in: the clip's holds advance the fake clock, snaps and marks dump the DOM. */
async function createDumper(page, context, { dir, fps = 30 } = {}) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const frameMs = 1000 / fps;
  const cdp = await context.newCDPSession(page);
  const { width: vw, height: vh } = page.viewportSize();
  const dpr = await page.evaluate(() => window.devicePixelRatio);
  let index = 0, seq = 0, recording = false, lastDump = '';
  const log = [];
  let mouse = { x: vw - 100, y: vh - 200 };

  async function dump(label) {
    const html = await page.evaluate(() => {
      const root = document.documentElement.cloneNode(true);
      for (const c of root.querySelectorAll('canvas')) c.replaceWith(document.createComment(' canvas '));
      for (const s of root.querySelectorAll('script')) s.remove();
      return '<!DOCTYPE html>\n' + root.outerHTML;
    });
    const name = `${String(++seq).padStart(2, '0')}-${label}`;
    const same = html === lastDump;
    lastDump = html;
    if (!same) writeFileSync(join(dir, `${name}.html`), html);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, clip: { x: 0, y: 0, width: vw, height: vh, scale: dpr } });
    writeFileSync(join(dir, `${name}.png`), Buffer.from(data, 'base64'));
    log.push({ name, frame: index, seconds: +(index / fps).toFixed(2), sameDom: same });
    return name;
  }
  async function frame(n = 1) {
    for (let i = 0; i < n; i++) {
      if (recording) { await context.clock.runFor(frameMs); index++; } else await page.waitForTimeout(frameMs);
    }
  }
  const seconds = (s) => Math.round(s * fps);
  const resolvePoint = async (target, offset) => {
    if (Array.isArray(target)) return { x: target[0], y: target[1] };
    const box = await target.boundingBox();
    if (!box) throw new Error('Target has no bounding box');
    const o = offset || { x: 0.5, y: 0.5 };
    return { x: box.x + box.width * o.x, y: box.y + box.height * o.y };
  };
  const api = {
    fps, frameMs, snaps: {}, marks: {}, log,
    get frameCount() { return index; },
    async start() { await page.evaluate(() => document.fonts.ready); await context.clock.pauseAt(Date.now() + 2000); recording = true; await dump('start'); },
    async stop() { recording = false; await dump('end'); writeFileSync(join(dir, 'log.json'), JSON.stringify(log, null, 1)); await context.clock.resume().catch(() => {}); },
    mark(m) { api.marks[m] = index; dump(`mark-${m}`); return index; },
    frame,
    async hold(s) { await frame(seconds(s)); await dump(`hold-${s}s`); },
    async until(check, { maxSeconds = 6, label = 'condition' } = {}) {
      for (let i = 0; i < seconds(maxSeconds); i++) { if (await check()) return i; await frame(); }
      if (await check()) return seconds(maxSeconds);
      throw new Error(`until: ${label} not reached within ${maxSeconds}s`);
    },
    untilVisible(locator, opts = {}) { return api.until(() => locator.first().isVisible().catch(() => false), { label: String(locator), ...opts }); },
    settle: (ms = 60) => page.waitForTimeout(ms),
    async snap(name) { api.snaps[name] = { frame: index }; await dump(`snap-${name}`); },
    pointer() {},
    async moveTo(target, { duration = 0.5, offset } = {}) { mouse = await resolvePoint(target, offset); await page.mouse.move(mouse.x, mouse.y); await frame(Math.max(1, seconds(duration))); },
    async click(target, { duration = 0.5, offset, after = 0.25 } = {}) {
      if (target) await api.moveTo(target, { duration, offset });
      await page.mouse.down(); await frame(2); await page.mouse.up(); api.clickFrame = index; await frame(2); await api.settle(); await frame(seconds(after));
      await dump('click');
    },
    async type(text, { cps = 20 } = {}) { for (const ch of text) { await page.keyboard.type(ch); await frame(Math.max(1, Math.round(fps / cps))); } await dump('typed'); },
    async press(key, after = 0.1) { await page.keyboard.press(key); await api.settle(); await frame(seconds(after)); await dump(`press-${key}`); },
    async scrollBy(target, dy, { duration = 0.8 } = {}) { const pt = await resolvePoint(target); await page.mouse.move(pt.x, pt.y); await page.mouse.wheel(0, dy); await frame(Math.max(1, seconds(duration))); await dump('scrolled'); },
    encode() { return { outputs: [] }; },
  };
  return api;
}

const { browser, wrapped } = await launch();
try {
  for (const name of names) {
    const clip = await import(`./clips/${name}.mjs`);
    const dir = join(REF, `${name}${light ? '-light' : ''}${phone ? '-phone' : ''}`);
    let dumper;
    try {
      const { fixture } = await clip.record(wrapped, async (page, context) => { dumper = await createDumper(page, context, { dir }); return dumper; }, { phone, light });
      console.log(`[${name}] ${dumper.log.length} dumps → ${dir}; errors=${JSON.stringify(fixture.errors)}`);
      await fixture.context.close();
    } catch (error) {
      console.error(`[${name}] FAILED: ${error?.message?.split('\n').slice(0, 4).join(' | ')}`);
      process.exitCode = 1;
    }
  }
} finally { await browser.close(); }
