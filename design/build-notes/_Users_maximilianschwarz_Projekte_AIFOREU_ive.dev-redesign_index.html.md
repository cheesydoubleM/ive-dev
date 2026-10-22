# index.html: requests for shared files

Builder of index.html, build round 1 (2026-10-22). index.html is assembled from `design/partials/home-scenes.html` (header = `nav.html` + `href="#top"`, footer = `footer.html`, both byte-checked). The only change to the partial's markup: `loading="lazy"` on the Inside IVE player poster (`img[data-player-poster]`). Shared files were not edited.

## 1. home.css: the chapter rail sits 20px too far left on phones (please apply)

Below 1024px `.chapters` is a scroll strip with `margin-inline: calc(-1 * var(--gutter)); padding-inline: var(--gutter); scroll-snap-type: x mandatory`, and its items have `scroll-snap-align: start`. Without a scroll padding, mandatory snapping scrolls the strip so the first chapter's start meets the edge of the scrollport. Measured at 390×844 (iPhone emulation): `scrollLeft` 20, "01 Start" at x 0 (flush with the screen edge, while the heading is at x 20). After a tap on "04" the button's right edge is at x 400 of 390. 820px and 1024px are not affected because all four chapters fit.

Fix (one line in the `@media (max-width: 1023.98px)` block of `.chapters`, tested with an injected style: first chapter at x 20, chapter 4 ends at x 370):

```css
scroll-padding-inline: var(--gutter);
```

Before and after: `rail-phone-now.png`, `rail-phone-fix.png` in the build step's scratch folder (`.../scratchpad/redesign/build1/index-home/`).

## 2. Phone transfer before any video is above the 600 KB target (optional)

Measured with Chromium, local server, uncompressed: desktop 1440 645 KB, iPhone 821 KB. Gzip on GitHub Pages takes about 115 KB off the HTML, CSS and JS, so desktop is about 530 KB and phones about 705 KB on the wire. On phones the Why IVE panel posters (`hero-board@2x.webp` 175 KB, `why-attention@2x.webp` 176 KB, `review-why@2x.webp` 49 KB) load with the first paint: they are `loading="lazy"`, but the Why section sits inside Chromium's lazy margin (about 3,000px). If the budget matters, home.js could attach the Why poster sources the same way it attaches the clips (one viewport away). Not a markup change, so left as is.
