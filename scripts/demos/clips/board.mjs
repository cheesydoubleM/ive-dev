// Clip: the board. Four sessions side by side; two are working, one asks for permission,
// one is done. The permission is answered from the board and every session finishes.
import { openDemo, agentStep, demoSessions, transcripts, permissionAttention, PERMISSION_SCREEN, blocks, msg } from '../lib/fixture.mjs';

export const meta = { id: 'board', title: 'The board' };

export async function record(wrapped, rec) {
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
  const f = await openDemo(wrapped, { sessions, messages, outputScreens: { checks: PERMISSION_SCREEN }, workspacePatch: { human_oversight: 'full_auto' } });
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

  const r = await rec(p, f.context);
  await r.start();
  await r.hold(1.6);
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
  await r.hold(3.0);
  await r.stop();
  return { fixture: f };
}
