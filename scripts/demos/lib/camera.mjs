// The phone cut's camera: a 3:4 window of PHONE_CUT device pixels that follows the action in a
// recording of the phone window. Clips call `cam.to(r, x)` right before an action: a hard cut,
// or with `pan` seconds an eased move from where the camera was, starting at the current frame.
// A cut to a view that a click opened passes `from: r.clickFrame` (the first frame after the
// release, where the new view first shows), so the view never shows at the old position first.
// Positions are CSS px of the left (and top) edge; the encoder gets device px (x2).
import { PHONE_CUT } from './fixture.mjs';

// The site lays its play and expand buttons over the top right corner of a phone frame. On a
// 360 px phone they cover the last 150 CSS px of the 498 px cut in its top 76 px (on a 390 px
// phone 137 x 68). Text and buttons near the top of the window stay left of that corner.
export const SITE_CONTROLS = { right: 150, top: 76 };

export function createCamera(page, { cut = PHONE_CUT, dpr = 2 } = {}) {
  const { width, height } = page.viewportSize();
  const maxX = width * dpr - cut.w, maxY = height * dpr - cut.h;
  const clamp = (v, max) => Math.max(0, Math.min(max, Math.round(v)));
  const segments = [];
  const cam = {
    /** Width of the cut in CSS px. */
    span: cut.w / dpr,
    /** Moves the camera so its left edge is at CSS x (and its top edge at CSS y), from frame `from` on. */
    to(rec, x, { pan = 0, y = 0, from = rec.frameCount } = {}) {
      const seg = { from, x: clamp(x * dpr, maxX), y: clamp(y * dpr, maxY), w: cut.w, h: cut.h, pan };
      const last = segments.at(-1);
      if (last && last.from === seg.from) segments.pop();
      if (!last || last.x !== seg.x || last.y !== seg.y || last.from === seg.from) segments.push(seg);
      return cam;
    },
    /**
     * Left edge that keeps CSS box [x, x + w] in view, as close to `prefer` as possible. A box in
     * the top rows of the window also stays clear of the site's controls.
     */
    fit(box, prefer, margin = 12) {
      let lo = box.x + box.width + margin - cam.span;
      const hi = box.x - margin;
      if (box.y < SITE_CONTROLS.top) lo = Math.max(lo, box.x + box.width + 6 - (cam.span - SITE_CONTROLS.right));
      return Math.max(lo, Math.min(hi, prefer));
    },
    segments: () => segments.slice(),
  };
  return cam;
}
