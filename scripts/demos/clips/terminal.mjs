// Clip: a normal terminal, enhanced. The session "Build the workspace" at Session level with its
// terminal expanded to the full view (the app's own drawer bar "Terminal · claude", ⌘J). The
// instruction is typed into the terminal and sent with Enter, the CLI-style transcript streams
// (tool lines, results, the reply, the prompt box returns), the session turns Done. Then
// "Restore small terminal": the same session shows its Overview (steps and reply) above and the
// terminal below. Recorded light at 60 fps (`record.mjs --light terminal` → `terminal-light*`).
//
// Provenance: IVE app 1.0.17 · demo project · no provider ran. The terminal text is scripted demo
// output in the style of the CLI, fed through the transport's PTY channel (lib/tui.mjs); typing
// and Enter are real keystrokes into the app's xterm terminal, which the transport receives as
// `input` actions and echoes like a PTY would.
import { openDemo, agentStep, demoSessions, permissionAttention, PERMISSION_SCREEN, viewportFor, msg, blocks } from '../lib/fixture.mjs';
import { createCamera } from '../lib/camera.mjs';
import { createScreen, step, say, prompt, spinner, waitForInput, inputMark, out, colsOf, CLEAR } from '../lib/tui.mjs';

export const meta = { id: 'terminal', title: 'A normal terminal, enhanced', seconds: 14 };
export const encoding = { loopFade: 0, poster: 'poster' };

const SID = 'interface';
const INSTRUCTION = 'Add a dark theme toggle to the sidebar.';

