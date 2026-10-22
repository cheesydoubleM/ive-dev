# App demos for ive.dev

Recorded on 22 Oct 2026 from the **real IVE 1.0.17 frontend**, dark theme, project *Orbit*.

- Frontend: `ive-oss/frontend/dist`, built from ive-oss `951a002`. That is the release commit
  `5d33e8e` ("Release 1.0.17") plus one commit that only changes two strings in
  `frontend/src/components/home/TaskFlow.jsx`: the guided task's cancel button "Run abbrechen"
  becomes "Cancel run" (and its tooltip). `checkDist()` in `lib/fixture.mjs` checks the package
  version (1.0.17) and the build profile (`integrated-dev`) before every recording.
- With a build that still shows the German label (for example the installed 1.0.17 app),
  `lib/fixture.mjs` replaces exactly that label and its tooltip in flight (a Playwright route on
  `assets/TaskFlow-*.js`); the recording log says how many strings it replaced (0 with `951a002`).
- Transport: the app's own isolated test transport
  (`ive-oss/frontend/tests/interactive-onboarding-fixture.mjs`). It answers the app's API and
  WebSocket calls with demo data, blocks every other request, and never starts a provider or a
  backend, or writes to a real IVE. Nothing in the UI is mocked up; every pixel is rendered by the app.
- Playwright: `ive-team/frontend/node_modules` (paths in `lib/fixture.mjs`).

Provenance line for every clip: **IVE app · demo project · no provider ran.**

## The clips (`assets/app/`)

Every clip: `<name>.mp4` 3200×2000 (CRF 24 to 26), `<name>-s.mp4` 1600×1000, H.264 High,
BT.709 tagged, 30 fps, no audio; poster `<name>@2x.webp` (3200×2000) and `<name>.webp`
(1600×1000), lossless, taken from a chosen frame without the pointer; `-m` = 3:4 phone cut
(900×1200, or 850×1130 for the hero), its poster `<name>-m@2x.webp`. Crops are given in
master pixels (CSS px × 2 of the 1600×1000 window).

