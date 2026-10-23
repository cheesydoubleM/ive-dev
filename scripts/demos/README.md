# App demos for ive.dev

**Round 4 (23 Oct 2026): the site plays no recordings any more.** Every app demo is generated on
the page from the frontend's own stylesheet and DOM markup (`assets/demo/`, see *Generated demos*
below). The recorder in this folder stays as the storyboard source (`clips/`) and as the
reference tool: `snapshot.mjs` runs a clip's story through the real frontend and writes the DOM
dumps and screenshots the generated scenes are copied from; `posters.mjs` renders the generated
scenes to the poster images. The sections after *Generated demos* describe the recordings as they
were (rounds 1 to 3) and still apply to `record.mjs`.

## Generated demos (round 4, 23 Oct 2026)

Owner steering (German, 18:11): the recordings had bad quality; every single video is to be
replaced by UI generated on the website, exactly like the real IVE app, no recording from IVE,
and one should be able to scroll through it.

- `assets/demo/app.css` is `ive-oss/frontend/dist/assets/index-DpuWca4j.css` (the 1.0.17 build)
  with only `url(/fonts/` rewritten to `url(fonts/`; `assets/demo/fonts/` holds the app's Inter
  400/500/600 and JetBrains Mono 400/500 (OFL). So the demos are styled by the app's stylesheet,
  tokens (`--x-*`), theme switch (`html[data-theme]`) and all.
- `assets/demo/r8/frame.html` + `frame.js`: one scene per same-origin iframe
  (`?scene=<id>&theme=light|dark[&variant=hero][&at=seconds][&phone=1]`). The stage (`#stage`,
  the app window) scales to the iframe but never below the scene's `fit.minScale` (0.72 default,
  0.6 for the board's establishing view): below that the app window itself gets narrower, so
  text stays legible (a 588 px Product column shows the app at about 817 px wide). `window.IVE_DEMO`
  (seek/play/pause/time/duration/markers/poster) and postMessage (`ready`, `time`, `ended`,
  `playstate`, `takeover`, `key`) are the protocol with the parent page (`demo.js`). Any pointer
  press, wheel or key inside the stage pauses the timer.
- `assets/demo/r8/lib/`: `dom.js` (`html` template tag, `morph` patches the live DOM so scroll
  positions and selections survive a re-render), `timeline.js` (`script()`: hold/click/type/do/
  every/mark/scroll, `createPlayer`: `seek(t)` replays the deterministic event list from the
  start when scrubbing backwards, pointer and click ring, data-stick containers follow new output
  until a visitor scrolls them up), `term.js` (terminal screens as DOM rows in the look of the
  app's xterm: 13 px SF Mono/Menlo, 18 px rows, the CLI-style transcript helpers from the former
  `lib/tui.mjs`, the bordered prompt box as a real frame), `icons.js` (the lucide icons as the app
  emits them, generated from the dumps), `ui.js` (shell, sidebar, header, session screen, brief,
  transcript, composer, terminal drawer, launch strips), `board.js` (SessionGrid tiles, permission
  card), `home.js` (Home screen, composer queue, toast), `taskflow.js` (Needs your attention, the
  guided task window, Run details), `pipeline.js` (Pipeline editor, canvas, Run Detail),
  `review.js` (review panel, fullscreen review, diff renderer).
- `assets/demo/r8/scenes/`: `board`, `attention`, `terminal`, `terminals`, `start`, `autofix`,
  `pipelines`, `loopdetect`, `review`, each a port of the clip script of the same story
  (`clips/hero-board.mjs`, `terminal.mjs`, `terminals.mjs`, `start-queue.mjs`, `loop-task.mjs`,
  `loop-canvas.mjs`, `loop-detect.mjs`, `review.mjs`). A scene exports `{ id, title, script,
  poster, fit, init, render(state, ctx) }`; `render` returns the whole app window as markup.
