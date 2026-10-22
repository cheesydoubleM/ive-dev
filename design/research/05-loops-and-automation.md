# 05 · Loops and automation in IVE 1.0.17

Area: every loop and automation in the app, how it is started and seen, its limits, and which of them the demo recorder can show truthfully.
Checked on 22 Oct 2026 against the 1.0.17 source (`/Users/maximilianschwarz/Projekte/AIFOREU/ive-oss`, HEAD `5d33e8e` "Release 1.0.17", clean) and the installed app (`/Applications/IVE.app`, `CFBundleShortVersionString` 1.0.17).

How this was checked:

- backend and frontend read end to end for every path that repeats or continues work (files and lines in section 8)
- the shipped build profile confirmed: `/Applications/IVE.app/Contents/Resources/backend/_internal/frontend/dist/ive-build-profile.json` is `edition: integrated-dev`, `extensions: ["sandbox"]`; `backend/desktop_entry.py` sets the same for the frozen app. So everything gated on `integrated-dev` is live in 1.0.17 (pipeline engine, legacy task pipeline, research scheduler, discovery scans, board-doc sweeper, Pipelines editor). Everything gated on the `company`, `myelin`, `forge` or `swarmlock` extensions is absent.
- a read-only smoke test: the real 1.0.17 frontend (installed build) on the app's isolated test transport, with seeded demo data, for seven candidate clips. Screenshots and a report are in the scratchpad (section 8). Nothing touched a real IVE; the transport blocks every external request.

---

## 0. The short version

1. **The loop that matters is the Auto-fix loop.** A task runs as a visible pipeline: implement, a separate testing agent verifies, a failed check goes back to the implementing session with the test report, and it repeats until the check passes or the cycle limit is hit. It is the "Auto-fix loop" option on a task (Feature Board, Execute tab) and it is always on in the guided task flow ("Turn your request into a result"). Internally it is `ralph_loop`; the UI never says "Ralph" except for the `@ralph` token.
2. **It is honest by design and that is the selling point.** The plan can need your approval, every check runs in a fresh testing session, the counter is bounded (guided task default 3, board default 5, hard cap 20), a run at the limit lands in "Needs you" as blocked, and the server refuses to accept a result without a completed run whose verification passed.
3. **All six proposed clips render on the real 1.0.17 build** with the existing transport plus small, clip-local route overrides and broadcasts (section 3). Verified in the smoke test: guided task loop, Feature Board loop options, Pipelines canvas loop, prompt cascade on repeat, composer queue, doom-loop warning.
4. **Blocker for the best clip:** the guided task window shows a German button, "Run abbrechen", whenever a run is active (`frontend/src/components/home/TaskFlow.jsx:279`, present in the shipped bundle `TaskFlow-CL0WQATJ.js`). Fix it in the app before recording, or accept German in an English clip.
5. **Do not record "run a preset from the Pipelines editor".** In 1.0.17 every preset that uses `{topic}` (RALPH Pipeline, TDD Loop, Review Loop, Research Loop, Verification Cascade) fails from the editor with "unknown variables: topic", because the editor treats `topic` as task-provided and sends no value. Presets work when run against a task. The canvas clip must use a saved, user-made loop pipeline.
6. **The transport's built-in loop controls are not faithful enough on their own.** `POST /tasks/:id/execute` always builds a fixed six-stage practice graph with lower-case stage names, `failCheck` bumps the cycle counter one step early and never resets stages, and `checking()` writes canned "README.md" texts. Clips should build the real 1.0.17 graph and push engine-accurate states with `controls.setRun` (section 3.3).
7. **Found by reading, worth a live check:** the "Auto-Dispatch" preset is seeded `active` with an enabled trigger "When ticket enters column: To Do". Any task moved into To Do, in any project, starts a run that hands it to a Commander session. Presets cannot be opened or deactivated in the editor UI. The direct "Execute Task" path also sets To Do after assigning a worker, which may double-dispatch. Not a website clip; an app issue (section 7).
8. **Several loops exist in code but are off, hidden or dormant in 1.0.17:** session auto-restart, stop-hook reflection, auto-distill, run budgets, orchestrator v2, the test-queue UI, the Home "Plan task" button, `task_ralph_iteration` / `task_ralph_completed` events (declared, never emitted). None of these should appear on the site.

---

## 1. How a loop runs in 1.0.17

Shared mechanics behind the pipeline loops (`backend/pipeline_engine.py`) and cascades (`backend/cascade_runner.py`):

- **Server-side and event-driven.** A stage types its prompt into the session's real terminal (PTY), then waits. It advances when the CLI's turn-complete hook fires (Claude Code `Stop`, Codex `Stop`, Gemini CLI and Antigravity `AfterAgent`; mapping in `backend/cli_profiles.py`), debounced 1.5 s, or immediately when the agent reports through the worker MCP tool `report_pipeline_result` / `submit_result`. Closing the browser does not stop a run.
- **Results decide the path, not keywords alone.** Agents report `pass` or `fail` with a summary; testers get a typed contract (`verdict`, `failures`, `evidence`, `summary`, from `backend/role_templates.py`). Condition gates in the task flow are set to `require_report`, so a missing report counts as a failure.
- **One cycle counter per run.** A transition back to a stage that already completed is a loop: the counter goes up by one and every downstream stage is reset to pending (`_increment_iteration`, L2142). If the counter is already at the limit, the run ends with status `max_iterations` (L1931). The counter covers plan revisions and fix rounds together.
- **Limits by entry point.** Guided task: "Maximum cycles" 1, 2, 3, 5 or 10, default 3. Feature Board task: 1 to 20, default 5. Task runs are clamped to 1..20. Pipelines started from the editor, from a trigger or with `@ralph`: 20 (`DEFAULT_MAX_ITERATIONS`, L67). Prompt cascades: 50 rounds (`CASCADE_MAX_ITERATIONS`). The app itself says: "It is not a time or spending limit." Run budget columns (`budget_tokens`, `budget_wall_s`) are enforced if set, but nothing in 1.0.17 sets them.
- **Stops that are not success.** `max_iterations`, `failed` (a stage error, a failed CLI turn, or a session that is not ready for input within 30 s), `cancelled`. Each shows in "Needs you" as "Task blocked" for task runs. Pause waits; Stop/Cancel interrupts the active turn (Escape for Claude Code, Ctrl-C for others).
- **Restarts.** On IVE start, running pipeline runs and cascades are set to paused; you resume them (`recover_active_runs`).
- **Where the task status lives.** The engine writes task status changes straight to the database without a `task_update` broadcast; the board catches up on the next 15 s task poll (`frontend/src/hooks/useTaskAttention.js`). The guided task window polls its task and runs every 3.5 s. Pipeline run changes are broadcast live (`pipeline_run_update`).

