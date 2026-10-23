// Module "session" of the IVE app built into the site (lib/app.js): the controls of a session that
// the app has and a visitor expects to work (round 7, wave 2). The model and agent-mode menus,
// Options, Details, History, Copy message, attachments (a real file picker, read locally, never
// uploaded), dictation (the browser's speech recognition when it is there, an honest fallback when
// not), Add context (project files and Knowledge notes as chips), the side chat (⌘⇧J, "Ask on the
// side", /btw: answers come from the session's transcript, no model call), the brief disclosure,
// the permission request's Refresh and "View exact request", the queue's Edit/Remove/Hide.
//
// State: state.sidechat = { open, sid, q, messages[] }, state.briefOpen[sid], state.details[sid],
//        state.attachments[sid][], state.context[sid][], s.options, s.mode, st.permission[sid].open/refreshed.
// Hooks: data-demo-act: model-set, mode-set, option-toggle, history-reuse, context-add, chip-remove,
//        request-toggle, sidechat-close, sidechat-send, sidechat-starter; [data-demo-sidechat-input];
//        [data-demo-chip-row]; menus [data-demo-menu="model|mode|options"]; dialogs history|context.
import { html, raw, esc } from './dom.js';
import { ic } from './ui.js';
import { MENUS, DIALOGS, ACTIONS, openMenu, openDialog, closeAll, copyText, summaryOf } from './mod-ui.js';

const MODELS = { claude: ['haiku', 'sonnet', 'opus'], codex: ['gpt-5-codex', 'gpt-5', 'o4-mini'], gemini: ['gemini-2.5-pro', 'gemini-2.5-flash'] };
const MODES = [['Default', 'Asks before each action'], ['Auto', 'Approves most actions, asks for risky ones'], ['Plan', 'Plans only, makes no edits'], ['Accept Edits', 'Applies file edits without asking'], ['Don’t Ask', 'Never asks; the Safety Gate still stops risky commands'], ['Skip agent approvals', 'Sub-agents run without approvals']];
const OPTIONS = [['sound', 'Sound when the turn ends', 'A short chime from this browser'], ['compact', 'Compact steps', 'Collapses the activity groups'], ['autoscroll', 'Follow the transcript', 'Keeps the newest rows in view']];
export const DEFAULT_OPTIONS = { sound: false, compact: false, autoscroll: true };
export const optionsOf = (s) => s.options || DEFAULT_OPTIONS;

/** A short chime (WebAudio, no file): the option "Sound when the turn ends". Needs a user gesture once; the option click is one. */
let audio = null;
export function chime() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    audio = audio || new AC();
    if (audio.state === 'suspended') audio.resume();
    const t = audio.currentTime;
    for (const [f, at] of [[880, 0], [1320, 0.12]]) {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + at); g.gain.exponentialRampToValueAtTime(0.18, t + at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.25);
      o.connect(g); g.connect(audio.destination); o.start(t + at); o.stop(t + at + 0.3);
    }
    return true;
  } catch { return false; }
}

/** The box a visitor is writing in: the terminal composer when the terminal fills the session, else the Overview composer. */
export function composerTarget(st, sid) {
  return (st.modes[sid] || 'overview') === 'full' ? { key: 'termTyped', sel: '[data-terminal-composer] input' } : { key: 'composerTyped', sel: 'form.ive-session-composer textarea' };
}
const PROJECT_FILES = ['README.md', 'package.json', 'src/components/layout/Sidebar.jsx', 'src/components/ThemeToggle.jsx', 'src/hooks/useTheme.js', 'src/hooks/useShortcuts.js', 'src/lib/api.js', 'tests/sign-in.test.js', 'docs/ARCHITECTURE.md'];
const STARTERS = ['What is it doing right now?', 'Which files did it change?', 'Summarize the session so far'];

const sidOf = (el, st) => { const c = el && el.closest ? el.closest('[data-session-id], [data-grid-cell-session]') : null; return (c && (c.getAttribute('data-session-id') || c.getAttribute('data-grid-cell-session'))) || st.activeId; };
const sessionOf = (st, sid) => st.sessions.find((x) => x.id === sid);
const stepsOf = (st, sid) => (st.msgs[sid] || []).flatMap((m) => (m.role === 'assistant' && m.steps ? m.steps : []));
const elapsed = (st, s) => { const a = st.agents[s.id]; return a ? `${Math.max(0, Math.round(st.clock - a.started))}s` : null; };

