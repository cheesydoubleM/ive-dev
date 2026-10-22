# 03 · Linear, Raycast, Vercel: how polished product sites stage real UI

Research for the ive.dev redesign. Visited on 2026-10-22 with headless Chromium
(Playwright 1.62.1), desktop 1440x900 and iPhone 13 emulation (390x844, DPR 2),
dark color scheme unless noted. Values come from `getComputedStyle`, element
rectangles and stylesheet counts, not from eyeballing. Screenshots and raw JSON
are listed in section 9.

Pages studied: linear.app (home), linear.app/build (feature page "Build"),
linear.app/changelog (the "Now" feed), linear.app/method, raycast.com (home),
vercel.com (home), plus light-scheme, reduced-motion and hover checks on all
three homes.

Two caveats before the findings:

- All three sites lean on social proof (logo strips, quote cards, counts). IVE's
  README forbids those. Where a reference structure depends on proof-by-numbers,
  the IVE version has to replace it with proof-by-footage (the real recordings).
- `DESIGN.md` still lists "Looking like Cursor, Linear, Zed, Raycast, or Warp" as
  a hard ban, while the owner's brief asks for a redesign in the spirit of Cursor
  and Linear. The rule should be reworded during the redesign: borrow the
  discipline (one idea per screen, hairlines, cropped real UI, tiny copy), keep
  IVE's own identity (Archivo, IVE blue, the opening animation).

---

## 1. Measured snapshot

| | Linear home | Linear /build | Raycast home | Vercel home |
|---|---|---|---|---|
| Page height at 1440 | 9,960 px (11 screens) | 15,295 px (17) | 15,983 px (17.8) | 5,930 px (6.6; 5,333 in a second run, lazy content varies) |
| Blocks above the footer | 8 | 10 | 12 | 6 |
| Words in `main` | ~1,320 | ~860 | ~1,750 | ~110 (all other text lives inside the screenshots) |
| Page background | `#08090a` | `#08090a` | `#07080a` | `#000000` |
| Panel surface | `#0f1011` (`--color-bg-panel`), `#1c1c1f` | same | `#101111`, `#18191a` | `#0a0a0a` (`hsl 0 0% 4%`) |
| Hairline | `rgba(255,255,255,.08)` (most used), solid `#23252a` | same | `rgba(255,255,255,.06)`, solid `#242728` | shadow border `0 0 0 1px #ffffff25` |
| Text steps | `#f7f8f8` / `#d0d6e0` / `#8a8f98` / `#62666d` | same | `#f4f4f6` / `#c2c7ca` / `#78787c` / `#5e6366` | `#ededed` / `#a1a1a1` / `hsl 0 0% 63%` |
| Accent on the marketing page | none (brand indigo `#5e6ad2` only inside product shots, focus ring, selection) | none | red `#ff6161` (logo, one eyebrow, hero art) | none (blue only in one card illustration and the footer status) |
| Primary button | pill 9999px, `#e5e5e6` on `#08090a`, 13/510 at 32px high (nav), 16/510 at 44px (closing); hover `#fff`, 0.16s | same | 8px radius, `#e6e6e6` text `#2f3031`, 14/500, 36px, Apple glyph, ring `0 0 0 2px rgba(0,0,0,.5)` + `0 0 14px rgba(255,255,255,.19)`; hover `#fff`, 0.2s | 6px radius in nav (32px, 14/500), pill in hero (40px, 16/500), `#ededed` on `#0a0a0a`; hover `#cccccc`, 0.15s `cubic-bezier(.4,0,.2,1)` |
| Type families | Inter Variable + Berkeley Mono (+ Tiempos Headline on /method) | same | Inter + Geist Mono + JetBrains Mono (+ Instrument Serif, VT323 loaded) | Geist Sans + Geist Mono (+ Geist Pixel variants) |
| H1 | 64px / 510 / lh 1.0 / -0.022em | 72px / 500 / 1.0 / -0.022em | 64px / 600 / 1.1 / 0 | 64px / 400 / 1.0 / -0.06em (-3.84px) |
| H2 | 48px / 510 / 1.0 / -0.022em; closing 72px | 48px | 20px / 500 (white) + 20px gray subline; 32px (AI); 56px / 400 (API) | 56px / 450 / 1.0 / -0.06em |
| Lead paragraph | 24px / 400 / 1.33 / -0.012em, `#d0d6e0`, max 566px | same | 20px / 500, `#6a6b6c` | 24px / 450 / 1.33 / -0.04em, `#a1a1a1`, white emphasis span |
| Body | 15px / 1.6, `#8a8f98` | 15px | 16px / 1.6 | 14px / 20px, `#a1a1a1` |
| Mono used for | logo-strip eyebrow (12px uppercase, `#62666d`), changelog dates, "FIG 0.1" labels | eyebrow | requirements line, install alternatives, "AI AGENT" eyebrow, "FIG_01" labels, the whole API section | footer status "ALL SYSTEMS NORMAL." |
| Header | fixed, 72px + 1px border, transparent + `blur(20px)`, border `rgba(255,255,255,.08)`; logo 104x32 | same | floating bar 1204x76 at 16px inset, radius 16px, gradient glass `rgba(17,18,20,.75)` to `rgba(12,13,15,.9)`, `blur(5px)`, 1px `rgba(255,255,255,.06)`, inset top highlight; logo icon + 16px wordmark | sticky 64px, solid `#000` once scrolled, no blur; triangle mark only (20px), dropdown menus |
| Nav link hover | `#8a8f98` to `#f7f8f8` in 0.1s | same | (buttons, not measured) | (dropdown buttons) |
| Footer | 494px, 5 columns, 42 links, border-top `#23252a`, mark only, legal row | same | ~900px, 6 columns + newsletter + red art bleed | 846px, 12 columns, 81 links, status line + theme switch |
| Light mode | forced dark (`data-theme="dark"` even with light OS setting) | forced dark | dark only | follows the OS: `light-theme`, page `#fafafa`, buttons invert to `#0a0a0a`; 3-state switch in the footer |
| Videos | 0 (images only) | 1 autoplay muted loop WebM hero background at 60% opacity | 0 (53 images, 1 canvas hero) | 0 (2 canvases: hero glow 1080x720, one bento illustration) |
| Stylesheet motion facts | 230 keyframes, 42 reduced-motion blocks, 40 mask-image rules, 17 backdrop-filter, 1 `animation-timeline` | same sheets | 59 keyframes, 7 reduced-motion, 85 mask-image, 52 backdrop-filter, 2 `animation-timeline`, 3 scroll-snap carousels | 66 keyframes, 14 reduced-motion, 3 mask-image, 1 view-transition |
| Sticky scroll sections | none (header only) | none | none | none (header + the AI aside) |

