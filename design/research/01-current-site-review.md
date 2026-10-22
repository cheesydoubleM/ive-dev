# ive.dev: design review of the current site

Reviewed on 2026-10-22 against the live site (https://ive.dev, byte-identical to this worktree's `index.html` except Cloudflare's email obfuscation). Browser: Playwright Chromium 151, headless. Desktop 1440 x 900 at 1x, phone 390 x 844 iPhone emulation at 3x. Both themes. Every number below was measured, not estimated.

All screenshots live under
`/private/tmp/claude-501/-Users-maximilianschwarz/5351d8ba-945e-47c6-9f76-e8ef6642bb91/scratchpad/redesign/review/`
(abbreviated `REVIEW/` below):

- `REVIEW/shots/index-{dark,light}-{desktop,mobile}/vp-NNNNNN.png`: viewport shots every 0.9 viewports (the number is the scroll offset in px), plus `full.png`, `report.json` (sections, media, a11y, requests) and `texts.json` (visible text per section).
- `REVIEW/anim/{desktop-dark,mobile-dark,desktop-light}/<scene>-NNN.png`: frame captures of the scroll-driven scenes at NNN percent of each scene's scroll travel.
- `REVIEW/shots/{architecture,imprint,privacy,404}-…/`: subpages.
- `REVIEW/perf-{desktop-normal,desktop-reduced,mobile-normal}.json`: page weight on the wire via CDP.
- `REVIEW/index-copy.txt`: every string in `index.html` per section, including aria labels and captions.

## 0. Verdict in five lines

1. The page is 35,870 px tall at 1440 px (about 40 screens). 43 percent of that (15,376 px) is pinned scroll inside five scroll scenes. A reader who only wants to know what IVE does must scroll past 4,680 px of opening and 963 px of hero before the first real recording.
2. The same story (goal "Make sign-in more secure", sessions Sign-in backend, Sign-in screen, Sign-in checks, Review the changes, `npm test`, 14 tests) is told in seven sections. "Review the changes" is on screen 16 times, "npm test" 22 times, "Sign-in backend" 13 times. That, not the animations, is why it feels like one long loop.
3. Twelve sections open with the same grammar: 11 px mono kicker, two-line Archivo headline (second line grey), one Source Sans lede, then an app window on the right, then a 10 px mono caption, then a hairline. The eye learns the loop by the third section.
4. The page explains how IVE works at length (coordination, retries, review, 12 captions about what is drawn and what is recorded) but almost never says why someone should want it: what they get done, what stops getting lost, how it feels to run four agents from one window on their own machine.
5. Keep: the opening scene and the Why IVE question, both tightened by roughly half. Keep the five real recordings and the real review still, moved up to carry the page. Keep the merge lanes as a short beat. Drop the tunnel, the How-it-works story, the four-pillar drawings, the run chooser and the second hero. Put the logo film in a quiet, small, silent closing.

## 1. Section inventory (homepage, 1440 x 900, dark)

Heights are measured `getBoundingClientRect()` values after a full slow scroll. The header is fixed, 77 px.

| # | Section (`id`, class) | Top (px) | Height (px) | Screens | Its single job today | Screenshot |
|---|---|---|---|---|---|---|
| 0 | header `.nav` | fixed | 77 | | Wordmark 28 px + "by AIFOREU", 4 anchor links, theme toggle, GitHub icon, "Install IVE" | every shot |
| 1 | `#mark` `.mark` | 0 | 4,680 | 5.2 | Opening: swarm in a corridor, cards dock on a board, letters, "Integrated Vibecoding Environment" | `anim/desktop-dark/mark-000…100.png` |
| 2 | `#request` `.hero` | 4,680 | 963 | 1.1 | Second opening: H1 "Run agents. Keep control.", lede, Mac download, "See how it works", 4 chips, curl box, drawn board | `anim/desktop-dark/hero-000.png` |
| 3a | `#inside` `.chapter.inside` (recordings part) | 5,643 | about 1,494 | 1.7 | Five real recordings in tabs (board, session, home, review, models and modes) | `shots/index-dark-desktop/vp-005670.png`, `vp-006480.png` |
| 3b | `#behind` `.behind` (nested inside `#inside`) | 7,137 | 4,590 | 5.1 | Pinned tunnel: board, one session, failure context, retry loop, diff and review | `anim/desktop-dark/behind-000…100.png` |
| 4 | `#why` `.why` | 11,727 | 4,410 | 4.9 | Full-screen "WHY IVE?", then four beats with a tile deck | `anim/desktop-dark/why-000…100.png` |
| 5 | `#workflow` `.closer` | 16,137 | 1,596 | 1.8 | Two crops of the recordings with copy ("Four conversations. One place to look." and "Zoom in. Stay in context.") | `vp-016200.png`, `vp-017010.png` |
| 6 | `#operation` `.story` | 17,733 | 3,960 | 4.4 | Pinned "How IVE works": drawn Home, drawn board, seven step captions | `anim/desktop-dark/story-000…100.png` |
| 7 | `#route` `.chapter.pillars` | 21,693 | 3,448 | 3.8 | "What IVE handles": four pillars (overview, tasks, retries, context), each with a drawn window | `vp-021870.png`, `vp-022680.png`, `vp-023490.png`, `vp-024300.png` |
| 8 | `#merge` `.merge` | 25,140 | 2,160 | 2.4 | Pinned lanes: eight sessions curve into one review tile | `anim/desktop-dark/merge-000…100.png` |
| 9 | `#verify` `.review-section` (light ground) | 27,300 | 1,749 | 1.9 | Review copy, a drawn review session, the real fullscreen review still, three columns | `vp-027540.png`, `vp-028350.png` |
| 10 | `#runs-on` `.chapter.pillars` | 29,050 | 2,332 | 2.6 | "What you bring": terminal, models, tokens; two drawn windows | `vp-029160.png`, `vp-029970.png`, `vp-030780.png` |
| 11 | `#open-source` `.chapter` | 31,382 | 568 | 0.6 | License, curl box, two buttons, five-row ledger | `vp-030780.png`, `vp-031590.png` |
| 12 | `#runs` `.chapter.use-cases` | 31,950 | 1,148 | 1.3 | Three-way run chooser with a drawn Home view | `vp-031590.png`, `vp-032400.png` |
| 13 | `#questions` `.chapter.faq` | 33,098 | 478 | 0.5 | Five FAQ rows | `vp-032400.png`, `vp-033210.png` |
| 14 | `#install` `.install-section` | 33,576 | 1,091 | 1.2 | Mac card, terminal panel, requirements, clone details, star ask | `vp-033210.png`, `vp-034020.png` |
| 15 | `#aiforeu` `.madeby` (light ground) | 34,666 | 1,049 | 1.2 | AIFOREU logo film with sound | `vp-034830.png`, `vp-035640.png` |
| 16 | footer | 35,716 | 155 | 0.2 | IVE from AIFOREU, four links, license line | `vp-035640.png` |

Total 35,870 px. Mobile (390 x 844): 35,135 px, about 42 screens; the hero alone is 1,624 px there (`shots/index-dark-mobile/vp-003800.png`).

Pinned travel (scroll distance where the viewport is frozen on a scene): mark 3,780 + behind 3,766 + why 3,510 + story 3,060 + merge 1,260 = 15,376 px, 43 percent of the page.

Visible words (innerText, dark desktop): 3,726. By section: hero 447, inside 286, why 361, workflow 111, operation 438, route 735, merge 59, verify 220, runs-on 417, open-source 67, runs 212, questions 43 (collapsed answers not counted), install 229, aiforeu 53. The route section alone is longer than Linear's whole homepage copy. Headings: 1 h1, 14 h2, 24 h3. Nine full app windows are inlined as HTML (`.au-window`), 91 session tiles (`.au-tile`), 7 `<video>` elements.

## 2. Repetition ledger

Counts are occurrences in the rendered, visible text of the dark desktop page (collapsed FAQ answers excluded), from `REVIEW/count.py`. Sentences are quoted exactly.

### 2.1 The same message in different words

**"One goal becomes tasks" (7 tellings)**
- Hero lede: "Give IVE one goal. It coordinates the work, catches problems, and brings you one clear result to review."
- Why, beat 1: "One goal. Parallel work." / "IVE splits your goal into focused tasks."
- Why, caption: "Illustrated example · one goal, four focused tasks"
- How it works: "From one goal to one review." and "PLAN — IVE turns the goal into focused tasks."
- What IVE handles, lede: "It splits the goal into tasks, keeps sessions separate, retries failed checks, and brings the changes back for review."
- What IVE handles, pillar 2: "Split one goal into separate tasks." / "Describe the change. IVE creates focused tasks, starts the sessions, and keeps overlapping work from colliding."
- Run chooser: "The example run shows how one goal becomes focused work and returns as one result to review." and the caption "One feature. Four focused tasks. One review."

**"Everything in one view" (8 tellings)**
- Mark captions: "Agents running everywhere." then "Under control."
- Hero kicker: "LOCAL CONTROL FOR CODING AGENTS"; H1: "Run agents. Keep control."; chip: "Every agent in one view"
- Inside, tab 1: "See the work together." / "Four sessions side by side, each with its own conversation and controls."
- Why, beat 2: "Every agent. In view." / "See what's running, waiting, or needs you."
- In the app: "Four conversations. One place to look." / "See the status and latest response of each open session."
- How it works: "WATCH — Follow every task from one screen."
- What IVE handles, pillar 1: "See every session in one place." / "IVE shows what is running, what is waiting, and which task needs your input."

**"A failed check is retried" (6 tellings, 11 visible uses of retry/retries/retried)**
- Hero lede: "catches problems"
- Inside the retry: a whole 4,590 px section, captions "The failed check supplies context for the next attempt." and "Fix the change. Run the checks again. Stop at the retry limit."
- Why, beat 3: "A failed check? IVE retries." / "Failed checks go back for another attempt."
- How it works: "CHECK — Failed checks are fixed and tried again."
- What IVE handles, lede: "retries failed checks"; pillar 3: "Retry failed checks automatically." / "When a test fails, IVE can return the task for another attempt."

**"One result, you decide" (10 tellings; "review" appears 61 times, decide/decision 11 times)**
- Why, beat 4: "One result. Your call." / "Review the changes. Decide what gets merged." plus caption "the final decision stays yours"
- Inside the retry: "The checks pass. You decide." and "Passing checks give you evidence. You still review the change." and "Read the diff. Decide what to merge."
- How it works: "REVIEW — You decide what gets merged." and "RESULT — Completed changes come back together."
- Merge: "Every session comes back as one review."
- Review section: "Review the result before it is merged." plus three columns ("Compare the files.", "See open issues.", "Choose what happens next.")
- Drawn review session, twice: "The final decision stays with you."
- Run chooser: "leaves the merge decision with you"

**"Runs on your machine" (7 tellings)**
- Hero lede: "Your code stays on your machine."; chip: "Your code stays local"
- What you bring: "Sessions run on your own accounts." and "The key is stored in IVE's local settings on your machine."
- Open source ledger: "runs / on your machine"; headline "Read the code. Run it locally."
- Install lede: "IVE is open source under the Apache 2.0 license and runs on your machine."
- FAQ: "Does everything stay on my machine?"
- Architecture page title: "What actually runs on your machine."

### 2.2 The same facts

| Fact | Visible count | Where |
|---|---|---|
| Claude Code · Codex · Gemini CLI (list form) | 5 (+3 in collapsed FAQ) | hero chip, what you bring, open source ledger, install twice |
| "open source" / "Apache 2.0" | 6 / 5 (+2 FAQ) | hero chip, open source (3), install, footer |
| `curl -fsSL https://ive.dev/install.sh \| bash` box with Copy button | 3 | hero, open source, install (plus the clone block) |
| "Install IVE" as a button or link | 4 | nav, open source, install headline, footer (plus 404) |
| "Download for Mac" | 2 | hero, install |
| "View on GitHub" | 2 | open source, install; GitHub named 7 times, plus the nav icon |
| Apple silicon / macOS 13.5 | 3 / 2 | hero note, install (twice) |
| GOAL → PLAN → WORK → CHECK → REVIEW | 3 | story header, story step captions (seven, not five), run chooser caption |
| Star ask | 1 | install ("If IVE is useful to you, give it a star on GitHub.") |
| Provenance captions ("drawn in the app's design", "Illustrated example", "Recorded from…", "demonstration") | 7 + 3 + 5 + 4 = 19 | nearly every figure |

The 19 provenance captions are honest, but they also mean the page apologises for its own pictures nineteen times. The fix is fewer pictures, more of them real.

### 2.3 The same picture

The example "Make sign-in more secure" with its four sessions is the content of seven sections (hero, why, how it works, what IVE handles, merge, review, what you bring). Visible counts: "Review the changes" 16, "Sign-in backend" 13, "Sign-in checks" 12, "npm test" 22, "14 tests" or "14 passed" 15, "Reply ready" 16, "Message this session…" 17, "Ask on the side /btw" 13, "Orbit" 19.

The board is drawn or recorded nine times: hero (drawn), inside (recorded video), tunnel start (drawn), why (four tiles), in the app (recorded crop), how it works (drawn), what IVE handles (drawn), merge (session rows + one tile), review (drawn session). The Home view appears three times (how it works, what IVE handles, run chooser), each time with the same typed sentence pattern and "Continue working" list.

### 2.4 The same CTA logic

Four ways to get IVE in the first viewport alone (desktop): nav "Install IVE", hero "Download for Mac", hero curl box with Copy, and the note "On Linux or an Intel Mac, paste this into your terminal". The curl box returns in open source and in install. The primary button is blue in the hero and install, white in the nav and open source. Three scroll cues say the same thing: "Scroll" (mark), "Keep scrolling" (why), "Follow the checks ↓" (inside).

## 3. Layout sameness

### 3.1 One opener grammar, twelve times

Sections 3a, 3b, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15 all open with: 11 px IBM Plex Mono uppercase kicker, 32 to 54 px Archivo (125 percent width) headline on two lines, then a Source Sans lede at 16 to 18 px. Seven of them colour the second headline line grey (inside, tunnel, in the app, why beats, what you bring, open source, install). Compare `vp-005670.png` (inside), `anim/desktop-dark/behind-000.png` (tunnel), `vp-016200.png` (in the app), `vp-021870.png` (what IVE handles), `vp-029160.png` (what you bring), `vp-031590.png` (open source and run chooser), `vp-033210.png` (install): same left margin, same kicker, same two-line title, same lede width.

### 3.2 One split, eleven times

Copy left (about 5 of 12 columns), app window right (about 7 of 12): hero, what IVE handles four times, review, what you bring twice, run chooser, and in the app twice (mirrored). `vp-021870.png`, `vp-022680.png`, `vp-023490.png`, `vp-024300.png` are four consecutive viewports that differ only in the headline and which drawn window sits on the right. Because every window is the same `.au` component at the same width (about 836 px) with the same sidebar, the same tiles and the same four names, the right column reads as one image repeated.

### 3.3 One scene type, three times

Tunnel, why and how-it-works are all: pinned 100 vh, headline top-left, illustration centre, mono progress rail with four or five labels across the bottom (`behind-040.png`, `why-052.png`). The rails are visually identical (hairline that fills blue, 11 px mono label). The scenes also do the same thing: tiles switch pills from Running to Done.

### 3.4 What else makes it monotonous

- Rhythm: `.chapter` padding is clamp(90px, 12vh, 150px) top and bottom, so every section starts with 108 to 150 px of empty ground, then the kicker. Hairline rules separate pillars (17 hairlines on the page). There is no section that is noticeably short, wide, dense or quiet; everything is medium.
- Scale: all drawn windows are large (full content width or 7/12). There is no small detail, no crop at 2x, no bento of real UI pieces, no full-bleed frame. The only two typographic surprises are the giant IVE letters and "WHY IVE?".
- Colour: a dark ground with the app's blue, orange and green pills everywhere. The two light-ground moments (review, logo film) are the only breaks; in light mode the review section is not a break at all because it keeps the same light ground (`shots/index-light-desktop/vp-027540.png`).
- Type: Archivo expanded at 46 to 54 px for every h2, 30 px for h3, same tracking, same two-line break. The mono kicker is on 13 sections.
- Motion: five pinned scenes, 15,376 px of frozen viewport. Three of them replay the same state change. Everything moves in the same way (fade and 20 to 28 px translate; the why section adds blur and rotateX).
- Captions: nine figures carry a 10 to 11 px mono caption below them, the same grey, the same position.
- Mobile: all of the above stacks into one column, so the page becomes kicker, title, lede, window, caption, hairline, for 35,135 px (`shots/index-dark-mobile/vp-019000.png`).

## 4. What is genuinely strong and worth keeping

Real product footage (`assets/app/`):
- `board.mp4` (and `-s`): four sessions side by side, a permission dialog answered on the board, every session finishes. This is the single best proof on the site and should open it. Visible at `vp-005670.png` and `vp-006480.png`.
- `home.mp4`: a sentence typed, Start, a session opens. The clearest "how easy" clip.
- `review.mp4` plus the `review-full.webp` still: the actual diff (it is the recorder's own code), split and unified views, Working and Staged, Annotate. The still at `vp-027540.png` is the most credible frame on the page.
- `session.mp4`: a follow-up instruction, steps, reply. Good for a "zoom in" beat.
- `setup.mp4`: model Sonnet to Opus, mode to Plan, ⌘K. Good for a "your models, your modes" beat.

Visual ideas:
- The opening scene's two beats: a live counter "7 running · 5 need your reply" over cards flying around you, then "Under control. 12 done" with the cards docked on a board (`anim/desktop-dark/mark-000.png`, `mark-045.png`, `mark-053.png`). This is the only place the site shows the problem and the payoff without words.
- The zoom out of the V's left stroke into the full IVE mark (`mark-066.png`, `mark-072.png`) and the unfold into the name (`mark-080.png`, `mark-088.png`). Unique, and it explains the name.
- "You have the agents." followed by a viewport-filling "WHY IVE?" (`anim/desktop-dark/why-000.png`). A real rhythm break.
- The merge lanes (`merge-050.png`, `merge-100.png`): the only line drawing on the page, and "many into one" is read in one glance.
- The five-row factual ledger (RUNS / WORKS WITH / ACCESS / TELEMETRY / SOURCE, `vp-030780.png`) and the install section's Mac card plus terminal panel (`vp-033210.png`, `vp-034020.png`): calm, factual, finished.
- The tab strip over the recordings with icons and "Open full size" (`vp-005670.png`).

Copy lines worth keeping (the sharpest on the page):
- "Run agents. Keep control."
- "Agents running everywhere." then "Under control."
- "You have the agents."
- "One goal. Parallel work." / "Every agent. In view." / "A failed check? IVE retries." / "One result. Your call."
- "Start with a sentence."
- "Read the changes, line by line."
- "Pick the model. Set the mode."
- "Give one conversation your attention."
- "Your code stays on your machine."
- "IVE adds no model access of its own."
- "Every session is a real terminal inside the app, running the coding CLI you already have, on your own account."
- "no terminal, no browser tab, one app in the Dock"
- "Passing checks give you evidence. You still review the change."
- "IVE spotted two tasks changing the same file and rerouted one before anything was overwritten." (keep only if the app really does this; it is the most concrete orchestration claim on the page and currently sits as a footnote under a drawing)

## 5. The two animations that stay, and verdicts on the rest

### 5.1 Opening scene (`#mark`)

Geometry (desktop 1440 x 900): section 520 vh = 4,680 px, sticky pin 100 vh, scroll travel 3,780 px (4.2 viewports). Phone: 460 vh = 3,882 px, travel 3,038 px. `raw` below is scroll progress 0 to 1 through the travel (constants in `script.js`: T_CHAOS 0.30, T_CTRL 0.50, T_END 0.55, Z_END 0.72, P_START 0.76, P_END 0.92).

| Phase | raw | Travel at 1440 | What happens | Frame |
|---|---|---|---|---|
| Emerge and swarm | 0.00 to 0.30 | 0 to 1,134 px | Black, grid corridor and ring frames rush past, twelve session cards orbit the viewer in depth, some flip to orange "Waiting" and shiver. Caption "AGENTS RUNNING EVERYWHERE." with a live counter. "Scroll" hint appears after 0.9 s and fades out over the first 3 percent (113 px). Time drives the swarm; scroll only speeds the corridor. | `mark-000.png`, `mark-012.png`, `mark-030.png` |
| Under control | 0.30 to 0.50 | 1,134 to 1,890 px | Cards glide to a 4 x 3 grid, the "MISSION CONTROL · 12 sessions" panel fades in from k 0.45, caption "UNDER CONTROL." from k 0.55, cards flip to green Done one by one from k 0.78. Camera stops. | `mark-045.png`, `mark-050.png` |
| Blackout | 0.50 to 0.55 | 1,890 to 2,079 px | Everything dims to black. | `mark-053.png` |
| Inside the letter | 0.55 to 0.72 | 2,079 to 2,722 px | Theme ground returns; the view starts inside the V's left stroke at a 10x to 40x pop (`zoom0 = max(10, 1.45·diag / (0.19·size0))`) and eases out until "IVE" stands at min(50 vw, 56 vh). | `mark-058.png` (flat rectangle), `mark-062.png`, `mark-066.png` (stroke edges), `mark-072.png` |
| Hold | 0.72 to 0.76 | 2,722 to 2,873 px | "IVE" stands. | `mark-072.png` |
| Unfold | 0.76 to 0.92 | 2,873 to 3,478 px | Letters spread, "ntegrated / ibecoding / nvironment" slide out behind the caps with an exponential reveal; the type shrinks to fit; "MADE BY AIFOREU ↗" fades in near the end. | `mark-080.png`, `mark-084.png`, `mark-088.png` |
| Hold | 0.92 to 1.00 | 3,478 to 3,780 px | Full name stands, nothing changes for 302 px, then the hero scrolls in. | `mark-092.png`, `mark-100.png` |

What reads well: the counter and the docking (the whole pitch in two captions); the perspective depth of the cards; the inside-the-stroke zoom from 0.62 on; the unfold; on the phone the stacked column variant (`anim/mobile-dark/mark-072.png`, `mark-088.png`, `mark-100.png`) is clean.

What drags:
- 1,134 px of chaos that scrolling cannot speed up, then 756 px of docking. Half the travel is over before anything is readable as a product.
- The blackout (189 px) plus the first part of the zoom (0.55 to about 0.63, roughly 300 px) show a flat rectangle: `mark-058.png` is a blank light screen. About 500 px of travel are empty.
- Two holds totalling 453 px where nothing happens.
- The hero that follows is a second opening with its own H1 and its own drawn board, so the visitor sees four title moments before any product truth (swarm caption, IVE, full name, "Run agents. Keep control.").
- Mobile: 3,038 px of thumb travel before copy; the cards are scaled 2.4x and crop at the edges (`shots/index-dark-mobile/vp-000000.png`); the header carries three boxed controls that compete with the scene.

What looks dated next to Cursor and Linear: the rushing perspective grid on floor, ceiling and walls, the eight ring frames, the scanline overlay (`.scene-scan`), the radial vignette, the cards rotated and tilted in 3D, the shivering orange cards, the uppercase letter-spaced mono captions and the 1.7 s running "Scroll" line. Cursor and Linear open on flat dark ground with one piece of product and no corridor; depth comes from blur and scale, not from grids. The mark's typographic reveal is not dated; the room around it is.

How to tighten and integrate (concrete):
1. Cut travel from 4.2 to about 2.5 viewports (section 350 vh instead of 520 vh). Suggested map: swarm 0 to 0.22, docking 0.22 to 0.42, cut (no blackout) 0.42 to 0.45, zoom 0.45 to 0.60 starting at a 4x to 6x pop so the first lit frame already shows stroke edges, hold 0.60 to 0.64, unfold 0.64 to 0.84, then 0.84 to 1.0 the name shrinks and rises into the header wordmark while the first real recording comes up underneath. That last step also answers the "logo too big" note: the sequence ends small, in the header, instead of parking a 108 px line for 302 px of scroll.
2. Let scroll drive the swarm too (map `clock` to scroll plus a small idle drift) so a fast scroller gets a fast scene and a slow scroller gets the full show. Keep the counter.
3. Remove the corridor walls, the ring frames and the scanlines. Keep a plain black ground with depth from scale and opacity only, cards flat (no rotate, no tilt, no shiver), the board panel as the one solid object. Keep "AGENTS RUNNING EVERYWHERE." and "UNDER CONTROL." but set them in the body face at 14 to 16 px, not tracked uppercase mono.
4. Make the dark ground the real dark theme (#101012 family) rather than #000 so there is no theme flip at 0.55; in light mode keep the opening dark as well (the owner wants dark first; the scene only works dark).
5. Drop the "Scroll" running line; one small chevron that fades on first scroll is enough.
6. Merge the hero into the end of the scene: no second H1 under it. The H1 can be the two mark captions ("Agents running everywhere. Under control.") or "Run agents. Keep control." once, with the real board recording as the hero image. The drawn hero board goes.

### 5.2 Why IVE (`#why`)

Geometry (desktop): section 490 vh = 4,410 px, pin 100 vh, travel 3,510 px (3.9 viewports). Phone: 460 svh = 3,882 px, travel 3,038 px. ANSWERS_START = 0.28.

| Phase | progress | Travel at 1440 | What happens | Frame |
|---|---|---|---|---|
| Question | 0.00 to 0.07 | 0 to 246 px | "You have the agents." above a viewport-wide "WHY IVE?" at about 470 px cap height, "Keep scrolling" cue below. | `why-000.png`, `why-004.png` |
| Prelude and cue fade | 0.06 to 0.11 | 210 to 386 px | Prelude and cue fade out. | `why-008.png`, `why-012.png` |
| Dock | 0.10 to 0.25 | 351 to 878 px | The two words shrink through real font sizes from about 470 px to 46 px and move to the top-left chapter position. | `why-016.png`, `why-020.png` |
| Answers arrive | 0.245 to 0.28 | 860 to 983 px | Layout and progress rail fade in with a 24 px rise. | `why-028.png` |
| Beat 1 | 0.28 to 0.46 | 983 to 1,615 px | "One goal. Parallel work." Four tiles leave a stack and form a 2 x 2 grid. | `why-033.png`, `why-040.png` |
| Beat 2 | 0.46 to 0.64 | 1,615 to 2,247 px | "Every agent. In view." Grid holds, third tile shows the permission dialog in orange. | `why-052.png` |
| Beat 3 | 0.64 to 0.82 | 2,247 to 2,878 px | "A failed check? IVE retries." Third tile: Failed, then Running again. | `why-070.png` |
| Beat 4 | 0.82 to 1.00 | 2,878 to 3,510 px | "One result. Your call." Tiles stack beneath the review tile, which rises as a receipt. | `why-094.png` |

Each beat is 632 px of scroll for a two-line statement and one short sentence. Between beats the text goes out with opacity, a 20 px drop and a 5 px blur, and comes in with a 28 px rise, a minus 6 degree rotateX and the same blur (`.why-beat` in `script.js`).

What reads well: the viewport-filling question with its quiet prelude; the four statements (the best copy on the site); the labelled rail (Parallel work, All in view, Auto-retry, Your call); the tile deck uses the app's real tile design.

What drags and what looks dated:
- 983 px before the first answer; the dock is a slow continuous zoom-out rather than a cut, and it sets font-size on every frame.
- Blur plus rotateX transitions and the tile "deck" read like a 2016 keynote; Cursor and Linear use crisp cuts, opacity, small translates and a sticky media panel.
- The deck is small (max 590 x 420 px) inside the right 55 percent of the viewport and mostly empty dark rectangles in beats 2 and 3 (`why-052.png`). On the phone it shrinks to 226 to 320 px with an 8 px caption (`anim/mobile-dark/why-033.png`).
- The fourth beat ends on a drawn review tile, which the merge section (900 px later) and the review section (3,900 px later) repeat.
- The section never mentions the third reason to use IVE: it runs on your own machine with your own CLIs and accounts. The owner's three "why" are productivity, orchestration and local; the section covers the first two.

How to tighten and integrate:
1. Keep the full-viewport question, but give it one viewport of travel, not 983 px: question holds for about 300 px, then a cut (or a 150 px move) to the docked heading. Drop the "Keep scrolling" cue; the question itself is the cue.
2. Four beats at about 380 to 420 px each. Total section about 260 to 280 vh instead of 490 vh.
3. Replace blur and rotateX with opacity plus a 12 px translate. No filter on text.
4. Replace the drawn deck with the real material in a sticky media panel that takes the right 60 percent: beat 1 the home clip (a sentence becomes four sessions), beat 2 the board clip, beat 3 a crop of the retry moment (new clip from the recorder, or the session clip), beat 4 the real `review-full` still. Then the section carries the proof and the later proof sections can go.
5. Rewrite the four beats to answer "why" with a payoff each, keeping the two-line shape. The current four are good starts; the third reason (local, your accounts, no new vendor) must be one of them. Example shape, not final copy: "One goal. Four agents at work." / "Every agent on one board. Nothing waits unseen." / "A failed check comes back fixed." / "Your machine. Your CLIs. Your call."
6. On mobile, stack question on two lines (already done, `anim/mobile-dark/why-000.png`), media above text, text at 18 px minimum, caption at 12 px minimum.

### 5.3 Verdicts on the other big animations

| Scene | Size | Verdict | Reasons |
|---|---|---|---|
| Inside the retry tunnel (`#behind`, `behind.js`) | 4,590 px, 5 steps | Drop from the homepage; keep one static panel for the architecture page if wanted | It is the third telling of the retry (after Why beat 3 and the pillar "Retry failed checks automatically"). Step 4 to 5 ghosts two planes over each other (`behind-080.png`). The pipeline strip "SQLite persist, Subscribers notify, WebSocket broadcast, Webhooks deliver" is architecture, not a reason to use IVE. 5.1 screens of frozen scroll for a mechanism. |
| How IVE works story (`#operation`, 440 vh) | 3,960 px | Drop as a scene; if the five words are wanted, a single static strip GOAL, PLAN, WORK, CHECK, REVIEW with one real clip | Fourth drawing of the same board; replays Running to Done again; seven captions where the header promises five steps (`story-045.png`). |
| Merge lanes (`#merge`, 240 vh) | 2,160 px | Keep, shortened to about 800 px of travel or play once on intersection | Distinctive, reads instantly, matches the orchestration argument. Make it the visual of the "nothing gets lost" beat or the transition into the review proof. Ends in a drawn tile; end in the real review still instead (`merge-100.png`). |
| What IVE handles pillars (`#route`) | 3,448 px, 4 drawn windows | Drop | Every claim here is already in Why IVE; the four drawings are the board, Home and two sessions again (`vp-021870.png` to `vp-024300.png`). The one new, concrete line ("IVE spotted two tasks changing the same file…") can move into the orchestration beat if true. |
| Run chooser (`#runs`) | 1,148 px | Drop | Third Home drawing; the three "runs" are the same story with other task names. |
| Hero entrance and pointer tilt | | Replace the drawn hero board with the real board recording; no tilt needed | A drawn board above real recordings undermines the recordings. |
| Logo film "Behind all this" (`#aiforeu`, `madeby.js`) | 1,049 px, 1.3 MB desktop / 615 KB phone | Keep as a short, quiet closing signature | Owner decision 2026-10-22. But: load it only when the section is actually in view (today `preload=auto` fetches it as the section nears), never with sound by default (today it plays unmuted after any earlier click on the page), make the band 400 to 520 px rather than 1,049 px, and treat the forced light ground as a deliberate "paper" ending in dark mode (it is the only section with a fixed ground). |
| Scroll cues ("Scroll", "Keep scrolling", "Follow the checks ↓") | | Keep at most one | Three cues on one page are a sign the page knows it is long. |

## 6. Where the copy fails to say why

The page explains what IVE does (coordination, retries, review, provenance) and how it is built (terminal, PTY, SQLite in the tunnel), but rarely what the reader gets. Specific failures:

- Hero: "Give IVE one goal. It coordinates the work, catches problems, and brings you one clear result to review." Mechanism, not payoff. Nothing about getting more done, about four tasks at once instead of one after another, about no lost terminal tabs.
- "Less imagining. More looking around." Nice sound, unclear meaning for someone who has not used IVE.
- "Stay with the work. Keep the whole picture." / "Your tools can do more. Your workspace should make it easier to follow." Generic; could head any tool's page.
- "IVE coordinates the parallel work." States the feature; the benefit (overlapping work caught before it collides, context handed on, nothing waiting unseen) is in the fine print below.
- "IVE done it for you. Bring your own models. Bring your own tokens." The pun reads as a grammar slip at first glance, the headline is three sentences long, and the strong point (no new vendor, your accounts, your models per session) is buried in a 70-word paragraph.
- "What would you hand to IVE?" and "Before you come aboard." Section titles that pose rather than say.
- The install section is the first and only place that says what the Mac app feels like: "no terminal, no browser tab, one app in the Dock". That is a reason to use IVE and it sits 33,576 px down.
- The orchestration proof the owner cares about (many agents under control, one place, nothing gets lost) is scattered across 8 tellings of "in one view" (section 2.1) and never once stated as an outcome.
- Productivity is never claimed in plain words. The site cannot invent numbers, but it can say what is true: four sessions run at the same time, each in its own worktree, each with its own model; you answer a permission request from the board instead of hunting the right terminal; a failed check comes back fixed without you re-prompting.
- Local is stated seven times as a fact ("runs on your machine") but never as a reason (your code never leaves your disk unless your CLI sends it; no account with IVE; no new bill).

Best existing lines to build the "why" on: "Run agents. Keep control.", "You have the agents.", the four Why beats, "Start with a sentence.", "Your code stays on your machine.", "IVE adds no model access of its own.", "no terminal, no browser tab, one app in the Dock", "Passing checks give you evidence. You still review the change.", and (if true) the rerouting line.

## 7. Performance and accessibility

Measured with CDP `encodedDataLength` (bytes on the wire), warm connection, `REVIEW/perf-*.json`.

| | Desktop 1440 | Desktop, reduced motion | Phone 390 |
|---|---|---|---|
| Requests at load | 28 | 28 | 28 |
| Bytes at load (2.5 s idle at top) | 882 KB | 883 KB | 878 KB |
| of which fonts | 266 KB (11 files, 5 families) | 266 KB | 263 KB |
| of which images (posters at 2x) | 509 KB | 509 KB | 509 KB |
| CSS / JS / HTML (gzipped) | 47 / 34 / 27 KB | same | same |
| Bytes after a full slow scroll | 3,211 KB | 1,233 KB | 2,302 KB |
| of which media | 1,978 KB (`board-s.mp4` 679 KB, logo film 1,299 KB) | 0 | 1,294 KB (`board-s.mp4` 679 KB, logo film 615 KB) |
| DOM nodes | 3,505 | 3,427 | 3,485 |
| Page height | 35,870 px | 22,259 px | 35,169 px |
| Load event | 1.9 s | 1.2 s | 0.5 s |

Observations:
- Seven `<video>` elements; the five recordings use `preload="none"` and only the visible tab gets a `src`, which is right. The other four load only when their tab is chosen. The logo film uses `preload="auto"` and is fetched whenever its section comes close, 1.3 MB for a 5.9 s signature, and it plays with sound after any earlier click on the page.
- Five font families: Archivo, Source Sans 3, IBM Plex Mono for the page, plus Inter (3 weights) and JetBrains Mono (2 weights) solely for the drawn app windows (`assets/fonts.css`). Dropping the drawn windows drops 115 KB of fonts.
- The HTML is 173 KB raw (27 KB gzipped) because nine app windows are inlined as markup; the hero board alone is about 300 lines.
- The 2x posters (509 KB) load at the top for all five tabs even though only one is visible.
- Scroll: no horizontal overflow on any variant; no console errors; no page errors.
- Reduced motion is handled properly: the opening collapses to a 522 px static name block, Why IVE to 754 px of normal flow, the tunnel to 2,425 px, the story to 1,611 px, merge to 814 px; no video is fetched; the page is 22,259 px.
- Keyboard: skip link present; theme toggle is a real button with `aria-pressed`; the three scroll scenes have labelled jump buttons; the FAQ and the clone block are native `<details>`. 31 landmarks, 0 images without alt (there are no `<img>`), 0 unnamed buttons or links.
- Text size: 209 visible text elements under 11 px on desktop (120 on the phone): the figure captions (10 to 11 px mono), the Why caption (10 px, 8 px on the phone), the mark counter (11 px) and the type inside the drawn windows (9 to 11 px, aria-hidden but visible). Linear's smallest running text is 13 px.
- Contrast: dim text (#A3A39E on #101012, about 7.6:1) and faint text (#85857F, about 5.3:1) pass; the problem is size, not contrast.
- Audio: the logo film plays unmuted once the page has had a click; there is a Sound off button, so WCAG 1.4.2 is met, but it is a surprise at the end of a silent page.
- Mobile navigation: `.nav-links` is hidden below 720 px and there is no menu; "Architecture" is reachable only from a link inside the tunnel and one in the install section. The header keeps three boxed controls (theme, GitHub, Install) that fill 60 percent of its width on 390 px (`shots/index-dark-mobile/vp-003800.png`).
- The 404 page drops the wordmark and nav entirely (`shots/404-dark-desktop/vp-top.png`); add the wordmark.

## 8. Subpages

- Architecture (`architecture.html`, 5,233 px desktop, `shots/architecture-dark-desktop/full.png`): seven blocks with the same kicker and headline grammar, but with real diagrams (process model, four-step event flow, worktree ledger, three totals, access table, a light security ledger, a try-IVE closer). It is more varied than the homepage and is the right home for the tunnel's pipeline content and the "What actually runs on your machine" story. Mobile stacks cleanly (`shots/architecture-dark-mobile/vp-top.png`). Its "Install IVE" and "View on GitHub" closer repeats the homepage's open source block word for word.
- Imprint and privacy (`shots/imprint-dark-desktop/vp-top.png`, `shots/privacy-light-desktop/vp-top.png`): clean two-column legal layout, bilingual imprint, German privacy notice with English kicker "Datenschutz". Keep as they are; they already look like a Linear legal page.
- 404 (`shots/404-dark-desktop/vp-top.png`, `shots/404-dark-mobile/vp-top.png`): fine, centred, two actions; missing the wordmark and nav.
- Theme: dark and light are both complete on every page. The light homepage is slightly weaker because the forced-black opening, the forced-light review section and the forced-light logo film make three ground changes that do not follow the toggle (`shots/index-light-desktop/vp-004860.png`, `vp-027540.png`, `vp-034020.png`).

## 9. Implications for the redesign brief (short)

- Order that follows from this review: opening scene (tightened, ending in the header wordmark) with the real board recording rising under it; one hero line; Why IVE (question plus four beats on real media, including the local beat); one proof section that is a bento of real crops (board, review diff, model menu, terminal, permission dialog) instead of nine drawn windows; a short merge beat; a quiet, factual closing with install, the ledger, FAQ and the small logo film. That is six or seven sections and roughly 12,000 to 14,000 px at 1440, down from 35,870.
- Every drawn `.au` window can go; the recorder in `scripts/demos/` can produce the few crops that are missing (a retry moment, the terminal panel, the permission dialog close-up) as real footage.
- Keep one install command box (in the install section), one star ask, one "Download for Mac", one CLI list, one license line.
- Captions: label provenance once, in the FAQ ("Are the demos recordings of the real app?"), and keep a single small "demo project" label on the media panel.
