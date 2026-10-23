// The introduction inside the app built into the site: a sequence of controls that pulse
// quietly, each with a few words at most; a step completes when the visitor does the thing
// (starts the task, opens the terminal, answers on the board…). Skippable and replayable
// from the page strip (try.html) or a small chip at the bottom right. Never a text card.
// Overlay elements live in #stage, outside #root, so the app's re-rendering does not touch them.
// Enabled by `?tour=1`.
//
// Step: { id, label?, targets(state) → [{ sel, label, side }] in order of preference (the first one
//        that is visible and really hittable wins), when(state) → is this step up now, done(state) }.
// The order is the walk. A target behind the sidebar on a narrow window points at the sidebar toggle
// first; nothing applicable while the Review panel is open points at its close control.
export const EXAMPLE = 'Add a dark theme toggle to the sidebar. Keep the existing keyboard shortcuts working.';

const T = (sel, label, side = 'below') => ({ sel, label, side });
const NAV_HOME = T('[data-nav="home"]', 'Start a task', 'right');
const NAV_BOARD = T('button[data-nav="board"]', 'Sessions side by side', 'right');
const NAV_REVIEW = T('button[data-nav="review"]', 'Review the changes', 'right');
const panelOpen = (st) => !!(st.review && (st.review.panel || st.review.full));

const STEPS = [
  { id: 'start',
    when: (st) => !panelOpen(st),
    done: (st) => !!st.tour && st.sessions.some((s) => !st.tour.known.includes(s.id)),
    targets: (st) => st.view === 'home'
      ? [T('[data-home-start]:not([disabled])', 'Start the example task'), T('[data-home-composer]', 'Describe a task')]
      : [NAV_HOME] },
  { id: 'terminal',
    when: (st) => (st.view === 'session' || st.view === 'board') && !panelOpen(st),
    done: (st) => !!st.activeId && (st.modes[st.activeId] || 'overview') !== 'overview',
    targets: (st) => st.view === 'session'
      ? [T('[data-demo-terminal-toggle]', 'Your terminal (⌘J)', 'above')]
      : [T('[data-grid-cell-session] button[aria-label^="Open "]', 'Open a session')] },
  { id: 'board',
    when: (st) => st.view !== 'board' && !panelOpen(st),
    done: (st) => st.view === 'board',
    targets: () => [NAV_BOARD] },
  { id: 'answer',
    when: (st) => !!st.permission.checks && !panelOpen(st),
    done: (st) => !st.permission.checks,
    targets: (st) => st.view === 'board'
      ? ((st.tileViews.checks || 'terminal') === 'terminal'
        ? [T('[data-grid-cell-session="checks"] [data-terminal-slot]', 'Click in, press Enter')]
        : [T('[data-grid-cell-session="checks"] [data-choice-kind="allow"]', 'Answer here'), T('[data-grid-cell-session="checks"] [data-demo-review-request]', 'Open the request')])
      : st.view === 'session' && st.activeId === 'checks'
        ? [T('[data-grid-cell-session="checks"] [data-choice-kind="allow"]', 'Answer here')]
        : [T('button[data-nav="board"]', 'Back to the board', 'right')] },
  { id: 'review',
    when: () => true,
    done: (st) => panelOpen(st),
    targets: () => [NAV_REVIEW] },
  { id: 'file',
    when: () => true,
    done: (st) => !!(st.tour && st.tour.fileOpened),
    targets: (st) => panelOpen(st) ? [T('[data-demo-review-file]', 'Open a changed file')] : [NAV_REVIEW] },
];
const SIDEBAR_TARGET = /data-nav=|data-demo-open=/;
const scrolled = new Set();

function current(st) {
  const t = st.tour;
  if (!t || !t.on || t.finished) return null;
  for (const s of STEPS) {
    if (t.done.includes(s.id)) continue;
    if (s.when && !s.when(st)) continue;
    return s;
  }
  return null;
}

