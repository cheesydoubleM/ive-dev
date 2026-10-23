// Module "review" of the IVE app built into the site (lib/app.js): the Code Review as the app has
// it. The sidebar's Review entry (and the Project-tools button with the same `data-nav`) opens the
// working-diff side panel next to the current session; the panel's Fullscreen button opens the
// fullscreen review with Split/Unified views and "Collapse to Sidebar"; Escape closes the
// fullscreen; the panel's X closes the panel. The diff is the Orbit demo diff (lib/review.js);
// its containers are real scrollable DOM. No provider, no backend.
//
// State: state.review = { panel: boolean, full: boolean, view: 'split' | 'unified' };
//        state.reviewOpen mirrors `panel` so the sidebar marks Review as the current place.
// Reacts to: [data-nav="review"], [data-demo-review-close], [data-demo-review-fullscreen],
//        [data-demo-review-view="split|unified"], [data-demo-review-collapse], [data-demo-review-file]
//        (scrolls the open diff to that file), Escape (closes the fullscreen).
import { html } from './dom.js';
import { header, sessionScreen } from './ui.js';
import { queuePanel, replyPending, responding } from './home.js';
import { permissionCard } from './board.js';
import { interactiveReviewPanel, interactiveReviewFullscreen, reviewLineEntries, reviewText, FILES } from './review.js';
import { promptLines } from './data.js';
import { sessionExtras, optionsOf } from './mod-session.js';

const R = (st) => st.review || (st.review = freshState());
const setPanel = (st, open) => { R(st).panel = open; st.reviewOpen = open; };

/** The session screen as the core renders it (lib/app.js renderSession), so the panel sits beside the same view. */
function sessionView(st, ctx, s) {
  const sid = s.id;
  const mode = st.modes[sid] || 'overview';
  const agent = st.agents[sid];
  const secs = agent ? Math.max(0, Math.round(st.clock - agent.started)) : null;
  const q = st.queue[sid];
  const messages = st.msgs[sid] || [];
  const lastGroup = messages[messages.length - 1];
  const after = s.state === 'running'
    ? (lastGroup && lastGroup.role === 'assistant' && lastGroup.steps && lastGroup.steps.length ? responding(secs ?? 0) : replyPending(s.cli))
    : st.permission[sid] ? permissionCard({ ...st.permission[sid], id: `perm-${sid}`, sid }) : '';
  const focused = st.focus && st.focus.kind === 'term' && st.focus.sid === sid;
  return sessionScreen({
    session: s, mode, messages, terminal: st.terms[sid], cols: ctx.cols(`[data-terminal-slot="${sid}"]`),
    drawerHeight: Math.max(170, Math.min(320, Math.round(ctx.height * 0.34))),
    typed: st.composerTyped[sid] || '', queue: q && !q.hidden ? queuePanel({ text: q.text, state: q.state, cli: s.cli }) : null,
    lastSeconds: secs, narrow: ctx.width < 700, after, termFocused: !!focused, termTyped: st.termTyped[sid] || '',
    ...sessionExtras(st, sid), follow: optionsOf(s).autoscroll !== false,
  });
}

/** Scrolls the open diff (fullscreen first, else the panel) to a file's header row. */
function scrollToFile(e, path) {
  const root = e.target.ownerDocument;
  const full = root.querySelector('[data-demo-review-diff]');
  const container = full || root.querySelector('[data-demo-review-panel-diff]');
  if (!container) return;
  const base = path.split('/').pop();
  const rows = Array.from(container.children);
  const row = rows.find((el) => /^diff --git /.test(el.textContent || '') && (el.textContent || '').includes(path)) || rows.find((el) => (el.textContent || '').includes(`b/${path}`) || (el.textContent || '').includes(base));
  if (!row) return;
  const top = row.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 8;
  container.scrollTop = Math.max(0, top);
}

