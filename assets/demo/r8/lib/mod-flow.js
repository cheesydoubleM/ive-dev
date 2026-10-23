// Module "flow" of the IVE app built into the site (lib/app.js): the guided task
// "Fix the expired-session redirect" (TaskFlow). The task waits for plan approval in "Needs your
// attention"; a visitor reviews it, approves the plan, and the run plays in the background:
// Implement in a Pipeline Worker session, Verify in a Testing Worker, the failed check goes back
// with its report (Fix), cycle 2 verifies and passes, the result waits for review; Accept result
// closes the task; Run details shows the run's stages. Everything is demo data; no provider runs.
//
// State: state.flow = { open: null|'attention'|'task'|'run', stage: 'approval'|'implement'|'verify'|'fix'|'review'|'accepted',
//   cycle, reports, sections, timeline: [{ at, fn }], selectedStage, runStart, runEnd, taskSessions: [ids] }
// Reacts to: .ive-needs-you (when the task needs attention), [data-demo-open="task"],
//   .ive-recent-session[data-key="task-attention"], [data-demo-dialog="attention"] rows and Close,
//   [data-demo-dialog="task"] buttons [data-tour="plan-approve|run-details|run-cancel|result-accept|result-changes"],
//   report "Session" links, Close; [data-demo-dialog="run"] stage buttons, session links, Close; Escape.
import { attentionDialog, taskWindow, runDetails, taskBoard } from './taskflow.js';
import { prompt, say } from './term.js';

const TASK = {
  title: 'Fix the expired-session redirect', workspace: 'Orbit', path: '/Projects/orbit',
  description: 'After an expired session the app redirects to / instead of /sign-in. Send it to /sign-in and keep the sign-in checks passing.',
  acceptance: 'Expired sessions land on /sign-in.\nAll sign-in checks pass.',
};
const REPORT = {
  plan: { result: 'pass', text: 'plan', list: ['Read the router guard in `src/app/routes.js` and `src/lib/auth.js`.', 'Send expired sessions to `/sign-in` and keep the return path.', 'Run `npm test` (tests/sign-in.spec.js).'] },
  critic: { result: 'pass', text: 'Concrete and bounded: two source files and one test file. Safe to execute.' },
  implement: { result: 'pass', text: 'Before: expired sessions went to `/`. Now the router guard sends them to `/sign-in?return=…`. Files: `src/app/routes.js`, `src/lib/auth.js`.' },
  verify1: { result: 'fail', text: 'npm test: 13 passed, 1 failed.\nFAIL tests/sign-in.spec.js › expired session keeps the return path\nExpected /sign-in?return=%2Fworkspace, received /sign-in.' },
  fix: { result: 'pass', text: 'Kept the return path when the guard redirects; `routes.js` passes `location.pathname` to `/sign-in`.' },
  verify2: { result: 'pass', text: 'npm test: 14 passed, 0 failed.\nChecked: an expired session lands on /sign-in?return=…; signing in returns to the workspace.' },
};
const PLAN_SUMMARY = '1. Read the router guard in `src/app/routes.js` and `src/lib/auth.js`.\n2. Send expired sessions to `/sign-in` and keep the return path.\n3. Run `npm test` (tests/sign-in.spec.js).';
const STAGES = [
  { id: 'plan', name: 'Plan', kind: 'agent' }, { id: 'plan_critic', name: 'Plan Review', kind: 'agent' }, { id: 'plan_gate', name: 'Plan Gate', kind: 'condition' },
  { id: 'approval', name: 'Plan Approval', kind: 'approval' }, { id: 'implement', name: 'Implement', kind: 'agent' }, { id: 'verify', name: 'Verify', kind: 'agent' },
  { id: 'verify_gate', name: 'Verify Gate', kind: 'condition' }, { id: 'fix', name: 'Fix', kind: 'agent' }, { id: 'done', name: 'Ready for Review', kind: 'task_update' },
];
const SECTIONS = {
  approval: [['Proposed plan', 'plan'], ['Plan review', 'critic']],
  implement: [['Proposed plan', 'plan'], ['Plan review', 'critic'], ['What changed', 'implement']],
  verify: [['Proposed plan', 'plan'], ['Plan review', 'critic'], ['What changed', 'implement'], ['Test evidence', 'verify']],
  fix: [['Proposed plan', 'plan'], ['Plan review', 'critic'], ['What changed', 'implement'], ['Corrections', 'fix'], ['Test evidence', 'verify']],
  verify2: [['Proposed plan', 'plan'], ['Plan review', 'critic'], ['What changed', 'implement'], ['Corrections', 'fix'], ['Test evidence', 'verify']],
  review: [['Proposed plan', 'plan'], ['Plan review', 'critic'], ['What changed', 'implement'], ['Corrections', 'fix'], ['Test evidence', 'verify']],
};
const ATTENTION_ROW = 'task-attention';
const WORKER = 'pipeline-worker';
const TESTER = (n, f) => `${f?.taskIndex ? 'task-' + f.taskIndex + '-' : ''}pipeline-tester-${n}`;
const worker = f => `${f.taskIndex ? 'task-' + f.taskIndex + '-' : ''}${WORKER}`;

