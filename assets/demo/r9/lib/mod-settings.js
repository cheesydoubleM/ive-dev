// Module "settings" of the IVE app built into the site (lib/app.js): the views behind the sidebar's
// Set up group and the Knowledge entry (round 7, wave 3). Everything here is local to the browser and
// says so where the app would talk to the Mac: Settings (this machine, this workspace, connections &
// models, agents & boundaries, access & sharing, advanced, cost & tokens), Knowledge (notes: read,
// write, save, delete, use as context), Connectors (AI accounts, MCP servers, custom APIs: enable
// per project, details; real set-up happens in the app), Phone (coming soon to the App Store; a
// navigable preview of what the phone shows; no install or pairing instructions, no fake pairing token).
//
// State: state.prefs = { theme, fontScale, density, workspace: { cli, model, mode }, agents: { safetyGate,
//        loopDetection, askBeforeEdits }, connectors: { enabled: {}, custom: [] } }, state.settingsTab,
//        state.knowledge[], state.knowledgeSel, state.knowledgeDraft, state.connectorsTab/Query/Detail, state.costPeriod.
// Hooks: data-demo-act: settings-tab, pref-set, ws-pref, agents-pref, share-copy, demo-reset, export-all,
//        knowledge-clear, note-open, note-new, note-save, note-delete, note-context, connector-tab,
//        connector-open, connector-back, connector-toggle, connector-add, cost-period, phone-open-session.
import { html, raw, esc } from './dom.js';
import { ic, header } from './ui.js';
import { ACTIONS, DIALOGS, openDialog, closeAll, copyText } from './mod-ui.js';
import { transcriptMarkdown, summaryOf } from './mod-ui.js';

const TABS = [['machine', 'This machine'], ['workspace', 'This workspace'], ['models', 'Connections & models'], ['agents', 'Agents & boundaries'], ['sharing', 'Access & sharing'], ['advanced', 'Advanced'], ['cost', 'Cost & tokens']];
const MODELS = { claude: ['haiku', 'sonnet', 'opus'], codex: ['gpt-5-codex', 'gpt-5', 'o4-mini'], gemini: ['gemini-2.5-pro', 'gemini-2.5-flash'] };
const MODES = ['Default', 'Auto', 'Plan', 'Accept Edits', 'Don’t Ask', 'Skip agent approvals'];
const RATES = { haiku: [0.8, 4], sonnet: [3, 15], opus: [15, 75], 'gpt-5-codex': [1.25, 10], 'gpt-5': [1.25, 10], 'o4-mini': [1.1, 4.4], 'gemini-2.5-pro': [1.25, 10], 'gemini-2.5-flash': [0.3, 2.5], default: [1.25, 10] };
const CONNECTORS = [
  { id: 'claude', kind: 'account', name: 'Claude', mark: '✳', description: 'Use your Claude subscription for coding and conversations.', scopes: ['Claude Code CLI', 'Chat with Claude'] },
  { id: 'codex', kind: 'account', name: 'Codex', mark: '◎', description: 'Connect your OpenAI account to work with Codex.', scopes: ['Codex CLI'] },
  { id: 'gemini', kind: 'account', name: 'Gemini', mark: '✦', description: 'Use your Google account with the Gemini agent (Antigravity CLI).', scopes: ['Gemini CLI'] },
  { id: 'github', kind: 'mcp', name: 'GitHub', mark: '⌥', description: 'Issues, pull requests and checks of your repositories.', scopes: ['repo:read', 'pull_requests:write', 'checks:read'] },
  { id: 'linear', kind: 'mcp', name: 'Linear', mark: '◇', description: 'Read and update issues of your team.', scopes: ['issues:read', 'issues:write'] },
  { id: 'postgres', kind: 'mcp', name: 'Postgres', mark: '▤', description: 'Query a database with a read-only role.', scopes: ['select'] },
  { id: 'sentry', kind: 'mcp', name: 'Sentry', mark: '◉', description: 'Errors and traces of your services.', scopes: ['events:read'] },
  { id: 'browser', kind: 'mcp', name: 'Browser', mark: '◫', description: 'A headless browser for tests and screenshots.', scopes: ['navigate', 'screenshot'] },
  { id: 'figma', kind: 'mcp', name: 'Figma', mark: '✎', description: 'Design files and components.', scopes: ['files:read'] },
];
const SEED_NOTES = [
  { id: 'doc-brief', kind: 'doc', title: 'Project brief · Orbit', text: 'Orbit is a small team dashboard: sessions, a board, a review flow.\n\nGoals this quarter:\n- Sign-in that survives a reconnect\n- A dark theme toggle in the sidebar\n- Pagination that keeps its cursor\n\nThe API lives in src/lib/api.js; the UI in src/components.' },
  { id: 'doc-conventions', kind: 'doc', title: 'Conventions', text: '- Components in src/components, hooks in src/hooks\n- Tests next to the code, named *.test.js\n- Keyboard shortcuts stay stable; add, never rebind\n- Run `npm test` before a review' },
];

