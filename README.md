# ive.dev

Static source for the IVE product site: a local control room for parallel coding work. There is no build step or framework.

## Preview

From this folder, run:

```sh
python3 -m http.server
```

Then open `http://localhost:8000/`. The marketing pages can also be opened from `file://`.

## File map

- `index.html` — homepage: the agent tunnel opening, IVE unfolds into “Integrated Vibecoding Environment”, then the hero, Inside IVE (five app recordings and a tunnel into a failed check's feedback loop), Why IVE, two app details, GOAL → PLAN → WORK → CHECK → REVIEW, merge, review with the real code review, what you bring (terminal, models, tokens), run chooser, FAQ, and the open-source install section (`#install`; `#waitlist` and `#get-ive` stay as alias anchors)
- `behind.css`, `behind.js` — the early illustrated board-to-session-to-feedback tunnel within Inside IVE, keyboard controls, and static fallbacks
- `showcase.css`, `showcase.js` — styles, tabs, playback and the full-size viewer for the recorded app demos, on the tokens of `styles.css`
- `assets/app/` — recorded application demos (`<view>.mp4` at 3200×2000, `<view>-s.mp4` at 1600×1000, lossless WebP posters); made by `scripts/demos/record.mjs`
- `scripts/demos/` — the recorder: the real IVE frontend on the isolated test transport, driven frame by frame (`lib/recorder.mjs`), one script per clip in `clips/`
- `architecture.html` — engineering architecture page using the same design system
- `imprint.html` and `privacy.html` — legal provider information and site-specific privacy notice
- `404.html` — self-contained not-found page
- `styles.css` — shared design system and page styles
- `script.js` — dependency-free theme, scroll-driven mark, sequential Why IVE benefits, run-story, and use-case chooser
- `install.sh` — the one-line installer, published at `https://ive.dev/install.sh` (not excluded in `_config.yml`)
- `waitlist.js` — the retired beta signup script; no page loads it since 2026-10-22, kept with its backend
- `worker/` — Cloudflare Worker, D1 schema, and signup tests
- `scripts/export-waitlist.mjs` — authenticated CSV export; never exposes the list publicly
- `assets/og.html` — 1200×630 Open Graph image source
- `assets/fonts.css` and `assets/fonts/` — self-hosted Archivo, Source Sans 3 and IBM Plex Mono, including OFL license texts
- `DESIGN.md` — binding visual and interaction contract
- `_reference-old-site-copy.txt` — product capability truth source

## Open Graph image

Serve the folder, open `assets/og.html` in a browser at exactly 1200×630, and capture the viewport to `assets/og.png`. The HTML is the editable source; do not hand-edit the PNG.

## Product truth

- IVE is open source under the Apache 2.0 license. The public repository is `https://github.com/michael-ra/ive`.
- The primary homepage action for Mac users is the Mac app: https://github.com/michael-ra/ive/releases/latest/download/IVE-macOS-arm64.dmg (latest GitHub release of michael-ra/ive, Apple silicon, macOS 13.5 or newer, signed by AIFOREU GmbH and notarized by Apple). Linux, Intel Macs and developers use `curl -fsSL https://ive.dev/install.sh | bash` (puts the code in `~/.ive`, installs its dependencies, builds the app, adds an `ive` command in `~/.local/bin`; `ive` then runs IVE in the background), or from source with `git clone https://github.com/michael-ra/ive.git`, `cd ive`, `bash install.sh`, `bin/ive`.
- Requirements for the one-line installer and the source path: macOS or Linux, Python 3.11+, Node.js 22.12+ with npm, Git, and at least one supported coding CLI. The Mac app needs none of the first three: Apple silicon (M1 or newer), macOS 13.5 or newer, and at least one coding CLI you are signed in to. It opens in its own window, so no terminal or browser tab is needed. Telemetry is off by default.
- Do not promise Windows support, an Intel Mac app, a community, stars, or contributors. Show no version number or file size for the Mac app.
- Supported integrations are Claude Code, Codex, and Gemini CLI (app profiles in `backend/cli_profiles.py`, checked 2026-10-17). Models depend on the installed CLI and account; illustrations name only Haiku, Sonnet, Opus, Gemini Pro, and Flash.
- The app demos are recordings of the actual IVE frontend (the installed app build) on the isolated test transport from the app's own test suite. The Orbit project, its sessions and conversations are a clearly labelled demonstration; no provider ran and no live execution success is claimed. The animated scenes elsewhere on the page are illustrations.
- Reverify compatibility against the app before changing provider claims.
- Use only documented totals: 140+ API routes, 40+ shortcuts, 35+ MCP tools, 30+ event types, 20 RALPH iterations maximum, 8,000+ skills, a 6-column board, a 9-step package scan, 3 access modes, and 4 memory types.
- Do not add social proof, customer claims, star counts, integrations, models, metrics, or capabilities that are absent from the product-truth source.

## Installer distribution

The only installer published from this repository is the shell script `install.sh` at the site root. It installs IVE from the public source repository and must stay byte-identical to `get.sh` on the main branch of michael-ra/ive. The Mac app is a release asset of michael-ra/ive; the site only links it. Do not commit application bundles, DMG/PKG/IPA installers, release ZIP archives, or private app source here.

## Beta waitlist (retired)

Since 2026-10-22 the website no longer shows the signup form; IVE is open source
and the homepage offers the install instead. The Worker, the D1 database and the
export below remain, because earlier signups are still stored (privacy notice 6a was removed on 2026-10-22; delete the stored entries).
The notes below describe that service as it was used up to then.

The website stays on GitHub Pages. Signup is handled by
`https://ive-beta-waitlist.intertrans-vorschau.workers.dev/api/waitlist` in
Maxi@aiforgov.eu’s existing Cloudflare account (`09e664eee5ea251d91f207aba07c29bf`).
The domain account has no database permissions, so the two services remain separate.
The Worker accepts POST requests from the website with a strict CORS origin allowlist,
validates email and consent, and saves entries in the `ive-beta-waitlist` D1 database
(EU jurisdiction). No client-side secrets, public list endpoint, or automated emails.
The HTML form also works without JavaScript. Duplicate emails return the same
confirmation and do not overwrite the existing entry.

The consent text is versioned `2026-10-03`. The service stores email, optional name,
signup time, and consent version. It does not save IP addresses in the list.
A honeypot and a per-IP limit of five requests per minute reduce automated abuse;
this is not email ownership verification. Review entries before sending invitations.
A daily scheduled task removes entries older than twelve months. Remove withdrawn
entries promptly, and delete completed invitation entries when no longer needed.

### Manage and export

In Cloudflare, open **Maxi@aiforgov.eu’s Account → Storage & databases → D1 → ive-beta-waitlist → waitlist**.

Database: `c96cd6f3-ef4e-455a-b1c7-0f29ec64eef3`.
[Open database](https://dash.cloudflare.com/09e664eee5ea251d91f207aba07c29bf/workers/d1/databases/c96cd6f3-ef4e-455a-b1c7-0f29ec64eef3).
The table is accessible only to authorized Cloudflare account users.

For a CSV that opens in Excel:

```sh
npm ci
npm run waitlist:export
```

The file is saved in the gitignored `waitlist-exports/` directory, with owner-only
permissions. CSV formula prefixes are escaped. Exported files contain personal
data; keep them private and include them when handling deletion requests.

### Validate and deploy the form backend

```sh
npm test
npx wrangler d1 execute ive-beta-waitlist --remote --file worker/schema.sql
npm run waitlist:deploy
```

Cloudflare authentication is required for database access and deployment. Website
changes deploy through the existing GitHub Pages `main` branch. Backend changes
must be deployed separately with Wrangler. Never deploy a signup UI before its
backend route has been verified.