- References: `node scripts/demos/snapshot.mjs --light terminal terminals start-queue loop-task
  loop-canvas loop-detect review` and `node scripts/demos/snapshot.mjs hero-board` (dark) write
  `<clip>[-light]/NN-<state>.html` (outerHTML, canvases removed) and `.png` (2×) per snap, mark
  and hold into `$DEMO_REF` (default `$TMPDIR/ive-demo-ref`). Markup in `lib/*.js` is copied from
  these dumps; when the app changes, dump again and diff.
- Posters: `node scripts/demos/posters.mjs [names]` renders each scene at its poster time through
  a static server of the worktree (`DEMO_BASE`, default `http://127.0.0.1:4180/`) and writes
  `assets/demo/posters/<name>.webp` (1600), `<name>@2x.webp` (3200) and `<name>-m.webp` (phone,
  780×1040); `board-hero` (1600×554, `variant=hero`), `attention` and `review-dark` (1280×880) for
  the hero and the Why panel.
- What is real and what is scripted: the markup, class names, labels, states and the stylesheet
  are the app's; the data is the Orbit demo project as before; the CLI-style terminal text, the
  agent steps, reports and diffs are demo data written to the story; typing, clicks and scrolling
  are scripted pointer and keyboard actions, and the visitor's own scrolling and selecting are
  real. No provider ran. Provenance line: **IVE interface, rendered live · demo project · no
  provider ran.**

## The app built into the site (round 5, 23 Oct 2026, evening)

Owner steering: "ich will, dass in der Website die IVE-App quasi gebaut ist"; refined in his Codex
thread to a hybrid: a sharp automatic preview per slot and a "Try it yourself" button next to it
that opens the usable app.

