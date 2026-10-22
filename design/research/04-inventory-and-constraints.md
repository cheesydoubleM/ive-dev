# 04 · Inventory and hard constraints for the rebuild

Area: assets, product facts, technical constraints, legal pages, obsolete files.
Checked on 22 Oct 2026 in the worktree `/Users/maximilianschwarz/Projekte/AIFOREU/ive.dev-redesign`
(branch `redesign/linear-cursor` at `0d2d27a`, which is `origin/main`, the live site).

How this was checked:

- every file under `assets/` measured with `ffprobe`, `webpinfo`, `sips`, `shasum`; key frames pulled from the 3200×2000 masters and looked at
- all pages, stylesheets and scripts read; CSP hashes recomputed
- live checks of `https://ive.dev` (headers, served HTML, `install.sh`)
- IVE repo README (raw, `main` = tag `v1.0.17` plus one merge commit with no file changes) and `gh release view v1.0.17 -R michael-ra/ive`, fetched today
- spot checks in the 1.0.17 source (local clone `/Users/maximilianschwarz/Projekte/AIFOREU/ive-oss`, HEAD = tag `v1.0.17`, clean)
- Playwright screenshots of the current homepage (1440×900 dark and light, 390×844 iPhone emulation dark), slow scroll, fonts awaited
- a test run of the demo recorder (`scripts/demos/reference.mjs`) against the installed IVE 1.0.17, output to the scratchpad

Evidence paths are listed in section 7.

---

## 0. The short version

1. **The real footage is good, but it is in the light theme.** All five clips and every still show the light theme of the app in a full 16:10 window. On a dark-first page they read as white slabs (see the dark screenshots). On a phone the app text shrinks to about 3 px. The recorder can fix both today: dark theme works against the installed 1.0.17 (verified), and crops or portrait frames come from the 3200×2000 masters.
2. **Anchor clip: `board`** (four agents side by side, a permission answered from the board, all four finish). **Strong crops:** agent-mode menu, model menu, ⌘K palette, permission card, sidebar with "2 running · 1 item needs your attention". **Weak as full frames:** `session`, `home`, `review-full`.
3. **Product moments with no real footage:** dark theme; more than four agents at once, Gemini CLI on the board; goal to plan to tasks; failed check, retry, pass; a review diff that matches the demo story; the terminal inside the app; the Mac app window itself.
4. **Copy may say what the IVE README says** (run Claude Code, Codex and Gemini CLI sessions side by side, see what each one is doing, answer their questions, review their changes in one place, everything runs on your own machine) plus what the recordings show. **It must not claim speed or quality gains.** The benchmark of 19 Oct found no measured quality gain and 1.63× median time and 1.74× tokens for the IVE pipeline per task. "Your code stays on your machine" is not accurate, because the coding CLIs send prompts and code to their providers. "IVE runs on your machine" is accurate.
5. **Hosting is GitHub Pages** (legacy Jekyll build from `main` of `evostorednew/ive-dev`) **behind Cloudflare.** HTML, CSS and JS are cached for 600 s, so bump every `?v=` on change. Anything not excluded in `_config.yml` is published, **including this `design/` folder: add `design` to the exclude list before this branch reaches `main`.**
6. **Every page carries a CSP meta tag.** No external origins, no inline `style` attributes, inline scripts only by SHA-256 hash. Editing the theme boot script changes its hash.
7. **Cloudflare Email Obfuscation rewrites any `name@x.y` text** in the served HTML. It already breaks `orbit@0.4.2` in a terminal illustration on the live homepage.
8. **Behaviours to carry over:** theme switch (`ive-theme`), copy buttons, OS and architecture aware download, video play-in-view, the opening animation, Why IVE, and the anchors `#install`, `#waitlist`, `#get-ive`.
9. **Legal pages:** keep the `<main>` content exactly as it is; restyle only the chrome. Their text also limits the whole site: only `ive-theme` in local storage, no tracking, no embeds, fonts served locally, GitHub Pages and Cloudflare as hosts.
10. **Already dead today:** `redesign.css`, `redesign.js`, `redesign-shell.css`, three 1x posters, about 330 lines of exit-sequence JS and about 360 lines of CSS. The rebuild retires most of `app-ui*.css`, `showcase.*` and `behind.*`, and must rewrite `DESIGN.md`. Its hard bans (looking like Linear or Cursor, bento layouts, autoplay video, a light-first palette) contradict the brief.

---

## 1. Assets

### 1.1 Real-app recordings (`assets/app/`)

All clips: H.264 High, yuv420p, 30 fps, **no audio track**, **no color tags** (primaries, transfer and matrix untagged), `+faststart`, recorded at a 1600×1000 CSS viewport with device pixel ratio 2. Each clip ends with a 0.7 s dissolve back to frame 1, so the loop has no cut. The large file is CRF 19, the `-s` file is a CRF 20 Lanczos downscale. **The `-s` files are not mobile versions:** they are the same 16:10 frame at half size. Demo data: project *Orbit*, four sessions, a Claude Code permission dialog for `npm test`. The real frontend renders every pixel through the isolated test transport, and no provider ran. Recorded with the build in IVE 1.0.12 (per `scripts/demos/README.md`). The installed app is now 1.0.17.

