# Round 2, architecture: changes needed outside architecture.html

architecture.html is done (claims softened to IVE 1.0.17, totals removed). These follow-ups touch files I do not own.

1. **README.md, Product truth, line "Use only documented totals: 140+ API routes, … a 9-step package scan, …"**
   The brief retires every number total, and the architecture page no longer shows any. The 1.0.17 source has no 9-step scan: AVCP checks recency, OSV, GitHub advisories and install scripts (`ive-oss/backend/experimental.py`, `ive-oss/anti-vibe-code-pwner/lib/scanner.py` `full_check`). Suggested replacement: "Show no totals. The package scan (AVCP) is optional and off by default."
   Worth adding to the same block: git worktrees are opt-in (`workspaces.default_worktree DEFAULT 0`), and among the active CLIs only Claude Code supports them (`ive-oss/backend/session_worktree.py`; the Codex and Antigravity profiles have no `Feature.WORKTREE` binding).

2. **site.css (dead rules, optional cleanup, no visual change)**
   No page uses these any more: `.stats-row`, `.stat`, `.stat:first-child`, `.stat-n`, `.stat-l`, `.source-line`, `.st-thinking`, plus `.stats-row` and the two `.stat` rules in the 720px media block.

3. **design/REDESIGN-BRIEF.md 3.4** still says "Keep every block and its copy." Round 2 changed the copy on purpose (ROUND-1-CLAUDE.md section 6). A changelog line would stop a later pass from restoring the old absolutes.

4. **Cache versions.** architecture.html still loads `fonts.css`, `site.css` and `site.js` with `?v=20261023a`. If any of those three change in round 2, the integration step also has to bump them to `v=20261023b` in architecture.html.

## Check (round 2A, checker)

Every changed claim re-checked against ive-oss 1.0.17 (event_bus.emit, CLIENT_EVENTS, commander_events categories, session_worktree + cli_profiles, hooks.py `_w2w_check_file_conflict` and the hook script's deny path for Claude Code, Codex and Antigravity, mode_policy + route_guards, safety_engine mandatory tier + `install_safety_gate_hooks` at startup, middleware/audit.py, account_sandbox + auth_browser_driver, experimental.py AVCP). All hold. The dead-rule list in item 2 is correct; `.st-queued` is unused too.

Small fixes made in architecture.html:
- H3 "Without one, edits are checked." is now "Without a worktree, edits are checked." ("one" had no noun near it).
- Non-breaking spaces inside the diagram meta items and the trace rows, so phones no longer split "access / guards", "live / state", "! / blocked" or "agent and / you". Lines now break only after a "·".
- "Scripts, agents, hooks, and extensions" without the serial comma, like every other list on the page.

Still open, both in site.css (not mine):
5. **Access table scrolls inside its wrapper** at 320 to 375 px (2 px at 375, 57 px at 320) and at 720 to about 760 px (19 px), because every cell has `white-space: nowrap`. Fits at 390 and 768+. Fix: allow wrapping in the last column below 1024 px, or drop the nowrap on `td`.
6. **Light theme `--waiting` (#B7791F)** measures 3.19:1 for the 12 px "waiting" word on the diagram node ground (needs 4.5:1). Something around #8A5A00 reaches about 5:1 there; the token is shared, so check the other pages too.

Not a page problem: in WebKit, Playwright's screenshot call injects a style that the strict CSP blocks, which logs one console error per screenshot. Page load and scrolling log nothing.
