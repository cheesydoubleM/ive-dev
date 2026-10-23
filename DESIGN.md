# IVE.DEV design system (redesign 2026-10)

Internal reference for every page of ive.dev. The full specification is
`design/REDESIGN-BRIEF.md`; the shared markup and classes are in
`design/partials/USAGE.md`. Product truth comes from the Product truth block in
`README.md` and `design/research/04-inventory-and-constraints.md` (section 2) and
`design/research/05-loops-and-automation.md` (sections 2 and 6). Everything is
checked against IVE 1.0.17; the site shows no version number.

## Idea

IVE is the local control room for parallel coding agents: several sessions run
side by side on your own machine, one board shows who runs, who waits and who is
done, and every change comes back to you for review. The homepage lands one idea:
more gets done because several agents work at once, and you can see each one
because they all live on one board.

Spirit: Cursor and Linear (owner request). Dark first, quiet chrome, real footage
of the app, very little text. The footage carries the message; text only frames it.

## Pages

| Page | Job |
|---|---|
| `index.html` | Opening scene, hero, Why IVE, Inside IVE, Get IVE, Maker |
| `product.html` | The catalogue: every view and every loop, one row each, real footage |
| `download.html` | Mac app, terminal install, source, requirements, removal, five questions |
| `architecture.html` | Engineering page (old content, restyled) |
| `imprint.html`, `privacy.html` | Legal; `<main class="legal-main">` is byte-identical, only the chrome changes |
| `404.html` | Self-contained (own hashed style and script, root-absolute URLs) |

### Homepage composition map

No two neighbours share a composition, and none appears twice.

| Section | One job | Composition |
|---|---|---|
| Opening (in `#hero`) | The problem and the payoff without words, then the name | Pinned scroll scene on a dark ground in both themes: inside the machine, a grid corridor with ring ribs and camera drift (owner decision 2026-10-22), the swarm in it, board, zoom out of the V, IVE unfolds into Integrated Vibecoding Environment |
| Hero `#hero` | Name the product and show it | Left headline block, then an 880px window into the dark board recording (two sessions; the full board on expand) |
| Why IVE `#why` | The four reasons | Viewport-wide question that docks, statement column plus sticky media panel (pinned at 720px and up, in flow on phones) |
| Inside IVE `#inside` | What IVE really does, as it happens | Chapter rail, one wide player, caption block; four real clips auto-advance: start and queue, Auto-fix loop, Pipelines, loop detection |
| Get IVE `#install` | The action | Centred headline, two panels: Mac app and terminal |
| Maker `#aiforeu` | Who makes it | Signature strip: the approved logo film left, one line right |

Bento grids, icon walls, card stacks and repeated split sections are out.

## Navigation and footer

- Header on every page: fixed, 64px (56px below 720px), transparent until 8px of
  scroll, then glass with a hairline. Left the wordmark "IVE" at 22px with the blue
  dot, no by-line. Right, all in one button family (36px, 6px radius): the quiet
  links Product, Download, Architecture; the theme switch as an icon button
  (sun in dark, moon in light, the label names the action); the GitHub icon button;
  the outlined primary action (Download for Mac or Install IVE). Below 720px:
  wordmark, primary action, Menu button with a panel.
- While the opening scene is pinned the header uses the dark ink (`html.mark-dark`)
  and hides its wordmark; the wordmark fades in at the hand-over.
- Footer: IVE and "from AIFOREU" (link to aiforgov.eu), the six links, and the line
  "EU-based · Open source under the Apache 2.0 license". The 404 keeps only the
  line and the legal links.

## Tokens

Dark is the default (also without JS); `html[data-theme="light"]` overrides.
`.ink-dark` forces the dark set on any surface that is dark in both themes.

