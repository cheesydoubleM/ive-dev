// Module "pipelines" of the IVE app built into the site (lib/app.js): the Pipeline editor as a
// visitor can use it. The Project-tools button `[data-demo-open="pipelines"]` or ⌘⇧L opens
// "Choose a Pipeline" (editable copies of the six 1.0.17 presets and the saved "Sign-in
// checks loop"); the loop opens on the canvas (Execute → Verify → Evaluate, Fix back to Verify);
// "Run" plays the run with the recorded timing (Execute passes, Verify in a testing session fails,
// Evaluate takes "Fix issues", Fix passes, cycle 2: Verify and Evaluate pass, "Cycle 2 of 20 ·
// completed"); Pause/Resume, Stop, "Run Detail" with a clickable stage list, "Open session";
// Back to list, the close X and Escape return to the app. Demo data for the Orbit project; the
// Orbit sessions in the sidebar change state through the app's api. No engine or provider runs.
import { PRESETS, pipelineChooser, interactivePipelineCanvas, runDetail } from './pipeline.js';
import { prompt, step, say } from './term.js';

const TESTER = 'tester';
const TESTER_NAME = 'Pipeline Testing Worker (Claude Code)';
const WORKER = 'interface';
const WORKER_NAME = 'Build the workspace';

// The RALPH graph with the user's own Execute prompt; node positions as the user placed them.
const PLACED = {
  wide: { execute: [400, 200], verify: [700, 200], evaluate: [1000, 200], fix: [850, 380] },
  narrow: { execute: [40, 70], verify: [300, 70], evaluate: [560, 70], fix: [430, 240] },
};
const RALPH_STAGES = [
  { id: 'execute', name: 'Execute', type: 'agent', role: 'worker', icon: 'zap' },
  { id: 'verify', name: 'Verify', type: 'agent', role: 'tester', icon: 'shield' },
  { id: 'evaluate', name: 'Evaluate', type: 'condition', icon: 'git-branch' },
  { id: 'fix', name: 'Fix', type: 'agent', role: 'worker', icon: 'wrench' },
];
const RALPH_TRANSITIONS = [
  { id: 't1', source: 'execute', target: 'verify', condition: 'always', label: '' },
  { id: 't2', source: 'verify', target: 'evaluate', condition: 'always', label: '' },
  { id: 't3', source: 'evaluate', target: 'fix', condition: 'on_fail', label: 'Fix issues' },
  { id: 't4', source: 'fix', target: 'verify', condition: 'always', label: 'Re-verify' },
];
const signinLoop = (layout) => ({
  id: 'signin', name: 'Sign-in checks loop', readonly: false,
  stages: RALPH_STAGES.map((n) => ({ ...n, x: PLACED[layout][n.id][0], y: PLACED[layout][n.id][1] })),
  transitions: RALPH_TRANSITIONS,
});

// A preset on the canvas, read-only: its chips as a chain of stages (the RALPH preset is the loop).
const CHIP_ROLE = { Test: 'tester', 'Unit Tests': 'tester', 'E2E Tests': 'tester', Verify: 'tester', Review: 'reviewer', 'Quality Audit': 'reviewer', Research: 'researcher', Plan: 'planner', Document: 'writer' };
function presetGraph(index, layout) {
  const p = PRESETS[index];
  if (!p) return null;
  if (p.name === 'RALPH Pipeline') return { ...signinLoop(layout), id: `preset-${index}`, name: p.name, readonly: true };
  const gapX = layout === 'wide' ? 260 : 230, x0 = layout === 'wide' ? 120 : 40, y0 = layout === 'wide' ? 220 : 90;
  const stages = p.chips.map(([name, icon, condition], k) => ({
    id: `s${k}`, name, type: condition ? 'condition' : 'agent', role: condition ? undefined : (CHIP_ROLE[name] || 'worker'), icon,
    x: x0 + (k % 4) * gapX, y: y0 + Math.floor(k / 4) * 180,
  }));
  const transitions = stages.slice(1).map((n, k) => ({ id: `t${k}`, source: stages[k].id, target: n.id, condition: 'always', label: '' }));
  // loops end where they say so: the last condition sends failures back to the implementing stage
  const lastCond = [...stages].reverse().find((n) => n.type === 'condition');
  const impl = stages.find((n) => /Implement|Execute|Fix|Dispatch/.test(n.name)) || stages[0];
  if (lastCond && impl && lastCond.id !== impl.id) transitions.push({ id: 'loop', source: lastCond.id, target: impl.id, condition: 'on_fail', label: 'Fix issues' });
  return { id: `preset-${index}`, name: p.name, readonly: true, stages, transitions };
}