/* ── what the renderers get per session ── */
export function sessionExtras(st, sid) {
  const s = sessionOf(st, sid);
  if (!s) return {};
  const open = !!(st.briefOpen && st.briefOpen[sid]);
  return { briefOpen: open, briefDetails: open ? briefDetails(st, s) : '', details: !!(st.details && st.details[sid]), chips: chipRow(st, sid) };
}
function briefDetails(st, s) {
  const msgs = st.msgs[s.id] || [];
  const user = msgs.filter((m) => m.role === 'user');
  const steps = stepsOf(st, s.id);
  const last = steps[steps.length - 1];
  const el = elapsed(st, s);
  const rows = [
    ['Status', `${s.state}${el ? ` · ${el} in this turn` : ''}`],
    ['Task', user.length ? user[0].text : '—'],
    user.length > 1 ? ['Last instruction', user[user.length - 1].text] : null,
    ['Last action', last ? `${last.tool || 'Step'} ${last.command || last.input || ''}`.trim() : '—'],
    ['Steps', String(steps.length)],
    ['Model · mode', `${s.model} · ${s.mode || 'Default'}`],
    (st.context && st.context[s.id] && st.context[s.id].length) ? ['Context', st.context[s.id].map((c) => c.name).join(', ')] : null,
  ].filter(Boolean);
  return html`<dl class="demo-brief-details">${rows.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>`;
}
function chipRow(st, sid) {
  const att = (st.attachments && st.attachments[sid]) || [];
  const ctxs = (st.context && st.context[sid]) || [];
  if (!att.length && !ctxs.length) return '';
  const chip = (kind, c) => html`<span class="ive-sidechat-chip demo-chip" data-key="chip-${kind}-${c.id}">${ic(kind === 'file' ? 'paperclip' : c.kind === 'note' ? 'book-open' : 'file-text', 11)}<span title="${c.name}">${c.name}</span>${c.meta ? html`<small>${c.meta}</small>` : ''}<button type="button" aria-label="Remove ${c.name}" data-demo-act="chip-remove" data-demo-arg="${sid}|${kind}|${c.id}">${ic('x', 10)}</button></span>`;
  return html`<div class="demo-chip-row" data-demo-chip-row="">${att.map((a) => chip('file', a))}${ctxs.map((c) => chip('context', c))}</div>`;
}

