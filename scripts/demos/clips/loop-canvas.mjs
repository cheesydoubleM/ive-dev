// Clip: a loop drawn in Pipelines. ⌘⇧L opens "Choose a Pipeline" with the six presets that
// ship with 1.0.17; the saved "Sign-in checks loop" (the RALPH preset's graph with a fixed
// Execute prompt) is opened and run: Execute → Verify → Evaluate; the failed check takes the
// "Fix issues" edge to Fix, which loops back to Verify ("Cycle 2 of 20"); the second check
// passes and the run completes. Run Detail then lists the stages.
//
// Provenance: IVE app 1.0.17 · demo project · no provider ran. The presets are the engine's own
// definitions (lib/presets-1.0.17.json, extracted from backend/pipeline_engine.py PRESETS).
// The saved pipeline, its run and the stage reports are demo data; run states are broadcast as
// `pipeline_run_update` in the engine's order (a loop-back resets Verify, Evaluate and Fix).
// A preset is never run from the editor: in 1.0.17 that fails for presets that use {topic}.
import { readFileSync } from 'node:fs';
import { openDemo, session, addSession, iso } from '../lib/fixture.mjs';
import { pending, running, done } from '../lib/graph.mjs';

export const meta = { id: 'loop-canvas', title: 'Draw your own loop', seconds: 16 };
export const encoding = { loopFade: 0, poster: 'poster' };

const { presets } = JSON.parse(readFileSync(new URL('../lib/presets-1.0.17.json', import.meta.url), 'utf8'));
const TESTER = '9a4f2b61-tester';

