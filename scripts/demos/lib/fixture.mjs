// Demo workspace for the site recordings: the real IVE frontend (1.0.17 build) on the
// app's own isolated test transport. All project, session, task and conversation data
// below is a labelled demonstration (project "Orbit"); no provider runs and nothing is
// written to a real IVE. Provenance line for every clip: IVE app · demo project · no provider ran.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from '/Users/maximilianschwarz/Projekte/AIFOREU/ive-team/frontend/node_modules/playwright/index.mjs';
import { createTourFixture } from '/Users/maximilianschwarz/Projekte/AIFOREU/ive-oss/frontend/tests/interactive-onboarding-fixture.mjs';

// The IVE 1.0.17 frontend, built in the open-source checkout. `checkDist()` verifies it.
export const IVE_OSS = '/Users/maximilianschwarz/Projekte/AIFOREU/ive-oss';
export const DIST = process.env.IVE_DIST || `${IVE_OSS}/frontend/dist`;
export const VIEWPORT = { width: 1600, height: 1000 };
// Phone cuts: the same story in a short browser window at the narrowest desktop layout (the app
// switches to its phone layout below 768 CSS px, which has no board and no attention list; the
// Mac app's own window is at least 900x600, the terminal install runs IVE in the browser).
// The 3:4 phone cut is 498x664 CSS px (996x1328 device px), the full height of this window: app
// text shows at 350/498 = 0.70 of its size on a 390 px phone, against 350/750 = 0.47 in round 1.
// loop-canvas and hero-board use larger windows of their own (see their clip scripts).
export const PHONE_VIEWPORT = { width: 768, height: 664 };
export const PHONE_CUT = { w: 996, h: 1328 };
export const viewportFor = (phone) => (phone ? PHONE_VIEWPORT : VIEWPORT);

const ago = (min = 0) => new Date(Date.now() - min * 60000).toISOString();
export const iso = ago;
export const workspace = { id: 'orbit', name: 'Orbit', path: '/Projects/orbit', created_at: ago(300) };

export const PERMISSION_SCREEN = [
  'Bash command', '  npm test', '  Run the sign-in checks', '', 'Do you want to proceed?',
  '❯ 1. Yes', '  2. Yes, and don’t ask again for npm test commands in /Projects/orbit', '  3. No', '', 'Esc to cancel',
].join('\n');
export const permissionAttention = () => ({ kind: 'permission', title: 'Permission needed', message: 'npm test', tool_name: 'Bash', context: PERMISSION_SCREEN, source: 'hook', options: [], actions: [], notification_type: '', tool_input: { command: 'npm test', description: 'Run the sign-in checks' }, asked_at: Date.now() / 1000 });

export const session = (id, name, cli_type, model, status = 'idle', extra = {}) => ({
  id, name, cli_type, model, status,
  agentState: status === 'running' ? 'working' : status === 'waiting' ? 'prompting' : 'idle',
  workspace_id: workspace.id, session_type: 'worker', created_at: ago(40), last_active_at: ago(1), archived: 0, pty_alive: true, tags: [], ...extra,
});
export const blocks = (arr) => JSON.stringify(arr);
let seq = 0;
export const msg = (sid, role, content, minAgo = 0, extra = {}) => ({ id: `${sid}-${role}-${++seq}`, session_id: sid, role, content, created_at: ago(minAgo), ...extra });

// The four sessions of the Orbit project. Model labels are the CLI profiles' real values:
// Claude Code sonnet/opus, Codex "default" (the CLI's own default model). Gemini CLI is
// not used: its profile is deprecated and inactive in 1.0.17 (backend/cli_profiles.py).
export function demoSessions() {
  return [
    session('interface', 'Build the workspace', 'claude', 'sonnet', 'idle'),
    session('api', 'Connect the API', 'codex', 'default', 'idle'),
    session('checks', 'Check the sign-in flow', 'claude', 'sonnet', 'idle'),
    session('review', 'Review the changes', 'claude', 'opus', 'idle'),
  ];
}

