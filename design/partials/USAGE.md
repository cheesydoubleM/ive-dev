# Shared foundation: how to use it

Foundation step of build round 1 (2026-10-22). Binding source: `design/REDESIGN-BRIEF.md`. Page builders copy markup from this folder and **do not edit** `site.css`, `site.js`, `home.css`, `home.js`, `opening.css`, `opening.js`, `madeby.js` or `assets/fonts.css`. If something is missing, ask the orchestrator; do not add `style="…"` (the CSP blocks it) or page CSS files.

Files in this folder:

| File | What it is |
|---|---|
| `nav.html` | the header for every page (copy verbatim, then the per-page edits below) |
| `footer.html` | the footer for every page except 404 |
| `home-scenes.html` | the complete, tested homepage markup (opening, hero, Why IVE, Inside IVE, Get IVE, Maker). The index builder copies its `<body>` content into `index.html`. It carries two REFERENCE ONLY lines (`<base href="/">` and `base-uri 'self'`) so it renders from this folder; `index.html` must not have them |
| `USAGE.md` | this guide |

## 1. Page skeleton and CSP

Every page, in this order. `?v=20261023a` on every CSS and JS reference.

```html
<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' 'sha256-qFS7eZILz935x6ekROjFtuQlrwNUlvdxFi6sW9J7f30='; style-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; form-action 'none'">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="color-scheme" content="dark light">
<meta name="theme-color" content="#0E1014">
<script>(function(){var d=document.documentElement,t='dark';d.classList.remove('no-js');try{var s=localStorage.getItem('ive-theme');if(s==='light'||s==='dark')t=s;}catch(e){}d.setAttribute('data-theme',t);if(t==='light'){var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content','#F6F7F8');}})();</script>
<title>Product · IVE</title>
<meta name="description" content="…">
<link rel="canonical" href="https://ive.dev/product.html">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="assets/fonts.css?v=20261023a">
<link rel="stylesheet" href="site.css?v=20261023a">
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<!-- nav.html -->
<main id="main"> … </main>
<!-- footer.html -->
<script src="site.js?v=20261023a" defer></script>
</body>
</html>
```

- `theme-color` must come **before** the boot script (the script updates it for light).
- The boot script is byte-exact; any change needs a new hash (`printf '%s' '<script body>' | openssl dgst -sha256 -binary | openssl base64 -A`).
- **Generic boot script** (every page except index): `sha256-qFS7eZILz935x6ekROjFtuQlrwNUlvdxFi6sW9J7f30=` (the script above).
- **Homepage boot script** (adds `mark-live` and `mark-dark` unless reduced motion): `sha256-+2YNjuKpdbuWgZxIc7gAIrNdi+jwYzA8xrWiQxbwjCI=`, exact text:
  `(function(){var d=document.documentElement,t='dark';d.classList.remove('no-js');try{var s=localStorage.getItem('ive-theme');if(s==='light'||s==='dark')t=s;}catch(e){}d.setAttribute('data-theme',t);if(t==='light'){var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content','#F6F7F8');}try{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('mark-live','mark-dark');}}catch(e){}})();`
- `media-src 'self'` only on pages with video: **index.html and product.html** (insert it after `img-src 'self' data:;`). Download, architecture, imprint, privacy, 404: no `media-src`. No `connect-src` (nothing fetches).
- Homepage head adds, after `site.css`: `opening.css?v=20261023b`, `home.css?v=20261023a`; before `fonts.css` optionally the two font preloads from `home-scenes.html`. Homepage scripts, in this order: `site.js`, `opening.js`, `home.js`, `madeby.js` (all `defer`, `?v=20261023a`, `opening.js` `?v=20261023b`).
- `<html class="no-js">` is required: the boot script removes it; CSS uses it for the no-JS phone menu and to hide the theme switch.
- Titles without dashes: `IVE · Run your coding agents side by side`, `Product · IVE`, `Download · IVE`, `Architecture · IVE`, `Imprint / Impressum · IVE`, `Datenschutz · IVE`, `Not found · IVE`.
- No visible `name@x.y` strings (Cloudflare rewrites them).

