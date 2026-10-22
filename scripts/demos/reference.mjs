// Reference stills of the real app for restyling the site's illustrations:
// light + dark theme, board / session / home / permission card, plus crops of
// the components (sidebar, tile header, step line, composer, permission card).
//   node scripts/demos/reference.mjs [outDir]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createTourFixture } from '/Users/maximilianschwarz/Projekte/AIFOREU/ive-oss/frontend/tests/interactive-onboarding-fixture.mjs';
import { launch, DIST, VIEWPORT, workspace, demoSessions, transcripts, permissionAttention, PERMISSION_SCREEN } from './lib/fixture.mjs';

const OUT = process.argv[2] || join(process.cwd(), 'review/real-ui-reference');
mkdirSync(OUT, { recursive: true });
const { browser, wrapped } = await launch();
const ff = (args) => spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
try {
  for (const theme of ['light', 'dark']) {
    const sessions = demoSessions();
    const state = { interface: 'running', api: 'running', checks: 'waiting', review: 'idle' };
    for (const s of sessions) { s.status = state[s.id]; s.agentState = s.status === 'running' ? 'working' : s.status === 'waiting' ? 'prompting' : 'idle'; }
    sessions.find((s) => s.id === 'checks').attention = permissionAttention();
    const f = await createTourFixture(wrapped, { dist: DIST, viewport: VIEWPORT, theme, settings: { product_tour_version: '2', language: 'en' }, storage: { 'ive.onboarding.v2.owner': 'done' }, workspaces: [{ ...workspace, human_oversight: 'full_auto' }], sessions, messages: transcripts });
    await f.context.route('**/api/sessions/*/output**', (route) => {
      const sid = new URL(route.request().url()).pathname.split('/')[3];
      const screen = sid === 'checks' ? PERMISSION_SCREEN : '❯ ';
      route.fulfill({ json: { text: screen, output: screen, screen, startup_blocker: null, pty_alive: true, permission_view_state: null } });
    });
    const p = f.page;
    await p.locator('#ive-project-sidebar, .x-app-shell').first().waitFor();
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(1500);
    await f.context.clock.pauseAt(Date.now() + 2000);
    const shot = async (name) => { await p.waitForTimeout(400); await p.screenshot({ path: join(OUT, `${theme}-${name}.png`), caret: 'hide', animations: 'disabled' }); };
    await shot('home');
    await p.getByTitle('Open Build the workspace', { exact: true }).click();
    await p.getByText(/Activity · \d+ step/).first().waitFor();
    for (let i = 0; i < 20; i++) await f.context.clock.runFor(100);
    await shot('session');
    await p.getByText('Check the sign-in flow', { exact: true }).first().click();
    for (let i = 0; i < 40; i++) await f.context.clock.runFor(100);
    await p.getByRole('button', { name: 'Allow once' }).waitFor();
    await shot('permission');
    for (const name of ['Connect the API', 'Review the changes']) await p.getByText(name, { exact: true }).first().click();
    await p.getByRole('button', { name: /^Board/ }).click();
    await p.locator('[data-board-screen]').waitFor();
    f.controls.setSessionStatus('interface', 'running');
    f.controls.setSessionStatus('api', 'running');
    f.controls.setSessionStatus('checks', 'waiting', { attention: permissionAttention() });
    for (let i = 0; i < 40; i++) await f.context.clock.runFor(100);
    await p.getByRole('button', { name: 'Allow once' }).waitFor();
    await shot('board');
    await p.keyboard.press('Meta+k');
    for (let i = 0; i < 8; i++) await f.context.clock.runFor(100);
    await shot('palette');
    await p.keyboard.press('Escape');
    await f.context.close();
    // component crops (2x pixels)
    const crop = (src, w, h, x, y, name) => ff(['-i', join(OUT, `${theme}-${src}.png`), '-vf', `crop=${w}:${h}:${x}:${y}`, join(OUT, `${theme}-crop-${name}.png`)]);
    crop('board', 600, 2000, 0, 0, 'sidebar');
    crop('board', 1700, 520, 620, 100, 'tile-header');
    crop('board', 1700, 760, 620, 1300, 'permission-card');
    crop('board', 3200, 110, 0, 0, 'topbar');
    crop('session', 1600, 760, 850, 560, 'chat-steps');
    crop('session', 2100, 140, 800, 1820, 'composer');
    crop('home', 1500, 560, 1100, 180, 'home-composer');
    crop('home', 1500, 520, 1100, 600, 'home-list');
  }
} finally { await browser.close(); }
console.log('reference stills in', OUT);