Container widths: Linear `--homepage-max-width: 1344px + 2*46px`, page padding
24px, chapters padded 128px top and bottom, lead column starts at x=752 (column 7
of 12). Raycast content 1204px wide with 118px side margins at 1440. Vercel
content 1392px (24px gutters), 12 columns, section gap `mt-40` to `mt-52`
(160 to 208px).

---

## 2. Linear

### 2.1 Home: what is on the page (top to bottom, measured y)

1. **Hero, 0 to 1,295.** H1 on two lines at 64px across the whole container
   (1,282px wide, no max-width, natural wrap). One 15px gray line below
   ("Purpose-built for planning and building products. Designed for the AI
   era."), a right-aligned "New · Loops →" note, no button in the hero at all
   (the pill lives in the header). The product shot starts at y=491 and is
   804px tall, so at a 900px viewport 409px of it (51 percent) are visible: the
   fold cuts the window on purpose.
2. **Logo strip, 1,296 to 1,580.** Seven wordmarks, then the mono eyebrow
   "POWERING THE COMPANIES BUILDING THE FUTURE".
3. **Thesis + three figures, 1,596 to 2,546.** One 48px sentence in two tones
   (white first clause "A new species of product tool.", gray rest), then three
   columns divided by hairlines: wireframe isometric drawings labelled
   "FIG 0.1 / 0.2 / 0.3", a 15px white title, a 15px gray sentence.
4. to 7. **Four chapters, each 1,220 to 1,232px tall.** Intake and
   integrations / Planning and monitoring / AI and automations / Build, review,
   and ship. Identical grammar: H2 48px on two lines in the left five columns
   (542px); 24px lead sentence in the right half (566px) plus "Learn more →";
   then one full-width composition about 700px tall; then a "Features" row
   (label left, two columns of items with "+" expanders, e.g. "Projects +,
   Pulse +, Visual planning + / Documents +, Initiatives +, Insights +").
8. **Changelog, 7,644 to 8,226.** H2 48px, four cards on a timeline rule with
   dots, 16px titles, 15px gray excerpts clamped to two lines, mono dates,
   "View all →".
9. **Two quote cards, 8,226 to 8,790.** Light blue gradient and acid yellow:
   the only bright surfaces on the page. One line of proof ("Linear powers over
   40,000 product teams") with "Customer stories →".
10. **Closing, 9,014.** "Built for the future. Available today." at 72px,
    centered, two pill buttons, nothing else. Footer.

Count of marketing sentences on the whole home: one H1, one subline, one thesis,
four chapter leads, three figure captions, one closing. Everything else is
product content inside the shots.

### 2.2 How Linear stages the real UI

- **Hero shot = one image, frame included.** The 1440px-wide `<img>` (served at
  2560px from the CDN) already contains the app window, its 1px edge, rounded
  corners and the soft light falloff above it. No CSS border, no box-shadow, no
  layered DOM. The wrapper is 768px tall with `overflow: hidden` and a 6px
  radius, so the window is clipped at the bottom and reads as "continuing below
  the fold".
- **Chapter compositions are layered crops, not screenshots.** Intake uses 10
  images, AI 4, Build 15: overlapping panels placed over each other (a Slack
  thread card on top of a Kanban board that bleeds off the right edge; a Gantt
  timeline beside a "Cycle time by agent" chart; a code diff panel over an
  issue list). Panels are `#0f1011` with a 1px `rgba(255,255,255,.08)` line, no
  window chrome, edges faded into the page with `mask-image` (40 such rules).
  Different image sets are served for laptop and desktop widths (`hide-laptop`
  classes): the crops are art-directed per breakpoint.
- **Reveal behaviour.** Jumping straight to 40 percent of the page shows the
  full layout at 0ms; after 1.5s the chart dots have been drawn in. Only the
  illustration plays when it enters the viewport; no section fades in, nothing
  is hidden until scrolled to. Hover is 100 to 160ms.
- **/build (feature page).** Hero: 16px eyebrow "Build, review and ship", 72px
  H1 on two lines, over a blurred, muted, looping code video at 60 percent
  opacity (the only autoplay video on the site). Then the chapter grammar from
  the home repeated seven times with more depth: two-column intro (H2 48px,
  24px lead, one "+" expander), then a 1,344px frame (`overflow: hidden`,
  96px top padding) holding a 1,232x704 app shot in a `#0f1011` panel with an
  8px radius on the top-left corner only, lit by a soft gradient from above and
  cut at the bottom; inside the frame a caption (15px white title + 15px gray
  sentence, 624px max). Below that, 2x2 grids of 672x424 crops, cells divided
  by shared hairlines, same caption pattern. One "stacked windows" set: three
  Cycle cards 560px wide, offset 280px, 12px top radius, shadow
  `0 4px 12px rgba(0,0,0,.15)`, each cut at the bottom. The integration trio
  (Claude Code, ChatGPT, Figma) sits on bright colored cards (terracotta,
  lavender, white). This page is as long as Raycast's home (15,295px) with
  about 860 words: it carries the detail so the home can stay short.
- **/changelog ("Now").** H1 "Now" 48px, filter tabs (All, Changelog, Product
  launches, From the team, From the community, Press), a date rail on the left
  (dot + vertical line), a 624px prose column at 17px/1.6 `#d0d6e0`, H2
  32px/590, H3 24px/590. Media are 622x350 in 8px frames with a 1px
  `rgba(255,255,255,.05)` border; videos are click-to-play with custom
  controls, no autoplay. The feed is 25,000px long because it is a feed.
- **/method.** A magazine register: serif display (Tiempos Headline, about
  128px) centered under a small uppercase eyebrow, a dotted Venn illustration,
  and a numbered table of contents. Same header and footer shell as everywhere
  else, which is what makes the register switch safe.

### 2.3 How Linear says why

- Hero formula: category + audience. "The product development system for
  teams and agents." Subline: purpose + era.
- Chapter titles are two- or three-word noun pairs ("Planning and
  monitoring"); the lead sentence names the outcome in one breath
  ("Automatically turn conversations and customer feedback into actionable
  issues that are instantly routed, labeled, and prioritized for the right
  team.").
- Feature cards on /build: short bold claim + one sentence ("Go from issue to
  code instantly. Open any issue directly in your AI coding tool of choice
  preloaded with full context and a custom prompt.").
- The screenshots do the claiming. The hero shot shows an agent run inside an
  issue: "Linear connected by Jori · Changed 2 files · Draft PR awaiting your
  review · moved from Todo to In Progress". The demo content is scripted to
  make the pitch, so the copy does not have to.

---

## 3. Raycast

### 3.1 Home: structure (15,983px, 12 blocks)

1. **Hero, full viewport.** A 1200x967 canvas with red and black light streaks,
   centered H1 64px/600 "Your shortcut to everything.", 18px subline on two
   lines, "Download for Mac" with Apple glyph, then in 13px mono gray:
   "macOS Tahoe and Apple Silicon required" and "Install via Homebrew |
   Download V1".
2. **Product showcase.** "Take shortcuts, not detours." (20px white) + "One
   interface, everything you need." (20px gray). A 1,300x733 macOS desktop
   shot (menu bar visible, launcher centered) in a 12px frame with a 1px
   `rgba(255,255,255,.08)` border and an inset 0.5px white highlight. Under the
   frame a dock of five rounded icon buttons (Clipboard History, AI, Emoji,
   Calculator, Window) that swap the shot, and one caption line ("Remember
   Everything. Stop playing Clipboard ping pong ..."). This is a tabbed
   showcase, the same device as IVE's "Inside IVE".
3. **Values.** "It's not about saving time." + "It's about feeling like you're
   never wasting it." + Download. On the right, four small cards over a faded
   keyboard drawing: "Fast. Think in milliseconds." "Ergonomic. Keyboard
   First." "Personal. Your tools, your way." "Reliable. 99.8% crash-free rate."
4. **Extensions.** "There's an extension for that." + category tabs
   (Productivity, Engineering, Design, Writing) + a scroll-snap carousel of
   360x360 colored cards with 20px radius, inset highlight and big soft shadows
   (`0 30px 50px rgba(0,0,0,.4)`), "Browse thousands more →".
5. **AI.** Red mono eyebrow "AI AGENT", H2 32px "Meet your new virtual
   assistant", two-line gray subline, a product window with macOS traffic
   lights (fake chrome) in a 1,000px frame, three cards (AI Chat, Quick AI, AI
   Extensions), "Learn more about Raycast AI →".
6. **Testimonials.** Three people in a carousel, a "Favorite Feature / Top
   Extension" table, one quote with white emphasis.
7. **Automation bento.** "Don't repeat yourself." Snippets (wide card with a
   blue glass render), Quicklinks, Hotkeys and Aliases (keycap drawing).
8. **"What else can Raycast do? It can take notes."** followed by a long gray
   run-on list sentence; a stack of nine 633x633 Notes images rotating in a
   16px frame on the right.
9. **Community.** Slack and X cards with counts, a row of YouTube thumbnails.
10. **API.** "Build the perfect tools." at 56px/400 inside a blueprint: dotted
    paper, hairline grid, isometric line drawings in blue labelled FIG_01 to
    FIG_06, body set in mono, four features in grid cells.
11. **Closing.** "Take the short way." + "Download and use Raycast for free." +
    Download for Mac + the same mono requirement lines, red art bleeding up
    from the footer.
12. **Footer.** Six columns plus newsletter.

### 3.2 Staging and surface

- Everything is an image (53), no video. Frames: 12 / 16 / 20px radius, 1px
  line at 6 to 8 percent white, inset top highlight (`0 0.5px 0 rgba(255,255,255,.1)`
  to `.25`), large soft shadows on carousel cards, a faint colored glow per card
  (`rgba(7,13,79,.1) 0 0 20px 3px`).
- Glass everywhere: 52 backdrop-filter rules; 85 mask-image rules fade the
  carousels and the art into the page.
- The signature headline device: every section title is a pair, "white
  statement." then "gray explanation.", both 20px/500 (an H2 and a paragraph).
  The page can be read by skimming the white halves only.
- Mono for machine facts: requirements, install alternatives, eyebrows, figure
  labels, the whole developer section.
- Brand texture: the red streak render returns in the hero, the Snippets card,
  the closing and the footer.
- Fake chrome appears in the AI window (traffic lights) but not in the main
  launcher shot, where the real menu bar is part of the "desktop" context.
- Mobile: the floating nav keeps its rounded shape with a hamburger; the
  launcher shot becomes a square crop of the emoji picker, cut on the right;
  value cards stack over the keyboard drawing; the statement pairs stay.

### 3.3 How Raycast says why

- Hero: possessive + metaphor ("Your shortcut to everything.") + a description
  sentence ("A collection of powerful productivity tools all within an
  extendable launcher. Fast, ergonomic and reliable.").
- Benefit as a feeling, not a metric: "It's not about saving time. It's about
  feeling like you're never wasting it." Then four one-word values with
  three-word proofs.
- Section titles are three to five words, often imperative or idiomatic
  ("Don't repeat yourself.", "Stay in the loop.", "Take the short way.").
- The Download CTA appears four times (nav, hero, values, closing), always with
  the requirement line beneath it.

---

## 4. Vercel

### 4.1 Home: structure (5,930px, 6 blocks)

1. **Hero, full height minus header (836px).** H1 "Agentic Infrastructure"
   64px/400/-0.06em on the left; a glowing black triangle (canvas 1080x720) in
   the center; three 16px lines on the right ("For coding agents / To ship apps
   and agents / Automated by agents"); two pill buttons under the H1; the logo
   row sits exactly at the bottom edge of the first screen.
2. to 4. **Three customer sections, about 870px each.** 56px H2 on two lines, a
   921px-wide customer app screenshot (WebP, no CSS frame, its own 1px edge,
   cut at the bottom), alternating left and right; in the remaining column a
   24px proof sentence with the first clause in white ("Notion powers millions
   of agent conversations daily on Vercel."), then a "Features" label and four
   two-word links. A faint radial light sits behind each screenshot.
5. **"Recently shipped".** Bento of three cards (a tall 2-column "Backends",
   then "Agents" and "Sandbox"), 8px radius, 1px line via shadow, 24px titles,
   14px gray text, one small illustration per card.
6. **Closing.** "Built by you, or your agents" at 56px centered, "Deploy now"
   pill, and "Onboard your agent" (three agent icons + copy icon: it copies a
   command to the clipboard).
7. **Footer.** Twelve columns, 81 links, "ALL SYSTEMS NORMAL." in blue mono and
   a three-state theme switch.

### 4.2 Staging and surface

- Screenshots are flat and large (921px), no CSS frame, cropped at the bottom
  by overflow; the light comes from a radial gradient behind, not a shadow.
  The screenshot is the proof, the headline is a verb phrase.
- Theme: system-aware. Light = `#fafafa` page, identical layout, black
  buttons, the triangle glow inverts to a white halo on white. Dark = pure
  `#000` with `#0a0a0a` surfaces and 15 percent white hairlines.
- Motion: minimal. Hover 0.15s, one view-transition rule, no scroll
  choreography on the home. The header turns solid black when scrolled.
- Mobile: single column, H1 at the same 64px, "Deploy now" full-width pill,
  screenshots cropped to a square-ish window, proof sentence stays at 24px,
  bento cards stack.

### 4.3 How Vercel says why

- Two-word hero. Three audience lines instead of a paragraph.
- Section H2s are verb + object + outcome in six to eight words ("Build agents
  on infrastructure that thinks like them", "Ship apps that scale from zero to
  millions instantly", "Host platforms that serve every customer").
- Proof sentences carry one number each; feature lists are two-word nouns.
- Closing adds a CTA for machines: "Onboard your agent" copies a command.

---

## 5. Cross-cutting patterns

1. **One idea per screen.** None of the three ever puts two messages in one
   viewport. A chapter is: title, one sentence, one picture, one link.
2. **Hierarchy by color, not size.** Body stays at 14 to 16px; hierarchy comes
   from four text steps (Linear `#f7f8f8` / `#d0d6e0` / `#8a8f98` / `#62666d`).
   White means "read this", gray means "if you want".
3. **Hairline discipline.** 1px lines at 6 to 15 percent white; surfaces one
   step lighter than the page (`#0f1011` on `#08090a`, `#0a0a0a` on `#000`,
   `#101111` on `#07080a`). No glow except Raycast's brand art and its button
   ring.
4. **Buttons are light, not accent-colored.** All three primary buttons are
   near-white on dark; the brand color stays inside the product shots. IVE's
   blue CTA is the opposite choice; it can stay, but then blue must appear
   nowhere else on the page except running states.
5. **The crop is the composition.** Product UI is shown large and cut: Linear's
   hero is 51 percent visible at the fold; Vercel's screenshots end in overflow;
   Linear's /build panels are cut at the bottom; Raycast crops the launcher on
   mobile. A whole window with margins around it never appears.
6. **Mono for machine facts.** Eyebrows, dates, requirements, commands, figure
   labels. IVE already does this with IBM Plex Mono.
7. **Motion lives inside the frames, not on the page.** No section fade-ins,
   no sticky stacks, no scroll-jacking on any of the three homes. Things move
   inside an illustration when it enters view; hovers are 100 to 200ms;
   reduced-motion is honored (Linear ships 42 such blocks).
8. **Signature moment, then calm.** Raycast: a continuous canvas art hero, then
   a still product shot. Vercel: a glowing canvas object, then flat
   screenshots. Linear /build: a video hero at 60 percent opacity, then still
   compositions. The signature moment is confined to the first screen; below
   it the page is static. Linear's home has no signature animation at all; the
   product shot is the hero.
9. **Subpage strategy.** Home = chapters with "Learn more". Feature page = the
   same chapter grammar expanded into 2x2 crop grids (and 15,000px of length).
   Changelog = date rail + prose + click-to-play media. Method = a different
   typographic register. The header and footer never change, so registers can.
10. **Mobile keeps the desktop crops.** Single column, headlines barely smaller,
    product shots keep their crop and bleed off the right edge rather than
    shrinking to a thumbnail.
11. **Display type is light and tight.** Headlines sit at weight 400 to 510
    with tracking -0.022em (Linear) to -0.06em (Vercel), line-height 1.0.
    IVE's rule (Archivo at 620, 125 percent width, -0.045em) is heavier and
    wider than all three; worth a side-by-side before the build.
12. **The demo content carries the pitch.** Linear's hero issue shows an agent
    opening a draft PR; Vercel shows customer apps; Raycast's launcher shows a
    clipboard full of real-looking entries. The copy stays short because the
    picture already argues.

---

## 6. Transferable patterns for IVE

Fifteen concrete moves, each with the measured values to start from.

1. **Fold composition for the hero.** H1 + one line + CTA row inside the first
   430px, then the real board recording starting around y=490 and running off
   the fold (show 45 to 55 percent of it). Use the existing `board.webp` poster
   or `board.mp4` in a wrapper with `overflow: hidden`, 6 to 8px radius, no CSS
   shadow; put the light falloff into the poster or one radial gradient behind
   the frame (Vercel style), nothing else.
2. **Chapter grammar, one chapter per "why".** Two-column intro (H2 32 to 46px
   on the left five columns, lead 20 to 24px in the right half in the secondary
   text color, one link), then one composition, then nothing. 128px vertical
   padding. At most five chapters: parallel work (productivity), the board
   (control), questions and approvals (nothing waits unseen), review in one
   place, your own machine.
3. **Layered crops instead of full windows.** Cut the real recordings into two
   or three panels per chapter (a session card overlapping the board; the
   review diff over the session list), let one panel bleed off an edge, fade the
   other edge with a mask. Captions inside the frame: 15px white title + 15px
   gray sentence, max 624px. The recorder in `scripts/demos/` can produce the
   crops; keep the "demonstration content" label.
4. **A 2x2 crop grid on the feature subpage, not the home.** 672x424 crops
   divided by shared hairlines, each with the caption pattern. This is where
   the allowed totals (40+ shortcuts, 35+ MCP tools, 4 memory types, the
   package scan) belong.
5. **Statement pairs for the Why IVE answers (Raycast).** "White statement.
   gray explanation." at equal size. The scroll-driven question stays; each
   answer becomes skimmable in one glance, e.g. "Four agents, one screen." +
   "Every session is a card you can open."
6. **Verb-first H2 formulas (Vercel).** Six to eight words, no adjectives:
   "Run four agents, watch one board", "Answer every question in one place",
   "Review every change before it lands", "Keep everything on your machine".
7. **Two-word hero plus three audience lines (Vercel) as an alternative to a
   paragraph.** For example "Agents under control" with "Claude Code / Codex /
   Gemini CLI" or three truthful situations ("A refactor across four
   services", "A night of parallel bug fixes", "A review queue you can clear").
8. **Requirements line in mono under the Mac download (Raycast).** "Apple
   silicon · macOS 13.5 or newer · one signed-in coding CLI", then
   "Install with curl | Clone from GitHub" as mono links. Repeat the download
   CTA at the hero, after the recordings and at the close; three copies, not
   more.
9. **A machine-facing secondary CTA (Vercel's "Onboard your agent").** A
   button that copies `curl -fsSL https://ive.dev/install.sh | bash` with a
   copy icon, next to "Download for Mac". IVE already has the panel; the
   button form is lighter.
10. **Header like Linear, smaller mark.** 64 to 72px tall, wordmark 28 to 32px
    high (Linear's is 104x32), links 13 to 14px in the dim text color turning
    to full text on hover in 100ms, blur only while content scrolls under, one
    light pill or 6px button "Download for Mac", GitHub icon. This answers the
    owner's "too big and dominant" note without touching the mark itself.
11. **Token discipline.** Four text steps, three background levels (page, panel
    +1, raised +2), one hairline (white at 8 percent in dark, black at 8
    percent in light), one accent (IVE blue) reserved for running states and
    the primary CTA. The current `--text / --text-dim / --text-faint` set is
    one step short of Linear's four.
12. **Motion budget.** The opening animation (kept), motion inside the
    recordings, 100 to 200ms hovers, and nothing else: no section fade-ins, no
    sticky stacks. Mirror the reference sites' reduced-motion care (expanded
    final states, no autoplay).
13. **Light mode as a pure inversion (Vercel).** Same layout, page `#F4F5F6`
    or `#fafafa`, black or blue buttons, hairlines flip to black at 8 percent.
    The opening animation keeps its black room in both themes, exactly like
    Vercel's hero object keeps its glow in both.
14. **A "Now" page later, not now.** Date rail + 624px prose + 8px-radius
    click-to-play media is the cheapest way to show the product moving without
    adding to the home.
15. **Closing like Linear.** A 56 to 72px two-line statement, two buttons,
    nothing else: "Many agents. One board. Your machine." then "Download for
    Mac" and "View on GitHub".

---

## 7. What would feel fake or oversized for IVE

- **Proof by numbers.** Logo strips, quote cards, "40,000 teams", "99.8%
  crash-free", community member counts, testimonial carousels. All three sites
  lean on them; IVE's README forbids them. The replacement is proof by footage:
  real recordings, labelled, cropped large.
- **Decorative canvas objects.** Vercel's glowing triangle and Raycast's
  streak renders are brand textures of companies with design teams. IVE has
  one signature moment already (the opening); a second ambient render would
  compete with it.
- **Colored partner cards.** Linear's terracotta / lavender / white cards for
  Claude Code, ChatGPT and Figma read as partnership claims. Name Claude Code,
  Codex and Gemini CLI in neutral mono labels on the same panel surface.
- **Fake macOS chrome.** Raycast's traffic-light window; DESIGN.md bans it and
  the real app has its own window anyway.
- **Mega footer and dropdown nav.** Twelve columns, 81 links, mega menus,
  newsletter box. IVE has five pages; one row of links is enough.
- **Fifteen-thousand-pixel pages.** The home should stay between Vercel (6.6
  screens) and Linear (11). Detail goes on a feature page.
- **A floating glass nav bar** (Raycast's 1204x76 pill with gradient and inset
  highlight) is a recognisable signature; copying it would be the "looking like
  Raycast" the design doc warns about.
- **230 keyframes of micro-animation.** Linear's chart dots and cursors are
  hand-built per composition. Two or three excellent recordings beat twenty
  small illustrations.
- **Pill buttons everywhere.** IVE's 6px buttons are fine; one rounded primary
  CTA is enough to feel current.
- **"AI era" and "agentic" vocabulary.** IVE's voice rules want product words
  (goal, agent, board, review, machine). The reference sites can afford
  category language; a small tool cannot.
- **Scripted demo content that overclaims.** Linear's hero shows a successful
  draft PR. IVE's recordings use the Orbit demonstration project with no
  provider run; the board can show "4 running · 1 waiting for you · 2
  complete" because that is state, but it must not show a merged, passing PR
  as if a provider had produced it.

---

## 8. Notes on the two things IVE keeps

- **Opening animation.** No reference site opens with a scroll-driven scene;
  the closest relatives are Raycast's live canvas hero and Linear's /build
  video hero. Both confine the moment to the first screen and hand over to a
  still product shot at once. For IVE this argues for a tighter scroll
  distance and an immediate landing on the board recording in Linear's fold
  composition (pattern 1), with the big "IVE" letters shrinking into the
  28 to 32px header mark rather than staying large.
- **Why IVE.** None of the three has a full-screen question. The nearest
  structures are Linear's two-tone thesis sentence (48px, white clause then
  gray) and Raycast's value block (statement pair plus four proof cards). The
  question can keep its viewport; the answers should take the statement-pair
  form and, if a visual is kept, a four-panel grid of real crops instead of an
  illustrated instrument.

---

## 9. Files

Scratch folder: `/private/tmp/claude-501/-Users-maximilianschwarz/5351d8ba-945e-47c6-9f76-e8ef6642bb91/scratchpad/redesign/linear-raycast-vercel/`

- Scripts: `probe.mjs` (full-page and viewport screenshots, typography, colors,
  CTAs, media framing, CSS variables; desktop and iPhone), `motion.mjs`
  (stylesheet motion facts, sticky elements, hover timing, jump-reveal test,
  light-scheme and reduced-motion runs, page bottom), `frames.mjs` (ancestor
  chains of product shots, nav and spacing values).
- Linear home: `linear-home-desktop-full.png`, `linear-home-desktop-v00` to
  `v11.png`, `linear-home-mobile-full.png`, `linear-home-mobile-v00` to
  `v06.png`, `linear-home-desktop.json`, `linear-home-mobile.json`,
  `linear-motion.json`, `linear-jump-0ms.png`, `linear-jump-1500ms.png`,
  `linear-light-top.png`, `linear-bottom.png`.
- Linear /build: `linear-build-desktop-v00` to `v13.png`,
  `linear-build-desktop.json`.
- Linear changelog and method: `linear-changelog-desktop-v00` to `v13.png`,
  `linear-changelog-desktop.json`, `linear-method-desktop-full.png`,
  `linear-method-desktop-v00` to `v03.png`, `linear-method-desktop.json`.
- Raycast: `raycast-home-desktop-full.png`, `raycast-home-desktop-v00` to
  `v13.png`, `raycast-home-mobile-v00` to `v15.png`, `raycast-home-desktop.json`,
  `raycast-home-mobile.json`, `raycast-motion.json`, `raycast-jump-*.png`,
  `raycast-light-top.png`, `raycast-bottom.png`, `raycast-bottom2.png`.
- Vercel: `vercel-home-desktop-full.png` (sections below the second one
  render black in the full-page capture because they load lazily; use the
  viewport shots), `vercel-home-desktop-v00` to `v06.png`,
  `vercel-home-mobile-v00` to `v08.png`, `vercel-home-desktop.json`,
  `vercel-motion.json`, `vercel-jump-*.png`, `vercel-light-top.png`,
  `vercel-reduced-jump.png`, `vercel-bottom.png`.