/* ── the side chat ── */
const SC = (st) => st.sidechat || (st.sidechat = { open: false, sid: null, q: '', messages: [] });
function reply(st, sid, q) {
  const s = sessionOf(st, sid);
  if (!s) {
    // the Board or Home: answer about the workspace
    const all = st.sessions.filter((x) => !x.hidden);
    const waiting = all.filter((x) => x.state === 'waiting'), running = all.filter((x) => x.state === 'running');
    const text = q.toLowerCase();
    if (/need|wait|attention|stuck/.test(text)) return waiting.length ? `${waiting.length} session${waiting.length === 1 ? '' : 's'} need${waiting.length === 1 ? 's' : ''} you: ${waiting.map((x) => `${x.name} (${st.permission[x.id] ? st.permission[x.id].command : x.detail || 'reply'})`).join(', ')}. Open one to answer there.` : 'Nothing waits for you right now.';
    if (/summar|doing|status|overview|what/.test(text)) return `${st.ws.name}: ${all.length} sessions, ${running.length} running, ${waiting.length} waiting, ${all.length - running.length - waiting.length} done. ${running.length ? `Running: ${running.map((x) => x.name).join(', ')}.` : ''} Open a session and ask me about it.`;
    return `I can see the whole ${st.ws.name} workspace: ${all.map((x) => `${x.name} (${x.state})`).join(', ')}. Ask what needs you, or open a session for details.`;
  }
  const text = q.toLowerCase();
  const steps = stepsOf(st, sid);
  const last = steps[steps.length - 1];
  const files = [...new Set(steps.map((c) => c.input || '').filter((x) => /\.[a-z]{1,4}$/i.test(x)))];
  const lastReply = [...(st.msgs[sid] || [])].reverse().find((m) => m.role === 'assistant' && m.text);
  if (/doing|status|now|busy|working|progress/.test(text)) return `${s.name} is ${s.state}${elapsed(st, s) ? ` (${elapsed(st, s)} into this turn)` : ''}. ${last ? `Last step: ${last.tool || 'step'} ${last.command || last.input || ''}.` : 'No steps yet.'} ${steps.length} step${steps.length === 1 ? '' : 's'} so far.`;
  if (/file|chang|diff|edit|touch/.test(text)) return files.length ? `Files it touched so far: ${files.join(', ')}. Review shows the diff.` : 'It has not opened or changed a file yet.';
  if (/summar|recap|so far/.test(text)) return summaryOf(st, s);
  if (/model|mode|permission|allow/.test(text)) return `${s.name} runs ${s.cli} with model ${s.model}, agent mode ${s.mode || 'Default'}.${st.permission[sid] ? ` It is waiting for your answer on “${st.permission[sid].command}”.` : ''}`;
  if (/test|check|pass|fail/.test(text)) { const t = steps.filter((c) => /test|check/i.test(`${c.command || ''} ${c.input || ''} ${c.result || ''}`)); return t.length ? t.map((c) => `${c.command || c.input}: ${c.result || 'ran'}`).join(' · ') : 'No test runs in this session yet.'; }
  if (/why|how|explain/.test(text)) return lastReply ? `Its last reply: “${lastReply.text}”. The steps above it show how it got there.` : 'It has not explained anything yet; its steps are in the activity rows.';
  return `I read the transcript of ${s.name}: ${lastReply ? `last reply “${lastReply.text.slice(0, 120)}${lastReply.text.length > 120 ? '…' : ''}”` : `${steps.length} steps, no reply yet`}. Ask about its status, files, tests, model or a summary.`;
}
/** "/btw question" from any composer or terminal: the side chat answers, the agent is not interrupted (the core's sendInstruction calls this). */
export function aside(st, sid, text) {
  const q = text.replace(/^\/btw\s*/, '').trim();
  const sc = SC(st);
  if (q) ask(st, sid, q); else { sc.open = true; sc.sid = sid; }
  st.ui.focusOnce = '[data-demo-sidechat-input]';
}
/** Steps the reply program starts with when the message carries attachments or context: the agent reads them first. */
export function contextSteps(st, sid, S) {
  const out = [];
  for (const a of (st.attachments && st.attachments[sid]) || []) {
    const lines = a.text ? a.text.split(/\r?\n/).length : 0;
    out.push({ d: 0.9, kind: 'step', step: S('Read', a.name, a.kind === 'image' ? `Image, ${a.meta}` : a.text ? `Read ${lines} line${lines === 1 ? '' : 's'}: “${a.text.slice(0, 60).replace(/\s+/g, ' ')}${a.text.length > 60 ? '…' : ''}”` : `Read ${a.meta}`) });
  }
  for (const c of (st.context && st.context[sid]) || []) out.push({ d: 0.7, kind: 'step', step: S('Read', c.kind === 'note' ? `Knowledge: ${c.name}` : c.name, c.kind === 'note' ? `Applied: ${(c.text || '').split('\n')[0].slice(0, 70)}` : 'Loaded as context') });
  return out;
}
function ask(st, sid, q) {
  const sc = SC(st);
  sc.open = true; sc.sid = sid || sc.sid || st.activeId;
  const key = sessionOf(st, sc.sid) ? sc.sid : null;
  sc.messages.push({ role: 'you', text: q, sid: key }, { role: 'claude', text: reply(st, key, q), sid: key });
  sc.q = '';
}
export function sidechatPanel(st, ctx) {
  const sc = SC(st);
  const s = sessionOf(st, sc.sid || st.activeId);
  const msgs = sc.messages.filter((m) => (s ? m.sid === s.id : !m.sid));
  return html`<aside id="ive-sidechat" class="ive-sidechat demo-sidechat" aria-label="Side chat" data-key="sidechat"><div class="ive-sidechat-header"><div class="ive-sidechat-mark">${ic('message-circle', 15)}</div><div class="min-w-0 flex-1"><div class="ive-sidechat-eyebrow">Side chat</div><div class="text-[12px] text-x-muted truncate">${s ? `About ${s.name}` : `About ${st.ws.name}`} · does not interrupt the task</div></div><button type="button" class="ive-sidechat-icon" aria-label="Close the side chat" data-demo-act="sidechat-close">${ic('x', 14)}</button></div><div class="ive-sidechat-context"><span class="ive-sidechat-context-note">Answers come from this session’s transcript; the demo makes no model call.</span></div><div class="ive-sidechat-scroll" data-stick="">${msgs.length ? msgs.map((m, i) => html`<div class="ive-sidechat-message is-${m.role}" data-key="sc-${i}"><div class="ive-sidechat-message-label">${m.role === 'you' ? 'You' : 'Claude'}</div><div class="demo-sidechat-text">${m.text}</div></div>`) : html`<div class="ive-sidechat-empty"><strong>${s ? 'Ask about this session while it works.' : 'Ask about the workspace.'}</strong><span>${s ? 'Status, files, tests, a summary.' : 'What needs you, what runs, a summary.'}</span></div>`}<div class="ive-sidechat-starters">${STARTERS.map((q) => html`<button type="button" class="ive-sidechat-chip" data-demo-act="sidechat-starter" data-demo-arg="${q}">${q}</button>`)}</div></div><div class="ive-sidechat-composer"><input class="ive-sidechat-input" data-demo-sidechat-input="" placeholder="Ask on the side…" value="${sc.q}" aria-label="Side chat message" autocomplete="off"><button type="button" class="ive-sidechat-send" data-demo-act="sidechat-send" aria-label="Send"${sc.q.trim() ? '' : raw(' disabled=""')}>${ic('send', 13)}</button></div></aside>`;
}

