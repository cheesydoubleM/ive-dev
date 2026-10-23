// Clip: ten terminals, one board. The Board of Orbit at 2080x1300 with the sidebar, ten sessions
// open as tiles in the app's Terminal view (5 columns, `cc-terminalBoardMode`), every tile a real
// xterm terminal with a CLI-style transcript streaming in; the status words change (Running →
// Done), one tile waits for a permission that is answered in its terminal (click, Enter), and
// at the end one tile is opened ("Open") to its full-size terminal at Session level.
// Recorded light at 60 fps (`record.mjs --light terminals` → `terminals-light*`).
//
// Provenance: IVE app 1.0.17 · demo project · no provider ran. Every terminal's text is scripted
// demo output in the style of the CLIs, fed through the transport's PTY channel (lib/tui.mjs);
// the click into a tile and the Enter are real input into the app's xterm terminal. Ten is the
// configuration shown here, not a limit of the app.
import { openDemo, session, msg, permissionAttention, PERMISSION_SCREEN } from '../lib/fixture.mjs';
import { createCamera } from '../lib/camera.mjs';
import { createScreen, step, say, prompt, cstep, csay, cprompt, spinner, permissionDialog, waitForInput, inputMark, out, CLEAR } from '../lib/tui.mjs';

export const meta = { id: 'terminals', title: 'Ten terminals, one board', seconds: 14 };
export const encoding = { loopFade: 0, poster: 'poster' };

// 5 columns of 362 CSS px: tiles at least 360 px wide keep the app's 9 px preview font floor.
const WINDOW = { width: 2080, height: 1300 };
// The phone cut: the board as a wide 3:4 view of the full window height (both rows, the sidebar
// list; scaled to 996x1328, so it establishes ten rather than reads), hard cuts between the left
// and the right half, then the opened terminal 1:1 at the site's cut size, readable.
const PHONE_CUT = { w: 1950, h: 2600 };
const CLOSE_CUT = { w: 996, h: 1328 };

