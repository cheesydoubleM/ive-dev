# download.html: build notes (round 1)

Page built from the brief 3.3 on the shared foundation. Header and footer are byte-identical copies of `design/partials/nav.html` and `footer.html` (builder comments stripped) plus `aria-current="page"` on the Download nav link and on the footer Download link (USAGE 2 allows both). No `data-install-href` on the header button, unlike the Codex draft: USAGE says no per-page edit, and site.js already sends it to `download.html#terminal`.

Deliberate choices beyond the USAGE snippets:
- The three panel labels are `<h2 class="label">` instead of `<span class="label">`, so screen reader heading navigation reaches Mac app, Terminal, From source and Questions. Computed style equals span.label except letter-spacing (see request 2).
- Section ids: `#mac`, `#terminal`, `#source`, `#questions`. No `#install` on the page.
- The uninstall path in the last answer carries `<wbr>` after each slash so it wraps at 390px without overflow.

Requests for shared files (optional, nothing is broken without them):
1. site.js, download logic: on a page that has `#terminal`, use `#terminal` as the install target, so the extensionless URL ive.dev/download (GitHub Pages serves it) scrolls in place instead of loading /download.html#terminal again:
   `var installTarget = document.getElementById('install') ? '#install' : (document.getElementById('terminal') ? '#terminal' : 'download.html#terminal');`
2. site.css: `.label` (and `.kicker`) should set `letter-spacing: normal`. An `h2.label` currently inherits h2's -0.02em (-0.24px at 12px).
