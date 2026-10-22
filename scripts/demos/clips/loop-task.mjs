// Clip: the Auto-fix loop in the guided task ("Turn your request into a result").
// The plan waits for approval; after "Approve plan & start" the work is checked by a fresh
// testing session, the failed check goes back to the implementing session with its report,
// the fix is checked again in a second testing session, and the result is ready to accept
// ("Accept result"). Run details then shows the completed run at "Cycle 2 of 3".
//
// Provenance: IVE app 1.0.17 · demo project · no provider ran. The task, the reports and the
// pipeline sessions are demo data. The stage graph is the one 1.0.17 generates for a guided
// task (lib/graph.mjs, a port of pipeline_engine.py::_start_task_execution_pipeline) and every
// run state is pushed in the engine's own order (research 05, section 3.3). Plan approval and
// acceptance go through the app's real requests, answered by the test transport.
// Label note: the 1.0.17 release shows the cancel button of this window in German ("Run abbrechen").
// The frontend used here (ive-oss 951a002) ships the English label "Cancel run"; with a build that
// still has the German label, lib/fixture.mjs replaces exactly that label in flight.
import { openDemo, demoSessions, transcripts, session, addSession, advanceUntil, iso } from '../lib/fixture.mjs';
import { taskExecutionGraph, pending, running, done } from '../lib/graph.mjs';

export const meta = { id: 'loop-task', title: 'Build, check, fix, repeat', seconds: 19 };
export const encoding = { loopFade: 0, poster: 'poster', crf: 26 };

// Pipeline sessions as the engine names them: "Pipeline <Role> (<CLI label>)".
const SID = {
  planner: '5f3c9a1e-planner', critic: '8b21d4c7-critic', worker: 'c4e07f93-worker',
  tester1: '2d9e6b58-tester', tester2: 'e71a3c04-tester',
};
const pipelineSession = (id, role, model, status = 'idle', minAgo = 1) => session(id, `Pipeline ${role} (Claude Code)`, 'claude', model, status, { session_type: role === 'Testing Worker' ? 'tester' : role === 'Planner' ? 'planner' : 'worker', created_at: iso(minAgo), last_active_at: iso(minAgo) });

const REPORT = {
  plan: '1. Read the router guard in `src/app/routes.js` and `src/lib/auth.js`.\n2. Send expired sessions to `/sign-in` and keep the return path.\n3. Run `npm test` (tests/sign-in.spec.js).',
  critic: 'Concrete and bounded: two source files and one test file. Safe to execute.',
  implement: 'Before: expired sessions went to `/`. Now the router guard sends them to `/sign-in?return=…`. Files: `src/app/routes.js`, `src/lib/auth.js`.',
  verify1: 'npm test: 13 passed, 1 failed.\nFAIL tests/sign-in.spec.js › expired session keeps the return path\nExpected /sign-in?return=%2Fworkspace, received /sign-in.',
  fix: 'Kept the return path when the guard redirects; `routes.js` passes `location.pathname` to `/sign-in`.',
  verify2: 'npm test: 14 passed, 0 failed.\nChecked: an expired session lands on /sign-in?return=…; signing in returns to the workspace.',
};

