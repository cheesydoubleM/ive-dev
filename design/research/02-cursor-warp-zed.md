# How Cursor, Warp and Zed present a downloadable developer tool

Research for the ive.dev redesign. Area: how developer tools with a real, downloadable app show that product on their marketing site, and how they say "why" in very few words.

Method: every page was loaded headless in Chromium (Playwright, desktop 1440x900 at DPR 1 and 2, phone 390x844 iPhone emulation), scrolled slowly, filmed one viewport at a time, captured full-page, and measured with getComputedStyle. All screenshots and the raw JSON per page are in `/private/tmp/claude-501/-Users-maximilianschwarz/5351d8ba-945e-47c6-9f76-e8ef6642bb91/scratchpad/redesign/cursor-warp-zed/` (folders `cursor/`, `warp/`, `zed/`, one subfolder per URL with `hero-0s.png`, `hero-6s.png`, `hero-2x.png`, `film-NN-yNNNN.png`, `full.png`, `m-hero.png`, `m-full.png`, `data.json`). Values below are measured on 2026-10-22 unless marked as an observation.

Pages studied:

- Cursor: cursor.com (home), /product, /download, /cli. (/agents redirects to a sign-in page, /code-review is a 404; both skipped.)
- Warp: warp.dev (home, now a "software factories" platform page), /terminal (the downloadable app), /download, /agent-cli.
- Zed: zed.dev serves two homepages in rotation (a "Zed Industries" holding page and the editor page "Your last next editor"; both captured), /download, /features. Because Zed Industries launched Delta (a desktop app for coding with agents, closest to IVE in subject), delta.dev and delta.dev/download were studied as the fourth reference.

A note on IVE's footage: the IVE recordings in `assets/app/` show a light app (white workspace, light grey sidebar). All four references put a dark product on a dark page or match the product theme to the page. This matters for framing; see pattern 4 and the open question at the end.

---

## 1. Cursor (cursor.com)

### Hero