/* ── menus and dialogs registered with the ui module ── */
MENUS.model = (st, m) => {
  const s = sessionOf(st, m.sid);
  if (!s) return [];
  const list = [...new Set([...(MODELS[s.cli] || MODELS.claude), s.model])];
  return list.map((name) => ({ act: 'model-set', arg: `${s.id}|${name}`, label: name, icon: 'cpu', checked: s.model === name }));
};
MENUS.mode = (st, m) => {
  const s = sessionOf(st, m.sid);
  if (!s) return [];
  return MODES.map(([name, hint]) => ({ act: 'mode-set', arg: `${s.id}|${name}`, label: name, hint, icon: 'shield', checked: (s.mode || 'Default') === name }));
};
MENUS.options = (st, m) => {
  const s = sessionOf(st, m.sid);
  if (!s) return [];
  const o = optionsOf(s);
  return OPTIONS.map(([key, label, hint]) => ({ act: 'option-toggle', arg: `${s.id}|${key}`, label, hint, icon: o[key] ? 'square-check' : 'square', checked: !!o[key] }));
};
DIALOGS.history = (st, d, { btn, html: h }) => {
  const s = sessionOf(st, d.sid);
  if (!s) return null;
  const prompts = (st.msgs[s.id] || []).filter((m) => m.role === 'user');
  return {
    title: `History · ${s.name}`,
    body: prompts.length ? h`<ol class="demo-history">${prompts.map((m, i) => h`<li><div class="demo-history-text">${m.text}</div><div class="demo-history-meta"><time>${m.time || ''}</time><button type="button" class="ive-project-action" data-demo-act="history-reuse" data-demo-arg="${s.id}|${i}">${ic('rotate-ccw', 11)}Reuse</button></div></li>`)}</ol>` : h`<p class="text-sm text-x-muted">No instructions yet.</p>`,
    foot: h`${btn('close', 'Done', 'primary')}`,
  };
};
DIALOGS.context = (st, d, { btn, html: h }) => {
  const s = sessionOf(st, d.sid);
  if (!s) return null;
  const have = new Set(((st.context && st.context[s.id]) || []).map((c) => c.id));
  const q = (d.q || '').toLowerCase();
  const files = PROJECT_FILES.filter((f) => !q || f.toLowerCase().includes(q));
  const notes = (st.knowledge || []).filter((n) => !q || n.title.toLowerCase().includes(q));
  return {
    title: `Add context · ${s.name}`,
    body: h`<input class="demo-ui-input" data-demo-field="q" value="${d.q || ''}" placeholder="Filter files and notes…" aria-label="Filter" autocomplete="off"><div class="demo-ui-label">Project files</div><div class="demo-pick-list">${files.map((f) => h`<button type="button" class="demo-pick${have.has(f) ? ' is-on' : ''}" data-demo-act="context-add" data-demo-arg="${s.id}|file|${f}" aria-pressed="${have.has(f)}">${ic('file-text', 12)}<span class="truncate">${f}</span>${have.has(f) ? ic('check', 12, 'text-x-accent') : ''}</button>`)}</div><div class="demo-ui-label">Knowledge</div><div class="demo-pick-list">${notes.length ? notes.map((n) => h`<button type="button" class="demo-pick${have.has(n.id) ? ' is-on' : ''}" data-demo-act="context-add" data-demo-arg="${s.id}|note|${n.id}" aria-pressed="${have.has(n.id)}">${ic('book-open', 12)}<span class="truncate">${n.title}</span>${have.has(n.id) ? ic('check', 12, 'text-x-accent') : ''}</button>`) : h`<p class="text-[11px] text-x-faint">No notes yet. A session’s Summary saves one.</p>`}</div>`,
    foot: h`${btn('close', 'Done', 'primary')}`,
  };
};