/* ── canned programs of the pipeline sessions (the core's agent events) ── */
const ev = (d, kind, extra = {}) => ({ d, kind, ...extra });
const S = (tool, input, result) => ({ tool, input, result });
const PROGRAMS = {
  implement: [
    ev(1.0, 'step', { step: S('Read', 'src/app/routes.js', 'Read 212 lines') }),
    ev(1.1, 'step', { step: S('Read', 'src/lib/auth.js', 'Read 96 lines') }),
    ev(1.3, 'step', { step: S('Update', 'src/app/routes.js', 'Added 6 lines, removed 2 lines') }),
    ev(1.0, 'step', { step: S('Update', 'src/lib/auth.js', 'Added 3 lines, removed 1 line') }),
    ev(1.1, 'say', { text: 'Expired sessions now go to `/sign-in?return=…` instead of `/`. Reported pass for Implement.' }),
    ev(0.2, 'done'),
  ],
  verify1: [
    ev(0.9, 'step', { step: S('Read', 'tests/sign-in.spec.js', 'Read 96 lines, 3 cases') }),
    ev(1.8, 'step', { step: S('Bash', 'npm test', '13 passed, 1 failed (3.4 s)') }),
    ev(1.0, 'say', { text: 'One check fails: expired session keeps the return path. Expected /sign-in?return=%2Fworkspace, received /sign-in. Reported failure.' }),
    ev(0.2, 'done'),
  ],
  fix: [
    ev(1.0, 'step', { step: S('Read', 'tests/sign-in.spec.js', 'Read 96 lines') }),
    ev(1.3, 'step', { step: S('Update', 'src/app/routes.js', 'Added 4 lines, removed 1 line') }),
    ev(1.6, 'step', { step: S('Bash', 'npm test', '14 passed, 0 failed (3.2 s)') }),
    ev(1.0, 'say', { text: 'Kept the return path when the guard redirects; `routes.js` passes `location.pathname` to `/sign-in`. Reported pass for Fix.' }),
    ev(0.2, 'done'),
  ],
  verify2: [
    ev(0.9, 'step', { step: S('Read', 'tests/sign-in.spec.js', 'Read 96 lines, 3 cases') }),
    ev(1.8, 'step', { step: S('Bash', 'npm test', '14 passed, 0 failed (3.1 s)') }),
    ev(1.0, 'say', { text: 'All 14 checks pass: an expired session lands on /sign-in?return=…; signing in returns to the workspace. Reported pass.' }),
    ev(0.2, 'done'),
  ],
};
const PROMPTS = {
  implement: 'Implement the approved plan for "Fix the expired-session redirect": send expired sessions to /sign-in and keep the return path.',
  verify: 'Verify the implementation of "Fix the expired-session redirect" against the acceptance criteria. Run tests/sign-in.spec.js.',
  fix: 'The check failed: expired session keeps the return path (expected /sign-in?return=%2Fworkspace, received /sign-in). Fix it.',
};

/* ── helpers ── */
const flowOf = (st) => st.flow;
const needsAttention = (f) => f.stage === 'approval' || f.stage === 'review';

function revisePlan(st, api) {
  const f = flowOf(st), request = f.revision.trim();
  if (!request || f.stage !== 'approval') return;
  f.plans.push(structuredClone(f.reports.plan));
  f.instructions = [f.instructions, request].filter(Boolean).join('\n');
  f.reports.plan = { result: 'pass', text: 'Revised plan', list: [...(f.reports.plan.list || []), request] };
  f.reports.critic = { result: 'pass', text: `The revised plan includes your request: ${request}. Review it before work begins.` };
  f.revision = ''; f.details.revision = false; f.notice = 'Plan revised. Your approval is still required.'; f.scrollTop = true;
  syncAttention(st);
}

