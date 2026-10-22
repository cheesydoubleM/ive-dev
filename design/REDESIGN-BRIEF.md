# ive.dev redesign brief

Lead design, 2026-10-22, tightened the same evening (changelog at the end). Written for the build agents; nothing in here needs a second guess. Inputs: `design/research/01` to `05`, `review/CODEX-CONTENT-REVIEW.txt`, `review/CODEX-BRIEF-READY.txt`, `review/CODEX-COPY-READY.json`, `review/COLLAB-CLAUDE-CODEX.md` (owner inputs of 20:03), the live worktree at `0d2d27a`, the 1.0.17 dark reference stills and the loop smoke-test frames.

Owner decisions that bind this brief: short homepage (5 to 7 sections) plus subpages; dark first with a working light mode; the opening animation (swarm, board, big IVE letters unfolding) and Why IVE stay; the nav wordmark gets smaller and calmer, the big opening letters do not; "in many places far too much text": hard word budgets per section, the real footage carries the message; nothing said twice; every section composed differently in one visual language; the nav in the language of the two buttons he likes (outlined "Install IVE", outlined GitHub icon button), the theme switch as an icon button, fewer and calmer links; Inside IVE reworked around what IVE really does, including its loops and automations, with real recordings.

Product truth: `README.md` (Product truth block), `design/research/04` section 2 and `design/research/05` sections 2 and 6. The site shows no version number; internally everything is checked against 1.0.17. Copy rules: English, short, concrete, no em or en dashes as punctuation, no AI vocabulary (unlock, seamless, supercharge, revolutionize, elevate and their kin), no emojis, no numbers as proof, no testimonials, logos or social proof, never "your code stays on your machine".

Where I adopt Codex: one primary home per detailed claim (recurring nav and install CTAs allowed), no absolute local-data claim, nav wordmark 22px, no faded second headline line, Codex's A to F order as the skeleton, word budgets as ceilings. Where I deviate: section 10.

---

## 1. Positioning and the one idea

**Positioning, one sentence.** IVE is the local control room for parallel coding agents: Claude Code, Codex and Gemini CLI run side by side on your own machine, every session's state is on one board, questions are answered from that board, and changes come back to you for review.

**The one idea the homepage must land.** You get more done because several agents work at once, and you can see what each one is doing because they all live on one board, on your machine.

Four angles, four homes, no angle told twice:

| Angle (owner's words) | What the site says | Home |
|---|---|---|
| Productivity, many agents in parallel | Several tasks at once, not one tab at a time | Why IVE, beat 1 |
| Orchestration, one place, nothing lost | One board, who runs, who waits, who is done; answer from the board | Why IVE, beat 2 (the opening shows it without words) |
| How it feels to work with it | Start with a sentence, queue the next one, loops that check the work, a guard that catches circles | Inside IVE |
| Your own machine | IVE runs on your computer with your CLI logins, no IVE account | Why IVE, beat 4 |

Review ("every change comes back to you") is Why IVE beat 3: it is what makes parallel work safe to delegate.

The hero does not restate these. It names the product and shows it. The closing does not summarise them either; it offers the two ways to get IVE.

---

## 2. Information architecture

### 2.1 Pages

| Page | URL | Job | Nav | Footer |
|---|---|---|---|---|
| Home | `/` (`index.html`) | Opening, hero, why, inside, get, maker | wordmark | full |
| Product | `/product.html` | The catalogue: every view and every loop with real footage, one row each | Product | full |
| Download | `/download.html` | Mac app, terminal install, clone, requirements, uninstall, release notes link, questions | Download | full |
| Architecture | `/architecture.html` | Engineering page (content kept, restyled) | Architecture | full |
| Imprint | `/imprint.html` | Legal, `<main>` unchanged, chrome restyled | none highlighted | full |
| Privacy | `/privacy.html` | Legal (German), `<main>` unchanged, chrome restyled | none highlighted | full |
| 404 | `/404.html` | Not found; self-contained; gets the new header | none | reduced |

No changelog page (release notes stay on GitHub, linked from Download). No separate open-source page (the homepage closing and the footer license line carry it). `sitemap.xml` lists `/`, `/product.html`, `/download.html`, `/architecture.html`, `/imprint.html`, `/privacy.html`.

### 2.2 Navigation (owner feedback, specified exactly)

The owner's screenshot of today's header: 28px wordmark with "by AIFOREU", four text links, a 92px boxed mono "Light" button, a 44px outlined GitHub icon button, a 44px outlined "Install IVE" button. He likes the last two. Everything else changes.

**Header, all pages.** `position: fixed`, height 64px (56px below 720px), content on the 1,200px grid with the page gutters, `z-index` above everything. Ground: transparent; after 8px of scroll `--bg-glass` with `backdrop-filter: blur(12px)` and a bottom hairline. While the opening scene is pinned (`html.mark-dark`, index only) the header uses the dark theme's ink tokens in both themes, because the scene ground is dark in both.

Left, the wordmark: one link to `/` (`#top` on the homepage), `aria-label="IVE, home"`. "IVE" in Archivo 800, **22px**, `font-stretch: 112%`, letter-spacing 0.01em, `--text-1`, plus the blue dot (6px, `--accent`, static, no breathing animation) 5px after the E at the baseline. Padding 8px 0 so the hit area is 38px tall. No "by AIFOREU" in the header (the opening signature and the footer carry the maker link).

Right cluster, one flex row, gap 8px, everything 36px tall, 6px radius, the same button family:

1. Links **Product**, **Download**, **Architecture** as quiet buttons: body face 14px/500, `--text-2`, padding 0 12px, no border at rest; hover and focus `--text-1` on `--bg-raised`; the current page gets `aria-current="page"`, `--text-1` and a hairline border (`--line`). On the homepage the three links point to the subpages, not to anchors. No in-page anchors in the header anywhere.
2. **Theme switch**: `<button type="button" data-theme-toggle>` 36×36, hairline border `--line-strong`, transparent ground, `--text-1`; inline SVG icon 16px: a sun while the dark theme is active (what you get on press), a moon while the light theme is active. `aria-label` "Switch to light theme" / "Switch to dark theme" (privacy page: "Zum hellen Design wechseln" / "Zum dunklen Design wechseln"). No text label, no `aria-pressed` (the label names the action). Hover: `--bg-raised`, border `--text-4`. Persists under `localStorage['ive-theme']` only.
3. **GitHub**: the existing icon button, 36×36, same border and hover as the theme switch, 16px glyph, `aria-label="IVE on GitHub (opens in a new tab)"`.
4. **Primary action**, outlined like today's "Install IVE" (the owner's favourite): display face (Archivo) 15px/650, padding 0 14px, hairline border `--line-strong`, `--text-1`, hover `--bg-raised` and border `--text-4`. OS logic (6.2): Apple silicon Mac = **Download for Mac** → DMG; every other platform = **Install IVE** → `#install` on the homepage, `download.html#terminal` on subpages. The button has `[data-mac-download]`; the script handles all such buttons (`querySelectorAll`).

Below 720px: wordmark, the primary action, and a **Menu** icon button (36×36, same border, 16px two-line glyph, `aria-expanded`, `aria-controls`) that opens a panel under the header on the page ground with a bottom hairline: the three links as 48px rows (16px/500), then one row with the theme switch and GitHub (both 36×36, labelled as above, with their text names beside them). Escape and a tap outside close it. Without JS the panel is a plain list below the header (the `hidden` state is set by JS).

Focus rings: 2px `--accent`, offset 2px, on every control.

