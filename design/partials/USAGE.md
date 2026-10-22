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

## 7. Recorded clips: the product frame

```html
<figure class="frame" data-clip>
  <div class="frame-media">
    <picture class="frame-poster">
      <source media="(max-width: 719.98px)" srcset="assets/app/NAME-m@2x.webp">
      <img src="assets/app/NAME.webp" srcset="assets/app/NAME.webp 1600w, assets/app/NAME@2x.webp 3200w" sizes="(max-width: 719.98px) 100vw, 800px" width="1600" height="1000" alt="" loading="lazy" decoding="async">
    </picture>
    <video class="frame-video" muted playsinline loop preload="none" width="1600" height="1000" data-src="assets/app/NAME.mp4" data-src-small="assets/app/NAME-s.mp4" data-src-m="assets/app/NAME-m.mp4" aria-label="Recording of …: what it shows."></video>
    <div class="frame-controls">
      <button class="frame-btn" type="button" data-clip-toggle aria-label="Pause the recording">PAUSE SVG + PLAY SVG (icon-pause, icon-play)</button>
      <a class="frame-btn" href="assets/app/NAME.mp4" data-clip-expand data-caption="Title. Recorded from the IVE app with a demo project. No provider ran." aria-label="Expand the recording">EXPAND SVG</a>
    </div>
    <button class="frame-play" type="button" data-clip-play hidden>PLAY SVG Play</button>
  </div>
  <figcaption class="caption frame-caption">Recorded from the IVE app with a demo project. No provider ran.</figcaption>
</figure>
```

Behaviour (site.js): the source is attached once the frame is within one viewport (`-m` below 720px when `data-src-m` exists and the frame turns 3:4, the 3200 master only when width × DPR > 1700, otherwise `-s`); it plays muted when at least half in view, and only the most visible clip on the page plays; it pauses off-screen, on a hidden tab and while the viewer is open. Reduced motion: poster plus the centred Play button, nothing starts by itself. Autoplay blocked: same Play button. The poster `<picture>` shows until the video has a frame, and is all there is without JS. Expand opens the shared `<dialog>` viewer (built by site.js; Escape and backdrop click close it; focus returns). Without JS, Expand is a plain link to the mp4.

- Above the fold (hero) drop `loading="lazy"` on the poster.
- Drop `data-src-m` and the `<source>` when a clip has no `-m` file; on phones the frame then stays 16:10.
- Still instead of a clip: the same frame without `<video>`, controls and Play.
- Crops of a 3200×2000 master: `data-crop="cx cy cw"` on the media element (master px: left, top, width that maps to the frame width), applied by site.js through CSSOM; homepage crops are classes in home.css (`.why-crop-*`, `.crop-hero-m`).
- `window.IVE.openViewer({ src, small, poster, caption, image }, openerElement)` opens the viewer from your own code.