const REPORT = {
  execute: 'Router guard sends expired sessions to /sign-in with the return path.',
  verify1: 'npm test: 13 passed, 1 failed. expired session keeps the return path.',
  verify2: 'npm test: 14 passed, 0 failed.',
  fix: 'Kept the return path when the guard redirects; routes.js passes location.pathname to /sign-in.',
};
const pending = () => ({ status: 'pending' });
const running = (session) => ({ status: 'running', session });
const done = (result, summary, session) => ({ status: 'completed', result, summary, session });

/* ── the run as timed events (seconds after Run), applied by tick ── */
function runEvents(api, st) {
  const P = st.pipelines;
  return [
    { at: 0, fn: () => { P.run.stages.execute = running(WORKER_NAME); setWorker(api, st, 'running'); } },
    { at: 1.8, fn: () => {
      P.run.stages.execute = done('pass', REPORT.execute, WORKER_NAME);
      P.run.stages.verify = running(TESTER_NAME);
      restoreWorker(api, st);
      ensureTester(api, st);
      api.setState(TESTER, 'running');
      P.pan = 1;
    } },
    { at: 3.6, fn: () => {
      P.run.stages.verify = done('fail', REPORT.verify1, TESTER_NAME);
      P.run.stages.evaluate = done('fail', REPORT.verify1);
      P.run.stages.fix = running(WORKER_NAME);
      P.run.current = ['fix'];
      api.setState(TESTER, 'done');
      setWorker(api, st, 'running');
    } },
    { at: 5.6, fn: () => {
      P.run.iteration = 2;
      P.run.stages.fix = pending();
      P.run.stages.evaluate = pending();
      P.run.stages.verify = running(TESTER_NAME);
      P.run.current = ['verify'];
      P.run.fixSummary = REPORT.fix;
      restoreWorker(api, st);
      api.setState(TESTER, 'running');
    } },
    { at: 7.6, fn: () => {
      P.run.stages.verify = done('pass', REPORT.verify2, TESTER_NAME);
      P.run.stages.evaluate = done('pass', REPORT.verify2);
      P.run.status = 'completed';
      P.run.current = [];
      api.setState(TESTER, 'done');
      api.toast('Sign-in checks loop completed in cycle 2 of 20.');
    } },
  ];
}
function setWorker(api, st, state) {
  const P = st.pipelines;
  const row = api.session(WORKER);
  if (!row) return;
  if (P.workerPrev == null) P.workerPrev = row.state;
  // a session that is already working on its own keeps working
  if (row.state !== 'running') api.setState(WORKER, state);
  P.workerHeld = true;
}
function restoreWorker(api, st) {
  const P = st.pipelines;
  const row = api.session(WORKER);
  if (row && P.workerHeld && P.workerPrev != null && !st.agents[WORKER]) api.setState(WORKER, P.workerPrev === 'running' ? 'done' : P.workerPrev);
  P.workerPrev = null;
  P.workerHeld = false;
}
function ensureTester(api, st) {
  if (api.session(TESTER)) return;
  const instruction = 'Verify: run the sign-in checks (tests/sign-in.spec.js) and report the result.';
  api.addSession({ id: TESTER, name: TESTER_NAME, cli: 'claude', model: 'sonnet', state: 'running', style: 'claude' }, {
    messages: [
      { id: 'tester-u1', role: 'user', text: instruction, time: api.now() },
      { id: 'tester-a1', role: 'assistant', steps: [{ id: 'tester-s1', tool: 'Bash', command: 'npm test', description: 'Run the sign-in checks', result: REPORT.verify1 }], text: REPORT.verify1, inline: true },
    ],
    lines: [...prompt(instruction, 58), ...step('Bash', 'npm test', '13 passed, 1 failed (3.3 s)'), ...say(REPORT.verify1, 58)],
  });
  // pipeline sessions sit in the sidebar; they do not open a board tile by themselves
  st.tabs = st.tabs.filter((id) => id !== TESTER);
}