export async function record(wrapped, rec, { phone = false } = {}) {
  const sessions = demoSessions();
  const state = { interface: 'idle', api: 'running', checks: 'waiting', review: 'idle' };
  for (const s of sessions) { s.status = state[s.id]; s.agentState = s.status === 'running' ? 'working' : s.status === 'waiting' ? 'prompting' : 'idle'; }
  sessions.find((s) => s.id === 'checks').attention = permissionAttention();
  // The session's earlier exchange, so the Overview and the terminal tell the same story.
  const messages = {
    interface: [
      msg(SID, 'user', 'What does the sidebar footer render?', 6),
      msg(SID, 'assistant', blocks([
        { type: 'tool_use', id: 't0', name: 'Read', input: { file_path: 'src/components/layout/Sidebar.jsx' } },
        { type: 'tool_result', tool_use_id: 't0', content: '312 lines.' },
        { type: 'text', text: 'The footer renders `ConnectionStatus` and `CostToday`, nothing else.' },
      ]), 5),
    ],
    api: [msg('api', 'user', 'Connect the sessions list to the new /api/sessions endpoint and keep the event stream in sync.', 7)],
    checks: [msg('checks', 'user', 'Run the sign-in checks: empty state, expired session, and the return to the workspace.', 5)],
    review: [msg('review', 'user', 'Review the changed files and call out anything that needs another look.', 14)],
  };
  const f = await openDemo(wrapped, {
    sessions, messages, outputScreens: { checks: PERMISSION_SCREEN },
    viewport: viewportFor(phone),
    storage: { 'ive.terminal-drawer': { drawer: { [SID]: 'full' }, height: phone ? 240 : 320 } },
  });
  const p = f.page;
  await p.getByText('Build the workspace', { exact: true }).first().click();
  await p.waitForSelector('[data-session-terminal-drawer="full"] .xterm');
  // The app sizes the PTY to the view; its resize tells us the columns the CLI would draw for.
  for (let i = 0; i < 100 && !f.data.pty.some((e) => e.action === 'resize' && e.session_id === SID); i++) await p.waitForTimeout(30);
  await p.waitForTimeout(400);
  // Opening a session resumes its PTY, which the transport reports as idle; restore the scene.
  f.controls.setSessionStatus('api', 'running');
  f.controls.setSessionStatus('checks', 'waiting', { attention: permissionAttention() });
  const cols = colsOf(f, SID, phone ? 60 : 179);
  const width = Math.min(60, cols - 4);
  const screen = createScreen({ cols });
  // The earlier exchange, as the CLI drew it, then the empty prompt box.
  const content = [
    ...prompt('What does the sidebar footer render?', width),
    ...step('Read', 'src/components/layout/Sidebar.jsx', 'Read 312 lines'),
    ...say('The footer renders ConnectionStatus and CostToday, nothing else.', width),
  ];
  out(f, SID, CLEAR);
  await p.waitForTimeout(80);
  out(f, SID, screen.render(content, screen.tail()));
  await p.waitForTimeout(300);

  const term = p.locator('[data-session-terminal-drawer="full"] .xterm-screen');
  const { width: vw, height: vh } = p.viewportSize();
  const park = phone ? [vw - 40, vh - 60] : [vw - 120, vh - 160];
  const r = await rec(p, f.context, { park });
  const cam = phone ? createCamera(p) : null;
  // Spinner seconds tick while the turn runs; redraws only the tail.
  let working = null; // { since: frame }
  let typed = '';
  const draw = (newContent = []) => out(f, SID, screen.render(newContent, screen.tail({ spinner: working ? spinner(Math.floor((r.frameCount - working.since) / r.fps)) : null, typed })));
  const run = async (seconds) => {
    const end = r.frameCount + Math.round(seconds * r.fps);
    while (r.frameCount < end) {
      await r.frame();
      if (working && (r.frameCount - working.since) % r.fps === 0) draw();
    }
  };

  await r.start();
  if (cam) { const main = await p.locator('main').first().boundingBox(); cam.to(r, main.x + 10); }
  await r.hold(0.6);
  // Click into the terminal (focus), type the instruction, Enter: real keystrokes into xterm,
  // which the transport receives as `input`; the echo comes back through the output channel.
  await r.click(term, { duration: 0.7, offset: { x: phone ? 0.6 : 0.3, y: 0.12 }, after: 0.2 });
  for (const ch of INSTRUCTION) {
    const mark = inputMark(f);
    await p.keyboard.type(ch);
    await waitForInput(f, SID, (d) => d === ch, { from: mark });
    typed += ch;
    draw();
    await r.frame(/[.,]/.test(ch) ? 5 : 2 + (Math.random() < 0.4 ? 1 : 0));
  }
  await r.hold(0.4);
  const enterMark = inputMark(f);
  await p.keyboard.press('Enter');
  await waitForInput(f, SID, (d) => d === '\r' || d === '\n', { from: enterMark });
  typed = '';
  f.controls.addMessage(SID, 'user', INSTRUCTION);
  f.controls.setSessionStatus(SID, 'running');
  working = { since: r.frameCount };
  draw(prompt(INSTRUCTION, width));
  await run(1.0);

  const steps = [
    [step('Read', 'src/components/layout/Sidebar.jsx', 'Read 312 lines'), [{ type: 'tool_use', id: 't1', name: 'Read', input: { file_path: 'src/components/layout/Sidebar.jsx' } }, { type: 'tool_result', tool_use_id: 't1', content: '312 lines. The footer renders ConnectionStatus and CostToday.' }]],
    [step('Search', 'pattern: "useTheme", path: "src"', 'Found 2 files'), [{ type: 'tool_use', id: 't2', name: 'Grep', input: { pattern: 'useTheme', path: 'src' } }, { type: 'tool_result', tool_use_id: 't2', content: 'src/hooks/useTheme.js\nsrc/components/settings/GeneralSettingsPanel.jsx' }]],
    [step('Update', 'src/components/layout/Sidebar.jsx', 'Added 18 lines, removed 2 lines'), [{ type: 'tool_use', id: 't3', name: 'Edit', input: { file_path: 'src/components/layout/Sidebar.jsx', description: 'Add ThemeToggle to the sidebar footer' } }, { type: 'tool_result', tool_use_id: 't3', content: 'Edited 1 file: +18 −2' }]],
    [step('Bash', 'npm test', '12 passed, 0 failed (3.1 s)'), [{ type: 'tool_use', id: 't4', name: 'Bash', input: { command: 'npm test', description: 'Run the test suite' } }, { type: 'tool_result', tool_use_id: 't4', content: '12 passed, 0 failed (3.1 s)' }]],
  ];
  for (const [lines, blockList] of steps) {
    draw(lines);
    await agentStep(f, SID, blockList);
    await run(0.9);
  }
  working = null;
  draw(say('The toggle sits in the sidebar footer and reuses useTheme. Existing shortcuts are untouched; all 12 tests pass.', width));
  await agentStep(f, SID, [{ type: 'text', text: 'The toggle sits in the sidebar footer and reuses `useTheme`. Existing shortcuts are untouched; all 12 tests pass.' }], { done: true });
  await r.hold(0.6);
  await r.snap('poster');
  await r.hold(0.6);

  // The same session as Overview plus terminal: "Restore small terminal" on the drawer bar.
  const restore = p.getByRole('button', { name: 'Restore small terminal' });
  if (cam) cam.to(r, cam.fit(await restore.boundingBox(), 250), { pan: 0.6 });
  await r.click(restore, { duration: 0.9, after: 0 });
  await r.untilVisible(p.locator('[data-session-terminal-drawer="open"]'));
  if (cam) cam.to(r, 250, { pan: 0.6 });
  await r.hold(0.4);
  await r.moveTo(park, { duration: 0.8 });
  await r.hold(2.4);
  await r.stop();
  if (!phone) return { fixture: f };
  return { fixture: f, encoding: { crops: [{ suffix: '-m', poster: 'poster', segments: cam.segments() }] } };
}