const P = (st) => st.prefs;
const money = (n) => (n < 0.01 && n > 0 ? '<$0.01' : `$${n.toFixed(2)}`);
const num = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n)));

/* ── preferences applied to the document (theme, font scale, density) ── */
function applyPrefs(st) {
  const p = P(st);
  const doc = document.documentElement;
  const theme = p.theme === 'system' ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : p.theme;
  if (doc.getAttribute('data-theme') !== theme) { doc.setAttribute('data-theme', theme); try { window.parent.postMessage({ source: 'ive-demo', type: 'theme', theme }, location.origin); } catch { /* no parent */ } }
  const root = document.getElementById('root');
  if (root) { root.classList.toggle('demo-text-large', p.fontScale === 'large'); root.classList.toggle('demo-text-small', p.fontScale === 'small'); root.classList.toggle('demo-density-compact', p.density === 'compact'); }
}

/* ── cost estimate from the transcripts ── */
function tokensOf(st, s) {
  const msgs = st.msgs[s.id] || [];
  let input = 0, output = 0;
  for (const m of msgs) {
    if (m.role === 'user') input += Math.ceil((m.text || '').length / 4) + 40;
    else { output += Math.ceil((m.text || '').length / 4); for (const c of m.steps || []) { output += 30; input += Math.ceil(((c.result || '') + (c.input || c.command || '')).length / 4) + 60; } }
  }
  input += 1200; // the system prompt and the project context, once
  const [ri, ro] = RATES[s.model] || RATES.default;
  return { input, output, cacheRead: Math.round(input * 0.6), cost: (input * ri + output * ro) / 1e6, messages: msgs.length };
}

/* ── views ── */
function pageHead(st, ctx, title, { sub = '', actions = '' } = {}) {
  const narrow = ctx.width < 1000;
  return header({ view: 'home', workspace: st.ws, sidebarOpen: (st.sidebarOpen ?? !narrow) && ctx.variant !== 'hero', title, actions });
}
const sectionOpen = (title, sub = '') => html`<section class="demo-settings-section"><h3>${title}</h3>${sub ? html`<p class="demo-settings-sub">${sub}</p>` : ''}`;
const sectionClose = () => html`</section>`;
const seg = (name, value, options, act, { arg = '' } = {}) => html`<div class="demo-seg" role="group" aria-label="${name}">${options.map(([v, label]) => html`<button type="button" class="demo-seg-btn${value === v ? ' is-on' : ''}" aria-pressed="${value === v}" data-demo-act="${act}" data-demo-arg="${arg ? arg + '|' : ''}${v}">${label}</button>`)}</div>`;
const row = (label, control, hint = '') => html`<div class="demo-pref-row"><div class="demo-pref-text"><div class="demo-pref-label">${label}</div>${hint ? html`<div class="demo-pref-hint">${hint}</div>` : ''}</div><div class="demo-pref-control">${control}</div></div>`;
const toggle = (on, act, arg, label) => html`<button type="button" class="demo-switch${on ? ' is-on' : ''}" role="switch" aria-checked="${on}" aria-label="${label}" data-demo-act="${act}" data-demo-arg="${arg}"><span class="demo-switch-knob"></span></button>`;

