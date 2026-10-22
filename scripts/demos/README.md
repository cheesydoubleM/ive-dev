# App demos for ive.dev

Recorded on 22 Oct 2026 from the **real IVE 1.0.17 frontend**, dark theme, project *Orbit*.
Round 2 (22 to 23 Oct 2026): `loop-task` and `loop-canvas` open on their own view instead of
Home (the trim is in the clip scripts; both re-recorded), and all six phone cuts (`-m`) are
recorded a second time in a phone window, with text 1.5x larger on a phone (see *Phone cuts*).

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
(1600×1000), lossless, taken from a chosen frame without the pointer; `-m` = 3:4 phone cut,
996×1328 (CRF 25), from its own recording in a phone window, its poster `<name>-m@2x.webp`
(see *Phone cuts*). Desktop crops are given in master pixels (CSS px × 2 of the 1600×1000
window).

| Clip | Length | Shows | End |
|---|---|---|---|
| `hero-board` | 13.5 s | Board of Orbit, full window with sidebar. Build the workspace (Claude Code, sonnet, Running), Connect the API (Codex, model `default`, Running), Check the sign-in flow (Claude Code, sonnet, Waiting with the `npm test` permission card), Review the changes (Claude Code, opus, Done). "Allow once" is clicked on the board, steps tick, all four end Done. | 0.5 s dissolve to frame 1 (loops) |
| `start-queue` | 19.1 s | Home: the goal "Add a dark theme toggle to the sidebar. Keep the existing keyboard shortcuts working." is typed, Start, the session opens, two steps land, the busy composer says "Claude is working. Write your next message, Enter queues it.", the follow-up "Also add ⌘⇧T as the shortcut and mention it in the README." is typed (DRAFT hint), Enter → "UP NEXT · 1 · QUEUED", the turn ends, IVE delivers it ("DELIVERED"), the follow-up appears and the agent starts on it (Read keymap.js, Edit). | last frame |
| `loop-task` | 15.5 s | Guided task "Fix the expired-session redirect". Opens on "Needs your attention" (1 item, "Plan approval needed"; the click on "1 item needs your attention" and Home stay off camera) → Review → "Approve the plan" (Proposed plan, Plan review, both "Reported pass") → "Approve plan & start" → Working → Checking the result → Fixing issues, scrolled to "Corrections" and "Test evidence · Reported failure" (13 passed, 1 failed) → Checking the result again (a second "Pipeline Testing Worker" session appears in the sidebar) → "Review the result" with "Accept result" → Run details: "Pipeline Run · completed · Cycle 2 of 3", every stage that ran "pass", Fix pending. Poster: Run details (round 1: Fixing issues), matching the homepage's static alt text. | last frame |
| `loop-canvas` | 14.8 s | Opens on "Choose a Pipeline" (⌘⇧L pressed off camera) with the six 1.0.17 presets; the saved "Sign-in checks loop" (RALPH graph, fixed Execute prompt) → Run → "Cycle 1 of 20 · running", Execute → Verify → Evaluate, the failed check takes the "Fix issues" edge, Fix runs, "Cycle 2 of 20", Verify again, pass, "completed" → Run Detail (Cycle 2 of 20, pass chips, Fix pending). | last frame |
| `loop-detect` | 9.8 s | "Check the sign-in flow" working; three identical "CALLING BASH · Run the sign-in checks · npm test" land; toast "Loop detected in Check the sign-in flow: repeated Bash with same input 3 times"; the turn ends and the corrective message arrives as the next user turn ("⚠️ [W2W] [Commander] Loop detected: …", the backend's own text from `backend/hooks.py`); the agent reads `tests/sign-in.spec.js` and edits `src/app/routes.js`. | last frame |
| `review` | 11.0 s | "Review the changes": Review opens the side panel (Code Review, Working Diff, UNSTAGED (2): `src/components/layout/Sidebar.jsx` M, `src/lib/api.js` M), Fullscreen Code Review, Unified View, the diff scrolls 300 px and stops. | 0.5 s dissolve |

Extra cuts and stills:

| File | What it is |
|---|---|
| `why-attention@2x.webp`, `why-attention.webp` | full board frame (pointer-free) with the permission card drawn; Why IVE beat 2 crops the waiting tile: x 488 to 1836, y 1048 to 1992 |
| `review-why.mp4`, `review-why@2x.webp` | Why IVE beat 3, ready cut: the fullscreen review only (from the Fullscreen click to the end), x 40 to 1380, y 150 to 1030 (1340×880 = 670×440 CSS): "FILES CHANGED · 2 files", the tree, the first hunk. Same region in `review.mp4` from 4.4 s on. |
| `review-full@2x.webp`, `review-full.webp` | full frame of the fullscreen review in Unified View (written by the recorder; not used by the site, removed from `assets/app` in QA round 1) |
| `still-model@2x.webp` | model menu (Haiku, Sonnet, Opus) with its chip, 512×310 |
| `still-mode@2x.webp` | agent mode menu (Default … Skip agent approvals, "Shared by Overview and Terminal.") with its chip; cropped to 672×760 in QA round 1 because the right 32 px showed a fragment of the page behind the menu (`stills.mjs` still writes 704 px: crop again after a re-run) |
| `still-palette@2x.webp` | ⌘K palette ("Search tools, sessions and projects…"), 1104×1234 |
| `hero-board@2x.webp`, `hero-board.webp` | the dark board still (all four states) for `assets/og.html` |

## Phone cuts (`-m`, round 2)

Round 1 cut the phone versions out of the 1600×1000 window. Below 720 px the site shows them
350 CSS px wide (390 px iPhone, 20 px gutters), so a 750 px wide cut put app text on screen at
0.47 of its size (0.57 to 0.58 for the hero, Pipelines and review cuts). Round 2 records every
story a second time in a short browser window and cuts a full-height 3:4 column out of it:
498×664 CSS px, 996×1328 device px, not scaled. On a 390 px phone that is 0.70 of the app's
size: text 1.5x larger than round 1 for start-queue, loop-task and loop-detect, 1.2x for the
other three. (The Product page shows its two loop clips in 301 px frames on that phone: 0.60.)

Why not the app's own phone layout: below 768 CSS px IVE switches to its phone remote UI
(`App.jsx`, `isMobile`): Home becomes a session list (with the German labels "Projekt" and
"Alle Projekte"), there is no board, and "Needs your attention" is off (`useTaskAttention` is
disabled), so the clips could not show the same moments. The windows below use the narrowest
desktop layout instead. They are real: the terminal install runs IVE in the browser, where any
window size is possible (the Mac app's own window is at least 900×600).

| Cut | Window (CSS px) | Camera (left edge of the 498 px cut, CSS px) | Length, size |
|---|---|---|---|
| `start-queue-m` | 768×664 | fixed at 250: the main column (goal box, conversation, queue and composer are 496 px wide here) | 19.2 s, 334 KB |
| `loop-task-m` | 768×664 | the window is 728 px wide: reads on the left (30), moves right only for what the pointer clicks (Review, "Approve plan & start", "Accept result" and Run details), Run details at 22, then right to 200 so "Cycle 2 of 3" shows clear of the site's buttons | 16.5 s, 762 KB |
| `loop-canvas-m` | 1100×664 | the presets (51, so "Pipeline Editor" reads whole; scrolled to "Your Pipelines"), the loop at 301 (Verify, Evaluate, Fix), the Run button at 511, Execute at 41, the loop, "Cycle 2 of 20" at 457, the loop, "completed" and Run Detail at 511, Run Detail view at 22 | 18.6 s, 522 KB |
| `loop-detect-m` | 768×664 | fixed at 250: steps, the warning toast and the corrective turn all sit in the main column | 9.8 s, 217 KB |
| `hero-board-m` | 1220×940 | fixed at x 235, y 276: the left column of the 2×2 board from below, the running tile's lower half and the whole waiting tile with "Allow once" | 13.5 s (0.5 s dissolve), 279 KB |
| `review-m` | 768×664 | the session column (250), the sidebar's Review entry (0), the side panel (270), the fullscreen review: "FILES CHANGED" (29), then the diff (264) | 11.0 s (0.5 s dissolve), 669 KB |

Why the other windows: in a 768 px window the Pipeline editor's 288 px properties panel leaves
a 456 px canvas, too narrow for a loop whose arrows leave a stage on the right and enter on the
left; a board tile needs room for the permission card. The camera (`lib/camera.mjs`) cuts hard
where the view changes and pans with an ease (0.5 to 0.8 s) inside a view, started in the clip
script right before the action it follows (`cam.to(r, x, { pan })`, `cam.fit(box, prefer)`).
A cut to a view that a click opened starts at `r.clickFrame`, the first frame after the release
(`cam.to(r, x, { from: r.clickFrame })`); cut at the frame after `untilVisible`, the new view
showed two frames at the old position first. A poster snap waits until a pan has landed.

The site lays its play and expand buttons over the top right corner of the phone frame (on a
360 px phone the last 150 CSS px of the cut in its top 76 px, `SITE_CONTROLS` in
`lib/camera.mjs`). `cam.fit` keeps text and buttons in the top rows of the window left of that
corner, which is why loop-task and loop-canvas move right once more for their cycle counters.

Differences from the desktop take, all real app behaviour: each phone cut is its own take
(timestamps, typing rhythm); the saved "Sign-in checks loop" has node positions for the
narrower canvas (user data, `placed` in `clips/loop-canvas.mjs`); the pipeline chooser scrolls
to "Your Pipelines"; loop-task holds 1 s on "Fixing issues" before the reports scroll in and
scrolls further (the window is shorter), so cycle 2 shows as the reports ("Test evidence: No
report yet", then 14 passed) rather than the next-step heading.

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
  (`advanceUntil`). Session export route stubbed (empty markdown). The guided task window is a
  lazy panel whose first open in a session commits about 0.3 s after the list closes, which
  filmed Home in between; the clip opens and closes it once off camera first.
- `loop-canvas`: presets from `lib/presets-1.0.17.json` (extracted from `PRESETS` in
  `backend/pipeline_engine.py`), routes `GET /pipelines?*` (with global presets, as the backend
  lists them) and `POST /pipeline-runs`, `pipeline_run_update` broadcasts per state. The saved
  pipeline is user data, so its node positions are chosen to centre the graph (desktop) or to
  fit the narrower canvas (phone). A preset is never run from the editor (fails in 1.0.17 for
  presets that use `{topic}`).
- `loop-detect`: the `doom_loop_warning` broadcast and the corrective user turn (backend text).
  Doom Loop Detection is an experimental feature seeded ON in 1.0.17.
- `start-queue`: nothing beyond pushed agent steps; the queue and its delivery are the app's own.
- `review`: the diff is demo data matching the story and the session's `git diff --stat`
  (Sidebar.jsx +18 −2, api.js +24 −6), served with `controls.setChanges`.

## Recording

```sh
node scripts/demos/record.mjs hero-board start-queue loop-task loop-canvas loop-detect review
node scripts/demos/record.mjs --phone hero-board start-queue loop-task loop-canvas loop-detect review
node scripts/demos/record.mjs --encode-only review     # re-encode kept frames (crops, CRF)
node scripts/demos/record.mjs --phone --encode-only loop-task   # the same for a phone cut
node scripts/demos/stills.mjs                          # still-model, still-mode, still-palette
```

The desktop run writes `<name>.mp4`, `-s.mp4`, the posters and the desktop crops (`review-why`,
`why-attention`); the `--phone` run writes only `<name>-m.mp4` and `<name>-m@2x.webp`, so either
can be repeated without touching the other's files. Round 2 recorded the desktop `loop-task` and
`loop-canvas` and all six `--phone` cuts; the other desktop files are round 1's.

Environment: `DEMO_OUT` (default `assets/app`), `DEMO_FRAMES` (frame scratch directory; each clip
keeps `meta.json` with snaps and marks, and `encoding.json` with crops measured while recording;
phone takes go to `<name>-phone`),
`IVE_DIST` (another frontend build). Needs `ffmpeg` with libx264 and `cwebp` on the PATH.

How it works (`lib/recorder.mjs`): Playwright's fake clock is installed on the browser context
before the app loads, so every timer the app sets is under control. The recorder advances the
clock one frame (1/30 s) at a time and captures the viewport at device pixel ratio 2 as a
lossless PNG (CDP capture, pixel-identical to `page.screenshot`). Capture speed never matters.
`until`/`untilVisible` record frames while the app loads or animates; `advanceUntil` (fixture)
runs the clock off camera for polling intervals. `snap()` takes a pointer-free frame for posters
and stills; `mark()` names a frame (a view change). A crop's `segments` give its position per
frame: a hard cut at `from`, or an eased pan over `pan` seconds (one ffmpeg `crop` with a
per-frame expression; a loop dissolve crops frame 1 at the first position). ffmpeg converts RGB to BT.709
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
- The app's own phone layout (below 768 CSS px) still has German strings in its session list:
  the project filter "Projekt", "Alle Projekte" and its label "Sessions nach Projekt filtern"
  (`frontend/src/components/mobile/PhoneOverview.jsx`). Not in any clip.
- If the site moves its phone frame buttons (`.frame-controls`, top right), update
  `SITE_CONTROLS` in `lib/camera.mjs`; the two extra camera moves for the cycle counters can
  then go.

## Rules

- Keep the recordings honest: real frontend, labelled demo data, no provider claims.
- Re-record after an app release that changes the views; bump the site's `?v=`.
- Do not commit frame directories; they are scratch.