export async function record(wrapped, rec) {
  // Presets as the backend lists them: global (workspace_id null), preset = 1, active.
  const presetRows = Object.entries(presets).map(([key, v], i) => ({ id: `preset-${key}`, ...v, workspace_id: null, preset: 1, preset_key: key, status: 'active', triggers: v.triggers || [], created_at: iso(900 - i) }));
  const ralph = presets['ralph-pipeline'];
  // The user's own loop: the RALPH graph, a concrete Execute prompt, nodes placed by the user.
  const placed = { execute: { x: 400, y: 200 }, verify: { x: 700, y: 200 }, evaluate: { x: 1000, y: 200 }, fix: { x: 850, y: 380 } };
  const custom = {
    id: 'pipe-signin', name: 'Sign-in checks loop', description: 'Execute, verify and fix until the sign-in checks pass.', workspace_id: 'orbit', preset: 0, status: 'active', triggers: [], created_at: iso(40),
    stages: ralph.stages.map((s) => ({ ...s, position: placed[s.id], ...(s.id === 'execute' ? { prompt_template: 'Make the sign-in checks in tests/sign-in.spec.js pass. Do the work completely.' } : {}) })),
    transitions: ralph.transitions,
  };
  const f = await openDemo(wrapped, { pipelines: [...presetRows, custom] });
  const p = f.page;
  // The backend lists global presets with the project's pipelines; the transport filters them out.
  await f.context.route('**/api/pipelines?*', (route) => {
    const ws = new URL(route.request().url()).searchParams.get('workspace_id');
    route.fulfill({ json: f.data.pipelines.filter((d) => !ws || !d.workspace_id || d.workspace_id === ws) });
  });
  // "Run" from the editor: the backend creates the run and starts the first stage.
  await f.context.route('**/api/pipeline-runs', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    const body = route.request().postDataJSON();
    const defn = f.data.pipelines.find((d) => d.id === body.pipeline_id);
    const hist = Object.fromEntries(defn.stages.map((s) => [s.id, pending()]));
    hist.execute = running('interface');
    const item = { id: 'run-signin', pipeline_id: defn.id, workspace_id: 'orbit', task_id: null, status: 'running', current_stages: ['execute'], iteration: 1, max_iterations: 20, created_at: iso(), started_at: iso(), variables: body.variables || {}, stage_history: hist, trigger_type: 'manual' };
    f.data.runs.push(item);
    f.controls.setSessionStatus('interface', 'running');
    return route.fulfill({ status: 201, json: item });
  });
  const push = (patch) => { const r = f.data.runs.find((x) => x.id === 'run-signin'); Object.assign(r, structuredClone(patch), { updated_at: iso() }); f.controls.broadcast({ type: 'pipeline_run_update', run: r }); };
  const H = () => structuredClone(f.data.runs.find((x) => x.id === 'run-signin').stage_history);

  const r = await rec(p, f.context);
  await r.start();
  await r.hold(0.6);
  await r.press('Meta+Shift+L', 0);
  await r.untilVisible(p.getByText('Choose a Pipeline', { exact: true }));
  await r.hold(1.3);
  await r.click(p.getByText('Sign-in checks loop', { exact: true }), { duration: 0.8, after: 0 });
  await r.untilVisible(p.getByRole('button', { name: /^Run$/ }));
  r.mark('canvas');
  await r.hold(0.8);
  await r.click(p.getByRole('button', { name: /^Run$/ }), { duration: 0.7, after: 0 });
  await r.untilVisible(p.getByText(/Cycle 1 of 20/));
  await r.moveTo([1480, 900], { duration: 0.6 });
  await r.hold(0.6);

  // Execute reports pass; Verify starts in a testing session.
  addSession(f, session(TESTER, 'Pipeline Testing Worker (Claude Code)', 'claude', 'sonnet', 'running', { session_type: 'tester' }));
  let h = H(); h.execute = done('pass', 'Router guard sends expired sessions to /sign-in with the return path.', 'interface'); h.verify = running(TESTER);
  f.controls.setSessionStatus('interface', 'idle');
  push({ current_stages: ['verify'], stage_history: h });
  await r.hold(1.6);
  // Verify reports fail; Evaluate takes the "Fix issues" edge; Fix runs in Execute's session.
  h = H(); h.verify = done('fail', 'npm test: 13 passed, 1 failed. expired session keeps the return path.', TESTER); h.evaluate = done('fail', h.verify.output_summary); h.fix = running('interface');
  f.controls.setSessionStatus(TESTER, 'idle'); f.controls.setSessionStatus('interface', 'running');
  push({ current_stages: ['fix'], stage_history: h });
  await r.hold(1.8);
  // Fix reports pass: back to Verify, cycle 2; Verify, Evaluate and Fix reset.
  h = H(); for (const id of ['verify', 'evaluate', 'fix']) h[id] = pending(); h.verify = running(TESTER);
  f.controls.setSessionStatus('interface', 'idle'); f.controls.setSessionStatus(TESTER, 'running');
  push({ current_stages: ['verify'], iteration: 2, stage_history: h });
  await r.hold(0.5);
  await r.snap('poster');
  await r.hold(1.1);
  // Verify passes, Evaluate passes: the run is complete.
  h = H(); h.verify = done('pass', 'npm test: 14 passed, 0 failed.', TESTER); h.evaluate = done('pass', 'npm test: 14 passed, 0 failed.');
  f.controls.setSessionStatus(TESTER, 'idle');
  push({ status: 'completed', current_stages: [], completed_at: iso(), stage_history: h });
  await r.hold(1.3);
  await r.click(p.getByRole('button', { name: 'Run Detail' }), { duration: 0.7, after: 0 });
  await r.untilVisible(p.getByText('Pipeline Run', { exact: true }));
  r.mark('detail');
  await r.hold(2.4);
  await r.stop();

  // Phones (3:4): the presets, then the canvas with Verify, Evaluate, Fix and the cycle counter,
  // then the stage list of Run Detail.
  return { fixture: f, encoding: { crops: [{ suffix: '-m', scale: [900, 1200], poster: 'poster', segments: [
    { from: 0, x: 704, y: 160, w: 1200, h: 1600 },
    { from: 'canvas', x: 1380, y: 100, w: 1200, h: 1600 },
    { from: 'detail', x: 24, y: 24, w: 1200, h: 1600 },
  ] }] } };
}