function settingsMain(st, ctx) {
  const p = P(st);
  const tab = st.settingsTab || 'machine';
  const ws = st.ws;
  let body = '';
  if (tab === 'machine') body = html`${sectionOpen('Appearance', 'These apply to the app in this browser right away.')}
${row('Theme', seg('Theme', p.theme, [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']], 'pref-set', { arg: 'theme' }))}
${row('Text size', seg('Text size', p.fontScale, [['small', 'Small'], ['default', 'Default'], ['large', 'Large']], 'pref-set', { arg: 'fontScale' }), 'Scales the whole interface.')}
${row('Sidebar density', seg('Sidebar density', p.density, [['comfortable', 'Comfortable'], ['compact', 'Compact']], 'pref-set', { arg: 'density' }))}
${sectionClose()}${sectionOpen('Keyboard')}
${row('Shortcuts', html`<button type="button" class="ive-project-action" data-demo-act="shortcuts-open">${ic('keyboard', 11)}Show the list</button>`, '⌘K search, ⌘N new session, ⌘J terminal, ⌘\\ sidebar, ? this list.')}
${sectionClose()}${sectionOpen('This Mac', 'In the app these come from your machine; the browser demo has no machine behind it.')}
${row('Local service', html`<span class="demo-pill">Demo · nothing runs on a Mac here</span>`)}
${row('Version', html`<span class="t-meta mono">IVE 1.0.17 · browser demo</span>`)}
${sectionClose()}`;
  else if (tab === 'workspace') body = html`${sectionOpen('Project', 'Settings of the active project; sessions you start on Home use them.')}
${row('Name', html`<input class="demo-ui-input demo-inline-input" data-demo-field="wsname" value="${ws.name}" aria-label="Project name" autocomplete="off"><button type="button" class="ive-project-action" data-demo-act="ws-rename">Save</button>`)}
${row('Folder', html`<span class="t-meta mono">${ws.path || '/Projects/' + ws.id}</span>`, 'Read-only here; in the app it is the folder you connected.')}
${sectionClose()}${sectionOpen('Defaults for new sessions')}
${row('CLI', seg('CLI', p.workspace.cli, [['claude', 'Claude Code'], ['codex', 'Codex'], ['gemini', 'Gemini']], 'ws-pref', { arg: 'cli' }))}
${row('Model', seg('Model', p.workspace.model, (MODELS[p.workspace.cli] || MODELS.claude).map((m) => [m, m]), 'ws-pref', { arg: 'model' }))}
${row('Agent mode', seg('Agent mode', p.workspace.mode, MODES.map((m) => [m, m]), 'ws-pref', { arg: 'mode' }))}
${sectionClose()}`;
  else if (tab === 'models') body = html`${sectionOpen('AI accounts', 'The app uses the CLIs you are signed in to on your Mac. The demo shows sample accounts; nothing signs in here.')}
${CONNECTORS.filter((c) => c.kind === 'account').map((c) => row(html`<span class="demo-connector-mark">${c.mark}</span> ${c.name}`, html`<span class="demo-pill">Sample account</span><button type="button" class="ive-project-action" data-demo-act="connector-open" data-demo-arg="${c.id}">Details ${ic('chevron-right', 11)}</button>`, c.description))}
${sectionClose()}${sectionOpen('Default model per CLI')}
${Object.entries(MODELS).map(([cli, list]) => row(cli, seg(`Default model for ${cli}`, p.models[cli], list.map((m) => [m, m]), 'model-default', { arg: cli })))}
${sectionClose()}`;
  else if (tab === 'agents') body = html`${sectionOpen('Boundaries', 'What IVE does around every agent. These change how the sessions in this demo behave.')}
${row('Safety Gate', toggle(p.agents.safetyGate, 'agents-pref', 'safetyGate', 'Safety Gate'), 'Stops risky commands (rm -rf, force pushes, secrets) before they run, in every agent mode. Try it: send “rm -rf dist” to a session.')}
${row('Loop detection', toggle(p.agents.loopDetection, 'agents-pref', 'loopDetection', 'Loop detection'), 'When an agent repeats the same tool call, IVE nudges it with a note. Off: the loop keeps running.')}
${row('Ask before file edits', toggle(p.agents.askBeforeEdits, 'agents-pref', 'askBeforeEdits', 'Ask before file edits'), 'The default agent mode of new sessions becomes “Accept Edits” when this is off.')}
${sectionClose()}${sectionOpen('Hooks', 'Your own hooks stay untouched; IVE adds its own around them.')}
${row('Package scanner', toggle(p.agents.scanner, 'agents-pref', 'scanner', 'Package scanner'), 'Checks installs against known-bad packages; on, every “npm install” step shows its scan. Off by default in the app.')}
${sectionClose()}`;
  else if (tab === 'sharing') body = html`${sectionOpen('Share', 'Links to this browser demo; the app shares real sessions with your team.')}
${row('This app', html`<button type="button" class="ive-project-action" data-demo-act="share-copy" data-demo-arg="">${ic('copy', 11)}Copy link</button>`, 'Opens the demo at Home.')}
${row('Current session', html`<button type="button" class="ive-project-action" data-demo-act="share-copy" data-demo-arg="${st.activeId || ''}"${st.activeId ? '' : raw(' disabled=""')}>${ic('copy', 11)}Copy link</button>`, st.activeId ? `Opens the demo at “${(st.sessions.find((s) => s.id === st.activeId) || {}).name}”.` : 'Open a session first.')}
${sectionClose()}${sectionOpen('Phone')}
${row('iPhone app', html`<button type="button" class="ive-project-action" data-nav="phone">${ic('smartphone', 11)}Open Phone</button>`, 'Coming soon to the App Store; see what it shows.')}
${sectionClose()}${sectionOpen('Team', 'In the app, teammates join a project with a code. The demo has no server to invite anyone to.')}
${row('Members', html`<span class="demo-pill">You</span>`)}
${sectionClose()}`;
  else if (tab === 'advanced') body = html`${sectionOpen('Data', 'All of it lives in this browser tab.')}
${row('Export all sessions', html`<button type="button" class="ive-project-action" data-demo-act="export-all">${ic('download', 11)}Download .md</button>`, 'One Markdown file with every transcript.')}
${row('Knowledge', html`<button type="button" class="ive-project-action" data-demo-act="knowledge-clear">${ic('trash2', 11)}Clear notes</button>`, `${(st.knowledge || []).length} note${(st.knowledge || []).length === 1 ? '' : 's'}.`)}
${row('Reset the demo', html`<button type="button" class="ive-project-action" data-demo-act="demo-reset">${ic('rotate-ccw', 11)}Start over</button>`, 'Reloads the app with the sample project.')}
${sectionClose()}${sectionOpen('Diagnostics')}
${row('Sessions', html`<span class="t-meta mono">${st.sessions.length} · ${st.sessions.filter((s) => s.state === 'running').length} running</span>`)}
${row('Uptime', html`<span class="t-meta mono">${Math.round(st.clock)} s</span>`)}
${sectionClose()}`;
  else if (tab === 'cost') body = costMain(st);
  return html`<div class="demo-settings"><nav class="demo-settings-tabs" aria-label="Settings">${TABS.map(([id, label]) => html`<button type="button" class="demo-settings-tab${tab === id ? ' is-on' : ''}" aria-current="${tab === id ? 'page' : 'false'}" data-demo-act="settings-tab" data-demo-arg="${id}">${label}</button>`)}</nav><div class="demo-settings-body" data-demo-settings-tab="${tab}">${body}</div></div>`;
}

