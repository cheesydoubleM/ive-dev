# ive.dev

Static source for the IVE product site: a local control room for parallel coding work. There is no build step or framework.

## Preview

From this folder, run:

```sh
python3 -m http.server
```

Then open `http://localhost:8000/`. The marketing pages can also be opened from `file://`.

## File map

- `index.html`: homepage. The opening scene (agent swarm, board, IVE unfolds into "Integrated Vibecoding Environment"), the hero with the dark board rendered live, Why IVE (four reasons, pinned), Inside IVE (a reel of six generated scenes of the app's interface in its light theme: a session's terminal, ten terminals on the board, start and queue, Auto-fix loop, Pipelines, loop detection), Get IVE (`#install`; `#waitlist` and `#get-ive` stay as alias anchors) and the AIFOREU maker strip
- `product.html`: every view and every loop of the app, one row each, as generated demos of the interface in the app's light theme; the first row is the Terminal, the Board row shows ten terminal tiles
- `download.html`: Mac app, terminal install (`#terminal`), source install, requirements, removal and five questions
- `architecture.html`: engineering architecture page
- `imprint.html` and `privacy.html`: legal provider information and site-specific privacy notice (their `<main>` is unchanged by the redesign)
- `404.html`: self-contained not-found page (own hashed style and script, root-absolute URLs)
- `site.css`, `site.js`: shared design system and behaviour for every page (tokens, header, footer, buttons, frames, theme, download logic, copy buttons, the still viewer)
- `opening.css`, `opening.js`: the homepage opening scene
- `home.css`, `home.js`: homepage sections, Why IVE and the Inside IVE reel
- `demo.css`, `demo.js`: the app previews in the page frames (iframes of `assets/demo/r5/frame.html`): sharp automatic scenes that always play in view, one Pause/Play next to each, the reel's chapters; loaded by `index.html` and `product.html`
- `try.html`, `try.js`: "Try it yourself": the IVE app built into the site at window size under a slim strip (brand, the introduction's Skip/Again, Back to ive.dev), opened from the header of every page, the hero, the Try band, the Product and Download heads and the footer; `assets/demo/r7/frame.html?mode=app&tour=1`
- `madeby.js`: the AIFOREU logo film in the maker strip
- `assets/phone/`: the iPhone mockup's device frame (from the mehrmal site), used by the IVE for iPhone section on Home, Product and Download. The iPhone app is not released: the site says "Coming soon to the App Store" and carries no install or build instructions (owner, 2026-10-24).
- `assets/demo/`: the app demos (rounds 4 to 7, 23/24 Oct 2026). Two versioned runtime folders, because the CDN caches these files for hours and a release that changes a module graph gets a new folder: `r5/` is the previews' runtime (unchanged since round 5), `r9/` the app's (round 7: the Board opens as terminals, every control works locally: `lib/mod-ui.js`, `mod-session.js`, `mod-settings.js`, Codex's review/pipelines/flow modules; r9 differs from r8 only in the Phone view's copy; `r6/` and `r7/` are frozen copies of earlier nights, kept while cached `try.js` copies still point there; remove them after 2026-10-24) (`mode=app`, with the introduction `lib/mod-tour.js`): `app.css` is the IVE 1.0.17 frontend's compiled stylesheet (only the font URLs rewritten), `fonts/` its Inter and JetBrains Mono, `frame.html` + `frame.js` the demo document (one preview scene or the app per iframe, `?scene=…&theme=light|dark[&mode=app][&tour=1][&chip=parent][&variant=hero][&minScale=0.8][&at=seconds]`), `lib/` the markup components copied from the app's DOM (`ui.js` shell, sidebar, header, session screen; `board.js`, `home.js`, `taskflow.js`, `pipeline.js`, `review.js`), the DOM terminal (`term.js`), the timeline of the previews (`timeline.js`), the DOM morph (`dom.js`), and the interactive app (`app.js` core over `data.js`, the modules `mod-review.js`, `mod-pipelines.js`, `mod-flow.js`): Home, Board, sessions, terminals you can type into, canned agent replies, Review, Pipelines, the guided task; `scenes/` one deterministic script per preview scene (`board`, `attention`, `terminal`, `terminals`, `start`, `autofix`, `pipelines`, `loopdetect`, `review`); `posters/` the generated poster images (`scripts/demos/posters.mjs`). No recording plays anywhere; the Orbit project, its sessions and the CLI-style terminal text are labelled demo data
- `assets/app/`: the three dark stills of the Product page (`still-model@2x.webp`, `still-mode@2x.webp`, `still-palette@2x.webp`); the recordings that lived here until round 3 are gone (git history keeps them)
- `assets/aiforeu/`: the AIFOREU logo film and its poster
- `scripts/demos/`: tooling around the real IVE frontend on its isolated test transport: `snapshot.mjs` writes DOM dumps and screenshots of every state of a story (the references the generated scenes copy their markup from), `posters.mjs` renders the generated scenes to poster images, `record.mjs` + `lib/recorder.mjs` is the former frame-by-frame recorder (kept; its `clips/` are the storyboards of the scenes)
- `design/`: redesign brief, research and shared partials (`design/partials/USAGE.md`); not published
- `install.sh`: the one-line installer, published at `https://ive.dev/install.sh` (not excluded in `_config.yml`)
- `assets/og.html`: 1200×630 Open Graph image source
- `assets/fonts.css` and `assets/fonts/`: self-hosted Archivo, Source Sans 3 and IBM Plex Mono, including OFL license texts
- `DESIGN.md`: binding visual and interaction contract
- `_reference-old-site-copy.txt`: product capability truth source

## Open Graph image

Serve the folder, open `assets/og.html` in a browser at exactly 1200×630, and capture the viewport to `assets/og.png`. The HTML is the editable source; do not hand-edit the PNG.

## Product truth

- IVE is open source under the Apache 2.0 license. The public repository is `https://github.com/michael-ra/ive`.
- The primary homepage action for Mac users is the Mac app: https://github.com/michael-ra/ive/releases/latest/download/IVE-macOS-arm64.dmg (latest GitHub release of michael-ra/ive, Apple silicon, macOS 13.5 or newer, signed by AIFOREU GmbH and notarized by Apple). Linux, Intel Macs and developers use `curl -fsSL https://ive.dev/install.sh | bash` (puts the code in `~/.ive`, installs its dependencies, builds the app, adds an `ive` command in `~/.local/bin`; `ive` then runs IVE in the background), or from source with `git clone https://github.com/michael-ra/ive.git`, `cd ive`, `bash install.sh`, `bin/ive`.
- Requirements for the one-line installer and the source path: macOS or Linux, Python 3.11+, Node.js 22.12+ with npm, Git, and at least one supported coding CLI. The Mac app needs none of the first three: Apple silicon (M1 or newer), macOS 13.5 or newer, and at least one coding CLI you are signed in to. It opens in its own window, so no terminal or browser tab is needed. Telemetry is off by default.
- Do not promise Windows support, an Intel Mac app, a community, stars, or contributors. Show no version number or file size for the Mac app.
- Supported agents are Claude Code, Codex and Gemini (Antigravity CLI). The active CLI profiles in IVE 1.0.17 are Claude Code, Codex CLI and Antigravity CLI, Google's agent CLI with Gemini models (`backend/cli_profiles.py`, checked 2026-10-22). The standalone Gemini CLI profile is inactive in 1.0.17, so write "Claude Code, Codex and Gemini (Antigravity CLI)" in full lists, "Claude Code · Codex · Gemini" in short lists and chips, and never "Gemini CLI" alone. Models depend on the installed CLI and account; illustrations name only Haiku, Sonnet, Opus and the Gemini Pro and Flash models (`gemini-3.1-pro`, `gemini-3.5-flash`).
- The app demos are generated on the page: the IVE 1.0.17 interface rendered live from the app's own stylesheet and DOM markup (copied from the real frontend on its isolated test transport), driven by deterministic scripts, scrollable and selectable. The Orbit project, its sessions, conversations and the CLI-style terminal text are a clearly labelled demonstration; no provider ran and no live execution success is claimed. The opening scene elsewhere on the page is an illustration. Owner decision 2026-10-23: no recordings of the app anywhere on the site.
- Reverify compatibility against the app before changing provider claims.
- Use only documented totals: 140+ API routes, 40+ shortcuts, 35+ MCP tools, 30+ event types, 20 RALPH iterations maximum, 8,000+ skills, a 6-column board, a 9-step package scan, 3 access modes, and 4 memory types. The package scan (AVCP) is off by default since IVE 1.0.17; always call it optional.
- Do not add social proof, customer claims, star counts, integrations, models, metrics, or capabilities that are absent from the product-truth source.

## Installer distribution

The only installer published from this repository is the shell script `install.sh` at the site root. It installs IVE from the public source repository and must stay byte-identical to `get.sh` on the main branch of michael-ra/ive. The Mac app is a release asset of michael-ra/ive; the site only links it. Do not commit application bundles, DMG/PKG/IPA installers, release ZIP archives, or private app source here.

## Beta waitlist (removed)

Until 2026-10-22 the homepage collected beta signups through a Cloudflare Worker
(`ive-beta-waitlist`) with a D1 database of the same name. IVE is open source now
and the homepage offers the install instead. On 2026-10-22 the stored entries, the
D1 database and the Worker were deleted, and the signup code was removed from this
repository; the privacy notice no longer mentions the waitlist. Its last state is
in the git history before that removal. Do not bring back a signup form without a
new backend and a matching privacy notice.
