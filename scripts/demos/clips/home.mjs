// Clip: the starting point. A goal is typed on Home, a session starts, the agent gets to work.
import { openDemo, agentStep, demoSessions, transcripts } from '../lib/fixture.mjs';

export const meta = { id: 'home', title: 'Your starting point' };

export async function record(wrapped, rec) {
  const sessions = demoSessions().filter((s) => s.id !== 'interface');
  const messages = { api: transcripts.api, checks: transcripts.checks, review: transcripts.review };
  const f = await openDemo(wrapped, { sessions, messages });
  const p = f.page;
  await p.locator('[data-home-start]').waitFor();
  await p.waitForTimeout(600);

  const r = await rec(p, f.context);
  await r.start();
  await r.hold(1.2);
  const composer = p.locator('form:has([data-home-start]) textarea').first();
  await r.click(composer, { duration: 0.7, offset: { x: 0.2, y: 0.35 } });
  await r.type('Add a dark theme toggle to the sidebar. Keep the existing keyboard shortcuts working.', { cps: 22 });
  await r.hold(0.6);
  const goal = 'Add a dark theme toggle to the sidebar. Keep the existing keyboard shortcuts working.';
  await r.click(p.locator('[data-home-start]'), { duration: 0.6, after: 0.4 });
  await r.settle(600);
  const sid = f.controls.latestSession().id;
  await r.hold(0.5);
  // The app hands the first message to the agent once the terminal has been quiet for a
  // moment. Let that wait pass off camera instead of filming an empty conversation.
  const delivered = async () => (await p.getByText(goal, { exact: true }).count()) > 0 && (await p.locator('[data-awaiting-reply]').count()) > 0;
  for (let i = 0; i < 400 && !(await delivered()); i++) { await f.context.clock.runFor(100); await r.settle(30); }
  if (!(await delivered())) throw new Error('The first message never reached the terminal; pty actions: ' + f.data.pty.map((e) => e.action).join(','));
  f.controls.setSessionStatus(sid, 'running');
  await r.settle(300);
  await r.hold(1.4);

  const steps = [
    [{ type: 'thinking', thinking: 'The sidebar lives in src/components/layout/Sidebar.jsx and the theme hook already exists, so the toggle can reuse it. I should check how shortcuts are registered before adding anything.' }],
    [{ type: 'tool_use', id: 'h1', name: 'Read', input: { file_path: 'src/components/layout/Sidebar.jsx' } }],
    [{ type: 'tool_result', tool_use_id: 'h1', content: '312 lines. The footer renders ConnectionStatus and CostToday.' }, { type: 'tool_use', id: 'h2', name: 'Grep', input: { pattern: 'useTheme', path: 'src' } }],
    [{ type: 'tool_result', tool_use_id: 'h2', content: 'src/hooks/useTheme.js\nsrc/components/settings/GeneralSettingsPanel.jsx' }, { type: 'tool_use', id: 'h3', name: 'Edit', input: { file_path: 'src/components/layout/Sidebar.jsx', description: 'Add ThemeToggle to the sidebar footer' } }],
    [{ type: 'tool_result', tool_use_id: 'h3', content: 'Edited 1 file: +18 −2' }, { type: 'tool_use', id: 'h4', name: 'Bash', input: { command: 'npm test', description: 'Run the test suite' } }],
    [{ type: 'tool_result', tool_use_id: 'h4', content: '12 passed, 0 failed (3.1 s)' }, { type: 'text', text: 'The toggle sits in the sidebar footer and reuses `useTheme`. Existing shortcuts are untouched; all 12 tests pass.' }],
  ];
  const holds = [1.4, 1.2, 1.2, 1.3, 1.5, 3.0];
  for (let i = 0; i < steps.length; i++) {
    await agentStep(f, sid, steps[i], { done: i === steps.length - 1 });
    await r.hold(holds[i]);
  }
  await r.stop();
  return { fixture: f };
}