function costMain(st) {
  const period = st.costPeriod || 'today';
  const factor = period === 'today' ? 1 : period === '7d' ? 4.2 : 13.5;
  const rows = st.sessions.filter((s) => !s.hidden || s.archived).map((s) => ({ s, t: tokensOf(st, s) }));
  const total = rows.reduce((a, r) => ({ input: a.input + r.t.input, output: a.output + r.t.output, cacheRead: a.cacheRead + r.t.cacheRead, cost: a.cost + r.t.cost }), { input: 0, output: 0, cacheRead: 0, cost: 0 });
  const byModel = {};
  for (const r of rows) { const k = r.s.model; byModel[k] = byModel[k] || { cost: 0, output: 0, n: 0 }; byModel[k].cost += r.t.cost; byModel[k].output += r.t.output; byModel[k].n += 1; }
  return html`${sectionOpen('Cost & tokens', period === 'today' ? 'Today: an estimate from this demo’s transcripts (about four characters per token, sample rates). The app counts the real usage of your accounts.' : 'Illustrative sample history for this demo, scaled from today’s transcripts; not measured usage. The app shows the real numbers of your accounts.')}
<div class="demo-cost-head">${seg('Period', period, [['today', 'Today'], ['7d', '7 days'], ['30d', '30 days']], 'cost-period')}<strong class="demo-cost-total">${money(total.cost * factor)}<small class="demo-cost-note">${period === 'today' ? 'estimate' : 'sample'}</small></strong></div>
<div class="demo-cost-tiles">${[['Input', total.input], ['Output', total.output], ['Cache write', Math.round(total.input * 0.15)], ['Cache read', total.cacheRead]].map(([k, v]) => html`<div class="demo-cost-tile"><div class="t-meta">${k}</div><div class="mono">${num(v * factor)}</div></div>`)}</div>
${sectionClose()}${sectionOpen('By model')}
${Object.entries(byModel).map(([m, v]) => html`<div class="demo-cost-row"><span class="mono">${m}</span><span class="t-meta">${v.n} session${v.n === 1 ? '' : 's'} · ${num(v.output * factor)} out</span><strong>${money(v.cost * factor)}</strong></div>`)}
${sectionClose()}${sectionOpen('By session')}
${rows.sort((a, b) => b.t.cost - a.t.cost).map((r) => html`<button type="button" class="demo-cost-row is-link" data-demo-act="phone-open-session" data-demo-arg="${r.s.id}"><span class="truncate">${r.s.name}</span><span class="t-meta">${num(r.t.input * factor)} in · ${num(r.t.output * factor)} out · ${r.t.messages} msgs</span><strong>${money(r.t.cost * factor)}</strong></button>`)}
${sectionClose()}`;
}