## 2. Header and footer: per-page edits

Copy `nav.html` verbatim, then only these edits:

| Page | Edit |
|---|---|
| index.html | wordmark `href="index.html"` becomes `href="#top"` |
| product.html | `aria-current="page"` on the Product `.nav-link` |
| download.html | `aria-current="page"` on the Download `.nav-link` |
| architecture.html | `aria-current="page"` on the Architecture `.nav-link` |
| imprint.html | none |
| privacy.html | `aria-label="IVE, Startseite"` on the wordmark; nav `aria-label="Hauptnavigation"`; theme button `aria-label="Zum hellen Design wechseln"` and its `.tool-name` text `Design`; GitHub `aria-label="IVE auf GitHub (öffnet in neuem Tab)"`; menu button `aria-label="Menü"`; skip link text `Zum Inhalt springen`. site.js switches the theme labels to German by itself when `<html lang="de">` |
| 404.html | see section 9 |

`site.js` also sets `aria-current` by file name if the markup has none (safety net only).

The header's primary button (`[data-mac-download]`) needs no per-page edit: site.js points it to `#install` when the page has an element with `id="install"` (the homepage), to `#terminal` when the page has that id (the download page), otherwise to `download.html#terminal`. `download.html` must therefore have `id="terminal"` on the terminal panel, and no element with `id="install"`.

Footer: `footer.html` verbatim on every page except 404. Optional: `aria-current="page"` on the footer link of the current page.

## 3. Tokens and type

Dark is the default on `:root`; `html[data-theme="light"]` overrides. Use the tokens, never raw colours: `--bg --bg-raised --bg-inset --bg-glass --line --line-strong --text-1 --text-2 --text-3 --text-4 --accent --accent-fill --done --waiting --attention --on-accent`. `.ink-dark` forces the dark set on any subtree (both themes). Grid: `--maxw` 1200, `--gutter` 48/32/20, `--col-gap` 24/20/16, `--header-h` 64/56. Breakpoints: `max-width: 719.98px` (phones) and `max-width: 1023.98px`.

| Class / element | Role |
|---|---|
| `h1` / `.t-h1` | Archivo 700, 110%, 56px (40 on phones) |
| `h2` / `.t-h2` | 40px (30 on phones); `.t-h2-sm` 32px (26) for subpage section and row titles |
| `h3` / `.t-h3` | 20px Archivo 600 |
| `h3.pair` + two `<span>` | statement pair: white line + grey line, 32px (26) |
| `.lead` | 20px `--text-2` (18 on phones) |
| `.body`, `.body-muted` | 16px body copy |
| `.label`, `.kicker` | mono 12 `--text-4` (panel labels) |
| `.caption` | mono 12 `--text-4` (13 on phones): provenance |
| `.cap-title` + `.cap-text` | chapter caption: 18/600 + 16 `--text-3` |
| `.link` | accent, underlined; `.arrow-link` for "… →" links (put the SVG arrow inside) |
| `code` | inline code chip |
| `.status` + `.st-running/.st-done/.st-waiting/.st-attention` | mono state words (architecture figures) |

Arrows, chevrons and icons are inline SVG (`class="icon"`, 16×16 viewBox, stroke). Copy the exact SVGs from `home-scenes.html`: arrow right (→), arrow north-east (↗), chevron down, copy, check, expand, play, pause, sun, moon, GitHub, menu, close. External links get `target="_blank" rel="noopener"` and `<span class="sr-only"> (opens in a new tab)</span>`.

## 4. Layout helpers

`.wrap` (max 1200 + gutters), `.grid` (12 columns) with `.col-1-4 .col-1-5 .col-1-6 .col-1-7 .col-1-8 .col-3-10 .col-5-12 .col-6-12 .col-7-12 .col-9-12 .col-full` (all full width on phones). `.page-top` adds header clearance. Rhythm: `.block` (96px top and bottom, 64 on phones), `.block-sm` (64/48), `.section-rule` (hairline above), `.flow` / `.flow-sm` / `.flow-lg` (24/12/48px between children), `.mt-0 .mt-16 .mt-24 .mt-40 .mt-64 .mt-96`, `.center`, `.max-640`, `.max-800`.