function followUp(st, api) {
  const f = flowOf(st), request = f.feedback.trim();
  if (!request || f.stage !== 'review') return;
  f.history.push({ id: `task-${f.taskIndex}`, taskIndex: f.taskIndex, task: structuredClone(f.task), stage: f.stage, cycle: f.cycle,
    reports: structuredClone(f.reports), sections: structuredClone(f.sections), planVersion: f.plans.length, plans: structuredClone(f.plans), followUp: true });
  f.taskIndex += 1;
  f.task = { ...TASK, title: `Follow-up ${f.taskIndex} · ${TASK.title}`, description: request, acceptance: `${request}\n${TASK.acceptance}` };
  f.instructions = request; f.feedback = ''; f.revision = ''; f.inspect = null; f.stage = 'approval'; f.cycle = 1;
  f.reports = { plan: { result: 'pass', text: 'Follow-up plan', list: ['Read the previous result and its verification report.', request, 'Run the sign-in checks and review the result.'] }, critic: { result: 'pass', text: 'The follow-up keeps the previous result and adds your feedback to the next plan.' }, implement: null, fix: null, verify: null };
  f.sections = SECTIONS.approval; f.timeline = []; f.runStart = null; f.runEnd = null; f.runId = `follow-up-${f.taskIndex}`;
  f.taskSessions = []; f.plans = []; f.details = {}; f.notice = 'Follow-up created. Review and approve its plan.'; f.scrollTop = true;
  syncAttention(st);
}

function openStage(st, api, f, stage) {
  let sid, name, instruction, text;
  if (stage === 'plan' || stage === 'plan_critic') {
    sid = `pipeline-${stage}-${f.taskIndex || 0}-${f.planVersion ?? f.plans?.length ?? 0}`;
    name = stage === 'plan' ? 'Pipeline Planner (Claude Code)' : 'Pipeline Plan Reviewer (Claude Code)';
    instruction = stage === 'plan' ? `Plan: ${(f.task || TASK).description}` : 'Review the proposed plan against the task requirements.';
    const r = stage === 'plan' ? f.reports.plan : f.reports.critic;
    text = r?.list?.join('\n') || r?.text || 'The plan is waiting for review.';
  } else {
    sid = stage === 'verify' ? (api.session(TESTER(2, f)) ? TESTER(2, f) : TESTER(1, f)) : worker(f);
    name = stage === 'verify' ? 'Pipeline Testing Worker (Claude Code)' : 'Pipeline Worker (Claude Code)';
    instruction = stage === 'verify' ? PROMPTS.verify : PROMPTS.implement;
    text = stage === 'verify' ? f.reports.verify?.text : f.reports.implement?.text;
    text ||= 'This step has not started yet. Approve the plan to begin.';
  }
  if (!api.session(sid)) api.addSession({ id: sid, name, cli: 'claude', model: 'sonnet', state: 'done', style: 'claude' }, {
    messages: [{ id: `${sid}-u`, role: 'user', text: instruction, time: api.now() }, { id: `${sid}-a`, role: 'assistant', text, time: api.now() }],
    lines: [...prompt(instruction, 70), ...say(text, 70)],
  });
  st.flow.open = null; st.modes[sid] = 'full'; api.go('session', sid);
}
function syncAttention(st) {
  const f = flowOf(st);
  const row = st.sessions.find((s) => s.id === ATTENTION_ROW);
  if (needsAttention(f) && !row) {
    st.sessions.push({ id: ATTENTION_ROW, name: (f.task || TASK).title, cli: 'claude', model: '', state: 'waiting', hidden: true, detail: f.stage === 'review' ? 'Result ready for review' : 'Plan approval needed', age: 'just now' });
  } else if (!needsAttention(f) && row) {
    st.sessions.splice(st.sessions.indexOf(row), 1);
  } else if (row) {
    row.detail = f.stage === 'review' ? 'Result ready for review' : 'Plan approval needed';
  }
}
function ensureSession(st, api, id, name, prompt) {
  if (!api.session(id)) {
    api.addSession({ id, name, cli: 'claude', model: 'sonnet', state: 'running', style: 'claude' }, { messages: [{ id: `${id}-u1`, role: 'user', text: prompt, time: api.now() }], lines: [`\x1b[2m> ${prompt}\x1b[0m`, ''] });
    flowOf(st).taskSessions.push(id);
  } else {
    st.msgs[id].push({ id: `${id}-u${st.msgs[id].length}`, role: 'user', text: prompt, time: api.now() });
    st.terms[id].content.push(`\x1b[2m> ${prompt}\x1b[0m`, '');
  }
  st.msgs[id].push({ id: `${id}-a${st.msgs[id].length}`, role: 'assistant', running: true, steps: [] });
  st.terms[id].spinner = '\x1b[33m✻\x1b[0m \x1b[2mWorking… (0s · esc to interrupt)\x1b[0m';
}
function stopAgent(st, api, id) {
  if (st.agents[id]) delete st.agents[id];
  const term = st.terms[id];
  if (term) term.spinner = null;
  const msgs = st.msgs[id] || [];
  const g = [...msgs].reverse().find((m) => m.role === 'assistant' && m.running);
  if (g) g.running = false;
  api.setState(id, 'done');
}