---

## 2. The loops and automations, one by one

Format per item: what it is and what it does · how it starts · where you see it and what a viewer sees · limits and safety rails · recorder verdict.

### 2.1 Auto-fix loop on a task (the core loop)

- **UI name:** "Auto-fix loop", detail text "Build, check, and retry fixes until checks pass or the cycle limit is reached." (`TaskDetailModal.jsx:1756`). Backend field `ralph_loop`.
- **What it does:** turns the task into a visible pipeline run. Without "Plan first": Implement, Verify, Verify Gate, then on fail Fix (in the implementing session, with the verification report and the failure attached) and back to Verify ("Re-verify"); on pass "Mark Done". Implement and Fix use the "Strong worker" policy role when the loop is on. Verify always starts a fresh testing session ("Pipeline Testing Worker (Claude Code)"), so each check has fresh eyes.
- **Start / configure:** Feature Board (⌘B) → open a card → tab "Execute" → "Execution options": tick "Auto-fix loop" (optionally "Plan first", "Auto-approve plan", "Test with agent", "Deep research") → "Maximum cycles" (1 to 20, default 5) → "Start Pipeline Run". The "Execution path" box previews the stages as chips: "Implement · routed worker", "Verify · required loop", "Fix loop · 5 max", "Status · done/blocked" (verified in the smoke test). A Commander can start the same run with the MCP tool `start_task_pipeline`.
- **Where you see it:** card status on the board; task modal tab "History": "Pipeline Runs" with status chip, "iter N", per-stage rows with pass/fail chips, "Run Detail" (live, it re-renders on every `pipeline_run_update`). "Run Detail" (`PipelineRunDetail.jsx`) lists stages, shows "Cycle N of M", stage summaries, linked session, recent terminal output.
- **Limits and rails:** cycle limit; without the loop a failed check runs "Mark Blocked" (task status Blocked); stage failures fail the run; Pause/Cancel; the board result is "done" with no further human step (the board path does not set `require_result_review`).
- **Recorder:** yes (clip 4, verified for the configure step). Needs a route override for `POST /api/tasks/:id/execute` that builds the real graph (section 3.3).

### 2.2 Guided task: plan, approve, build, check, fix ("Turn your request into a result")

- **UI name:** modal "Turn your request into a result" (`components/home/TaskFlow.jsx`); steps "Request, Plan, Work, Check, Review, Accepted"; "Next step" panel with labels "Planning", "Approve the plan", "Working", "Checking the result", "Fixing issues", "Review the result", "Needs attention", "Accepted".
- **What it does:** the same engine with fixed options `plan_first, test_with_agent, ralph_loop, require_result_review`, plan approval required (`TaskFlow.jsx:14`). Stages: Plan (fresh planner, read-only plan mode), Plan Review (a second fresh planner as critic), Plan Gate (fail goes back to Plan: "Revise plan"), Plan Approval (run pauses), Implement, Verify, Verify Gate, Fix, "Ready for Review". Reports are shown in plain language: "Proposed plan", "Plan review", "What changed", "Corrections", "Test evidence", each with "Reported pass" or "Reported failure". Final step: "Accept result", or "Create follow-up for review".
- **Start / configure:** in 1.0.17 the Home "Plan task" button is not rendered (`screens/HomeScreen.jsx:14` is a stub with `void onPlan`). Real entry points: the left nav button "N items need your attention →" → "Needs your attention" → "Review" on a task item ("Plan approval needed", "Result ready for review", "Task blocked"); and the onboarding chapter "Prüfen & verbessern" (German tour). Settings inside: "Context & execution settings" → "Maximum cycles" (1, 2, 3, 5, 10; default 3) with the note "One shared counter starts at 1 and limits repeated plan and verification stages. It is not a time or spending limit."
- **Where you see it:** the modal (polls every 3.5 s); "Run details" (static snapshot when opened); the nav attention button; new sessions in the sidebar ("Pipeline Planner", "Pipeline Testing Worker").
- **Limits and rails:** plan approval is never automatic here; "Request a plan revision"; "Run abbrechen" (cancel); a run at the limit shows "Needs attention: Run max iterations…"; "Accept result" is enabled only for the latest completed run whose Verify reported pass, and the server enforces the same rule (`backend/task_review.py`). After a fix round the stage reports reset: the final screen shows "What changed" and the passing "Test evidence", not the failed attempt; the cycle count stays visible in "Run details" ("Cycle 2 of 3").
- **Recorder:** yes (clip 1, verified end to end). Blocked by the German "Run abbrechen" label until fixed.

### 2.3 Pipelines (graph editor, presets, triggers)

- **UI name:** "Pipelines" (⌘⇧L, command palette, IA group Work: "Build reusable workflows such as plan → implement → verify."). Header in the editor: "Connect steps with arrows. A condition chooses what happens after a check. Pause waits before the next step; Stop cancels active work. Each loop has a cycle limit."
- **What it does:** you draw stages (Agent, Condition, Command; the engine also supports approval, research, task update, delay and sweep stages) and transitions (always, on pass, on fail, on match, on expression). A transition back to a finished stage is a loop. Presets (`PRESETS`, `pipeline_engine.py:3367`):

  | Preset | Graph | Loop |
  |---|---|---|
  | RALPH Pipeline | Execute → Verify → Evaluate; fail → Fix (same session as Execute) → Verify | fix until pass |
  | TDD Loop | Implement → Test → Evaluate; fail → Implement | fix until green |
  | Review Loop | Implement → Review (Commander, plan mode) → Evaluate; fail → Implement ("Revise") | revise until approved |
  | Verification Cascade | Unit Tests → Unit Gate → E2E Tests → E2E Gate → Quality Audit → Quality Gate; any fail → Fix (session of the failing stage) → back to Unit Tests | restart verification from the top |
  | Research Loop | Research → Plan → Implement → Test → Evaluate; pass → Document → Research ("Next cycle"); fail → Implement ("Retry") | open-ended, bounded by 20 |
  | Auto-Dispatch | one Commander stage; trigger "board column: todo" | none (see 2.8) |