// Tile order (openTabs order): row 1, then row 2.
const SESSIONS = [
  { id: 'interface', name: 'Build the workspace', cli: 'claude', model: 'sonnet', status: 'running', style: 'claude',
    prompt: 'Add a dark theme toggle to the sidebar. Keep the existing keyboard shortcuts working.',
    files: ['src/components/layout/Sidebar.jsx', 'src/hooks/useTheme.js', 'src/lib/keymap.js', 'src/components/settings/GeneralSettingsPanel.jsx'], pattern: 'useTheme',
    follow: 'Also add ⌘⇧T as the shortcut and mention it in the README.',
    mid: 'One test still fails: the footer snapshot has the old markup.', note: 'All 12 tests pass. Adding the shortcut next.' },
  { id: 'checks', name: 'Check the sign-in flow', cli: 'claude', model: 'sonnet', status: 'waiting', style: 'claude',
    prompt: 'Run the sign-in checks: empty state, expired session, and the return to the workspace.',
    files: ['tests/sign-in.spec.js', 'src/app/routes.js', 'src/app/session.js', 'tests/helpers/sign-in.js'], pattern: 'expired',
    follow: 'Check the redirect after an expired session as well.',
    mid: 'One check still fails: the expired-session case expects a redirect to the workspace.', note: 'All three checks pass. Reading the redirect code next.' },
  { id: 'api', name: 'Connect the API', cli: 'codex', model: 'default', status: 'running', style: 'codex',
    prompt: 'Connect the sessions list to the new /api/sessions endpoint and keep the event stream in sync.',
    files: ['src/lib/api.js', 'src/hooks/useWebSocket.js', 'src/state/sessions.js', 'src/lib/cursor.js'], pattern: 'listSessions',
    follow: 'Keep the page after a reconnect.',
    mid: 'The list and the stream disagree on the session shape; the stream sends the full row.', note: 'Both sides use one shape now. Looking at the reconnect path.' },
  { id: 'docs', name: 'Update the docs', cli: 'claude', model: 'haiku', status: 'running', style: 'claude',
    prompt: 'Update the docs for the theme toggle and the new shortcut.',
    files: ['README.md', 'docs/shortcuts.md', 'docs/settings.md', 'CHANGELOG.md'], pattern: 'shortcut',
    follow: 'Add the toggle to the settings page too.',
    mid: 'The shortcut table in docs/shortcuts.md is out of date; two entries point at old keys.', note: 'Docs updated. Linking the settings page next.' },
  { id: 'migration', name: 'Write the migration', cli: 'claude', model: 'sonnet', status: 'running', style: 'claude',
    prompt: 'Write the migration that adds a cursor column to the sessions table.',
    files: ['db/schema.sql', 'db/migrations/0007_tags.sql', 'db/migrations/0008_sessions_cursor.sql', 'src/lib/db.js'], pattern: 'sessions',
    follow: 'Backfill the cursor from created_at.',
    mid: 'The dry run reports a missing default for sessions.cursor on existing rows.', note: 'The migration applies cleanly in the dry run. Writing the backfill.' },
  { id: 'flaky', name: 'Fix the flaky test', cli: 'codex', model: 'default', status: 'running', style: 'codex',
    prompt: 'Fix the flaky test in tests/sign-in.spec.js. It fails about one run in ten.',
    files: ['tests/sign-in.spec.js', 'src/app/routes.js', 'tests/helpers/wait.js', 'playwright.config.js'], pattern: 'waitFor',
    follow: 'Run it twenty times to be sure.',
    mid: 'The test waits a fixed 500 ms; the redirect sometimes takes longer than that.', note: 'The test now waits for the route itself. Running it in a loop.' },
  { id: 'audit', name: 'Add the audit log', cli: 'claude', model: 'sonnet', status: 'running', style: 'claude',
    prompt: 'Add an audit log entry for every session start and stop.',
    files: ['src/lib/audit.js', 'src/state/sessions.js', 'db/migrations/0009_audit.sql', 'tests/audit.spec.js'], pattern: 'audit',
    follow: 'Include the model name in each entry.',
    mid: 'Session stops are logged twice when a process exits on its own.', note: 'Start and stop write one entry each. Adding the model name.' },
  { id: 'review', name: 'Review the changes', cli: 'claude', model: 'opus', status: 'idle', style: 'claude',
    prompt: 'Review the changed files and call out anything that needs another look.',
    files: ['src/components/layout/Sidebar.jsx', 'src/lib/api.js', 'src/hooks/useWebSocket.js', 'tests/sign-in.spec.js'], pattern: 'TODO',
    follow: 'Look at the reconnect path once more.',
    mid: 'api.js pages with a cursor, but a reconnect still resets the list to page one.', note: 'Sidebar.jsx is fine. Reading the reconnect handler again.' },
  { id: 'client', name: 'Type the API client', cli: 'codex', model: 'default', status: 'running', style: 'codex',
    prompt: 'Add TypeScript types for the API client and check them.',
    files: ['src/lib/api.js', 'src/lib/api.d.ts', 'src/lib/types.d.ts', 'tsconfig.json'], pattern: 'export async',
    follow: 'Type the WebSocket events as well.',
    mid: 'tsc reports 6 errors: listSessions returns an untyped cursor.', note: 'tsc is clean for the request functions. Typing the events next.' },
  { id: 'imports', name: 'Clean up the imports', cli: 'codex', model: 'default', status: 'idle', style: 'codex',
    prompt: 'Remove unused imports across src and keep the import order consistent.',
    files: ['src/components/chat/Composer.jsx', 'src/components/home/HomeScreen.jsx', 'src/lib/api.js', 'eslint.config.js'], pattern: 'import',
    follow: 'Run the linter once more at the end.',
    mid: '14 files import from the old lib/http path; the linter flags 31 unused names.', note: 'Imports are clean and ordered. One more lint run at the end.' },
];
const WIDTH = 58;