- Headline: "Cursor is your coding agent for building ambitious software." One sentence, 9 words, 26px / 400 / -0.325px tracking, left aligned, 658px wide, placed 112px below a 52px fixed header. The headline is deliberately small; the product frame is the hero.
- No subline. Two CTAs directly under it (43px tall pills, 16px/400): "Download for macOS ⤓" (filled, #EDECEC on #14120B) and "Request a demo →" (grey pill #26241E). The download href points to the darwin-universal build, so the button is OS-aware. On a phone the download pill is replaced by "Get started →" (no installer offered on phones).
- Product visual: a 1300x720 frame (full content width, 70px gutters, 4px radius, overflow hidden) filled with a public-domain landscape painting; inside it a 1080x620 "Cursor Desktop" window with macOS traffic lights, 10px radius, and a three-layer shadow: `0 28px 70px rgba(0,0,0,.14), 0 14px 32px rgba(0,0,0,.1), 0 0 0 1px rgba(255,255,255,.1)`. A second, smaller "Cursor CLI" window overlaps it at the bottom right. The frame starts at y=351, so headline, CTAs and the product are all in the first viewport.
- The window is not a video and not an image. It is live HTML: a scripted mock that advances through an agent run (task list "IN PROGRESS 1 / READY FOR REVIEW 4", a plan, a browser preview). In 5 seconds about 90% of the text nodes in the hero changed. It follows the site theme (in light mode the window chrome turns light).
- No video element on the whole homepage except the 1.5 s logo animation.

### Further down

- A logo wall ("Trusted every day by teams that build world-class software", 8 logos in bordered cells) sits right under the hero.
- Four feature sections in one flush block, each a 1300x715 card (#1B1913, 4px radius, 17.5px padding). The whole card is a link to /product. Inside: a 382px text column (22px/400 title, 22px/400 subline at 60% opacity, orange arrow link #F54E00 16px) and a painting-backed visual on the other side; the window inside the visual bleeds out of the card edge (cropped). The text column alternates left/right from card to card. 90px between cards.
- Titles are outcome claims of 4 to 6 words: "Agents turn ideas into code", "Works autonomously, runs in parallel", "In every tool, at every step", "Hand work to AI teammates". Each has exactly one sentence under it.
- Then: six testimonial cards under "The new way to build software." (36px), "Stay on the frontier" (three 16px-titled cards with UI crops), a Changelog row (4 cards), a research-team split with a photo, "Recent highlights" (4 cards), a closing "Try Cursor now." at 72px / -2.16px with one centred download pill, and the footer.
- Section padding 67.2px top and bottom, 20px side padding on the section, 1300px content width at 1440.

### Numbers

- Homepage 8,199px tall at 1440 (about 9 viewports); 10,186px at 390. 11 content blocks plus footer.
- /product 8,219px: eyebrow ("Agents") + 36px H1 "Turn ideas into code" + dim subline "Delegate implementation to focus on higher-level direction." + one download pill + the same hero frame; then five groups titled with 26px claims ("Everywhere you work", "Understands your codebase, no matter the size", "Spans the full development lifecycle", "Equipped to do real engineering", "Extend with tools and knowledge"), each a row of 3 or 4 cards with a 16px title, a 16px dim sentence, an orange link and a UI crop.
- /download 2,473px: 26px title "Use Cursor everywhere you work" + dim subline; three cards (Desktop / Terminal / Web) each with a cropped product visual on top, a 16px title, a dim sentence and its own CTA (download pill, a curl box with copy button, a "Start Cursor in Web →" pill); then "The Cursor desktop app is available for macOS, Windows, and Linux." and a version accordion ("3.24 Latest") listing every build per OS.
- /cli 3,247px: eyebrow "CLI", 36px "Ship code with agents", dim subline "Right from your terminal.", then a split card: text + curl box on the left, a painting-backed terminal window on the right; three cards; "Learn more" cards; "Try Cursor CLI." closer.

### Typography, colour, chrome

- One family on the marketing layer: CursorGothic (a custom grotesk), weight 400 everywhere. Hierarchy comes only from size and opacity: 72 (closer), 36 (page H1 on subpages), 26 (home H1, group titles), 22 (feature titles and their sublines), 16 (body, card titles), 14 (nav, footer). Tracking from -0.0125em at 26px to -0.03em at 72px. Berkeley Mono / CursorMono for commands.
- Dark: page #14120B (warm black), card #1B1913, raised #26241E, text #EDECEC, dim text = text at 60% opacity, one accent #F54E00 used only for arrow links. Light: page #F7F7F4. Theme follows the system and can be switched in the footer (three icons: system / light / dark). `data-theme` on `<html>`.
- Pills for buttons, 4px for cards, 10px for product windows. No gradients, no glows. Hairlines at 10% white.
- Header: fixed, 52px, same colour as the page, no border. Logo mark 22x24 plus a wordmark; five 14px links; "Sign in"; two 27px pills ("Contact sales" outlined, "Download" filled).
- Footer: five columns (Product, Resources, Company, Legal, Connect), a legal line with certifications, a theme switch and a language menu. Background #1B1913.
- Motion: no scroll-triggered reveals anywhere (opacity is 1 the moment a section enters the viewport). The motion lives inside the product frames (the scripted run, a spinner, a shimmer) and in the hover state of the logo.

### How Cursor says why

Identity sentence as H1, then the product. Every section title is a claim about what the agent does for you (turns ideas into code, works autonomously, is in every tool, takes work off your hands), one sentence of proof text, and the product doing it. Adjectives are almost absent; the window content carries the argument.

---

## 2. Warp (warp.dev)

Warp has repositioned its homepage around "cloud software factories" (a platform), so the downloadable terminal now lives on /terminal and /download. Both the home page and the terminal page were studied; the terminal page is the relevant model for a product site.

### Home hero

- H1 "Open infrastructure for cloud software factories", 54px / 400 / -2px tracking, in Azeret SemiMono (a semi-mono face), 1132px wide, at y=148 under a 64px white header.
- Subline 16px semi-mono at 62% opacity, one sentence listing three concrete things: "Build on Warp: factories as code, any model or harness, with evals, benchmarks, and self-improvement built in."
- CTAs: "REQUEST EARLY ACCESS" (black, square corners, 40px, mono uppercase 14px/500) and "DOWNLOAD WARP TERMINAL" (outlined). The terminal is the secondary action here.
- Product visual: a "[ fig. 1 · the factory ]" blueprint frame (double hairline border, corner tabs, caption in 10.5px mono) containing a live HTML grid of 8x28 task squares that flicker between queued/working/waiting/shipped with a live counter ("224 TASKS · 43 ACTIVE · 1,422 PRS SHIPPED"). It starts at y=406.
- Behind everything: a dotted-paper background with vertical column rules every 196px and a vertical "WARP · HOME · 2026" rail on both page edges.

### Terminal page hero (the product page)

- Eyebrow in 11px mono uppercase: "BUILD WITH ANY AGENT BUILT IN + [agent name]" where the agent name is a character-reel animation (4.4 s cycle) rotating through Claude Code, Gemini CLI and others with their logos.
- H1 "The terminal, rebuilt for the agent era" (54px semi-mono). Subline, two lines: "Warp turns your terminal into a shared workspace: natural-language commands, agent runs you can watch and steer, and workflows your whole team reuses."
- Instead of a button: an install box `$ brew install --cask warp` with a copy icon, and under it an OS switcher "Mac | Windows | Linux" (the detected OS is bold, the others grey). Switching changes the command.
- Then a logo marquee ("trusted by 800k+ devs at"), then "# DEMO [ONLINE]" with "Warp is now open-source" and a click-to-play talk video in a fig frame, then "# IN THE BOX [ONLINE]" with "Build, review, and ship in one surface": one large product image (two overlapping dark terminal windows on an olive card) with a four-cell feature strip under it (16px/700 titles, 12.5px mono text), then "# SECURITY" with six icon cards, then the footer. Page height 3,061px (3.4 viewports), 4,441px on a phone. Five blocks in total.

### Download page

- 72px light sans "Use Warp everywhere" on the left, a short paragraph on the right.
- Three product cards with coloured backgrounds (lavender, pale green, yellow); each holds a cropped window screenshot that bleeds off the right and bottom, then a 24px title, one sentence and the product's own action: a black "DOWNLOAD " button, a curl box with Mac | Linux | Windows under it, "BOOK A DEMO".
- Then "Warp Terminal is available for macOS, Windows, and Linux." with three columns: Mac (one card "macOS, Version 10.14+" plus the brew command), Linux (.deb / .rpm cards, then rows with x64 / ARM64 chips, .tar.zst, AppImage), Windows (.exe cards, winget command). Page height 2,252px.

### Typography, colour, chrome

- Azeret SemiMono for all display and most body on the home and terminal pages (H1 54px, H2 34px / -2px, sublines 13.5 to 16px at 62% opacity, feature text 12.5px). "theFuture" (geometric grotesk) at 700 for small feature titles (16 to 18px) and the case-study H2. Matter (sans) on the download page. Uppercase mono for eyebrows, nav and buttons (12 to 14px, 0.6px tracking).
- Light only: page #FDFDFD, ink #1A1522, blue #2A1EFF (sticky section bar, chart lines, factory squares, link colour), yellow #EEF17C for "BOOK A DEMO". Buttons are square (0px) when filled, 4px when outlined. No dark mode.
- Header 64px, white, 1px bottom border; while scrolling, a blue sticky bar replaces it with in-page section links that carry keyboard shortcuts ("[C] Configuration [S] SDLC [Q] Quality loop ...") and one CTA.
- Eyebrows above every section: "# CONFIGURATION [ONLINE]", "# SDLC COVERAGE [ONLINE]", "# GOVERNANCE [ONLINE]" in 11px mono uppercase; every product visual sits in a "[ fig. N · name ]" frame.
- Motion: continuous small simulations inside the figures (factory grid, counters, the char reel), a sound toggle bottom left for the videos, no scroll-triggered reveals.
- Footer: five columns in lowercase mono, a status pill ("All Systems Operational"), SOC 2 line, Product Hunt rating.

### How Warp says why

The terminal page says it in one sentence after the headline, listing three things you can do. Section titles are short claims ("Build, review, and ship in one surface", "Designed for security. Built for organizations."). The home page's clearest line is "Control your coding agent chaos" with the subline "Continuous improvement, better governance and security, by default." Proof is a figure with live state next to every claim.

---

## 3. Zed (zed.dev) and Delta (delta.dev)

### Zed holding page (served in rotation on zed.dev)

- A 1132px-high page inside its own scroll container: "Zed Industries" in 25.6px serif, a mono tagline, two product cards side by side (Delta "Est 2026", Zed "Est 2021"), each with a 16px serif name, a two-line mono description, a filled "Download" (Delta red, Zed blue) and an outlined "Learn More". Under them a full-width editor mock, then three open-source projects, then a footer. Dark by default, light via `html.light` (#EEE7E7).

### Zed editor page (the product homepage)

- News bar ("News: Delta is now in public beta. Try it today. →"), then a centred hero: H1 "Your last next editor" in IBM Plex Serif italic, 48px / weight 320, tinted blue-grey (lab(77.5 -6.5 -36.4)); subline 16px in the "writer" face (iA Writer, mono-like), 512px wide: "Zed is a minimal code editor crafted for speed and collaboration with humans and AI."; two buttons: "Download now [D]" (blue, 36px, 4px radius, keycap-style inset shadow `0 -2px 0 0 rgb(5,55,148)` plus `0 1px 3px rgba(0,0,0,.4)`) and "Clone source [C]" (grey keycap, links to GitHub); under them 13px "Available for macOS, Linux, and Windows". The letters in brackets are real keyboard shortcuts.
- Directly under the hero: three bordered cells "Fast / Agentic / Collaborative", 15px serif title + one 13px sentence each (8% hairline between cells, 16px/24px padding). Then the full-width editor mock (DOM, not an image) with a "Watch Demo" chip; it begins at y=640.
- Then a logo row and six testimonials, "Zed Just Works" with two large video cards (460x259) and three small ones (272x153), each with a poster, a 15px serif title, a 13px sentence, "Learn More →" and an "Expand Video" bar; the videos are 12.7 to 25.4 s muted loops at 1528 to 1800 px wide, not autoplaying by attribute (JS-controlled), with an expand-to-full-size control. Then three text-only cells (Remote Development, Multibuffer editing, Vim-friendly).
- Then "Open Source" with contributor avatars and four big counters, "AI that works the way you code" (an accordion of four topics on the left driving a 618x348 video on the right), an extensions grid (20 cards), "Built with ultimate care" (accordion + video + an 8-cell grid of one-line features), a letter from the team, three blog cards, and the closer "Daily drive with Zed / Code at the speed of thought." with the app icon and the same two buttons. Footer on a solid blue band with a giant outlined wordmark. Height 8,206px.

### Zed download page

- Left: app icon. Middle: version "1.25.2" (32px serif), date, "View changelog →", Stable/Preview tabs, then per OS: macOS with an "Apple Silicon" dropdown and a full-width "Download Now", "Requires version 10.15 or later"; Windows the same; Linux as a curl command with copy button and a link to other install methods; terms line. Right: a newsletter card. Height 1,353px.

### Zed features page

- 31,729px: a docs-style catalogue (one 2048x1440 screenshot and a paragraph per feature, an "On this page" sidebar). This is where the long explanation lives, so the homepage can stay a sequence of claims.

### Delta (delta.dev), Zed Industries' app for coding with agents

- Layout: a 240px left sidebar column (logo "delta" in 24px serif, "Now in Beta" in italic, six 11px mono uppercase links with a current-page marker, a light/dark/system switch at the bottom) and a 927px content column; everything is divided by 1px hairlines in #26272B-ish (oklch 0.254). Page background oklch(0.053) (near black), panels oklch(0.159). Light mode exists (warm off-white rgb(249,247,243)) and the product mock re-themes with it.
- Hero panel: a tri-colour bar (red / grey / blue) along the top, an italic serif eyebrow "From the creators of Zed", H1 "Delta brings [collaboration] back to your code" in IBM Plex Serif 48px / 400 / -1.2px where the bracketed word cycles (collaboration, craft, meaning) in italic orange with a collaborator caret and name tag ("nathan", "max") like a multiplayer editor, a two-line mono subline ("Your conversations and code live in one place. Delta anchors every change, so your reasoning lives on with the results."), two 30px mono uppercase buttons with keyboard badges ("DOWNLOAD [D]" filled #B0401F, "LEARN MORE [L]" outlined), and a logo panel on the right. On a phone the download button becomes "OPEN DELTA" (the web app).
- Directly under the hero panel: the full-width product mock (DOM), dark, starting at y=386.
- Then a 2x2 grid: each cell is an 18px serif claim + one 14px mono sentence, with a cropped UI detail below it (real-looking thread and diff crops that bleed to the cell edges, with the irrelevant parts dimmed so the eye lands on the relevant lines). Claims: "Coding with agents is multiplayer", "See how the code came to be", "Review in context", "Take your thread anywhere".
- Then two numbered explainers ("1 Delta, the app", "2 DeltaDB, the version control system") with "LEARN MORE" buttons, a testimonial marquee, three blog cards, a decorative pattern banner with "DOWNLOAD DELTA NOW [D]", and a one-line footer (© Zed Industries 2026 · Terms · Privacy · Brand · Cookies). Height 3,292px (3.7 viewports), 4,382px on a phone. Seven blocks.
- /download: "Download Delta" + "Available for macOS, Linux, Windows, and the web." + app icon; a table "Latest Version: 0.21.0" with one cell per platform (macOS ARM64 ZIP, Linux x64 / ARM64 TAR.GZ, Windows x64 / ARM64 EXE, NixOS flake), a terms line, a newsletter block. 1,040px.
- Motion: the cycling word with carets, a ping dot, the 150 s testimonial marquee. No scroll reveals.

### How Zed and Delta say why

Zed: a witty identity line, one sentence that names three qualities (speed, collaboration, humans and AI), then three one-sentence pillars, then the editor. Delta: a single promise with a rotating noun, one sentence of mechanism ("conversations and code live in one place"), and four claims that each pair with a crop of the thing claimed. Everything above the fold is under 60 words.

---

## 4. Side-by-side

| | Cursor home | Warp terminal | Zed editor | Delta |
|---|---|---|---|---|
| H1 size / weight | 26px / 400 grotesk | 54px / 400 semi-mono | 48px / 320 serif italic | 48px / 400 serif |
| H1 words | 9 | 7 | 4 | 7 |
| Subline | none | 1 sentence, 3 items | 1 sentence | 1 sentence |
| Primary CTA | "Download for macOS ⤓" pill, OS-aware href | brew command + Mac/Windows/Linux switch | "Download now [D]" keycap | "DOWNLOAD [D]" mono |
| Secondary CTA | "Request a demo →" | logo wall below | "Clone source [C]" (GitHub) | "LEARN MORE [L]" |
| Product in first viewport | yes, y=351, HTML mock in a painting frame | yes, y=406, live HTML figure | yes, y=640, HTML mock | yes, y=386, HTML mock |
| Window chrome | macOS traffic lights, 10px radius, hairline ring + 2 shadows | blueprint "fig." frame, square | traffic lights, 1px frame | traffic lights, inside hairline grid |
| Video used | none | click-to-play talk | 12 to 25 s muted loops, poster first, expand control | none |
| Page height (1440) | 8,199px | 3,061px | 8,206px | 3,292px |
| Blocks | 11 + footer | 5 + footer | 11 + footer | 7 + footer |
| Header | fixed 52px, no border | 64px, border, sticky section bar with shortcuts | sticky 57px, hairline | sidebar 240px |
| Dark / light | both, follows system, footer toggle | light only | both, html class | both, sidebar switch |
| Scroll reveals | none | none | none | none |
| Social proof | logos + 6 quotes | logo marquee + case studies | logos + quotes + counters | quote marquee |

Typography systems in one line each:

- Cursor: one grotesk at weight 400, hierarchy by size (72 / 36 / 26 / 22 / 16 / 14) and 60% opacity.
- Warp: semi-mono display at -2px tracking, uppercase mono for labels and buttons, grotesk 700 only for small titles.
- Zed: light serif display (320 to 400), mono-like body at 13 to 16px, keycap buttons.
- Delta: serif display 48 / 18 / 17px, mono body 14px, 11px uppercase mono for navigation and buttons.

Colour systems:

- Cursor dark #14120B / #1B1913 / #26241E, text #EDECEC, accent #F54E00 links only. Light #F7F7F4.
- Warp #FDFDFD, ink #1A1522, blue #2A1EFF, yellow #EEF17C.
- Zed #111216, text grey oklch(0.747), white headings, blue accent (lab(36 31 -81), about #2050E0), hairlines at 14% and 8%.
- Delta near-black oklch(0.053), panels oklch(0.159), hairline oklch(0.254), accent #B0401F / italic #E07A5F, light rgb(249,247,243).

Layout rhythm:

- Cursor: hero (text + full-width frame) → logo strip → four alternating split cards → centred testimonial grid → three-card row → four-card row → split with photo → four-card row → giant closer. Section padding 67px, cards 90px apart. Rhythm by alternation of card width and text side, not by colour.
- Warp terminal: hero → logos → split (text + video figure) → full-width image with a feature strip → six-card grid → footer. Rhythm by figure size.
- Zed editor: hairline-separated bands of unequal height (448, 770, 728, 1115, 450, 567, 755, 809, 586, 579, 450px), each band a different layout (strip, mock, logos + quotes, video grid, counters, accordion + video, grid, letter, cards, closer). Density is high; white space comes from the bands, not from padding.
- Delta: a sidebar plus a column of panels with no outer margins; hero panel → mock → 2x2 crop grid → 2 explainers → marquee → blog → banner. Short and dense.

Mobile:

- Cursor keeps the hero window left-aligned and lets it bleed off the right edge instead of shrinking it; cards stack; the download pill becomes "Get started →".
- Warp stacks the figure frames at full width; the terminal page replaces the brew command with an email capture ("WARP IS A DESKTOP APP, enter your email and we'll send you a download link").
- Zed's holding page stacks the two product cards full-bleed; Delta collapses the sidebar into a top bar with a hamburger and shows the mock cropped to its left part; the download button becomes "OPEN DELTA".
- None of them shows a horizontal scroll; all keep 16 to 24px side gutters.

---

## 5. What they put on subpages

- Cursor: the homepage shows four outcome claims; /product holds the full catalogue (five groups, 17 cards, 8,219px); /download holds the surfaces and the build matrix; /cli, /enterprise, /pricing are their own pages. The home never lists features.
- Warp: the home is the platform story; the terminal has its own page (five blocks); /download holds every package and command per OS; use cases and industries each get a page.
- Zed: the homepage is claims + videos; /features is the 31,729px catalogue; /download is version, date, changelog link, per-OS rows.
- Delta: a seven-block home; /docs for everything else; /download is a platform table.

Common rule: the homepage carries claims and proof footage; every list (features, builds, requirements, FAQ) is one click away on a page whose title says what it is.

---

## 6. How they say why in few words (formulas)

1. Identity line + the product: "Cursor is your coding agent for building ambitious software." / "Zed is a minimal code editor crafted for speed and collaboration with humans and AI." (second one is the subline under a 4-word H1).
2. Category reframe: "The terminal, rebuilt for the agent era." / "Open infrastructure for cloud software factories."
3. Promise with a mechanism sentence: "Delta brings collaboration back to your code." + "Your conversations and code live in one place. Delta anchors every change, so your reasoning lives on with the results."
4. Section claims are 3 to 6 words, verb-led or noun-led, and each is paired with the UI doing it: "Works autonomously, runs in parallel", "Review in context", "Build, review, and ship in one surface", "Control your coding agent chaos".
5. One sentence of proof text per claim, never a paragraph. The subline lists two or three concrete things ("natural-language commands, agent runs you can watch and steer, and workflows your whole team reuses").
6. Closers are two to four words plus one button: "Try Cursor now.", "Daily drive with Zed", "DOWNLOAD DELTA NOW".
7. Adjectives are rare; nouns and verbs carry the claim; the footage is the adjective.
8. Numbers appear only where they are facts about the artefact (version, date, OS, requirements) or social proof (which IVE must not use).

---

## 7. Transferable patterns for IVE (13)

1. Claim, one sentence, footage. Every homepage section is a 3 to 6 word claim, one sentence of proof, and the real app doing it. For IVE: "Four agents. One board." + "Every session, its status and its question, in one place." + the real board recording. No section without a recording or a crop of the real app.

2. Headline small, product big. Cursor's home H1 is 26px and the product frame is 1300x720 in the first viewport. After IVE's intro has done its work, the hero should hand over to the real board at full content width within the same viewport: headline, one sentence, "Download for Mac", and the board.mp4 starting no lower than about 400px under the header.

3. Make the intro land on the product. None of the four has a scroll intro, but all four put the product at y=350 to 640. The intro's illustrated mission-control board (where the cards land under "Under control.") can crossfade into the real board recording in the same window frame, so the opening becomes the hero instead of preceding it. Tighten the intro so that headline + CTA + real board are reached within about two viewports of scroll.

4. One window frame for all footage. Cursor's window: 10px radius, `0 0 0 1px rgba(255,255,255,.1)` ring, `0 28px 70px rgba(0,0,0,.14)` and `0 14px 32px rgba(0,0,0,.1)` shadows, title bar with the app name. IVE should define one such frame (DESIGN.md allows no fake macOS chrome, so use the app's own top bar as the "chrome", with the project name as the title) and use it for all five recordings and every crop. Because the IVE recordings are light on a dark page, the ring and the shadow matter more than on Cursor; the light window should read as a lit screen in the dark room, not as a white rectangle.

5. Crops that bleed. Cursor's split cards and Delta's 2x2 grid crop the window at the card edge and dim the irrelevant parts. For IVE's detail sections (the permission dialog in the board, "Reply ready" in a session, the review diff), crop the 3200x2000 recordings to the relevant region at 2x and let the crop run off the card edge. The recorder in `scripts/demos/` can produce these crops.

6. Alternate the composition, not the message. Cursor's four cards alternate text left/right; Zed's bands each use a different layout (strip, mock, video grid, accordion + video, counters, letter). For IVE's 5 to 7 sections: full-bleed board (hero), 2x2 claim + crop grid (orchestration), split text + session recording (attention and questions), accordion driving one recording (review: compare files, open issues, decide), a quiet closer. No two consecutive sections with the same shape.

7. Posters first, loops short, one expand control. Zed's feature videos are 12 to 25 s muted loops behind a poster, not autoplaying by attribute, each with "Expand Video". IVE's clips (13.5 to 19.4 s) already match; keep the poster-then-play behaviour from showcase.js, play only the visible one, and give every recording the same expand control and the same provenance line.

8. The install moment as a terminal box with an OS switch. Warp's `$ brew install --cask warp` box with a copy icon and "Mac | Windows | Linux" under it, where the detected OS is bold. For IVE: "Download for Mac" as the primary button (OS-aware, as Cursor's href is), and the curl line in exactly this box for "Linux, Intel Macs and developers", with the OS switch replacing the current prose.

9. A download page that is a table, not a story. Zed's /download (1,353px): icon, version (IVE must not show one), date, changelog link, per-OS rows with requirements under the button, curl for Linux, terms line. Delta's platform table. IVE's install section can become /install with the Mac app row (Apple silicon, macOS 13.5+, signed and notarized), the curl row with requirements, and the clone row, nothing else.

10. Dim subline at the same size as the title. Cursor sets title and subline both at 22px and separates them with 60% opacity; Zed uses grey 13px under a 15px white title. One weight, hierarchy by opacity. This is a cheap way to make IVE's sections feel calmer than headline + bold + paragraph.

11. Header at 52 to 57px with the mark no taller than 24px. Cursor 22x24 mark, Zed 24px, Delta 24px, Warp 22px. IVE's 28px header mark is already in range; the big IVE lettering belongs to the intro only. Cursor and Zed also keep the header the same colour as the page with no border (Cursor) or a 14% hairline (Zed).

12. Keycap-sized actions with real shortcuts. Zed and Delta put a keyboard letter in the button ("Download now [D]"). IVE should not copy the badge, but the principle transfers: buttons name the action precisely ("Download for Mac", "Read the install script", "View on GitHub") at 32 to 36px height, 4 to 6px radius, no pills.

13. No scroll-triggered reveals. All four sites have opacity 1 the instant a section enters the viewport; motion lives inside the product (Cursor's scripted run, Warp's factory grid, Delta's cycling word). For IVE: keep the signature intro and the WHY IVE moment, let the recordings be the motion, and remove fade-ins, slide-ins, merge lines and sharpen sequences that do not show the product.

Two more, specific to content:

14. Three pillars under the hero. Zed's "Fast / Agentic / Collaborative" strip: three 15px titles, one 13px sentence each, hairlines between, directly under the H1. For IVE: "Parallel", "In view", "Yours" (runs on your machine) as a one-line strip; it answers "why" before the first scroll.

15. One quiet closer. Cursor's "Try Cursor now." at 72px with a single button, Zed's app icon + "Daily drive with Zed" + two buttons. IVE's closer: the mark, one line, "Download for Mac", the curl box. The AIFOREU film only if it is shorter than this closer and sits after it.

---

## 8. Five things not to copy

1. Social proof of any kind: Cursor's logo wall and six executive quotes, Warp's "trusted by 800k+ devs" marquee and case studies, Zed's testimonials and the four counters (forks, stars, contributors, PRs), Delta's "Words from early adopters". IVE must show none of this, and must not replace it with invented numbers. The IVE equivalent of proof is the recording.

2. Decorative stages and brand theatre: Cursor's landscape paintings behind every window, Warp's dotted paper with "fig." frames and the shouty uppercase mono everywhere, Zed's blue footer band with the giant outlined wordmark, Delta's pattern banner. They would read as borrowed, and DESIGN.md already bans decorative imagery, cards for everything and "looking like Cursor, Linear, Zed, Raycast, or Warp". Take the structure (frame, crop, strip), not the costume.

3. Sales and growth furniture: "Request a demo", "Book a demo", "Contact sales", newsletter cards, email capture on mobile (Warp), news bars, changelog and blog grids, cookie banners that cover the product frame. IVE is open source with no sales motion and no backend; the mobile fallback stays "Install IVE → #install", not an email form.

4. Version and build matrices on the homepage: Cursor's "3.24 Latest" accordion with 13 builds, Warp's x64 / ARM64 chips, Delta's "Latest Version: 0.21.0" table. The README forbids a version number or file size for the Mac app, and IVE has exactly three paths (Mac app, curl, clone). Keep the install section to those three rows.

5. Pill buttons, keycap badges and A/B homepages: Cursor's 9999px pills (DESIGN.md: nothing pill-shaped), Zed's and Delta's keyboard badges inside marketing buttons (they imply web-app chrome), and Zed's rotation between two different homepages (confusing, untestable). IVE keeps 6px buttons with plain labels and one homepage.

---

## 9. Open questions for the build

- Does the IVE app have a dark theme? If yes, record the five clips in both themes with `scripts/demos/record.mjs` and swap the source with the site theme (Cursor's and Delta's mocks re-theme with the page; a light-only recording on a dark-first site needs the strong frame from pattern 4 instead).
- Which crops exist in the recordings: the permission dialog ("Allow once / Don't allow") in board.mp4, "Reply ready" in session.mp4, "FILES CHANGED" and the "Review →" button in review-full.webp, the model menu in setup.mp4. These are the four candidates for a Delta-style 2x2 claim + crop grid and for the Zed-style accordion in the review section.
- Scroll budget: the four references put the product at 350 to 640px. Decide how many viewports the intro may take before the real board is on screen, and measure the current intro against it.