- **Start / configure:** "Choose a Pipeline" shows preset cards (click clones the preset into your project as a draft) and "Your Pipelines". In the editor: "Run" (asks for variables it cannot fill), "Pause", "Stop", "Activate/Deactivate", "Triggers": "+ Column" ("When ticket enters column", "Max concurrent runs") and "+ Manual". From a task: Execute tab → "Execution recipe" lists presets and saved pipelines and runs them with task variables.
- **Where you see it:** the canvas shows each node's status dot (pulsing while running), the edge from a finished stage to the running one animates as a dashed line, and the toolbar shows "Cycle N of 20 · running". Right panel "Recent Runs". "Run Detail" as in 2.1. Verified in the smoke test (frames C3 to C5). Note: after a loop-back the Fix node is reset to pending, so the animated edge is Execute → Verify, not Fix → Verify.
- **Limits and rails:** cycle limit 20 for editor runs; command stages default to the safety check ("safety_checked": a deny fails the step, an ask pauses the run for approval), or an allowlist of command prefixes, or "approval_required"; command working directory must be inside the project; timeout 300 s default, 3600 s max; trigger guards (max concurrent, cooldown). The live canvas is only available for runs started in the editor (`activeRunId` is local state).
- **Known 1.0.17 bug:** running a cloned `{topic}` preset from the editor fails with "unknown variables: topic" (editor `TASK_AUTO_VARS` includes `topic`, `PipelineEditor.jsx:207`; backend `start_run` has no task to fill it and raises `PipelineVariableError`).
- **Recorder:** yes, with a saved custom pipeline (clip 2, verified). Not with a preset.

### 2.4 `@ralph` in a session

- **What it is:** typing `@ralph <task>` in a session's composer starts a pipeline named "Auto-fix loop" (a private copy of the RALPH preset): Execute and Fix run in this session, Verify in a testing session, back to Verify until pass, limit 20 (`start_ralph`, L3666). Composer chip: "@ralph · Start an execute → verify → fix pipeline"; tooltip says it starts in a single session and that broadcast does not start it.
- **Where you see it:** a toast "RALPH pipeline started: <task>"; then only through the sessions: the engine types the task into this session, a "Pipeline Testing Worker" session appears, later a fix prompt arrives here. The run has no task, so it shows in no task view, and the editor's canvas does not attach to it.
- **Rough edges (seen in the smoke test, frames G1 to G3):** the chip uses dark-theme amber classes and is hard to read in the light theme; an optimistic "@ralph …" bubble and "Waiting for a reply…" stay in the chat because the frontend itself sends nothing; the engine's prompts are long machine prompts (task block, "Pipeline context", raw `__pipeline_result:fail:` markers, completion instructions). The tooltip points to "Start a task on Home", which 1.0.17 does not render.
- **Recorder:** possible, not recommended.

### 2.5 Prompt cascades on repeat

- **UI name:** "Prompt Cascades" (Prompt Library ⌘/ → tab "Cascades"; command palette). Empty state: "A cascade sends multiple prompts in sequence, each waiting for the session to finish."
- **What it does:** sends saved prompt steps to the active session one after another; each next step goes out 1.5 s after the session's turn ends. "Repeat after last step" starts over at step 1. With variables, "Re-prompt variables each iteration" pauses each round for new values.
- **Start / configure:** create with name, steps, variables, "Repeat after last step", "Restart session in auto-approve mode", "Use dangerously skip permissions", "Auto-approve plans"; run from the list ("run" on hover) or "run now".
- **Where you see it:** a bar at the bottom of the main area: name, "step 2/3", "loop #2", progress bar, the current prompt, "srv" ("Running on server — survives browser close"), loop icon, pause, "stop" (⌘Esc). Each step appears as a user message in the conversation. Toasts: "Cascade "X" completed (N steps)." or "… stopped at step N/M." Verified (frames B2 to B4).
- **Limits and rails:** 50 rounds then it ends with "Max iterations reached"; ⌘Esc stops; pause/resume; a step that cannot be delivered fails the run; IVE restart pauses it. Quirk: the cascade's "Auto-approve plans" checkbox is wired to `auto_approve`, not `auto_approve_plan` (`state/store.js:1624`), so on its own it does nothing.
- **Recorder:** yes (clip 6, verified).

### 2.6 Composer queue ("Up next")

- **What it is:** while a Claude Code or Codex session works, the composer says "Claude is working. Write your next message, Enter queues it." Enter queues the message; IVE sends it when the turn ends (idle held 1.2 s, server re-checks readiness), several queued messages go out together.
- **Where you see it:** above the composer: "UP NEXT · 1 · Sends when Claude finishes this turn.", rows "QUEUED", "SENDING…", "DELIVERED", "NOT SENT". Verified: queued, then delivered through `POST /sessions/:id/input` after the turn ended (frames E1 to E3).
- **Limits and rails:** never resends on its own; Stop, a session exit or a failed delivery pause the queue until "Send queued now"; per session; stored in the browser, so delivery needs an open IVE window.
- **Recorder:** yes (clip 3, verified, no transport changes).

### 2.7 Doom-loop detection

- **UI name:** Experimental feature "Doom Loop Detection", seeded ON (`backend/experimental.py:265`, `database_seeds.py:631`).
- **What it does:** watches the last 30 tool calls per session (main agent only, not subagents): the same tool with the same input three times in a row, A→B→A→B, or A→B→C→A→B→C. Then it shows a toast and, at the agent's next pause, types a corrective message into the session.
- **Where you see it:** toast "Loop detected in Check the sign-in flow: repeated Bash with same input 3 times" (verified, frame D1); then a user turn in the conversation: "⚠️ [W2W] [Commander] Loop detected: repeated Bash with same input 3 times. You appear to be stuck in a repetitive pattern. Stop and try a fundamentally different approach — different tool, different strategy, or ask the user for clarification."
- **Limits and rails:** one warning per session per minute; detection needs the CLI's post-tool hook.
- **Recorder:** yes (clip 5, verified for the toast; the nudge is a pushed user message).