export async function record(wrapped, rec) {
  const g = taskExecutionGraph({ plan_first: true, test_with_agent: true, ralph_loop: true, require_result_review: true });
  const task = { id: 'task-redirect', workspace_id: 'orbit', title: 'Fix the expired-session redirect', description: 'After an expired session the app redirects to / instead of /sign-in. Send it to /sign-in and keep the sign-in checks passing.', acceptance_criteria: 'Expired sessions land on /sign-in.\nAll sign-in checks pass.', status: 'planning', pipeline_stage: 'awaiting_plan_approval', priority: 2, labels: 'ive-guided', pipeline: 1, plan_first: 1, ralph_loop: 1, test_with_agent: 1, pipeline_max_iterations: 3, iteration: 1, created_at: iso(20), updated_at: iso(2) };
  const pipeline = { id: 'pipe-redirect', name: `Task Execution - ${task.title}`, description: 'Generated visible task execution pipeline.', workspace_id: 'orbit', status: 'active', preset: 0, stages: g.stages, transitions: g.transitions, triggers: [] };
  const hist = Object.fromEntries(g.stages.map((s) => [s.id, pending()]));
  hist.plan = done('pass', REPORT.plan, SID.planner);
  hist.plan_critic = done('pass', REPORT.critic, SID.critic);
  hist.plan_gate = done('pass', 'Concrete and bounded.');
  hist.approval = { ...running(), output_summary: 'waiting_for_plan_approval: resume this pipeline run after approving the plan.' };
  const run = { id: 'run-redirect', pipeline_id: pipeline.id, task_id: task.id, workspace_id: 'orbit', status: 'paused', current_stages: ['approval'], iteration: 1, max_iterations: 3, created_at: iso(6), started_at: iso(6), updated_at: iso(2), variables: { execution_context: '', require_result_review: true }, stage_history: hist, trigger_type: 'task_execute' };
  const sessions = [...demoSessions(), pipelineSession(SID.planner, 'Planner', 'opus', 'idle', 6), pipelineSession(SID.critic, 'Planner', 'opus', 'idle', 4)];

  const f = await openDemo(wrapped, { sessions, messages: transcripts, tasks: [task], runs: [run], pipelines: [pipeline] });
  const p = f.page;
  const R = () => f.data.runs.find((r) => r.id === run.id);
  const H = () => structuredClone(R().stage_history);
  // The guided task window polls its task and runs every 3.5 s: let the poll happen off camera.
  const shows = (text) => advanceUntil(f, async () => (await p.getByText(text, { exact: true }).count()) > 0, { stepMs: 250, maxMs: 8000 });
  await p.locator('.ive-needs-you').waitFor({ timeout: 10000 });
  await p.waitForTimeout(400);

  const r = await rec(p, f.context);
  await r.start();
  await r.hold(0.8);
  await r.click(p.locator('.ive-needs-you'), { duration: 0.8, after: 0 });
  await r.untilVisible(p.locator('.ive-attention-item'));
  await r.hold(0.7);
  await r.click(p.locator('.ive-attention-item .ive-btn--primary').first(), { duration: 0.6, after: 0 });
  await r.untilVisible(p.getByRole('button', { name: 'Approve plan & start' }));
  r.mark('window');
  await r.hold(1.0);

  // S1: plan approved (the transport resumes the run), Implement starts in a new worker session.
  await r.click(p.getByRole('button', { name: 'Approve plan & start' }), { duration: 0.7, after: 0.1 });
  addSession(f, pipelineSession(SID.worker, 'Worker', 'sonnet', 'running', 0));
  { const h = H(); h.implement = running(SID.worker); f.controls.setRun(run.id, { stage_history: h }, {}); }
  await shows('Working');
  await r.hold(0.9);

  // S2: the implementer reports pass; Verify runs in a fresh testing session.
  f.controls.setSessionStatus(SID.worker, 'idle');
  addSession(f, pipelineSession(SID.tester1, 'Testing Worker', 'sonnet', 'running', 0));
  { const h = H(); h.implement = done('pass', REPORT.implement, SID.worker); h.verify = running(SID.tester1); f.controls.setRun(run.id, { current_stages: ['verify'], stage_history: h }, {}); }
  await shows('Checking the result');
  await r.hold(1.0);

  // S3: the check fails; the gate sends the report back to the implementing session (Fix).
  f.controls.setSessionStatus(SID.tester1, 'idle');
  f.controls.setSessionStatus(SID.worker, 'running');
  { const h = H(); h.verify = done('fail', REPORT.verify1, SID.tester1); h.verify_gate = done('fail', REPORT.verify1); h.fix = running(SID.worker); f.controls.setRun(run.id, { current_stages: ['fix'], stage_history: h }, {}); }
  await shows('Fixing issues');
  await r.hold(0.4);
  await r.scrollBy(p.getByText('Proposed plan', { exact: true }).first(), 520, { duration: 0.8 });
  await r.snap('poster');
  await r.hold(1.4);

  // S4: the fix reports pass and loops back: cycle 2, downstream stages reset, a second testing session.
  f.controls.setSessionStatus(SID.worker, 'idle');
  addSession(f, pipelineSession(SID.tester2, 'Testing Worker', 'sonnet', 'running', 0));
  { const h = H(); for (const id of ['verify', 'verify_gate', 'fix', 'done']) h[id] = pending(); h.verify = running(SID.tester2); f.controls.setRun(run.id, { current_stages: ['verify'], iteration: 2, stage_history: h }, {}); }
  await shows('Checking the result');
  await r.hold(1.2);

  // S5: the second check passes; the run completes and the result waits for review.
  f.controls.setSessionStatus(SID.tester2, 'idle');
  { const h = H(); h.verify = done('pass', REPORT.verify2, SID.tester2); h.verify_gate = done('pass', REPORT.verify2); h.done = done('pass', 'Verification passed. Review the implementation and verification reports before accepting.'); f.controls.setRun(run.id, { status: 'completed', current_stages: [], completed_at: iso(), stage_history: h }, { status: 'review', pipeline_stage: 'review' }); }
  await shows('Review the result');
  await r.hold(0.5);
  // Back to the top of the window, where the next step and its buttons are.
  await r.scrollBy(p.getByText('Proposed plan', { exact: true }).first(), -900, { duration: 0.7 });
  await r.hold(0.3);
  // "Accept result" is enabled only now (completed run, passing check). Accepting would close
  // this window (it was opened from Needs your attention), so the clip points at it and then
  // opens Run details instead.
  await r.moveTo(p.getByRole('button', { name: 'Accept result' }), { duration: 0.7 });
  await r.hold(0.6);
  await r.click(p.getByRole('button', { name: 'Run details' }), { duration: 0.6, after: 0 });
  await r.untilVisible(p.getByText('Pipeline Run', { exact: true }));
  r.mark('detail');
  await r.hold(2.2);
  await r.stop();
  // Phones (3:4, full window height): the attention list, then the left 750 CSS px of the task
  // window (steps, next step, report titles and texts), then the stage list of Run details.
  const cut = (from, x) => ({ from, x, y: 0, w: 1500, h: 2000 });
  return { fixture: f, encoding: { crops: [{ suffix: '-m', scale: [900, 1200], poster: 'poster', segments: [cut(0, 24), cut('window', 524), cut('detail', 24)] }] } };
}