function knowledgeMain(st) {
  const notes = st.knowledge || [];
  const sel = st.knowledgeDraft ? null : notes.find((n) => n.id === st.knowledgeSel) || null;
  const d = st.knowledgeDraft;
  const active = st.activeId && st.sessions.find((s) => s.id === st.activeId);
  const inContext = (n) => !!(active && st.context && st.context[active.id] && st.context[active.id].some((c) => c.id === n.id));
  return html`<div class="demo-knowledge"><aside class="demo-knowledge-list"><div class="demo-knowledge-head"><span class="t-label">Knowledge · ${st.ws.name}</span><button type="button" class="ive-project-action" data-demo-act="note-new">${ic('plus', 11)}New note</button></div>${notes.length ? notes.map((n) => html`<button type="button" class="demo-note-row${sel && sel.id === n.id ? ' is-on' : ''}" data-demo-act="note-open" data-demo-arg="${n.id}" data-key="note-${n.id}">${ic(n.kind === 'summary' ? 'file-text' : 'book-open', 12)}<span class="min-w-0 flex-1"><span class="block truncate">${n.title}</span><span class="block text-[11px] text-x-faint truncate">${n.kind === 'summary' ? 'Session summary' : 'Project document'} · ${(n.text || '').trim().split(/\s+/).filter(Boolean).length} words</span></span></button>`) : html`<div class="ive-sidebar-empty"><strong>No notes yet.</strong><span>Save a session’s Summary, or write one.</span></div>`}</aside><div class="demo-knowledge-doc">${d ? html`<div class="demo-note-editor"><input class="demo-ui-input" data-demo-field="ntitle" value="${d.title}" placeholder="Title" aria-label="Title" autocomplete="off"><textarea class="demo-ui-textarea demo-note-text" data-demo-field="ntext" rows="14" placeholder="What the next session should know…" aria-label="Note">${d.text}</textarea><div class="demo-note-actions"><button type="button" class="ive-btn ive-btn--primary" data-demo-act="note-save"${d.title.trim() ? '' : raw(' disabled=""')}>Save</button><button type="button" class="ive-btn" data-demo-act="note-cancel">Cancel</button></div></div>` : sel ? html`<div class="demo-note-view"><div class="demo-note-title"><h2>${sel.title}</h2><div class="demo-note-actions"><button type="button" class="ive-project-action${inContext(sel) ? ' is-on' : ''}" data-demo-act="note-context" data-demo-arg="${sel.id}" aria-pressed="${inContext(sel)}"${active ? '' : raw(' disabled=""')} title="${active ? `Use in ${active.name}` : 'Open a session first'}">${ic('book-plus', 11)}${inContext(sel) ? 'In the session’s context' : 'Use as context'}</button><button type="button" class="ive-project-action" data-demo-act="note-edit" data-demo-arg="${sel.id}">${ic('pencil', 11)}Edit</button><button type="button" class="ive-project-action" data-demo-act="note-delete" data-demo-arg="${sel.id}">${ic('trash2', 11)}Delete</button></div></div><pre class="demo-note-body">${sel.text}</pre></div>` : html`<div class="demo-note-empty">${ic('book-open', 22)}<p>Pick a note, or write one. Notes become context for sessions.</p></div>`}</div></div>`;
}

function connectorsMain(st) {
  const c = st.connectors;
  const enabled = P(st).connectors.enabled;
  if (c.detail) {
    const x = CONNECTORS.find((k) => k.id === c.detail) || P(st).connectors.custom.find((k) => k.id === c.detail);
    if (x) return html`<div class="demo-connectors demo-connectors-detail"><button type="button" class="demo-link" data-demo-act="connector-back">${ic('arrow-right', 12, 'rotate-180')} All connectors</button><div class="demo-connector-hero"><span class="demo-connector-mark lg">${x.mark}</span><div><h2>${x.name}</h2><p>${x.description}</p></div></div>
${sectionOpen(x.kind === 'account' ? 'Account' : 'Access')}
${x.kind === 'account' ? row('Status', html`<span class="demo-pill">Sample account · demo</span>`, 'In the app this is the CLI’s own sign-in on your Mac; the demo signs nothing in.') : row(`Enabled for ${st.ws.name}`, toggle(!!enabled[x.id], 'connector-toggle', x.id, `Enable ${x.name}`), 'Agents of this project may use it. Local to this browser.')}
${row('Scopes', html`<span class="demo-scopes">${(x.scopes || []).map((s) => html`<code>${s}</code>`)}</span>`)}
${x.url ? row('Endpoint', html`<span class="t-meta mono">${x.url}</span>`) : ''}
${sectionClose()}${sectionOpen('Set up for real')}
${row('In IVE on your Mac', html`<a class="ive-project-action" href="../../../download.html" target="_top">${ic('external-link', 11)}Get IVE</a>`, x.kind === 'account' ? 'Sign in with the CLI once; IVE picks it up.' : 'Add the server in Settings → Connectors; IVE stores the token in the keychain.')}
${sectionClose()}</div>`;
  }
  const q = (c.query || '').toLowerCase();
  const all = [...CONNECTORS, ...P(st).connectors.custom];
  const list = all.filter((k) => (c.tab === 'all' || k.kind === c.tab) && (!q || `${k.name} ${k.description}`.toLowerCase().includes(q)));
  return html`<div class="demo-connectors"><div class="demo-connectors-heading"><div><h2>Your apps, connected.</h2><p>Manage the services and AI accounts you use in IVE. Local to this browser; the app stores real tokens in your keychain.</p></div><button type="button" class="ive-btn ive-btn--primary" data-demo-act="connector-add">${ic('plus', 12)}Add connector</button></div>
<div class="demo-connectors-tabs" role="tablist">${[['all', 'All'], ['account', 'AI accounts'], ['mcp', 'MCP servers'], ['custom', 'Custom APIs']].map(([id, label]) => html`<button type="button" role="tab" aria-selected="${c.tab === id}" class="demo-settings-tab${c.tab === id ? ' is-on' : ''}" data-demo-act="connector-tab" data-demo-arg="${id}">${label}</button>`)}</div>
<label class="ive-sidebar-filter demo-connectors-search">${ic('search', 14, 'ive-sidebar-filter-icon')}<input aria-label="Search connectors" placeholder="Search connectors…" type="search" value="${c.query || ''}" data-demo-field="cquery" autocomplete="off"></label>
<div class="demo-connectors-list">${list.length ? list.map((k) => html`<article class="demo-connector-row" data-key="con-${k.id}"><span class="demo-connector-mark">${k.mark}</span><div class="demo-connector-copy"><h4>${k.name}${k.kind !== 'account' && enabled[k.id] ? html` <span class="demo-pill is-on">Enabled</span>` : ''}</h4><p>${k.description}</p></div><button type="button" class="ive-project-action" data-demo-act="connector-open" data-demo-arg="${k.id}" aria-label="Open ${k.name}">${k.kind === 'account' ? 'Details' : enabled[k.id] ? 'Manage' : 'Enable'} ${ic('chevron-right', 11)}</button></article>`) : html`<div class="ive-sidebar-empty"><strong>No matching connectors.</strong><span>Try another name, or add a custom one.</span></div>`}</div></div>`;
}