### 2.8 Hands-off dispatch and the legacy task pipeline

Real, but driven by a Commander agent (a hidden helper session) and hard to show honestly.

- **Auto-Dispatch preset trigger (on by default, found by reading).** Seeded `active` with trigger "board column: todo", guards max 10 concurrent, 2 s cooldown (`pipeline_engine.py:3619`, `ensure_presets` L3729, `check_triggers` L2821 scans all active definitions including presets). A task entering To Do starts a run whose stage sends a Commander session "A task just entered the Todo queue and needs a worker…"; the Commander checks load and spawns a worker or puts the task back in the backlog. Presets are not editable in the editor UI, so this cannot be switched off there.
- **"Auto-Execute Tasks"** (Workspace Settings → Feature board → Automation; default off): backlog and to-do tasks go to the Commander by priority, respecting "Max Workers" (default 3) and an epic cap (2); a circuit breaker stops after 20 dispatches without a completion; a dead Commander is revived. Toast: "Task handed to Commander: <title>".
- **Worker queue:** a Commander can queue a task for a busy worker (`queue_task_for_worker`); it is handed over when that worker finishes ("--- NEW TASK ASSIGNMENT ---"). Card shows "queued".
- **Idle nudges:** when a worker with an active task goes idle, the Commander is told to read its output; wording depends on Human Oversight (Auto, Plans, All). 30 s cooldown.
- **Legacy "Pipeline" mode** (Workspace Settings "Pipeline", default off; or task `pipeline=1` outside an engine run): worker sets Review → task goes to Testing (test queue, testing worker) → pass: Docs (documentation worker) → Done; fail: back to To Do with the failure and history, limit 5, then Blocked. Board columns "Review", "Testing", "Docs" show it, and these status changes are broadcast.
- **Auto test on done** (`auto_test_enabled`, default 1, no UI toggle): marking a task done outside a reviewed run queues a test for an existing testing worker (30 min lease, 2 attempts, then parked). The queue UI (`OverviewDashboard` TestQueue) is not mounted in 1.0.17, so results are invisible.
- **Recorder:** not proposed.

### 2.9 Oversight shortcuts that keep agents moving

- **Human Oversight "Auto"** (Workspace Settings → Oversight & approvals; options Auto, Plans, All): when an agent stops to ask "shall I implement this?", IVE answers "Yes, go ahead and implement it." Otherwise the question goes to "Needs you". Client-side: needs an open IVE window.
- **"Auto-approve plans"** (New Session dialog, task "Auto-approve plan"): when a plan file appears, IVE replies "Plan looks good, proceed with implementation." and shows "Plan auto-approved…". Client-side.
- **Recorder:** possible, low value.

### 2.10 Schedules and background sweeps

- **Recurring research** (Research → "Schedules": every 6 h, 12 h, daily, every 3 days, weekly; toggle per schedule; scheduler ticks every 60 s).
- **Discovery scans** (Discovery Setup → schedules; hourly check).
- **Board-doc backstop** (Workspace Settings → "Feature Board Documentation" → Mode, default "Agent + Backstop"): hourly, for sessions idle 2 h with work artifacts it updates their ticket or files an "[auto-triage]" ticket.
- **Rolling session digests** after a turn (workspace context sharing, at most every 5 min per session).
- **Recorder:** not proposed (static or invisible).

### 2.11 Present in code, off or hidden in 1.0.17

| Mechanism | State in 1.0.17 |
|---|---|
| Session auto-restart (supervisor, backoff 5/15/45 s, 3 attempts) | default "off", no UI toggle; crash detection and manual restart work |
| Stop-hook reflection nudge (5 min idle, 12 tool uses, once per 30 min) | Experimental, off |
| Auto-distill on exit | Experimental, off |
| Auto auth cycling | Experimental, on, but a quota switch needs your confirmation and 2+ accounts |
| Run budgets (tokens, wall clock) | enforced if set, never set |
| Orchestrator v2 (`orchestrator.py`) | env flag `ORCHESTRATOR_V2`, off |
| `task_ralph_iteration`, `task_ralph_completed` events; `ralph_iteration`, `ralph_phase` columns | declared, never written or emitted |
| Single-agent Ralph prompt (`RALPH_LOOP_PROMPT`, "Maximum 20 iterations") | only when a Commander creates a session with `ralph_loop=true`; the Commander guidance also says to prefer `start_task_pipeline` |
| Home "Plan task" (⌘↵) | component exists, Home is a stub and does not render it |
| Test queue panel | component exists, not mounted |
| "Mac & Energie" closed-lid availability | real (needs the Mac helper), but the panel is German only |

---

## 3. What the recorder can show

Recorder: `/Users/maximilianschwarz/Projekte/AIFOREU/ive.dev-redesign/scripts/demos`. It loads the installed build (`DIST` in `lib/fixture.mjs`, now 1.0.17) and the transport. `lib/fixture.mjs` imports `createTourFixture` from the `quiet-focus` worktree; that file is byte-identical to `ive-oss/frontend/tests/interactive-onboarding-fixture.mjs` (checked with `cmp`).

### 3.1 What the transport already does

- Answers tasks (`GET/POST/PUT /tasks`), runs (`GET /pipeline-runs`, `PUT /pipeline-runs/:id` pause, resume, cancel), pipeline definitions (`GET /pipelines`, `GET /pipelines/:id`), messages with cursors, session input, git diff and status, settings.
- Controls: `setRun(runId, patch, taskPatch)` (merges and broadcasts `pipeline_run_update` plus `task_update`), `setSessionStatus`, `addMessage`, `broadcast(event)` for any app WebSocket event.
- Unknown reads return `[]` (`/cost`, `/catchup`, `/sessions/*/permission-mode/apply`, `/sessions/*/launch/apply`, `/tasks/*/attachments` were hit; all harmless).
- Unknown writes return 501 and are logged in `f.unexpected`.
- `createTourFixture` accepts `tasks`, `runs`, `pipelines`, `theme`; `openDemo` in the site fixture does not pass them yet.