/* ── module ── */
function openChooser(st) { if(st.pipelines.dirty)savePipeline(st);st.pipelines.open = 'chooser'; st.pipelines.detail = false; }
function openPipeline(st, pipeline) {
  const P = st.pipelines;
  P.open = 'canvas';
  P.pipeline = structuredClone(pipeline);
  P.dirty=false;P.editNode=null;P.nodeDraft=null;P.connectFrom=null;P.confirmDelete=false;P.notice='';P.zoom=1;
  P.detail = false;
  P.selected = null;
  P.pan = 0;
  if (!pipeline.readonly && P.run && P.run.pipelineId !== pipeline.id) P.run = null;
}
function startRun(st, api) {
  const P = st.pipelines;
  if (!P.pipeline || !P.pipeline.stages.length || P.pipeline.active===false) return;
  if(P.pipeline.id!=='signin'||P.pipeline.custom){startGeneric(st,api);return;}
  P.run = { id: 'run-signin', pipelineId: P.pipeline.id, status: 'running', iteration: 1, max: 20, current: ['execute'], stages: { execute: pending(), verify: pending(), evaluate: pending(), fix: pending() } };
  P.started = st.clock;
  P.paused = false;
  P.pausedAt = null;
  P.events = runEvents(api, st);
  P.pan = 0;
}
function stopRun(st, api) {
  const P = st.pipelines;
  if (!P.run) return;
  P.events = [];
  for(const sid of P.genericSessions||[])if(st.agents[sid])api.cancel?.(sid);
  P.paused = false;
  for (const id of Object.keys(P.run.stages)) if (P.run.stages[id].status === 'running') P.run.stages[id] = pending();
  P.run.status = 'cancelled';
  P.run.current = [];
  if (api.session(TESTER)) api.setState(TESTER, 'stopped');
  restoreWorker(api, st);
}
function closeAll(st) { const P = st.pipelines; if(P.dirty)savePipeline(st);P.open = null; P.detail = false; }

