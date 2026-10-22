// Clip: the code review. Session "Review the changes": Review opens the side panel with the
// working diff and its file tree (two modified files), Fullscreen opens the full code review,
// Unified View switches the layout and the diff scrolls a little.
//
// Provenance: IVE app 1.0.17 · demo project · no provider ran. The diff is demo data written to
// match the Orbit story and the session's own `git diff --stat` (Sidebar.jsx +18 −2, api.js
// +24 −6); the transport serves it as the working-tree diff (controls.setChanges).
import { openDemo } from '../lib/fixture.mjs';

export const meta = { id: 'review', title: 'Every change comes back to you', seconds: 10 };
export const encoding = {
  loopFade: 0.5,
  crf: 26,
  poster: 'full',
  // A still of the fullscreen review (unified view), used where a clip cannot play.
  stills: [{ name: 'review-full', snap: 'full' }],
  // Why IVE beat 3: the fullscreen part only, cut to "FILES CHANGED · 2 files", the file tree and
  // the first hunk (CSS x 20-690, y 75-515 of the 1600x1000 window; 1340x880 device pixels).
  crops: [
    { suffix: '-why', trimFrom: 'fullscreen', x: 40, y: 150, w: 1340, h: 880, poster: 'full' },
    // Phones (3:4): the side panel with the file tree and the diff, then the fullscreen review's
    // "FILES CHANGED" list and the start of the diff.
    { suffix: '-m', scale: [900, 1200], poster: 'full', segments: [{ from: 0, x: 2000, y: 0, w: 1200, h: 1600 }, { from: 'fullscreen', x: 40, y: 60, w: 1200, h: 1600 }] },
  ],
};

const FILES = ['src/components/layout/Sidebar.jsx', 'src/lib/api.js'];
export const DIFF = `diff --git a/src/components/layout/Sidebar.jsx b/src/components/layout/Sidebar.jsx
index 4b1c2d3..9e8f7a6 100644
--- a/src/components/layout/Sidebar.jsx
+++ b/src/components/layout/Sidebar.jsx
@@ -1,6 +1,8 @@
 import { useMemo } from 'react'
 import ConnectionStatus from './ConnectionStatus'
 import CostToday from './CostToday'
+import ThemeToggle from './ThemeToggle'
+import { useTheme } from '../../hooks/useTheme'
 import { useShortcuts } from '../../hooks/useShortcuts'

 export default function Sidebar({ projects, onSelect }) {
@@ -284,12 +286,26 @@ export default function Sidebar({ projects, onSelect }) {
   const shortcuts = useShortcuts()
+  const { theme, toggleTheme } = useTheme()
+  const nextTheme = theme === 'dark' ? 'light' : 'dark'

   return (
     <aside className="sidebar" aria-label="Projects">
       <ProjectList projects={projects} onSelect={onSelect} />
-      <footer className="sidebar-footer">
-        <ConnectionStatus />
+      <footer className="sidebar-footer" data-theme={theme}>
+        <div className="sidebar-footer-row">
+          <ConnectionStatus />
+          <ThemeToggle
+            theme={theme}
+            label={\`Switch to \${nextTheme} theme\`}
+            onToggle={toggleTheme}
+            size="sm"
+            className="sidebar-theme-toggle"
+          />
+        </div>
+        <p className="sidebar-footer-hint">
+          The theme follows your system until you switch it.
+        </p>
         <CostToday />
       </footer>
     </aside>
diff --git a/src/lib/api.js b/src/lib/api.js
index 7c3e9a0..b51d2f4 100644
--- a/src/lib/api.js
+++ b/src/lib/api.js
@@ -40,13 +40,31 @@ export async function request(path, options = {}) {
   return response.json()
 }

-export async function listSessions() {
-  const response = await request('/api/sessions')
-  return response.sessions
-}
+/** One page of sessions, newest first.
+ *  Pass the returned cursor to get the next page. */
+export async function listSessions({ cursor = null, limit = 50 } = {}) {
+  const params = new URLSearchParams({ limit: String(limit) })
+  if (cursor) params.set('cursor', cursor)
+  const response = await request(\`/api/sessions?\${params}\`)
+  return {
+    sessions: response.sessions,
+    nextCursor: response.next_cursor ?? null,
+  }
+}
+
+export async function listAllSessions() {
+  const sessions = []
+  let cursor = null
+  do {
+    const page = await listSessions({ cursor })
+    sessions.push(...page.sessions)
+    cursor = page.nextCursor
+  } while (cursor)
+  return sessions
+}

 export function sessionEvents(onEvent) {
-  const socket = new WebSocket(\`\${WS_BASE}/events\`)
-  socket.onmessage = (event) => onEvent(JSON.parse(event.data))
+  const socket = new WebSocket(\`\${WS_BASE}/events?stream=sessions\`)
+  socket.onmessage = (event) => onEvent({ type: 'session', ...JSON.parse(event.data) })
   return socket
 }
`;

export async function record(wrapped, rec) {
  const f = await openDemo(wrapped, {
    gitStatus: { is_git_repo: true, branch: 'main', staged: [], unstaged: FILES.map((path) => ({ path, status: 'M' })), untracked: [] },
  });
  f.controls.setChanges(DIFF, '');
  const p = f.page;
  await p.getByText('Review the changes', { exact: true }).first().click();
  await p.getByText(/Activity · \d+ step/).first().waitFor();
  await p.waitForTimeout(600);

  const r = await rec(p, f.context);
  await r.start();
  await r.hold(0.9);
  await r.click(p.getByRole('button', { name: 'Review', exact: true }).first(), { duration: 0.8, after: 0 });
  await r.untilVisible(p.getByText(/Sidebar\.jsx/));
  await r.hold(1.6);
  await r.click(p.getByRole('button', { name: 'Fullscreen', exact: true }), { duration: 0.8, after: 0 });
  await r.untilVisible(p.getByRole('button', { name: 'Unified View', exact: true }));
  r.mark('fullscreen');
  await r.hold(1.0);
  await r.click(p.getByRole('button', { name: 'Unified View', exact: true }), { duration: 0.7, after: 0 });
  await r.hold(0.6);
  await r.moveTo([1180, 640], { duration: 0.5 });
  await r.snap('full');
  await r.hold(0.4);
  await r.scrollBy([1180, 640], 300, { duration: 0.9 });
  await r.hold(2.4);
  await r.stop();
  return { fixture: f };
}