**Footer, all pages.** Padding 48px top and bottom, hairline above. One row on desktop: left "IVE" (16px wordmark, dot 4px) and "from AIFOREU ↗" (link to https://aiforgov.eu/, 14px, `--text-3`); right a row of links Product · Download · Architecture · GitHub · Imprint · Privacy (14px, `--text-3`, hover `--text-1`, gap 20px). A second line under the row, 13px mono `--text-4`: "EU-based · Open source under the Apache 2.0 license". Nothing else. Below 720px: two stacked blocks, links wrapping in two columns. The 404 page keeps only the second line and the Imprint and Privacy links.

### 2.3 Homepage: sections, jobs, compositions

Five sections after the opening; the opening is the hero's entrance, not a section of its own.

| # | Section (`id`) | One job | One message | Composition | Height at 1440 (target) |
|---|---|---|---|---|---|
| 0 | Opening (`#top`, in `#hero`) | Signature: the problem and the payoff without words, then the name | "Agents running everywhere." → "Under control." → IVE | Pinned scroll scene, 300vh, hands over into the hero | 2,700 |
| 1 | Hero (`#hero`) | Name the product and show it | Run your coding agents side by side. | Left headline block + full-width product frame (board recording) | ~1,150 (overlaps the opening by 40vh) |
| 2 | Why IVE (`#why`) | The four reasons | Four statement pairs | Full-viewport question, then pinned statement column + sticky media panel | 3,060 (340vh) |
| 3 | Inside IVE (`#inside`) | What IVE really does, as it happens | Four moments: start, loop, drawn loop, loop caught | Chapter rail + one wide player + caption, auto-advancing reel | ~1,250 |
| 4 | Get IVE (`#install`) | The action | Open source. Two ways in. | Centred headline, two panels side by side | ~720 |
| 5 | Maker (`#aiforeu`) | Who makes it, with the approved film | Made by AIFOREU. | Signature strip: film left, text right, hairline above | ~420 |
| | Footer | | | one row | ~140 |

Total about 9,100px at 1440×900 (10 screens), down from 35,870. Mobile target under 11,000px.

Composition check: no two neighbours share a composition and no composition appears twice. Hero and Inside IVE both use a wide product frame, but they are not neighbours, and one is headline-first with a bleeding frame, the other rail-first with a chapter reel and a caption block. Shared language: one grid, one type system, one frame style (ring + shadow), one caption style, one accent.

### 2.4 Word budgets (hard ceilings)

Counted per section: headline, subline or lead, body, and functional lines separately. Marketing copy is headline + subline + body. Functional lines (captions, provenance, requirements, labels, button text, app UI) do not count toward the marketing ceiling but have their own limits. Words are whitespace-separated tokens; "⌘K" is one word.

| Section | Headline | Subline / lead | Body | Functional lines |
|---|---|---|---|---|
| Hero | ≤ 7 | ≤ 10 | 0 | provenance ≤ 12, note ≤ 10 |
| Why IVE | question 2, prelude ≤ 4 | 4 statement pairs, ≤ 10 words each | 4 sentences, ≤ 22 words each | jump labels ≤ 2 words each, panel label ≤ 4 |
| Inside IVE | ≤ 3 | ≤ 10 | 4 chapters: title ≤ 4 + sentence ≤ 24 each | rail labels ≤ 3 words each, provenance ≤ 8 |
| Get IVE | ≤ 6 | ≤ 14 | star line ≤ 12 | path labels ≤ 2, mono lines ≤ 18 each, link ≤ 10 |
| Maker | ≤ 3 | 0 | ≤ 6 | link 2 |
| **Homepage ceiling** | | | **marketing 317** (hero 17, why 134, inside 125, get 32, maker 9) | |
| Product page | H1 ≤ 5 | ≤ 14 | row H2 ≤ 4, row body ≤ 40 | closer ≤ 8 |
| Download page | H1 2 | ≤ 14 | functional only: row text ≤ 70, answers ≤ 40 | |
| Architecture | unchanged | | | |
| 404 | 2 | ≤ 12 | 0 | buttons |

The final copy in section 3 sits at 273 marketing words on the homepage (hero 16, why 109, inside 111, get 31, maker 6) and 326 on the Product page. The current homepage has 3,726 visible words.

### 2.5 Message ledger

Marketing claims appear once on the site, in their primary home. Functional facts (commands, requirements, legal lines, button labels, nav, provenance) appear where they are needed and are marked F.

| Message | Primary home | Form |
|---|---|---|
| Agents everywhere, then under control | Opening scene captions | illustration |
| Run your coding agents side by side (what IVE is) | Hero H1 | headline |
| Claude Code, Codex and Gemini CLI in one window | Hero subline (Download repeats the CLI names as a requirement, F) | sentence |
| Several tasks at once, not one tab at a time; own session and model per task | Why beat 1 | statement pair |
| One board: who runs, who waits, who is done; answer from the board | Why beat 2 | statement pair |
| Every change comes back to you (working and staged diffs, stage, annotate) | Why beat 3 | statement pair |
| Runs on your machine, your CLI logins, no IVE account, provider boundary | Why beat 4 | statement pair + ledger panel |
| Start with a sentence; queue the next instruction while it works | Inside IVE chapter 1 | caption |
| Auto-fix loop: plan approval, separate testing agent, failed check goes back with the report, limit you set | Inside IVE chapter 2 (mechanics in full on Product, row Auto-fix loop) | caption |
| Draw your own loops in Pipelines, cycle limit on every loop | Inside IVE chapter 3 (details on Product, row Pipelines) | caption |
| Loop detection: repeated call, warning, corrective message, on by default | Inside IVE chapter 4 (details on Product, row Loop detection) | caption |
| Open source | Get IVE H2 (license name in the footer line, F) | headline |
| Two ways in: Mac app or terminal | Get IVE | two panels |
| Star ask | Get IVE, one small line (the only one on the site) | sentence |
| Made by AIFOREU, Osnabrück | Maker (opening signature and footer are links, F) | line |
| Recordings are the real app with a demo project, no provider ran | Hero caption (F), Product lead (F), full answer in the Download questions | caption |
| Home: one box, slash commands, @ files; sessions: steps and replies in one conversation | Product, row Home and sessions | row |
| Board: tiles with state, latest reply, own composer; layouts; permissions on the tile | Product, row Board | row |
| Model per session from the CLI's list; agent modes; ⌘K; ? lists shortcuts | Product, row Models, modes and keys | row |
| Review panel: file tree, stage, unstage, annotate, split or unified | Product, row Review | row |
| Cascades, terminal (⌘J), hooks and Safety Gate, optional package scanner, telemetry off | Product, closing text block | three short columns |
| Signed and notarized, Apple silicon, macOS 13.5 (F) | Get IVE Mac panel; Download | mono line |
| curl command, requirements, clone path, uninstall (F) | Get IVE (command only); Download (all) | terminal box |
| Worktrees, event flow, access control, process model | Architecture page | existing content |

Retired for good: "Your code stays on your machine", "Your code stays local", "Give IVE one goal. It coordinates the work", "Less imagining. More looking around.", "IVE done it for you.", "What would you hand to IVE?", "Before you come aboard.", "Run agents. Keep control.", "Nothing slips past you", "⌘K reaches everything", every GOAL → PLAN → WORK → CHECK → REVIEW strip, every "Illustrated example" caption (the only illustrations left are the opening scene and the Why ledger panel), "Mission Control" as a label, "Ralph" as a product name (the UI says Auto-fix loop), every number total, every speed or quality claim.

---

## 3. Every section of every page, final copy

Grid for everything: 12 columns, content max 1,200px, gutters 48px (≥1024), 32px (720 to 1023), 20px (<720). Product frames may exceed the content width to 1,320px (hero only). Vertical rhythm is deliberately uneven; the values below are per section. "Statement pair" means a white line and a grey line at the same size (5.2).

### 3.1 Home

#### 3.1.0 Opening (inside `#hero`)

Specified in full in 4.1. Summary: 300vh (260vh below 720px), pinned 100vh, plain dark ground `#0E1014` in both themes, no corridor, no rings, no scanlines, no vignette, flat cards with depth from scale and opacity, the board panel as the one solid object, two captions in the body face, one chevron scroll cue, then the zoom out of the V, "IVE" stands, unfolds into "Integrated Vibecoding Environment" with "made by AIFOREU ↗" below, then the name shrinks and rises away while the header fades in and the hero rises underneath. The big letters keep their size logic.

Captions (final): "Agents running everywhere." with the live counter "7 running · 5 need your reply" (numbers as the scene computes them); "Under control." with "12 done". Board panel title: "Board · 12 sessions".

#### 3.1.1 Hero (`#hero`, in flow, `margin-top: -40vh` so it rises under the opening's last phase)

Layout: text block left aligned in columns 1 to 8 (max 760px), padding-top 96px (after the overlap resolves the H1 sits 96px under the header), then the product frame centred at 1,320px wide (it bleeds 60px past the content width on each side at 1440; at smaller widths it equals the content width), 56px below the CTA row. 96px below the frame to section 2. Below 720px: text full width, the frame becomes a portrait crop.

Copy:
- H1: **Run your coding agents side by side.**
- Subline (lead, `--text-2`): **Claude Code, Codex and Gemini CLI in one window.**
- CTA row: primary **Download for Mac** (OS aware, 6.2) · the terminal install box `curl -fsSL https://ive.dev/install.sh | bash` with **Copy** (6.3). Below 720px the box is hidden and the primary reads **Get IVE** → `#install`.
- Note under the row (mono 12, `--text-4`, hidden when the button is not the DMG): **For Macs with Apple silicon and macOS 13.5 or newer.**
- Caption under the frame (mono 12, `--text-4`): **Recorded from the IVE app with a demo project. No provider ran.**

Word count: 7 + 9 = 16 (note 10, caption 12, functional).

Visual: `assets/app/hero-board.mp4` (new, dark theme, 1.0.17, the `clips/board.mjs` story re-recorded: four sessions on the board, two running, one waiting with the `npm test` permission card, one done; the permission is answered on the board with "Allow once"; all four end Done; about 14 s; 3200×2000, `-s` 1600×1000; poster `hero-board@2x.webp` = a chosen frame with all four states visible). Shown in the product frame (5.4), full window including sidebar, autoplaying muted when in view, poster first, "Expand" opens the full-size viewer. Until the dark recording exists, use `assets/app/board.mp4` and `board@2x.webp` in the same frame.

Mobile (<720px): `hero-board-m.mp4` + `hero-board-m@2x.webp`: a 3:4 portrait crop of the same recording, master px x 300 to 1150, y 60 to 1190 (the left tile column with the running tile above the waiting tile and its permission card), encoded at 850×1130 and shown at column width, `object-fit: cover`, top aligned. Until it exists, show `board@2x.webp` cropped the same way via `object-position` at 300% width.

#### 3.1.2 Why IVE (`#why`)

Specified in full in 4.2. Layout when live: 340vh, pinned 100vh. Phase A: prelude "You have the agents." (lead size, `--text-3`, centred) above "WHY IVE?" filling the viewport width (Archivo 800, 125% width, as today). Phase B: the question docks top-left as the section heading at 40px. Then two columns: statement column columns 1 to 5 (max 520px), sticky media panel columns 6 to 12 (640×440px at 1440, panel surface, ring, 8px radius, `overflow: hidden`), four jump buttons under the statement column. Below 720px: not pinned; the question stacks on two lines as a normal heading, the media panel is sticky under the header (full width, 4:3), the four beats scroll beneath it in normal flow and swap the panel by intersection; jump buttons as a row of four.

Copy (statement pair + one sentence each; the pair is the white and grey line of one H3):

1. **Several tasks at once.** / **Not one tab at a time.**
   Give each task its own session and model. Start the next one while the first still runs.
2. **One board.** / **Who runs, who waits, who's done.**
   When a session needs you it is marked, and you answer it from the board.
3. **Every change** / **comes back to you.**
   Working and staged diffs for each session, file by file, inside the app. Stage what you accept, annotate what you don't.
4. **Your machine.** / **Your accounts.**
   Runs on your computer with the CLI logins you already have. No IVE account. Your CLI talks to its provider as before.

Jump button labels: Parallel · In view · Review · Yours. Panel label (mono 12, `--text-4`, bottom-left inside the panel): **IVE app · demo project** (beats 1 to 3), **What runs where** (beat 4).

Word count: prelude 4, question 2, beats 27 + 23 + 27 + 26 = 109.

Visuals (crops from the 3200×2000 masters, given in master px, shown at 1:1 CSS px inside the 640×440 panel, `object-position` top-left unless stated):
1. `hero-board.mp4`, the tile area without the sidebar: x 480 to 3200, y 90 to 2000, scaled to 640 wide (text about 11px; the four tile titles, the two Running pills and the states changing carry the message). Fallback until recorded: `board@2x.webp` with the same crop.
2. `why-attention@2x.webp` (still exported by the hero recording script at the frame where the permission card is fully drawn): the waiting tile with the permission card, x 490 to 1840, y 1050 to 1990, scaled to 640 wide. Fallback: the same crop from `board@2x.webp`.
3. `review.mp4` (new, 4.4 clip 6): Fullscreen Code Review, Unified View, the story-matching diff set with `setChanges` (modified lines in `src/components/layout/Sidebar.jsx` and `src/lib/api.js`, not a new file), the view scrolls 300px and stops. Crop: x 60 to 1400, y 120 to 1000 (670×440 CSS): "FILES CHANGED · 2 files", the tree, the first hunk. The builder re-measures the crop on the new frames. Fallback: `review-full@2x.webp` with the same crop.
4. No footage. A typographic ledger on the panel surface, five rows, mono 13px labels (`--text-4`) and body 15px values (`--text-2`), hairlines between rows:
   `Runs on` · your computer, 127.0.0.1 by default
   `Signs in with` · your Claude Code, Codex and Gemini CLI logins
   `Account with IVE` · none
   `Telemetry` · off by default
   `Source` · github.com/michael-ra/ive, Apache 2.0

#### 3.1.3 Inside IVE (`#inside`)

Specified in full in 4.3. Layout: padding 128px top, 112px bottom. Header block: H2 and lead in columns 1 to 7 (max 640px), left aligned. 40px below it the chapter rail (full content width, one row of four chapter buttons separated by hairlines, each with a progress underline). 16px below the rail the player: the product frame at content width (1,200×750 at 1440) with the "Expand" control. 20px below the player the caption block in columns 1 to 7: chapter title (18px/600 `--text-1`) and sentence (16px `--text-3`), crossfading with the chapter; to the right, columns 9 to 12, the provenance line (mono 12, `--text-4`, right aligned). Below 1024px the rail becomes a horizontally scrolling strip with scroll snap. Below 720px: rail strip, then a 3:4 player at column width using the `-m` portrait crops, then the caption, then the provenance line.

Copy:
- H2: **Inside IVE.**
- Lead: **From the first sentence to the passing check.**
- Rail labels (mono 12 number + 14px title): `01` **Start** · `02` **Auto-fix loop** · `03` **Pipelines** · `04` **Loop detected**
- Chapter 1: **Start with a sentence.** · Type what you want on Home and press Start. While the agent works, write the next instruction; Enter queues it.
- Chapter 2: **Build, check, fix, repeat.** · You approve the plan. A testing agent checks the work; a failed check goes back with its report, up to the limit you set.
- Chapter 3: **Draw your own loop.** · Agents, checks and conditions on one canvas. Every loop has a cycle limit and shows which round it is on.
- Chapter 4: **Caught going in circles.** · When an agent repeats the same call three times, IVE warns you and tells it to change approach. On by default.
- Provenance (mono): **IVE app · demo project · no provider ran**

Word count: 2 + 8 + (4 + 20) + (4 + 24) + (4 + 20) + (4 + 21) = 111.

Visuals (4.4): `start-queue.mp4` (18 s), `loop-task.mp4` (19 s), `loop-canvas.mp4` (16 s), `loop-detect.mp4` (10 s); each full window 3200×2000 with `-s` 1600×1000, a chosen poster, and a `-m` 3:4 portrait crop for phones. The reel runs chapter 1 to 4 and starts over; each clip ends on its last frame (no dissolve back to frame 1) because the next chapter follows.

#### 3.1.4 Get IVE (`#install`, keep alias anchors `#waitlist` and `#get-ive`)

Layout: padding 160px top, 96px bottom; everything centred in columns 3 to 10 (max 800px). H2 centred, lead centred, then two paths side by side (each 380px, gap 40px): left "Mac app", right "Terminal"; each path is a panel (panel surface, ring, 8px radius, 28px padding) with a mono label at the top, the action, and one mono line. Under the panels: a centred links row and the star line. Below 720px: the two paths stack, Mac first.

Copy:
- H2: **Open source. Two ways in.**
- Lead: **The Mac app on Apple silicon, or one command on Linux and Intel Macs.**
- Path 1 label: `Mac app` · primary button **Download for Mac** (plain DMG link, no OS logic here) · mono line: **Apple silicon (M1 or newer), macOS 13.5 or newer. Signed by AIFOREU GmbH, notarized by Apple.**
- Path 2 label: `Terminal` · the install box (6.3) with **Copy** · mono line: **macOS or Linux. Python 3.11+, Node.js 22.12+, Git, and a coding CLI you are signed in to.** · small link **Then run `ive`. All steps and the clone path →** (to `download.html`)
- Links row (quiet buttons with a hairline border): **View on GitHub ↗** · **Read the architecture**
- Star line (14px, `--text-4`): **If IVE is useful to you, give it a star on GitHub.**

Word count: 5 + 14 + 12 = 31 (+ functional lines).

Visual: none. The two panels and the terminal box are the picture.

#### 3.1.5 Maker (`#aiforeu`)

Layout: a signature strip, hairline above, padding 72px top and 96px bottom. Left, columns 1 to 6: a 16:9 panel 440px wide (ring, 8px radius, the film inside; the film's light ground stays inside the panel, so the page ground does not change in dark mode). Right, columns 7 to 12, vertically centred: H2 (28px) and one line. Below 720px: panel full width, text below.

Copy:
- H2: **Made by AIFOREU.**
- Line (`--text-3`): **AIFOREU GmbH, Osnabrück.** followed by the link **aiforgov.eu ↗**

Word count: 3 + 3 = 6.

Visual: `assets/aiforeu/reveal-sound-1600.mp4` (≤760px: `reveal-sound-960.mp4`), poster `reveal-poster.webp`, logic from `madeby.js` kept (plays once when the panel is in view, with sound when the browser allows it, otherwise muted with a "Sound on" button; "Replay" at the end; pauses off-screen; reduced motion starts nothing and shows "Play with sound"). Loading changes: `preload="none"` and the source is attached only when the panel is within one viewport. The end card with the EU co-funding notice stays visible after the film (it is part of the approved material).

### 3.2 Product (`product.html`)

Purpose: the catalogue. Rows alternate text side; every row has real footage or a real dark still; no row restates a homepage statement, it describes the view or the mechanism. CSP includes `media-src 'self'`.

Page head (padding 128px top, 64px bottom): H1 **The app, view by view.** (56px) in columns 1 to 7; lead in columns 1 to 7 (`--text-2`): **Recorded from the app itself with a demo project. No provider ran.** Then the rows, 96px apart: text 4 columns (H2 32px, body 16px `--text-2`, max 400px), media 8 columns in the product frame (full window), text left for odd rows, right for even rows. Below 720px: media first, then text.

| Row (`id`) | H2 | Body | Visual |
|---|---|---|---|
| `#home` | Home and sessions | What do you want to work on? One box, slash commands, @ for files. A session shows steps and replies in one conversation. Write the next instruction while it works; Enter queues it. | `start-queue.mp4` full window |
| `#board` | Board | Every session as a tile with its state, latest reply and its own composer. Layouts from one tile to a grid. Permissions are answered on the tile. | `hero-board.mp4` full window |
| `#loop` | Auto-fix loop | An agent implements, a fresh testing agent verifies, and a failed check goes back with the report, up to the limit you set. The guided task adds your plan approval and your acceptance at the end. | `loop-task.mp4` full window |
| `#pipelines` | Pipelines | Draw stages and transitions: agents, checks, commands, conditions. A transition back to a finished stage is a loop; every loop has a cycle limit. The canvas shows which stage runs and which round it is. | `loop-canvas.mp4` full window |
| `#review` | Review | Working and staged diffs, a file tree, Stage and Unstage, Annotate, Copy, Fullscreen in split or unified view. | `review.mp4` full window |
| `#loopguard` | Loop detection | On by default. The same tool call three times in a row, or an A-B-A-B pattern, triggers a warning and a corrective message to the agent. Turn it off under Experimental features. | `loop-detect.mp4` full window |
| `#controls` | Models, modes and keys | Pick the model per session from the CLI's own list. Set the agent mode: ask for each action, approve most, plan only, accept edits, never ask. ⌘K searches tools, sessions and projects; ? lists every shortcut. | three dark stills in a row sharing hairlines (model menu, agent mode menu, ⌘K palette), crops at 1:1 from `reference.mjs` output (`still-model@2x.webp`, `still-mode@2x.webp`, `still-palette@2x.webp`), 8px radius on the group |

Closing text block (`#also`, padding 96px top, hairline above): H2 **Also in the app.** (32px), then three columns of body text (15px `--text-2`, mono 12 label above each), no frames:
- `Cascades` · A saved sequence of prompts, each sent after the previous turn ends. It can repeat, up to fifty rounds. ⌘Esc stops it.
- `Terminal` · ⌘J opens a real terminal on the session's process. Your CLI, your shell, inside the app.
- `Safety` · Hooks let IVE follow each agent and let its Safety Gate stop risky commands; your own hooks stay untouched. An optional package scanner, off by default, checks installs. Telemetry is off by default.

Closer (padding 96px): one quiet button, centred: **Get IVE on the Download page →**. No install block here.

Word count: 5 + 12 + rows 36 + 28 + 38 + 36 + 19 + 34 + 40 + block 4 + 23 + 17 + 34 = 326 (ceiling: H2 ≤ 4, bodies ≤ 40 each).

### 3.3 Download (`download.html`)

Purpose: everything functional about getting IVE, in table form. No marketing copy. No video, so no `media-src`.

Page head (padding 128px top): H1 **Download IVE.** (56px), lead: **The Mac app on Apple silicon, or the one-line install on macOS and Linux.** Then three rows, each a panel (ring, 8px radius, 32px padding), 24px apart, max 800px, left aligned in columns 1 to 8:

1. `Mac app` (mono label) · primary **Download for Mac** (DMG link) · mono: **Apple silicon (M1 or newer) · macOS 13.5 or newer** · body: **Open the disk image and drag IVE into Applications. The app runs its own local service in the background: no terminal window, no browser tab, one app in the Dock. You need at least one coding CLI you are signed in to: Claude Code, Codex or Gemini CLI. The app is signed by AIFOREU GmbH and notarized by Apple. The SHA-256 is on the releases page.** · link **Release notes on GitHub ↗** (https://github.com/michael-ra/ive/releases)
2. `Terminal` (`id="terminal"`) · install box with **Copy** · body: **Then start IVE with `ive`. It runs in the background and opens http://127.0.0.1:5111; you can close the terminal. `ive stop` stops it; `ive status`, `ive logs` and `ive update` do what they say; `ive uninstall` removes it. The installer puts the code in `~/.ive`, installs its dependencies, builds the app and adds the `ive` command to `~/.local/bin`. It does not use sudo.** · link **Read the script first on GitHub ↗** (https://github.com/michael-ra/ive/blob/main/get.sh) · mono: **Requirements: macOS or Linux · Python 3.11+ · Node.js 22.12+ with npm · Git · at least one coding CLI (Claude Code, Codex, Gemini CLI)**
3. `From source` · terminal box with the four lines `git clone https://github.com/michael-ra/ive.git` / `cd ive` / `bash install.sh` / `bin/ive` and **Copy** · body: **Add `--plan` to print the steps without running them.**

Then **Questions** (H2 32px) with five native `<details>` rows (same column width):
- Which agents work with IVE? → Claude Code, Codex and Gemini CLI. Available models depend on your installed CLI and provider account.
- Does the model run locally? → IVE runs on your computer and listens on 127.0.0.1 by default. Your coding CLI still sends prompts, context and code to the provider you use, as it does without IVE.
- Are the recordings real? → Yes. They show the IVE app on an isolated test transport with a prepared demo project (Orbit). No provider ran. The opening scene of the homepage is an illustration.
- Which platforms? → The Mac app runs on Apple silicon with macOS 13.5 or newer. The terminal install works on macOS (including Intel Macs) and Linux. There is no Windows version.
- How do I remove it? → Terminal install: `ive uninstall`. Mac app: quit it, run `"/Applications/IVE.app/Contents/Resources/backend/ive-backend" --remove-hooks`, then delete the app.

Closer: none beyond the footer. Avoid `name@x.y` strings in visible text (Cloudflare rewrites them).

### 3.4 Architecture (`architecture.html`)

Keep every block and its copy. Restyle to the new system: H1 56px/560, H2 32px, body 16px, the process, event, worktree, API, access and security figures on the panel surface with the new hairline and mono tokens; the security ledger may keep its inverted ground. Replace the "Try IVE" closer with the same quiet button as Product: **Get IVE on the Download page →**. New header and footer. No clip, so no `media-src`.

### 3.5 Imprint, Privacy

`<main class="legal-main">` byte-for-byte unchanged (hashes in `research/04` section 4). Restyle `legal-head`, `legal-sections`, `legal-section`, `legal-copy`, `kicker`, `mono` to the new tokens: two-column layout (label column 3, text column 9) at ≥1024, stacked below. Privacy keeps `lang="de"` and its German chrome strings (skip link "Zum Inhalt springen", nav label "Hauptnavigation", wordmark label "IVE, Startseite", theme labels in German). Page `<title>` without the em dash: "Imprint / Impressum · IVE", "Datenschutz · IVE".

### 3.6 404

Self-contained page (its own inline style and theme script, both hashed): the new header with the wordmark (22px) and the three links, H1 **Not found.**, one line **This page does not exist. The homepage has everything that does.**, buttons **Go to the homepage** (outlined) and **Download IVE** (quiet, to `download.html`). Reduced footer. Dark default like every page.

---

## 4. The three scenes

### 4.1 Opening

Markup contract (keep the names so `script.js` L684 to 1030 can be carried over and tightened): `section#hero` contains `[data-mark]` with `[data-mark-pin]`, the scene `[data-scene]` with `[data-scene-swarm]`, `[data-scene-board]`, captions `[data-scene-caption="a"|"b"]` with `[data-scene-count]`, the name line `[data-mark-line]` with 3 × `[data-mark-cap]` and 3 × `[data-mark-rest]`, `.mark-by` ("made by AIFOREU ↗", link to https://aiforgov.eu/), `.mark-hint` (one chevron), and an `sr-only` full name. Removed from the markup: `[data-scene-cam]`, the four `[data-wall]`, `[data-scene-rings]`, the scanline and vignette layers.

Ground: `#0E1014` in both themes for the whole pinned phase; the header uses dark ink (`html.mark-dark`) until the hand-over. Section height 300vh (260vh below 720px), pin 100vh, so the travel is 200vh (160vh on phones). Progress `raw` is 0 to 1 over the travel:

| raw | Phase | What happens |
|---|---|---|
| 0.00 to 0.22 | Swarm | 12 flat session cards (title, model label, state pill; models only sonnet, haiku, opus, Gemini Pro, Gemini Flash) in depth: scale 0.55 to 1.15, opacity 0.35 to 1 by depth, no rotation, no tilt, no shiver. They drift on a slow clock and advance toward the viewer with scroll (a fast scroller gets a fast scene). From raw 0.06 some flip to Waiting (amber pill). Caption A "Agents running everywhere." (16px body face, `--text-2`, bottom-left of the pin) with the counter "N running · M need your reply" (mono 12, `--text-3`). The chevron (16px, `--text-3`, bottom centre) fades out by raw 0.03. |
| 0.22 to 0.42 | Dock | The cards glide onto a 4×3 grid inside the board panel (panel surface, ring, 8px radius, title "Board · 12 sessions" mono 12) which fades in from 0.28. Caption B "Under control." crossfades in at 0.34, counter "12 done" counts up as the pills turn Done (green) one by one from 0.36 to 0.42. |
| 0.42 to 0.45 | Cut | Board and captions fade to the ground. No black-out: the ground never changes. |
| 0.45 to 0.60 | Zoom | The letters appear in `--text-1` of the dark theme. The viewer starts inside the V's left stroke at a 5× pop (stroke edges visible on the first lit frame) and eases out until "IVE" stands at the existing size (min(50vw, 56vh) cap height, the existing measure-and-fit logic, font size capped at 6000px with `scale()` for the rest). |
| 0.60 to 0.64 | Hold | "IVE" stands. |
| 0.64 to 0.82 | Unfold | The caps spread, "ntegrated", "ibecoding", "nvironment" slide out from behind them with the existing exponential reveal, the type shrinks so the line never leaves the viewport; "made by AIFOREU ↗" fades in at 0.78 under the line. Below 720px the letters stack and unfold to the right (existing variant). |
| 0.82 to 0.88 | Hold | The full name stands. |
| 0.88 to 1.00 | Hand-over | The name line scales to 0.6 and rises 12vh while its opacity goes to 0 by 0.98; at 0.94 the header drops `mark-dark` and takes the page tokens; in light mode the scene ground crossfades to the page ground between 0.90 and 1.0 (dark mode: nothing changes); the hero rises underneath (hero `margin-top: -40vh`). No fly-into-the-header: the small wordmark simply fades in with the header. |

Rules: one rAF loop that runs only while the scene is in view; scroll and resize request frames, the swarm's idle drift is the only timer and it stops when the section leaves the viewport. Real font sizes for the letters, never `scale()` on small text layers (Safari pixelation). The swarm cards are built in JS from the site's own tokens (body face + mono), so `app-ui*.css` is not needed; the `.au` card subset is re-created in `opening.css` as `.swarm-card`. No-JS and reduced motion: the static block (full name at the lead size, signature below, 100vh minimum, dark ground) and then the hero in normal flow.

### 4.2 Why IVE

Markup contract: `section#why[data-why]` with the prelude, the question (two `[data-why-word]`), four `[data-why-beat]` articles (each: H3 with two spans for the pair, one `<p>`), the media panel `[data-why-panel]` with four `[data-why-media]` children (two `<video>`, one `<picture>`, one `<dl>` ledger) and four `[data-why-jump]` buttons.

Timeline at ≥720px (340vh section, pin 100vh, travel 240vh; progress 0 to 1):

| progress | What happens |
|---|---|
| 0.00 to 0.12 | Prelude and the viewport-wide "WHY IVE?" stand. No scroll cue. |
| 0.12 to 0.19 | Prelude fades; the question steps through real font sizes to 40px and moves to the top-left heading position (a 150px move, not a slow zoom). |
| 0.19 to 0.22 | Two-column layout and jump buttons fade in with a 12px rise. |
| 0.22 to 1.00 | Four beats of equal length (about 420px of scroll each at 900px tall). A beat's text goes out with opacity and a 12px drop, the next comes in with opacity and a 12px rise, 220ms, no blur, no rotation. The media panel crossfades (200ms) to the beat's media; videos play only while their beat is active and pause otherwise. |

Jump buttons scroll the window to the beat's start position and are keyboard operable; the active one has `aria-current="true"`. Below 720px: no pin (3.1.2). Reduced motion and no-JS: question as a heading, four beats in normal flow with their media stills above each.

### 4.3 Inside IVE

Markup contract: `section#inside[data-inside]` → header block → `ol[data-chapters]` with four `<li><button data-chapter="n" aria-pressed>` (number, title, progress underline driven by `--p`) → `figure[data-player]` with one `<video muted playsinline preload="none">` carrying `data-src`, `data-src-small`, `data-src-m` and `data-poster` per chapter in a JSON attribute on the `<li>` buttons, plus the "Expand" button → `figcaption` with `[data-chapter-caption]` and the provenance line.

Behaviour: when the section is at least 50% in view, chapter 1 loads (master when `width × DPR > 1700`, `-s` otherwise, `-m` below 720px) and plays; `timeupdate` drives the underline; on `ended` the next chapter loads and plays, after chapter 4 chapter 1 again; a click on a chapter switches at once and keeps auto-advance; off-screen the player pauses and resumes where it was; the tab being hidden pauses it. "Expand" opens the same `<dialog>` viewer as the hero, with the chapter's full clip and its caption. Reduced motion: posters only, a centred play button, no autoplay, no auto-advance (the rail still switches chapters). No JS: four `<figure>` elements with poster images and captions in normal flow (the rail is plain text).

Why this composition differs from its neighbours: Why IVE is text-led (statement column) with a small sticky panel; Inside IVE is footage-led (one wide player) with the text reduced to a rail and a caption; Get IVE after it has no footage at all.

### 4.4 Recording plan (six clips, dark theme, 1.0.17, project Orbit)

All with `scripts/demos` on the installed app's frontend build over the isolated test transport; nothing touches a real IVE. Recorder housekeeping first (from research 05, section 3.2): `openDemo` forwards `tasks`, `runs`, `pipelines`, `theme`; the `GET /sessions/*/export**` route returns empty text; a helper that advances the fake clock off camera until a condition holds; a pointer-free option for crop sources; a chosen poster frame; bt709 colour tags; a crop pass that cuts the `-m` portrait files and the stills from the master frames; the README's version line. Model labels in recordings: Claude Code sessions sonnet or opus, Codex sessions `default`, Gemini CLI sessions the profile's Flash value. Durations exclude any dissolve. Each clip script carries the provenance comment.

| # | File | Seconds | Shows | Used by |
|---|---|---|---|---|
| 1 | `hero-board` | 14 | The board: four sessions (Build the workspace, Claude Code sonnet, Running; Connect the API, Codex, Running; Check the sign-in flow, Claude Code sonnet, Waiting with the `npm test` permission card; Review the changes, Gemini CLI, Done). "Allow once" clicked on the board, steps tick, all four end Done. Export the still `why-attention` at the frame where the permission card is fully drawn. If the Gemini profile does not render cleanly on the transport, the fourth tile stays Claude Code opus as today. | hero frame, hero `-m` crop, Why beats 1 and 2, Product row Board, OG image |
| 2 | `start-queue` | 18 | Home: "Add a dark theme toggle to the sidebar. Keep the existing keyboard shortcuts working." typed, Start, the session opens, two tool steps land, the composer shows "Claude is working. Write your next message, Enter queues it.", the follow-up "Also add ⌘⇧T as the shortcut and mention it in the README." is typed, Enter, "UP NEXT · 1", the agent finishes, "DELIVERED", the follow-up appears, the agent starts on it (Read, Edit). `-m` crop: the content column with the composer. | Inside IVE chapter 1, Product row Home and sessions |
| 3 | `loop-task` | 19 | The guided task "Fix the expired-session redirect" (demo data and report texts from research 05, clip 1): "1 item needs your attention", Review, "Approve the plan" with "Proposed plan" and "Plan review", "Approve plan & start", Working, Checking the result, Fixing issues with "Test evidence · Reported failure" (13 passed, 1 failed), Checking again with a second testing session in the sidebar, "Review the result", "Accept result", then "Run details": completed, "Cycle 2 of 3", stages with pass chips. States pushed with `setRun` from the engine-accurate graph. The 1.0.17 build shows the German "Run abbrechen" button in this window: the recorder replaces that one label with "Cancel run" in flight (Playwright route on the bundle, documented in the clip script and the recorder README) until a build ships the English label; if the owner prefers no patched label, record clip 3b instead: the Feature Board card, Execute tab, "Auto-fix loop" ticked (chips Implement · Verify · Fix loop (5 max) · Status), "Plan first" ticked, Maximum cycles set to 3, Start Pipeline Run, History tab "Pipeline Runs · running · iter 1" (12 s, verified without any German label). `-m` crop: the task window. | Inside IVE chapter 2, Product row Auto-fix loop |
| 4 | `loop-canvas` | 16 | Pipelines (⌘⇧L): "Choose a Pipeline" with the preset cards, click the saved "Sign-in checks loop" under Your Pipelines (RALPH graph, no `{topic}`), Run, "Cycle 1 of 20 · running", Execute pulses, edge to Verify animates, Verify fails, "Fix issues" edge, Fix runs, "Cycle 2 of 20", Verify again, pass, "completed", then Run Detail with the pass chips. Never run a preset from the editor (fails in 1.0.17). `-m` crop: the canvas around Verify, Evaluate and Fix. | Inside IVE chapter 3, Product row Pipelines |
| 5 | `loop-detect` | 10 | Session "Check the sign-in flow" working, three identical `npm test` steps land, toast "Loop detected in Check the sign-in flow: repeated Bash with same input 3 times", the corrective message arrives as the next user turn, the agent reads `tests/sign-in.spec.js` and edits `src/app/routes.js`. `-m` crop: the conversation column with the toast. | Inside IVE chapter 4, Product row Loop detection |
| 6 | `review` | 10 | Session "Review the changes": Review opens the side panel (Working Diff, file tree with `src/components/layout/Sidebar.jsx` and `src/lib/api.js` as modified files via `setChanges`), Fullscreen, Unified View, the view scrolls 300px and stops. | Why beat 3 crop, Product row Review |

Stills (not clips) from `reference.mjs` in dark: `still-model@2x`, `still-mode@2x`, `still-palette@2x` (Product row Models, modes and keys), and the board still for `assets/og.html`. Until a clip exists, its slot uses the fallback named in the section; a chapter whose clip is missing is hidden from the rail, never shown as an empty frame.

---

## 5. Visual system

### 5.1 Tokens (`site.css`, dark is the default, light under `html[data-theme="light"]`)

```text
                     dark                      light
--bg                 #0E1014                   #F6F7F8
--bg-raised          #15181D                   #FFFFFF
--bg-inset           #0A0C0F                   #EEF0F2
--bg-glass           rgba(14,16,20,.82)        rgba(246,247,248,.84)
--line               rgba(255,255,255,.08)     rgba(16,18,22,.10)
--line-strong        rgba(255,255,255,.16)     rgba(16,18,22,.18)
--text-1             #F2F3F5                   #15171A
--text-2             #C6CAD1                   #3E434A
--text-3             #8B919B                   #646A73
--text-4             #6B717B                   #7C828B
--accent             #5B8CFF                   #1647FF     (links, running, focus, the dot)
--accent-fill        #3D6BFF                   #1647FF     (filled primary button, white text)
--done               #7DCE82                   #087A4B
--waiting            #E0A54A                   #B7791F
--attention          #F2545B                   #C83B24
--on-accent          #FFFFFF                   #FFFFFF
```

Three grounds, four text steps, one hairline, one accent. Blue only for running states, links, focus, the wordmark dot and the filled primary button. `<meta name="theme-color">` `#0E1014` (dark) and `#F6F7F8` (light); the theme script updates it. `color-scheme: dark light`.

### 5.2 Type

Archivo (display, variable 500 to 800, width 100 to 125), Source Sans 3 (body, 400 to 600), IBM Plex Mono (400, 500, 600), all from `assets/fonts.css`, which keeps the privacy notice's font sentence true. Inter and JetBrains Mono are dropped with the app-style illustrations.

| Role | Face | Size / line / weight | Notes |
|---|---|---|---|
| H1 | Archivo 700, width 110% | 56px / 1.05 / tracking -0.03em; 40px below 720px | left aligned |
| Why question | Archivo 800, width 125% | fills the viewport width, then 40px | existing fit logic |
| H2 | Archivo 700, width 110% | 40px / 1.1 / -0.02em; 30px below 720px | |
| Statement pair (H3) | Archivo 600, width 105% | 32px / 1.15; 26px below 720px | white line `--text-1`, grey line `--text-3`, same size and weight |
| Lead | Source Sans 3 400 | 20px / 1.45 | `--text-2` |
| Body | Source Sans 3 400 | 16px / 1.55 | `--text-2` for marketing body, `--text-3` for captions |
| Caption title | Source Sans 3 600 | 18px (Inside), 15px (tiles) | `--text-1` |
| Mono | IBM Plex Mono 500 | 12px / 1.4, 13px in ledgers, 14px in terminal boxes | `--text-4` labels, `--text-1` commands; no uppercase tracking |
| Nav link | Source Sans 3 500 | 14px | |
| Button | Archivo 650 (primary), Source Sans 3 500 (quiet) | 15px / 14px | |

No faded second headline line on H1 or H2. Max line length 64ch. Arrows (→ ↗), the chevron, sun, moon, GitHub, menu, copy, expand, play and the state glyphs are inline SVG, never font glyphs.

### 5.3 Buttons

One family, 6px radius, no pills: **primary outlined** (header and Get IVE Mac panel: hairline `--line-strong`, Archivo 15px/650, 36px in the header, 44px in sections, padding 0 18px); **primary filled** (hero only: `--accent-fill`, white text, 44px) ; **icon** (36×36, hairline, 16px glyph); **quiet** (no border at rest, hairline on hover; links row and closers). Hover 120ms, active `scale(.98)`. Focus ring 2px `--accent`, offset 2px.

### 5.4 Product frame, captions, panels

Product frame: `--bg-inset` ground, 8px radius, ring `0 0 0 1px var(--line)`, shadow `0 24px 64px rgba(0,0,0,.45)` dark / `0 24px 64px rgba(16,18,22,.14)` light, a 1px inset top highlight `rgba(255,255,255,.06)` in dark. No title bar, no fake macOS chrome: the app's own sidebar and top bar are the chrome. Video `object-fit: cover`, poster first, "Expand" as a quiet icon button at the top right, visible on hover and focus-within and always on touch devices. Panels (Why media, Get IVE paths, ledger): `--bg-raised`, ring `--line`, 8px radius. Terminal box: `--bg-inset`, hairline, mono 14px, `$` prompt in `--text-4`, the Copy button at the right edge. Captions: mono 12 `--text-4` for provenance; title 18/600 + sentence 16 `--text-3` for chapter captions. Hairlines, not boxes, separate rows on the Product page.

### 5.5 Motion

Budget: the opening scene, Why IVE, the recordings, and 120 to 220ms hover and crossfade transitions. No scroll-triggered reveals, no parallax, no sticky stacks, no blur on text, no `will-change` on text layers. `prefers-reduced-motion`: no autoplay anywhere, the two scenes show their static states, transitions become instant.

### 5.6 Responsive

Breakpoints 720 and 1024. Below 720: 20px gutters, H1 40px, H2 30px, statement pairs 26px, body 16px, captions 13px minimum; every product frame uses a portrait `-m` crop (3:4) at column width, never a downscaled full window (app text would be about 3px). Between 720 and 1023: 32px gutters, full-window frames at content width, rows stack media-first. No horizontal overflow at 390 or 1440.

### 5.7 Performance and loading

Videos `preload="none"`, source attached when the frame is within one viewport, `-s` rendition unless `width × DPR > 1700`, one playing video at a time on the homepage (hero, Why, Inside and the film pause each other when they leave the viewport). Posters are WebP at the frame's display size (`@2x` for DPR 2). Fonts `font-display: swap`, three families only. Homepage transfer target under 600 KB before any video. All assets same-origin (CSP).

### 5.8 Accessibility

Skip link to `#main`. Landmarks: header, nav (`aria-label="Main"`), main, footer. Every clip has `aria-label` naming what it shows; the chapter rail is a list of buttons with `aria-pressed`; the full-size viewer is a `<dialog>` with focus trap and Escape. Contrast: `--text-3` on `--bg` ≥ 4.5:1 in both themes, white on `--accent-fill` ≥ 4.5:1 (the QA step measures). Everything reachable by keyboard; nothing conveyed by colour alone (state pills carry a word).

---

## 6. Behaviours that must keep working

### 6.1 Theme

Inline boot script in every `<head>` (hashed in that page's CSP): reads `localStorage['ive-theme']`, sets `html[data-theme]`, defaults to dark (no stored value means dark), and on the homepage adds `mark-live` and `mark-dark` unless reduced motion is on. The toggle (2.2) flips the attribute, stores only `ive-theme`, updates `theme-color` and its own label. Dark tokens are the CSS default so no-JS visitors get dark; `html[data-theme="light"]` overrides.

### 6.2 Download logic

Every `[data-mac-download]` button starts as the DMG link `https://github.com/michael-ra/ive/releases/latest/download/IVE-macOS-arm64.dmg` with the label "Download for Mac" (works without JS). On load: if the platform is not macOS, or the device is a touch device (iPad reports Mac), or `navigator.userAgentData.getHighEntropyValues(['architecture'])` reports `x86`, the button becomes "Install IVE" (homepage: `#install`; subpages: `download.html#terminal`) and the Apple silicon note is hidden. Safari and Firefox on Intel Macs keep the DMG link and the note. Plain DMG links (`download.html`, Get IVE Mac panel) have no `data-mac-download` and never change.

### 6.3 Copy buttons

`[data-copy]` buttons ship `hidden`, JS reveals them. They copy the `data-copy` value, fall back to selecting `[data-copy-source]` in the nearest `[data-copy-box]`, announce "Copied" in their own `[data-copy-status]` live region, and reset after 2.2 s. Each terminal box has its own status element.

### 6.4 Videos and the viewer

As in 5.7 and 4.3; shared code in `site.js` (`[data-clip]` frames: lazy source, in-view play, pause off-screen and on hidden tab, reduced motion cover, the `<dialog>` viewer with Escape and focus return). `madeby.js` keeps the film's own logic.

### 6.5 Fixed files

`install.sh` byte-identical (never edited, never excluded). `CNAME` and `robots.txt` unchanged. `sitemap.xml` updated (2.1). `_config.yml`: add `design` and `review` to `exclude` (the research and review folders must not publish). Legal `<main>` unchanged. Every page: CSP meta as today's pattern, `default-src 'none'`, `'self'` sources only, inline script by recomputed sha256, `media-src 'self'` only on pages with video (index, product), `img-src 'self' data:`, `base-uri 'none'`, `form-action 'none'`, `connect-src 'self'` where a script fetches (none planned, so omit). `?v=20261023a` on every CSS and JS reference.

---

## 7. Files

### 7.1 Shared files the foundation step creates

| File | Holds |
|---|---|
| `site.css` | tokens (5.1), reset, type (5.2), grid, header and menu panel (2.2), footer, buttons (5.3), product frame, panels, terminal box, captions, `<dialog>` viewer, legal page styles (3.5), architecture figures (3.4), 404 helpers, print |
| `home.css` | hero, Why IVE (4.2), Inside IVE (4.3), Get IVE, Maker |
| `opening.css` | the opening scene (4.1) including the `.swarm-card` styles |
| `site.js` | theme (6.1), nav scrolled state and menu panel, download logic (6.2), copy buttons (6.3), clip player and viewer (6.4) |
| `opening.js` | the scene controller (from `script.js` L684 to 1030, tightened to 4.1) |
| `home.js` | Why IVE controller (from `script.js` L1369 to 1586, reworked to 4.2), the Inside IVE reel (4.3) |
| `madeby.js` | kept, with the lazy source change |
| `assets/fonts.css` | kept; Inter and JetBrains Mono declarations removed |
| `assets/og.html` | rewritten dark with the new H1 and the dark board still; `og.png` re-captured at 1200×630 |

Pages load `site.css` + `site.js` always; `index.html` adds `opening.css`, `home.css`, `opening.js`, `home.js`, `madeby.js`.

### 7.2 Obsolete (delete once no page references them)

`redesign.css`, `redesign.js`, `redesign-shell.css` (dead since 19 Oct); `showcase.css`, `showcase.js`, `behind.css`, `behind.js`, `app-ui.css`, `app-ui-blocks.css` (illustrated sections and the tabbed tour are gone); `styles.css` and `script.js` (replaced by `site.css`, `home.css`, `opening.css`, `site.js`, `home.js`, `opening.js`); `assets/app/home.webp`, `review.webp`, `setup.webp` (unreferenced 1x posters); `assets/fonts/inter-*.woff2`, `jetbrains-mono-*.woff2` and their license files; `scripts/demos/shot-section.mjs` (old port and section ids) unless the recordings step updates it. The light 1.0.12 recordings (`board`, `home`, `session`, `review`, `setup` with their posters) stay until their dark replacements exist, then go.

### 7.3 DESIGN.md

The QA step rewrites it to this system: dark first, muted product loops only in view, the bento-free composition map above, the honesty rules of README and research 04 and 05, the status language, and the hard bans that still hold (no social proof, no fake chrome, no numbers as proof, no purple or neon, no workforce metaphors, no pills). The ban on "looking like Cursor or Linear" goes; the owner asked for their spirit.

---

## 8. Acceptance for the build round

1. For each section, "after this I know or can see ___" has a different answer from the previous section, with one primary visual.
2. No marketing claim appears twice (2.5); recurring nav, install CTAs and provenance labels are fine.
3. No two neighbouring sections share a composition; desktop and mobile screenshots read as a sequence, mobile is not a queue of identical cards.
4. Word counts per section at or under 2.4, measured on the rendered page.
5. Opening scene and Why IVE preserved; the big IVE letters unchanged in size; the nav wordmark at 22px without "by AIFOREU"; the header controls as in 2.2; the mono "Light" box gone.
6. Inside IVE shows the four recorded moments including the loops; no empty frames; the reel advances and pauses as specified.
7. Theme switch remembered, copy buttons, download logic, legal `<main>` hashes, 404, CNAME, robots, sitemap, install.sh byte-identical, CSP valid on every page, no console errors, no external requests, `?v=20261023a` everywhere.
8. Screenshots at 1440×900 and 390×844 (device emulation), dark and light, judged by the builder before hand-off.

---

## 9. Open items for the owner (not blocking the build)

- The German "Run abbrechen" label in the guided task window: ship the English label in 1.0.18 so the next recording needs no in-flight replacement (4.4, clip 3).
- Plain HTTP on ive.dev is not redirected to HTTPS; Cloudflare Email Obfuscation rewrites `name@x.y` strings (research 04, 3.1 and 3.3). Both outside the repo.
- Whether the favicon and touch icons switch to the logo kit's `web/` set (cheap, separate decision).

---

## 10. Where this brief deviates from Codex

- **Hero copy.** Codex: "Build with more than one agent." plus a two-sentence support. Mine: "Run your coding agents side by side." and one line naming the three CLIs. The verb-first line says what IVE is in seven words; the three names do the qualifying; the board recording does the rest.
- **Why IVE beats.** Codex's four ("Split the work", "See what needs you", "Keep checks moving", "Choose what ships") put retries into Why and leave out the owner's fourth reason, the local machine. Mine keep the owner's four reasons and move the loop to Inside IVE, where real footage shows it instead of a drawn retry.
- **Evidence section.** Codex's "Follow a change through" rested on the illustrated retry tunnel plus the old off-story review still. Research 05 shows the real loop is recordable, so Inside IVE carries it with four real clips and the tunnel is retired.
- **Tools section.** Codex's compatibility band becomes Why beat 4 with the ledger panel (accounts, local boundary) and the Product page row for models and modes. No separate homepage section for it: it would be the sixth section with text and a small crop, which is the shape the owner is tired of.
- **FAQ on the homepage.** Codex allowed three answers near the install area. Mine keeps the homepage free of questions and puts five on the Download page, because the questions are functional, not persuasive.
- **Budgets.** Codex proposed 290 marketing words with hero 45 and Why 60. Mine sets 317 as the ceiling with Why at 134 and Inside at 125, because those two sections now do the arguing, and the hero drops to 17.
- **Captions.** Codex's "Illustrated workflow" and "Retry: illustration" captions are not needed: there is no illustrated workflow left except the opening and the ledger panel.

---

## 11. Changelog

- **2026-10-22, evening (tightening pass, lead design).** The first synthesis ended at section 3.6 and referred to sections 4 to 10 that did not exist; they are written now (scenes, recording plan, visual system, behaviours, files, acceptance, open items, deviations). Merged the owner's two inputs of 20:03: the navigation is specified exactly (2.2) and Inside IVE is rebuilt around the real loops and automations from research 05 (3.1.3, 4.3, 4.4) with a realistic six-clip recording list. Replaced the former "Controls" bento and "Start" split with Inside IVE; the model, mode and ⌘K facts moved to the Product page. Added hard word budgets per copy role (2.4) and cut the copy to fit (homepage 273 marketing words). Maker became a signature strip so it no longer shares the centred-panel composition with Get IVE. Softened or corrected claims: "nothing slips past you", "⌘K reaches everything", "Passing checks still leave the decision to you" (true only for the guided task, now said so), "listens only on 127.0.0.1" (now "by default"), the opening's "Mission Control" label, Codex model `gpt-6-astra` (recordings show `default`). Ruled on model names: recordings show the CLI profile's real values, illustrations use only Haiku, Sonnet, Opus, Gemini Pro, Flash. The opening keeps its big letters and loses the fly-into-header ending (simple hand-over instead). Why IVE is 340vh (was 300vh in the first draft, 490vh live) and unpinned on phones. Checked against Codex's acceptance list (section 8 items 1 to 3 are its points).
