// The code review as IVE 1.0.17 renders it (CodeReviewPanel.jsx): the side panel a session's
// "Review" entry opens (working/staged diff, file tree, the diff with line markers), and the
// fullscreen review (FILES CHANGED, split or unified view, Annotate/Copy, the Review button).
// Markup and class names come from DOM dumps of the real frontend; the diff is parsed from the
// same unified diff text the recordings used (demo data for the Orbit project).
import { html, raw, esc } from './dom.js';
import { icon } from './icons.js';
import { brief, chatControls, composer } from './ui.js';

const I = (name, size, cls = '', extra = '') => raw(icon(name, size, cls, extra));

/* ── diff model ── */

/** Parses a unified diff into files → hunks → lines ({ kind: ' ' | '+' | '-', text }). */
export function parseDiff(text) {
  const files = [];
  let file = null, hunk = null;
  for (const line of text.replace(/\n$/, '').split('\n')) {
    if (line.startsWith('diff --git ')) {
      const m = /^diff --git a\/(.+?) b\/(.+)$/.exec(line);
      file = { header: line, path: m ? m[2] : line, index: '', minus: '', plus: '', hunks: [] };
      files.push(file);
      hunk = null;
    } else if (!file) continue;
    else if (line.startsWith('index ')) file.index = line;
    else if (line.startsWith('--- ')) file.minus = line;
    else if (line.startsWith('+++ ')) file.plus = line;
    else if (line.startsWith('@@')) { hunk = { header: line, lines: [] }; file.hunks.push(hunk); }
    else if (hunk) hunk.lines.push({ kind: line[0] === '+' ? '+' : line[0] === '-' ? '-' : ' ', text: line.slice(1) });
  }
  return files;
}

/** Side-by-side rows of one hunk: context on both sides, deletions paired with additions, `null` where a side is empty. */
export function pairRows(lines) {
  const rows = [];
  for (let i = 0; i < lines.length;) {
    const l = lines[i];
    if (l.kind === ' ') { rows.push({ left: l, right: l }); i++; continue; }
    const dels = [], adds = [];
    while (i < lines.length && lines[i].kind === '-') dels.push(lines[i++]);
    while (i < lines.length && lines[i].kind === '+') adds.push(lines[i++]);
    const n = Math.max(dels.length, adds.length);
    for (let k = 0; k < n; k++) rows.push({ left: dels[k] || null, right: adds[k] || null });
  }
  return rows;
}