```text
                 dark                  light
--bg             #0E1014               #F6F7F8
--bg-raised      #15181D               #FFFFFF
--bg-inset       #0A0C0F               #EEF0F2
--line           rgba(255,255,255,.08) rgba(16,18,22,.10)
--line-strong    rgba(255,255,255,.16) rgba(16,18,22,.18)
--text-1         #F2F3F5               #15171A
--text-2         #C6CAD1               #3E434A
--text-3         #8B919B               #646A73
--text-4         #7C828C               #686E77    (lifted in QA round 1: at least 4.5:1 on all three grounds)
--accent         #5B8CFF               #1647FF    (links, running, focus, the dot)
--accent-fill    #3A66FA               #1647FF    (filled hero button, white text 4.7:1 and 6.2:1)
--done           #7DCE82               #087A4B
--waiting        #E0A54A               #B7791F
--attention      #F2545B               #C83B24
```

One accent. Blue only for running states, links, focus, the wordmark dot and the
filled hero button. No purple, no neon, no glows.

## Type

Archivo (display, 500 to 800, width 100 to 125%), Source Sans 3 (body),
IBM Plex Mono (labels, provenance, commands), all self-hosted in `assets/fonts`.

| Role | Setting |
|---|---|
| H1 | Archivo 700, 110%, 56px (40 on phones) |
| H2 | Archivo 700, 110%, 40px (30); subpage rows 32px (26) |
| Statement pair | Archivo 600, 32px (26): white line, grey line, same size |
| Lead | Source Sans 3, 20px (18), `--text-2` |
| Body | 16px, `--text-2`; captions `--text-3` |
| Mono | IBM Plex Mono 500, 12px labels and provenance, 13px ledgers, 14px terminal boxes |

No faded second headline line. Lines at most 64ch. Arrows, chevrons and icons are
inline SVG, never font glyphs.

## Components

- Buttons, one family, 6px radius, no pills: primary outlined (header, Get IVE),
  primary filled (hero only), icon button 36×36, quiet (closers, links row).
- Product frame: `--bg-inset`, 8px radius, hairline ring, soft shadow. No title bar
  and no fake macOS chrome: the app's own sidebar and top bar are the chrome.
  Pause and Expand controls; Expand opens the shared `<dialog>` viewer.
- Panels: `--bg-raised`, hairline ring, 8px radius. Terminal box: `--bg-inset`,
  mono 14px, `$` prompt drawn by CSS, Copy button with its own live region.