## 5. Buttons

| Class | Use |
|---|---|
| `.btn .btn-outline` | primary outlined, 44px (header: add `.btn-sm`, 36px) |
| `.btn .btn-fill` | primary filled, hero only |
| `.btn .btn-quiet` | closers ("Get IVE on the Download page →"), no border at rest |
| `.btn .btn-quiet .btn-line` | quiet with a hairline at rest (Get IVE links row) |
| `.btn-block` | full width |
| `.icon-btn` | 36×36 icon button (put `aria-label` on it) |

**Download buttons.** OS-aware: add `data-mac-download` and wrap the label in `<span data-mac-download-label>Download for Mac</span>`; href is the DMG `https://github.com/michael-ra/ive/releases/latest/download/IVE-macOS-arm64.dmg`. Optional: `data-install-label="…"` (default "Install IVE"), `data-install-label-narrow="Get IVE"` (used below 720px, hero only), `data-install-href` (override target), `[data-mac-download-icon]` child (removed on conversion). An Apple-silicon-only note gets `data-mac-download-note` (hidden when the button converts). Plain DMG links (Get IVE Mac panel, download.html) have **no** `data-mac-download`.

## 6. Terminal box with Copy

```html
<div class="term" data-copy-box>
  <pre class="term-code" data-copy-source><code><span class="term-line">curl -fsSL https://ive.dev/install.sh | bash</span></code></pre>
  <button class="term-copy" type="button" data-copy="curl -fsSL https://ive.dev/install.sh | bash" aria-label="Copy the install command" hidden><svg class="icon icon-copy" …></svg><svg class="icon icon-check" …></svg><span data-copy-label>Copy</span></button>
  <span class="sr-only" role="status" aria-live="polite" data-copy-status></span>
</div>
```

- One `.term-line` per command; the `$` prompt is drawn by CSS and is never copied or selected.
- Several lines: add `.term-multi` and put the lines joined with `&#10;` into `data-copy` (see the From source box in section 8).
- Narrow containers: `.term-stack` puts Copy under the command (automatic on phones).
- Every box has its own `data-copy-status`. The button ships `hidden`; site.js reveals it.

## 7. App demos: the product frame

Since round 4 (23 Oct 2026) every app demo is generated on the page; no recording plays. The frame keeps the site's `.frame`/`.frame-media` and shows a poster until the demo is ready:

```html
<figure class="frame is-light row-media" data-demo="SCENE" data-demo-theme="light" data-demo-title="What it shows" data-demo-caption="Title">
  <div class="frame-media">
    <picture class="frame-poster">
      <source media="(max-width: 719.98px)" srcset="assets/demo/posters/SCENE-m.webp">
      <img src="assets/demo/posters/SCENE.webp" srcset="assets/demo/posters/SCENE.webp 1600w, assets/demo/posters/SCENE@2x.webp 3200w" sizes="(max-width: 1023.98px) 100vw, 800px" width="1600" height="1000" alt="What it shows" loading="lazy" decoding="async">
    </picture>
  </div>
</figure>
```

IVE for iPhone: Home `section.phone#iphone` (`.phone-head`, `.phone-visual`, `.phone-more`), Product `section.row#iphone`, Download `section.panel#iphone`. The mockup `.ph` (site.css): `.ph-body` is the phone (aspect 628/1360), `.ph-device` holds the frame image with its transparent margins overhanging, `.ph-screen` the drawn IVE phone terminal (status bar, head, transcript, key bar), `.ph-event` the floating notice. The iPhone app is unreleased: "Coming soon to the App Store" (`.soon` badge, no link), no install, build or pairing steps on any page or in the demo's Phone view; feature claims stay within apps/ios/README.md, WATCH.md and PhonePanel.jsx.