/* ── token colouring, as the app's highlighter emits it (one span per token) ── */
const KEYWORDS = new Set(['import', 'from', 'export', 'default', 'function', 'const', 'let', 'var', 'return', 'async', 'await', 'do', 'while', 'new', 'if', 'else', 'null', 'true', 'false', 'of', 'in', 'switch', 'case', 'class']);
const TOKEN = /(\s+)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|(\d+)|([A-Za-z_$][\w$]*)|([{}()\[\]<>.,;:=+\-*\/?!&|^%~@#\\])|(.)/g;
export function highlight(code) {
  let out = '';
  for (const m of code.matchAll(TOKEN)) {
    const [, ws, str, num, word, punct, other] = m;
    if (ws != null) out += `<span class="">${esc(ws)}</span>`;
    else if (str != null) out += `<span class="text-amber-300">${esc(str)}</span>`;
    else if (num != null) out += `<span class="text-orange-300">${esc(num)}</span>`;
    else if (word != null) out += `<span class="${KEYWORDS.has(word) ? 'text-purple-400' : ''}">${esc(word)}</span>`;
    else if (punct != null) out += `<span class="text-zinc-500">${esc(punct)}</span>`;
    else out += `<span class="">${esc(other)}</span>`;
  }
  return raw(out);
}
const indexLine = (s) => {
  // "index 4b1c2d3..9e8f7a6 100644": the app colours the leading digit run and the mode.
  const m = /^index (\d*)([0-9a-f]*)\.\.([0-9a-f]+) (\d+)$/.exec(s);
  if (!m) return highlight(s);
  return raw(`<span class="">index</span><span class=""> </span>${m[1] ? `<span class="text-orange-300">${m[1]}</span>` : ''}<span class="">${esc(m[2])}</span><span class="text-zinc-500">.</span><span class="text-zinc-500">.</span><span class="">${esc(m[3])}</span><span class=""> </span><span class="text-orange-300">${m[4]}</span>`);
};

/* ── file tree (unstaged group → folders → files) ── */
function folders(files) {
  const map = new Map();
  for (const f of files) {
    const parts = f.path.split('/');
    const dir = parts.slice(0, -1).join('/');
    if (!map.has(dir)) map.set(dir, []);
    map.get(dir).push({ path: f.path, name: parts[parts.length - 1] });
  }
  return [...map.entries()];
}
export function fileTree(files) {
  return html`<div class="mb-1"><button class="w-full flex items-center gap-1 px-2 py-1 text-[11px] font-mono uppercase tracking-wide text-x-accent-ink hover:bg-x-hover">${I('chevron-down', 12)}<span>unstaged</span><span class="text-x-muted">(${files.length})</span></button>${folders(files).map(([dir, list]) => html`<div><button class="w-full flex items-center gap-1 pl-4 pr-2 py-0.5 text-[11px] font-mono text-x-muted hover:bg-x-hover">${I('chevron-down', 12)}${I('folder-open', 12, 'text-x-faint')}<span class="truncate">${dir}</span></button>${list.map((f) => html`<button type="button" title="${f.path}" data-demo-review-file="${f.path}" class="w-full flex items-center gap-1.5 pl-8 pr-2 py-0.5 text-[11px] font-mono transition-colors relative group text-x-ink-secondary hover:bg-x-hover hover:text-x-ink">${I('file-pen', 12, 'text-x-accent-ink')}<span class="truncate flex-1 text-left">${f.name}</span><span class="text-[11px] text-x-muted shrink-0 uppercase">M</span></button>`)}</div>`)}</div>`;
}

/* ── the side panel (380 px, right of the session) ── */
const LINE_BG = { '+': 'bg-x-good/[0.045]', '-': 'bg-x-accent-ink/[0.05]', ' ': '' };
const LINE_MARK = { '+': 'text-x-good', '-': 'text-x-accent-ink', ' ': 'text-x-muted' };

function panelDiff(files) {
  let n = 0;
  const out = [];
  for (const f of files) {
    out.push(html`<div class="py-0.5 px-1 mt-2 bg-x-hover text-x-ink-secondary font-semibold rounded">${f.header}</div>`);
    n++;
    out.push(html`<div data-review-line-index="${n}" class="flex flex-col"><div class="py-0.5 px-1 rounded flex items-start gap-1 transition-colors select-none  "><span class="w-8 shrink-0 text-right pr-1 rounded-sm text-x-faint/50"></span><span class="flex-1 break-words whitespace-pre-wrap text-x-ink">${indexLine(f.index)}</span></div></div>`);
    out.push(html`<div class="py-0.5 px-1 text-x-muted rounded">${f.minus}</div><div class="py-0.5 px-1 text-x-muted rounded">${f.plus}</div>`);
    n += 2;
    for (const h of f.hunks) {
      n++;
      out.push(html`<div class="py-0.5 px-1 text-x-accent/90 bg-x-accent/[0.06] rounded">${h.header}</div>`);
      for (const l of h.lines) {
        n++;
        out.push(html`<div data-review-line-index="${n}" class="flex flex-col"><div class="py-0.5 px-1 rounded flex items-start gap-1 transition-colors select-none ${LINE_BG[l.kind]} hover:bg-x-hover cursor-pointer" title="Click to select. Shift+click for range. Enter focuses the comment box."><span class="w-8 shrink-0 text-right pr-1 rounded-sm ${LINE_MARK[l.kind]}">${l.kind === ' ' ? ' ' : l.kind}</span><span class="flex-1 break-words whitespace-pre-wrap text-x-ink">${highlight(l.text)}</span></div></div>`);
      }
    }
  }
  return out;
}

const SMALL_BTN = 'group justify-center font-medium whitespace-nowrap duration-[80ms] ease-x active:scale-[.98] focus-visible:outline focus-visible:outline-x-focus rounded-md min-h-[30px] text-xs bg-x-surface flex items-center gap-1 px-2 py-1 border transition-colors';
export const reviewButton = ({ wide = false } = {}) => html`<div class="flex items-stretch rounded-xl overflow-hidden shadow-x-1"><button type="button" class="flex-1 py-2 ${wide ? 'px-4' : 'px-3'} bg-x-accent hover:bg-x-accent-ink text-x-on-accent font-mono ${wide ? 'text-xs' : 'text-[11px]'} font-semibold flex items-center justify-center ${wide ? 'gap-2' : 'gap-1.5'} transition-all" title="Spawn an agent to review this diff"><span>Review</span>${I('arrow-right', 13)}</button><button type="button" class="${wide ? 'px-3' : 'px-2'} bg-x-accent/80 hover:bg-x-accent text-x-on-accent border-l border-x-on-accent/20 flex items-center" title="More review options" aria-expanded="false">${I('chevron-up', 13, 'transition-transform rotate-180')}</button></div>`;

/** The Code Review side panel. `wide`: on narrow stages it takes the whole width, like the app in a small window. */
export function reviewPanel({ files, wide = false }) {
  return html`<div class="relative ${wide ? 'flex-1 min-w-0' : 'w-[380px]'} border-l border-x-line bg-x-bg flex flex-col h-full overflow-hidden z-30 x-sidebar-slide" data-demo-review-panel="">
<div class="flex items-center justify-between border-b border-x-line bg-x-surface-2 shrink-0 px-3 select-none"><div class="flex gap-1.5 py-2"><button class="px-3 py-1.5 text-[11px] font-semibold font-mono rounded-lg transition-all text-x-muted hover:text-x-ink-secondary">Files &amp; Plans</button><button class="px-3 py-1.5 text-[11px] font-semibold font-mono rounded-lg transition-all bg-x-tint text-x-ink">Code Review</button><button class="px-3 py-1.5 text-[11px] font-semibold font-mono rounded-lg transition-all text-x-muted hover:text-x-ink-secondary">Scratchpad</button></div><button type="button" class="p-1 rounded hover:bg-x-hover text-x-muted hover:text-x-ink transition-all" data-demo-review-close="" aria-label="Close review panel" title="Close review panel">${I('x', 14)}</button></div>
<div class="flex-1 overflow-y-auto scrollbar-thin"><div class="p-3.5 flex flex-col h-full min-h-[500px]">
<div class="flex gap-1.5 mb-3"><button class="flex-1 py-1 rounded text-[11px] font-mono capitalize transition-all bg-x-accent/20 border border-x-accent/40 text-x-ink">working Diff</button><button class="flex-1 py-1 rounded text-[11px] font-mono capitalize transition-all border border-x-line-subtle text-x-muted hover:text-x-ink-secondary">staged Diff</button></div>
<div class="border border-x-line-subtle bg-x-surface rounded-xl overflow-hidden mb-2.5 max-h-[165px] flex flex-col"><button class="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-mono border-b border-x-line-subtle transition-colors bg-x-accent/10 text-x-accent">${I('files', 12)} All files</button><div class="flex items-center gap-1.5 px-2 py-1 border-b border-x-line-subtle bg-x-surface-2">${I('search', 11, 'text-x-faint shrink-0')}<input placeholder="Search file names..." class="w-full bg-transparent text-[11px] font-mono text-x-ink-secondary placeholder:text-x-faint focus:outline-none" value=""></div><div class="overflow-y-auto scrollbar-thin py-1 min-h-0">${fileTree(files)}</div></div>
<div class="flex-1 flex flex-col gap-2 min-h-0">
<div class="flex items-center gap-1.5 text-[11px] text-x-muted font-mono bg-x-surface-2 p-1.5 rounded-lg border border-x-line-subtle select-none"><span class="min-w-0 flex-1 truncate text-x-ink-secondary" title="All changed files">All changed files</span><div class="flex items-center gap-1 w-32 px-1.5 py-1 rounded-md bg-x-surface-2 border border-x-line-subtle">${I('search', 11, 'text-x-faint shrink-0')}<input placeholder="Find" class="w-full bg-transparent text-[11px] font-mono text-x-ink-secondary placeholder:text-x-faint focus:outline-none" value=""></div><button type="button" class="${SMALL_BTN} border-x-accent/20 text-x-accent hover:bg-x-accent/10 hover:border-x-accent/35" title="Mark the currently highlighted diff text for annotation">${I('pen-line', 12)}<span>Annotate</span></button><button type="button" class="${SMALL_BTN} border-x-line text-x-ink-secondary hover:text-x-ink hover:bg-x-hover" title="Copy highlighted text, selected lines, or the current diff">${I('copy', 12)}<span>Copy</span></button><button type="button" class="${SMALL_BTN} border-x-line text-x-ink-secondary hover:text-x-ink hover:bg-x-hover" title="Open fullscreen. Code Review will remember this preference next time." data-demo-review-fullscreen="">${I('maximize2', 12)}<span>Fullscreen</span></button></div>
<div tabindex="0" class="flex-1 min-h-0 overflow-y-auto bg-x-surface-2 border border-x-line-subtle rounded-xl p-2 font-mono text-[11px] leading-5 scrollbar-thin select-text outline-none focus:border-x-accent/25" data-demo-review-panel-diff="">${panelDiff(files)}</div>
<div class="relative mt-2 select-none">${reviewButton()}</div>
</div></div></div></div>`;
}

/* ── the fullscreen review ── */
const SIDE_BTN = (active) => `group inline-flex items-center justify-center gap-1.5 border whitespace-nowrap duration-[80ms] ease-x active:scale-[.98] focus-visible:outline focus-visible:outline-x-focus rounded-md min-h-[30px] border-x-line-strong hover:bg-x-hover px-3 py-1 text-[11px] font-mono transition-all ${active ? 'bg-x-tint text-x-accent font-semibold' : 'font-medium bg-x-surface text-x-muted hover:text-x-ink-secondary'}`;

function splitSide(l, side) {
  if (!l) return html`<div class="flex-1 select-none opacity-20 font-mono text-x-faint">~</div>`;
  const left = side === 'left';
  const mark = l.kind === ' ' ? ' ' : l.kind;
  return html`<button type="button" class="w-6 shrink-0 text-right pr-2 rounded-sm select-none font-semibold text-[11px] ${left ? 'text-x-accent-ink/80 hover:bg-x-accent-ink/10' : 'text-x-good/80 hover:bg-x-good/10'}">${mark}</button><span class="flex-1 break-all whitespace-pre-wrap ${left ? 'text-x-accent-ink/90' : 'text-x-good/90'} font-mono pl-1">${highlight(l.text)}</span>`;
}
const META_ROW = 'py-1 px-3 rounded text-[11px] font-mono font-semibold text-x-accent/90 bg-x-accent/[0.06] mt-2';
function splitDiff(files) {
  const out = [];
  for (const f of files) {
    out.push(html`<div class="py-1 px-3 rounded text-[11px] font-mono font-semibold mt-4 bg-x-hover text-x-ink-secondary border border-x-line-subtle">${f.header}</div>`);
    const idx = indexLine(f.index);
    out.push(html`<div class="flex flex-col animate-fadeIn"><div class="flex w-full border-b border-x-line-subtle hover:bg-x-hover"><div class="flex-1 flex min-w-0 border-r border-x-line-subtle py-0.5 px-2 "><button type="button" disabled="" class="w-6 shrink-0 text-right pr-2 rounded-sm select-none font-semibold text-[11px] text-x-faint/30"> </button><span class="flex-1 break-all whitespace-pre-wrap text-x-accent-ink/90 font-mono pl-1">${idx}</span></div><div class="flex-1 flex min-w-0 py-0.5 px-2 "><button type="button" disabled="" class="w-6 shrink-0 text-right pr-2 rounded-sm select-none font-semibold text-[11px] text-x-faint/30"> </button><span class="flex-1 break-all whitespace-pre-wrap text-x-good/90 font-mono pl-1">${idx}</span></div></div></div>`);
    out.push(html`<div class="${META_ROW}">${f.minus}</div><div class="${META_ROW}">${f.plus}</div>`);
    for (const h of f.hunks) {
      out.push(html`<div class="${META_ROW}">${h.header}</div>`);
      for (const r of pairRows(h.lines)) {
        out.push(html`<div class="flex flex-col animate-fadeIn"><div class="flex w-full border-b border-x-line-subtle hover:bg-x-hover"><div class="flex-1 flex min-w-0 border-r border-x-line-subtle py-0.5 px-2 ${r.left && r.left.kind === '-' ? 'bg-x-accent-ink/[0.05]' : ''}">${splitSide(r.left, 'left')}</div><div class="flex-1 flex min-w-0 py-0.5 px-2 ${r.right && r.right.kind === '+' ? 'bg-x-good/[0.045]' : ''}">${splitSide(r.right, 'right')}</div></div></div>`);
      }
    }
  }
  return html`<div class="flex flex-col gap-0.5 select-text min-w-[700px]">${out}</div>`;
}
function unifiedDiff(files) {
  const out = [];
  for (const f of files) {
    out.push(html`<div class="py-0.5 px-2 mt-3 bg-x-hover text-x-ink-secondary font-semibold rounded">${f.header}</div>`);
    out.push(html`<div class="flex flex-col animate-fadeIn"><div class="py-0.5 px-2 rounded flex items-start gap-2 transition-colors select-none  "><span class="w-8 shrink-0 text-right pr-2 rounded-sm font-bold text-x-faint/50"></span><span class="flex-1 break-all whitespace-pre-wrap text-x-ink">${indexLine(f.index)}</span></div></div>`);
    out.push(html`<div class="py-0.5 px-2 text-x-muted rounded">${f.minus}</div><div class="py-0.5 px-2 text-x-muted rounded">${f.plus}</div>`);
    for (const h of f.hunks) {
      out.push(html`<div class="py-0.5 px-2 text-x-accent/90 bg-x-accent/[0.06] rounded">${h.header}</div>`);
      for (const l of h.lines) {
        out.push(html`<div class="flex flex-col animate-fadeIn"><div class="py-0.5 px-2 rounded flex items-start gap-2 transition-colors select-none ${LINE_BG[l.kind]} hover:bg-x-hover cursor-pointer" title="Click to select. Shift+click for range."><span class="w-8 shrink-0 text-right pr-2 rounded-sm font-bold ${LINE_MARK[l.kind]}">${l.kind === ' ' ? ' ' : l.kind}</span><span class="flex-1 break-all whitespace-pre-wrap text-x-ink">${highlight(l.text)}</span></div></div>`);
      }
    }
  }
  return html`<div class="space-y-0.5">${out}</div>`;
}

/**
 * The fullscreen review (the app's fixed overlay). `view`: 'split' | 'unified'.
 * `narrow` hides the files column (a small window shows the diff alone).
 */
export function reviewFullscreen({ files, view = 'split', workspace = 'orbit', narrow = false }) {
  return html`<div class="fixed inset-0 z-[1000] bg-x-bg flex flex-col ${narrow ? 'p-3' : 'p-6'} overflow-hidden text-x-ink select-text" data-demo-review-full="">
<div class="flex items-center justify-between pb-4 border-b border-x-line select-none shrink-0 gap-3 flex-wrap"><div><h2 class="text-sm font-semibold font-mono flex items-center gap-2">${I('git-compare-arrows', 16, 'text-x-accent')}<span>Fullscreen Code Review</span></h2><p class="text-[11px] text-x-muted font-mono mt-0.5">Workspace: ${workspace}</p></div><div class="flex items-center gap-4 flex-wrap"><div class="flex bg-x-surface-2 border border-x-line rounded-lg p-0.5"><button type="button" class="${SIDE_BTN(true)} capitalize">working</button><button type="button" class="${SIDE_BTN(false)} capitalize">staged</button></div><div class="flex bg-x-surface-2 border border-x-line rounded-lg p-0.5"><button type="button" class="${SIDE_BTN(view === 'split')}" data-demo-review-view="split">Split View</button><button type="button" class="${SIDE_BTN(view === 'unified')}" data-demo-review-view="unified">Unified View</button></div>${narrow ? '' : html`<button data-demo-review-collapse="" type="button" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-x-line bg-transparent text-[11px] font-mono text-x-ink-secondary hover:text-x-ink hover:bg-x-hover hover:border-x-line-strong transition-colors" title="Collapse to sidebar. Code Review will remember this preference next time.">${I('minimize2', 12)}<span>Collapse to Sidebar</span></button>`}</div></div>
<div class="flex-1 flex gap-6 overflow-hidden mt-4 min-h-0">
${narrow ? '' : html`<div class="w-[320px] flex-shrink-0 bg-x-surface rounded-xl border border-x-line-subtle flex flex-col p-4 overflow-hidden select-none"><div class="flex items-center justify-between mb-2"><span class="text-[11px] font-semibold font-mono text-x-accent uppercase tracking-wide">Files Changed</span><span class="text-[11px] font-mono text-x-muted bg-x-hover px-1.5 py-0.5 rounded">${files.length} files</span></div><div class="flex items-center gap-1.5 px-2 py-1.5 border border-x-line bg-x-surface-2 rounded-lg mb-3">${I('search', 11, 'text-x-faint shrink-0')}<input placeholder="Search file names..." class="w-full bg-transparent text-[11px] font-mono text-x-ink-secondary placeholder:text-x-faint focus:outline-none" value=""></div><div class="flex-1 overflow-y-auto scrollbar-thin pr-1"><button type="button" class="w-full flex items-center gap-1.5 px-2 py-2 text-[11px] font-mono border border-transparent rounded-lg transition-colors mb-2 text-left bg-x-accent/10 border-x-accent/20 text-x-accent">${I('files', 12)} All changed files</button>${fileTree(files)}</div></div>`}
<div class="flex-1 bg-x-surface border border-x-line-subtle rounded-xl flex flex-col overflow-hidden min-w-0">
<div class="flex items-center justify-between p-3 border-b border-x-line-subtle bg-x-surface-2 select-none shrink-0"><div class="flex items-center gap-2 min-w-0"><span class="text-[11px] font-mono text-x-ink-secondary font-semibold truncate max-w-[400px]" title="All changed files">All changed files</span></div><div class="flex items-center gap-2"><div class="flex items-center gap-1 w-40 px-2 py-1 rounded-lg bg-x-surface-2 border border-x-line-subtle">${I('search', 11, 'text-x-faint shrink-0')}<input placeholder="Find..." class="w-full bg-transparent text-[11px] font-mono text-x-ink-secondary placeholder:text-x-faint focus:outline-none" value=""></div><button type="button" class="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-x-accent/20 text-x-accent hover:bg-x-accent/10 hover:border-x-accent/35 transition-colors text-[11px] font-mono" title="Mark the currently highlighted diff text for annotation">${I('pen-line', 12)}<span>Annotate</span></button><button type="button" class="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-x-line text-x-ink-secondary hover:text-x-ink hover:bg-x-hover transition-colors text-[11px] font-mono" title="Copy highlighted text, selected lines, or the current diff">${I('copy', 12)}<span>Copy</span></button></div></div>
<div class="flex-1 flex flex-col min-h-0"><div class="flex-1 overflow-auto bg-x-surface-2 p-4 font-mono text-[11px] leading-5 scrollbar-thin select-text" data-demo-review-diff="">${view === 'split' ? splitDiff(files) : unifiedDiff(files)}</div>
<div class="p-4 border-t border-x-line-subtle bg-x-bg flex items-center gap-3 select-none shrink-0"><div class="relative flex-1 max-w-[420px]">${reviewButton({ wide: true })}</div></div></div>
</div></div></div>`;
}

/* ── the session behind the panel: the review transcript with its markdown reply ── */
const fileLink = (name) => html`<strong class="font-bold text-x-ink"><button type="button" title="Click to open ${name} in IDE" class="border-0 bg-transparent p-0 font-mono text-[12px] text-x-ink-secondary underline decoration-x-line-strong underline-offset-2 break-all cursor-pointer hover:text-x-ink">${name}</button></strong>`;
const code = (t) => html`<code class="bg-x-hover text-x-ink font-mono text-[12px] px-1 py-0.5 rounded">${t}</code>`;

export function reviewTranscript() {
  return html`<div class="ive-conversation-transcript"><div>
<article id="msg-review-user-7" data-chat-message-row="true" data-chat-message-id="review-user-7" data-chat-role="user" data-chat-role-label="you" data-chat-timeline-row="true" class="ive-conversation-message is-user"><div class="ive-conversation-content"><div class="space-y-2 text-[13px] leading-6 text-x-ink/95 break-words font-sans"><div><p class="my-1.5 text-x-ink/90 leading-6 font-sans">Review the changed files and call out anything that needs another look.</p></div></div></div><div class="ive-conversation-message-actions"><time>06:07 PM</time><button type="button" aria-label="Copy message" title="Copy message">${I('copy', 13)}</button></div></article>
<div class="ive-conversation-process"><span id="msg-review-assistant-8" aria-hidden="true"></span><div class="min-w-0"><div class="ive-conversation-activity"><button type="button" aria-expanded="false" class="ive-conversation-activity-toggle">${I('check', 14)}<span>Activity · 1 step</span>${I('chevron-down', 13, '-rotate-90')}</button></div>
<div class="mt-2 text-x-ink/95"><div class="space-y-2 text-[13px] leading-6 text-x-ink/95 break-words font-sans"><div><h4 class="text-[12px] font-semibold text-x-accent mt-3 mb-1">Review</h4><ul class="list-disc pl-5 my-1.5 space-y-1 text-x-ink-secondary"><li>${fileLink('Sidebar.jsx')}<span>: the toggle reuses </span>${code('useTheme')}<span>; the footer keeps its height. Fine.</span></li><li>${fileLink('api.js')}<span>: </span>${code('listSessions()')}<span> pages with a cursor, but the WebSocket reconnect still resets to page one. Worth another look.</span></li></ul><p class="my-1.5 text-x-ink/90 leading-6 font-sans">The final decision stays with you.</p></div></div></div></div></div>
</div></div>`;
}

export const REVIEW_BRIEF = 'Review - Sidebar.jsx: the toggle reuses useTheme; the footer keeps its height. Fine. - api.js: listSessions() pages with a cursor, but the WebSocket reconnect still resets to page one. Worth another look. The final decision stays with you.';

/** The "Review the changes" session at Session level (Overview), with the side panel when open. */
export function reviewSessionScreen({ session, files, panel = false, narrow = false }) {
  const messages = [{ role: 'user', text: 'Review the changed files and call out anything that needs another look.' }, { role: 'assistant', text: REVIEW_BRIEF }];
  const main = html`<div class="ive-session-main flex-1 flex flex-col min-h-0 min-w-0 relative">${brief(session, messages)}<div class="flex-1 flex flex-col min-h-0 bg-x-bg x-canvas ive-conversation select-text relative"><span hidden data-find-anchor="chat"></span>${chatControls(session)}<div class="flex-1 overflow-y-auto px-3 md:px-4 py-3 scrollbar-thin flex flex-col" data-session-scroll="${session.id}"><div class="ive-conversation-layout w-full mx-auto flex-1 flex flex-row gap-6 relative justify-between"><div class="flex-1 min-w-0 flex flex-col justify-between"><div class="flex-1 space-y-1.5 transition-all duration-300 ease-in-out" style="padding-bottom: 163px;">${reviewTranscript()}</div></div></div></div>${composer(session, { bottom: 32 })}</div></div>`;
  return html`<div class="ive-session-screen flex-1 flex min-h-0 min-w-0 relative" data-session-view="${session.id}" data-grid-cell-session="${session.id}">${panel && narrow ? '' : main}${panel ? reviewPanel({ files, wide: narrow }) : ''}</div>`;
}

/* ── the working-tree diff of the Orbit story (demo data; Sidebar.jsx +18 −2, api.js +24 −6) ── */
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
export const FILES = parseDiff(DIFF);

/* Hands-on review: the same IVE surfaces, with local files, notes and selected diff lines. */
const RV_BTN = 'inline-flex items-center justify-center gap-1 rounded-md border border-x-line bg-x-surface px-2 py-1 text-[11px] text-x-ink-secondary hover:bg-x-hover';
const RV_INPUT = 'w-full min-w-0 rounded-md border border-x-line bg-x-surface px-2 py-1 text-[12px] text-x-ink outline-none focus:border-x-accent';
const rvButton = (name, action, active = false, extra = '') => html`<button type="button" data-demo-review-action="${action}" class="${RV_BTN}"${active ? raw(' aria-pressed="true" style="background:var(--x-tint);color:var(--x-accent)"') : ''}${raw(extra)}>${name}</button>`;
export function reviewLineEntries(files) {
  return files.flatMap(f => { let n = 0; return f.hunks.flatMap(h => h.lines.map(l => ({...l, key:`${f.path}:${n++}`, path:f.path}))); });
}
export function reviewText(files) {
  return files.map(f => [f.header,f.index,f.minus,f.plus,...f.hunks.flatMap(h=>[h.header,...h.lines.map(l=>l.kind+l.text)])].join('\n')).join('\n');
}
function rvSource(r, files) { return r.mode === 'staged' ? (r.staged ? files : []) : (r.staged ? [] : files); }
function rvTree(r, files) {
  const filtered = files.filter(f=>f.path.toLowerCase().includes(r.filter.toLowerCase()));
  return html`<div data-demo-review-tree=""><button type="button" data-demo-review-action="fold-group" aria-expanded="${!r.foldGroup}" class="w-full flex gap-1 px-2 py-1 text-left text-[11px] text-x-muted">${I(r.foldGroup?'chevron-right':'chevron-down',12)}${r.mode==='staged'?'staged':'unstaged'} (${filtered.length})</button>${!r.foldGroup ? folders(filtered).map(([dir,list])=>html`<div><button type="button" data-demo-review-folder="${dir}" aria-expanded="${!r.folders[dir]}" class="w-full flex gap-1 px-3 py-1 text-left text-[11px] text-x-muted">${I(r.folders[dir]?'chevron-right':'chevron-down',12)}${I('folder-open',12)}<span class="truncate">${dir}</span></button>${!r.folders[dir] ? list.map(f=>html`<button type="button" data-demo-review-file="${f.path}" title="${f.path}" aria-pressed="${r.selectedFile===f.path}" class="w-full flex gap-1 px-4 py-1 text-left text-[11px] text-x-ink-secondary hover:bg-x-hover">${I('file-pen',12)}<span class="truncate">${f.name}</span></button>`) : ''}</div>`) : ''}${!filtered.length?html`<p class="px-3 py-2 text-[11px] text-x-muted">${r.filter?'No matching files.':'No changes here.'}</p>`:''}</div>`;
}
function rvCode(code) {
  let out = '';
  for (const m of code.matchAll(TOKEN)) {
    const [,ws,str,num,word,punct,other] = m;
    const color = str != null ? 'color-mix(in srgb,var(--x-ink) 45%,var(--x-warning))' : num != null ? 'color-mix(in srgb,var(--x-ink) 45%,var(--x-accent))' : word != null && KEYWORDS.has(word) ? 'color-mix(in srgb,var(--x-ink) 45%,var(--x-accent))' : punct != null ? 'var(--x-muted)' : 'var(--x-ink)';
    out += `<span style="color:${color}">${esc(ws ?? str ?? num ?? word ?? punct ?? other ?? '')}</span>`;
  }
  return raw(out);
}
function rvLine(line, r, entries, side = '') {
  if (!line) return html`<span class="flex-1 min-w-0 px-2 text-x-faint" aria-hidden="true">~</span>`;
  const selected = r.selected.includes(line.key);
  const match = r.query && line.text.toLowerCase().includes(r.query.toLowerCase());
  return html`<button type="button" data-demo-review-line="${line.key}" data-demo-review-path="${line.path}"${match?raw(' data-demo-review-match="true"'):''} aria-pressed="${selected}" title="Select line to annotate. Shift-click selects a range." class="flex flex-1 min-w-0 text-left font-mono text-[11px] leading-5 hover:bg-x-hover" style="padding:1px 6px;align-items:flex-start;${side==='left'?'border-right:1px solid var(--x-line);':''}${selected?'background:var(--x-tint);box-shadow:inset 3px 0 var(--x-accent);':match?'background:color-mix(in srgb,var(--x-warning) 20%,transparent);':line.kind==='+'?'background:color-mix(in srgb,var(--x-good) 5%,transparent);':line.kind==='-'?'background:color-mix(in srgb,var(--x-danger) 5%,transparent);':''}"><span class="shrink-0 w-5 text-right pr-1 ${LINE_MARK[line.kind]}">${line.kind===' '?' ':line.kind}</span><span class="min-w-0 flex-1 whitespace-pre-wrap break-all text-x-ink">${rvCode(line.text)}</span></button>`;
}
function rvDiff(r, files, full) {
  if (!files.length) return html`<p class="p-4 text-[12px] text-x-muted">${r.mode==='staged'?'No staged changes.':'No working changes.'}</p>`;
  const all=reviewLineEntries(files);let cursor=0;
  return files.map(f=>html`<section data-demo-review-file-section="${f.path}" class="mb-4"><div class="p-2 bg-x-hover text-[11px] font-mono font-semibold text-x-ink-secondary">${f.header}</div>${f.hunks.map(h=>{
    const lines=all.slice(cursor,cursor+h.lines.length);cursor+=h.lines.length;
    return html`<div class="px-2 py-1 text-[11px] font-mono" style="color:color-mix(in srgb,var(--x-ink) 45%,var(--x-accent))">${h.header}</div>${full && r.view==='split' ? pairRows(lines).map(row=>html`<div class="flex border-b border-x-line-subtle">${rvLine(row.left,r,all,'left')}${rvLine(row.right,r,all,'right')}</div>`) : lines.map(l=>html`<div class="flex">${rvLine(l,r,all)}</div>`)}`;
  })}</section>`);
}
function rvNotes(r) {
  return html`${r.annotating ? html`<form data-demo-review-annotation-form="" class="p-3 border-t border-x-line bg-x-surface"><label class="block text-[11px] font-semibold text-x-ink" for="rv-note">Comment on ${r.selected.length?r.selected.length+' selected line'+(r.selected.length===1?'':'s'):'this diff'}</label><textarea id="rv-note" data-demo-review-input="annotation" rows="2" class="${RV_INPUT} mt-2" placeholder="What needs another look?">${r.annotationDraft}</textarea><div class="flex gap-2 mt-2">${rvButton('Save annotation','save-note',false,r.annotationDraft.trim()?'':' disabled=""')}${rvButton('Cancel','cancel-note')}</div></form>`:''}${r.notes.length?html`<div class="p-3 border-t border-x-line" data-demo-review-notes="">${r.notes.map((n,i)=>html`<article class="rounded-md border border-x-line p-2 mb-2"><div class="flex items-start gap-2"><p class="flex-1 text-[12px] whitespace-pre-wrap break-words text-x-ink">${n.text}</p><button type="button" class="${RV_BTN}" data-demo-review-delete-note="${i}" aria-label="Delete annotation">${I('x',12)}</button></div>${n.quote?html`<p class="mt-1 text-[11px] text-x-muted font-mono whitespace-pre-wrap break-words">${n.quote.slice(0,220)}</p>`:''}</article>`)}</div>`:''}`;
}
function rvAuxiliary(r, files) {
  if(r.tab==='scratchpad')return html`<section class="p-3 flex flex-col gap-3 flex-1 min-h-0"><label for="rv-scratch" class="text-[12px] font-semibold text-x-ink">Scratchpad</label><textarea id="rv-scratch" data-demo-review-input="scratch" class="${RV_INPUT} flex-1" style="min-height:200px;resize:vertical" placeholder="Keep notes while you explore…">${r.scratchDraft}</textarea><div class="flex gap-2">${rvButton('Save note','save-scratch')}${rvButton('Clear','clear-scratch')}</div><span role="status" class="text-[11px] text-x-muted">${r.scratchDraft===r.scratch?'Saved in this browser':'Unsaved changes'}</span></section>`;
  const file = files.find(f=>f.path===r.document);
  const content = file ? file.hunks.flatMap(h=>h.lines.filter(l=>l.kind!=='-').map(l=>l.text)).join('\n') : 'Orbit — workspace changes\n\n1. Add a theme toggle to the sidebar.\n2. Keep keyboard shortcuts and the footer layout.\n3. Check that reconnecting preserves the pagination cursor.\n\nAcceptance: the toggle works, shortcuts still work, and reconnecting keeps the current page.';
  return html`<section class="flex-1 min-h-0 overflow-auto p-3">${r.document?html`${rvButton('All files and plans','documents')}<h3 class="text-[12px] font-semibold mt-3 mb-2 break-all">${file?file.path:'Plan.md'}</h3><pre class="text-[11px] whitespace-pre-wrap break-words font-mono text-x-ink-secondary" data-demo-review-document="">${content}</pre>`:html`<h3 class="text-[12px] font-semibold mb-3">Project files and plans</h3>${[...files.map(f=>({path:f.path,name:f.path.split('/').pop()})),{path:'Plan.md',name:'Plan.md'}].map(f=>html`<button type="button" data-demo-review-document="${f.path}" class="w-full flex items-center gap-2 p-2 rounded-md text-left text-[12px] hover:bg-x-hover">${I('file-text',14)}${f.name}</button>`)}`}</section>`;
}
function rvBody(r, files, full, narrow = false) {
  const source=rvSource(r,files);
  const matches=reviewLineEntries(source).filter(l=>r.query&&l.text.toLowerCase().includes(r.query.toLowerCase()));
  const footer=html`<div class="relative border-t border-x-line p-3 bg-x-bg"><div class="flex items-stretch">${rvButton('Review','spawn',false,' title="Spawn an agent to review this diff" style="flex:1;background:var(--x-accent);color:var(--x-on-accent)"')}${rvButton('⌄','options',false,` title="More review options" aria-expanded="${r.options}"`)}</div>${r.options?html`<div role="menu" class="absolute bottom-full right-3 rounded-lg border border-x-line bg-x-surface shadow-x-3 p-1" style="z-index:5;min-width:190px">${rvButton(r.staged?'Unstage all changes':'Stage all changes','stage-all')}${rvButton('Copy patch','copy-patch')}${r.notes.length?rvButton('Clear annotations','clear-notes'):''}</div>`:''}${r.copyFallback?html`<label class="block text-[11px] mt-2">Copy this text<textarea readonly data-demo-review-copy-fallback="" class="${RV_INPUT}" rows="3">${r.copyFallback}</textarea></label>${rvButton('Close','close-copy')}`:''}<span role="status" data-demo-review-status="" class="block mt-1 text-[11px] text-x-muted">${r.notice||''}</span></div>`;
  return html`<div class="flex flex-col flex-1 min-h-0"><div class="flex flex-wrap gap-2 p-3 border-b border-x-line">${rvButton(full?'working':'working Diff','working',r.mode==='working')}${rvButton(full?'staged':'staged Diff','staged',r.mode==='staged')}${full?html`${rvButton('Split View','split',r.view==='split',' data-demo-review-view="split"')}${rvButton('Unified View','unified',r.view==='unified',' data-demo-review-view="unified"')}`:''}</div><div class="flex flex-1 min-h-0" style="${full&&!narrow?'':'flex-direction:column;'}"><div class="border-b border-x-line bg-x-surface" style="${full&&!narrow?'width:240px;max-width:30%;flex-shrink:0;overflow:auto;':'max-height:170px;display:flex;flex-direction:column;'}" data-demo-review-file-list=""><div class="p-2">${rvButton('All files','all-files')}<input data-demo-review-input="filter" aria-label="Search file names" placeholder="Search file names..." class="${RV_INPUT} mt-2" value="${r.filter}"></div><div style="overflow:auto;min-height:0">${rvTree(r,source)}</div></div><div class="flex flex-1 flex-col min-h-0 min-w-0"><div class="flex flex-wrap items-center gap-1 p-2 border-b border-x-line bg-x-surface-2"><input data-demo-review-input="find" aria-label="Find in diff" placeholder="Find in diff" class="${RV_INPUT}" style="width:100px;flex:1;min-width:70px" value="${r.query}">${r.query?html`<span class="text-[11px] text-x-muted" data-demo-review-match-count="">${matches.length?Math.min(r.matchIndex+1,matches.length):0}/${matches.length}</span>${rvButton('↑','previous-match',false,' aria-label="Previous match"')}${rvButton('↓','next-match',false,' aria-label="Next match"')}`:''}${rvButton('Annotate','annotate',false,' title="Mark the currently highlighted diff text for annotation"')}${rvButton('Copy','copy',false,' title="Copy highlighted text, selected lines, or the current diff"')}${!full?rvButton('Fullscreen','fullscreen',false,' data-demo-review-fullscreen="" title="Open fullscreen. Code Review will remember this preference next time."'):''}</div><div tabindex="0" class="flex-1 min-h-0 overflow-auto bg-x-surface-2 p-2" ${full?raw('data-demo-review-diff=""'):raw('data-demo-review-panel-diff=""')}><div style="${full&&r.view==='split'?'min-width:600px;':''}">${rvDiff(r,source,full)}</div></div><div style="max-height:40%;overflow:auto">${rvNotes(r)}</div>${footer}</div></div></div>`;
}
export function interactiveReviewPanel({files,wide=false,state:r}) {
  return html`<section data-demo-review-panel="" class="relative border-l border-x-line bg-x-bg flex flex-col h-full overflow-hidden z-30" style="${wide?'flex:1;min-width:0;':'width:400px;flex-shrink:0;'}"><header class="flex items-center gap-1 p-2 border-b border-x-line bg-x-surface-2">${['files','review','scratchpad'].map((tab,i)=>rvButton(['Files & Plans','Code Review','Scratchpad'][i],'tab-'+tab,r.tab===tab))}<button type="button" data-demo-review-close="" class="${RV_BTN}" aria-label="Close review panel" style="margin-left:auto">${I('x',12)}</button></header>${r.tab==='review'?rvBody(r,files,false):rvAuxiliary(r,files)}</section>`;
}
export function interactiveReviewFullscreen({files,state:r,workspace='Orbit',narrow=false}) {
  return html`<section data-demo-review-full="" role="dialog" aria-modal="true" aria-label="Fullscreen Code Review" class="fixed inset-0 bg-x-bg flex flex-col text-x-ink" style="z-index:1000;padding:${narrow?'8':'20'}px"><header class="flex items-center gap-3 pb-2 shrink-0"><div class="flex-1 min-w-0"><h2 class="text-sm font-semibold">Code Review</h2><p class="text-[11px] text-x-muted">${workspace}</p></div>${rvButton(narrow?'Back':'Collapse to Sidebar','collapse',false,' data-demo-review-collapse="" title="Collapse to sidebar. Code Review will remember this preference next time."')}</header>${rvBody(r,files,true,narrow)}</section>`;
}