- Captions: provenance in mono 12 `--text-4` ("IVE app · demo project · no provider
  ran"); chapter captions as title 18/600 plus one sentence.
- Product rows: hairlines between rows, text and frame alternate sides; the three
  stills of the Models row share hairlines on a dark ground in both themes.

## Status language

```text
○ queued   ◐ thinking   ● running   ◇ waiting   ✓ complete   ! attention
```

IBM Plex Mono, a symbol always paired with a word, readable without colour.
Status glyphs belong only to product states inside diagrams and recordings.

## Motion and video

- Budget: the opening scene, Why IVE, the recordings, and 120 to 220ms hover and
  crossfade transitions. No scroll reveals, no parallax, no blur on text.
- Recordings are muted product loops that play only in view: `preload="none"`, the
  source is attached one viewport ahead, `-s` (1600) inline and the 3200 master only
  in the viewer, `-m` 3:4 crops below 720px. One video plays at a time; off-screen,
  a hidden tab or the open viewer pauses it. The Maker film is the one clip with sound.
- Theme of the footage: the Inside IVE reel and every Product row play the app's
  light theme (`<name>-light*`, `board-light*`, 60 fps); the hero and the Why panel
  keep the dark board take (`hero-board*`, `why-attention*`, `review-why*`, 30 fps),
  owner decision 2026-10-23 ("der dunkle Hero war besser, aber die Clips sollten von
  dem hellen Dashboard sein"). A frame that shows a light take carries `is-light`.
- `prefers-reduced-motion`: nothing starts by itself, the two scenes show their
  static states, transitions are instant. Without JS every page is a calm static
  page with posters, captions and plain navigation.

## Voice and copy

- English, short, concrete. No em or en dashes as punctuation, no emojis, no AI
  vocabulary (unlock, seamless, supercharge, revolutionize, elevate and their kin).
- Hard word budgets per section (brief 2.4). Measured on the rendered homepage
  after Gemini came back (2026-10-22): 274 marketing words (hero 17 of 17, Why 109,
  Inside 111, Get 31, Maker 6).
- One primary home per claim (brief 2.5). The homepage gives the short version,
  Product describes the view or mechanism in other words. Functional lines
  (commands, requirements, provenance, legal, buttons) may repeat where needed.
- Benefit first, mechanism second; deep implementation detail lives on Architecture.
- Buttons name the page or action they open.

## Honesty

- Only claims that are true for the current release. No speed or quality claims,
  no numbers as proof, no testimonials, customer logos, star counts or other
  social proof. Asking once for a GitHub star is fine.
- Never "your code stays on your machine": IVE runs on your computer, and the
  coding CLI sends prompts, context and code to the provider the user chose.
- CLIs: the site names Claude Code, Codex and Gemini (owner decision, 2026-10-22).
  In 1.0.17 Gemini runs through the Antigravity CLI profile, Google's agent CLI; the
  standalone Gemini CLI profile is inactive (`backend/cli_profiles.py`).
  Full lists: "Claude Code, Codex and Gemini (Antigravity CLI)".
  Short lists and chips: "Claude Code · Codex · Gemini". Never "Gemini CLI" alone.
  Models depend on the installed CLI and account; illustrations name only Haiku,
  Sonnet, Opus and the Gemini Pro and Flash models (`gemini-3.1-pro`,
  `gemini-3.5-flash`).
- Recordings are the real IVE frontend on its isolated test transport with the
  demo project Orbit; no provider ran. The opening scene and the Why ledger are the
  only illustrations. Never fake app UI where a recording exists.
- Numeric totals (Architecture only) sit beside "Development snapshot ·
  capabilities may change during the beta.".
- No Windows support, no Intel Mac app, no version number or file size for the
  Mac app, no "EU-backed".

## Technical contract

- Static HTML, CSS and JS, no build step. Shared: `site.css`, `site.js`; homepage
  adds `opening.css`, `home.css`, `opening.js`, `home.js`, `madeby.js`.
- Every page: strict CSP meta (`default-src 'none'`, `'self'` only, inline scripts
  and styles by sha256 hash, `media-src 'self'` only on pages with video,
  `base-uri 'none'`, `form-action 'none'`). Recompute a hash after any change to
  an inline block. No external requests; fonts are local.
- `?v=` cache version on every CSS and JS reference; raise it with every change
  (GitHub Pages caches for 10 minutes).
- Theme: inline boot script, `localStorage['ive-theme']` only, dark by default.
- Download logic (`[data-mac-download]`): Apple silicon Mac keeps the DMG link;
  every other platform, touch Macs (iPad) and Intel Macs in Chromium
  (`userAgentData` architecture `x86`) get "Install IVE" to the terminal install.
  Plain DMG links never change.
- `install.sh` stays byte-identical; `CNAME` and `robots.txt` unchanged; legal
  `<main>` unchanged; `_config.yml` keeps `design`, `review` and `scripts` out of
  the published site.

## Hard bans

- Social proof of any kind, fake customers, fake numbers, fake code, fake chrome.
- Purple or violet, neon, glows, star fields, orbs, sparkle icons; matrix green,
  hacker cosplay, ASCII decoration.
- Bento grids, icon-grid feature walls, cards for everything, pill buttons.
- Robots, AI heads, characters, avatars, personalities, workforce metaphors.
- Custom cursors, WebGL, animation libraries.
- Retired lines: "Run agents. Keep control.", "Your code stays on your machine",
  "One brain. Infinite&#32;hands.", "agent&#32;army", "tmux wish&#101;s it could do
  this.", every GOAL → PLAN → WORK → CHECK → REVIEW strip, "Mission Control" as a
  label, "Ralph" as a product name (the UI says Auto-fix loop).
