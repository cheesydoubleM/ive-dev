# product.html: requests for shared files (build round 1, 2026-10-22)

product.html is built on the foundation as is. Nothing shared was edited. Four requests, each with the local workaround already in product.html.

1. `.stills` (site.css section 11): equal thirds shrink the ⌘K palette to about 0.48x at 1440 (app text about 7px), while the model menu sits at 1x. Proposal: model and mode stacked on the left, palette spanning both rows on the right. All three end up near 0.87x to 1.2x and the two columns are almost the same height:
   ```css
   .stills { grid-template-columns: 352fr 552fr; }
   .stills > .still:nth-child(3) { grid-column: 2; grid-row: 1 / span 2; }
   @media (max-width: 719.98px) { .stills { grid-template-columns: 1fr; } .stills > .still:nth-child(3) { grid-column: auto; grid-row: auto; } }
   ```
   No markup change needed (the figures are in the order model, mode, palette).
2. `.still figcaption` (the glass label at bottom-left) covers the last line of the mode menu ("Shared by Overview and Terminal") and the palette's key hints. Workaround: no figcaptions; each `<img>` has a full alt text. If labels are wanted back, put them in a strip under the image (`position: static`, hairline above) instead of on top of it.
3. `.still` uses `--bg-inset`, which is light in the light theme: a light patch showed under the short model still inside the dark group. Workaround: `class="still ink-dark"` on each figure (the group keeps the light ring and shadow). Suggest `.still { background: #0A0C0F; }` in site.css or noting `.ink-dark` in USAGE section 8.
4. `kbd` only gets the mono face. The keys in the copy (⌘K, ?, ⌘J, ⌘Esc) are `<kbd>`; a chip like `:not(pre) > code` would make "? lists every shortcut" read better: `kbd { font-size: .9em; padding: .08em .36em; border-radius: var(--r-chip); background: var(--code-bg); color: var(--text-1); }`.

USAGE snippet note: `<section class="wrap block section-rule" id="also">` puts the hairline flush against the last row, makes it 96px wider than the row hairlines (it spans the gutters), and with `.closer` doubles the gap to 192px. product.html uses `section.wrap.mt-96 > div.section-rule > h2.mt-96` instead: 96px, hairline at content width, 96px, then the closer's own 96px.

Asset notes for the recordings step:
- `still-mode@2x.webp`: the right 32px (x 672 to 704) show a text fragment ("foc") from the page behind the menu. A crop to about 664px wide removes it.
- USAGE section 7 says review has no `-m`; `review-m.mp4` and `review-m@2x.webp` (900×1200) exist now, so the Review row uses the portrait crop on phones like the others.
