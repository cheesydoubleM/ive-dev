// Module "ui" of the IVE app built into the site (lib/app.js): the controls around the sessions
// that the app has and a visitor expects to work. Round 7 (owner: "alle Knöpfe, die man
// anklicken kann, funktionieren"): the ⌘K palette (sessions, commands, projects), the sidebar
// filter, the session menus (sidebar and tile: rename, clone, copy output, export, summary,
// archive/restore, stop, delete), the merge selection and the merge, the projects (add, rename,
// pin, colour, collapse, remove, new session in a project), the sort (recent or manual with drag),
// the Board's scope and layout, keyboard shortcuts (⌘K, ⌘N, ⌘\, ?, Escape).
//
// State: state.ui = { menu, dialog, palette: { open, q, idx }, filter, selected[], sort, order[],
//        layout, scope, projects[], archivedOpen, focusOnce, dirty, drag }.
// Menus and dialogs render in the overlays; every one closes on Escape, on its X and on the scrim
// behind it (no click-through). Typed text lives in state (`input`), so a background tick keeps it.
// Hooks: [data-demo-act="…"] with [data-demo-arg], [data-demo-menu="kind"], [data-demo-dialog="kind"],
//        [data-demo-palette-input], [data-demo-field="name"], [data-demo-select="sort"], [data-demo-ui-scrim].
import { html, raw, esc, str } from './dom.js';
import { ic } from './ui.js';
import { nameFor, slugOf } from './data.js';

const U = (st) => st.ui;
/** Other modules register their menus (kind → items(st, menu)), dialogs (kind → { title, body, foot }) and actions (act → fn). */
export const MENUS = {};
export const DIALOGS = {};
export const ACTIONS = {};
export const COLORS = ['rgb(16, 185, 129)', 'rgb(59, 130, 246)', 'rgb(168, 85, 247)', 'rgb(236, 72, 153)', 'rgb(245, 158, 11)', 'rgb(239, 68, 68)', 'rgb(20, 184, 166)', 'rgb(107, 114, 128)'];
const LAYOUTS = [['auto', 'Equal grid', 'grid2x2'], ['1', 'Focus · one column', 'square'], ['2', 'Two columns', 'columns2'], ['3', 'Three columns', 'columns3'], ['4', 'Four columns', 'layout-grid']];
const COMMANDS = [
  { id: 'new', label: 'New session', icon: 'square-pen', kbd: '⌘N' },
  { id: 'home', label: 'Home', icon: 'house' },
  { id: 'board', label: 'Board', icon: 'columns3' },
  { id: 'review', label: 'Review the changes', icon: 'git-compare-arrows' },
  { id: 'knowledge', label: 'Knowledge', icon: 'book-open' },
  { id: 'pipelines', label: 'Pipelines', icon: 'git-branch', kbd: '⌘⇧L' },
  { id: 'task', label: 'Guided task', icon: 'sparkles' },
  { id: 'terminal', label: 'Toggle the terminal drawer', icon: 'terminal', kbd: '⌘J' },
  { id: 'sidebar', label: 'Toggle the sidebar', icon: 'panel-left-close', kbd: '⌘\\' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'connectors', label: 'Connectors', icon: 'plug' },
  { id: 'phone', label: 'Phone', icon: 'smartphone' },
  { id: 'cost', label: 'Cost & tokens', icon: 'activity' },
  { id: 'shortcuts', label: 'Keyboard shortcuts', icon: 'keyboard', kbd: '?' },
];

/* ── helpers ── */
const lastText = (st, sid) => { const m = [...(st.msgs[sid] || [])].reverse().find((x) => x.role === 'assistant' && x.text); return m ? m.text : ''; };
const projectOf = (st, id) => U(st).projects.find((p) => p.id === id);
const touch = (st, s) => { if (s) s.at = st.clock; };
function sortedSessions(st, list) {
  const ui = U(st);
  if (ui.sort === 'manual' && ui.order) {
    const pos = new Map(ui.order.map((id, i) => [id, i]));
    return [...list].sort((a, b) => (pos.has(a.id) ? pos.get(a.id) : -1) - (pos.has(b.id) ? pos.get(b.id) : -1));
  }
  return [...list].sort((a, b) => (b.at || 0) - (a.at || 0));
}
const matches = (s, q) => !q || `${s.name} ${s.model} ${s.cli} ${s.state}`.toLowerCase().includes(q);