function phoneMain(st) {
  const sessions = st.sessions.filter((s) => !s.hidden);
  const waiting = sessions.filter((s) => s.state === 'waiting'), running = sessions.filter((s) => s.state === 'running'), rest = sessions.filter((s) => s.state !== 'waiting' && s.state !== 'running');
  const group = (title, list) => (list.length ? html`<div class="ive-phone-group">${title}</div>${list.map((s) => html`<li data-key="ph-${s.id}"><button type="button" class="ive-phone-card" data-demo-act="phone-open-session" data-demo-arg="${s.id}"><span class="ive-phone-card-top"><span class="ive-phone-card-name">${s.name}</span><span class="ive-phone-chip is-${s.state}">${s.state}</span></span><span class="ive-phone-card-meta">${s.cli} · ${s.model}${s.state === 'waiting' ? ' · needs your answer' : ''}</span></button></li>`)}` : '');
  return html`<div class="demo-phone"><section class="demo-settings-section"><h3>${ic('smartphone', 15)} IVE for iPhone</h3><p class="demo-settings-sub">Coming soon to the App Store. The app pairs with IVE on your Mac and shows these sessions on the phone: the terminal with its key bar, permission questions, Stop, a push notification when an agent needs you. The agents keep running on the Mac.</p><span class="demo-pill is-on">Coming soon to the App Store</span></section>
<section class="demo-settings-section"><h3>What the phone shows</h3><p class="demo-settings-sub">The same sessions, one column. Tap one to open it here.</p><div class="ive-phone-overview demo-phone-preview"><div class="ive-phone-overview-head"><h1>${st.ws.name}</h1><span class="t-meta">${sessions.length} sessions</span></div><ul class="ive-phone-list">${group('Needs you', waiting)}${group('Running', running)}${group('Done', rest)}</ul></div></section></div>`;
}

