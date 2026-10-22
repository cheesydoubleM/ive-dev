# Round 2, clips check: notes for files I do not own

Checker for the clips area (`assets/app/`, `scripts/demos/`), 2026-10-23. The builder's notes are
in `round2-media.md`; everything there still holds, with the corrections below.

## What I changed in my area

- **Phone cuts cut late at view changes (fixed).** Every hard camera cut after a click landed two
  frames after the new view appeared, so the new view showed for 2 frames (67 ms) at the old
  position and then jumped: loop-task-m at the task window and at Run details, loop-canvas-m at
  the canvas and at Run Detail, review-m at the fullscreen review. `recorder.mjs` now stores
  `clickFrame` (first frame after the release) and `camera.mjs` takes `from`; the clip scripts
  cut there. `loop-task-m.mp4`, `loop-canvas-m.mp4` and `review-m.mp4` are re-encoded from the
  builder's kept frames with the corrected cuts (same lengths, same takes, nothing re-recorded).
- **loop-canvas-m opened on "line Editor" (fixed).** The first camera position cut the editor
  title; it now starts 10 px before "Pipeline Editor", which also fits the first column of presets.
- **loop-canvas-m poster was taken mid-pan (fixed).** Verify was cut in half; the poster now waits
  until the pan has landed (Verify, Evaluate and Fix whole). New `loop-canvas-m@2x.webp`.
- README updated (camera paragraph, sizes, the 0.60 note below).

## Requests for other owners

1. **product.html (true claims).** The loop-task video's aria-label ends "the second check passes
   and the result is accepted". The clip shows "Accept result" but does not click it (accepting
   closes the window; the clip ends on Run details). Replacement: "Recording of the Auto-fix loop
   on a guided task: the plan is approved, a testing agent checks the work, the failed check goes
   back with its report, and the second check passes."
2. **index.html, opening region (copy rules).** `aria-label="IVE — Integrated Vibecoding
   Environment"` on `#mark` and the sr-only line below it carry an em dash. Replacement:
   "IVE, the Integrated Vibecoding Environment".
3. **index.html, static Inside IVE figure.** Same as round2-media.md item 3: the loop-task alt says
   "every stage passed", the poster shows Fix pending. Replacement: "The run details of a guided
   task: completed in the second cycle, every stage that ran passed."
4. **site.css, frame buttons on touch (agree with round2-media.md item 1).** Measured at 390x844:
   play and expand cover the top right 92x48 CSS px of the 350x467 frame and stay at opacity 1 on
   touch. Moving them below the frame on `(hover: none)`, as the hero now does, frees the corner.
5. **product.css, Loops pair.** On a 390 px phone the two loop frames are 301x401 (other rows
   350x467), so their app text shows at 0.60 of its size instead of 0.70. At 360 px they are
   275 px wide, and the site's buttons then cover 167x87 of the cut's 498 CSS px, more than the
   150x76 the camera keeps clear (`SITE_CONTROLS`), so the end of "Cycle 2 of 20" can sit under
   them there. At 1440 each loop frame is 588 px wide for a 1600 px recording (0.37; other rows
   0.50), small for reading app text. Full width frames on phones would match the other rows; on
   desktop the 3:4 `-m` cuts would read far larger in a pair of narrow frames, if that
   composition is wanted.
6. **Observation (site.js, by design).** In the desktop Loops pair only one clip plays at a time;
   loop-canvas shows its poster until its own play button is pressed, then plays and pauses
   loop-task. Not a broken clip.
7. **Cache.** Round2-media.md item 2 applies to the files I re-encoded too: `loop-task-m.mp4`,
   `loop-canvas-m.mp4`, `loop-canvas-m@2x.webp`, `review-m.mp4`.