export default {
  id: 'tour',
  init(state, env) {
    const on = env.params.get('tour') === '1';
    // chip=parent: the page around the frame shows Skip/Again (try.html's strip); the stage shows only the ring
    state.tour = { on, started: on, done: [], finished: false, current: null, fileOpened: false, chip: env.params.get('chip') !== 'parent', total: STEPS.length, known: state.sessions.map((s) => s.id) };
    // the example task sits in the box, editable; Start is the first thing that pulses
    if (on && state.view === 'home' && !state.homeTyped) state.homeTyped = EXAMPLE;
  },
  /** Sees every click before the modules consume it (the review's file rows end the walk). */
  observe(e, state) {
    const t = e.target && e.target.closest ? e.target.closest('[data-demo-review-file]') : null;
    if (t && state.tour) state.tour.fileOpened = true;
  },
  tick(state) {
    const t = state.tour;
    if (!t || !t.on) return false;
    let changed = false;
    for (const s of STEPS) {
      if (t.done.includes(s.id)) continue;
      if (s.done(state)) { t.done.push(s.id); changed = true; }
    }
    const next = current(state);
    const id = next ? next.id : null;
    if (id !== t.current) { t.current = id; changed = true; }
    if (!t.finished && STEPS.every((s) => t.done.includes(s.id))) { t.finished = true; changed = true; }
    return changed;
  },
  click(e, state, api) {
    const t = state.tour;
    const b = e.target && e.target.closest ? e.target.closest('[data-tour-skip], [data-tour-replay]') : null;
    if (!b || !t) return false;
    if (b.hasAttribute('data-tour-skip')) skip(state); else replay(state, api);
    return true;
  },
  /** For the page around the frame (try.html): the same two actions by message. */
  command(action, state, api) {
    if (action === 'skip') skip(state); else if (action === 'replay') replay(state, api);
    return true;
  },
  /** Positions the ring, the beacon, the label and the chip after every render, scroll and layout change. */
  after(state, root, ctx) {
    const t = state.tour;
    const stage = root.parentElement;
    if (!stage) return;
    let ov = stage.querySelector('.demo-tour');
    if (!ov) {
      ov = document.createElement('div');
      ov.className = 'demo-tour';
      ov.innerHTML = '<div class="demo-tour-ring" hidden></div><div class="demo-tour-beacon" hidden></div><div class="demo-tour-label" role="status" aria-live="polite" hidden></div><div class="demo-tour-bar" hidden><span class="demo-tour-text"></span><button type="button" class="demo-tour-btn" data-tour-skip>Skip</button><button type="button" class="demo-tour-btn" data-tour-replay hidden>Show me around</button></div>';
      stage.appendChild(ov);
    }
    const ring = ov.querySelector('.demo-tour-ring'), beacon = ov.querySelector('.demo-tour-beacon'), label = ov.querySelector('.demo-tour-label');
    const bar = ov.querySelector('.demo-tour-bar'), text = ov.querySelector('.demo-tour-text'), skipBtn = ov.querySelector('[data-tour-skip]'), replayBtn = ov.querySelector('[data-tour-replay]');
    const hide = () => { ring.hidden = beacon.hidden = label.hidden = true; };
    if (!t || !t.started) { bar.hidden = true; hide(); return; }
    bar.hidden = !t.chip;
    const total = STEPS.length, doneN = t.done.length;
    if (!t.on) { text.textContent = ''; skipBtn.hidden = true; replayBtn.hidden = false; replayBtn.textContent = 'Show me around'; hide(); return; }
    if (t.finished) { text.textContent = 'Done'; skipBtn.hidden = true; replayBtn.hidden = false; replayBtn.textContent = 'Again'; hide(); return; }
    skipBtn.hidden = false; replayBtn.hidden = true;
    text.textContent = `${Math.min(doneN + 1, total)} / ${total}`;
    const step = current(state);
    const cands = step ? step.targets(state) : [];
    let pick = null;
    for (const c of cands) {
      const el = root.querySelector(c.sel);
      if (!el || !visible(el)) continue;
      // a control inside a scrolled container (a tile's conversation, the review's tree): bring it into view once per step
      const key = step.id + ':' + c.sel;
      if (clipped(el, root) && !scrolled.has(key)) { scrolled.add(key); try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch { /* old engines */ } }
      if (!hittable(el)) continue;
      pick = { el, label: c.label, side: c.side };
      break;
    }
    // a sidebar control while the sidebar is closed (narrow window): the toggle first
    if (!pick && cands.some((c) => SIDEBAR_TARGET.test(c.sel))) {
      const toggle = root.querySelector('[data-sidebar-toggle]');
      if (toggle && visible(toggle) && hittable(toggle)) pick = { el: toggle, label: 'Open the sidebar', side: 'right' };
    }
    // the Review panel covers what comes next: its close control
    if (!pick && panelOpen(state)) {
      const close = root.querySelector('[data-demo-review-close]');
      if (close && visible(close) && hittable(close)) pick = { el: close, label: 'Back to the session', side: 'below' };
    }
    if (!pick) { hide(); return; }
    const sr = stage.getBoundingClientRect(), r = pick.el.getBoundingClientRect(), k = ctx.scale || 1;
    const x = (r.left - sr.left) / k, y = (r.top - sr.top) / k, w = r.width / k, h = r.height / k;
    const pad = 5;
    Object.assign(ring.style, { left: `${x - pad}px`, top: `${y - pad}px`, width: `${w + 2 * pad}px`, height: `${h + 2 * pad}px` });
    const mark = (step ? step.id : 'resume') + ':' + pick.label;
    if (ov.dataset.step !== mark) {
      ov.dataset.step = mark;
      ring.style.animation = 'none';
      void ring.offsetWidth;
      ring.style.animation = '';
    }
    ring.hidden = false;
    beacon.textContent = String(Math.min(doneN + 1, total));
    Object.assign(beacon.style, { left: `${x + w + pad - 12}px`, top: `${y - pad - 12}px` });
    beacon.hidden = false;
    if (label.textContent !== pick.label) label.textContent = pick.label; // announced once, not on every tick or frame
    label.hidden = false;
    const lw = label.offsetWidth, lh = label.offsetHeight;
    let lx = x, ly = y + h + pad + 8;
    if (pick.side === 'above') { ly = y - pad - lh - 8; }
    else if (pick.side === 'right') { lx = x + w + pad + 10; ly = y + h / 2 - lh / 2; }
    if (ly + lh > ctx.height - 8) ly = y - pad - lh - 8;
    if (ly < 8) ly = y + h + pad + 8;
    if (lx + lw > ctx.width - 8) lx = Math.max(8, ctx.width - 8 - lw);
    Object.assign(label.style, { left: `${lx}px`, top: `${ly}px` });
    // the chip never covers the control it points at
    if (t.chip) {
      const bw = bar.offsetWidth, bh = bar.offsetHeight;
      const spots = [{ right: 12, bottom: 12 }, { left: 12, bottom: 12 }, { right: 12, top: 52 }];
      for (const sp of spots) {
        const bx = sp.left != null ? sp.left : ctx.width - sp.right - bw;
        const by = sp.top != null ? sp.top : ctx.height - sp.bottom - bh;
        const hit = bx < x + w + pad + 12 && bx + bw > x - pad - 12 && by < Math.max(y + h + pad, ly + lh) + 12 && by + bh > Math.min(y - pad, ly) - 12;
        if (!hit) { Object.assign(bar.style, { left: `${bx}px`, top: `${by}px`, right: 'auto', bottom: 'auto' }); break; }
      }
    }
  },
};