| Clip | Length | Shows | End |
|---|---|---|---|
| `hero-board` | 13.5 s | Board of Orbit, full window with sidebar. Build the workspace (Claude Code, sonnet, Running), Connect the API (Codex, model `default`, Running), Check the sign-in flow (Claude Code, sonnet, Waiting with the `npm test` permission card), Review the changes (Claude Code, opus, Done). "Allow once" is clicked on the board, steps tick, all four end Done. | 0.5 s dissolve to frame 1 (loops) |
| `start-queue` | 19.1 s | Home: the goal "Add a dark theme toggle to the sidebar. Keep the existing keyboard shortcuts working." is typed, Start, the session opens, two steps land, the busy composer says "Claude is working. Write your next message, Enter queues it.", the follow-up "Also add ⌘⇧T as the shortcut and mention it in the README." is typed (DRAFT hint), Enter → "UP NEXT · 1 · QUEUED", the turn ends, IVE delivers it ("DELIVERED"), the follow-up appears and the agent starts on it (Read keymap.js, Edit). | last frame |
| `loop-task` | 17.0 s | Guided task "Fix the expired-session redirect": "1 item needs your attention" → Review → "Approve the plan" (Proposed plan, Plan review, both "Reported pass") → "Approve plan & start" → Working → Checking the result → Fixing issues, scrolled to "Corrections" and "Test evidence · Reported failure" (13 passed, 1 failed) → Checking the result again (a second "Pipeline Testing Worker" session appears in the sidebar) → "Review the result" with "Accept result" → Run details: "Pipeline Run · completed · Cycle 2 of 3", every stage "pass", Fix pending. | last frame |
| `loop-canvas` | 15.5 s | ⌘⇧L: "Choose a Pipeline" with the six 1.0.17 presets; the saved "Sign-in checks loop" (RALPH graph, fixed Execute prompt) → Run → "Cycle 1 of 20 · running", Execute → Verify → Evaluate, the failed check takes the "Fix issues" edge, Fix runs, "Cycle 2 of 20", Verify again, pass, "completed" → Run Detail (Cycle 2 of 20, pass chips, Fix pending). | last frame |
| `loop-detect` | 9.8 s | "Check the sign-in flow" working; three identical "CALLING BASH · Run the sign-in checks · npm test" land; toast "Loop detected in Check the sign-in flow: repeated Bash with same input 3 times"; the turn ends and the corrective message arrives as the next user turn ("⚠️ [W2W] [Commander] Loop detected: …", the backend's own text from `backend/hooks.py`); the agent reads `tests/sign-in.spec.js` and edits `src/app/routes.js`. | last frame |
| `review` | 11.0 s | "Review the changes": Review opens the side panel (Code Review, Working Diff, UNSTAGED (2): `src/components/layout/Sidebar.jsx` M, `src/lib/api.js` M), Fullscreen Code Review, Unified View, the diff scrolls 300 px and stops. | 0.5 s dissolve |

Extra cuts and stills:

| File | What it is |
|---|---|
| `why-attention@2x.webp`, `why-attention.webp` | full board frame (pointer-free) with the permission card drawn; Why IVE beat 2 crops the waiting tile: x 488 to 1836, y 1048 to 1992 |
| `hero-board-m.mp4`, `-m@2x.webp` | crop x 484, y 92, 1230×1636 → 850×1130: the running tile above the waiting tile with its permission card |
| `review-why.mp4`, `review-why@2x.webp` | Why IVE beat 3, ready cut: the fullscreen review only (from the Fullscreen click to the end), x 40 to 1380, y 150 to 1030 (1340×880 = 670×440 CSS): "FILES CHANGED · 2 files", the tree, the first hunk. Same region in `review.mp4` from 4.4 s on. |
| `review-m.mp4`, `review-m@2x.webp` | phone cut of the review: the side panel (x 2000, 1200×1600), then from the Fullscreen click the "FILES CHANGED" list and the diff (x 40, y 60) |
| `review-full@2x.webp`, `review-full.webp` | full frame of the fullscreen review in Unified View (written by the recorder; not used by the site, removed from `assets/app` in QA round 1) |
| `still-model@2x.webp` | model menu (Haiku, Sonnet, Opus) with its chip, 512×310 |
| `still-mode@2x.webp` | agent mode menu (Default … Skip agent approvals, "Shared by Overview and Terminal.") with its chip; cropped to 672×760 in QA round 1 because the right 32 px showed a fragment of the page behind the menu (`stills.mjs` still writes 704 px: crop again after a re-run) |
| `still-palette@2x.webp` | ⌘K palette ("Search tools, sessions and projects…"), 1104×1234 |
| `hero-board@2x.webp`, `hero-board.webp` | the dark board still (all four states) for `assets/og.html` |

Phone cuts (`-m`) switch their crop where the view changes (marks in the clip scripts):
`start-queue` Home x 1090 → session x 816; `loop-task` attention list x 24 → task window x 524 →
Run details x 24; `loop-canvas` presets x 704,y 160 → canvas x 1380,y 100 (Verify, Evaluate,
Fix and the cycle counter, 1200×1600) → Run Detail x 24; `loop-detect` steps → toast (top
right) → corrective turn. Desktop app text in a 3:4 cut is about half size on a phone; that is
the limit of a 16:10 window.

## What is demo data, and what the clips add through the transport

All project, session, task, run and report content is demo data for project Orbit; no numbers
are claims about IVE. Where the transport has no data for a loop, the clip adds it the way the
backend would, without editing ive-oss:

- `loop-task`: task, guided-task graph (`lib/graph.mjs`, a port of 1.0.17
  `pipeline_engine.py::_start_task_execution_pipeline` with exact ids, names, positions and
  labels), run states pushed with `controls.setRun` in the engine's order (research 05,
  section 3.3: a loop-back resets Verify, Verify Gate, Fix and Ready for Review and raises the
  cycle), pipeline sessions named as the engine names them ("Pipeline Planner/Worker/Testing
  Worker (Claude Code)") and announced with `session_created`. Plan approval goes through the
  transport's real resume. The window polls every 3.5 s; that wait runs off camera
  (`advanceUntil`). Session export route stubbed (empty markdown).
- `loop-canvas`: presets from `lib/presets-1.0.17.json` (extracted from `PRESETS` in
  `backend/pipeline_engine.py`), routes `GET /pipelines?*` (with global presets, as the backend
  lists them) and `POST /pipeline-runs`, `pipeline_run_update` broadcasts per state. The saved
  pipeline is user data, so its node positions are chosen to centre the graph. A preset is never
  run from the editor (fails in 1.0.17 for presets that use `{topic}`).
- `loop-detect`: the `doom_loop_warning` broadcast and the corrective user turn (backend text).
  Doom Loop Detection is an experimental feature seeded ON in 1.0.17.
- `start-queue`: nothing beyond pushed agent steps; the queue and its delivery are the app's own.
- `review`: the diff is demo data matching the story and the session's `git diff --stat`
  (Sidebar.jsx +18 −2, api.js +24 −6), served with `controls.setChanges`.

## Recording

```sh
node scripts/demos/record.mjs hero-board start-queue loop-task loop-canvas loop-detect review
node scripts/demos/record.mjs --encode-only review     # re-encode kept frames (crops, CRF)
node scripts/demos/stills.mjs                          # still-model, still-mode, still-palette
```

Environment: `DEMO_OUT` (default `assets/app`), `DEMO_FRAMES` (frame scratch directory; each clip
keeps `meta.json` with snaps and marks, and `encoding.json` with crops measured while recording),
`IVE_DIST` (another frontend build). Needs `ffmpeg` with libx264 and `cwebp` on the PATH.

How it works (`lib/recorder.mjs`): Playwright's fake clock is installed on the browser context
before the app loads, so every timer the app sets is under control. The recorder advances the
clock one frame (1/30 s) at a time and captures the viewport at device pixel ratio 2 as a
lossless PNG (CDP capture, pixel-identical to `page.screenshot`). Capture speed never matters.
`until`/`untilVisible` record frames while the app loads or animates; `advanceUntil` (fixture)
runs the clock off camera for polling intervals. `snap()` takes a pointer-free frame for posters
and stills; `mark()` names a frame where a phone cut switches. ffmpeg converts RGB to BT.709
limited range with tags, so browsers show the captured colours. Loops dissolve back to frame 1
only where the clip loops on its own (`loopFade`); the four Inside IVE clips end on their last
frame because the next chapter follows. A full-frame dissolve costs about 0.4 MB per 0.5 s.

Clips not in the redesign (`board`, `home`, `session`, `setup`) are the 1.0.12 light recordings'
scripts; their files go with those recordings.

## Notes for 1.0.18 and the owner

- Gemini CLI is `active=False, deprecated=True` in 1.0.17 (`backend/cli_profiles.py`); the app
  shows "Gemini deprecated" for such a session and offers no Gemini models. The fourth board tile
  therefore stays Claude Code opus. The site copy names Gemini through the active Antigravity CLI
  profile instead, as "Gemini (Antigravity CLI)" (owner decision, 2026-10-22; see the site README).
- Accepting a guided task result that was opened from "Needs your attention" closes the window,
  so `loop-task` shows "Accept result" and ends on Run details instead of clicking it.

## Rules

- Keep the recordings honest: real frontend, labelled demo data, no provider claims.
- Re-record after an app release that changes the views; bump the site's `?v=`.
- Do not commit frame directories; they are scratch.
