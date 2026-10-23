// Clip: the board (hero). Four Orbit sessions side by side in the dark theme: two are
// working, one asks for permission to run `npm test`, one is done. The permission is
// answered on the board with "Allow once" and every session finishes.
// `record.mjs --light hero-board` records the same story in the light theme as `board-light*`
// for the Product page's Board row; the hero and the Why panel keep the dark take.
// Provenance: IVE app 1.0.17 · demo project · no provider ran.
import { openDemo, agentStep, demoSessions, transcripts, permissionAttention, PERMISSION_SCREEN, blocks, msg, VIEWPORT } from '../lib/fixture.mjs';
import { createCamera } from '../lib/camera.mjs';

export const meta = { id: 'hero-board', title: 'The board', seconds: 14, lightId: 'board-light' };
// Master-pixel geometry of the 2x2 board at 1600x1000 CSS (sidebar 240 CSS px):
// left tile column x 488-1836, top tile y 96-1032, waiting tile y 1048-1992.
export const encoding = {
  loopFade: 0.5, // the hero loops; a short dissolve keeps the file small
  poster: 'poster',
  // Why IVE beat 2 crops the waiting tile out of this full frame (x 488-1836, y 1048-1992).
  stills: [{ name: 'why-attention', snap: 'attention' }],
};

// Phones: a board tile needs room for the permission card, so the phone recording uses a
// 1220x940 window (2x2 tiles of about 482x445 CSS px) and the cut shows the left column from
// below: the lower half of the running tile and the whole waiting tile with "Allow once".
const PHONE_WINDOW = { width: 1220, height: 940 };