export default {
  id: 'review',

  command(action, state, api) {
    if (action !== 'open' && action?.type !== 'file') return false;
    const r = R(state);
    if (state.view !== 'session' || !state.activeId) api.go('session', 'review');
    if (api.ctx.width < 1000) state.sidebarOpen = false;
    setPanel(state, true); r.full = false;
    if (action?.type === 'file') { r.tab = 'files'; r.document = action.path; }
    else r.tab = 'review';
    return true;
  },

  init(state, env) {
    state.review = freshState();
    state.review.panel = env.route === 'review';
    try { const saved = JSON.parse(localStorage.getItem('ive-demo-review-notes') || '{}'); state.review.scratch = state.review.scratchDraft = typeof saved.scratch === 'string' ? saved.scratch : ''; state.review.notes = Array.isArray(saved.notes) ? saved.notes.filter(n => typeof n.text === 'string').map(n=>({text:n.text, quote:String(n.quote||'')})) : []; } catch {}
    state.reviewOpen = state.review.panel;
  },

  main(state, ctx) {
    const r = R(state);
    // the panel belongs to the session level: Home and Board mark their own nav entry
    state.reviewOpen = r.panel && state.view === 'session';
    if (state.view !== 'session' || !r.panel) return null;
    const s = state.sessions.find((x) => x.id === state.activeId);
    if (!s) return null;
    const sidebarWanted = state.sidebarOpen && ctx.width >= 1000 && ctx.variant !== 'hero' && state.route !== 'attention';
    // a small app window shows the panel alone, like the app's slide-in sidebar below 900 px
    const narrow = ctx.width < 900;
    const main = html`<div class="flex flex-1 min-h-0 min-w-0" data-demo-review-layout="">${narrow ? '' : sessionView(state, ctx, s)}${interactiveReviewPanel({ files: FILES, wide: narrow, state: r })}</div>`;
    return { main, header: header({ view: 'session', workspace: state.ws, session: s, sidebarOpen: sidebarWanted }) };
  },

  overlays(state, ctx) {
    const r = R(state);
    return r.full ? interactiveReviewFullscreen({ files: FILES, state: r, workspace: state.ws.name, narrow: ctx.width < 800 }) : '';
  },

  click(e, state, api) {
    const b = e.target && e.target.closest ? e.target.closest('button, [role="button"]') : null;
    if (!b) return false;
    const r = R(state);
    if (b.matches('[data-nav="review"]')) {
      if (r.panel && state.view === 'session') { setPanel(state, false); return true; }
      if (state.view !== 'session' || !state.activeId) api.go('session', state.activeId || 'review');
      else if (api.ctx.width < 1000) state.sidebarOpen = false; // the phone sidebar closes after a choice, as on navigation
      setPanel(state, true);
      return true;
    }
    if (b.hasAttribute('data-demo-review-close')) { setPanel(state, false); return true; }
    if (b.hasAttribute('data-demo-review-fullscreen')) { r.full = true; r.focusFullscreen=true; return true; }
    if (b.hasAttribute('data-demo-review-collapse')) { r.full = false; r.focusPanel=true; setPanel(state, true); return true; }
    if (b.hasAttribute('data-demo-review-view')) {
      const view = b.getAttribute('data-demo-review-view') === 'unified' ? 'unified' : 'split';
      if (view === r.view) return false;
      r.view = view;
      return true;
    }
    if (b.hasAttribute('data-demo-review-file')) { r.selectedFile = b.getAttribute('data-demo-review-file'); r.pendingFile = r.selectedFile; return true; }
    if (/^Click to open .+ in IDE$/.test(b.title)) {
      const f=FILES.find(f=>b.title.includes(f.path.split('/').pop()));
      if(f){ if(state.view!=='session')api.go('session',state.activeId||'review'); setPanel(state,true); r.tab='review'; r.mode=r.staged?'staged':'working'; r.pendingFile=r.selectedFile=f.path; return true; }
    }
    if (b.hasAttribute('data-demo-review-folder')) { const folder=b.getAttribute('data-demo-review-folder');r.folders[folder]=!r.folders[folder];return true; }
    if (b.hasAttribute('data-demo-review-document')) {r.document=b.getAttribute('data-demo-review-document');return true;}
    if (b.hasAttribute('data-demo-review-delete-note')) {r.notes.splice(Number(b.getAttribute('data-demo-review-delete-note')),1);persist(r);return true;}
    if (b.hasAttribute('data-demo-review-line')) {
      const key=b.getAttribute('data-demo-review-line'), lines=reviewLineEntries(source(r));
      if(e.shiftKey && r.anchor){const a=lines.findIndex(l=>l.key===r.anchor),z=lines.findIndex(l=>l.key===key);r.selected=lines.slice(Math.min(a,z),Math.max(a,z)+1).map(l=>l.key);}
      else {r.anchor=key;r.selected=[key];}
      r.selectionQuote='';return true;
    }
    const action=b.getAttribute('data-demo-review-action');
    if(action){
      if(action.startsWith('tab-')){r.tab=action.slice(4);return true;}
      if(action==='fold-group'){r.foldGroup=!r.foldGroup;return true;}
      if(action==='documents'){r.document='';return true;}
      if(action==='save-scratch'){r.scratch=r.scratchDraft;persist(r);return true;}
      if(action==='clear-scratch'){r.scratch=r.scratchDraft='';persist(r);return true;}
      if(action==='working'||action==='staged'){r.mode=action;r.selected=[];r.matchIndex=0;r.pendingMatch=true;return true;}
      if(action==='all-files'){r.filter='';r.foldGroup=false;r.folders={};r.selectedFile=null;r.selected=[];r.selectionQuote='';r.pendingFile=source(r)[0]?.path;return true;}
      if(action==='annotate'){r.annotating=true;r.selectionQuote=window.getSelection()?.toString().trim()||'';r.focusAnnotation=true;return true;}
      if(action==='cancel-note'){r.annotating=false;r.annotationDraft='';r.selectionQuote='';return true;}
      if(action==='save-note'){if(r.annotationDraft.trim()){r.notes.push({text:r.annotationDraft.trim(),quote:selectionText(r)});r.annotationDraft='';r.annotating=false;r.selectionQuote='';persist(r);}return true;}
      if(action==='copy'){copyText(window.getSelection()?.toString().trim()||selectionText(r)||reviewText(source(r)),r);r.options=false;return true;}
      if(action==='copy-patch'){copyText(reviewText(source(r)),r);r.options=false;return true;}
      if(action==='close-copy'){r.copyFallback='';return true;}
      if(action==='options'){r.options=!r.options;return true;}
      if(action==='stage-all'){r.staged=!r.staged;r.mode=r.staged?'staged':'working';r.options=false;r.notice=r.staged?'Changes staged':'Changes unstaged';r.selected=[];return true;}
      if(action==='clear-notes'){r.notes=[];r.options=false;persist(r);return true;}
      if(action==='next-match'||action==='previous-match'){moveMatch(r,action==='next-match'?1:-1);return true;}
      if(action==='spawn'){spawnReview(state,api);return true;}
    }
    return false;
  },

  input(e, state) {
    const field=e.target?.getAttribute?.('data-demo-review-input');if(!field)return false;
    const r=R(state),v=e.target.value;
    if(field==='filter')r.filter=v;
    if(field==='find'){r.query=v;r.matchIndex=0;r.pendingMatch=true;}
    if(field==='annotation')r.annotationDraft=v;
    if(field==='scratch')r.scratchDraft=v;
    return true;
  },
  after(state,root) {
    const r=R(state),surface=root.querySelector('[data-demo-review-full]')||root.querySelector('[data-demo-review-panel]')||root,diff=root.querySelector('[data-demo-review-diff]')||root.querySelector('[data-demo-review-panel-diff]');
    if(diff && r.pendingFile){const el=[...diff.querySelectorAll('[data-demo-review-file-section]')].find(e=>e.getAttribute('data-demo-review-file-section')===r.pendingFile);if(el)scrollTo(diff,el);r.pendingFile=null;}
    if(diff && r.pendingMatch){const matches=reviewLineEntries(source(r)).filter(l=>r.query&&l.text.toLowerCase().includes(r.query.toLowerCase()));const match=matches[r.matchIndex];const el=match&&[...diff.querySelectorAll('[data-demo-review-line]')].find(e=>e.getAttribute('data-demo-review-line')===match.key);if(el)scrollTo(diff,el);r.pendingMatch=false;}
    if(r.focusFullscreen){surface.querySelector('[data-demo-review-collapse]')?.focus({preventScroll:true});r.focusFullscreen=false;}
    if(r.focusPanel){surface.querySelector('[data-demo-review-fullscreen]')?.focus({preventScroll:true});r.focusPanel=false;}
    if(r.focusAnnotation){const input=surface.querySelector('[data-demo-review-input="annotation"]');if(input){input.focus({preventScroll:true});r.focusAnnotation=false;}}
    if(r.focusCopy){const input=surface.querySelector('[data-demo-review-copy-fallback]');if(input){input.focus();input.select();r.focusCopy=false;}}
  },
  key(e, state) {
    const r=R(state),field=e.target?.getAttribute?.('data-demo-review-input');
    if(e.key==='Tab'&&r.full){const modal=e.target.ownerDocument.querySelector('[data-demo-review-full]');const items=[...modal.querySelectorAll('button:not(:disabled),input,textarea,[tabindex="0"]')].filter(el=>el.getClientRects().length);const at=items.indexOf(e.target);if(at<0||(!e.shiftKey&&at===items.length-1)||(e.shiftKey&&at===0)){items[e.shiftKey?items.length-1:0]?.focus();return true;}}
    if(e.key==='Enter'&&field==='find'){moveMatch(r,e.shiftKey?-1:1);return true;}
    if(e.key==='Enter' && e.target?.hasAttribute?.('data-demo-review-line')) {r.selected=[e.target.getAttribute('data-demo-review-line')];r.annotating=true;r.focusAnnotation=true;return true;}
    if (e.key==='Escape') {
      if(r.options){r.options=false;return true;}
      if(r.annotating){r.annotating=false;return true;}
      if(r.copyFallback){r.copyFallback='';return true;}
      if(r.full){r.full=false;r.focusPanel=true;return true;}
      if(r.panel){setPanel(state,false);return true;}
    }
    return false;
  },
};