// A session's transcript as a list of steps (each a list of lines). Enough steps to fill a
// tall screen; the clip takes a backlog from the front and streams the rest while it records.
function transcript(s) {
  const [f1, f2, f3, f4] = s.files;
  const i = SESSIONS.indexOf(s);
  const n = (base, stepSize) => base + ((i * 7) % 5) * stepSize; // counts differ per session
  const c = s.style === 'codex';
  const S = c ? (tool, input, result) => cstep(`${tool} ${input}`, result) : step;
  const P = c ? cprompt : prompt;
  const T = c ? csay : say;
  const out = [
    P(s.prompt, WIDTH),
    S('Read', f1, `Read ${n(184, 31)} lines`),
    S('Search', c ? `"${s.pattern}" in src` : `pattern: "${s.pattern}", path: "src"`, `Found ${n(2, 1)} files`),
    S('Read', f2, `Read ${n(96, 13)} lines`),
    S('Update', f1, `Added ${n(18, 3)} lines, removed ${n(2, 1)} lines`),
    S('Bash', 'npm run lint', '0 problems'),
    S('Read', f3, `Read ${n(58, 9)} lines`),
    S('Update', f2, `Added ${n(6, 2)} lines, removed ${n(3, 1)} lines`),
    S('Bash', 'npm test', `${n(11, 1)} passed, 1 failed (${(3.4 + i * 0.3).toFixed(1)} s)`),
    T(s.mid, WIDTH),
    S('Read', f4, `Read ${n(140, 17)} lines`),
    S('Update', f3, `Added ${n(4, 1)} lines, removed 1 line`),
    S('Bash', 'npm test', `${n(12, 1)} passed, 0 failed (${(3.1 + i * 0.2).toFixed(1)} s)`),
    T(s.note, WIDTH),
    P(s.follow, WIDTH),
    S('Read', f4, `Read ${n(140, 17)} lines`),
    S('Search', c ? `"${s.pattern}" in src` : `pattern: "${s.pattern}", path: "src"`, `Found ${n(3, 1)} files`),
    S('Update', f4, `Added ${n(9, 2)} lines, removed ${n(2, 1)} lines`),
    S('Update', f1, `Added ${n(2, 1)} lines`),
    S('Bash', 'npm run lint', '0 problems'),
    S('Read', f2, `Read ${n(102, 11)} lines`),
    S('Update', f2, `Added ${n(3, 1)} lines, removed 1 line`),
    S('Bash', 'npm test', `${n(12, 1)} passed, 0 failed (${(3.2 + i * 0.2).toFixed(1)} s)`),
    S('Read', f3, `Read ${n(62, 9)} lines`),
    S('Update', f3, `Added ${n(1, 1)} line${n(1, 1) === 1 ? '' : 's'}`),
    S('Bash', 'npm test', `${n(12, 1)} passed, 0 failed (${(3.0 + i * 0.2).toFixed(1)} s)`),
  ];
  return out;
}
const FINAL = {
  interface: 'The toggle sits in the sidebar footer and reuses useTheme. ⌘⇧T toggles it; the README lists it. All 12 tests pass.',
  checks: 'All three sign-in checks pass: empty state, expired session, and the return to the workspace.',
  api: 'The list and the stream share one session shape. listSessions() pages with a cursor and reconnects keep their page.',
  docs: 'README and docs/shortcuts.md describe the toggle and ⌘⇧T; the settings page lists the toggle.',
  migration: 'Migration 0008 adds sessions.cursor with a backfill from created_at; the dry run applies cleanly.',
  flaky: 'The timeout was racing the redirect. The test now waits for the route; 20 of 20 runs pass.',
  audit: 'Every session start and stop writes an audit entry with the model name; 14 tests pass.',
  review: 'Sidebar.jsx is fine. In api.js the reconnect still resets to page one; worth another look. The decision stays with you.',
  client: 'api.d.ts types every request and the WebSocket events; tsc reports no errors.',
  imports: 'Removed 31 unused imports in 14 files; lint and tests pass.',
};