Asset names (recordings step): `NAME.mp4` (3200×2000), `NAME-s.mp4` (1600×1000), `NAME-m.mp4` (3:4 portrait), `NAME.webp` (1600 poster), `NAME@2x.webp` (3200 poster), `NAME-m@2x.webp` (portrait poster). Present at 21:40 (dark, 1.0.17): clips `hero-board`, `start-queue`, `loop-task`, `loop-canvas`, `loop-detect`, `review` (all with `-s`, `-m` and posters); `review-why.mp4` + `review-why@2x.webp` (1340×880, the Why beat 3 cut, already cropped: no crop class, it fills the panel top-left); stills `why-attention.webp`/`@2x`, `still-model@2x.webp` (512×308), `still-mode@2x.webp` (704×760), `still-palette@2x.webp` (1104×1232) for the Product row Models, modes and keys. Check `assets/app/` before you reference a file: **never reference a file that does not exist**; drop the row, chapter or slot until it does (brief 4.4). The light 1.0.12 files (`board*`, `home*`, `session*`, `setup*`) and `review-full*` were removed in QA round 1.

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
- **Hero**: `.hero-head` (h1 `#hero-title`, `.lead`, `.hero-cta` with the filled OS-aware button carrying `data-install-label-narrow="Get IVE"` and a terminal box, `.hero-note[data-mac-download-note]`), then `figure.frame.hero-frame[data-clip]` (1320px, bleeding at 1440). Mobile fallback without `hero-board-m`: add `crop-hero-m` to `.frame-media` and drop `data-src-m` and the `<source>`.
- **Why IVE** (`home.js`): `section#why[data-why]` > `[data-why-pin]` > `.why-prelude[data-why-prelude]`, `.why-inner.wrap` > `h2.why-question[data-why-question]` with two `[data-why-word]`, `.why-layout[data-why-layout]` > `.why-beats` (4 × `article.why-beat[data-why-beat="0..3"]`, each `h3.pair` + `<p>`) and `.why-stage[data-why-stage]` (`figure.why-panel[data-why-panel]` with 4 × `.why-media[data-why-media="0..3"]`, each holding its poster `<picture>`, an optional `<video class="why-video">` with `data-src`/`data-src-small`, and its `.why-label`; then `nav.why-jumps` with 4 × `button.why-jump[data-why-jump]`). Modes: `.is-pinned` (≥720px, height ≥560px, motion), `.is-flow` (<720px), static (reduced motion, no JS, short windows: media above each beat). Media 0 is the `hero-board` clip through `.why-crop-board`, media 1 the `why-attention` still through `.why-crop-attention`, media 2 the pre-cut `review-why` clip (no crop), media 3 the ledger `<dl class="ledger why-ledger">`. `.why-crop-review` stays in home.css as the fallback crop for a full 3200×2000 review frame.
- **Inside IVE** (`home.js`): `section#inside[data-inside]` > `.inside-live` > `ol.chapters[data-chapters]` (each `button.chapter-btn[data-chapter="n"][aria-pressed]` with `data-chapter-clip` JSON: `src`, `small`, `m`, `poster` (1600), `poster2x`, `posterM`, `alt`, `caption`; single-quoted attribute, so no apostrophes inside), `figure.frame.player[data-player]` (`img[data-player-poster]`, `<video>` without src, `[data-player-toggle]`, `[data-player-expand]`, `[data-player-play]`), `figcaption.player-captions` with 4 × `[data-chapter-caption="n"]` and the provenance line. `.inside-static` holds the no-JS figures. Keep only chapters whose clips exist (and their static figures); the script also hides a chapter whose clip fails to load.
- **Get IVE**: `section#install` with the alias anchors `#waitlist` and `#get-ive` (`span.anchor-alias`), `.get-paths` with two `.panel.get-path` (Mac panel: plain DMG link, no `data-mac-download`).
- **Maker** (`madeby.js`): `section#aiforeu[data-madeby]` with `video[data-madeby-video]` (`preload="none"`, `poster`, `data-src-large`, `data-src-small`) inside `.maker-frame`, buttons `[data-madeby-sound]` and `[data-madeby-replay]` (ship `hidden`).

## 11. Known points for QA and the owner

- `--accent-fill` dark is `#3A66FA` instead of the brief's `#3D6BFF`: white on `#3D6BFF` is 4.43:1, below the brief's own 4.5:1 rule (5.8); `#3A66FA` gives 4.71:1. Light stays `#1647FF` (6.2:1).
- `--text-4` (brief values) was 3.87:1 dark and 3.61:1 light on `--bg`. QA round 1 lifted it to `#7C828C` dark and `#686E77` light: at least 4.5:1 on all three grounds (also in 404.html's own copy of the tokens).
- Each autoplaying frame has a pause button (top right, next to Expand): WCAG 2.2.2 for muted loops longer than five seconds. It is a small addition to the brief's "Expand" control.
- The header hides its wordmark while the opening is pinned (`html.mark-dark`) and fades it in at the hand-over (brief 4.1: "the small wordmark simply fades in with the header"). During the zoom out of the V it gets a dark glass ground so the controls stay legible over the white strokes.
- Measured with the reference page at 1440×900: 9,477px tall (target about 9,100), 390×844: 7,877px; no horizontal overflow; no console errors in dark and light; reduced motion and no-JS render their static states.