/* ── actions ── */
ACTIONS['model-set'] = (arg, e, st, api) => { const [sid, model] = arg.split('|'); const s = sessionOf(st, sid); if (!s) return; st.ui.menu = null; if (s.model === model) return; s.model = model; if (st.defs[sid]) st.defs[sid].model = model; api.toast(`${s.name}: model ${model}. The session restarts with it and continues the conversation.`); };
ACTIONS['mode-set'] = (arg, e, st, api) => { const [sid, mode] = arg.split('|'); const s = sessionOf(st, sid); if (!s) return; st.ui.menu = null; s.mode = mode; api.toast(`${s.name}: agent mode ${mode}.`); };
ACTIONS['option-toggle'] = (arg, e, st, api) => {
  const [sid, key] = arg.split('|'); const s = sessionOf(st, sid); if (!s) return;
  s.options = { ...optionsOf(s) }; s.options[key] = !s.options[key];
  if (key === 'compact') for (const m of st.msgs[sid] || []) if (m.steps) m.open = !s.options.compact && m.open;
  if (key === 'sound' && s.options.sound) { if (chime()) api.toast('Sound on: this chime plays when a turn of this session ends.'); else api.toast('This browser has no audio output here; the option stays on but silent.', 'warning'); }
};
ACTIONS['history-reuse'] = (arg, e, st) => { const [sid, i] = arg.split('|'); const prompts = (st.msgs[sid] || []).filter((m) => m.role === 'user'); const m = prompts[Number(i)]; if (!m) return; const tgt = composerTarget(st, sid); st[tgt.key][sid] = m.text; closeAll(st); st.ui.focusOnce = tgt.sel; };
ACTIONS['context-add'] = (arg, e, st, api) => {
  const [sid, kind, id] = arg.split('|');
  st.context = st.context || {}; st.context[sid] = st.context[sid] || [];
  const list = st.context[sid];
  const i = list.findIndex((c) => c.id === id);
  if (i >= 0) { list.splice(i, 1); return; }
  if (kind === 'file') list.push({ id, name: id, kind: 'file', meta: 'file' });
  else { const n = (st.knowledge || []).find((x) => x.id === id); if (n) list.push({ id, name: n.title, kind: 'note', meta: 'note', text: n.text }); }
};
ACTIONS['chip-remove'] = (arg, e, st) => { const [sid, kind, id] = arg.split('|'); if (kind === 'file' && st.attachments && st.attachments[sid]) st.attachments[sid] = st.attachments[sid].filter((a) => a.id !== id); if (kind === 'context' && st.context && st.context[sid]) st.context[sid] = st.context[sid].filter((c) => c.id !== id); };
ACTIONS['request-toggle'] = (arg, e, st) => { const p = st.permission[arg]; if (p) p.open = !p.open; };
ACTIONS['sidechat-close'] = (arg, e, st) => { SC(st).open = false; };
ACTIONS['sidechat-send'] = (arg, e, st) => { const sc = SC(st); const q = sc.q.trim(); if (q) ask(st, sc.sid || st.activeId, q); st.ui.focusOnce = '[data-demo-sidechat-input]'; };
ACTIONS['sidechat-starter'] = (arg, e, st) => { ask(st, SC(st).sid || st.activeId, arg); st.ui.focusOnce = '[data-demo-sidechat-input]'; };