/** The run after approval: stage transitions on the app clock; the pipeline sessions work meanwhile. */
function startRun(st, api) {
  const f = flowOf(st);
  const t0 = st.clock;
  f.stage = 'implement'; f.cycle = 1; f.sections = SECTIONS.implement; f.reports = { ...f.reports, implement: null, fix: null, verify: null };
  f.runStart = t0; f.runEnd = null; f.cancelled = false; f.runId = 'run-' + Math.random().toString(36).slice(2, 6);
  f.stageStarted = { implement: t0 };
  ensureSession(st, api, worker(f), 'Pipeline Worker (Claude Code)', `${PROMPTS.implement}${f.instructions ? '\nAdditional requirements: ' + f.instructions : ''}`);
  api.startAgent(worker(f), PROGRAMS.implement, { delay: 0.8 });
  f.timeline = [
    { at: t0 + 7.0, fn: (s, a) => {
      f.stage = 'verify'; f.reports.implement = REPORT.implement; f.sections = SECTIONS.verify; f.stageStarted.verify = s.clock;
      stopAgent(s, a, worker(f));
      ensureSession(s, a, TESTER(1, f), 'Pipeline Testing Worker (Claude Code)', PROMPTS.verify);
      a.startAgent(TESTER(1, f), PROGRAMS.verify1, { delay: 0.8 });
    } },
    { at: t0 + 12.0, fn: (s, a) => {
      f.stage = 'fix'; f.reports.verify = REPORT.verify1; f.sections = SECTIONS.fix; f.stageStarted.fix = s.clock;
      stopAgent(s, a, TESTER(1, f));
      ensureSession(s, a, worker(f), 'Pipeline Worker (Claude Code)', PROMPTS.fix);
      a.startAgent(worker(f), PROGRAMS.fix, { delay: 0.8 });
    } },
    { at: t0 + 18.0, fn: (s, a) => {
      f.stage = 'verify'; f.cycle = 2; f.reports.fix = REPORT.fix; f.reports.verify = null; f.sections = SECTIONS.verify2; f.stageStarted.verify2 = s.clock;
      stopAgent(s, a, worker(f));
      ensureSession(s, a, TESTER(2, f), 'Pipeline Testing Worker (Claude Code)', PROMPTS.verify);
      a.startAgent(TESTER(2, f), PROGRAMS.verify2, { delay: 0.8 });
    } },
    { at: t0 + 23.0, fn: (s, a) => {
      f.stage = 'review'; f.reports.verify = REPORT.verify2; f.sections = SECTIONS.review; f.runEnd = s.clock;
      stopAgent(s, a, TESTER(2, f));
      syncAttention(s);
      a.toast(`${(f.task || TASK).title}: the result is ready for your review.`);
    } },
  ];
  syncAttention(st);
}
function cancelRun(st, api) {
  const f = flowOf(st);
  f.timeline = [];
  for (const id of [worker(f), TESTER(1, f), TESTER(2, f)]) if (api.session(id)) stopAgent(st, api, id);
  f.stage = 'approval'; f.cycle = 1; f.sections = SECTIONS.approval; f.reports = { plan: f.reports.plan, critic: f.reports.critic, implement: null, fix: null, verify: null };
  f.cancelled = true; f.runEnd = st.clock;
  syncAttention(st);
  api.toast('Run cancelled. The plan waits for your approval again.');
}
function acceptResult(st, api) {
  const f = flowOf(st);
  f.stage = 'accepted'; f.open = null;
  syncAttention(st);
  api.toast(`Result accepted: ${(f.task || TASK).title} is complete.`);
}