function freshState(){return {panel:false,full:false,view:'split',tab:'review',mode:'working',staged:false,filter:'',folders:{},foldGroup:false,selectedFile:null,selected:[],anchor:null,query:'',matchIndex:0,pendingMatch:false,pendingFile:null,annotating:false,annotationDraft:'',selectionQuote:'',notes:[],scratch:'',scratchDraft:'',document:'',options:false,notice:'',copyFallback:''};}
function source(r){return (r.mode==='staged')===r.staged?FILES:[];}
function selectionText(r){return r.selectionQuote||reviewLineEntries(source(r)).filter(l=>r.selected.includes(l.key)).map(l=>l.kind+l.text).join('\n');}
function persist(r){try{localStorage.setItem('ive-demo-review-notes',JSON.stringify({scratch:r.scratch,notes:r.notes}));}catch{}}
function scrollTo(container,el){container.scrollTop=Math.max(0,el.getBoundingClientRect().top-container.getBoundingClientRect().top+container.scrollTop-6);}
function moveMatch(r,delta){const n=reviewLineEntries(source(r)).filter(l=>r.query&&l.text.toLowerCase().includes(r.query.toLowerCase())).length;r.matchIndex=n?(r.matchIndex+delta+n)%n:0;r.pendingMatch=true;}
async function copyText(text,r){
  const actual=text;
  try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(actual);r.notice='Copied';}
  catch{r.copyFallback=actual;r.focusCopy=true;r.notice='Select and copy the text below';}
  window.IVE_DEMO?.render();
}
function spawnReview(st,api){
  const r=R(st),files=source(r);if(!files.length){r.notice='Choose changes to review first';return;}
  const id='demo-review-'+Date.now(),request='Review these changes. Check the sidebar theme toggle and pagination on reconnect.\n\n'+reviewText(files)+(r.notes.length?'\n\nReview notes:\n'+r.notes.map(n=>n.text).join('\n'):'');
  api.addSession({id,name:'Review workspace changes',cli:'claude',model:'sonnet',state:'running',style:'claude'},{messages:[{id:id+'-user',role:'user',text:request,time:api.now()}],lines:promptLines('claude',request)});
  st.tileViews[id]='terminal';st.modes[id]='full';
  api.startAgent(id,[{d:0.4,kind:'step',step:{tool:'Read',input:'src/components/layout/Sidebar.jsx',result:'The toggle reuses useTheme and preserves the shortcuts.'}},{d:1,kind:'step',step:{tool:'Read',input:'src/lib/api.js',result:'listSessions accepts a cursor. Check the reconnect handler keeps the existing page.'}},{d:1,kind:'say',text:'Sidebar.jsx: the theme toggle reuses useTheme and keeps the footer layout. api.js: verify that the reconnect handler preserves the current pagination cursor. The final decision stays with you.'},{d:0.2,kind:'done'}]);
  r.full=false;setPanel(st,false);r.options=false;api.go('session',id);
}