- `assets/demo/r8/lib/app.js`: the interactive model of the 1.0.17 interface. State: view (home,
  board, session), active session, board tabs, sessions, per-session Overview rows and terminal
  model (one source, `lib/data.js`), modes (overview, drawer, full terminal), tile views (chat,
  terminal), queue (UP NEXT), toasts, agents (canned programs with timed events: step, say,
  toast, nudge, done). Handlers: click (sidebar, header, Home Start, board tiles: Open, view
  toggle, close, Allow once / Don't allow; session: drawer bar, composer, activity groups,
  Cancel), dblclick (open a tile), input (composers; the terminal's hidden input takes
  characters, paste and virtual keyboards), key (Enter sends, Backspace, Escape, ⌘J, the
  permission dialog's 1/2/3), submit, tick (background work while the frame is visible).
  Narrow windows keep the header's sidebar toggle and open the sidebar as an overlay.
- Modules (`lib/mod-review.js`, `lib/mod-pipelines.js`, `lib/mod-flow.js`) add the Review panel
  and fullscreen, the Pipeline editor (chooser, canvas, Run, Run Detail) and the guided task
  flow (attention list, task window, approval, cycles, Run details) through one interface:
  `{ id, init(state, env), overlays(state, ctx), main(state, ctx), click(e, state, api), key(e, state, api), tick(state, dt, api) }`.
  Openers: the sidebar's Project tools (Pipelines, Guided task, Review), the "needs your
  attention" button, ⌘⇧L.
- `frame.html?scene=<route>&mode=app` boots the app at a route; the parent's "Try it yourself"
  buttons (`demo.js`) open it in the viewer dialog. Honesty: the replies are canned demo data,
  the dialog's caption says so; no provider, no shell, nothing leaves the page.

## The recordings (rounds 1 to 3, kept for `record.mjs`)

Recorded on 22 Oct 2026 from the **real IVE 1.0.17 frontend**, dark theme, project *Orbit*.
Round 2 (22 to 23 Oct 2026): `loop-task` and `loop-canvas` open on their own view instead of
Home (the trim is in the clip scripts; both re-recorded), and all six phone cuts (`-m`) are
recorded a second time in a phone window, with text 1.5x larger on a phone (see *Phone cuts*).
Round 2B (23 Oct 2026): every story recorded again in the app's **light theme at 60 fps** as its
own file family (see *Light takes*). Round 3 added the terminal takes. Since round 4 none of these
files is on the site; `record.mjs` still produces them into `assets/app/` if ever needed.

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

## Light takes (round 2B, 23 Oct 2026)

Owner decision after the light hero went live for a moment on 23 Oct: "der dunkle Hero war besser,
aber die Clips sollten von dem hellen Dashboard sein". So the hero and the Why panel keep the dark
`hero-board` take (with `why-attention` and `review-why`), and every clip the reel and the Product
page play is a light take. `record.mjs --light` records the same story with the app in its light
theme (the app's test fixture sets `ive-theme.v2` before the app loads; nothing is injected or
recoloured) at 60 fps, CRF 18 master, 19 inline, 19 phone cut (the hero-focus set's values; the
clips' own CRF 26 for `loop-task` and `review` do not apply). The family is `<name>-light`;
`hero-board` names its light family `board-light` (`meta.lightId`). The light desktop run writes
no crops or stills (no light `review-why` or `why-attention`); the phone cut works as in round 2.
Frames go to `<name>-light` and `<name>-light-phone`. Each light take is its own take (timestamps,
typing rhythm); windows, cameras and stories are those of the dark takes.

| Clip | Light family | Length desktop / phone | Master / inline / phone cut | Used by |
|---|---|---|---|---|
| `hero-board` | `board-light*` | 13.5 s / 13.5 s | 2383 KB / 951 KB / 603 KB | the Board row on Product |
| `start-queue` | `start-queue-light*` | 18.7 s / 18.8 s | 1029 KB / 436 KB / 595 KB | reel chapter 1, Product row Home and sessions |
| `loop-task` | `loop-task-light*` | 15.4 s / 16.4 s | 1593 KB / 607 KB / 1357 KB | reel chapter 2, Product Auto-fix loop |
| `loop-canvas` | `loop-canvas-light*` | 14.6 s / 18.4 s | 765 KB / 331 KB / 713 KB | reel chapter 3, Product Pipelines |
| `loop-detect` | `loop-detect-light*` | 9.8 s / 9.8 s | 738 KB / 308 KB / 345 KB | reel chapter 4, Product Loop detection |
| `review` | `review-light*` | 10.8 s / 10.8 s | 1984 KB / 835 KB / 1065 KB | Product row Review |

Masters are larger than the dark ones (60 fps, CRF 18); they play only in the viewer, the site
plays the inline and phone files. The dark `start-queue`, `loop-task`, `loop-canvas`,
`loop-detect` and `review` families and `hero-board-m*` were removed from `assets/app` with the
switch (git history keeps them); the dark `hero-board`, `hero-board-s`, their posters,
`why-attention*` and `review-why*` stay.

## Terminal takes (round 3, 23 Oct 2026)

Owner request on 23 Oct: people should see at once that their CLI runs in a normal terminal inside
IVE, "nur halt enhanced", and that ten of them run on the board at the same time; the clips should
not only use the Overview. Two takes, light theme, 60 fps, CRF 18/19/19, recorded with
`record.mjs --light [--phone] terminal terminals`:

| Clip | Window | Length | Shows | Used by |
|---|---|---|---|---|
| `terminal` → `terminal-light*` | 1600×1000 (phone 768×664) | 13.9 s | Session "Build the workspace" at Session level with the terminal expanded to the full view (the app's own drawer bar "Terminal · claude", ⌘J; `ive.terminal-drawer` = `{drawer: {interface: 'full'}}`). A click into the terminal, the instruction "Add a dark theme toggle to the sidebar." typed and sent with Enter (real keystrokes into xterm, `input` actions on the transport), the CLI-style transcript streams (Read, Search, Update, Bash, the reply, the prompt box returns), the session turns Done, then "Restore small terminal": the same session as Overview (steps, reply) above and the terminal below. | reel chapter 01, Product row Terminal |
| `terminals` → `terminals-light*` | 2080×1300, master 4160×2600, `-s` 1600×1000 | 14.2 s | The Board with the sidebar, ten Orbit sessions as tiles in the app's Terminal view (`cc-terminalBoardMode`, `cc-gridColumns` 5; 362 px tiles keep the 9 px preview font floor, below 360 px it is 8 px). Every tile a full screen of CLI-style transcript, live steps keep landing, spinners tick; "7 running" becomes "5 running" as Update the docs and Add the audit log finish; the waiting tile Check the sign-in flow shows the CLI's own permission dialog, a click into the tile and Enter answer it (its status goes Running, then Done); at the end "Open" on Fix the flaky test shows that terminal at full size at Session level. Ten is the configuration shown, not a limit. | reel chapter 02, Product row Board (replaces `board-light*`) |

Phone cuts: `terminal-m` is the usual 1:1 cut from a 768×664 window, camera on the main column
(250), moving right for the Restore button and back. `terminals-m` comes from the same 2080×1300
window: the board as a wide 3:4 view of the full window height (1950×2600 device px scaled to
996×1328: both rows and the sidebar list, it establishes ten and the status words rather than
reading), a hard cut from the left half (the Enter) to the right half (Update the docs finishing),
back to the left for the Open click, then the opened terminal 1:1 at 996×1328 (the drawer bar and
the first rows, 13 px font). `lib/camera.mjs` takes a `cut` per segment for this; the encoder
concatenates segments of different sizes with hard cuts and scales them to one output.

What is real and what is scripted: the app, its xterm terminals, the tiles, the status words, the
sidebar, the drawer and the view switch are the real frontend; the click, the typing, Enter and
"Open" are real input (the transport records them as `input` actions). The terminal **text** is
scripted demo output written to look like a coding CLI's transcript for the Orbit story
(`lib/tui.mjs`: a Claude Code-style transcript with ⏺ tool lines, a spinner line and the bordered
prompt box; a Codex-style one with › and •), fed through the transport's PTY `output` channel the
way a CLI's output would arrive, with the transport's own "IVE test transport · no provider
process" banner cleared first. No CLI and no provider ran; every number in the transcripts is
demo data. The same provenance line applies: IVE app · demo project · no provider ran.

Recording notes: the first eight terminals on a page render with WebGL, the rest with xterm's
DOM renderer (`MAX_WEBGL_TERMINALS` in `Terminal.jsx`); the recorder's CDP capture at DPR 2
renders both cleanly. Playwright's plain `page.screenshot()` shows WebGL terminals blank, so it
cannot judge these takes; use the captured frames. In a tile, `.xterm-screen` keeps the
Session-level geometry (wider and taller than the tile), so a click must target the tile's
`[data-terminal-slot]`, not the screen. The permission in the terminal take is the CLI's own
dialog text; IVE's card is not shown in Terminal view, the tile and the sidebar mark the session
as waiting.

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
node scripts/demos/record.mjs --light hero-board start-queue loop-task loop-canvas loop-detect review          # light takes, 60 fps
node scripts/demos/record.mjs --light --phone hero-board start-queue loop-task loop-canvas loop-detect review  # their phone cuts
node scripts/demos/record.mjs --light terminal terminals           # round 3: the terminal takes (and --phone)
node scripts/demos/stills.mjs                          # still-model, still-mode, still-palette
```

The desktop run writes `<name>.mp4`, `-s.mp4`, the posters and the desktop crops (`review-why`,
`why-attention`); the `--phone` run writes only `<name>-m.mp4` and `<name>-m@2x.webp`, so either
can be repeated without touching the other's files. `--light` writes the `<name>-light` family
(`board-light` for `hero-board`) and never touches the dark files. Round 2 recorded the desktop `loop-task` and
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
`board-light*` (the four-tile light board of round 2B) was removed from `assets/app` in round 3; its
script is still `hero-board.mjs --light` (`meta.lightId`).

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

- Keep the demos honest: the app's own markup and stylesheet, labelled demo data, no provider claims.
- After an app release that changes the views: dump again (`snapshot.mjs`), update `assets/demo/app.css`, the fonts and the markup in `assets/demo/r8/lib/`, regenerate the posters, bump the site's `?v=`.
- Do not commit frame or dump directories; they are scratch.