const mod = {
  id: 'pipelines',
  init(state, env) {
    state.pipelines = { open: env.route === 'pipelines' ? 'chooser' : null, pipeline: null, run: null, detail: false, selected: null, pan: 0, paused: false, pausedAt: null, events: [], started: 0, workerPrev: null, workerHeld: false, saved:loadPipelines(), dirty:false, editNode:null, nodeDraft:null, connectFrom:null, zoom:1, notice:'', confirmDelete:false, drag:null, genericSessions:[] };
    // ⌘⇧L and Escape also when nothing inside the app has focus (the frame listens on #root only):
    // a document-level listener handles keys whose target is outside the root.
    if (typeof document !== 'undefined' && !document.__demoPipelinesKeys) {
      document.__demoPipelinesKeys = true;
      document.addEventListener('keydown', (e) => {
        const root = document.getElementById('root');
        if (root && e.target && root.contains(e.target)) return;
        if (mod.key(e, state, env.api)) { e.preventDefault(); if (window.IVE_DEMO && window.IVE_DEMO.render) window.IVE_DEMO.render(); }
      });
    }
  },
  overlays(st, ctx) {
    const P = st.pipelines;
    if (!P || !P.open) return '';
    const narrow=ctx.width<760,tight=narrow;
    if(P.open==='chooser')return pipelineChooser({own:P.saved});
    const pipeline=P.pipeline;if(!pipeline)return pipelineChooser({own:P.saved});
    const run=P.run&&P.run.pipelineId===pipeline.id?P.run:null;
    const canvas=interactivePipelineCanvas({pipeline,state:P,narrow});
    if(P.detail&&run)return [canvas,runDetail({pipeline,run,selected:P.selected,tight,when:'This session',started:'This session',elapsed:Math.max(0,Math.round(st.clock-P.started))+'s'})];
    return canvas;
  },
  click(e, st, api) {
    const P = st.pipelines;
    const b = e.target && e.target.closest ? e.target.closest('button, [role="button"]') : null;
    if (b && b.getAttribute('data-demo-open') === 'pipelines') { openChooser(st); return true; }
    if (!P.open) return false;
    if (!b) {
      // clicks on the scrim of the topmost window close it, like the app's dialogs
      const scrim = e.target && e.target.closest ? e.target.closest('[data-demo="chooser"], [data-demo="editor"], [data-demo="run-window"]') : null;
      if (scrim && e.target === scrim) { if (P.detail) P.detail = false; else closeAll(st); return true; }
      return true; // the editor covers the app: nothing underneath reacts
    }
    if (b.classList.contains('ive-notice-close')) return false; // the app's toast, handled by the core
    const k = b.getAttribute('data-demo') || '';
    if (k === 'chooser-close' || k === 'editor-close') { closeAll(st); return true; }
    if (k === 'back') { openChooser(st); return true; }
    if(k.startsWith('open-')&&k!=='open-session'){const saved=P.saved.find(p=>p.id===k.slice(5));if(saved)openPipeline(st,saved);return true;}
    if(k.startsWith('preset-')){const g=presetGraph(Number(k.slice(7)),'narrow');if(g){g.id='pipeline-'+Date.now();g.readonly=false;g.custom=true;g.active=true;g.triggers=[];openPipeline(st,g);P.dirty=true;}return true;}
    if(k==='create'){openPipeline(st,{id:'pipeline-'+Date.now(),name:'Untitled pipeline',stages:[],transitions:[],triggers:[],active:true,custom:true,readonly:false});P.dirty=true;return true;}
    if(b.hasAttribute('data-demo-pipeline-node')){selectNode(P,b.getAttribute('data-demo-pipeline-node'));return true;}
    if(b.hasAttribute('data-demo-pipeline-port')){
      const id=b.getAttribute('data-demo-pipeline-node-id');
      if(b.getAttribute('data-demo-pipeline-port')==='out')P.connectFrom=id;
      else if(P.connectFrom&&P.connectFrom!==id){if(P.run?.status==='running')stopRun(st,api);const from=P.connectFrom;if(!P.pipeline.transitions.some(t=>t.source===from&&t.target===id))P.pipeline.transitions.push({id:'edge-'+Date.now(),source:from,target:id,condition:'always',label:''});P.connectFrom=null;markDirty(P);}
      return true;
    }
    if(b.hasAttribute('data-demo-pipeline-remove-edge')){if(P.run?.status==='running')stopRun(st,api);P.pipeline.transitions=P.pipeline.transitions.filter(t=>t.id!==b.getAttribute('data-demo-pipeline-remove-edge'));markDirty(P);return true;}
    if(b.hasAttribute('data-demo-pipeline-remove-trigger')){P.pipeline.triggers=P.pipeline.triggers.filter(t=>t.id!==b.getAttribute('data-demo-pipeline-remove-trigger'));markDirty(P,false);return true;}
    const action=b.getAttribute('data-demo-pipeline-action');
    if(action){
      if(P.run?.status==='running'&&(action.startsWith('add-')||['save-node','remove-node','confirm-delete'].includes(action)))stopRun(st,api);
      if(action.startsWith('add-'))addNode(P,action.slice(4));
      else if(action==='save-node'){const n=P.pipeline.stages.find(n=>n.id===P.editNode);if(n){n.name=P.nodeDraft.name.trim()||n.name;n.prompt=P.nodeDraft.prompt;n.cli=P.nodeDraft.cli;n.exampleResult=P.nodeDraft.exampleResult;markDirty(P);P.notice='Step saved';}}
      else if(action==='remove-node'){P.pipeline.stages=P.pipeline.stages.filter(n=>n.id!==P.editNode);P.pipeline.transitions=P.pipeline.transitions.filter(t=>t.source!==P.editNode&&t.target!==P.editNode);P.editNode=null;P.nodeDraft=null;P.selected=P.pipeline.stages[0]?.id||null;markDirty(P);}
      else if(action==='node-left'||action==='node-right'){const n=P.pipeline.stages.find(n=>n.id===P.editNode);if(n){n.x=Math.max(20,n.x+(action==='node-left'?-40:40));markDirty(P);}}
      else if(action==='cancel-connect')P.connectFrom=null;
      else if(action==='zoom-in')P.zoom=Math.min(1.5,Math.round((P.zoom+0.1)*10)/10);
      else if(action==='zoom-out')P.zoom=Math.max(0.5,Math.round((P.zoom-0.1)*10)/10);
      else if(action==='zoom-reset')P.zoom=1;
      else if(action==='trigger-column'||action==='trigger-manual'){P.pipeline.triggers=P.pipeline.triggers||[];P.pipeline.triggers.push({id:'trigger-'+Date.now(),type:action.slice(8),column:'todo'});markDirty(P,false);}
      else if(action==='cancel-delete')P.confirmDelete=false;
      else if(action==='confirm-delete'){if(P.run?.status==='running')stopRun(st,api);P.saved=P.saved.filter(p=>p.id!==P.pipeline.id);persistPipelines(P);P.dirty=false;P.pipeline=null;P.confirmDelete=false;openChooser(st);}
      return true;
    }
    if (k === 'run') {
      if (P.pipeline && P.pipeline.readonly) { api.toast('Presets run from a task. Open "Sign-in checks loop" to run it here.'); return true; }
      if (P.run && P.run.status === 'running' && P.paused) { resume(st); return true; }
      startRun(st, api);
      return true;
    }
    if (k === 'pause') { if (P.paused) resume(st); else { P.paused = true; P.pausedAt = st.clock; } return true; }
    if (k === 'stop') { stopRun(st, api); return true; }
    if (k === 'run-detail') { if (P.run) { P.detail = true; P.selected = P.selected || (P.run.current && P.run.current[0]) || 'execute'; } return true; }
    if (k.startsWith('stage-')) { P.selected = k.slice(6); return true; }
    if (b.getAttribute('aria-label') === 'Close workflow run') { P.detail = false; return true; }
    if (k === 'open-session') {
      const name = b.getAttribute('data-session-name') || '';
      const sid = b.getAttribute('data-session-id') || [...st.sessions].reverse().find(s=>s.name===name)?.id || null;
      if (sid && api.session(sid)) { closeAll(st);st.modes[sid]='full'; api.go('session', sid); }
      return true;
    }
    if(k==='deactivate'){P.pipeline.active=P.pipeline.active===false;markDirty(P,false);savePipeline(st);return true;}
    if(k==='save'){savePipeline(st);return true;}
    if(k==='delete'){P.confirmDelete=true;return true;}
    if (b.getAttribute('data-demo') === null && b.closest('[data-demo="run-window"]')) {
      // the linked-session name button in the run window
      const name = b.textContent.trim();
      const sid = st.sessions.find(s=>s.name===name)?.id || null;
      if (sid && api.session(sid)) { closeAll(st);st.modes[sid]='full'; api.go('session', sid); return true; }
    }
    return true; // the editor owns the interaction; clicks never reach the app behind it
  },
  key(e, st, api) {
    // one decision per key event: the frame's #root listener and the document listener above may both see it
    if (e.__demoPipelinesSeen) return false;
    e.__demoPipelinesSeen = true;
    const P = st.pipelines;
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
      if (P.open) closeAll(st); else openChooser(st);
      return true;
    }
    if (e.key === 'Escape' && P.open) {
      if(P.confirmDelete){P.confirmDelete=false;return true;}
      if(P.connectFrom){P.connectFrom=null;return true;}
      if (P.detail) P.detail = false;
      else if (P.open === 'canvas') openChooser(st);
      else closeAll(st);
      return true;
    }
    return false;
  },
  input(e,st,api){
    const P=st.pipelines;if(!P.pipeline)return false;const t=e.target,key=t.getAttribute?.('data-demo-pipeline-field');
    if(key){if(key==='name'){P.pipeline.name=t.value;markDirty(P,false);}else if(P.nodeDraft){if(key==='node-name')P.nodeDraft.name=t.value;if(key==='node-cli')P.nodeDraft.cli=t.value;if(key==='node-prompt')P.nodeDraft.prompt=t.value;if(key==='node-result')P.nodeDraft.exampleResult=t.value;}return true;}
    if(t.hasAttribute?.('data-demo-pipeline-edge-condition')){const edge=P.pipeline.transitions.find(x=>x.id===t.getAttribute('data-demo-pipeline-edge-condition'));if(edge){if(P.run?.status==='running')stopRun(st,api);edge.condition=t.value;edge.label=t.value==='on_fail'?'On failure':t.value==='on_pass'?'On pass':'';markDirty(P);}return true;}
    if(t.hasAttribute?.('data-demo-pipeline-trigger-column')){const trigger=P.pipeline.triggers.find(x=>x.id===t.getAttribute('data-demo-pipeline-trigger-column'));if(trigger){trigger.column=t.value;markDirty(P,false);}return true;}
    return false;
  },
  drag(e,st){
    const P=st.pipelines;if(P.open!=='canvas')return false;
    if(e.type==='dragstart'){const n=e.target.closest?.('[data-demo-pipeline-node-drag]');if(!n)return false;P.drag=n.getAttribute('data-demo-pipeline-node-drag');e.dataTransfer?.setData('text/plain',P.drag);return false;}
    if(!P.drag)return false;
    if(e.type==='dragover'){e.preventDefault();return false;}
    if(e.type==='drop'){e.preventDefault();const plane=e.target.ownerDocument.querySelector('[data-demo-pipeline-plane]'),n=P.pipeline.stages.find(n=>n.id===P.drag);if(plane&&n){const r=plane.getBoundingClientRect();n.x=Math.max(20,Math.round(((e.clientX-r.left)/P.zoom-100)/20)*20);n.y=Math.max(20,Math.round(((e.clientY-r.top)/P.zoom-40)/20)*20);markDirty(P);}P.drag=null;return true;}
    if(e.type==='dragend'){P.drag=null;return true;}return false;
  },
  tick(st, dt, api) {
    const P = st.pipelines;
    if (!P || !P.run || P.run.status !== 'running' || P.paused || !P.events.length) return false;
    let changed = false;
    while (P.events.length && st.clock - P.started >= P.events[0].at) {
      const evn = P.events.shift();
      evn.fn();
      changed = true;
    }
    return changed;
  },
};
export default mod;

