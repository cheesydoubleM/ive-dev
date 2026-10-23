# ive.dev

Static source for the IVE product site: a local control room for parallel coding work. There is no build step or framework.

## Preview

From this folder, run:

```sh
python3 -m http.server
```

Then open `http://localhost:8000/`. The marketing pages can also be opened from `file://`.

## File map

- `index.html`: homepage. The opening scene (agent swarm, board, IVE unfolds into "Integrated Vibecoding Environment"), the hero with the dark board recording, Why IVE (four reasons, pinned), Inside IVE (a reel of four real recordings in the app's light theme: start and queue, Auto-fix loop, Pipelines, loop detection), Get IVE (`#install`; `#waitlist` and `#get-ive` stay as alias anchors) and the AIFOREU maker strip
- `product.html`: every view and every loop of the app, one row each, with real recordings in the app's light theme
- `download.html`: Mac app, terminal install (`#terminal`), source install, requirements, removal and five questions
- `architecture.html`: engineering architecture page
- `imprint.html` and `privacy.html`: legal provider information and site-specific privacy notice (their `<main>` is unchanged by the redesign)
- `404.html`: self-contained not-found page (own hashed style and script, root-absolute URLs)
- `site.css`, `site.js`: shared design system and behaviour for every page (tokens, header, footer, buttons, frames, theme, download logic, copy buttons, clip player and viewer)
- `opening.css`, `opening.js`: the homepage opening scene
- `home.css`, `home.js`: homepage sections, Why IVE and the Inside IVE reel
- `madeby.js`: the AIFOREU logo film in the maker strip
- `assets/app/`: recorded application demos (`<name>.mp4` at 3200×2000, `<name>-s.mp4` at 1600×1000, `<name>-m.mp4` 3:4 phone cuts, WebP posters, three stills; the light-theme takes at 60 fps are `<name>-light*` and `board-light*`, the dark takes `hero-board*`, `why-attention*` and `review-why*`); made by `scripts/demos/record.mjs` and `scripts/demos/stills.mjs`
- `assets/aiforeu/`: the AIFOREU logo film and its poster
- `scripts/demos/`: the recorder: the real IVE frontend on the isolated test transport, driven frame by frame (`lib/recorder.mjs`), one script per clip in `clips/`
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
- The app demos are recordings of the actual IVE frontend (the installed app build) on the isolated test transport from the app's own test suite. The Orbit project, its sessions and conversations are a clearly labelled demonstration; no provider ran and no live execution success is claimed. The animated scenes elsewhere on the page are illustrations.
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
