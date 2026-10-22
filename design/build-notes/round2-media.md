# Round 2, media: notes for files I do not own

Area: the Inside IVE reel clips and the phone cuts (QA round 1, weak spots 1 and 2). I changed
only `assets/app/` and `scripts/demos/`. File names are unchanged, so index.html and product.html
keep working as they are. Details: `scripts/demos/README.md`.

What changed in `assets/app/`:

- `loop-task` and `loop-canvas` (master, `-s`, posters) re-recorded with the trim in the clip
  scripts. Chapter 2 now opens on "Needs your attention", chapter 3 on "Choose a Pipeline"; Home
  is only chapter 1's opening. The loop-task poster is now Run details (completed, Cycle 2 of 3),
  which is what the homepage's static alt text describes.
- All six `-m` files and their `-m@2x.webp` posters re-recorded in phone windows (768×664 for
  start-queue, loop-task, loop-detect and review; 1100×664 for loop-canvas; 1220×940 for
  hero-board). New size 996×1328, still exactly 3:4, so the `aspect-ratio: 3 / 4` frames need no
  change. On a 390 px phone app text is 0.70 of its size (round 1: 0.47 for start-queue,
  loop-task and loop-detect, 0.57 to 0.58 for the others).

Requests and observations for other owners:

1. **site.css, phone frame buttons (recommended).** On touch screens `.frame-controls` (play and
   expand, 2 × 36 px at the top right) are always visible and cover the top right corner of every
   phone clip: on a 360 px phone the last 150 CSS px of the cut in its top 76 px. Without a
   workaround that corner hides "Cycle 2 of 3" on loop-task's Run details and "Cycle 2 of 20" in
   the Pipelines toolbar. The recordings now work around it (the camera moves right once more
   for each cycle counter), but anything new in that corner will be hidden again. Moving the
   controls to the bottom right on `(hover: none)`, or fading them while a clip plays, removes
   the problem. If they move, tell the recordings owner: `SITE_CONTROLS` in
   `scripts/demos/lib/camera.mjs` and the two extra camera moves can go.
2. **Cache versions for the changed media (optional).** Media URLs carry no `?v=`. GitHub Pages
   serves them with a 10 minute max-age, so for up to 10 minutes after the push a phone can show a
   round 1 `-m` clip next to a round 2 poster (a visible jump when the clip starts). If wanted, add
   `?v=20261023b` to these references in index.html and product.html (posters in `srcset`,
   `data-src*`, the chapter JSON and the expand links): `loop-task.mp4`, `loop-task-s.mp4`,
   `loop-task.webp`, `loop-task@2x.webp`, the same four for `loop-canvas`, and every
   `*-m.mp4` / `*-m@2x.webp` (hero-board, start-queue, loop-task, loop-canvas, loop-detect,
   review).
3. **index.html, static Inside IVE figure (optional wording).** The loop-task alt text says
   "completed in the second cycle, every stage passed". The poster now matches it, except that Fix
   shows "pending" (it ran in cycle 1, not in cycle 2). Exact alternative: "The run details of a
   guided task: completed in the second cycle, every stage that ran passed."
4. **round2-product.md follow-ups.** Its item 3 ("The loop-task clip still opens on the Home
   screen for about a second") is done. Its note that `-m` files stay 900×1200 is outdated: they
   are 996×1328 now, still 3:4. On phones the reel chapters are longer than on desktop
   (loop-canvas-m 18.6 s, loop-task-m 16.5 s); the reel advances on `ended`, so nothing to change.
5. **Observation, not caused by this change.** On product.html at 390 px Chromium reports
   `assets/app/start-queue.webp net::ERR_ABORTED` in some runs (either theme). Most likely the
   first row's `<img>` fallback (it has no `loading="lazy"`) is requested early and dropped once
   the `<picture>` source for phones applies. No error in the console, nothing missing on the
   page.
6. **Stills not touched.** `still-palette@2x.webp` and `still-model@2x.webp` are as in round 1, so
   product.css's `.bento-palette::after` cover and the `.bento-model` divider still match.
7. **Files another agent added in my directories.** `scripts/demos/clips/hero-focus.mjs` and
   `assets/app/hero-focus*` (6 files, written 23 Oct between 00:19 and 00:21) are not mine and I
   left them alone. They use the round 2 recorder options (`viewport`, `{ phone }`), and their own CRF
   settings win over the phone default, so they keep working. `scripts/demos/README.md` does not
   describe them; their owner should add a row.

Checks (2026-10-23, preview 127.0.0.1:4180, Chromium, iPhone 13 emulation at 390×844 and
1440×900, dark and light): index.html and product.html without console errors or horizontal
overflow; every reel chapter and every product row loads its `-m` file at 996×1328 on the phone
and its `-s` file at 1600×1000 on desktop. Screenshots:
`/private/tmp/claude-501/-Users-maximilianschwarz/5351d8ba-945e-47c6-9f76-e8ef6642bb91/scratchpad/redesign/round2a/media/shots-final/`.