| File | Pixels | Bytes | Length | What it shows |
|---|---|---|---|---|
| `board.mp4` | 3200×2000 | 1,713,703 | 13.53 s, 406 fr, 1.01 Mbit/s | Board of *Orbit*, four sessions in a 2×2 grid: *Build the workspace* (Claude Code, sonnet, Running), *Connect the API* (Codex, `gpt-6-astra`, Running), *Check the sign-in flow* (Claude Code, sonnet, Waiting, "Allow this action? npm test"), *Review the changes* (Claude Code, opus, Done, two-file verdict, "The final decision stays with you."). Sidebar: "Board · 2 running", "1 item needs your attention", "Connected · $0.00 today". The pointer clicks **Allow once** on the board, steps tick on, all four end **Done**. |
| `board-s.mp4` | 1600×1000 | 693,938 | same, 0.41 Mbit/s | same |
| `home.mp4` | 3200×2000 | 787,837 | 19.43 s, 583 fr, 0.32 Mbit/s | Home: date, prompt box "What do you want to work on? Type / for commands, @ for files", "Continue working" list. A goal is typed ("Add a dark theme toggle to the sidebar. Keep the existing keyboard shortcuts working."), **Start** opens a new session, the agent reads, edits, runs the tests and replies. |
| `home-s.mp4` | 1600×1000 | 335,164 | same | same |
| `session.mp4` | 3200×2000 | 681,661 | 18.13 s, 544 fr, 0.30 Mbit/s | One session. A follow-up ("Also add ⌘⇧T as the shortcut and mention it in the README.") is typed and sent, the composer says "Claude is working. Write your next message, Enter queues it.", steps tick (Reading project files, Bind ⌘⇧T to toggleTheme, Run the test suite), reply "Done. ⌘⇧T now toggles the theme, … all 12 tests pass." |
| `session-s.mp4` | 1600×1000 | 296,138 | same | same |
| `review.mp4` | 3200×2000 | 1,589,671 | 16.53 s, 496 fr, 0.77 Mbit/s | Review session (opus) with its verdict. **Review** opens the side panel (Files & Plans / Code Review / Scratchpad, Working Diff / Staged Diff, file tree, Stage / Unstage, Find / Annotate / Copy / Fullscreen). Then Fullscreen Code Review in Split View, then Unified View, with a **Review →** button. The diff is the site's own `scripts/demos/lib/recorder.mjs` and `clips/session.mjs` (new files). |
| `review-s.mp4` | 1600×1000 | 650,569 | same | same |
| `setup.mp4` | 3200×2000 | 708,535 | 14.70 s, 441 fr, 0.38 Mbit/s | Same session. Model menu (Haiku · haiku, Sonnet · sonnet, Opus · opus), switched to Opus. Agent mode menu (Default "Ask for each action", Auto, Plan "Planning only, no edits", Accept Edits, Don't Ask, Skip agent approvals "…Additional IVE checks still apply.", footnote "Shared by Overview and Terminal."), switched to Plan. ⌘K palette (Start a task, Board ⌘⇧E, New Session ⌃N, Review changes ⌘⇧G, Terminal ⌘J, Command Palette ⌘K, Quick help & all shortcuts ?, Home ⌘⇧H, Knowledge, Quick Action Palette ⌘Y, Preview Palette), "term" typed, Terminal found. |
| `setup-s.mp4` | 1600×1000 | 289,645 | same | same |

### 1.2 Stills (`assets/app/`, all lossless WebP)

| File | Pixels | Bytes | Content | Used by |
|---|---|---|---|---|
| `board.webp` / `board@2x.webp` | 1600×1000 / 3200×2000 | 154,974 / 176,222 | first frame of `board`, all four states visible | tour poster (@2x), `#workflow` crop (srcset), `assets/og.html` |
| `session.webp` / `session@2x.webp` | same | 70,518 / 80,618 | first frame of `session`, sparse | tour poster (@2x), `#workflow` crop (srcset) |
| `setup.webp` / `setup@2x.webp` | same | 70,518 / 80,618 | **byte-identical to the session files** (same SHA-256): both clips start on the same frame | tour poster (@2x only) |
| `home.webp` / `home@2x.webp` | same | 49,450 / 59,804 | first frame of `home`, empty composer | tour poster (@2x only) |
| `review.webp` / `review@2x.webp` | same | 83,658 / 92,634 | first frame of `review`, sparse | tour poster (@2x only) |
| `review-full.webp` / `review-full@2x.webp` | same | 131,208 / 116,730 | frame 330 of `review`: Fullscreen Code Review, Split View. The left column is empty because the file is new | `#verify` (srcset) |

Not referenced anywhere: `home.webp`, `review.webp`, `setup.webp` (the 1x files).
`review/PROVENANCE.txt` in the `ive.dev-review` worktree still lists 1.0.11 stills with other byte sizes and hashes, so it is out of date.

### 1.3 Brand film, OG image, icon (`assets/`)

| File | Pixels | Bytes | Notes |
|---|---|---|---|
| `aiforeu/reveal-sound-1600.mp4` | 1600×900 | 1,329,403 | 5.90 s, H.264 High, **AAC-LC stereo 48 kHz 128 kbit/s**, bt709 tagged. AIFOREU logo film, light ground |
| `aiforeu/reveal-sound-960.mp4` | 960×540 | 629,265 | same at small size (`madeby.js` picks it at ≤760 px) |
| `aiforeu/reveal-poster.webp` | 1600×900 | 27,484 | end card: AIFOREU mark and wordmark, the EU emblem with **"Kofinanziert von der Europäischen Union"** and **"Europa für Niedersachsen"** |
| `og.png` | 1200×630 | 132,195 | **out of date:** light ground, the old "IVE." wordmark, headline "Your agents. One workspace.", kicker "A WORKSPACE FOR CODING AGENTS", board still |
| `og.html` | | 1,469 | source of `og.png` (inline `<style>`, capture at 1200×630). Published, because it is not excluded |
| `favicon.svg` | 32×32 | 286 | an older light-tile variant of the mark. **Not** the logo kit's favicon |
| `fonts.css`, `fonts/*` | | | see 3.5 |

### 1.4 Related material outside `assets/`

- **Logo kit, 12 Oct 2026:** `/Users/maximilianschwarz/Projekte/AIFOREU/ive-logo/kit/`. The mark is a small i behind a prompt chevron, and the dot of the i is the blue cursor (#1647FF). The kit has a dark tile (#0E1014), light and dark lockups with "IVE" set in Sora SemiBold as paths, mono versions, and a `web/` set (favicon.ico/.svg, apple-touch-icon, 192/512, maskable, `site.webmanifest`, `head-snippet.html`). `LIESMICH.md` gives the rules: clear space at least one i-stem, minimum sizes, the cursor stays blue, the only allowed motion is a blinking cursor. The 1.0.17 app uses this mark in its sidebar. **The website does not.** Its header uses a text wordmark "IVE" in Archivo 800 at 125% width with a blue dot and "by AIFOREU" in mono, the opening uses giant Archivo letters, and the favicon is older. So "keep the logo, make it smaller and calmer" refers to the Archivo wordmark and the opening letters. The kit is there if the favicon or app icon should match the app.
- **Real UI reference stills** (gitignored): `/Users/maximilianschwarz/Projekte/AIFOREU/ive.dev-review/review/real-ui-reference/`. Light and dark versions of board, session, home, permission and palette at 3200×2000, plus 8 component crops each, from 1.0.12.
- **The same set from 1.0.17, made today:** `/private/tmp/claude-501/-Users-maximilianschwarz/5351d8ba-945e-47c6-9f76-e8ef6642bb91/scratchpad/redesign/inventory/ref-1017/` (26 PNG). This is temporary. Regenerate with `node scripts/demos/reference.mjs <outDir>`. The dark board, permission and palette stills from this set are the best existing pictures for a dark page.

### 1.5 Can this footage anchor a Linear/Cursor-style page?

**Legibility rule of thumb.** The app sets body text at about 13 to 14 CSS px in a 1600 px wide window. Shown W px wide, that text is about 13.5 × W / 1600 px tall:

| Display width | App text |
|---|---|
| 1440 (full bleed) | ~12 px, readable |
| 1200 (content column) | ~10 px, borderline |
| 720 (half column, split layout) | ~6 px, unreadable |
| 358 (phone) | ~3 px, unreadable (verified in the 390×844 screenshot) |

So: **full frames only full-bleed on desktop. Everything else needs crops** at or near 1:1 (CSS px) from the 3200×2000 masters.

| Asset | Verdict | Best use | Limits |
|---|---|---|---|
| `board` clip | **Strong, the anchor** | hero or full-bleed product frame; the one clip that shows parallel work and control in one picture | light theme; small text below ~1100 px width; pointer drawn into the frames; only Claude Code and Codex; Gemini CLI absent |
| `board@2x.webp` | **Strong still** | poster, OG image, no-JS fallback | light theme |
| `setup` clip | Weak as a full frame, **strong as crops** | bento tiles. In master px: model menu at 2.4 s ≈ x 320-800, y 160-440; agent mode menu at 6.0 s ≈ x 620-1290, y 170-880; ⌘K palette at 9.5 s ≈ x 1080-2120, y 280-1450 | poster duplicates the session poster; the end dissolve shows doubled text for ~0.7 s |
| `review` clip | **Medium** | "review in one place": crop the side panel at 5.5 s (≈ x 2450-3200, y 90-2000) or the fullscreen view | the diff is the site's recorder code: off-story, a new file, half-empty split view, and it does not match the verdict about `Sidebar.jsx` and `api.js` |
| `review-full` still | Weak | replace | empty left column, same off-story diff |
| `home` clip | Medium to weak | crop of the prompt box while the goal is typed, plus **Start** | 60 to 70% of the frame is empty; 19.4 s; the second half repeats `session` |
| `session` clip | Weak as a full frame, medium as a crop | chat column: steps ticking, "Enter queues it" | mostly empty canvas |
| Permission crop (from `board` or the reference stills) | **Strong** | "answer their questions": `board` master ≈ x 490-1840, y 1050-1990, or the dark `permission` still | the crop box in `reference.mjs` cuts "Allow once" (x offset too far right) |
| Sidebar crop (reference stills, 600×2000) | **Strong for mobile** | portrait tile: "Board · 2 running", "1 item needs your attention", Running, Needs your reply, Done | none (dark version already exists) |
| AIFOREU film | brand, not product | only if a maker section stays | light ground; carries the EU co-funding notice (see 6.4) |
| `og.png` | out of date | regenerate after the redesign | |

### 1.6 Problems in the current media

1. **Light theme only.** Every recording and still. The fixture supports dark (`theme: 'dark'`), but the clips were never recorded that way.
2. **No phone-ready media.** The `-s` files are downscales, not crops.
3. **`setup` poster equals the `session` poster** (identical bytes), so two tabs show the same picture.
4. **The review diff is off-story.** The verdict talks about `Sidebar.jsx` and `api.js`, but the diff shows `scripts/demos/lib/recorder.mjs`, the website's own tooling, as a new file.
5. **The loop dissolve** (0.7 s) shows doubled, ghosted text if a clip is paused or captured near its end.
6. **The pointer is drawn into every frame** (`#demo-cursor`), and it shows inside crops.
7. **No color tags** in the app clips. Browsers assume a matrix, so slight color shifts between Safari and Chrome are possible. Tag bt709 on the next encode.
8. **Recorded on 1.0.12.** The app is now 1.0.17 ("The Mac app speaks English throughout" is in the 1.0.17 notes). Re-record before claiming the clips show the current version.
9. **QA trap:** Playwright's bundled Chromium has no H.264 or AAC. Videos do not play there, and the AIFOREU film shows as an empty light box, because `madeby.js` removes the poster before playing. Check video sections in Playwright WebKit or with `channel: 'chrome'`.

### 1.7 Gaps: product moments with no real footage

| Moment | Why it matters for "why IVE" | Today |
|---|---|---|
| Any **dark-theme** footage | the page is dark-first | none in the repo (reference stills only) |
| **More than four agents**, mixed CLIs including **Gemini CLI** | parallel scale, "many agents under control" | 4 tiles, Claude Code and Codex only |
| **Goal to plan to tasks** (planner, "Approve plan & start") | orchestration from one sentence | illustrated only (hero, Why IVE beat 1, run chooser) |
| **Failed check, retry, pass** | "nothing gets lost", bounded retries | illustrated only (`#behind` tunnel, Why IVE beat 3) |
| **A coherent review** (the files the agents changed, red and green lines, a decision) | "you decide" | off-story diff (see 1.6) |
| **The terminal inside the app** (⌘J, the `>_` drawer, a real PTY) | "a real terminal, your CLI" | illustrated only (`#runs-on`) |
| **Attention flow** across sessions (badge, jump, answer) | "nothing gets lost" | one permission card on one board |
| **The Mac app window** (own window, Dock) | "a native app, no terminal" | none. DESIGN.md bans fake macOS chrome, so only a real capture would be honest |
| **First run** (download, drag to Applications, first launch) | install confidence | none |
| Phone access (opt-in) | optional extra | none, and not announced on the site |

### 1.8 What the recorder can capture

**Verified today:** `node scripts/demos/reference.mjs <scratch dir>` ran against `/Applications/IVE.app` **1.0.17** and produced light and dark stills of home, session, permission, board and palette in about a minute. The fixture loads the 1.0.17 frontend, and the dark theme renders correctly.

Building blocks (`scripts/demos/lib/*.mjs` plus the fixture `ive-team-worktrees/quiet-focus/frontend/tests/interactive-onboarding-fixture.mjs`):

- **Theme:** `createTourFixture(…, { theme: 'dark' })` sets `localStorage['ive-theme.v2']`. `openDemo()` in `lib/fixture.mjs` does not forward it yet; that is a one-line change.
- **Viewport:** fixed at 1600×1000 (`VIEWPORT`). It can be changed per clip for larger relative text or narrow layouts.
- **Fixture controls:** `setSessionStatus`, `emit`, `reply`, `pushAssistant` / `agentStep` (tool steps and replies), `planReady` / `checking` / `failCheck` / `passCheck` / `failRun` (the TaskFlow pipeline with a real correction cycle in the UI: "Approve plan & start", a failed check, a pass, inspect changes, accept), `setChanges(diff, staged)` (any diff, so a story-matching `Sidebar.jsx` diff is possible), quick sessions from Home, and grid templates. There can be any number of sessions, with `cli_type` `claude`, `codex` or `gemini`.
- **Recorder:** stop-motion with a fake clock at 30 fps and device pixel ratio 2, `moveTo`, `click`, `type`, `press`, `scrollBy`, `hold`, an exported `stills` frame, H.264 plus lossless WebP posters.

Feasible next clips, all real frontend with labelled demo data:

1. All existing clips again, **in dark theme**, on 1.0.17.
2. **Board with 6 to 8 sessions** across Claude Code, Codex and Gemini CLI: statuses changing, one attention item, one answered.
3. **Goal to plan to tasks to pass to review** with `planReady`, `checking`, `failCheck`, `passCheck`. This replaces the illustrated retry tunnel with real footage.
4. **Review with a matching diff** via `setChanges` (modified lines, not a new file), ending on the review decision.
5. **Short loops (4 to 8 s) for bento tiles,** cropped from 3200×2000: permission card, model menu, agent mode menu, ⌘K palette, sidebar attention, composer "Enter queues it".
6. **Portrait crops** for phones (sidebar 600×2000 master px, or one tile).

Recorder changes worth making before re-recording:

- forward `theme` in `openDemo`
- an option to hide the drawn pointer for crop sources
- choose the poster frame, not always frame 1
- tag bt709 (`-colorspace bt709 -color_primaries bt709 -color_trc bt709`)
- an optional crop pass and shorter loops

Things to watch when re-recording:

- **`DEMO_OUT` defaults to `assets/app`** and overwrites the live files. Point it at a scratch folder for experiments.
- The paths are hard-coded: `/Applications/IVE.app/.../frontend/dist`, Playwright from `ive-team/frontend/node_modules`, and the fixture from the `quiet-focus` worktree (dated 16 Oct). Selectors may need updates for 1.0.17 UI changes.
- The fixture's default `reply()` text is German, so always pass your own text.
- Keep the provenance line on every recording: "Recorded from the actual IVE frontend on an isolated test transport. … demonstration content; no provider ran." (README rule: keep recordings honest.)

---

## 2. Product facts that copy may use (true for 1.0.17)

### 2.1 Sources

| Source | Status |
|---|---|
| IVE README, `https://raw.githubusercontent.com/michael-ra/ive/main/README.md` | `main` = `v1.0.17` + an empty merge (checked with the compare API), so this is the 1.0.17 README |
| Release notes `v1.0.17` ("IVE 1.0.17", published 2026-10-22 15:20 UTC, not a prerelease, assets `IVE-macOS-arm64.dmg` + `.sha256`) | fetched with `gh` |
| Website `README.md` (Product truth) and `DESIGN.md` (Honesty constraints) | in this worktree |
| `_reference-old-site-copy.txt` (named in README as the capability truth source; gitignored) | only in `/Users/maximilianschwarz/Projekte/AIFOREU/ive.dev/` and `ive.dev-review/`. This is the **old** site copy (it still says "Humanity's Last IDE", "Zero config", `vibe2vibe/ive`), so treat it as a feature list to verify, not as copy |
| Recordings (real frontend, demo data) | UI strings and behaviour as shown |
| 1.0.17 source spot checks (`ive-oss` at `v1.0.17`) | noted where used |
| Benchmark result `/Users/maximilianschwarz/Projekte/AIFOREU/ive-benchmark/v4/runs/comparison-final/ERGEBNIS.md` (19 Oct) | limits productivity and quality claims |

### 2.2 Safe facts, grouped by the owner's four reasons to use IVE

**What IVE is.** *IVE (Integrated Vibecoding Environment) keeps parallel coding agents visible and under control. Run Claude Code, Codex and Gemini CLI sessions side by side, see what each one is doing, answer their questions and review their changes in one place. Everything runs on your own machine.* (IVE README, first paragraph, quoted.) Made by AIFOREU GmbH, Osnabrück (imprint). Open source under Apache 2.0, "Copyright 2026 AIFOREU GmbH" (README). Repository `https://github.com/michael-ra/ive`. **IVE is in beta:** "Expect rough edges and please open an issue when something breaks." (README.)

**Productivity: many agents at once** (structural claims only, see 2.4)

- Several sessions run side by side on one board, each with its own conversation, model and agent mode. Shown: four at once, "2 running". (Recording `board`.)
- You can write the next instruction while an agent works: "Claude is working. Write your next message, Enter queues it." (UI string, recordings.)
- One sentence starts a session: Home asks "What do you want to work on?", **Start** opens a session that gets to work. (Recording `home`.)
- Supported CLIs: **Claude Code, Codex, Gemini CLI** (README; profiles in `backend/cli_profiles.py`).
- Models per session: Claude Code offers Haiku, Sonnet and Opus (recording `setup`, profile). Gemini CLI offers gemini-2.5-pro, gemini-2.5-flash and gemini-2.0-flash (profile). Codex follows the Codex CLI config (no fixed list; the demo shows `gpt-6-astra`). Models depend on the installed CLI and account (site README).
- Keyboard first: ⌘K palette "Search tools, sessions and projects…", ⌘N new session, ⌘⇧E Board, ⌘⇧G Review changes, ⌘J Terminal, ⌘⇧H Home, `?` all shortcuts (recording `setup`, 1.0.17 palette still). "40+ shortcuts" is a documented total (see 2.3).

**Orchestration: everything under control, nothing gets lost**

- Every session shows its state: Running, Waiting ("Your answer is needed"), Done ("Reply ready"). The sidebar counts what runs and flags "1 item needs your attention" (recording `board`).
- **Answer agents from the board:** "Allow this action? npm test · Allow once · Don't allow · Yes, and don't ask again for npm test commands in /Projects/orbit" (recording `board`).
- Agent mode per session: Default "Ask for each action", Auto "Approve most actions automatically", Plan "Planning only, no edits", Accept Edits "Auto-approve file edits", Don't Ask "Never ask, deny if not allowed", Skip agent approvals "Skips the agent's permission prompts. Additional IVE checks still apply." (recording `setup`).
- IVE adds hooks to the CLIs that "let IVE follow what each agent does and let its Safety Gate stop risky commands. Your own hooks stay untouched." (README.)
- **Review in one place:** a Code Review panel with Working and Staged diff, a file tree, Stage and Unstage, Annotate, Fullscreen, and Split or Unified view (recording `review`).
- Retries: the pipeline engine has a correction cycle with a configurable limit (`DEFAULT_MAX_ITERATIONS = 20` in `backend/pipeline_engine.py`; site total "20 RALPH iterations maximum"). Describe the mechanism, never an outcome (see 2.4).
- Planning: the backend defines Commander (routes work), Planner (splits a feature into tasks) and worker roles (`backend/config.py`). **No recording shows this yet**, so treat "IVE splits your goal into tasks" as true but unshown. Show it as a labelled illustration or record it first.

**How it feels** (only what the product visibly does)

- One window instead of many terminal tabs: the Mac app "runs its own local service in the background, so there is no terminal window and no browser tab" (README), and it is one app in the Dock (DESIGN).
- The terminal stays inside the app: every session is a real terminal (PTY) running the CLI you already use (architecture page; `>_` and ⌘J in the UI).
- "Ask on the side /btw" (UI string) and Continue working on Home (recordings).

**Local: runs on your own machine**

- "Everything runs on your own machine." (README.) The Mac app listens on `127.0.0.1:5112` only and keeps its data in `~/Library/Application Support/com.ive.desktop`. The source install listens on `127.0.0.1:5111` only. "Phone access and other network options are off until you turn them on." (README.)
- Sessions use the login of the CLI you already have. "You don't need to give IVE an API key to work with your coding CLIs." (README.)
- Telemetry is off by default (README, release notes). DESIGN rule: **say only that.**
- Optional package scanner (AVCP): off by default. When turned on it checks `npm install`, `pip install` and similar (README). DESIGN rule: always call it optional.

**Install facts** (keep these exact)

- **Mac app:** Apple silicon (M1 or newer), macOS 13.5 or newer. Download `https://github.com/michael-ra/ive/releases/latest/download/IVE-macOS-arm64.dmg`. Open the DMG and drag IVE into Applications. Signed with the Developer ID of AIFOREU GmbH and notarized by Apple (the app, not the DMG). You need at least one coding CLI you are logged in to. SHA-256 is on the releases page.
- **Source** (Linux, Intel Macs, developers): `curl -fsSL https://ive.dev/install.sh | bash`, then `ive`. IVE runs in the background and opens `http://127.0.0.1:5111`; you can close the terminal. Also `ive stop`, `ive status`, `ive logs`, `ive run`, `ive update`, `ive uninstall`, `ive --headless`. The installer puts IVE into `~/.ive`, links `ive` into `~/.local/bin`, does not use `sudo` and starts nothing.
- **Requirements (source):** macOS or Linux, Python 3.11+, Node.js 22.12+ with npm, Git, at least one coding CLI (on macOS: `brew install python node git`).
- **Clone path:** `git clone https://github.com/michael-ra/ive.git`, `cd ive`, `bash install.sh`, `bin/ive`. Add `--plan` to print the steps without running them.
- **Uninstall:** `ive uninstall` (source) or `"/Applications/IVE.app/Contents/Resources/backend/ive-backend" --remove-hooks` after quitting the app.
- **New in 1.0.17** (usable on a changelog or install subpage, never as a version badge):
  - shell files stay untouched unless the package scanner is on
  - hooks step aside if the app was deleted
  - `ive` runs in the background
  - clean uninstall
  - the log no longer prints the access token
  - English throughout
  - telemetry off by default
  - Apache 2.0

### 2.3 Numbers

Documented totals (site README): 140+ API routes, 40+ shortcuts, 35+ MCP tools, 30+ event types, 20 iterations maximum, 8,000+ skills, a 6-column board, a 9-step package scan, 3 access modes, 4 memory types. Any number shown needs the visible line "Development snapshot · capabilities may change during the beta." beside it (DESIGN).

Spot checks in 1.0.17:

| Total | Check | Status |
|---|---|---|
| 140+ API routes | 423 `router.add_*` registrations in `backend/server.py` | holds |
| 20 iterations | `DEFAULT_MAX_ITERATIONS = 20` in `backend/pipeline_engine.py` | holds |
| 35+ MCP tools | 32 tools in the commander server (`mcp_server.py`) plus 21 in the worker server (`worker_mcp_server.py`), 44 distinct names | holds across both servers, not for one server alone |
| 8,000+ skills | the bundled `backend/skills_catalog.json` is `[]` in 1.0.17; skills are fetched from GitHub at runtime | **not verifiable, do not use** |
| others | not re-checked | |

**Recommendation:** no numbers on the new homepage. They answer "how big", not "why", and every one of them needs the beta caveat.

### 2.4 Wording traps (true-sounding, but not true or not proven)

| Avoid | Why | Say instead |
|---|---|---|
| "Your code stays on your machine", "stays local", "never leaves", "offline" | the site's own FAQ: "Using an AI provider can send prompts, context, and code to that provider." The current hero line and the chip "Your code stays local" break this | "IVE runs on your machine." "Listens only on 127.0.0.1." "Uses the CLI logins you already have." |
| "Faster", "2×", "10× more", "ship more", "fewer bugs", "better code" | benchmark of 19 Oct: same success rate (15/15) as the CLI alone; the pipeline used 1.74× tokens and 1.63× median time; "no general claim that IVE produces fewer bugs" | parallel and attention claims: "several agents at once", "answer from one board", "queue the next instruction" |
| "IVE retries until it works", "catches every bug" | retries are bounded; in the benchmark no correction step was needed (0/15) | "A failed check goes back for another attempt, up to a limit you set." |
| "Works with every agent" or any CLI beyond three | three supported CLIs | "Claude Code, Codex and Gemini CLI" |
| "No account" as a headline | true in effect (no IVE sign-up), but CLI accounts are needed | "No IVE account. Your CLI logins." |

### 2.5 Do not claim (hard)

- Windows support, an Intel Mac app, community size, stars, contributors, star counts (asking for a star once is fine).
- Customers, logos, testimonials, social proof, metrics, benchmarks.
- A version number or file size for the Mac app. Even though 1.0.17 is current, the site shows no version (site README).
- Release dates or an OS matrix (DESIGN).
- **Antigravity CLI.** A profile exists in the 1.0.17 source (`ANTIGRAVITY_PROFILE`), but the README and release notes do not mention it, so it is not public.
- **iPhone companion app** (`apps/ios/` in the repo) or phone access as a feature. Both exist, but the site does not announce them and nothing says they are distributed. Ask the owner first.
- Old-site features with unknown 1.0.17 status: multiplayer, invites, QR, PWA push, memory sync, deep research, visual pipelines editor, 8,000+ skills.
- "EU-backed" (DESIGN). Retired lines: "One brain. Infinite hands.", "agent army" or "agent armies", "tmux wishes it could do this". Old-site lines: "Humanity's Last IDE", "Zero cloud. Zero config.", "Run 10 Claude Code sessions at once".
- **Model names in illustrations.** The site README allows only Haiku, Sonnet, Opus, Gemini Pro and Flash. The current page already breaks this: `gpt-6-astra` (index.html L282) and `gemini-2.5-flash` (L557, L565). The real recordings show `gpt-6-astra` because that is the demo's Codex config value. Decide one rule for the rebuild.

---

## 3. Technical constraints

### 3.1 Hosting and deploy

- **GitHub Pages, legacy (Jekyll) build from `main`, path `/`,** repo `evostorednew/ive-dev`, CNAME `ive.dev` (`gh api repos/evostorednew/ive-dev/pages`). Publishing means pushing to `main`, and that happens **only on the owner's explicit order.** Careful: this branch `redesign/linear-cursor` tracks `origin/main`. With `push.default` unset (simple), a bare `git push` is refused, but `git push origin HEAD:main` would go live.
- **Cloudflare in front** (`server: cloudflare`, then GitHub's Fastly). `cache-control: max-age=600` on HTML, CSS, JS and `install.sh`. **Bump the `?v=` on every changed asset in every HTML file,** or visitors get up to 10-minute-old CSS and JS.
- **`http://ive.dev/` answers 200 without redirecting to HTTPS** (GitHub `https_enforced: false`, and the Cloudflare "Always Use HTTPS" setting seems to be off). The privacy notice says transmission is TLS-encrypted. This is outside the repo; tell the owner.
- **No build step.** Static HTML, CSS and vanilla JS. No bundler, no npm packages at runtime, no external CDN (the CSP forbids it). Everything is committed as served. GitHub Pages limits: site under 1 GB, files under 100 MB, soft bandwidth 100 GB per month. Today about 11.3 MB is published (9.3 MB of it video).
- **Jekyll publishes everything that is not excluded and does not start with `_` or `.`.** GitHub's optional-front-matter plugin renders `.md` files as pages. The current excludes are `README.md`, `DESIGN.md`, `.gitignore`, `scripts`, `node_modules` and `waitlist-exports`. **The new `design/` folder (this research) is not excluded: add `design` to `exclude:` before merging.** Stray files are live today: `https://ive.dev/redesign.css` and `https://ive.dev/assets/og.html` return 200.
- `review/` (local QA captures) is gitignored. Keep it that way.

### 3.2 Content Security Policy (meta tag per page)

| Page | CSP |
|---|---|
| `index.html` | `default-src 'none'; script-src 'self' 'sha256-FZc6fPc+pszWZqSMmueqEHs+8iOuXLE4ztkgogg2Aqs='; style-src 'self'; img-src 'self' data:; media-src 'self'; font-src 'self'; base-uri 'none'; connect-src 'self'; form-action 'none'` |
| `architecture.html`, `imprint.html`, `privacy.html` | `default-src 'none'; script-src 'self' 'sha256-QLg2LeqhtSr4kFxwZADVkEKHHeorPMQtFQYLITDmKxE='; style-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; form-action 'none'` |
| `404.html` | as above plus script hash `sha256-W9mCACDkY4X44pMfG3KYpKpixlRP+/yqTrSPpDh/GBs=` and style hash `sha256-ktPRiZJNTV0WpF8t5BtKP18HknfWcMBOu07fj3xDzbI=` (self-contained page) |

All pages also set `<meta name="referrer" content="strict-origin-when-cross-origin">`. All hashes were recomputed today and match.

Rules that follow:

- **No `style="…"` attributes** in markup or in `innerHTML` templates, and no `setAttribute('style', …)`. Setting styles from JS through CSSOM (`el.style.x = …`, `style.setProperty(…)`) is allowed and is what the opening uses.
- Every inline `<script>` needs its SHA-256 in that page's CSP. **Change one character of the theme boot script and the hash must be updated.**
- Only same-origin images, media and fonts. No iframes, no external widgets (the GitHub star stays a plain link), no analytics, no Google Fonts. Pages with video need `media-src 'self'`. Today only `index.html` has it, so a new subpage with clips must add it.
- `form-action 'none'`: no forms (the waitlist was removed on 22 Oct; README says do not bring one back without a backend and a privacy update).
- A meta CSP cannot set `frame-ancestors`. That is fine, just know it.

### 3.3 Cloudflare Email Obfuscation (live)

Cloudflare rewrites every text that looks like an email address in the served HTML into `<a href="/cdn-cgi/l/email-protection" class="__cf_email__">[email protected]</a>` and injects `/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js` (same origin, so the CSP lets it through). On the live homepage it turns the terminal line `> orbit@0.4.2 test` (index.html L652) into such a link. **Avoid `name@x.y` strings in visible text** (npm `pkg@version` lines, for example), wrap them in `<!--email_off-->…<!--/email_off-->`, or ask the owner to switch the feature off. The legal pages' `mailto:` links are obfuscated the same way. That is harmless, but without JS the visitor sees "[email protected]".

### 3.4 Do not touch, or touch only as stated

| File | Rule |
|---|---|
| `install.sh` | **byte-identical to `get.sh` on `main` of michael-ra/ive.** SHA-256 today: `2caa0f5500c72001d37d4be4febeb447f8617fca2c655b9201dc7dafef30c82f` (repo copy = upstream `get.sh` = live `https://ive.dev/install.sh`, served as `application/x-sh`). The app source links only this URL on ive.dev. Never exclude it in `_config.yml` |
| `CNAME` | `ive.dev`, unchanged |
| `robots.txt` | unchanged (allows everything, points to the sitemap) |
| `sitemap.xml` | lists `/`, `/architecture.html`, `/imprint.html`, `/privacy.html`. **Add every new subpage, remove dropped ones** |
| `_config.yml` | keep the `install.sh` comment; **add `design`** (and any new internal folders) to `exclude:` |
| `assets/fonts/LICENSE-*.txt` | keep next to any font that stays |
| `imprint.html`, `privacy.html` | `<main>` content unchanged (section 4) |

### 3.5 Fonts available locally (`assets/fonts/`, declared in `assets/fonts.css`)

| Family | File(s) | Axes / weights | Bytes | Used by today |
|---|---|---|---|---|
| Archivo | `archivo-latin-variable.woff2` | weight 500-800, width 100-125% | 90,096 | display, wordmark, opening letters |
| Source Sans 3 | `source-sans-3-latin-variable.woff2` | weight 400-600 | 28,792 | body copy |
| IBM Plex Mono | `ibm-plex-mono-latin-{400,500,600}.woff2` | 400, 500, 600 | ~10,000 each | eyebrows, commands, status |
| Inter | `inter-latin-{400,500,600}.woff2` | 400, 500, 600 (static) | ~24,000 each | only the app-style illustrations (`app-ui.css`); it is the app's own UI face |
| JetBrains Mono | `jetbrains-mono-latin-{400,500}.woff2` | 400, 500 | ~21,000 each | only the app-style illustrations; the app's mono face |

All five have OFL license texts in the folder. Things to know:

- **The three site families have a `unicode-range` limited to Latin plus U+2000-206F, ↑ and ↓.** Glyphs the site uses, such as → (U+2192), ↗ (U+2197), ⌘ (U+2318), ⇧, ✓, ● ◐ ◇ ○, therefore come from system fallback fonts and look different per OS. For a polished, Linear-level finish, use inline SVG icons for arrows and status, or self-host a subset that contains them.
- Inter has no 700 weight and no optical "Display" cut locally.
- **The privacy notice (§5) names "Archivo, Source Sans 3 und IBM Plex Mono" as served locally.** Changing the type stack keeps the claim "no Google Fonts" true, but the sentence would then name fonts the site no longer uses. The legal text must not change, so either keep these families in use or get the owner's sign-off for a privacy update.
- The logo kit's lockup uses Sora SemiBold, but as outlined paths, so no font file is needed.

### 3.6 Behaviours that must survive

| Behaviour | Where | Contract |
|---|---|---|
| Theme boot (no flash) | inline `<script>` in each `<head>` (hashed in the CSP) | reads `localStorage['ive-theme']` (`'dark'` or `'light'`) and sets `html[data-theme]`; on `index.html` it also adds `mark-live` and `mark-dark` unless reduced motion is on. **Dark-first means:** dark tokens become the default in CSS (also without JS), the boot script and `readTheme()` default to dark, `<meta name="theme-color">` gets the dark value, all hashes are updated, and `404.html` gets its own copy |
| Theme toggle | `script.js` L8-47, `[data-theme-toggle]`; `404.html` inline | button text shows the current theme, `aria-pressed`, `aria-label` in German when `<html lang="de">` (privacy page), updates `theme-color`, persists **only** under the key `ive-theme` (named in the privacy notice) |
| Copy buttons | `script.js` L639-683 | `[data-copy]` buttons ship `hidden` and are revealed by JS. They copy `data-copy`, and on failure they select `[data-copy-source]` inside the nearest `.term` or `[data-copy-box]`. They announce in the `aria-live` element `[data-copy-status]` (only one exists today, in `#install`; new copy boxes elsewhere need their own) and reset after 2.2 s. Without JS the commands stay selectable |
| Mac download button | `script.js` L610-637 | the DMG link is the default (works without JS). On non-Mac platforms or touch devices (iPad reports Mac, so `maxTouchPoints > 1`) it becomes "Install IVE" → `#install`, the icon is removed and the Apple silicon note is hidden. On Intel Macs in Chromium (`userAgentData.getHighEntropyValues(['architecture'])` = `x86`) it does the same. Safari and Firefox keep the link and the note. **It only handles the first `[data-mac-download]`** (`querySelector`); several download buttons need `querySelectorAll` |
| Recorded clips | `showcase.js` | `preload="none"` with `data-src` / `data-src-small`; picks the 3200 file only when width × DPR > 1700; plays muted when in view and the tab is visible; pauses off-screen; with reduced motion nothing autoplays (a play cover appears); play/pause toggle, progress bar, full-size `<dialog>` viewer |
| AIFOREU film (if kept) | `madeby.js` | plays once in view and asks for sound (falls back to muted, "Sound on"), pauses off-screen, "Replay", reduced motion starts nothing; the poster is dropped for autoplay |
| Nav state | `script.js` L49-55 | `.nav.scrolled` after 8 px |
| No-JS and reduced motion | everywhere | `html.no-js` until `script.js` runs; every scroll scene has a static full-content fallback; all content readable without JS |
| Anchors | `index.html` | **`#install`** (header CTA on every page links `index.html#install`), alias anchors **`#waitlist`** and **`#get-ive`** (old links), `#top`, `#main` (skip link). The subpages' nav also links `index.html#inside`, `#why` and `#operation`, so update that chrome when the sections change |

### 3.7 The opening animation: what it is made of

Kept by owner decision, restyle and tighten allowed.

- **Markup** (`index.html` L49-78, `section.mark#mark[data-mark]`): `[data-mark-pin]`, the scene (`[data-scene]`, `[data-scene-cam]`, 4 × `[data-wall]`, `[data-scene-rings]`, `[data-scene-swarm]`, `[data-scene-board]` "MISSION CONTROL · 12 sessions", captions `[data-scene-caption="a"]` "Agents running everywhere." and `"b"` "Under control." with live counts `[data-scene-count]`), the name line `[data-mark-line]` with 3 × `[data-mark-cap]` (I V E) and 3 × `[data-mark-rest]` (ntegrated, ibecoding, nvironment), `.mark-by` ("made by AIFOREU ↗"), `.mark-hint` ("Scroll"), and an `sr-only` full name.
- **Script** (`script.js` L684-1030): one rAF loop that runs only while the scene is unlit and in view (no timer otherwise). The timeline is scroll progress `raw` from 0 to 1: `T_CHAOS 0.30` (swarm), `T_CTRL 0.50` (cards glide onto the board, statuses go Done), `T_END 0.55` (dark, the viewer inside the V stroke), `Z_END 0.72` (zoom out of the letters), `P_START 0.76` to `P_END 0.92` (the name unfolds), then the signature fades in. There are 12 agent cards built in JS, with model labels sonnet, haiku, opus, gemini-pro and gemini-flash, and 8 ring frames. Type size is measured at 100 px and fitted so the line never leaves the viewport; the font size is capped at 6000 px and the rest is a `scale()`, so the glyphs do not vanish.
- **CSS:** `styles.css` L1744-1946 (mark), plus `app-ui-blocks.css` L150-215 (region `mark`, `.scene-agent`) and **`app-ui.css`** (`.au`, `.au-tile`, `.au-tile-head`, `.au-pill`, `.au-model`, `.au-tile-status`, `.au-state` and their tokens). **The swarm cards depend on the app-ui styles.** Carry that subset over (or restyle the cards) when `app-ui*.css` goes. It is driven by custom properties: `--mark-size`, `--mark-gap`, `--mark-reveal`, `--mark-slide`, `--mark-fade`, `--mark-alpha`, `--mark-shift-x/-y`, `--mark-pop`, `--mark-origin-x`, `--mark-by`, `--mark-hint`, `--rest-em`, `--scene-lines`, `--scene-scan`, `--scene-vig`. State classes: `html.mark-live`, `html.mark-dark` (light header ink over the black), `.mark.is-lit`, `.has-by`, `.is-measuring`, `.hero.is-in`.
- **Scroll length:** `.mark-live .mark { height: 520vh }` on desktop and `460vh` at ≤720 px. That is 4.2 or 3.6 screens of travel before the hero. In the 1440×900 run the mark is 4,680 px of a 35,870 px page.
- **Fallback:** with no JS or with reduced motion, the full name stands as a static block with the signature below. Keep it.
- **Wordmark:** the header lockup (`.wordmark`, "IVE" + blue dot + "by AIFOREU") and the opening letters are both Archivo, while the app and the logo kit use the prompt-and-i symbol (see 1.4).

### 3.8 Why IVE: what it is made of

Kept, to be reworked.

- **Markup:** `section.why#why[data-why]` (index.html L354-469). There is a prelude ("You have the agents."), the question "WHY IVE?" (two `[data-why-word]`), four `[data-why-beat]` articles, illustrated tiles (`.au` markup), and four jump buttons (`[data-why-jump]`: Parallel work, All in view, Auto-retry, Your call).
- The current beats are "One goal. Parallel work." (IVE splits your goal into focused tasks.), "Every agent. In view.", "A failed check? IVE retries.", "One result. Your call." Beats 1 and 3 rest on mechanisms that no recording shows (see 1.7 and 2.4).
- **Script:** `script.js` L1369-1586. **CSS:** `styles.css` (~61 `.why` rules from L1325), `app-ui-blocks.css` region `why` (L218-270), and the `.au` styles. It is `490vh` long when live. The rules that matter: real font sizes rather than `scale()` (Safari pixelation, DESIGN.md), keyboard jump controls, reduced motion, no JS, and a short-landscape fallback to normal flow.

### 3.9 Baseline measured today (current site)

| Measure | Value |
|---|---|
| Page height | **35,870 px at 1440×900 (39.9 screens)**; **35,135 px at 390×844 (41.6 screens)** |
| Sections | 15 between header and footer |
| Scroll-driven length | mark 5.2 + `#behind` tunnel 5.1 + Why IVE 4.9 + How it works 4.4 + merge 2.4 screens: **about 22 of the 40 screens are pinned scroll scenes** |
| Requests | 32 (desktop) and 30 (phone) after a full scroll, **all same-origin**; no console errors; no horizontal overflow at 1440 or 390 |
| Weight | all HTML, CSS, JS and font files the homepage references: about 734 KB (fonts load only when used); the HTML alone is 173 KB, largely inline SVG and app-style illustration markup |
| Video | 9.3 MB in the repo; one clip loads when its tab is in view (0.3 to 1.7 MB), and the film is 0.6 or 1.3 MB |

---

## 4. Legal pages (imprint, privacy)

**Content that must not change:** the `<main class="legal-main">` element of both pages. To verify after the rebuild (normalized text = tags stripped, entities decoded, whitespace collapsed, then SHA-256):

| Page | `<main>` bytes SHA-256 | Normalized text SHA-256 (first 16) | Links inside `<main>` |
|---|---|---|---|
| `imprint.html` (`lang="en"`, bilingual EN/DE) | `532d20d7c89613fcc6d50de6a028c88e78a9f1e86ed202950d0e31a48a9c12ca` (2,116 chars) | `ba5b3693055214a1` (958 chars) | `tel:+491731732519`, `mailto:contact@aiforgov.eu` |
| `privacy.html` (`lang="de"`, "Stand: 22. Oktober 2026") | `d2e634de637098c7cd65e3a909909fe00bc0e927fecbf9318b23c295048c1629` (6,232 chars) | `fa18395a80843a54` (4,123 chars) | tel, mailto (×2), GitHub privacy statement, Cloudflare privacy policy, `www.lfd.niedersachsen.de` |

If the restyle renames classes inside `<main>` (`legal-head`, `legal-sections`, `legal-section`, `legal-copy`, `kicker`, `mono`), the byte hash changes but the text hash must not. Keeping the classes and restyling them is simplest. Legal styles live today inside the architecture block of `styles.css` (from L1564).

**May change:** `<head>` (title, CSP, theme boot), header and footer chrome, styles. Keep `lang="de"` and the German chrome on the privacy page ("Zum Inhalt springen", "Hauptnavigation", "IVE — Startseite", German theme labels). The `<title>`s contain an em dash ("Imprint / Impressum — IVE"); that is chrome and may be rewritten to the dash-free style.

**What the legal text promises.** These promises bind the whole site, because the text cannot change:

- **Only `ive-theme` is stored** in the browser (no cookies, no other local or session storage). No remembered tabs, no "sound on" preference, no dismissed banners.
- **No tracking, no reach analysis, no ad networks, no embedded social content.** Videos stay self-hosted (no YouTube or Vimeo), and the GitHub star stays a link.
- **Fonts are served locally, with no connection to Google Fonts,** naming Archivo, Source Sans 3 and IBM Plex Mono (see 3.5).
- **Hosting is GitHub Pages, with Cloudflare and GitHub's subcontractors.** Do not move media to another CDN. An earlier deploy branch once served a promo video from Supabase; do not repeat that.
- Imprint data: AIFOREU GmbH, Albert-Einstein-Str. 30, D-49076 Osnabrück; Michael Ramich (sole managing director, responsible under § 18 (2) MStV); HRB 220842, Amtsgericht Osnabrück; VAT ID DE461982917.

---

## 5. Files that become obsolete

### 5.1 Already dead today (safe to delete in the rebuild)

| File or part | Why it is dead |
|---|---|
| `redesign.css` (18 KB), `redesign.js`, `redesign-shell.css` | referenced by no page since `fe3455c` (19 Oct). They still carry waitlist styles, and they are publicly served |
| `assets/app/home.webp`, `review.webp`, `setup.webp` (1x) | not referenced; only the @2x posters are used |
| `script.js` L1033-1367, the "exit" focus sequence | its markup (`[data-exit]`) was removed from `index.html` on 3 Oct (`4441cd3`). The JS still ships. The brief's "sharpen/exit sequence" is **not on the page today** |
| `script.js` board-ticket loop (`[data-ticket]`, `[data-ticket-live]`, `[data-final-goal]`) | no matching elements |
| `script.js` reveal selector classes `.term-bleed`, `.localbox`, `.coord`, `.pipe`, `.collab`, `.stats-row` | no matching elements |
| `styles.css`: exit (L1947-2152), confirm page (L2331-2340, double opt-in), and the old-feature blocks statement, local, coordination, board + pipeline, catch-up, collaboration (L461-483, L630-754) | no matching markup (about 360 lines) |

### 5.2 Obsolete or reduced by the rebuild

| File | Role today | Fate |
|---|---|---|
| `index.html` (173 KB, 15 sections) | homepage | rewrite to 5 to 7 sections |
| `styles.css` (2,340 lines) | design system for all pages: tokens (light default), nav, hero, story, chapters, reveal, **architecture page (L898-1743, includes legal styles)**, mark, merge, film | replace with the new dark-first system. **Carry over:** mark (L1744-1946), and merge or film only if kept, plus architecture and legal styles (restyled) |
| `script.js` (1,775 lines) | theme, nav, reveal, story, hero ambient, what-you-bring, pillars, run chooser, download, copy, mark, exit (dead), Why IVE, merge | split by job. **Keep:** theme, nav, download (multi-button), copy, mark, Why IVE (reworked), merge only if kept. **Drop:** story, hero ambient, what-you-bring, pillars, run chooser, exit, ticket |
| `app-ui.css` (22 KB), `app-ui-blocks.css` (60 KB) | HTML drawings of the app for hero, Why IVE, How it works, pillars, merge, verify, runs, runs-on | mostly obsolete once real footage carries the page. **Keep the `.au` card subset** for the opening swarm (and Why IVE if it keeps drawn tiles) |
| `showcase.css`, `showcase.js` | the 5-tab tour and the full-size viewer | the tabbed tour goes. **Reuse the playback logic** (lazy source, in-view play, pause off-screen, reduced motion, dialog viewer) |
| `behind.css`, `behind.js` | the illustrated board-to-retry tunnel (`#behind`, 5.1 screens) | drop unless it earns its place; real footage of the retry loop (1.8 item 3) is the honest replacement |
| `madeby.js`, `assets/aiforeu/*` | "Behind all this" logo film | owner and design decide; **check the EU notice first** (6.4) |
| `assets/fonts/inter-*`, `jetbrains-mono-*` | app-style illustrations only | obsolete with them, unless the new type system adopts Inter |
| `assets/app/*` | light 1.0.12 recordings | replace with dark 1.0.17 recordings and crops; keep until the new files exist |
| `assets/og.html`, `assets/og.png` | social preview with old messaging | rewrite and re-capture (dark, new headline, current wordmark) |
| `404.html` | self-contained, light default | restyle; recompute its two CSP hashes |
| `architecture.html` | engineering subpage, depends on `styles.css` | keep as a subpage, restyle; its theme and copy depend on `script.js` |
| `DESIGN.md` | binding design contract | **rewrite** (section 6) |
| `README.md` | file map and product truth | update the file map; keep the product truth and the installer rule |
| `scripts/demos/*` | recorder | keep, extend (1.8). `shot-section.mjs` points at port 4176 and section ids that will change |

---

## 6. Conflicts between the brief and the current rules

Someone must decide these before or during the build.

1. **`DESIGN.md` hard bans contradict the brief.**
   - "Looking like Cursor, Linear, Zed, Raycast, or Warp" is banned, but the owner now wants the spirit of Cursor and Linear.
   - "decorative bento layouts" is banned, but the brief asks for a bento of real UI crops.
   - "autoplay video" is banned, but the tour already autoplays muted loops in view, and the new page will too.
   - The color system is light-first ("60% cool light work surface"), and the theme defaults to light.
   - The information architecture lists 16 blocks.

   Rewrite DESIGN.md with the new rules: dark-first; muted product loops only in view, paused off-screen, respecting reduced motion; bento only for real UI. Keep the honesty, status-language and accessibility rules.
2. **Version number:** the brief names 1.0.17, but the site README forbids showing version numbers. Keep it off the site, except perhaps on a changelog subpage if the owner wants one.
3. **Local claim:** the current hero says "Your code stays on your machine", which contradicts the FAQ. Fix the claim, not the FAQ (2.4).
4. **The EU co-funding notice:** the AIFOREU film's end card shows "Kofinanziert von der Europäischen Union" and "Europa für Niedersachsen", and DESIGN.md calls it "the EU co-funding notice". If the film section goes, ask the owner whether funding publicity requires the notice to stay visible (for example in the footer). It may be an obligation of the funding, not decoration. DESIGN.md also bans "EU-backed" as a phrase.
5. **Model names in illustrations** (2.5): the rule says Haiku, Sonnet, Opus, Gemini Pro and Flash only; the page and the recordings show `gpt-6-astra` and `gemini-2.5-flash`.
6. **Wordmark versus logo kit:** the site uses an Archivo text wordmark, while the app uses the kit's prompt-and-i symbol. "Keep it, smaller and calmer" points to the Archivo wordmark. Whether the favicon and touch icons switch to the kit is a separate, cheap decision (the kit's `web/` set is ready).
7. **Infrastructure items outside the repo, for the owner:** plain-HTTP access without redirect (3.1), and Cloudflare Email Obfuscation (3.3).

---

## 7. Evidence

Temporary, in the scratchpad: `/private/tmp/claude-501/-Users-maximilianschwarz/5351d8ba-945e-47c6-9f76-e8ef6642bb91/scratchpad/redesign/inventory/`

- `site/desk-dark-*.png`, `site/desk-light-*.png`, `site/phone-dark-*.png`: slow-scroll screenshots of the current homepage, one per 0.9 viewport. Also `site/*-fullpage.png`, and the contact sheets `site/sheet-desk-dark-01..03.png` and `site/sheet-phone-dark-01..03.png`.
- `site/report.json`: page heights, section offsets, requests, media.
- `sheets/*-sheet.png`: one frame every 1.5 s of each app clip. `frames/*.png`: full-resolution key frames, including the loop-dissolve ghosting (`setup-end-stack.png`).
- `ref-1017/`: reference stills made today from the installed IVE 1.0.17, light and dark.
- `remote/ive-README.md`, `remote/release-v1.0.17.txt`, `remote/get.sh`, `remote/live-install.sh`, `remote/live-index.html`.
- `shoot.mjs`: the screenshot script (Playwright from `/Users/maximilianschwarz/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs`).