/* ── dictation ── */
function dictate(st, api, sid, textarea, key = 'composerTyped') {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) { api.toast('Dictation needs the browser’s speech recognition, which this one lacks. Type instead.', 'warning'); if (textarea) textarea.focus(); return; }
  if (st.dictation) { try { st.dictation.stop(); } catch { /* ignore */ } st.dictation = null; st.dictating = null; api.toast('Dictation stopped.'); return; }
  try {
    const r = new Rec();
    r.interimResults = true; r.continuous = false; r.lang = navigator.language || 'en-US';
    const base = st[key][sid] || '';
    r.onresult = (ev) => { let t = ''; for (const res of ev.results) t += res[0].transcript; st[key][sid] = (base ? base + ' ' : '') + t; st.ui.dirty = true; };
    r.onerror = (ev) => { st.dictation = null; st.dictating = null; api.toast(ev.error === 'not-allowed' ? 'The microphone was not allowed. Type instead.' : `Dictation is not available here (${ev.error}). Type instead.`, 'warning'); if (textarea) textarea.focus(); st.ui.dirty = true; };
    r.onend = () => { if (st.dictation === r) { st.dictation = null; st.dictating = null; st.ui.dirty = true; } };
    r.start();
    st.dictation = r; st.dictating = sid;
    api.toast('Listening… speak your instruction; click the microphone again to stop.');
  } catch (err) { api.toast(`Dictation could not start (${err.message}). Type instead.`, 'warning'); if (textarea) textarea.focus(); }
}

