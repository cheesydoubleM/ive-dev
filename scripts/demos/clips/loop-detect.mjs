// Clip: loop detection. The agent in "Check the sign-in flow" runs the same `npm test` three
// times with the same failing result; IVE shows "Loop detected in Check the sign-in flow:
// repeated Bash with same input 3 times", and when the turn ends the corrective message reaches
// the agent as its next user turn. The agent changes course: it reads the spec, then edits the route.
//
// Provenance: IVE app 1.0.17 · demo project · no provider ran. Doom Loop Detection is an
// experimental feature that 1.0.17 seeds ON (backend/experimental.py, database_seeds.py). The
// warning event and the corrective text are the backend's own (backend/hooks.py: the
// `doom_loop_warning` broadcast and the W2W nudge delivered at the next idle); here the
// transport sends them, and the agent steps are demo data.
import { openDemo, agentStep, pushAssistant, msg, viewportFor } from '../lib/fixture.mjs';
import { createCamera } from '../lib/camera.mjs';

export const meta = { id: 'loop-detect', title: 'Caught going in circles', seconds: 10 };
export const encoding = { loopFade: 0, poster: 'poster' };

const PATTERN = 'repeated Bash with same input 3 times';
const NUDGE = `⚠️ [W2W] [Commander] Loop detected: ${PATTERN}. You appear to be stuck in a repetitive pattern. Stop and try a fundamentally different approach — different tool, different strategy, or ask the user for clarification.`;
const npmTest = (n) => [
  { type: 'tool_use', id: `n${n}`, name: 'Bash', input: { command: 'npm test', description: 'Run the sign-in checks' } },
  { type: 'tool_result', tool_use_id: `n${n}`, content: '13 passed, 1 failed\nFAIL tests/sign-in.spec.js › expired session keeps the return path' },
];

export async function record(wrapped, rec, { phone = false } = {}) {
  const messages = { checks: [msg('checks', 'user', 'Make the sign-in checks pass: empty state, expired session, and the return to the workspace.', 2)] };
  const f = await openDemo(wrapped, { messages, viewport: viewportFor(phone) });
  const p = f.page;
  await p.getByText('Check the sign-in flow', { exact: true }).first().click();
  await p.waitForTimeout(1200);
  f.controls.setSessionStatus('checks', 'running');
  await agentStep(f, 'checks', npmTest(1));
  await p.waitForTimeout(600);

  const r = await rec(p, f.context);
  // Phone cut: the main column (steps, the warning, the corrective turn) fits the 498 px cut.
  const cam = phone ? createCamera(p) : null;
  await r.start();
  if (cam) { const main = await p.locator('main').first().boundingBox(); cam.to(r, main.x + 10); }
  await r.hold(0.6);
  // Open the running step so each identical call is visible as it lands.
  await r.click(p.getByText('Run the sign-in checks').first(), { duration: 0.6, after: 0.4 });
  await agentStep(f, 'checks', npmTest(2));
  await r.hold(0.9);
  await agentStep(f, 'checks', npmTest(3));
  await r.hold(0.7);

  // The backend's detector fires after the third identical call.
  f.controls.broadcast({ type: 'doom_loop_warning', session_id: 'checks', pattern: PATTERN });
  await p.getByText(/Loop detected in/).first().waitFor();
  r.mark('toast');
  await r.hold(0.4);
  await r.snap('poster');
  await r.hold(1.3);

  // The turn ends; at the idle the warning is typed into the session as the next user turn.
  pushAssistant(f, 'checks', [{ type: 'text', text: 'Still 1 failing check: expired session keeps the return path.' }], { done: true });
  await r.settle(150);
  f.controls.addMessage('checks', 'user', NUDGE);
  f.controls.setSessionStatus('checks', 'running');
  await p.evaluate(() => window.dispatchEvent(new CustomEvent('cc-session-messages-refresh', { detail: { sessionId: 'checks' } })));
  await r.settle(300);
  await p.getByText(/You appear to be stuck/).first().waitFor();
  await r.hold(1.4);
  r.mark('nudge');
  await agentStep(f, 'checks', [{ type: 'thinking', thinking: 'Running the suite again will not change the result. The failing case is about the return path, so read the spec first.' }, { type: 'tool_use', id: 'd1', name: 'Read', input: { file_path: 'tests/sign-in.spec.js' } }]);
  await r.hold(1.0);
  await agentStep(f, 'checks', [{ type: 'tool_result', tool_use_id: 'd1', content: '96 lines. The case expects /sign-in?return=%2Fworkspace.' }, { type: 'tool_use', id: 'd2', name: 'Edit', input: { file_path: 'src/app/routes.js', description: 'Pass the return path to /sign-in' } }]);
  await r.hold(2.4);
  await r.stop();

  if (!phone) return { fixture: f };
  return { fixture: f, encoding: { crops: [{ suffix: '-m', poster: 'poster', segments: cam.segments() }] } };
}