function skip(state) { const t = state.tour; t.on = false; t.current = null; }
/** Again: back to Home with the example in the box, drawers and the review closed; what the visitor made stays. */
function replay(state, api) {
  const t = state.tour;
  t.on = true; t.started = true; t.done = []; t.finished = false; t.current = null; t.fileOpened = false;
  t.known = state.sessions.map((s) => s.id);
  scrolled.clear();
  state.modes = {};
  if (state.review) { state.review.panel = false; state.review.full = false; }
  state.reviewOpen = false;
  if (state.flow && state.flow.open) state.flow.open = null;
  if (state.pipelines && state.pipelines.open) { state.pipelines.open = null; state.pipelines.detail = false; }
  api.go('home');
  if (!state.homeTyped) state.homeTyped = EXAMPLE;
}

/** Is the element cut off by a scrolling ancestor below `root`? */
function clipped(el, root) {
  const r = el.getBoundingClientRect();
  let p = el.parentElement;
  while (p && p !== root) {
    const cs = getComputedStyle(p);
    if (/(auto|scroll)/.test(cs.overflowY + cs.overflowX)) {
      const pr = p.getBoundingClientRect();
      if (r.top < pr.top || r.bottom > pr.bottom || r.left < pr.left || r.right > pr.right) return true;
    }
    p = p.parentElement;
  }
  return false;
}

/** Would a tap at the element's centre reach it (not clipped away, not under a panel or scrim)? */
function hittable(el) {
  const r = el.getBoundingClientRect();
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return !!hit && (hit === el || el.contains(hit));
}

function visible(el) {
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  const cs = getComputedStyle(el);
  return cs.visibility !== 'hidden' && cs.display !== 'none';
}