/* ── the module ── */
export default {
  id: 'session',
  init(state) { state.briefOpen = {}; state.details = {}; state.attachments = {}; state.context = {}; state.sidechat = { open: false, sid: null, q: '', messages: [] }; },

  click(e, state, api) {
    const t = e.target;
    const b = t.closest ? t.closest('button, [role="button"], summary') : null;
    if (!b) return false;
    const label = b.getAttribute('aria-label') || '';
    const title = b.getAttribute('title') || '';
    const text = (b.textContent || '').trim();
    const sid = sidOf(b, state);
    // the launch strip: model and agent mode
    const strip = b.closest('.ive-strip-launch');
    if (strip) { const ssid = strip.getAttribute('data-session-id') || sid; openMenu(e, state, api, strip.getAttribute('data-testid') === 'chat-header-model' ? 'model' : 'mode', { sid: ssid }); return true; }
    if (b.classList.contains('ive-chat-text-button')) {
      if (/^Options/.test(text)) { openMenu(e, state, api, 'options', { sid }); return true; }
      if (/History/.test(text)) { openDialog(state, { kind: 'history', sid }, '[data-demo-dialog] button[data-demo-act]'); return true; }
    }
    if (b.classList.contains('ive-strip-process')) { state.details[sid] = !state.details[sid]; for (const m of state.msgs[sid] || []) if (m.steps && m.steps.length) m.open = state.details[sid]; return true; }
    if (label === 'Copy message') {
      const row = b.closest('[data-chat-message-id]');
      const id = row ? row.getAttribute('data-chat-message-id').replace(/-t$/, '') : '';
      const m = (state.msgs[sid] || []).find((x) => x.id === id) || null;
      const content = m ? (m.text || (m.steps ? m.steps.map((c) => `${c.tool || ''} ${c.command || c.input || ''} ${c.result ? '→ ' + c.result : ''}`.trim()).join('\n') : '')) : (row ? row.textContent.trim() : '');
      if (content) copyText(state, api, content, 'Message copied');
      return true;
    }
    if (title.startsWith('Attach')) { const form = b.closest('form'); const input = form && form.querySelector('input[type="file"]'); if (input) { input.setAttribute('data-demo-attach', sid); input.click(); } return false; }
    if (title.startsWith('Dictate')) { const form = b.closest('form'); const inTerminal = !!b.closest('[data-terminal-composer]'); dictate(state, api, sid, form && form.querySelector('textarea, input[placeholder]'), inTerminal ? 'termTyped' : 'composerTyped'); return true; }
    if (b.closest('.ive-aside-entry')) { const sc = SC(state); sc.open = true; sc.sid = sid; state.ui.focusOnce = '[data-demo-sidechat-input]'; return true; }
    if (label === 'Chat with Claude') { const sc = SC(state); sc.open = !sc.open; if (sc.open) { sc.sid = state.activeId || sc.sid; state.ui.focusOnce = '[data-demo-sidechat-input]'; } return true; }
    if (b.getAttribute('data-tour') === 'session-context') {
      const target = sid || (state.tabs.find((id) => { const x = sessionOf(state, id); return x && !x.hidden; }) || (state.sessions.find((x) => !x.hidden) || {}).id);
      if (!target) { api.toast('Start a session first; context is added per session.'); return true; }
      openDialog(state, { kind: 'context', sid: target, q: '' }, '[data-demo-dialog] input');
      return true;
    }
    if (b.classList.contains('ive-brief-toggle')) { state.briefOpen[sid] = !state.briefOpen[sid]; return true; }
    if (label === 'Refresh current request') { const p = state.permission[sid]; if (p) { p.refreshed = api.now(); api.toast('The request is current: the agent still waits for your answer.'); } return true; }
    if (label === 'Edit queued message') {
      const q = state.queue[sid];
      if (q) {
        const tgt = composerTarget(state, sid);
        // the 📎 line goes back into chips, the text back into the box
        const m = /\n📎 (.+)$/.exec(q.text);
        state[tgt.key][sid] = m ? q.text.slice(0, m.index) : q.text;
        if (q.attachments && q.attachments.length) state.attachments[sid] = [...(state.attachments[sid] || []), ...q.attachments];
        delete state.queue[sid]; if (state.terms[sid]) state.terms[sid].queued = null; state.ui.focusOnce = tgt.sel;
      }
      return true;
    }
    if (label === 'Remove queued message') { delete state.queue[sid]; if (state.terms[sid]) state.terms[sid].queued = null; return true; }
    if (label === 'Hide from queue') { const q = state.queue[sid]; if (q) q.hidden = true; return true; }
    return false;
  },

  input(e, state) {
    const t = e.target;
    if (t && t.hasAttribute && t.hasAttribute('data-demo-sidechat-input')) { SC(state).q = t.value; return true; }
    return false;
  },

  /** A chosen file: read locally, shown as a chip; never leaves the browser. */
  change(e, state, api) {
    const t = e.target;
    if (!t || t.type !== 'file') return false;
    const sid = t.getAttribute('data-demo-attach') || sidOf(t, state);
    const files = Array.from(t.files || []);
    if (!files.length) return false;
    state.attachments[sid] = state.attachments[sid] || [];
    for (const f of files) {
      const a = { id: `${Date.now()}-${f.name}`, name: f.name, size: f.size, kind: f.type.startsWith('image/') ? 'image' : 'text', meta: f.size < 1024 ? `${f.size} B` : `${Math.round(f.size / 1024)} KB`, text: '' };
      state.attachments[sid].push(a);
      if (a.kind === 'text' && f.size < 200000) { const r = new FileReader(); r.onload = () => { a.text = String(r.result || '').slice(0, 20000); state.ui.dirty = true; }; r.readAsText(f); }
    }
    try { t.value = ''; } catch { /* ignore */ }
    api.toast(`${files.length === 1 ? files[0].name : files.length + ' files'} attached to the next message (kept in your browser).`);
    return true;
  },

  key(e, state, api) {
    const t = e.target;
    const meta = e.metaKey || e.ctrlKey;
    if (meta && e.shiftKey && (e.key === 'j' || e.key === 'J')) { const sc = SC(state); sc.open = !sc.open; if (sc.open) { sc.sid = state.activeId || sc.sid; state.ui.focusOnce = '[data-demo-sidechat-input]'; } return true; }
    if (t && t.hasAttribute && t.hasAttribute('data-demo-sidechat-input')) {
      if (e.key === 'Enter') { ACTIONS['sidechat-send'](null, e, state, api); return true; }
      if (e.key === 'Escape') { SC(state).open = false; return true; }
      return false;
    }
    if (e.key === 'Escape' && SC(state).open && !state.ui.menu && !state.ui.dialog && !state.ui.palette.open) { SC(state).open = false; return true; }
    return false;
  },
};
