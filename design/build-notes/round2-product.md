# Round 2, product: changes needed outside product.html and product.css

product.html and the new product.css (`?v=20261023b`) are done. The page now has four compositions instead of seven identical rows: rows (Home, Board), the loop pair (Auto-fix loop and Pipelines under "Loops."), rows (Review, Loop detection), the stills group with the row text as its first tile (Models, modes and keys), and "Also in the app." as a ledger on an inset band. Every row's copy, alt text, aria-label, caption and clip is unchanged; the only new words are the pair heading "Loops." (marketing total 326 of 326). These follow-ups touch files I do not own.

1. **site.js: let the two loop clips take turns (recommended).**
   `syncInline` (the round 2 version in the worktree) plays one visible clip and keeps the active one on a tie. Side by side, both pair frames are always equally visible, so on desktop Pipelines never starts by itself (product.css keeps its Play and Expand controls visible while it waits; the visitor's Play click works). Phones are fine: the strip shows one card at a time and swiping hands over. Proposal: frames with the same `data-clip-group` take turns, one full pass each. Tested against the current site.js by serving a patched copy in flight (Playwright route, nothing written): at 1440 Auto-fix loop plays 0 to 17 s, then Pipelines 0 to 15.5 s, then Auto-fix loop again; at 390 the visible card repeats on its own; no console errors.
   ```js
   // in Clip(), replacing the registerInline line: grouped clips do not loop; a finished pass hands the turn on
   var group = frame.getAttribute('data-clip-group');
   if (group) {
     video.loop = false;
     video.addEventListener('ended', function () { clip.turnDone = true; syncInline(); });
   }
   IVE.registerInline({ video: video, element: frame, group: group, clip: clip, wantsPlay: clip.wantsPlay, play: clip.play });

   // in syncInline(), right before `activeInline = best;`
   if (best && best.group && best.clip && best.clip.turnDone) {
     best.clip.turnDone = false;
     var peers = inlinePlayers.filter(function (c) {
       return c.group === best.group && c.wantsPlay() && Math.abs(visibleRatio(c.element) - bestRatio) <= 0.01;
     });
     best = peers[(peers.indexOf(best) + 1) % peers.length] || best;
   }
   ```
   An ended clip is paused, so `best.play()` starts it from the beginning. Then add `data-clip-group="loops"` to the two `figure.loops-media` in product.html (I can do that once site.js ships it; without the script change the attribute must stay off, or the clips would stop after one pass).

2. **site.css: the poster after a pause (optional, all pages).**
   product.css has `.frame.is-paused:not(.is-paused-by-user) .frame-video { opacity: 0; }`: a clip the page pauses (scrolled away, another clip took over) fades back to its chosen poster instead of freezing on an early frame (the Home screen for start-queue and loop-task, QA round 1 weak spot 1). A clip the visitor pauses keeps its frame. If the homepage wants the same, the rule can move to site.css section 8 and out of product.css.

3. **Assets (recordings owner).**
   - `still-palette@2x.webp`: its 16px side margins show fragments of the page behind the dimmed backdrop ("ity", "gle" at the left, a chevron at the right). product.css covers x 0 to 2.62% and 97.1% to 100% with the backdrop colour `#050506` (`.bento-palette::after`). A re-crop to x 32 to 1072 (2x px) would make that overlay unnecessary. **If this still is re-cropped or re-captured, delete `.bento-palette::after`**, or it covers the palette's own border.
   - `still-model@2x.webp`: below the menu the still is plain app ground except the 2px divider at x 174 to 176 (`#262A33`). In the stills group the model tile is taller than the still, so product.css continues that line in the tile background (`.bento .bento-model`, percentages of the still width). A taller re-crop (the same window, about 380 CSS px high) would remove the need. **If this still changes, delete that gradient** (a line in the wrong place is worse than none).
   - The loop-task clip still opens on the Home screen for about a second (QA round 1 weak spot 1); in the pair that is the first thing that moves.

4. **Docs that describe the old Product page.**
   - `DESIGN.md` "Hard bans" and the composition note say "Bento grids … are out". The Product page now groups the three stills with the row text as one tiled object (real UI near 1:1, no icons, no feature cards). Suggested wording: "Bento grids of feature cards are out; the Product page's stills group (three real stills plus the row text, one radius, shared hairlines) is the only tiled group." Also update the line "Product rows: hairlines between rows …" to name the four compositions above.
   - `design/partials/USAGE.md` section 8 (Product rows, Three stills, Also in the app) still shows the round 1 markup. product.html now uses `.p-flow`, `section.loops > .loops-pair > section.loops-item` (frame + `.loops-text` with h3 and p), `section#controls > .bento` (`.bento-text`, `figure.still.bento-model|bento-mode|bento-palette`) and `section.also > .also-inner > dl.also-list`.
   - `design/REDESIGN-BRIEF.md` 3.2 still describes seven rows and three columns for "Also in the app." A changelog line would stop a later pass from rebuilding the list.

5. **QA scripts.** The round 1 word-count script reads `.row`, `.row-text p` and `.cols-3`. For product.html it now also needs `.loops-item` (h3 + p), `.bento-text` (h2 + p), `#loops-title` and `.also-list` (dt + dd). Measured on the rendered page: H1 5, lead 12, Loops. 1, rows 3/36 · 1/31 · 1/18 · 2/33, pair 2/39 · 1/34, stills 4/33, Also 4 + 22 · 16 · 28 = 326 (ceiling 326); closer 6 (functional).

6. **Cache versions.** product.html loads `fonts.css`, `site.css` and `site.js` with `?v=20261023a` and `product.css` with `?v=20261023b`. site.js has already changed in the worktree in round 2 (shared `syncInline` playback, 1600px inline sources), while every page, product.html included, still loads it as `?v=20261023a`. The integration step bumps `site.js?v=` on all pages at once (product.html too); I left it alone so the pages stay consistent. product.html passes my checks with the new site.js (see below).

7. **Verification of product.html with the round 2 site.js** (2026-10-22, preview 127.0.0.1:4180): 170 own checks (320, 390, 768, 1024, 1280, 1440, 1920 in dark and light: no overflow at any scroll step, no console errors, no CSP violations, no external or failed requests, bento tiles fit, pair side by side at 1024 and up and a scroll strip below; motion at 1440 and 390; reduced motion; no JS; WebKit 390 and 1440), plus Codex's `review/codex-audit.mjs` scoped to product.html from a scratch copy (168 checks, 0 issues). Screenshots: `/private/tmp/claude-501/-Users-maximilianschwarz/5351d8ba-945e-47c6-9f76-e8ef6642bb91/scratchpad/redesign/round2a/product/final/`.

## Checker addendum (round 2A, product)

- **Done in product.html:** `site.js?v=20261023b` (was `a`). index.html already loads site.js as `b`, and site.js changed after the live commit 8bfb15e, so the old `a` URL could serve a cached old site.js on the new page for up to 10 minutes after the push. Item 6 above is settled for product.html; download, architecture, imprint and privacy still load `site.js?v=20261023a` and need the same bump in the integration step.
- **Independent checks passed** (Chromium 320 to 1920 dark and light, iPhone 13 emulation at 390, WebKit 390 and 1440, reduced motion, no JS): no console errors, no CSP events (the four WebKit style-src reports come only from Playwright's screenshot style injection and vanish without screenshots), no overflow, no external or failed requests, marketing words 326, no dashes, no AI vocabulary. Playback: one clip at a time, page paused clips fade to the poster, a visitor pause keeps the frame and hands playback to the other loop, the phone strip hands over on swipe. Screenshots: `/private/tmp/claude-501/-Users-maximilianschwarz/5351d8ba-945e-47c6-9f76-e8ef6642bb91/scratchpad/redesign/round2a/product/checker/`.
- **Round 2B (light recordings) must revisit product.css:** `.bento` hairline `#202328`, `.bento .still` ground `#0E1014`, `.bento .bento-palette` ground `#050506`, the `.bento-palette::after` edge cover and the `.bento-model` divider gradient (`#262A33` at 33.984% to 34.375%) all match today's dark stills pixel for pixel. With light stills they turn into dark bars and a stray line. Also check that new `-m` files stay 3:4 (900x1200), because the frame crops to 3:4 on phones.