export const transcripts = {
  interface: [
    msg('interface', 'user', 'Add a dark theme toggle to the sidebar. Keep the existing keyboard shortcuts working.', 9),
    msg('interface', 'assistant', blocks([
      { type: 'thinking', thinking: 'The sidebar lives in src/components/layout/Sidebar.jsx and the theme hook already exists, so the toggle can reuse it. I should check how shortcuts are registered before adding anything.' },
      { type: 'tool_use', id: 'i1', name: 'Read', input: { file_path: 'src/components/layout/Sidebar.jsx' } },
      { type: 'tool_result', tool_use_id: 'i1', content: '312 lines. The footer renders ConnectionStatus and CostToday.' },
      { type: 'tool_use', id: 'i2', name: 'Grep', input: { pattern: 'useTheme', path: 'src' } },
      { type: 'tool_result', tool_use_id: 'i2', content: 'src/hooks/useTheme.js\nsrc/components/settings/GeneralSettingsPanel.jsx' },
      { type: 'tool_use', id: 'i3', name: 'Edit', input: { file_path: 'src/components/layout/Sidebar.jsx', description: 'Add ThemeToggle to the sidebar footer' } },
      { type: 'tool_result', tool_use_id: 'i3', content: 'Edited 1 file: +18 −2' },
      { type: 'text', text: 'The toggle sits in the sidebar footer and reuses `useTheme`. Existing shortcuts are untouched; `npm test` passes (12 tests).' },
    ]), 6),
  ],
  api: [
    msg('api', 'user', 'Connect the sessions list to the new /api/sessions endpoint and keep the event stream in sync.', 7),
    msg('api', 'assistant', blocks([
      { type: 'tool_use', id: 'a1', name: 'Read', input: { file_path: 'src/lib/api.js' } },
      { type: 'tool_result', tool_use_id: 'a1', content: '184 lines.' },
      { type: 'tool_use', id: 'a2', name: 'Edit', input: { file_path: 'src/lib/api.js', description: 'Add listSessions() with cursor paging' } },
      { type: 'tool_result', tool_use_id: 'a2', content: 'Edited 1 file: +24 −6' },
      { type: 'text', text: 'Reading the WebSocket handler next so the list and the stream agree on the session shape.' },
    ]), 3),
  ],
  checks: [
    msg('checks', 'user', 'Run the sign-in checks: empty state, expired session, and the return to the workspace.', 5),
    msg('checks', 'assistant', blocks([
      { type: 'tool_use', id: 'c1', name: 'Read', input: { file_path: 'tests/sign-in.spec.js' } },
      { type: 'tool_result', tool_use_id: 'c1', content: '96 lines, 3 cases.' },
      { type: 'text', text: 'I’ll run the suite now. It needs your permission for `npm test`.' },
    ]), 2),
  ],
  review: [
    msg('review', 'user', 'Review the changed files and call out anything that needs another look.', 14),
    msg('review', 'assistant', blocks([
      { type: 'tool_use', id: 'r1', name: 'Bash', input: { command: 'git diff --stat', description: 'List the changed files' } },
      { type: 'tool_result', tool_use_id: 'r1', content: ' src/components/layout/Sidebar.jsx | 20 ++-\n src/lib/api.js | 30 +++-\n 2 files changed' },
      { type: 'text', text: '### Review\n\n- **Sidebar.jsx**: the toggle reuses `useTheme`; the footer keeps its height. Fine.\n- **api.js**: `listSessions()` pages with a cursor, but the WebSocket reconnect still resets to page one. Worth another look.\n\nThe final decision stays with you.' },
    ]), 11),
  ],
};

/** Confirms that DIST is the 1.0.17 frontend (package version and build profile) and returns a summary. */
export async function checkDist() {
  const pkg = JSON.parse(await readFile(`${IVE_OSS}/frontend/package.json`, 'utf8'));
  const profile = JSON.parse(await readFile(join(DIST, 'ive-build-profile.json'), 'utf8'));
  if (pkg.version !== '1.0.17') throw new Error(`frontend package is ${pkg.version}, expected 1.0.17`);
  if (profile.edition !== 'integrated-dev') throw new Error(`unexpected build profile ${JSON.stringify(profile)}`);
  return { version: pkg.version, edition: profile.edition, extensions: profile.extensions, dist: DIST };
}

export async function launch() {
  const browser = await chromium.launch({ headless: true });
  // The fake clock must exist before the app loads so every timer it creates is controllable.
  const wrapped = { newContext: async (opts) => {
    const context = await browser.newContext({ ...opts, deviceScaleFactor: 2, reducedMotion: 'no-preference' });
    await context.clock.install();
    return context;
  } };
  return { browser, wrapped };
}

// 1.0.17 shows one German label in the guided task window ("Run abbrechen", TaskFlow.jsx:279).
// The English label ships in ive-oss 951a002. When DIST is a build without it (for example the
// installed 1.0.17 app), the recorder replaces exactly that label and its tooltip in flight.
const TASKFLOW_LABEL_PATCH = [
  ['>Run abbrechen<', '>Cancel run<'], ['"Run abbrechen"', '"Cancel run"'],
  ['Beendet diesen Ablauf und unterbricht seine aktive Arbeit.', 'Stops this run and interrupts its active work.'],
];
export const labelPatchLog = [];

// The app theme of every recording unless a clip passes its own (`record.mjs --light` sets 'light').
let defaultTheme = 'dark';
export function setDefaultTheme(theme) { defaultTheme = theme; }

/**
 * Opens the real frontend with the demo workspace. `outputScreens` maps a session id to
 * the terminal screen its prompt snapshot should show (a Claude Code permission dialog
 * makes the Allow/Don't allow card appear).
 */
