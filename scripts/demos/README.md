# App demos for ive.dev

The five recordings in `assets/app/` are made from the **real IVE frontend**: the build
inside the installed app (`/Applications/IVE.app`, 1.0.12 at capture time, 19 Oct 2026) served to a headless Chromium
by the app's own isolated test transport (`frontend/tests/interactive-onboarding-fixture.mjs`
in the IVE repository). The transport answers the app's API and WebSocket calls with demo
data, blocks every other request, and never starts a provider, a backend, or writes to a
real IVE. Nothing in the UI is mocked up; every pixel is rendered by the app.

What the demo data is: project *Orbit*, four sessions (Build the workspace, Connect the
API, Check the sign-in flow, Review the changes), their conversations, one Claude Code
permission dialog (`npm test`), and the diff in the review clip, which is the real `git diff`
of `scripts/demos/lib/recorder.mjs` and `scripts/demos/clips/session.mjs` at capture time.

## Recording

```sh
node scripts/demos/record.mjs board session home review setup   # all five
node scripts/demos/record.mjs board                              # one clip
```

Environment: `DEMO_OUT` (default `assets/app`), `DEMO_FRAMES` (frame scratch directory).
Needs the Playwright that ships with the IVE frontend (`ive-team/frontend/node_modules`),
`ffmpeg` with libx264 and `cwebp` on the PATH. Paths to the app build, the fixture and
Playwright are in `lib/fixture.mjs`.

How it works (`lib/recorder.mjs`): Playwright's fake clock is installed on the browser
context before the app loads, so every timer the app sets is under control. The recorder
then advances the clock one frame (1/30 s) at a time and captures the viewport at
device-pixel-ratio 2 as a lossless PNG. Capture speed never matters, which is what keeps
3200×2000 frames sharp at a steady rate. Mouse and keyboard go through Playwright's raw
input; a drawn pointer shows where the clicks happen. ffmpeg encodes H.264 (CRF 19, and a
1600×1000 rendition at CRF 20) with a 0.7 s dissolve back into the first frame so the loop
has no cut. The first frame becomes the poster (`<view>@2x.webp`, `<view>.webp`).

Each clip in `clips/` is a short script: open the state, start the recorder, move, click,
type, push agent steps through the transport (`agentStep`), stop. `review.mjs` also exports
a still from the fullscreen review (`review-full`) for the Review chapter.

## Rules

- Keep the recordings honest: real frontend, labelled demo data, no provider claims.
- Re-record after an app release that changes the views; update the version in
  `index.html` (`?v=`) so caches refresh.
- Do not commit frame directories; they are scratch.