/* ── the run's stages for Run details ── */
const fmt = (secs) => (secs < 60 ? `${Math.max(1, Math.round(secs))}s` : `${Math.floor(secs / 60)}m ${Math.round(secs % 60)}s`);
function runStages(f, st) {
  const done = (id, result = 'pass', duration = '1m') => ({ ...STAGES.find((x) => x.id === id), status: 'completed', result, duration });
  const pend = (id) => ({ ...STAGES.find((x) => x.id === id), status: 'pending', result: null });
  const run = (id) => ({ ...STAGES.find((x) => x.id === id), status: 'running', result: null, duration: f.stageStarted && f.stageStarted[id] != null ? fmt(st.clock - f.stageStarted[id]) : '' });
  const base = [{ ...done('plan'), started: '10/23/2026 06:21 PM' }, done('plan_critic', 'pass', '40s'), done('plan_gate', 'pass', '1s')];
  const approval = f.stage === 'approval' ? run('approval') : { ...done('approval'), duration: '' };
  switch (f.stage) {
    case 'approval': return [...base, approval, pend('implement'), pend('verify'), pend('verify_gate'), pend('fix'), pend('done')];
    case 'implement': return [...base, approval, run('implement'), pend('verify'), pend('verify_gate'), pend('fix'), pend('done')];
    case 'verify': return f.cycle === 1
      ? [...base, approval, done('implement', 'pass', '7s'), run('verify'), pend('verify_gate'), pend('fix'), pend('done')]
      : [...base, approval, done('implement', 'pass', '7s'), run('verify'), pend('verify_gate'), done('fix', 'pass', '6s'), pend('done')];
    case 'fix': return [...base, approval, done('implement', 'pass', '7s'), done('verify', 'fail', '5s'), done('verify_gate', 'fail', '1s'), run('fix'), pend('done')];
    default: return [...base, approval, done('implement', 'pass', '7s'), done('verify', 'pass', '5s'), done('verify_gate', 'pass', '1s'), done('fix', 'pass', '6s'), done('done', 'pass', '1s')];
  }
}
const SUMMARY = (f, id) => ({
  plan: f.reports.plan?.list?.join('\n') || PLAN_SUMMARY, plan_critic: f.reports.critic?.text || REPORT.critic.text, plan_gate: 'Concrete and bounded. Pass.',
  approval: f.stage === 'approval' ? 'waiting_for_plan_approval: resume this pipeline run after approving the plan.' : 'Approved by you. The run continued with Implement.',
  implement: f.reports.implement ? f.reports.implement.text : 'Implement is running in Pipeline Worker (Claude Code).',
  verify: f.reports.verify ? f.reports.verify.text : 'Verify is running in Pipeline Testing Worker (Claude Code).',
  verify_gate: f.stage === 'fix' ? 'Reported failure: the report goes back to the implementing session (Fix).' : f.stage === 'review' || f.stage === 'accepted' ? 'Reported pass. Ready for review.' : 'Waits for the verification report.',
  fix: f.reports.fix ? f.reports.fix.text : f.stage === 'fix' ? 'Fix is running in Pipeline Worker (Claude Code).' : 'Not reached.',
  done: f.stage === 'review' || f.stage === 'accepted' ? 'Verification passed. Review the implementation and verification reports before accepting.' : 'Not reached.',
})[id] || '';
const STAGE_SESSION = { plan: 'Pipeline Planner (Claude Code)', plan_critic: 'Pipeline Plan Reviewer (Claude Code)', implement: 'Pipeline Worker (Claude Code)', fix: 'Pipeline Worker (Claude Code)', verify: 'Pipeline Testing Worker (Claude Code)' };


