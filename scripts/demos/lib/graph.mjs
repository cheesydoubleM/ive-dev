// JS port of backend/pipeline_engine.py::_start_task_execution_pipeline (IVE 1.0.17,
// commit 5d33e8e): the stage graph IVE generates for a task's execution options.
// Prompts are abbreviated; ids, names, types, positions, transitions, labels are exact.
export function taskExecutionGraph({ plan_first = false, auto_approve_plan = false, deep_research = false, ralph_loop = false, test_with_agent = false, require_result_review = false } = {}) {
  const stages = []
  const transitions = []
  const add = (s) => stages.push(s)
  const link = (source, target, condition = 'always', label = '') => transitions.push({ id: `t${transitions.length + 1}`, source, target, condition, label, condition_config: {} })
  const shouldVerify = test_with_agent || ralph_loop
  let previous = null
  const ctx = []
  if (deep_research) {
    add({ id: 'research', name: 'Research', type: 'research', prompt_template: 'Research implementation context for this task: …', position: { x: 80, y: 180 }, config: { icon: 'search', depth: 'standard' } })
    previous = 'research'; ctx.push('research')
  }
  if (plan_first) {
    add({ id: 'plan', name: 'Plan', type: 'agent', session_type: 'planner', fresh_session: true, prompt_template: 'Create an implementation plan for this task. Do not edit files. …', context_from: [...ctx], position: { x: 300, y: 180 }, config: { icon: 'map' }, agent_config: { role: 'planner', permission_mode: 'plan' } })
    if (previous) link(previous, 'plan')
    add({ id: 'plan_critic', name: 'Plan Review', type: 'agent', session_type: 'planner', fresh_session: true, prompt_template: 'Review the proposed plan before implementation. Do not edit files. …', context_from: ['plan', ...ctx], position: { x: 520, y: 180 }, config: { icon: 'shield' }, agent_config: { role: 'plan_critic', permission_mode: 'plan' } })
    link('plan', 'plan_critic')
    add({ id: 'plan_gate', name: 'Plan Gate', type: 'condition', position: { x: 740, y: 180 }, config: { mode: 'keyword', require_report: true, icon: 'git-branch', pass_keywords: ['__pipeline_result:pass', 'pass', 'approved'], fail_keywords: ['__pipeline_result:fail', 'fail', 'gap', 'unsafe'] } })
    link('plan_critic', 'plan_gate')
    link('plan_gate', 'plan', 'on_fail', 'Revise plan')
    if (auto_approve_plan) previous = 'plan_gate'
    else {
      add({ id: 'approval', name: 'Plan Approval', type: 'approval', position: { x: 960, y: 180 }, config: { icon: 'pause', auto_approve: false } })
      link('plan_gate', 'approval', 'on_pass', 'Approve')
      previous = 'approval'
    }
    ctx.push('plan', 'plan_critic')
  }
  add({ id: 'implement', name: 'Implement', type: 'agent', session_type: 'worker', session_id: null, fresh_session: true, prompt_template: 'Implement this task completely. Use get_my_task first. …', context_from: [...ctx], position: { x: plan_first ? 1180 : 320, y: 180 }, config: { icon: 'code', require_existing_assignment: false }, agent_config: { role: ralph_loop ? 'strong_worker' : 'default_worker', permission_mode: 'auto' } })
  if (previous) link(previous, 'implement', previous === 'plan_gate' ? 'on_pass' : 'always')
  previous = 'implement'
  if (shouldVerify) {
    add({ id: 'verify', name: 'Verify', type: 'agent', session_type: 'tester', fresh_session: true, prompt_template: 'Verify this task against the acceptance criteria. …', context_from: ['implement', ...ctx], position: { x: plan_first ? 1400 : 540, y: 180 }, config: { icon: 'check-circle' }, agent_config: { role: 'tester', permission_mode: 'auto' } })
    link('implement', 'verify')
    add({ id: 'verify_gate', name: 'Verify Gate', type: 'condition', position: { x: plan_first ? 1620 : 760, y: 180 }, config: { mode: 'keyword', require_report: true, icon: 'git-branch', pass_keywords: ['__pipeline_result:pass', 'pass', 'passed', 'verified'], fail_keywords: ['__pipeline_result:fail', 'fail', 'failed', 'broken', 'error'] } })
    link('verify', 'verify_gate')
    if (ralph_loop) {
      add({ id: 'fix', name: 'Fix', type: 'agent', session_type: 'worker', reuse_session_from: 'implement', prompt_template: 'Fix the issues found by verification. …', context_from: ['verify', 'implement', ...ctx], position: { x: plan_first ? 1400 : 540, y: 360 }, config: { icon: 'wrench' }, agent_config: { role: 'strong_worker', permission_mode: 'auto' } })
      link('verify_gate', 'fix', 'on_fail', 'Fix')
      link('fix', 'verify', 'always', 'Re-verify')
    } else {
      add({ id: 'blocked', name: 'Mark Blocked', type: 'task_update', prompt_template: 'Verification failed. See pipeline verification summary.', position: { x: plan_first ? 1840 : 980, y: 300 }, config: { icon: 'x', status: 'blocked', pipeline_stage: 'blocked' } })
      link('verify_gate', 'blocked', 'on_fail', 'Blocked')
    }
    add({ id: 'done', name: require_result_review ? 'Ready for Review' : 'Mark Done', type: 'task_update', position: { x: plan_first ? 1840 : 980, y: 120 }, config: { icon: 'check', status: require_result_review ? 'review' : 'done', pipeline_stage: require_result_review ? 'review' : 'done' } })
    link('verify_gate', 'done', 'on_pass', 'Done')
  } else {
    add({ id: 'review', name: 'Mark Review', type: 'task_update', position: { x: plan_first ? 1400 : 540, y: 180 }, config: { icon: 'eye', status: 'review', pipeline_stage: 'review' } })
    link('implement', 'review')
  }
  return { stages, transitions }
}