Behaviour (demo.js): when the figure is within one viewport, an inert `iframe.demo-frame` (tabindex -1, aria-hidden, no pointer) of `assets/demo/r5/frame.html?scene=SCENE&theme=light|dark` is added to `.frame-media` (plus params from `data-demo-params`). Next to the preview, in the figure's `.try-row` (or the reel's `.player-provenance`), demo.js inserts the Pause/Play button (`[data-demo-toggle]`); nothing else sits there. The figure gets `demo is-demo`, `is-ready` once the scene painted (the poster fades), `is-playing`/`is-paused`/`is-paused-by-user`. The preview always plays when at least half in view; only the most visible one plays; off-screen, a hidden tab or the open dialog pauses it; leaving the view ends a visitor's pause. No overlay controls, no scrubber, no expanded preview. Without JS: the poster and the caption. `data-demo-loop="false"` stops the loop at the end, `data-demo-controls="false"` omits the controls (the Why panel), `data-demo-when-active` plays only while the element carries `is-active` (stacked panels).

"Try it yourself": links to `try.html` at page level (round 7): `.nav-cta` in every header (`btn-fill btn-sm`), the hero's first button, the Home `.tryband` before Get IVE, the Get IVE lead, `.page-head-cta` on Product and Download, the Product `.closer-pair`, the footer's first link; nowhere near the previews. `try.html` builds the app frame itself (`try.js`: theme from `ive-theme`, `?at=<route>` for another start than Home, `?tour=0` without the introduction) and shows the introduction's Skip/Again in its strip (`[data-try-guide]`, messages `tour` to and from the frame). Routes: `home`, `board`, `attention`, `terminals`, `terminal`, `session` (`&sid=`), `loopdetect`, `review`, `pipelines`, `autofix`. In the app frame: `?tour=1` runs the introduction (`lib/mod-tour.js`; `state.tour = { on, started, done[], finished, current, fileOpened, chip, total }`; each step lists its targets in order of preference and the first one that is visible and really hittable at its centre (`elementFromPoint`) gets the ring; a clipped one is scrolled into view once: `[data-home-start]:not([disabled])` (empty box: `[data-home-composer]`, elsewhere `[data-nav="home"]`), `[data-demo-terminal-toggle]` (on the board: a tile's Open), `button[data-nav="board"]`, `[data-grid-cell-session="checks"] [data-terminal-slot]` while the tile is a terminal ("Click in, press Enter"; the Board opens as terminals since round 7), else `… [data-choice-kind="allow"]` (a squeezed tile: its `[data-demo-review-request]`, which opens the session, where the permission card sits in the conversation), `button[data-nav="review"]`, `[data-demo-review-file]`; fallbacks: `[data-sidebar-toggle]` while the sidebar hides a target, `[data-demo-review-close]` while the Review panel covers what comes next; overlay elements in `#stage`: `.demo-tour-ring`, `.demo-tour-beacon`, `.demo-tour-label`, `.demo-tour-bar` with `[data-tour-skip]`/`[data-tour-replay]` unless `chip=parent`).

App modules (`assets/demo/r9/lib/`; r8 is the frozen round-7 release, r9 differs in the Phone view's copy): `app.js` (core: state, routes, rendering, the agents' programs, `api`), modules with `{ id, init, main, overlays, click, observe, input, change, drag, submit, key, tick, after, command }`: `mod-ui.js` (palette, filter, menus/dialogs registry `MENUS`/`DIALOGS`/`ACTIONS`, session menus, merge, projects, sort, Board scope/layout; hooks `data-demo-act`, `data-demo-menu`, `data-demo-dialog`, `data-demo-field`, `data-demo-palette-input`), `mod-session.js` (strip menus, Details, History, Copy, attach, dictate, Add context, side chat `#ive-sidechat`, brief, permission card, queue), `mod-settings.js` (views `settings|knowledge|connectors|phone`, routes of the same name, `state.prefs`), `mod-review.js`, `mod-pipelines.js`, `mod-flow.js` (Codex-owned in round 7), `mod-tour.js`. `try.html?at=<route>&sid=<id>` opens a view or a seeded session.