/* ── actions ── */
ACTIONS['settings-tab'] = (arg, e, st) => { st.settingsTab = arg; };
ACTIONS['pref-set'] = (arg, e, st) => { const [k, v] = arg.split('|'); P(st)[k] = v; applyPrefs(st); };
ACTIONS['ws-pref'] = (arg, e, st) => { const [k, v] = arg.split('|'); P(st).workspace[k] = v; if (k === 'cli') P(st).workspace.model = P(st).models[v] || (MODELS[v] || MODELS.claude)[0]; };
ACTIONS['ws-rename'] = (arg, e, st, api) => { const v = (st.wsNameDraft || '').trim(); if (!v) return; st.ws.name = v; const p = st.ui.projects.find((x) => x.id === st.ws.id); if (p) p.name = v; api.toast(`Project renamed to “${v}”`); };
ACTIONS['model-default'] = (arg, e, st) => { const [cli, m] = arg.split('|'); P(st).models[cli] = m; if (P(st).workspace.cli === cli) P(st).workspace.model = m; };
ACTIONS['agents-pref'] = (arg, e, st) => { const a = P(st).agents; a[arg] = !a[arg]; if (arg === 'askBeforeEdits') P(st).workspace.mode = a.askBeforeEdits ? 'Default' : 'Accept Edits'; };
ACTIONS['shortcuts-open'] = (arg, e, st) => { openDialog(st, { kind: 'shortcuts' }, '[data-demo-dialog] button[data-demo-act="close"]'); };
ACTIONS['share-copy'] = (arg, e, st, api) => {
  const base = location.href.replace(/assets\/demo\/r\d+\/frame\.html.*$/, 'try.html');
  const seeded = arg && st.defs[arg] && st.defs[arg].prompt !== undefined && /^[a-z]+$/.test(arg);
  if (arg && !seeded) { copyText(st, api, base, 'Link copied (opens the demo at Home: sessions you created exist only in this browser)'); return; }
  copyText(st, api, arg ? `${base}?at=session&sid=${arg}` : base, 'Link copied');
};
ACTIONS['export-all'] = (arg, e, st, api) => { const md = st.sessions.map((s) => transcriptMarkdown(st, s)).join('\n\n---\n\n'); openDialog(st, { kind: 'export', sid: st.sessions[0] && st.sessions[0].id, text: md, all: true }, '[data-demo-dialog] button[data-demo-act="download"]'); };
ACTIONS['knowledge-clear'] = (arg, e, st, api) => { st.knowledge = []; st.knowledgeSel = null; api.toast('Knowledge cleared'); };
ACTIONS['demo-reset'] = () => { try { location.reload(); } catch { /* ignore */ } };
ACTIONS['cost-period'] = (arg, e, st) => { st.costPeriod = arg; };
ACTIONS['note-open'] = (arg, e, st) => { st.knowledgeSel = arg; st.knowledgeDraft = null; };
ACTIONS['note-new'] = (arg, e, st) => { st.knowledgeDraft = { id: null, title: '', text: '' }; st.ui.focusOnce = '[data-demo-field="ntitle"]'; };
ACTIONS['note-edit'] = (arg, e, st) => { const n = (st.knowledge || []).find((x) => x.id === arg); if (n) { st.knowledgeDraft = { id: n.id, title: n.title, text: n.text }; st.ui.focusOnce = '[data-demo-field="ntext"]'; } };
ACTIONS['note-cancel'] = (arg, e, st) => { st.knowledgeDraft = null; };
ACTIONS['note-save'] = (arg, e, st, api) => {
  const d = st.knowledgeDraft; if (!d || !d.title.trim()) return;
  st.knowledge = st.knowledge || [];
  if (d.id) { const n = st.knowledge.find((x) => x.id === d.id); if (n) { n.title = d.title.trim(); n.text = d.text; n.at = st.clock; for (const sid of Object.keys(st.context || {})) for (const c of st.context[sid]) if (c.id === n.id) { c.name = n.title; c.text = n.text; } } st.knowledgeSel = d.id; }
  else { const id = `note-${Date.now()}`; st.knowledge.unshift({ id, kind: 'note', title: d.title.trim(), text: d.text, at: st.clock }); st.knowledgeSel = id; }
  st.knowledgeDraft = null; api.toast('Note saved');
};
ACTIONS['note-delete'] = (arg, e, st, api) => { st.knowledge = (st.knowledge || []).filter((x) => x.id !== arg); if (st.knowledgeSel === arg) st.knowledgeSel = null; for (const sid of Object.keys(st.context || {})) st.context[sid] = st.context[sid].filter((c) => c.id !== arg); api.toast('Note deleted'); };
ACTIONS['note-context'] = (arg, e, st, api) => {
  const sid = st.activeId; const n = (st.knowledge || []).find((x) => x.id === arg); if (!sid || !n) return;
  st.context = st.context || {}; st.context[sid] = st.context[sid] || [];
  const i = st.context[sid].findIndex((c) => c.id === n.id);
  if (i >= 0) st.context[sid].splice(i, 1); else st.context[sid].push({ id: n.id, name: n.title, kind: 'note', meta: 'note', text: n.text });
  api.toast(i >= 0 ? `Removed from ${(st.sessions.find((s) => s.id === sid) || {}).name}` : `Added to ${(st.sessions.find((s) => s.id === sid) || {}).name}: the agent reads it with the next message.`);
};
ACTIONS['connector-tab'] = (arg, e, st) => { st.connectors.tab = arg; };
ACTIONS['connector-open'] = (arg, e, st, api) => { st.connectors.detail = arg; if (st.view !== 'connectors') api.go('connectors'); };
ACTIONS['connector-back'] = (arg, e, st) => { st.connectors.detail = null; };
ACTIONS['connector-toggle'] = (arg, e, st, api) => { const en = P(st).connectors.enabled; en[arg] = !en[arg]; const x = CONNECTORS.find((k) => k.id === arg) || P(st).connectors.custom.find((k) => k.id === arg); api.toast(`${x ? x.name : arg} ${en[arg] ? 'enabled' : 'disabled'} for ${st.ws.name}`); };
ACTIONS['connector-add'] = (arg, e, st) => { openDialog(st, { kind: 'connector-add', value: '', url: '' }); };
ACTIONS['connector-add-confirm'] = (arg, e, st, api) => {
  const d = st.ui.dialog; if (!d) return;
  const name = (d.value || '').trim(); const url = (d.url || '').trim();
  if (!name || !/^https?:\/\//.test(url)) { api.toast('A name and an https:// URL are needed.', 'warning'); return; }
  const id = `custom-${Date.now()}`;
  P(st).connectors.custom.push({ id, kind: 'custom', name, mark: '⌁', description: `Custom API at ${url}`, url, scopes: ['read'] });
  P(st).connectors.enabled[id] = true; st.connectors.tab = 'custom'; closeAll(st); api.toast(`${name} added (stored in this browser)`);
};
ACTIONS['phone-open-session'] = (arg, e, st, api) => { api.go('session', arg); };
DIALOGS['connector-add'] = (st, d, { btn, html: h }) => ({
  title: 'Add custom connector',
  body: h`<label class="demo-ui-label" for="demo-field-name">Name</label><input id="demo-field-name" class="demo-ui-input" data-demo-field="name" value="${d.value}" placeholder="Internal API" maxlength="60" autocomplete="off"><label class="demo-ui-label" for="demo-field-url">URL</label><input id="demo-field-url" class="demo-ui-input font-mono" data-demo-field="url" value="${d.url || ''}" placeholder="https://api.example.com/mcp" maxlength="200" autocomplete="off"><p class="text-[11px] text-x-faint leading-relaxed">The app would fetch its schema now; here it is listed for this project.</p>`,
  foot: h`${btn('close', 'Cancel')}${btn('connector-add-confirm', 'Add', 'primary')}`,
});

/* ── the module ── */
export default {
  id: 'settings',
  init(state, env) {
    state.prefs = { theme: env.ctx.theme || 'light', fontScale: 'default', density: 'comfortable', workspace: { cli: 'claude', model: 'sonnet', mode: 'Default' }, models: { claude: 'sonnet', codex: 'gpt-5-codex', gemini: 'gemini-2.5-pro' }, agents: { safetyGate: true, loopDetection: true, askBeforeEdits: true, scanner: false }, connectors: { enabled: { github: true }, custom: [] } };
    state.knowledge = [...SEED_NOTES.map((n) => ({ ...n, at: 0 })), ...(state.knowledge || [])];
    state.connectors = { tab: 'all', query: '', detail: null };
    state.costPeriod = 'today';
    state.settingsTab = 'machine';
  },
  main(state, ctx) {
    const v = state.view;
    if (v === 'settings') return { main: settingsMain(state, ctx), header: pageHead(state, ctx, 'Settings') };
    if (v === 'knowledge') return { main: knowledgeMain(state), header: pageHead(state, ctx, 'Knowledge') };
    if (v === 'connectors') return { main: connectorsMain(state), header: pageHead(state, ctx, 'Connectors') };
    if (v === 'phone') return { main: phoneMain(state), header: pageHead(state, ctx, 'Phone') };
    return null;
  },
  input(e, state) {
    const t = e.target;
    if (!t || !t.hasAttribute || !t.hasAttribute('data-demo-field')) return false;
    const f = t.getAttribute('data-demo-field');
    if (f === 'wsname') { state.wsNameDraft = t.value; return false; }
    if (f === 'ntitle' && state.knowledgeDraft) { state.knowledgeDraft.title = t.value; return true; }
    if (f === 'ntext' && state.knowledgeDraft) { state.knowledgeDraft.text = t.value; return false; }
    if (f === 'cquery') { state.connectors.query = t.value; return true; }
    if (f === 'url' && state.ui.dialog) { state.ui.dialog.url = t.value; return false; }
    return false;
  },
  key(e, state, api) {
    const t = e.target;
    if (t && t.getAttribute && t.getAttribute('data-demo-field') === 'wsname' && e.key === 'Enter') { ACTIONS['ws-rename'](null, e, state, api); return true; }
    return false;
  },
  after(state) { applyPrefs(state); },
};

/** The core asks: defaults for a new session and whether a loop nudge fires. */
export const newSessionDefaults = (st) => ({ ...P(st).workspace });
export const loopDetectionOn = (st) => !st.prefs || st.prefs.agents.loopDetection !== false;
export const safetyGateOn = (st) => !st.prefs || st.prefs.agents.safetyGate !== false;
export const scannerOn = (st) => !!(st.prefs && st.prefs.agents.scanner);
/** A command the Safety Gate stops (the app's gate looks for destructive shell, force pushes and secrets). */
export const RISKY = /\brm\s+-rf?\b|\bgit\s+push\s+.*--force|\bsudo\b|\bcurl\b.*\|\s*(ba)?sh|\bchmod\s+777|\b(AKIA|sk-)[A-Za-z0-9]{8,}/;
export { CONNECTORS, applyPrefs };
