# ive.dev

Static source for the IVE product site: a local control room for parallel coding work. There is no build step or framework.

## Preview

From this folder, run:

```sh
python3 -m http.server
```

Then open `http://localhost:8000/`. The marketing pages can also be opened from `file://`; signup requires the deployed Cloudflare endpoint.

## File map

- `index.html` — 10-block homepage: the IVE mark unfolds into “Integrated Vibecoding Environment”, then GOAL → PLAN → WORK → CHECK → REVIEW
- `architecture.html` — engineering architecture page using the same design system
- `imprint.html` and `privacy.html` — legal provider information and site-specific privacy notice
- `404.html` — self-contained not-found page
- `styles.css` — shared design system and page styles
- `script.js` — dependency-free theme, scroll-driven mark, sequential Why IVE benefits, run-story, and use-case chooser
- `waitlist.js` — accessible signup, loading, failure/retry, and success states
- `worker/` — Cloudflare Worker, D1 schema, and signup tests
- `scripts/export-waitlist.mjs` — authenticated CSV export; never exposes the list publicly
- `assets/og.html` — 1200×630 Open Graph image source
- `assets/fonts.css` and `assets/fonts/` — self-hosted Archivo, Source Sans 3 and IBM Plex Mono, including OFL license texts
- `DESIGN.md` — binding visual and interaction contract
- `_reference-old-site-copy.txt` — product capability truth source

## Open Graph image

Serve the folder, open `assets/og.html` in a browser at exactly 1200×630, and capture the viewport to `assets/og.png`. The HTML is the editable source; do not hand-edit the PNG.

## Product truth

- The homepage presents IVE as a beta with access by invitation. It must not promise a public app repository, an open-source release, a license, or a direct download. The separately shared download page is the explicit exception below.
- The primary homepage action is joining the beta waitlist. Email is required; name is optional. No release date or immediate-access promise.
- The separately shared `/download/` page offers the owner's explicitly approved public macOS beta installer. Its verified release facts take precedence over the older invitation-only wording for this page only. The homepage keeps the waitlist flow.
- Supported integrations are Claude Code and Gemini CLI. Supported models are Haiku, Sonnet, Opus, Gemini Pro, and Flash.
- Additional CLIs or models may appear only as explicitly labeled roadmap items, never as current support.
- Use only documented totals: 140+ API routes, 40+ shortcuts, 35+ MCP tools, 30+ event types, 20 RALPH iterations maximum, 8,000+ skills, a 6-column board, a 9-step package scan, 3 access modes, and 4 memory types.
- Do not add social proof, customer claims, star counts, integrations, models, metrics, or capabilities that are absent from the product-truth source.

## Shared beta download

`https://ive.dev/download/` is the stable address to send to testers. It is accessible without an account and marked `noindex`; anyone with the link can download, and the GitHub release itself is public. This is not an invitation gate.

The current installer is IVE 1.0.1 for Apple Silicon, macOS 13.5+. Its app is Developer ID signed and Apple-notarized. It includes interactive onboarding; AI sessions require separately installed Claude Code or Codex and provider authentication. Windows, Linux and Intel installers are not offered here.

The binary and its checksum are GitHub Release assets on this public website repository, tagged `macos-v1.0.1-beta`. The private app repository is separate. GitHub's automatic source archives contain this website only. App installation packages are never committed to this repository.

For a new version: publish its notarized DMG and checksum as a new prerelease, verify an unauthenticated download against the local SHA-256, then update the version, file size and release links in `download/index.html`. Publish the page only after the asset works. Keep `/download/` stable. The current app does not automatically install updates.

## Beta waitlist

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