function resume(st) {
  const P = st.pipelines;
  if (!P.paused) return;
  // the pause shifts the remaining events by its length
  P.started += st.clock - (P.pausedAt ?? st.clock);
  P.paused = false;
  P.pausedAt = null;
}


/* Editable pipeline state and local example execution. */
function loadPipelines(){
  try{const saved=JSON.parse(localStorage.getItem('ive-demo-pipelines')||'null');if(Array.isArray(saved)&&saved.every(p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&Array.isArray(p.stages)&&Array.isArray(p.transitions)))return saved;}catch{}
  return [{...signinLoop('narrow'),active:true,triggers:[]}];
}
function persistPipelines(P){try{localStorage.setItem('ive-demo-pipelines',JSON.stringify(P.saved));}catch{P.notice='Saved for this visit';}}
function savePipeline(st){const P=st.pipelines;if(!P.pipeline)return;P.pipeline.name=P.pipeline.name.trim()||'Untitled pipeline';const copy=structuredClone(P.pipeline),at=P.saved.findIndex(p=>p.id===copy.id);if(at<0)P.saved.push(copy);else P.saved[at]=copy;P.dirty=false;P.notice='Saved';persistPipelines(P);}
function markDirty(P,custom=true){P.dirty=true;P.notice='Unsaved changes';if(custom)P.pipeline.custom=true;}
function selectNode(P,id){const n=P.pipeline.stages.find(n=>n.id===id);if(!n)return;P.editNode=id;P.nodeDraft={name:n.name,prompt:n.prompt||(n.type==='command'?'npm test':'Inspect the workspace changes'),cli:n.cli||'claude',exampleResult:n.exampleResult||'pass'};}
function addNode(P,type){
  const i=P.pipeline.stages.length,id=type+'-'+Date.now(),previous=P.pipeline.stages.at(-1);
  P.pipeline.stages.push({id,name:type==='agent'?'Agent '+(i+1):type==='condition'?'Check result':'Command '+(i+1),type,role:type==='agent'?'worker':undefined,icon:type==='condition'?'git-branch':type==='command'?'terminal':'zap',x:40+(i%3)*260,y:50+Math.floor(i/3)*180,prompt:type==='command'?'npm test':'Inspect the workspace changes',cli:'claude',exampleResult:'pass'});
  if(previous)P.pipeline.transitions.push({id:'edge-'+Date.now(),source:previous.id,target:id,condition:'always',label:''});
  markDirty(P);selectNode(P,id);
}
function startGeneric(st,api){
 const P=st.pipelines,p=P.pipeline;savePipeline(st);
 const incoming=new Set(p.transitions.map(t=>t.target));const first=p.stages.find(n=>!incoming.has(n.id))||p.stages[0];
 const looping=p.transitions.some(t=>p.stages.findIndex(n=>n.id===t.target)<=p.stages.findIndex(n=>n.id===t.source));
 P.run={id:'run-'+Date.now(),pipelineId:p.id,status:'running',iteration:1,max:looping?20:1,current:[],stages:Object.fromEntries(p.stages.map(n=>[n.id,pending()]))};
 P.started=st.clock;P.paused=false;P.pausedAt=null;P.events=[];P.genericSessions=[];P.visits={};P.nodeQueue=[{id:first.id,result:'pass'}];P.selected=first.id;
 const schedule=(fn,delay=0.7)=>P.events.push({at:st.clock-P.started+delay,fn});
 function next(){
  const entry=P.nodeQueue.shift();if(!entry){P.run.status='completed';P.run.current=[];P.notice='Pipeline completed';return;}
  const n=p.stages.find(n=>n.id===entry.id);if(!n){schedule(next,0.1);return;}
  P.visits[n.id]=(P.visits[n.id]||0)+1;P.run.iteration=Math.max(P.run.iteration,P.visits[n.id]);
  if(P.visits[n.id]>P.run.max){if(P.run.max===1){schedule(next,0.1);return;}P.run.status='stopped';P.run.current=[];P.notice='Cycle limit reached';return;}
  const result=n.type==='condition'?entry.result:(n.exampleResult==='fail'||n.exampleResult==='fail-once'&&P.visits[n.id]===1?'fail':'pass');
  const output=n.type==='condition'?`Previous result: ${result}. Following the matching connection.`:n.type==='command'?`$ ${n.prompt||'npm test'}\n${result==='fail'?'Example result: 1 check failed.':'Example result: checks passed.'}`:`Example result for ${n.name}: ${result==='fail'?'another pass is needed.':'the requested step is complete.'}`;
  let sid=null,sessionName=null;
  if(n.type!=='condition'){
    sid='pipeline-session-'+Date.now()+'-'+n.id;sessionName=p.name+' · '+n.name;
    api.addSession({id:sid,name:sessionName,cli:n.cli||'claude',model:n.cli==='codex'?'default':'sonnet',state:'running',style:n.cli==='codex'?'codex':'claude'},{messages:[{id:sid+'-u',role:'user',text:n.prompt||n.name,time:api.now()}],lines:prompt(n.prompt||n.name,70)});
    st.tileViews[sid]='terminal';P.genericSessions.push(sid);
    api.startAgent(sid,[{d:0.5,kind:'say',text:output},{d:0.2,kind:'done'}],{delay:0.4});
  }
  P.run.current=[n.id];P.run.stages[n.id]={status:'running',session:sessionName,sessionId:sid};
  schedule(()=>{P.run.stages[n.id]={status:'completed',result,summary:output,output,session:sessionName,sessionId:sid};const following=p.transitions.filter(t=>t.source===n.id&&(t.condition==='always'||t.condition==='on_pass'&&result==='pass'||t.condition==='on_fail'&&result==='fail'));P.nodeQueue.push(...following.map(t=>({id:t.target,result})));schedule(next,0.15);},1.2);
 }
 schedule(next,0.15);
}