export async function record(wrapped, rec, { phone = false } = {}) {
  const sessions = SESSIONS.map((s) => session(s.id, s.name, s.cli, s.model, s.status, s.id === 'checks' ? { attention: permissionAttention() } : {}));
  const messages = Object.fromEntries(SESSIONS.map((s) => [s.id, [msg(s.id, 'user', s.prompt, 3 + SESSIONS.indexOf(s))]]));
  const f = await openDemo(wrapped, {
    sessions, messages, outputScreens: { checks: PERMISSION_SCREEN }, viewport: WINDOW,
    workspacePatch: { human_oversight: 'full_auto' },
    storage: {
      'cc-terminalBoardMode': '1', 'ive.overview-mode': 'grid', 'cc-gridColumns': '5', 'cc-gridMinRowHeight': '240',
      // Opening a tile shows that session's terminal at full size.
      'ive.terminal-drawer': { drawer: { flaky: 'full' }, height: 320 },
    },
  });
  const p = f.page;
  for (const s of SESSIONS) await p.getByText(s.name, { exact: true }).first().click();
  await p.getByRole('button', { name: /^Board/ }).click();
  await p.waitForFunction(() => document.querySelectorAll('[data-terminal-slot][data-terminal-mode="tile"] .xterm').length === 10);
  // Every terminal has resumed (the transport's banner arrived) and reported its size.
  const ready = () => SESSIONS.every((s) => f.data.pty.some((e) => e.action === 'resize' && e.session_id === s.id));
  for (let i = 0; i < 200 && !ready(); i++) await p.waitForTimeout(30);
  await p.waitForTimeout(400);
  for (const s of SESSIONS) f.controls.setSessionStatus(s.id, s.status, s.id === 'checks' ? { attention: permissionAttention() } : {});

  // Screens: the backlog fills each terminal (the app shows the bottom of a tall screen in a
  // tile), the live steps stream during the clip.
  const T = {};
  for (const s of SESSIONS) {
    const size = f.data.pty.filter((e) => e.action === 'resize' && e.session_id === s.id).at(-1) || { cols: 220, rows: 60 };
    const steps = transcript(s);
    const screen = createScreen({ cols: size.cols, style: s.style });
    const backlog = [];
    let k = 0;
    while (k < steps.length && backlog.length < size.rows + 2) backlog.push(...steps[k++]);
    const live = steps.slice(k);
    const t = T[s.id] = { s, screen, live, since: null, done: false, dialog: null };
    if (s.status === 'waiting') t.dialog = permissionDialog('npm test', 'Run the sign-in checks');
    if (s.status === 'idle') backlog.push(...(s.style === 'codex' ? csay : say)(FINAL[s.id], WIDTH));
    out(f, s.id, CLEAR);
    await p.waitForTimeout(40);
    out(f, s.id, screen.render(backlog, screen.tail({ dialog: t.dialog, spinner: s.status === 'running' ? spinner(1, s.style) : null })));
  }
  await p.waitForTimeout(400);

  const { width: vw, height: vh } = p.viewportSize();
  const park = [120, vh - 290];
  const r = await rec(p, f.context, { park });
  const cam = phone ? createCamera(p, { cut: PHONE_CUT }) : null;
  const draw = (t, content = []) => out(f, t.s.id, t.screen.render(content, t.screen.tail({
    dialog: t.dialog, spinner: t.since != null && !t.done ? spinner(1 + Math.floor((r.frameCount - t.since) / r.fps), t.s.style) : null,
  })));
  const next = (t) => t.live.length ? t.live.shift() : [];
  const finish = async (t) => {
    t.done = true;
    draw(t, (t.s.style === 'codex' ? csay : say)(FINAL[t.s.id], WIDTH));
    f.controls.setSessionStatus(t.s.id, 'idle');
    f.controls.broadcast({ type: 'session_idle', session_id: t.s.id });
  };
  for (const t of Object.values(T)) if (t.s.status === 'running') t.since = -r.fps * 7; // spinners show 8 s and up
  // Live events, seconds into the clip.
  const events = [
    [1.4, 'api'], [1.9, 'audit'], [2.1, 'docs'], [2.3, 'flaky'], [2.7, 'interface'], [3.1, 'client'], [3.4, 'migration'],
    [3.9, 'api'], [4.3, 'docs'], [4.5, 'audit'], [4.9, 'flaky'], [5.2, 'interface'], [5.7, 'client'],
    [6.4, 'docs', 'finish'], [6.9, 'migration'], [7.2, 'api'], [7.6, 'audit'], [8.1, 'flaky'], [8.4, 'interface'],
    [8.9, 'client'], [9.6, 'api'], [9.9, 'migration'], [10.2, 'audit', 'finish'], [12.6, 'flaky'], [13.4, 'flaky', 'finish'],
  ];
  let ei = 0;
  const sec = () => r.frameCount / r.fps;
  // Advances the clip: due live steps land, spinners tick once a second.
  const run = async (until) => {
    while (sec() < until) {
      await r.frame();
      while (ei < events.length && events[ei][0] <= sec()) {
        const [, id, what] = events[ei++];
        if (what === 'finish') await finish(T[id]); else draw(T[id], next(T[id]));
      }
      if (r.frameCount % r.fps === 0) for (const t of Object.values(T)) if (t.since != null && !t.done && !t.dialog) draw(t);
    }
  };

  await r.start();
  if (cam) cam.to(r, 0);
  await run(0.7);
  await r.snap('poster');
  await run(1.0);
  // The waiting tile: click into its terminal, Enter answers the CLI's own dialog ("1. Yes").
  const checks = T.checks;
  // Click the visible part of the tile's terminal (the xterm screen is taller than the tile and
  // scrolled; a point in the slot is always on screen).
  const tile = p.locator('[data-grid-cell-session="checks"] [data-terminal-slot]');
  await r.click(tile, { duration: 0.9, offset: { x: 0.5, y: 0.55 }, after: 0.3 });
  const enterMark = inputMark(f);
  await p.keyboard.press('Enter');
  await waitForInput(f, 'checks', (d) => d === '\r' || d === '\n', { from: enterMark });
  checks.dialog = null;
  checks.since = r.frameCount;
  f.screens.checks = '❯ ';
  f.controls.setSessionStatus('checks', 'running', { attention: null });
  f.controls.broadcast({ type: 'session_attention', session_id: 'checks', attention: null });
  draw(checks, [`\x1b[32m⏺\x1b[0m \x1b[1mBash\x1b[0m(npm test)`, '  \x1b[2m⎿  Running…\x1b[0m', '']);
  await run(sec() + 0.4);
  await r.moveTo(park, { duration: 0.7 });
  await run(4.6);
  if (cam) cam.to(r, vw - cam.span);
  draw(checks, ['  \x1b[2m⎿  3 passed, 0 failed (1.4 s)\x1b[0m', '']);
  await run(6.0);
  await finish(checks);
  await run(10.4);
  if (cam) cam.to(r, 0);
  await run(10.8);
  // Open one tile: the same terminal at full size, at Session level.
  const open = p.locator('[data-grid-cell-session="flaky"]').getByRole('button', { name: 'Open Fix the flaky test' });
  await r.click(open, { duration: 1.0, after: 0 });
  await r.untilVisible(p.locator('[data-session-terminal-drawer="full"] .xterm'));
  if (cam) {
    // Close-up: the drawer bar and the terminal's first rows, 1:1.
    const bar = await p.locator('.ive-session-drawer-bar').first().boundingBox();
    cam.to(r, bar.x, { y: bar.y - 4, cut: CLOSE_CUT, from: r.clickFrame });
  }
  await run(sec() + 0.5);
  await r.moveTo([vw - 80, vh - 120], { duration: 0.8 });
  await run(14.2);
  await r.stop();
  if (!phone) return { fixture: f };
  return { fixture: f, encoding: { crops: [{ suffix: '-m', poster: 'poster', segments: cam.segments(), scale: [996, 1328] }] } };
}