### 3.2 Per loop

| Loop | Works today | A clip must add | Smoke test |
|---|---|---|---|
| Guided task loop (2.2) | task/run reads, approve (resume), accept, 3.5 s polling | seed task, run (paused at approval), real graph definition; push states with `setRun`; session rows for the pipeline sessions; route `GET /sessions/*/export**` → empty text (otherwise Run details shows "[]") | verified A1 to A9 |
| Auto-fix loop on a board task (2.1) | board, task modal, save, History tab live via WS | route `POST /tasks/*/execute` → build the real graph from the posted options (the transport's version always builds a plan-first practice graph named "plan", "plan_critic", …); then `setRun` states | verified F1, F2 |
| Pipelines canvas (2.3) | editor, canvas, Run Detail | route `GET /pipelines?*` to include `workspace_id: null` presets (transport filters them out, the backend does not); route `POST /pipelines` (clone) if a preset click is shown; route `POST /pipeline-runs` (create run, push to `f.data.runs`, 201); broadcast `pipeline_run_update` per state | verified C1 to C5 |
| `@ralph` (2.4) | chip, toast | route `POST /pipeline-runs/ralph`; messages and a tester session pushed by the clip | verified G1 to G3 |
| Prompt cascade (2.5) | bar, palette, toasts | route `GET /cascades` (transport returns `[]`), `POST /cascade-runs`, `PUT /cascade-runs/*`; per step `addMessage` + assistant steps + broadcast `cascade_progress` | verified B1 to B4 |
| Composer queue (2.6) | everything | nothing (session status `running`, then idle + `session_idle`) | verified E1 to E3 |
| Doom loop (2.7) | toast | broadcast `doom_loop_warning`; push the nudge as a user message | verified D1 |
| Auto-Dispatch, Commander, legacy pipeline (2.8) | board columns | Commander behaviour would have to be invented step by step | not attempted |

Recorder housekeeping before these clips:

1. `openDemo`: pass through `tasks`, `runs`, `pipelines`, `theme`; add the export route.
2. A helper that advances the fake clock off camera (`context.clock.runFor`) until a condition holds, like `home.mjs` does for first delivery. The guided task window only refreshes every 3.5 s and "Needs you" every 15 s.
3. Point the transport import at `ive-oss/frontend/tests/interactive-onboarding-fixture.mjs` for traceability.
4. Update the README's version line (1.0.12 at last capture; the installed app is now 1.0.17).

### 3.3 Engine-accurate states for the task loop

Graph the 1.0.17 backend builds (`_start_task_execution_pipeline`, `pipeline_engine.py:3068`). A JS port with exact ids, names, types, positions, transitions and labels is in the scratchpad file `graph.mjs` (section 8); copy it into `scripts/demos/lib/` when building the clips.

| Options | Stages in order (name · type · x,y) |
|---|---|
| guided task (plan first, test, loop, result review) | Plan · agent · 300,180 → Plan Review · agent · 520,180 → Plan Gate · condition · 740,180 → Plan Approval · approval · 960,180 → Implement · agent · 1180,180 → Verify · agent · 1400,180 → Verify Gate · condition · 1620,180 → Fix · agent · 1400,360 → Ready for Review · task_update · 1840,120 |
| board, Auto-fix loop only | Implement · 320,180 → Verify · 540,180 → Verify Gate · 760,180 → Fix · 540,360 → Mark Done · 980,120 |
| board, Test with agent only | Implement → Verify → Verify Gate → Mark Blocked (fail) / Mark Done (pass) |

Transition labels: "Revise plan" (Plan Gate fail → Plan), "Approve" (Plan Gate pass → Plan Approval), "Fix" (Verify Gate fail → Fix), "Re-verify" (Fix → Verify), "Done" (Verify Gate pass), "Blocked". Definition name "Task Execution - <title>", description "Generated visible task execution pipeline.".

State sequence to push (guided task, limit 3):

| # | Trigger | run.status · current_stages · iteration | stage changes | task |
|---|---|---|---|---|
| S0 | seeded | paused · [approval] · 1 | Plan, Plan Review, Plan Gate completed pass; Plan Approval running with `waiting_for_plan_approval: resume this pipeline run after approving the plan.` | planning, `awaiting_plan_approval` |
| S1 | user clicks "Approve plan & start" (transport resume) | running · [implement] · 1 | approval pass, Implement running | in_progress |
| S2 | implementer reports pass | running · [verify] · 1 | Implement pass; Verify running (new testing session) | unchanged |
| S3 | tester reports fail | running · [fix] · 1 | Verify fail, Verify Gate fail, Fix running (implementer's session) | unchanged |
| S4 | fix reports pass, loop back | running · [verify] · 2 | Verify, Verify Gate, Fix, Ready for Review reset to pending; Verify running (another new testing session) | unchanged |
| S5 | tester reports pass | completed · [] · 2 | Verify pass, Verify Gate pass, Ready for Review completed | review |
| S6 | user clicks "Accept result" (transport validates) | completed | none | done |
| alt | third fix finishes while the counter is at 3 | max_iterations · [fix] · 3 (the third fix is never verified) | as is | unchanged; "Needs you": "Task blocked" |

Pass `{}` as the task patch where the real engine does not change the task; the transport's own `checking()` sets "testing", which the engine never does in this flow.

---

## 4. Ranking for the website

Scores 1 to 5. "Compelling": does a visitor see why they get more done. "True": real, default or one click away in 1.0.17, and recordable without inventing behaviour.

| # | Loop | Compelling | True | Note |
|---|---|---|---|---|
| 1 | Guided task: approve, build, check, fix, review | 5 | 5 | the full story with human gates; fix the German label first |
| 2 | Loop pipeline on the canvas | 5 | 4 | the loop as a picture; must be a saved pipeline, not a preset |
| 3 | Composer queue | 4 | 5 | everyday speed-up, zero setup, verified without transport changes |
| 4 | Auto-fix loop option on a task | 4 | 5 | "you choose the loop and its limit" in one frame |
| 5 | Doom-loop detection | 4 | 4 | trust for unattended runs; default on, Claude Code hooks |
| 6 | Prompt cascade on repeat | 3 | 5 | power-user routine |
| 7 | `@ralph` | 3 | 3 | rough edges in the chat view |
| 8 | Auto-Dispatch, Auto-Execute, worker queue | 4 | 2 | real, but hidden helper and possible double dispatch |
| 9 | Oversight auto-replies, plan auto-approve | 2 | 4 | client-side, niche |
| 10 | Schedules and sweeps | 2 | 5 | not about parallel coding |

---

## 5. Six clips

All on project "Orbit" with labelled demo data; light or dark theme per the site plan (doc 04 recommends dark; the transport supports `theme: 'dark'`). Model names only from the allowed set (sonnet, opus). Durations exclude the 0.7 s loop dissolve. Each clip carries the provenance line from doc 04.

### Clip 1 · "Fails, fixes, passes" (guided task) · about 19 s

Demo data: the four Orbit sessions; task "Fix the expired-session redirect" (description "After an expired session the app redirects to / instead of /sign-in. Send it to /sign-in and keep the sign-in checks passing."; criteria "Expired sessions land on /sign-in. All sign-in checks pass."; `pipeline_max_iterations: 3`); its guided-task graph; run at S0; session rows "Pipeline Planner (Claude Code)", "Pipeline Worker (Claude Code)", two "Pipeline Testing Worker (Claude Code)" added as the stages start. Report texts:
plan "1. Read the router guard in src/app/routes.js and src/lib/auth.js. 2. Send expired sessions to /sign-in and keep the return path. 3. Run npm test (tests/sign-in.spec.js)."; critic "Concrete and bounded: two source files and one test file. Safe to execute."; implement "Before: expired sessions went to /. Now the router guard sends them to /sign-in?return=…. Files: src/app/routes.js, src/lib/auth.js."; verify 1 (fail) "npm test: 13 passed, 1 failed. FAIL tests/sign-in.spec.js › expired session keeps the return path. Expected /sign-in?return=%2Fworkspace, received /sign-in."; fix "Kept the return path when the guard redirects; routes.js passes location.pathname to /sign-in."; verify 2 (pass) "npm test: 14 passed, 0 failed. Checked: an expired session lands on /sign-in?return=…; signing in returns to the workspace."

| Time | What happens |
|---|---|
| 0.0 to 1.2 | Board view, nav shows "1 item needs your attention →" |
| 1.2 to 2.4 | pointer clicks it; "Needs your attention" lists "Fix the expired-session redirect · Plan approval needed" |
| 2.4 to 3.4 | click "Review"; the task window opens at "Approve the plan" with "Proposed plan" and "Plan review", both "Reported pass" |
| 3.4 to 4.8 | pointer to "Approve plan & start", click (S1) |
| 4.8 to 6.0 | "Working", step 3 lit |
| 6.0 to 7.8 | S2 off camera, then "Checking the result", step 4 |
| 7.8 to 11.0 | S3: "Fixing issues"; the window scrolls to "Test evidence · Reported failure" (13 passed, 1 failed) and "Corrections" in progress |
| 11.0 to 13.0 | S4: "Checking the result" again, a second testing session appears in the sidebar |
| 13.0 to 15.6 | S5: "Review the result", "Accept result"; scroll shows "Test evidence · Reported pass" (14 passed) |
| 15.6 to 19.0 | click "Run details": "Pipeline Run · completed · Cycle 2 of 3", stages with pass chips, Fix pending |

Transport: seed via `createTourFixture({ tasks, runs, pipelines })`; approval goes through the transport's resume; every other state via `setRun` (section 3.3); export route. Verified as frames A1 to A9. Blocker: "Run abbrechen" is on screen from 2.4 to 13.0.

### Clip 2 · "The loop, drawn" (Pipelines canvas) · about 16 s

Demo data: presets as in 1.0.17 (`workspace_id: null`, `preset: 1`) so the "Choose a Pipeline" grid is real; a saved pipeline "Sign-in checks loop" (status active, `workspace_id: orbit`) with the RALPH graph and the Execute prompt "Make the sign-in checks in tests/sign-in.spec.js pass. Do the work completely." (no `{topic}`). Stage sessions: Execute and Fix "Build the workspace", Verify "Pipeline Testing Worker (Claude Code)".

| Time | What happens |
|---|---|
| 0.0 to 1.6 | ⌘⇧L: "Choose a Pipeline", six preset cards with their stage chips |
| 1.6 to 2.6 | click "Sign-in checks loop" under "Your Pipelines": Execute → Verify → Evaluate, "Fix issues" → Fix → back to Verify |
| 2.6 to 3.8 | click "Run": "Cycle 1 of 20 · running", Execute pulses |
| 3.8 to 5.6 | Execute done, edge to Verify animates, Verify runs |
| 5.6 to 7.6 | Verify reports fail, Evaluate completes, "Fix issues" edge animates, Fix runs |
| 7.6 to 9.8 | Fix done: "Cycle 2 of 20", Verify runs again, Evaluate and Fix grey |
| 9.8 to 12.2 | Verify pass, Evaluate pass: run completed, "Run" button back, "Cycle 2 of 20 · completed" |
| 12.2 to 16.0 | click "Run Detail": stages with pass chips, Fix pending, Cycle 2 of 20 |

Transport: routes `GET /pipelines?*`, `POST /pipeline-runs`; broadcasts per state. Verified as frames C1 to C5. Do not click a preset card and then "Run": that path fails in 1.0.17.

### Clip 3 · "Queue the next instruction" · about 11 s

Demo data: session "Build the workspace" running with the dark-theme toggle transcript; follow-up "Also add ⌘⇧T as the shortcut and mention it in the README."

| Time | What happens |
|---|---|
| 0.0 to 1.2 | session working, Activity steps landing |
| 1.2 to 4.0 | click the composer ("Claude is working. Write your next message, Enter queues it."), type the follow-up |
| 4.0 to 4.6 | Enter: "UP NEXT · 1 · Sends when Claude finishes this turn.", row "QUEUED" |
| 4.6 to 6.8 | the agent finishes ("…all 12 tests pass") |
| 6.8 to 8.4 | "SENDING…", then "DELIVERED"; the follow-up appears in the conversation |
| 8.4 to 11.0 | the agent starts on it (Read src/lib/keymap.js, Edit) |

Transport: none beyond `setSessionStatus` and pushed steps. Verified as frames E1 to E3.

### Clip 4 · "Switch on the loop" (Feature Board) · about 12 s

Demo data: five cards across Backlog, To Do, In Progress, Review, Done; card "Keep the return path after sign-in" in To Do (criteria "Sign-in returns to the original page. All sign-in checks pass.").

| Time | What happens |
|---|---|
| 0.0 to 1.2 | ⌘B: Feature Board |
| 1.2 to 2.2 | open the card |
| 2.2 to 3.0 | tab "Execute": "Execution path · Direct worker" |
| 3.0 to 4.6 | tick "Auto-fix loop": path becomes "Pipeline run · stage-tracked", chips "Implement · Verify (required loop) · Fix loop (5 max) · Status (done/blocked)", "Maximum cycles 5" appears |
| 4.6 to 6.2 | tick "Plan first": chips gain "Plan · Plan review · Approval"; note "Plan approval pauses the pipeline run." |
| 6.2 to 7.6 | set "Maximum cycles" to 3 |
| 7.6 to 8.8 | "Start Pipeline Run": the modal closes, the card shows planning |
| 8.8 to 12.0 | reopen the card, tab "History": "Pipeline Runs · running · iter 1", stage rows with Plan running |

Transport: route `POST /tasks/*/execute` building the real graph from the posted options. Verified up to the chips (frames F1, F2). Do not drag the card into To Do on camera (it is already there): in the real app that fires the Auto-Dispatch trigger.

### Clip 5 · "Loop detected" · about 10 s

Demo data: session "Check the sign-in flow" running; three identical Bash steps `npm test` with the same failing output ("13 passed, 1 failed").

| Time | What happens |
|---|---|
| 0.0 to 1.0 | session working |
| 1.0 to 4.0 | three identical "Run the sign-in checks" steps land |
| 4.0 to 5.2 | toast "Loop detected in Check the sign-in flow: repeated Bash with same input 3 times" |
| 5.2 to 6.6 | turn ends; the corrective message arrives as the next user turn ("⚠️ [W2W] [Commander] Loop detected: …") |
| 6.6 to 10.0 | the agent changes course: reads tests/sign-in.spec.js, edits src/app/routes.js |

Transport: broadcast `doom_loop_warning`; pushed messages. Verified for the toast (frame D1). Caption should say this is on by default and can be turned off under Experimental features.

### Clip 6 · "A routine on repeat" (prompt cascade) · about 15 s

Demo data: saved cascade "Test, fix, review" with steps "Run npm test and fix any failures.", "Review the diff for regressions and dead code.", "Summarize what changed in three lines.", "Repeat after last step" on.

| Time | What happens |
|---|---|
| 0.0 to 1.0 | session "Check the sign-in flow" idle |
| 1.0 to 2.4 | ⌘/ then "Cascades": the cascade with "3 steps" and the repeat icon |
| 2.4 to 3.6 | hover, click "run" |
| 3.6 to 5.4 | step 1 arrives as a user message; bar "Test, fix, review · step 1/3 · srv · stop" |
| 5.4 to 7.6 | reply "All 14 tests pass. Nothing to fix."; step 2 goes out, "step 2/3" |
| 7.6 to 9.8 | review reply; step 3, "step 3/3" |
| 9.8 to 12.0 | summary reply; bar "step 1/3 · loop #2", step 1 again |
| 12.0 to 15.0 | ⌘Esc: bar gone, toast "Cascade "Test, fix, review" stopped at step 1/3." |

Transport: routes `GET /cascades`, `POST /cascade-runs`, `PUT /cascade-runs/*`; per step messages and `cascade_progress`. Verified as frames B1 to B4.

---

## 6. Copy: what the site may say

True for 1.0.17:

- Turn on the Auto-fix loop for a task. An agent implements, a separate testing agent checks the result against your acceptance criteria, and a failed check goes back to the implementing agent with the test report. It repeats until the check passes or your cycle limit is reached.
- You set the limit: the guided task offers 1, 2, 3, 5 or 10 cycles (default 3); a board task takes 1 to 20 (default 5). One counter covers plan revisions and fix rounds. It is not a time or spending limit.
- With Plan first, a planner proposes, a second agent reviews the plan, and the run waits for your approval.
- Every check runs in a fresh testing session. Fixes go back to the session that wrote the code.
- A run that reaches its limit stops and shows up under "Needs you". Nothing is accepted automatically: accepting a result needs a completed run with a passing verification report.
- Runs keep going when you close the window. If IVE restarts, they pause until you resume them.
- Draw your own loops in Pipelines: agents, checks and conditions, with a cycle limit on every loop.
- Queue your next instruction while an agent works. IVE sends it when the turn ends.
- IVE notices when an agent repeats the same tool call or goes in circles, warns you, and tells the agent to change approach.
- Cascades send a saved sequence of prompts, each after the previous turn ends, and can repeat (up to 50 rounds; ⌘Esc stops).

Change on the current site:

- "Retries stop at the configured limit. An unresolved task stays blocked." Better: "Retries stop at the limit you set. The task then waits for you under Needs you." (The engine marks the run, not the task status, except for the no-loop "Mark Blocked" path.)
- "It asks for your input when the failure needs a decision." IVE does not judge that. It stops at the limit; approvals happen at the plan and, if configured, before risky commands.
- "20 RALPH iterations maximum" as a general fact. 20 is the cap for pipeline and `@ralph` runs; tasks default to 3 or 5.
- The drawn retry inside one session ("2 tests failed. Fix them and run npm test again.") shows a single agent grading itself. 1.0.17 verifies in a separate testing session and sends the fix prompt to the implementer.

Avoid:

- budgets, time limits, "runs overnight unattended" as a feature
- "keeps every failed attempt": stage reports reset on a new cycle; the cycle count and the testing sessions' transcripts remain
- "plan your task on Home": not rendered in 1.0.17
- "Ralph" as a product name; the UI says "Auto-fix loop" (only the `@ralph` token keeps the name)

---

## 7. Fix in the app before recording (1.0.18 candidates)

| Issue | Where | Effect on the site |
|---|---|---|
| German "Run abbrechen" and its title in the guided task | `frontend/src/components/home/TaskFlow.jsx:279` | blocks clip 1 |
| `{topic}` presets cannot run from the Pipelines editor ("unknown variables: topic") | `PipelineEditor.jsx:207` vs `pipeline_engine.start_run` | blocks a preset-run clip |
| Auto-Dispatch preset trigger active by default, not visible or switchable in the UI; direct "Execute Task" sets To Do after assigning a worker, which can also trigger it | `pipeline_engine.py:3619`, `ensure_presets`, `check_triggers`; `TaskDetailModal.jsx:668/683/706` | surprising behaviour; verify live |
| Home does not render "Plan task", but the `@ralph` tooltip and the tour point to it | `screens/HomeScreen.jsx`, `lib/tokens.js:73` | the guided task is reachable only through "Needs you" and the tour |
| `@ralph` leaves an optimistic "@ralph …" bubble and "Waiting for a reply…" | `ChatPanel.jsx` send path, `lib/terminal.js` `processRalphTag` | weakens a `@ralph` clip |
| Token chip colours are dark-theme only (amber 300 on light) | `lib/tokens.js` `STYLES` | unreadable in light recordings |
| Cascade "Auto-approve plans" wired to `auto_approve` | `state/store.js:1624` | do not advertise it |
| Engine task status changes are not broadcast | `pipeline_engine.py` `_execute_task_update_stage`, approval stage | board lags up to 15 s |
| "Mac & Energie" panel and its palette entry are German | `MacPowerPanel.jsx`, `lib/informationArchitecture.js` | keep it off camera |
| `task_ralph_*` events and `ralph_iteration`/`ralph_phase` unused | `commander_events.py:48`, schema | dead vocabulary; harmless |

Transport fidelity (in `ive-oss/frontend/tests/interactive-onboarding-fixture.mjs`, owned by the app repo): the execute route builds a fixed practice graph; `failCheck` increments the counter at failure instead of at loop-back and keeps the fix report; `checking()` writes canned texts and task status "testing"; `GET /pipelines` drops global presets; cascade and pipeline-run writes are unimplemented. Clips can work around all of it locally (section 3); fixing it upstream would make future recordings cheaper.

---

## 8. Evidence

Source (1.0.17, `/Users/maximilianschwarz/Projekte/AIFOREU/ive-oss`):

- `backend/pipeline_engine.py`: `ADVANCE_DELAY_S` L66, `DEFAULT_MAX_ITERATIONS` L67, budgets L719, approval stage L1248, command stage L1373, condition stage L1561, idle and error handlers L1751/L1792, advance and loop detection L1844/L1931, `_increment_iteration` L2142, triggers L2821, task execution graph L3030/L3068, `PRESETS` L3367, Auto-Dispatch L3619, `start_ralph` L3666, `ensure_presets` L3729, recovery L3819
- `backend/server.py`: execute task L13540, update task and auto test on done L13581/L20915, test queue limits L6456, pipeline result hook L22762, pipeline run start L25987, `@ralph` L26060, cascade runs L26268, research scheduler L28343, startup wiring L31401 to L31495
- `backend/cascade_runner.py` (50-round cap L38), `backend/auto_exec.py` (circuit breaker L30, Commander prompt L466), `backend/pipeline.py` (legacy loop, limit 5 L343), `backend/worker_queue.py`, `backend/hooks.py` (doom loop L1236/L1272, stop fan-out L1599, nudges L300, warning delivery L2246), `backend/experimental.py`, `backend/database_seeds.py` (flag seeding L631, "Ralph Loop" guideline), `backend/session_supervisor.py`, `backend/idle_reflection.py`, `backend/board_doc_backstop.py`, `backend/task_review.py`, `backend/role_templates.py`, `backend/config.py` (Commander guidance L200/L231, `RALPH_LOOP_PROMPT` L673), `backend/extension_host.py`, `backend/desktop_entry.py`
- `frontend/src/components/home/TaskFlow.jsx`, `lib/taskFlow.js`, `components/board/TaskDetailModal.jsx`, `components/pipeline/PipelineEditor.jsx`, `components/pipeline/PipelineRunDetail.jsx`, `components/chat/CascadeBar.jsx`, `components/prompts/PromptPalette.jsx`, `components/chat/ComposerQueue.jsx`, `lib/composerQueue.js`, `lib/terminal.js`, `lib/tokens.js`, `hooks/useWebSocket.js`, `hooks/useTaskAttention.js`, `lib/sessionAttention.js`, `lib/extensionRegistry.js`, `lib/informationArchitecture.js`, `screens/HomeScreen.jsx`, `App.jsx`
- installed bundle check: `grep "Run abbrechen" /Applications/IVE.app/Contents/Resources/backend/_internal/frontend/dist/assets/TaskFlow-CL0WQATJ.js`

Smoke test (temporary scratchpad, copy what you need):

- scripts: `/private/tmp/claude-501/-Users-maximilianschwarz/5351d8ba-945e-47c6-9f76-e8ef6642bb91/scratchpad/loops-smoke/smoke.mjs`, `/private/tmp/claude-501/-Users-maximilianschwarz/5351d8ba-945e-47c6-9f76-e8ef6642bb91/scratchpad/loops-smoke/ralph.mjs`, `/private/tmp/claude-501/-Users-maximilianschwarz/5351d8ba-945e-47c6-9f76-e8ef6642bb91/scratchpad/loops-smoke/graph.mjs` (JS port of the 1.0.17 task graph and the RALPH preset)
- report: `/private/tmp/claude-501/-Users-maximilianschwarz/5351d8ba-945e-47c6-9f76-e8ef6642bb91/scratchpad/loops-smoke/report.json`
- frames (1600×1000): `/private/tmp/claude-501/-Users-maximilianschwarz/5351d8ba-945e-47c6-9f76-e8ef6642bb91/scratchpad/loops-smoke/shots/` (A1 to A9 guided task, B1 to B4 cascade, C1 to C5 canvas, D1 doom loop, E1 to E3 queue, F1 and F2 board, G1 to G3 `@ralph`)