export async function record(wrapped, rec, { phone = false } = {}) {
  const sessions = demoSessions();
  const state = { interface: 'running', api: 'running', checks: 'waiting', review: 'idle' };
  for (const s of sessions) { s.status = state[s.id]; s.agentState = s.status === 'running' ? 'working' : s.status === 'waiting' ? 'prompting' : 'idle'; }
  sessions.find((s) => s.id === 'checks').attention = permissionAttention();
  const messages = {
    interface: [
      msg('interface', 'user', 'Add a dark theme toggle to the sidebar. Keep the existing keyboard shortcuts working.', 4),
      msg('interface', 'assistant', blocks([
        { type: 'thinking', thinking: 'The sidebar lives in src/components/layout/Sidebar.jsx and the theme hook already exists, so the toggle can reuse it.' },
        { type: 'tool_use', id: 'i1', name: 'Read', input: { file_path: 'src/components/layout/Sidebar.jsx' } },
        { type: 'tool_result', tool_use_id: 'i1', content: '312 lines. The footer renders ConnectionStatus and CostToday.' },
        { type: 'tool_use', id: 'i2', name: 'Grep', input: { pattern: 'useTheme', path: 'src' } },
        { type: 'tool_result', tool_use_id: 'i2', content: 'src/hooks/useTheme.js\nsrc/components/settings/GeneralSettingsPanel.jsx' },
        { type: 'tool_use', id: 'i3', name: 'Edit', input: { file_path: 'src/components/layout/Sidebar.jsx', description: 'Add ThemeToggle to the sidebar footer' } },
      ]), 1),
    ],
    api: [
      msg('api', 'user', 'Connect the sessions list to the new /api/sessions endpoint and keep the event stream in sync.', 3),
      msg('api', 'assistant', blocks([
        { type: 'tool_use', id: 'a1', name: 'Read', input: { file_path: 'src/lib/api.js' } },
        { type: 'tool_result', tool_use_id: 'a1', content: '184 lines.' },
        { type: 'tool_use', id: 'a2', name: 'Edit', input: { file_path: 'src/lib/api.js', description: 'Add listSessions() with cursor paging' } },
      ]), 1),
    ],
    checks: transcripts.checks,
    review: transcripts.review,
  };
  const f = await openDemo(wrapped, { sessions, messages, outputScreens: { checks: PERMISSION_SCREEN }, workspacePatch: { human_oversight: 'full_auto' }, viewport: phone ? PHONE_WINDOW : VIEWPORT });
  const p = f.page;
  // Answering the permission: the backend would forward "1" to the CLI; here the dialog
  // disappears and the session continues.
  await f.context.route('**/api/sessions/checks/input', async (route) => {
    await route.fulfill({ json: { ok: true, state: 'sent', session_id: 'checks' } });
    f.screens.checks = '❯ ';
    const s = f.data.sessions.find((x) => x.id === 'checks');
    s.attention = null;
    f.controls.broadcast({ type: 'session_attention', session_id: 'checks', attention: null });
    f.controls.setSessionStatus('checks', 'running');
  });
  for (const name of ['Build the workspace', 'Connect the API', 'Check the sign-in flow', 'Review the changes']) await p.getByText(name, { exact: true }).first().click();
  await p.getByRole('button', { name: /^Board/ }).click();
  await p.locator('[data-board-screen]').waitFor();
  await p.getByRole('button', { name: 'Allow once' }).waitFor();
  // Opening a tile resumes its PTY, which the transport reports as idle; restore the scene.
  f.controls.setSessionStatus('interface', 'running');
  f.controls.setSessionStatus('api', 'running');
  f.controls.setSessionStatus('checks', 'waiting', { attention: permissionAttention() });
  await p.waitForTimeout(1500);

  // The pointer rests in the empty lower part of the done tile until it heads for "Allow once".
  const { width: vw, height: vh } = p.viewportSize();
  const park = [vw - 100, vh - 200];
  const r = await rec(p, f.context, { park });
  const cam = phone ? createCamera(p) : null;
  await r.start();
  if (cam) {
    // Left edge just outside the waiting tile (20 px left of its title), bottom of the window.
    const title = await p.locator('[data-board-screen]').getByText('Check the sign-in flow', { exact: true }).first().boundingBox();
    cam.to(r, title.x - 20, { y: vh - cam.span * 4 / 3 });
  }
  await r.hold(0.4);
  await r.snap('poster');
  await r.snap('attention');
  await r.hold(1.2);
  await agentStep(f, 'interface', [{ type: 'tool_result', tool_use_id: 'i3', content: 'Edited 1 file: +18 −2' }, { type: 'tool_use', id: 'i4', name: 'Bash', input: { command: 'npm test', description: 'Run the test suite' } }]);
  await r.hold(1.0);
  await agentStep(f, 'api', [{ type: 'tool_result', tool_use_id: 'a2', content: 'Edited 1 file: +24 −6' }, { type: 'tool_use', id: 'a3', name: 'Read', input: { file_path: 'src/hooks/useWebSocket.js' } }]);
  await r.hold(0.8);

  const allow = p.locator('[data-board-screen]').getByRole('button', { name: 'Allow once' });
  await r.click(allow, { duration: 1.0, after: 0.6 });
  await r.hold(0.8);
  await agentStep(f, 'checks', [{ type: 'tool_use', id: 'c2', name: 'Bash', input: { command: 'npm test', description: 'Run the sign-in checks' } }]);
  await r.hold(1.8);
  await agentStep(f, 'interface', [{ type: 'tool_result', tool_use_id: 'i4', content: '12 passed, 0 failed (3.1 s)' }, { type: 'text', text: 'The toggle sits in the sidebar footer and reuses `useTheme`. Existing shortcuts are untouched; all 12 tests pass.' }], { done: true });
  await r.hold(1.4);
  await agentStep(f, 'checks', [{ type: 'tool_result', tool_use_id: 'c2', content: '3 passed, 0 failed (1.4 s)' }, { type: 'text', text: 'All three sign-in checks pass: empty state, expired session, and the return to the workspace.' }], { done: true });
  await r.hold(1.4);
  await agentStep(f, 'api', [{ type: 'tool_result', tool_use_id: 'a3', content: '210 lines. session_update carries the full session row.' }, { type: 'text', text: 'The list and the stream now share one session shape. `listSessions()` pages with a cursor and reconnects keep their page.' }], { done: true });
  await r.moveTo(park, { duration: 0.8 });
  await r.hold(2.2);
  await r.stop();
  if (!phone) return { fixture: f };
  return { fixture: f, encoding: { crops: [{ suffix: '-m', poster: 'poster', segments: cam.segments() }] } };
}