export const pending = () => ({ status: 'pending', started_at: null, completed_at: null, session_id: null, output_summary: null })
export const running = (session_id = null, extra = {}) => ({ status: 'running', started_at: Date.now() / 1000, completed_at: null, session_id, output_summary: null, ...extra })
export const done = (result, text, session_id = null) => ({ status: 'completed', started_at: Date.now() / 1000 - 60, completed_at: Date.now() / 1000, session_id, output_summary: `__pipeline_result:${result}:${text}` })

// The six presets as defined in PRESETS (pipeline_engine.py, 1.0.17), trimmed to what the UI reads.
export const RALPH_PRESET = {
  name: 'RALPH Pipeline', description: 'Execute -> Verify -> Fix -> Repeat. Multi-agent version of RALPH mode.',
  stages: [
    { id: 'execute', name: 'Execute', type: 'agent', session_type: 'worker', prompt_template: 'Execute the task: {topic}. Do the work completely.', position: { x: 150, y: 200 }, config: { icon: 'zap' }, agent_config: { model: 'sonnet', permission_mode: 'auto' } },
    { id: 'verify', name: 'Verify', type: 'agent', session_type: 'tester', prompt_template: "Verify the work is correct. Run tests, check output, validate behavior. When done, use the report_pipeline_result tool with status 'pass' or 'fail' and a summary.", position: { x: 450, y: 200 }, config: { icon: 'shield' }, agent_config: { model: 'sonnet', permission_mode: 'auto' } },
    { id: 'evaluate', name: 'Evaluate', type: 'condition', session_type: null, prompt_template: '', position: { x: 750, y: 200 }, config: { mode: 'keyword', require_report: true, icon: 'git-branch', pass_keywords: ['pass', 'verified', 'correct'], fail_keywords: ['fail', 'incorrect', 'broken'] } },
    { id: 'fix', name: 'Fix', type: 'agent', session_type: 'worker', reuse_session_from: 'execute', prompt_template: 'Fix the issues found during verification. Apply the feedback.', position: { x: 600, y: 380 }, config: { icon: 'wrench' }, agent_config: { model: 'sonnet', permission_mode: 'auto' } },
  ],
  transitions: [
    { id: 't1', source: 'execute', target: 'verify', condition: 'always', label: '' },
    { id: 't2', source: 'verify', target: 'evaluate', condition: 'always', label: '' },
    { id: 't3', source: 'evaluate', target: 'fix', condition: 'on_fail', label: 'Fix issues', condition_config: {} },
    { id: 't4', source: 'fix', target: 'verify', condition: 'always', label: 'Re-verify' },
  ],
}
