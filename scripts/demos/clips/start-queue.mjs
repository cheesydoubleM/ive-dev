// Clip: start with a sentence, queue the next one. A goal is typed on Home and started;
// while the agent works, a follow-up is typed into the busy session and Enter queues it
// ("UP NEXT"). IVE delivers it when the turn ends and the agent starts on it.
// Provenance: IVE app 1.0.17 · demo project · no provider ran. Agent steps are demo data
// pushed through the transport; the queue, its states and the delivery are the app's own.
import { openDemo, agentStep, demoSessions, transcripts } from '../lib/fixture.mjs';

export const meta = { id: 'start-queue', title: 'Start with a sentence', seconds: 18 };
export const encoding = { loopFade: 0, poster: 'poster' };

const GOAL = 'Add a dark theme toggle to the sidebar. Keep the existing keyboard shortcuts working.';
const FOLLOW_UP = 'Also add ⌘⇧T as the shortcut and mention it in the README.';

export async function record(wrapped, rec) {
  const sessions = demoSessions().filter((s) => s.id !== 'interface');
  const messages = { api: transcripts.api, checks: transcripts.checks, review: transcripts.review };
  const f = await openDemo(wrapped, { sessions, messages });
  const p = f.page;
  await p.locator('[data-home-start]').waitFor();
  await p.waitForTimeout(600);

  const r = await rec(p, f.context);
  await r.start();
  await r.hold(0.8);
  const composer = p.locator('form:has([data-home-start]) textarea').first();
  await r.click(composer, { duration: 0.6, offset: { x: 0.2, y: 0.35 } });
  await r.type(GOAL, { cps: 26 });
  await r.hold(0.4);
  await r.click(p.locator('[data-home-start]'), { duration: 0.5, after: 0 });
  await r.settle(600);
  r.mark('session');
  const sid = f.controls.latestSession().id;
  // The app hands the first message to the agent once the terminal has been quiet for a
  // moment. Let that wait pass off camera instead of filming an empty conversation.
  const delivered = async () => (await p.getByText(GOAL, { exact: true }).count()) > 0 && (await p.locator('[data-awaiting-reply]').count()) > 0;
  for (let i = 0; i < 400 && !(await delivered()); i++) { await f.context.clock.runFor(100); await r.settle(30); }
  if (!(await delivered())) throw new Error('The first message never reached the terminal; pty actions: ' + f.data.pty.map((e) => e.action).join(','));
  f.controls.setSessionStatus(sid, 'running');
  await r.settle(300);
  await r.hold(0.9);

  // Two tool steps land.
  await agentStep(f, sid, [{ type: 'thinking', thinking: 'The sidebar lives in src/components/layout/Sidebar.jsx and the theme hook already exists, so the toggle can reuse it. I should check how shortcuts are registered before adding anything.' }, { type: 'tool_use', id: 'h1', name: 'Read', input: { file_path: 'src/components/layout/Sidebar.jsx' } }]);
  await r.hold(1.0);
  await agentStep(f, sid, [{ type: 'tool_result', tool_use_id: 'h1', content: '312 lines. The footer renders ConnectionStatus and CostToday.' }, { type: 'tool_use', id: 'h2', name: 'Edit', input: { file_path: 'src/components/layout/Sidebar.jsx', description: 'Add ThemeToggle to the sidebar footer' } }]);
  await r.hold(0.7);

  // The composer of the busy session: "Claude is working. Write your next message, Enter queues it."
  const busy = p.locator('.ive-session-composer textarea');
  await r.click(busy, { duration: 0.6, offset: { x: 0.3, y: 0.5 } });
  await r.hold(0.3);
  await r.type(FOLLOW_UP, { cps: 26 });
  await r.hold(0.3);
  await r.press('Enter', 0.2);
  await p.locator('[data-composer-queue]').waitFor({ timeout: 5000 });
  await r.snap('poster');
  await r.hold(1.0);

  // The turn ends; IVE sends the queued message (SENDING…, DELIVERED) and the agent starts on it.
  await agentStep(f, sid, [{ type: 'tool_result', tool_use_id: 'h2', content: 'Edited 1 file: +18 −2' }, { type: 'text', text: 'The toggle sits in the sidebar footer and reuses `useTheme`. Existing shortcuts are untouched.' }], { done: true });
  const followUpSent = async () => f.writes.some((w) => /\/sessions\/[^/]+\/input$/.test(w.path) && w.body?.message?.includes('⌘⇧T'));
  for (let i = 0; i < 90 && !(await followUpSent()); i++) await r.frame();
  if (!(await followUpSent())) throw new Error('The queued follow-up was never delivered');
  await r.settle(200);
  await r.hold(1.0);
  await agentStep(f, sid, [{ type: 'thinking', thinking: 'Shortcuts are registered in src/lib/keymap.js. ⌘⇧T is free. I’ll add the binding, then document it.' }, { type: 'tool_use', id: 's1', name: 'Read', input: { file_path: 'src/lib/keymap.js' } }]);
  await r.hold(1.0);
  await agentStep(f, sid, [{ type: 'tool_result', tool_use_id: 's1', content: '58 lines. Bindings are a plain object keyed by chord.' }, { type: 'tool_use', id: 's2', name: 'Edit', input: { file_path: 'src/lib/keymap.js', description: 'Bind ⌘⇧T to toggleTheme' } }]);
  await r.hold(1.6);
  await r.stop();

  // Phones: 3:4 cuts of the full window height. Home: around the goal box and Start.
  // Session: the left 750 CSS px of the conversation column, where steps, the queue and the
  // composer are (right-aligned user bubbles are partly cut).
  const home = { from: 0, x: 1090, y: 0, w: 1500, h: 2000 };
  const box = await p.locator('.ive-session-composer').first().boundingBox();
  const sessionCut = { from: 'session', x: Math.round(box.x * 2), y: 0, w: 1500, h: 2000 };
  return { fixture: f, encoding: { crops: [{ suffix: '-m', segments: [home, sessionCut], scale: [900, 1200], poster: 'poster' }] } };
}