Scenes (`assets/demo/r5/scenes/`, the previews' runtime; `r9/` is the app's and carries the same scenes; r6, r7 and r8 are frozen earlier releases): `board` (the dark 2×2 board; `variant=hero` shows one row of two tiles filling the window), `attention` (one waiting tile with the permission card), `terminal`, `terminals`, `start`, `autofix`, `pipelines`, `loopdetect`, `review`. Each exports `{ id, title, script, poster, fit, init, render }`; `fit.minScale` keeps the text legible (the app window gets narrower instead). Posters: `assets/demo/posters/NAME.webp` (1600), `NAME@2x.webp` (3200), `NAME-m.webp` (780×1040, phones); `board-hero*` (1600×554) for the hero, `attention*` and `review-dark*` (1280×880) for the Why panel; made by `scripts/demos/posters.mjs`. **Never reference a poster that does not exist.** The three stills of the Product bento (`assets/app/still-*.webp`) are unchanged. `window.IVE.openViewer({ image, caption }, openerElement)` (site.js) still opens a still full size; `window.IVE.syncDemos()` re-evaluates which demo plays.

## 8. Subpage scaffolds (site.css)

**Page head** (product, download):
```html
<header class="page-head"><div class="wrap"><div class="page-head-text"><h1>…</h1><p class="lead">…</p></div></div></header>
```

**Product rows** (text 4 columns, media 8, alternating; hairlines between; media first below 1024px):
```html
<div class="wrap rows">
  <section class="row" id="home" aria-labelledby="row-home"><div class="row-text"><h2 id="row-home">Home and sessions</h2><p>…</p></div><figure class="frame row-media" data-clip>…</figure></section>
  <section class="row is-flipped" id="board" …>…</section>
</div>
```

**Three stills** sharing hairlines: `<div class="stills"><figure class="still"><img …></figure> ×3</div>` in the order model, mode, palette (model and mode stack on the left, the palette spans both rows on the right; the stills keep a dark ground in both themes). An optional `<figcaption class="label">` sits in a strip under the image.

**Also in the app** (product.html uses `section.wrap.mt-96 > div.section-rule > h2.mt-96` so the hairline sits at content width): `<section class="wrap block section-rule" id="also"><h2 class="t-h2-sm">Also in the app.</h2><div class="cols-3"><div><span class="label">Cascades</span><p>…</p></div> ×3</div></section>`.

**Closer**: `<div class="closer"><a class="btn btn-quiet" href="download.html">Get IVE on the Download page ARROW SVG</a></div>`.

**Download panels**:
```html
<div class="wrap"><div class="stack">
  <section class="panel panel-lg" aria-labelledby="mac-title"><span class="label" id="mac-title">Mac app</span><a class="btn btn-outline" href="DMG">Download for Mac</a><p class="facts">Apple silicon (M1 or newer) · macOS 13.5 or newer</p><p class="body">…</p><a class="arrow-link" href="https://github.com/michael-ra/ive/releases" target="_blank" rel="noopener">Release notes on GitHub ARROW-NE SVG</a></section>
  <section class="panel panel-lg" id="terminal" …><span class="label">Terminal</span> TERM BOX <p class="body">…</p><p class="facts">Requirements: …</p></section>
  <section class="panel panel-lg" …><span class="label">From source</span><div class="term term-multi" data-copy-box>… four .term-line …</div><p class="body">Add <code>--plan</code> …</p></section>
</div></div>
```
Panel children are spaced 16px apart by `.stack .panel > * + *`.

**Questions**: `<h2 class="t-h2-sm mt-96">Questions</h2><div class="qa mt-24"><details><summary>Question?CHEVRON SVG</summary><p>Answer.</p></details> ×5</div>`.

**Architecture** (3.4): keep every block, class and text. site.css restyles `arch-hero`, `arch-section(-head)`, `arch-process-diagram`, `arch-node*`, `arch-route-down`, `arch-branch`, `arch-process-lanes`, `arch-event-figure/-path/-kinds`, `arch-isolation-grid/-copy`, `arch-trace`, `stats-row`, `stat(-n/-l)`, `source-line`, `arch-surface-defs`, `arch-access-grid/-table`, `arch-table-wrap`, `arch-layers`, `arch-security(-ledger)` (own `--bg-inset` ground), `kicker`, `status`, `glyph`, `st-*`. Replace the closer by `<section class="arch-close"><a class="btn btn-quiet" href="download.html">Get IVE on the Download page ARROW SVG</a></section>`; the old `cmd-copy` box and `oss-row` go with it. Remove `phase-section` and `data-phase` if you like; nothing styles them now.