/** Markdown transcript of a session: the export and the clipboard use it. */
export function transcriptMarkdown(st, s) {
  const lines = [`# ${s.name}`, '', `CLI: ${s.cli} · Model: ${s.model} · State: ${s.state}`, ''];
  for (const m of st.msgs[s.id] || []) {
    if (m.role === 'user') lines.push(`**You:** ${m.text}`, '');
    else if (m.steps && m.steps.length) { for (const c of m.steps) lines.push(`- ${c.tool || c.label || 'Step'}${c.command ? ` \`${c.command}\`` : c.input ? ` ${c.input}` : ''}${c.description && c.description !== c.input ? ` — ${c.description}` : ''}${c.result ? ` → ${c.result}` : ''}`); lines.push(''); if (m.text) lines.push(m.text, ''); }
    else if (m.text) lines.push(m.text, '');
  }
  return lines.join('\n');
}
export function summaryOf(st, s) {
  const msgs = st.msgs[s.id] || [];
  const user = msgs.filter((m) => m.role === 'user');
  const steps = msgs.flatMap((m) => (m.role === 'assistant' && m.steps ? m.steps : []));
  const files = [...new Set(steps.map((c) => c.input || '').filter((x) => /\.[a-z]{1,4}$/i.test(x)))];
  const commands = [...new Set(steps.map((c) => c.command || '').filter(Boolean))];
  const tools = steps.reduce((acc, c) => { const k = c.tool || c.label || 'step'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  const last = lastText(st, s.id);
  return [
    `${s.name} · ${s.cli} / ${s.model} · ${s.state}`,
    user.length ? `Task: ${user[0].text}` : 'No task yet.',
    user.length > 1 ? `Follow-ups: ${user.length - 1}` : null,
    steps.length ? `Steps: ${steps.length} (${Object.entries(tools).map(([k, n]) => `${k} ×${n}`).join(', ')})` : 'No steps yet.',
    files.length ? `Files: ${files.join(', ')}` : null,
    commands.length ? `Commands: ${commands.join(', ')}` : null,
    last ? `Last reply: ${last}` : null,
  ].filter(Boolean).join('\n');
}

/* ── the overlays ── */
function menuMarkup(st, ctx) {
  const m = U(st).menu;
  if (!m) return '';
  const items = menuItems(st, m);
  return html`<div class="demo-ui-scrim" data-demo-ui-scrim="menu"></div><div class="x-panel ive-session-context-menu demo-ui-menu" role="menu" data-demo-menu="${m.kind}" data-key="ui-menu" style="left:${Math.round(m.x)}px;top:${Math.round(m.y)}px">${m.summary ? html`<div class="ive-session-context-summary">${m.summary}</div>` : ''}${items.map((it) => (it === 'sep' ? html`<div class="ive-session-context-sep"></div>` : html`<button type="button" role="menuitem" class="ive-session-context-item${it.danger ? ' is-danger' : ''}${it.checked ? ' is-checked' : ''}" data-demo-act="${it.act}"${it.arg != null ? raw(` data-demo-arg="${esc(it.arg)}"`) : ''}${it.color ? raw(` style="--swatch:${it.color}"`) : ''}>${it.color ? html`<span class="demo-ui-swatch" style="background:${it.color}"></span>` : it.icon ? ic(it.icon, 13) : ''}<span class="flex-1 min-w-0${it.hint ? ' demo-ui-item-text' : ' truncate'}">${it.hint ? html`<span class="block truncate">${it.label}</span><span class="demo-ui-hint">${it.hint}</span>` : it.label}</span>${it.checked ? ic('check', 12, 'text-x-accent shrink-0') : ''}${it.kbd ? html`<kbd class="ive-kbd">${it.kbd}</kbd>` : ''}</button>`))}</div>`;
}
function menuItems(st, m) {
  const ui = U(st);
  if (m.kind === 'session') {
    const s = st.sessions.find((x) => x.id === m.sid);
    if (!s) return [];
    return [
      { act: 'rename', arg: s.id, label: 'Rename…', icon: 'pencil' },
      { act: 'clone', arg: s.id, label: 'Clone', icon: 'files' },
      { act: 'copy-output', arg: s.id, label: 'Copy output', icon: 'copy' },
      { act: 'export', arg: s.id, label: 'Export…', icon: 'download' },
      { act: 'summary', arg: s.id, label: 'Summary · learn from this', icon: 'file-text' },
      'sep',
      s.archived ? { act: 'restore', arg: s.id, label: 'Restore from Archive', icon: 'rotate-ccw' } : { act: 'archive', arg: s.id, label: 'Archive', icon: 'archive' },
      s.state === 'running' ? { act: 'stop', arg: s.id, label: 'Stop', icon: 'square' } : null,
      'sep',
      { act: 'delete', arg: s.id, label: 'Delete…', icon: 'trash2', danger: true },
    ].filter(Boolean);
  }
  if (MENUS[m.kind]) return MENUS[m.kind](st, m);
  if (m.kind === 'layout') return [
    // the scope pair of the toolbar, also here (on a phone the toolbar hides the pair)
    { act: 'scope', arg: 'global', label: 'All projects', icon: 'globe', checked: ui.scope === 'global' },
    { act: 'scope', arg: 'workspace', label: `${st.ws.name} only`, icon: 'folder-open', checked: ui.scope === 'workspace' },
    'sep',
    ...LAYOUTS.map(([id, label, icon]) => ({ act: 'layout', arg: id, label, icon, checked: ui.layout === id })),
  ];
  if (m.kind === 'project-color') return COLORS.map((c) => ({ act: 'project-color', arg: `${m.pid}|${c}`, label: c.replace('rgb', '').replace(/[()]/g, '').split(',').map((x) => x.trim()).join(' '), color: c, checked: (projectOf(st, m.pid) || {}).color === c }));
  if (m.kind === 'project') {
    const p = projectOf(st, m.pid);
    if (!p) return [];
    return [
      { act: 'project-new-session', arg: p.id, label: 'New session', icon: 'plus' },
      { act: 'project-rename', arg: p.id, label: 'Rename…', icon: 'pencil' },
      { act: 'project-color-open', arg: p.id, label: 'Colour…', icon: 'palette' },
      { act: 'project-pin', arg: p.id, label: p.pinned ? 'Unpin' : 'Pin', icon: 'pin', checked: p.pinned },
      'sep',
      { act: 'project-remove', arg: p.id, label: 'Remove from IVE…', icon: 'trash2', danger: true },
    ];
  }
  return [];
}

function dialogMarkup(st, ctx) {
  const d = U(st).dialog;
  if (!d) return '';
  const close = html`<button type="button" class="p-1 hover:bg-x-hover text-x-muted hover:text-x-ink-secondary transition-colors rounded" aria-label="Close" data-demo-act="close">${ic('x', 14)}</button>`;
  const btn = (act, label, kind = '') => html`<button type="button" class="ive-btn${kind === 'primary' ? ' ive-btn--primary' : ''}${kind === 'danger' ? ' demo-ui-danger' : ''}" data-demo-act="${act}">${label}</button>`;
  let title = '', body = '', foot = '';
  const s = d.sid ? st.sessions.find((x) => x.id === d.sid) : null;
  const p = d.pid ? projectOf(st, d.pid) : null;
  if (d.kind === 'rename' && s) {
    title = 'Rename session';
    body = html`<label class="demo-ui-label" for="demo-field-name">Name</label><input id="demo-field-name" class="demo-ui-input" data-demo-field="name" value="${d.value}" maxlength="80" autocomplete="off">`;
    foot = html`${btn('close', 'Cancel')}${btn('rename-save', 'Rename', 'primary')}`;
  } else if (d.kind === 'delete' && s) {
    title = 'Delete session';
    body = html`<p class="text-sm text-x-ink break-words"><strong>${s.name}</strong> will be stopped and removed from IVE, including its chat history.</p><p class="text-sm text-x-muted">This cannot be undone. Your project files stay on your computer.</p>`;
    foot = html`${btn('close', 'Cancel')}${btn('delete-confirm', 'Delete', 'danger')}`;
  } else if (d.kind === 'merge') {
    const picked = U(st).selected.map((id) => st.sessions.find((x) => x.id === id)).filter(Boolean);
    title = 'Merge sessions';
    body = html`<div class="text-xs font-medium text-x-ink-secondary">${picked.length} sessions, their context combined</div><div class="space-y-1 max-h-[120px] overflow-y-auto">${picked.map((x) => html`<div class="flex items-center gap-2 px-2 py-1.5 rounded-md bg-x-surface-2 text-xs"><span class="text-x-ink font-medium truncate flex-1">${x.name}</span><span class="text-x-faint font-mono text-[11px]">${x.model}</span><span class="text-x-faint font-mono text-[11px]">${(st.msgs[x.id] || []).length} msgs</span></div>`)}</div><div class="text-xs font-medium text-x-ink-secondary">Strategy</div><div class="flex gap-2"><button type="button" class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-md transition-all ${d.strategy === 'new' ? 'border-x-accent bg-x-tint text-x-ink' : 'border-x-line text-x-ink-secondary hover:bg-x-hover'}" data-demo-act="merge-strategy" data-demo-arg="new" aria-pressed="${d.strategy === 'new'}">${ic('git-merge', 12)}New session</button><button type="button" class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-md transition-all ${d.strategy === 'first' ? 'border-x-accent bg-x-tint text-x-ink' : 'border-x-line text-x-ink-secondary hover:bg-x-hover'}" data-demo-act="merge-strategy" data-demo-arg="first" aria-pressed="${d.strategy === 'first'}">${ic('arrow-right', 12)}Into the first</button></div><label class="demo-ui-label" for="demo-field-name">${d.strategy === 'new' ? 'Name of the new session' : 'Instruction for the merged session'}</label><input id="demo-field-name" class="demo-ui-input" data-demo-field="name" value="${d.value}" maxlength="80" autocomplete="off"><button type="button" class="demo-ui-check" data-demo-act="merge-toggle-delete" role="checkbox" aria-checked="${d.deleteSources}"><span class="demo-ui-checkbox">${d.deleteSources ? ic('check', 10) : ''}</span>${ic('trash2', 11, d.deleteSources ? 'text-x-accent-ink' : 'text-x-faint')}<span>Delete the source sessions after the merge</span></button><p class="text-[11px] text-x-faint leading-relaxed">The merged session gets every prompt and reply of the sources in order; the sources keep running unless you delete them.</p>`;
    foot = html`${btn('close', 'Cancel')}${btn('merge-confirm', `Merge ${picked.length}`, 'primary')}`;
  } else if (d.kind === 'export' && s) {
    title = `Export ${s.name}`;
    body = html`<p class="text-xs text-x-muted">The transcript as Markdown. Download it, or copy the text.</p><textarea class="demo-ui-textarea" data-demo-field="text" rows="10" readonly spellcheck="false">${d.text}</textarea>`;
    foot = html`${btn('copy-text', 'Copy')}${btn('download', 'Download .md', 'primary')}`;
  } else if (d.kind === 'summary' && s) {
    title = `Summary · ${s.name}`;
    body = html`<pre class="demo-ui-pre">${d.text}</pre><p class="text-xs text-x-muted">Saving puts this summary into the project's Knowledge, where the next session can read it.</p>`;
    foot = html`${btn('copy-text', 'Copy')}${btn('summary-save', d.saved ? 'Saved to Knowledge' : 'Save to Knowledge', 'primary')}`;
  } else if (d.kind === 'copy-fallback') {
    title = 'Copy';
    body = html`<p class="text-xs text-x-muted">The browser did not allow the clipboard here. Select the text and copy it.</p><textarea class="demo-ui-textarea" data-demo-field="text" rows="8" readonly spellcheck="false">${d.text}</textarea>`;
    foot = html`${btn('close', 'Done', 'primary')}`;
  } else if (d.kind === 'project-add') {
    title = 'Add project';
    body = html`<label class="demo-ui-label" for="demo-field-name">Name</label><input id="demo-field-name" class="demo-ui-input" data-demo-field="name" value="${d.value}" placeholder="orbit-mobile" maxlength="60" autocomplete="off"><label class="demo-ui-label" for="demo-field-path">Folder</label><input id="demo-field-path" class="demo-ui-input font-mono" data-demo-field="path" value="${d.path}" placeholder="/Projects/orbit-mobile" maxlength="120" autocomplete="off"><p class="text-[11px] text-x-faint leading-relaxed">In the app this points at a folder on your Mac; here it is a project in the browser demo.</p>`;
    foot = html`${btn('close', 'Cancel')}${btn('project-add-confirm', 'Add project', 'primary')}`;
  } else if (d.kind === 'project-rename' && p) {
    title = 'Rename project';
    body = html`<label class="demo-ui-label" for="demo-field-name">Name</label><input id="demo-field-name" class="demo-ui-input" data-demo-field="name" value="${d.value}" maxlength="60" autocomplete="off">`;
    foot = html`${btn('close', 'Cancel')}${btn('project-rename-confirm', 'Rename', 'primary')}`;
  } else if (d.kind === 'project-remove' && p) {
    const n = st.sessions.filter((x) => (x.ws || 'orbit') === p.id).length;
    title = 'Remove project';
    body = html`<p class="text-sm text-x-ink break-words">Remove <strong>${p.name}</strong> from IVE? Its ${n} session${n === 1 ? '' : 's'} will be stopped, and their chat history and saved project data will be deleted.</p><p class="rounded-md bg-x-surface-2 px-3 py-2 text-xs font-mono text-x-muted break-words">${p.path}</p><p class="text-sm text-x-muted">Your project folder and source files stay on your computer. You can connect the folder again.</p>`;
    foot = html`${btn('close', 'Cancel')}${btn('project-remove-confirm', 'Remove', 'danger')}`;
  } else if (d.kind === 'shortcuts') {
    title = 'Keyboard shortcuts';
    const rows = [['⌘K', 'Search sessions, commands and projects'], ['⌘N', 'New session'], ['⌘J', 'Show or hide the terminal drawer'], ['⌘\\', 'Show or hide the sidebar'], ['⌘⇧L', 'Pipelines'], ['Enter', 'Send; while the agent works: queue'], ['Shift+Enter', 'New line'], ['Esc', 'Close the open menu, dialog or fullscreen'], ['?', 'This list']];
    body = html`<dl class="demo-ui-shortcuts">${rows.map(([k, v]) => html`<div><dt><kbd class="ive-kbd">${k}</kbd></dt><dd>${v}</dd></div>`)}</dl>`;
    foot = html`${btn('close', 'Done', 'primary')}`;
  } else if (DIALOGS[d.kind]) {
    const r = DIALOGS[d.kind](st, d, { btn, html, ic, raw, esc });
    if (!r) return '';
    ({ title, body, foot } = r);
  } else return '';
  return html`<div class="fixed inset-0 z-50 flex items-center justify-center bg-x-scrim backdrop-blur-[4px] demo-ui-backdrop" data-demo-ui-scrim="dialog"><div class="x-panel w-[480px] max-h-[80vh] flex flex-col scale-in demo-ui-dialog" role="dialog" aria-modal="true" aria-labelledby="demo-dialog-title" data-demo-dialog="${d.kind}" data-key="ui-dialog"><div class="flex items-center justify-between px-4 py-3 border-b border-x-line"><h2 id="demo-dialog-title" class="text-sm font-semibold text-x-ink">${title}</h2>${close}</div><div class="px-4 py-3 flex flex-col gap-3 overflow-y-auto min-h-0">${body}</div><div class="flex items-center justify-end gap-2 px-4 py-3 border-t border-x-line">${foot}</div></div></div>`;
}

function paletteResults(st) {
  const ui = U(st);
  const q = ui.palette.q.trim().toLowerCase();
  const out = [];
  for (const s of sortedSessions(st, st.sessions.filter((x) => !x.hidden && !x.archived))) if (matches(s, q)) out.push({ kind: 'session', id: s.id, label: s.name, meta: `${s.cli} · ${s.model} · ${s.state}`, icon: 'terminal' });
  for (const c of COMMANDS) if (!q || c.label.toLowerCase().includes(q)) out.push({ kind: 'command', id: c.id, label: c.label, meta: 'Command', icon: c.icon, kbd: c.kbd });
  for (const p of ui.projects) if (!q || p.name.toLowerCase().includes(q)) out.push({ kind: 'project', id: p.id, label: p.name, meta: p.path, icon: 'folder-open', color: p.color });
  return out.slice(0, 40);
}
function mark(text, q) {
  if (!q) return esc(text);
  const i = text.toLowerCase().indexOf(q);
  if (i < 0) return esc(text);
  return `${esc(text.slice(0, i))}<mark class="bg-x-accent/30 text-x-ink rounded px-0.5">${esc(text.slice(i, i + q.length))}</mark>${esc(text.slice(i + q.length))}`;
}
function paletteMarkup(st) {
  const ui = U(st);
  if (!ui.palette.open) return '';
  const q = ui.palette.q.trim().toLowerCase();
  const rows = paletteResults(st);
  const idx = Math.min(ui.palette.idx, Math.max(0, rows.length - 1));
  let lastKind = '';
  const list = rows.map((r, i) => {
    const head = r.kind !== lastKind ? html`<div class="px-4 pt-2 pb-1 text-[10px] uppercase tracking-wide text-x-faint">${r.kind === 'session' ? 'Sessions' : r.kind === 'command' ? 'Commands' : 'Projects'}</div>` : '';
    lastKind = r.kind;
    return html`${head}<button type="button" class="w-full text-left px-4 py-2.5 border-b border-x-line-subtle transition-colors duration-[80ms] ease-x flex items-center gap-2.5${i === idx ? ' bg-x-hover' : ' hover:bg-x-hover'}" data-demo-act="palette-pick" data-demo-arg="${r.kind}:${r.id}" role="option" aria-selected="${i === idx}">${r.color ? html`<span class="demo-ui-swatch" style="background:${r.color}"></span>` : ic(r.icon, 13, 'text-x-muted shrink-0')}<span class="flex-1 min-w-0"><span class="block text-[13px] text-x-ink truncate">${raw(mark(r.label, q))}</span><span class="block text-[11px] text-x-muted truncate">${r.meta}</span></span>${r.kbd ? html`<kbd class="ive-kbd">${r.kbd}</kbd>` : ''}</button>`;
  });
  return html`<div class="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-x-scrim backdrop-blur-[4px] demo-ui-backdrop" data-demo-ui-scrim="palette"><div class="w-[600px] x-panel shadow-x-3 overflow-hidden scale-in demo-ui-palette" role="dialog" aria-label="Search" data-key="ui-palette"><div class="flex items-center gap-2 px-4 border-b border-x-line">${ic('search', 14, 'text-x-muted')}<input data-demo-palette-input="" class="flex-1 py-3 text-[13px] bg-transparent text-x-ink placeholder:text-x-muted focus:outline-none" placeholder="Search sessions, commands and projects…" value="${ui.palette.q}" aria-label="Search" autocomplete="off" spellcheck="false"><kbd class="ive-kbd">esc</kbd></div><div class="max-h-[55vh] overflow-y-auto" role="listbox" data-demo-palette-list="">${rows.length ? list : html`<div class="px-4 py-10 text-xs text-x-muted text-center">No results for “${ui.palette.q}”</div>`}</div></div></div>`;
}

/* ── actions ── */
function openMenu(e, st, api, kind, extra = {}) {
  const b = e.target.closest('button, [role="button"]') || e.target;
  const stage = e.target.ownerDocument.getElementById('stage');
  const sr = stage ? stage.getBoundingClientRect() : { left: 0, top: 0 };
  const r = b.getBoundingClientRect();
  const k = api.ctx.scale || 1;
  U(st).menu = { kind, x: (r.left - sr.left) / k, y: (r.bottom - sr.top) / k + 4, w: r.width / k, ...extra };
  U(st).focusOnce = '[data-demo-menu] [role="menuitem"]';
}
function closeAll(st) { const ui = U(st); ui.menu = null; ui.dialog = null; ui.palette.open = false; }
function openDialog(st, d, focus = '[data-demo-dialog] [data-demo-field]') { U(st).menu = null; U(st).dialog = d; U(st).focusOnce = focus; }

function removeSession(st, api, sid) {
  const ui = U(st);
  st.sessions = st.sessions.filter((s) => s.id !== sid);
  for (const k of ['msgs', 'terms', 'agents', 'queue', 'permission', 'modes', 'tileViews', 'composerTyped', 'termTyped']) if (st[k]) delete st[k][sid];
  st.tabs = st.tabs.filter((x) => x !== sid);
  ui.selected = ui.selected.filter((x) => x !== sid);
  if (ui.order) ui.order = ui.order.filter((x) => x !== sid);
  if (st.activeId === sid) { st.activeId = null; if (st.view === 'session') api.go(st.tabs.length ? 'board' : 'home'); }
  if (st.focus && st.focus.sid === sid) st.focus = null;
}
function cloneSession(st, api, sid) {
  const s = st.sessions.find((x) => x.id === sid);
  if (!s) return null;
  const id = `${sid}-copy-${Object.keys(st.msgs).length + 1}`;
  const row = { ...s, id, name: `${s.name} (copy)`, state: s.state === 'running' ? 'done' : s.state, detail: undefined, hidden: false, age: 'just now', at: st.clock };
  const messages = (st.msgs[sid] || []).map((m) => ({ ...m, id: m.id ? m.id.replace(sid, id) : undefined, running: false, steps: m.steps ? m.steps.map((c) => ({ ...c })) : undefined }));
  api.addSession(row, { messages, lines: (st.terms[sid] ? st.terms[sid].content : []).slice() });
  st.tileViews[id] = st.tileViews[sid] || 'terminal';
  return id;
}
function mergeSessions(st, api, d) {
  const ui = U(st);
  const picked = ui.selected.map((id) => st.sessions.find((x) => x.id === id)).filter(Boolean);
  if (picked.length < 2) return;
  const first = picked[0];
  const text = (d.value || '').trim();
  if (d.strategy === 'new') {
    const name = text || `${first.name} + ${picked.length - 1}`;
    const id = `merged-${Object.keys(st.msgs).length + 1}`;
    const messages = [];
    for (const s of picked) for (const m of st.msgs[s.id] || []) messages.push({ ...m, id: `${id}-${messages.length}`, running: false, steps: m.steps ? m.steps.map((c) => ({ ...c })) : undefined });
    const lines = picked.flatMap((s) => (st.terms[s.id] ? st.terms[s.id].content : []));
    api.addSession({ id, name, cli: first.cli, model: first.model, state: 'done', style: first.style, ws: first.ws, at: st.clock }, { messages, lines });
    st.tileViews[id] = 'terminal';
    api.go('session', id);
  } else {
    for (const s of picked.slice(1)) {
      for (const m of st.msgs[s.id] || []) st.msgs[first.id].push({ ...m, id: `${first.id}-m${st.msgs[first.id].length}`, running: false, steps: m.steps ? m.steps.map((c) => ({ ...c })) : undefined });
      if (st.terms[s.id] && st.terms[first.id]) st.terms[first.id].content.push(...st.terms[s.id].content);
    }
    touch(st, first);
    api.go('session', first.id);
    if (text) api.send(first.id, text);
  }
  if (d.deleteSources) for (const s of (d.strategy === 'new' ? picked : picked.slice(1))) removeSession(st, api, s.id);
  ui.selected = [];
}
function copyText(st, api, text, what = 'Copied') {
  const done = () => { api.toast(`${what} (${text.length} characters)`); U(st).dirty = true; };
  const fail = () => { openDialog(st, { kind: 'copy-fallback', text }, '[data-demo-dialog] textarea'); U(st).dirty = true; };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fail);
    else fail();
  } catch { fail(); }
}
function download(name, text) {
  try {
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch { return false; }
}
function runCommand(st, api, id) {
  const sid = st.activeId;
  switch (id) {
    case 'new': api.go('home'); break;
    case 'home': case 'board': api.go(id); break;
    case 'review': st.review = st.review || { panel: false, full: false, view: 'split' }; if (st.view !== 'session' || !sid) api.go('session', sid || 'review'); st.review.panel = true; st.reviewOpen = true; break;
    case 'pipelines': if (st.pipelines) { st.pipelines.open = 'chooser'; } break;
    case 'task': if (st.flow) { st.flow.open = 'task'; } break;
    case 'terminal': if (st.view === 'session' && sid) st.modes[sid] = (st.modes[sid] || 'overview') === 'overview' ? 'drawer' : 'overview'; else api.go('board'); break;
    case 'sidebar': st.sidebarOpen = !(st.sidebarOpen ?? api.ctx.width >= 1000); break;
    case 'shortcuts': openDialog(st, { kind: 'shortcuts' }, '[data-demo-dialog] button[data-demo-act="close"]'); break;
    case 'settings': case 'connectors': case 'phone': case 'knowledge': case 'cost': api.go(id === 'cost' ? 'settings' : id); if (id === 'cost') st.settingsTab = 'cost'; break;
    default: break;
  }
}

/* ── the module ── */
export default {
  id: 'ui',
  init(state, env) {
    state.ui = { menu: null, dialog: null, palette: { open: false, q: '', idx: 0 }, filter: '', selected: [], sort: 'recent', order: null, layout: 'auto', scope: 'workspace', projects: [{ ...state.ws, pinned: false, collapsed: false }], archivedOpen: false, focusOnce: null, dirty: false, drag: null };
    state.sessions.forEach((s, i) => { if (!s.ws) s.ws = state.ws.id; if (s.at == null) s.at = -i; });
  },

  overlays(state, ctx) {
    return [menuMarkup(state, ctx), dialogMarkup(state, ctx), paletteMarkup(state)];
  },

  /** Every click: menus, dialogs, the palette, the sidebar's own controls, the tile and header buttons. */
  click(e, state, api) {
    const ui = U(state);
    const t = e.target;
    const act = t.closest ? t.closest('[data-demo-act]') : null;
    const scrim = t.closest ? t.closest('[data-demo-ui-scrim]') : null;
    // the scrim behind a menu, a dialog or the palette: close it, nothing underneath gets the click
    if (scrim && !(t.closest('[data-demo-menu], [data-demo-dialog], .demo-ui-palette'))) { closeAll(state); return true; }
    if (act) { if (act.tagName === 'SUMMARY') e.preventDefault(); /* the state renders `open`; no native toggle on top */ this.action(act.getAttribute('data-demo-act'), act.getAttribute('data-demo-arg'), e, state, api); return true; }
    const b = t.closest ? t.closest('button, [role="button"], [role="checkbox"], summary') : null;
    if (!b) {
      // a click inside a dialog or the palette on no control: keep it open
      return !!t.closest('[data-demo-dialog], .demo-ui-palette, [data-demo-menu]');
    }
    const label = b.getAttribute('aria-label') || '';
    const title = b.getAttribute('title') || '';
    // the session menus
    if (b.hasAttribute('data-session-more') || b.classList.contains('ive-session-menu-button')) {
      const card = b.closest('[data-session-id], [data-grid-cell-session]');
      const sid = card ? (card.getAttribute('data-session-id') || card.getAttribute('data-grid-cell-session')) : state.activeId;
      const s = state.sessions.find((x) => x.id === sid);
      openMenu(e, state, api, 'session', { sid, summary: s ? `${s.cli} · ${s.model} · ${s.state}` : '' });
      return true;
    }
    if (label === 'Delete session') { const card = b.closest('[data-session-id]'); if (card) openDialog(state, { kind: 'delete', sid: card.getAttribute('data-session-id') }, '[data-demo-dialog] button[data-demo-act="close"]'); return true; }
    if (b.getAttribute('role') === 'checkbox' && title === 'Select for merge') {
      const card = b.closest('[data-session-id]');
      const sid = card && card.getAttribute('data-session-id');
      if (sid) ui.selected = ui.selected.includes(sid) ? ui.selected.filter((x) => x !== sid) : [...ui.selected, sid];
      return true;
    }
    // search: the sidebar's ⌘, the header's Search, Home's "Find a session", the Board's search
    if (label === 'Search commands' || label === 'Search' || (b.classList.contains('ive-text-action') && /Find a session/.test(b.textContent || ''))) { this.openPalette(state); return true; }
    // the Board's scope and layout
    if (label.startsWith('Global Dashboard')) { ui.scope = 'global'; return true; }
    if (label.startsWith('Workspace Dashboard')) { ui.scope = 'workspace'; return true; }
    if (b.hasAttribute('data-layout-trigger')) { openMenu(e, state, api, 'layout'); return true; }
    // projects
    if (label === 'Add project') { openDialog(state, { kind: 'project-add', value: '', path: '' }); return true; }
    const group = b.closest('[data-workspace-id]');
    const pid = group ? group.getAttribute('data-workspace-id') : null;
    if (pid && /^(Pin|Unpin) project/.test(label)) { const p = projectOf(state, pid); if (p) p.pinned = !p.pinned; return true; }
    if (pid && label.startsWith('Rename project')) { const p = projectOf(state, pid); if (p) openDialog(state, { kind: 'project-rename', pid, value: p.name }); return true; }
    if (pid && (label === 'Delete workspace' || title === 'Remove project from IVE')) { openDialog(state, { kind: 'project-remove', pid }, '[data-demo-dialog] button[data-demo-act="close"]'); return true; }
    if (pid && b.hasAttribute('data-demo-project-color')) { openMenu(e, state, api, 'project-color', { pid }); return true; }
    if (pid && b.hasAttribute('data-demo-project-toggle')) { const p = projectOf(state, pid); if (p) p.collapsed = !p.collapsed; return true; }
    if (b.hasAttribute('data-sidebar-new-session')) { const p = projectOf(state, b.getAttribute('data-sidebar-new-session')); if (p) state.ws = p; api.go('home'); return true; }
    // the sidebar's Knowledge / Settings / Connectors / Phone and the header's Settings (their views come from the settings module)
    if (b.matches('[data-nav="knowledge"], [data-nav="settings"], [data-nav="connectors"], [data-nav="phone"]')) { api.go(b.getAttribute('data-nav')); return true; }
    if (label === 'Settings' && b.classList.contains('ive-header-btn')) { api.go('settings'); return true; }
    if (b.hasAttribute('data-cost-today')) { api.go('settings'); state.settingsTab = 'cost'; return true; }
    return false;
  },

  /** One named action of a menu, a dialog or the palette. */
  action(act, arg, e, state, api) {
    const ui = U(state);
    const d = ui.dialog;
    const s = arg ? state.sessions.find((x) => x.id === arg) : null;
    switch (act) {
      case 'close': closeAll(state); break;
      case 'filter-clear': ui.filter = ''; ui.focusOnce = '.ive-sidebar-filter input'; break;
      case 'palette-open': this.openPalette(state); break;
      case 'palette-pick': { const [kind, id] = arg.split(':'); closeAll(state); if (kind === 'session') { api.go('session', id); touch(state, state.sessions.find((x) => x.id === id)); } else if (kind === 'command') runCommand(state, api, id); else if (kind === 'project') { const p = projectOf(state, id); if (p) { state.ws = p; api.go('board'); } } break; }
      case 'rename': if (s) openDialog(state, { kind: 'rename', sid: s.id, value: s.name }); break;
      case 'rename-save': if (d && d.kind === 'rename') { const row = state.sessions.find((x) => x.id === d.sid); const v = (d.value || '').trim(); if (row && v) { row.name = v; if (state.defs[row.id]) state.defs[row.id].name = v; touch(state, row); } closeAll(state); } break;
      case 'clone': ui.menu = null; { const id = cloneSession(state, api, arg); if (id) api.toast(`Cloned as “${state.sessions.find((x) => x.id === id).name}”`); } break;
      case 'copy-output': ui.menu = null; if (s) copyText(state, api, lastText(state, s.id) || transcriptMarkdown(state, s), 'Output copied'); break;
      case 'export': if (s) openDialog(state, { kind: 'export', sid: s.id, text: transcriptMarkdown(state, s) }, '[data-demo-dialog] button[data-demo-act="download"]'); break;
      case 'download': if (d && d.kind === 'export') { const row = state.sessions.find((x) => x.id === d.sid); const name = `${slugOf(row ? row.name : 'session')}.md`; const ok = download(name, d.text); api.toast(ok ? `Download requested: ${name}. If your browser shows nothing, copy the text instead.` : 'The browser blocked the download; copy the text instead', ok ? 'success' : 'warning'); } break;
      case 'copy-text': if (d && d.text) copyText(state, api, d.text, 'Copied'); break;
      case 'summary': if (s) openDialog(state, { kind: 'summary', sid: s.id, text: summaryOf(state, s), saved: false }, '[data-demo-dialog] button[data-demo-act="summary-save"]'); break;
      case 'summary-save': if (d && d.kind === 'summary' && !d.saved) { const row = state.sessions.find((x) => x.id === d.sid); state.knowledge = state.knowledge || []; state.knowledge.unshift({ id: `note-${Date.now()}`, title: `Summary · ${row ? row.name : 'session'}`, text: d.text, kind: 'summary', at: state.clock }); d.saved = true; api.toast('Saved to Knowledge'); } break;
      case 'archive': ui.menu = null; if (s && api.archive) api.archive(s.id); break;
      case 'restore': ui.menu = null; if (s) { s.hidden = false; s.archived = false; if (!state.tabs.includes(s.id)) state.tabs.push(s.id); state.tileViews[s.id] = state.tileViews[s.id] || 'terminal'; touch(state, s); } break;
      case 'move-up': case 'move-down': if (s) {
        if (ui.sort !== 'manual' || !ui.order) { ui.sort = 'manual'; ui.order = sortedSessions(state, state.sessions).map((x) => x.id); }
        for (const x of state.sessions) if (!ui.order.includes(x.id)) ui.order.unshift(x.id);
        // among the visible siblings of the same project only
        const siblings = ui.order.filter((id) => { const x = state.sessions.find((y) => y.id === id); return x && !x.hidden && (x.ws || 'orbit') === (s.ws || 'orbit'); });
        const i = siblings.indexOf(s.id), j = act === 'move-up' ? i - 1 : i + 1;
        if (i >= 0 && j >= 0 && j < siblings.length) { const other = siblings[j]; const a = ui.order.indexOf(s.id), b = ui.order.indexOf(other); ui.order[a] = other; ui.order[b] = s.id; }
      } break;
      case 'archived-toggle': ui.archivedOpen = !ui.archivedOpen; break;
      case 'stop': ui.menu = null; if (s && api.cancel) api.cancel(s.id); break;
      case 'delete': if (s) openDialog(state, { kind: 'delete', sid: s.id }, '[data-demo-dialog] button[data-demo-act="close"]'); break;
      case 'delete-confirm': if (d && d.kind === 'delete') { const row = state.sessions.find((x) => x.id === d.sid); removeSession(state, api, d.sid); closeAll(state); if (row) api.toast(`Deleted “${row.name}”`); } break;
      case 'merge-open': if (ui.selected.length >= 2) openDialog(state, { kind: 'merge', strategy: 'new', value: '', deleteSources: false }); break;
      case 'merge-clear': ui.selected = []; break;
      case 'merge-strategy': if (d) d.strategy = arg; break;
      case 'merge-toggle-delete': if (d) d.deleteSources = !d.deleteSources; break;
      case 'merge-confirm': if (d && d.kind === 'merge') { mergeSessions(state, api, d); closeAll(state); api.toast('Merged'); } break;
      case 'layout': ui.layout = arg; ui.menu = null; break;
      case 'scope': ui.scope = arg === 'global' ? 'global' : 'workspace'; ui.menu = null; break;
      case 'project-new-session': { const p = projectOf(state, arg); if (p) state.ws = p; ui.menu = null; api.go('home'); break; }
      case 'project-rename': { const p = projectOf(state, arg); if (p) openDialog(state, { kind: 'project-rename', pid: p.id, value: p.name }); break; }
      case 'project-rename-confirm': if (d && d.kind === 'project-rename') { const p = projectOf(state, d.pid); const v = (d.value || '').trim(); if (p && v) { p.name = v; if (state.ws.id === p.id) state.ws = p; } closeAll(state); } break;
      case 'project-color-open': { ui.menu = { ...ui.menu, kind: 'project-color', pid: arg }; ui.focusOnce = '[data-demo-menu] [role="menuitem"]'; break; }
      case 'project-color': { const [pid, color] = arg.split('|'); const p = projectOf(state, pid); if (p) { p.color = color; if (state.ws.id === p.id) state.ws = p; } ui.menu = null; break; }
      case 'project-pin': { const p = projectOf(state, arg); if (p) p.pinned = !p.pinned; ui.menu = null; break; }
      case 'project-remove': openDialog(state, { kind: 'project-remove', pid: arg }, '[data-demo-dialog] button[data-demo-act="close"]'); break;
      case 'project-remove-confirm': if (d && d.kind === 'project-remove') {
        const p = projectOf(state, d.pid);
        for (const row of state.sessions.filter((x) => (x.ws || 'orbit') === d.pid)) removeSession(state, api, row.id);
        ui.projects = ui.projects.filter((x) => x.id !== d.pid);
        if (state.ws.id === d.pid) state.ws = ui.projects[0] || { id: 'none', name: 'No project', color: COLORS[7], path: '' };
        closeAll(state);
        if (!state.sessions.length || state.view === 'board') api.go('home');
        if (p) api.toast(`Removed “${p.name}”. Add a project to continue.`);
      } break;
      case 'project-add-confirm': if (d && d.kind === 'project-add') {
        const name = (d.value || '').trim() || 'New project';
        const id = slugOf(name) + '-' + (ui.projects.length + 1);
        const p = { id, name, path: (d.path || '').trim() || `/Projects/${slugOf(name)}`, color: COLORS[ui.projects.length % COLORS.length], pinned: false, collapsed: false };
        ui.projects.push(p); state.ws = p; closeAll(state); api.go('home'); api.toast(`Project “${name}” added`);
      } break;
      default: if (ACTIONS[act]) ACTIONS[act](arg, e, state, api, { openMenu, openDialog, closeAll, copyText }); break;
    }
  },

  openPalette(state) { const ui = U(state); ui.menu = null; ui.dialog = null; ui.palette = { open: true, q: '', idx: 0 }; ui.focusOnce = '[data-demo-palette-input]'; },

  /** Typed text of the filter, the dialogs and the palette lives in state. */
  input(e, state) {
    const t = e.target;
    if (!t) return false;
    const ui = U(state);
    if (t.hasAttribute('data-demo-palette-input')) { ui.palette.q = t.value; ui.palette.idx = 0; return true; }
    if (t.closest && t.closest('#ive-project-sidebar .ive-sidebar-filter') && t.tagName === 'INPUT') { ui.filter = t.value; return true; }
    if (t.hasAttribute('data-demo-field') && ui.dialog) { const f = t.getAttribute('data-demo-field'); if (f === 'name') ui.dialog.value = t.value; else if (f === 'path') ui.dialog.path = t.value; else if (f !== 'text') ui.dialog[f] = t.value; return true; }
    if (t.hasAttribute('data-demo-select') && t.getAttribute('data-demo-select') === 'sort') {
      ui.sort = t.value === 'manual' ? 'manual' : 'recent';
      if (ui.sort === 'manual' && !ui.order) ui.order = sortedSessions(state, state.sessions).map((s) => s.id);
      return true;
    }
    return false;
  },

  key(e, state, api) {
    const ui = U(state);
    const meta = e.metaKey || e.ctrlKey;
    const t = e.target;
    const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if (ui.palette.open) {
      const rows = paletteResults(state);
      if (e.key === 'Escape') { ui.palette.open = false; return true; }
      if (e.key === 'ArrowDown') { ui.palette.idx = Math.min(rows.length - 1, ui.palette.idx + 1); return true; }
      if (e.key === 'ArrowUp') { ui.palette.idx = Math.max(0, ui.palette.idx - 1); return true; }
      if (e.key === 'Enter') { const r = rows[Math.min(ui.palette.idx, rows.length - 1)]; if (r) this.action('palette-pick', `${r.kind}:${r.id}`, e, state, api); return true; }
      return false;
    }
    if (ui.menu) {
      if (e.key === 'Escape') { ui.menu = null; return true; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const items = Array.from(t.ownerDocument.querySelectorAll('[data-demo-menu] [role="menuitem"]'));
        const i = items.indexOf(t.ownerDocument.activeElement);
        const n = items.length ? (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length : -1;
        if (n >= 0) items[n].focus();
        return false; // nothing to re-render
      }
      return false;
    }
    if (ui.dialog) {
      if (e.key === 'Escape') { ui.dialog = null; return true; }
      if (e.key === 'Enter' && typing && t.tagName === 'INPUT') {
        const primary = { rename: 'rename-save', merge: 'merge-confirm', 'project-add': 'project-add-confirm', 'project-rename': 'project-rename-confirm' }[ui.dialog.kind];
        if (primary) { this.action(primary, null, e, state, api); return true; }
      }
      return false;
    }
    if (meta && (e.key === 'k' || e.key === 'K')) { this.openPalette(state); return true; }
    if (meta && !e.shiftKey && (e.key === 'n' || e.key === 'N')) { api.go('home'); return true; }
    if (meta && e.key === '\\') { state.sidebarOpen = !(state.sidebarOpen ?? api.ctx.width >= 1000); return true; }
    if (!typing && !meta && e.key === '?') { openDialog(state, { kind: 'shortcuts' }, '[data-demo-dialog] button[data-demo-act="close"]'); return true; }
    if (e.key === 'Escape' && typing && t.closest && t.closest('#ive-project-sidebar .ive-sidebar-filter') && ui.filter) { ui.filter = ''; return true; }
    return false;
  },

  /** Drag to reorder sessions in the sidebar (manual order). */
  drag(e, state) {
    const ui = U(state);
    const card = e.target && e.target.closest ? e.target.closest('[data-reorder-session]') : null;
    if (e.type === 'dragstart') { if (!card || !card.closest('[data-session-id]')) return false; ui.drag = card.getAttribute('data-reorder-session'); try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', ui.drag); } catch { /* old engines */ } return false; }
    if (e.type === 'dragover') { if (ui.drag && card && card.closest('[data-session-id]')) { e.preventDefault(); const over = card.getAttribute('data-reorder-session'); if (over !== ui.dragOver) { ui.dragOver = over; return true; } } return false; }
    if (e.type === 'drop') {
      if (!ui.drag || !card) { ui.drag = null; ui.dragOver = null; return true; }
      e.preventDefault();
      const to = card.getAttribute('data-reorder-session');
      if (to && to !== ui.drag) {
        if (ui.sort !== 'manual' || !ui.order) { ui.sort = 'manual'; ui.order = sortedSessions(state, state.sessions).map((s) => s.id); }
        for (const s of state.sessions) if (!ui.order.includes(s.id)) ui.order.unshift(s.id);
        // dropped on a sibling: before it when coming from below, after it when coming from above
        const from = ui.order.indexOf(ui.drag), at = ui.order.indexOf(to);
        ui.order.splice(from, 1);
        ui.order.splice(at, 0, ui.drag);
      }
      ui.drag = null; ui.dragOver = null;
      return true;
    }
    if (e.type === 'dragend') { const had = !!ui.drag; ui.drag = null; ui.dragOver = null; return had; }
    return false;
  },

  tick(state) { const ui = U(state); if (ui.dirty) { ui.dirty = false; return true; } return false; },

  /** Focus the control a menu, a dialog or the palette opened with; keep a menu inside the window. */
  after(state, root, ctx) {
    const ui = U(state);
    const doc = root.ownerDocument;
    if (ui.focusOnce) {
      const el = root.querySelector(ui.focusOnce);
      if (el) { ui.focusOnce = null; try { el.focus({ preventScroll: true }); if (el.select && el.tagName === 'INPUT') el.select(); } catch { /* ignore */ } }
    }
    const menu = root.querySelector('[data-demo-menu]');
    if (menu && ui.menu) {
      const w = menu.offsetWidth, h = menu.offsetHeight;
      let x = ui.menu.x, y = ui.menu.y;
      if (x + w > ctx.width - 8) x = Math.max(8, ctx.width - 8 - w);
      if (y + h > ctx.height - 8) y = Math.max(8, ui.menu.y - h - (ui.menu.h || 28) - 8);
      menu.style.left = `${Math.round(x)}px`; menu.style.top = `${Math.round(y)}px`;
    }
    void doc;
  },
};

export { openMenu, openDialog, closeAll, copyText, lastText };

/** For the sidebar: the sessions of a project in the chosen order, filtered. */
export function sidebarSessions(st, pid) {
  const ui = U(st);
  const q = (ui.filter || '').trim().toLowerCase();
  return sortedSessions(st, st.sessions.filter((s) => !s.hidden && (s.ws || 'orbit') === pid && matches(s, q)));
}
export function sidebarProjects(st) {
  const ui = U(st);
  return [...ui.projects].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
}
export function boardTabs(st) {
  const ui = U(st);
  if (!ui || ui.scope === 'global') return st.tabs;
  return st.tabs.filter((id) => { const s = st.sessions.find((x) => x.id === id); return s && (s.ws || 'orbit') === st.ws.id; });
}
export const uiState = U;
export { str };