/* ── the module ── */
export default {
  id: 'flow',
  init(state, env) {
    state.flow = {
      open: env.route === 'autofix' ? 'attention' : null,
      stage: 'approval', cycle: 1, reports: { plan: REPORT.plan, critic: REPORT.critic, implement: null, fix: null, verify: null },
      task: { ...TASK }, taskIndex: 0, revision: '', feedback: '', notice: '', instructions: '', history: [], plans: [], inspect: null,
      sections: SECTIONS.approval, timeline: [], selectedStage: 'plan', runStart: null, runEnd: null, taskSessions: [], runId: 'run-redi', details: {},
    };
    syncAttention(state);
  },
  overlays(state, ctx) {
    const f = flowOf(state);
    if (!f || !f.open) return '';
    if (f.open === 'attention') {
      const items = [];
      if (needsAttention(f)) items.push(f.stage === 'review'
        ? { action: 'task', title: (f.task || TASK).title, workspace: TASK.workspace, reason: 'Result ready for review', hint: 'Accept the result or request another pass.' }
        : { action: 'task', title: (f.task || TASK).title, workspace: TASK.workspace, reason: 'Plan approval needed', hint: 'Review the task to continue.' });
      for (const s of state.sessions) {
        if (s.state === 'waiting' && !s.hidden) items.push({ action: `session:${s.id}`, title: s.name, workspace: TASK.workspace, reason: s.detail || 'Needs your reply', hint: 'Answer it on the board or in the session.', button: 'Open' });
      }
      if (!items.length) items.push({ action: 'task', title: (f.task || TASK).title, workspace: TASK.workspace, reason: 'Nothing waits for you', hint: 'The task runs; follow it in its window.' });
      return attentionDialog({ items });
    }
    if (f.open === 'board') return taskBoard({ tasks: [...f.history.map(x=>({...x,current:false})), { id: 'current', task: f.task, stage: f.stage, current: true }] });
    if (f.open === 'task') { const shown = f.inspect ? f.history.find(x=>x.id===f.inspect) || f : f; return taskWindow({ task: shown.task || TASK, stage: shown.stage, reports: shown.reports, sections: shown.sections, details: f.details, revision: f.revision, feedback: f.feedback, notice: f.notice, readOnly: !!f.inspect, previousPlans: shown.plans || [] }); }
    const stages = runStages(f, state);
    const completed = f.stage === 'review' || f.stage === 'accepted';
    const elapsed = f.runStart != null ? fmt((f.runEnd ?? state.clock) - f.runStart) : '0s';
    const sel = f.selectedStage;
    return runDetails({
      task: f.task || TASK, runId: f.runId, cycle: f.cycle, maxCycles: 3, startedAt: '10/23/2026 06:21 PM', elapsed,
      stages, selected: sel, summary: SUMMARY(f, sel), session: STAGE_SESSION[sel] || null, narrow: ctx.width < 700,
      status: completed ? 'completed' : f.stage === 'approval' ? 'paused' : 'running',
    });
  },
  click(e, state, api) {
    const f = flowOf(state);
    if (!f) return false;
    const t = e.target;
    const closest = (sel) => (t && t.closest ? t.closest(sel) : null);
    const b = closest('button, [role="button"], summary');
    const dialog = closest('[data-demo-dialog]');
    // openers outside the dialogs
    if (!dialog) {
      if (b && b.classList.contains('ive-needs-you')) {
        if (needsAttention(f) || state.sessions.some((s) => s.state === 'waiting' && !s.hidden)) { f.open = 'attention'; return true; }
        return false;
      }
      if (b && b.matches('[data-demo-open="task"]')) { f.open = 'task'; f.inspect = null; if (api.ctx.width < 1000) state.sidebarOpen = false; return true; }
      if (b && b.classList.contains('ive-recent-session') && b.getAttribute('data-key') === ATTENTION_ROW) { f.open = 'task'; return true; }
      return false;
    }
    const kind = dialog.getAttribute('data-demo-dialog');
    if (!['attention','task','task-board','run'].includes(kind)) return false;
    // a click on the scrim closes the top dialog
    if (t === dialog) { f.open = kind === 'run' ? 'task' : null; return true; }
    if (!b) return closest('textarea, input, select, details') ? false : true;
    const label = b.getAttribute('aria-label') || '';
    if (kind === 'attention') {
      if (label === 'Close') { f.open = null; return true; }
      const row = closest('[data-attention-action]');
      const action = row ? row.getAttribute('data-attention-action') : '';
      if (action.startsWith('session:')) { f.open = null; api.go('board'); return true; }
      if (action) { f.open = 'task'; return true; }
      return true;
    }
    if (kind === 'task-board') {
      if (b.hasAttribute('data-demo-flow-task')) { f.inspect = b.getAttribute('data-demo-flow-task') === 'current' ? null : b.getAttribute('data-demo-flow-task'); f.open = 'task'; return true; }
      if (b.getAttribute('data-demo-flow-action') === 'close') { f.open = null; return true; }
      return true;
    }
    if (kind === 'task') {
      if (label === 'Close') { f.open = null; return true; }
      const tour = b.getAttribute('data-tour') || '';
      if (tour === 'plan-approve') { if (f.stage === 'approval') startRun(state, api); f.open = 'task'; return true; }
      if (tour === 'run-details') { f.open = 'run'; return true; }
      if (tour === 'run-cancel') { if (f.stage !== 'approval') cancelRun(state, api); else api.toast('Nothing runs yet: the plan waits for your approval.'); return true; }
      if (tour === 'result-accept') { acceptResult(state, api); return true; }
      if (tour === 'result-changes') { f.open = null; api.command('review', 'open'); return true; }
      if (b.getAttribute('data-demo-flow-action') === 'board') { f.open = 'board'; f.inspect = null; return true; }
      if (b.getAttribute('data-demo-flow-action') === 'current') { f.inspect = null; return true; }
      if (b.getAttribute('data-demo-flow-action') === 'revise') { revisePlan(state, api); return true; }
      if (b.getAttribute('data-demo-flow-action') === 'follow-up') { followUp(state, api); return true; }
      if (b.classList.contains('ive-text-action')) {
        const section = closest('.ive-flow-report');
        const title = section ? (section.getAttribute('data-key') || '').replace('report-', '') : '';
        const shown = f.inspect ? f.history.find(x=>x.id===f.inspect) || f : f;
        openStage(state, api, shown, title === 'What changed' || title === 'Corrections' ? 'implement' : title === 'Test evidence' ? 'verify' : title === 'Plan review' ? 'plan_critic' : 'plan');
        return true;
      }
      if (b.tagName === 'SUMMARY') {
        // the <details> state lives in the module state (a re-render would drop the native `open`)
        const d = closest('details[data-demo-details]');
        if (!d) return false;
        const k = d.getAttribute('data-demo-details');
        f.details[k] = !f.details[k];
        e.preventDefault();
        return true;
      }
      return true;
    }
    if (kind === 'run') {
      if (label === 'Close workflow run') { f.open = 'task'; return true; }
      const key = b.getAttribute('data-key') || '';
      if (key.startsWith('stage-')) { f.selectedStage = key.slice(6); return true; }
      if (/Open session|Pipeline (Worker|Testing Worker|Planner|Plan Reviewer)/.test(b.textContent)) {
        openStage(state, api, f, f.selectedStage);
        return true;
      }
      return true;
    }
    return false;
  },
  input(e, state) { const key = e.target?.getAttribute?.('data-demo-flow-field'); if (!['revision','feedback'].includes(key)) return false; state.flow[key] = e.target.value; return true; },
  after(state, root) { if (state.flow.scrollTop) { const scroll = root.querySelector('[data-demo-flow-scroll]'); if (scroll) { scroll.scrollTop = 0; state.flow.scrollTop = false; } } },
  key(e, state) {
    const f = flowOf(state);
    if (!f || !f.open) return false;
    if (e.key === 'Escape') { f.open = f.open === 'run' ? 'task' : null; return true; }
    return false;
  },
  tick(state, dt, api) {
    const f = flowOf(state);
    if (!f) return false;
    let changed = false;
    while (f.timeline.length && state.clock >= f.timeline[0].at) {
      const next = f.timeline.shift();
      try { next.fn(state, api); } catch (err) { console.error('flow', err); }
      changed = true;
    }
    // the run's elapsed time and running stage durations tick while Run details is open
    if (f.open === 'run' && f.stage !== 'review' && f.stage !== 'accepted' && f.stage !== 'approval') {
      const sec = Math.floor(state.clock);
      if (f.lastTickSec !== sec) { f.lastTickSec = sec; changed = true; }
    }
    return changed;
  },
};