**Legal** (3.5): `<main class="legal-main" id="main">` stays byte-identical; site.css styles `legal-main`, `legal-head`, `legal-sections`, `legal-section` (label column 3, text column 9 at ≥1024), `legal-copy`, `kicker`, `mono`. Only head, header and footer change. Verified rendering: imprint and privacy (German chrome) at 1440 and 390.

## 9. 404 page

GitHub Pages serves `404.html` for any missing path, also nested ones (`/a/b/c`), so relative URLs break there. Recommended: load the shared files with **root-absolute** URLs (`/assets/fonts.css?v=20261023a`, `/site.css?v=20261023a`, `/site.js?v=20261023a`, favicon `/assets/favicon.svg`) and write every link root-absolute (`/`, `/product.html`, `/download.html`, `/architecture.html`, `/imprint.html`, `/privacy.html`). Its inline boot script is the generic one (same hash); no inline style is needed. Use `nav.html` with those root-absolute hrefs (wordmark `href="/"`). Body: `<main id="main" class="wrap nf-main"><div><h1>Not found.</h1><p class="lead">This page does not exist. The homepage has everything that does.</p><div class="nf-actions"><a class="btn btn-outline" href="/">Go to the homepage</a><a class="btn btn-quiet" href="/download.html">Download IVE</a></div></div></main>`. Reduced footer:

```html
<footer class="site-footer is-reduced"><div class="wrap"><div class="footer-row"><nav aria-label="Footer"><ul class="footer-links"><li><a href="/imprint.html">Imprint</a></li><li><a href="/privacy.html">Privacy</a></li></ul></nav></div><p class="footer-line">EU-based · Open source under the Apache 2.0 license</p></div></footer>
```
Keep `<meta name="robots" content="noindex">`. CSP as section 1 (no `media-src`).

## 10. Homepage scenes (index builder)

Copy the sections from `home-scenes.html`. Contracts the scripts rely on:

- **Opening** (`opening.css`, `opening.js`): `section#hero` contains `div.mark#top[data-mark]` > `[data-mark-pin]` > `.scene[data-scene]` (the camera `.scene-cam[data-scene-cam]` holding the corridor `.scene-space` with the four `.scene-wall[data-wall="floor"|"ceil"|"left"|"right"]`, `.scene-rings[data-scene-rings]` (rings are built by JS), `.scene-vignette[data-scene-vignette]`, then `[data-scene-board]` with the title and `[data-scene-swarm]` (cards are built by JS); after the camera `[data-scene-caption="a"|"b"]` each with `[data-scene-count]`, and last `.scene-scan[data-scene-scan]`), `p.mark-line[data-mark-line]` with 3 × `.mark-word` (`[data-mark-cap]` + `.mark-rest > [data-mark-rest]`), the `sr-only` full name, `.mark-by` link, `.mark-hint` chevron. Then `div.hero-body` (it rises under the opening by `margin-top: -40vh` only when `html.mark-live`). Timeline, header handling (`html.mark-dark`, `html.mark-zoom`) and the static fallback are in the scripts; no extra markup.
- **Hero**: `.hero-head` (h1 `#hero-title`, `.lead`, `.hero-cta` with the filled OS-aware button carrying `data-install-label-narrow="Get IVE"` and a terminal box, `.hero-note[data-mac-download-note]`), then `figure.frame.hero-frame[data-demo="board"][data-demo-theme="dark"][data-demo-params="variant=hero"]` (880px wide, aspect 2704/936 on desktops, 3:4 on phones; `demo.css`) with its `board-hero` poster and the caption footer (no controls in the footer: demo.js adds them to the media).
- **Why IVE** (`home.js`): `section#why[data-why]` > `[data-why-pin]` > `.why-prelude[data-why-prelude]`, `.why-inner.wrap` > `h2.why-question[data-why-question]` with two `[data-why-word]`, `.why-layout[data-why-layout]` > `.why-beats` (4 × `article.why-beat[data-why-beat="0..3"]`, each `h3.pair` + `<p>`) and `.why-stage[data-why-stage]` (`figure.why-panel[data-why-panel]` with 4 × `.why-media[data-why-media="0..3"]`, each holding its poster `<picture class="frame-poster">`, the demo attributes (`data-demo`, `data-demo-theme="dark"`, `data-demo-controls="false"`, `data-demo-when-active`) and its `.why-label`; then `nav.why-jumps` with 4 × `button.why-jump[data-why-jump]`). Modes: `.is-pinned` (≥720px, height ≥560px, motion), `.is-flow` (<720px), static (reduced motion, no JS, short windows: media above each beat). Media 0 is the `board` scene, media 1 the `attention` scene (one waiting tile), media 2 the `review` scene (its fullscreen part), all dark; media 3 the ledger `<dl class="ledger why-ledger">`. The `.why-crop-*` classes in home.css are unused since round 4.
- **Inside IVE** (`home.js`): `section#inside[data-inside]` > `.inside-live` > `ol.chapters[data-chapters]` (each `button.chapter-btn[data-chapter="n"][aria-pressed]` with `data-chapter-demo` JSON: `scene`, `theme`, `poster` (1600), `poster2x`, `alt`, `caption`; single-quoted attribute, so no apostrophes inside), `figure.frame.player[data-player][data-demo-player]` (`img[data-player-poster]` only; demo.js adds one frame per chapter and the controls), `figcaption.player-captions` with 6 × `[data-chapter-caption="n"]` and the provenance line. `.inside-static` holds the no-JS figures. Keep only chapters whose scenes exist (and their static figures).
- **Get IVE**: `section#install` with the alias anchors `#waitlist` and `#get-ive` (`span.anchor-alias`), `.get-paths` with two `.panel.get-path` (Mac panel: plain DMG link, no `data-mac-download`).
- **Maker** (`madeby.js`): `section#aiforeu[data-madeby]` with `video[data-madeby-video]` (`preload="none"`, `poster`, `data-src-large`, `data-src-small`) inside `.maker-frame`, buttons `[data-madeby-sound]` and `[data-madeby-replay]` (ship `hidden`).

## 11. Known points for QA and the owner

- `--accent-fill` dark is `#3A66FA` instead of the brief's `#3D6BFF`: white on `#3D6BFF` is 4.43:1, below the brief's own 4.5:1 rule (5.8); `#3A66FA` gives 4.71:1. Light stays `#1647FF` (6.2:1).
- `--text-4` (brief values) was 3.87:1 dark and 3.61:1 light on `--bg`. QA round 1 lifted it to `#7C828C` dark and `#686E77` light: at least 4.5:1 on all three grounds (also in 404.html's own copy of the tokens).
- Each autoplaying frame has a pause button (top right, next to Expand): WCAG 2.2.2 for muted loops longer than five seconds. It is a small addition to the brief's "Expand" control.
- The header hides its wordmark while the opening is pinned (`html.mark-dark`) and fades it in at the hand-over (brief 4.1: "the small wordmark simply fades in with the header"). During the zoom out of the V it gets a dark glass ground so the controls stay legible over the white strokes.
- Measured with the reference page at 1440×900: 9,477px tall (target about 9,100), 390×844: 7,877px; no horizontal overflow; no console errors in dark and light; reduced motion and no-JS render their static states.

404.html is self-contained (inline `<style>`, inline script, its own strict CSP): after any change inside the `<style>` block, recompute its hash (`sha256-` + base64 of the exact block content) and replace the `style-src` hash in the CSP meta, or the browser drops every rule on the page; the same holds for the inline scripts and `script-src`. Links on that page are root-absolute (`/try.html`), because the page renders at any nested URL.