export async function openDemo(wrapped, { sessions = demoSessions(), messages = transcripts, storage = {}, outputScreens = {}, diff = '', stagedDiff = '', gitStatus = null, workspacePatch = {}, theme = defaultTheme, tasks = [], runs = [], pipelines = [], viewport = VIEWPORT } = {}) {
  const f = await createTourFixture(wrapped, {
    dist: DIST, viewport, theme,
    settings: { product_tour_version: '2', language: 'en' },
    storage: { 'ive.onboarding.v2.owner': 'done', ...storage },
    workspaces: [{ ...workspace, ...workspacePatch }], sessions, messages, diff, stagedDiff, tasks, runs, pipelines,
  });
  const screens = { ...outputScreens };
  await f.context.route('**/api/sessions/*/output**', (route) => {
    const sid = new URL(route.request().url()).pathname.split('/')[3];
    const screen = screens[sid] || '❯ ';
    route.fulfill({ json: { text: screen, output: screen, screen, startup_blocker: null, pty_alive: true, permission_view_state: null } });
  });
  // Run details reads a session export; the transport has none, the real backend sends markdown.
  await f.context.route('**/api/sessions/*/export**', (route) => route.fulfill({ status: 200, contentType: 'text/markdown', body: '' }));
  await f.context.route('**/assets/TaskFlow-*.js', async (route) => {
    const file = join(DIST, decodeURIComponent(new URL(route.request().url()).pathname));
    let body = await readFile(file, 'utf8');
    let replaced = 0;
    for (const [from, to] of TASKFLOW_LABEL_PATCH) { const n = body.split(from).length - 1; if (n) { body = body.split(from).join(to); replaced += n; } }
    labelPatchLog.push({ file, replaced });
    return route.fulfill({ status: 200, contentType: 'text/javascript', body });
  });
  if (gitStatus) await f.context.route('**/api/workspaces/*/git/status**', (route) => route.fulfill({ json: gitStatus }));
  // Session edits the fixture does not cover (model, agent mode): merge and announce like the backend.
  await f.context.route('**/api/sessions/*', async (route) => {
    const request = route.request();
    const parts = new URL(request.url()).pathname.split('/');
    if (request.method() !== 'PUT' || parts.length !== 4) return route.fallback();
    let body = {};
    try { body = request.postDataJSON() || {}; } catch { /* no body */ }
    const item = f.data.sessions.find((s) => s.id === parts[3]);
    if (!item || Object.hasOwn(body, 'archived')) return route.fallback();
    const { apply_live, ...patch } = body;
    Object.assign(item, patch);
    f.controls.broadcast({ type: 'session_update', session_id: item.id, session: item });
    return route.fulfill({ json: item });
  });
  await f.context.route('**/api/sessions/*/permission-mode/apply-now', (route) => route.fulfill({ json: { ok: true } }));
  // Home "Start": the backend creates the session in the shown project and returns it.
  let quickSeq = 0;
  await f.context.route('**/api/sessions/quick', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    let body = {};
    try { body = route.request().postDataJSON() || {}; } catch { /* no body */ }
    const item = { id: `demo-session-${++quickSeq}`, workspace_id: body.workspace_id || workspace.id, name: body.name || 'New session', cli_type: body.cli_type || 'claude', model: body.model || 'sonnet', status: 'idle', agentState: 'idle', pty_alive: false, session_type: 'worker', created_at: new Date().toISOString(), last_active_at: new Date().toISOString(), archived: 0, tags: [], attention: null, quick: false };
    f.data.sessions.push(item);
    f.data.messages[item.id] = [];
    return route.fulfill({ json: item });
  });
  f.screens = screens;
  await f.page.locator('#ive-project-sidebar, .x-app-shell').first().waitFor();
  await f.page.evaluate(() => document.fonts.ready);
  await f.page.waitForTimeout(1200);
  return f;
}

/** One agent step: append blocks, nudge the open views to refetch, give the network a moment. */
export async function agentStep(f, sid, blockList, { done = false } = {}) {
  pushAssistant(f, sid, blockList, { done });
  await f.page.evaluate((id) => window.dispatchEvent(new CustomEvent('cc-session-messages-refresh', { detail: { sessionId: id } })), sid);
  await f.page.waitForTimeout(250);
}

/** Appends an assistant message with the given blocks and tells the UI (like the backend does). */
export function pushAssistant(f, sid, blockList, { done = false } = {}) {
  const m = f.controls.addMessage(sid, 'assistant', blocks(blockList));
  f.controls.broadcast({ type: 'session_update', session_id: sid, session: f.data.sessions.find((s) => s.id === sid) });
  if (done) {
    f.controls.setSessionStatus(sid, 'idle');
    f.controls.broadcast({ type: 'session_idle', session_id: sid });
  }
  return m;
}

/** A session the backend creates (pipeline stages): stored, then announced like `session_created`. */
export function addSession(f, item) {
  f.data.sessions.push(item);
  f.data.messages[item.id] ||= [];
  f.controls.broadcast({ type: 'session_created', session: item });
  return item;
}

/**
 * Advances the app's fake clock off camera (no frames) until `condition()` holds.
 * Used for the app's own polling intervals (guided task 3.5 s, attention list 15 s).
 */
export async function advanceUntil(f, condition, { stepMs = 250, maxMs = 30000, settleMs = 40 } = {}) {
  for (let t = 0; t <= maxMs; t += stepMs) {
    if (await condition()) return true;
    await f.context.clock.runFor(stepMs);
    await f.page.waitForTimeout(settleMs);
  }
  if (await condition()) return true;
  throw new Error('advanceUntil: condition never held');
}
