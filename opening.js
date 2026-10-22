/* IVE.DEV · opening.js — the opening scene (brief 4.1).
   Inside the machine: a grid corridor flows past with ring ribs and a slow
   camera drift, on a black ground (back from 0d2d27a on the owner's call,
   2026-10-22). Agents swarm in it in depth as session cards that turn in space
   (the card motion of 0d2d27a), glide onto one board, the corridor fades to
   black, the viewer zooms out of the V until "IVE" stands, the name unfolds
   into "Integrated Vibecoding Environment", then shrinks and rises away while the
   header takes the page tokens and the hero rises underneath.
   One rAF loop, only while the scene is in view. Scroll and resize request
   frames; the swarm's idle drift is the only clock and stops off-screen.
   Real font sizes for the letters and the cards: no scale() on small text.
   Markup contract: design/partials/USAGE.md, reference: design/partials/home-scenes.html. */
(function () {
  'use strict';
  var root = document.documentElement;
  var mark = document.querySelector('[data-mark]');
  if (!mark) return;
  var header = document.querySelector('[data-header]');
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ── static block (no JS is pure CSS; reduced motion lands here) ── */
  function staticMode() {
    root.classList.remove('mark-live');
    // the header keeps dark ink while the dark block sits under it
    var sync = function () {
      var hh = header ? header.offsetHeight : 64;
      root.classList.toggle('mark-dark', mark.getBoundingClientRect().bottom > hh);
    };
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }
  if (motion.matches || !root.classList.contains('mark-live')) { staticMode(); return; }

  var pin = mark.querySelector('[data-mark-pin]');
  var line = mark.querySelector('[data-mark-line]');
  var caps = Array.prototype.slice.call(mark.querySelectorAll('[data-mark-cap]'));
  var rests = Array.prototype.slice.call(mark.querySelectorAll('[data-mark-rest]'));
  var swarmBox = mark.querySelector('[data-scene-swarm]');
  var board = mark.querySelector('[data-scene-board]');
  var capA = mark.querySelector('[data-scene-caption="a"]');
  var capB = mark.querySelector('[data-scene-caption="b"]');
  var countA = mark.querySelector('[data-scene-count="a"]');
  var countB = mark.querySelector('[data-scene-count="b"]');
  if (!pin || !line || !swarmBox || !board) { staticMode(); return; }
  /* the corridor: camera, four grid planes, ring ribs, vignette, scanlines (skipped if the markup lacks it) */
  var cam = mark.querySelector('[data-scene-cam]');
  var walls = {};
  Array.prototype.forEach.call(mark.querySelectorAll('[data-wall]'), function (w) { walls[w.getAttribute('data-wall')] = w; });
  var ringsBox = mark.querySelector('[data-scene-rings]');
  var scan = mark.querySelector('[data-scene-scan]');   /* the vignette is pure CSS */
  var corridor = !!(cam && walls.floor && walls.ceil && walls.left && walls.right && ringsBox);
  var columnQuery = window.matchMedia('(max-width: 719.98px)');

  /* timeline on the scroll axis (raw 0..1 over the 200vh travel) */
  var T = {
    swarmEnd: 0.22, waitFrom: 0, boardIn: 0.28, capSwap: 0.34,
    doneFrom: 0.36, dockEnd: 0.42, cutEnd: 0.45, zoomEnd: 0.60,
    unfoldStart: 0.64, byAt: 0.78, unfoldEnd: 0.82,
    handStart: 0.88, groundFrom: 0.90, headerAt: 0.94, goneAt: 0.98
  };
  var POP = 5;                         /* the zoom starts at 5× inside the V's left stroke */
  var GAP0 = 0.02, GAP1 = 0.24;        /* em between the words: tight IVE → real word gap */
  var GRID = 120;                      /* px, the planes' background-size in opening.css */
  var RINGS = 8;                       /* ring ribs along the corridor */
  /* sessions: title + model (+ the shorter label for the 150px phone cards);
     illustrations name only Haiku, Sonnet, Opus and the Gemini Pro and Flash models
     (Gemini runs through the Antigravity CLI profile in 1.0.17) */
  var AGENTS = [
    ['Sign-in backend', 'sonnet'], ['Sign-in screen', 'sonnet'],
    ['Sign-in checks', 'gemini-3.1-pro', 'gemini'], ['Review the changes', 'opus'],
    ['Build the workspace', 'sonnet'], ['Connect the API', 'gemini-3.1-pro', 'gemini'],
    ['Check the sign-in flow', 'sonnet'], ['Theme toggle', 'gemini-3.5-flash', 'gemini'],
    ['Session list paging', 'haiku'], ['WebSocket reconnect', 'opus'],
    ['Migrate the schema', 'sonnet'], ['Write the changelog', 'haiku']
  ];
  var WORDS = { run: 'Running', wait: 'Waiting', done: 'Done' };
  var STATES = { run: 'Working on your request', wait: 'Your answer is needed', done: 'Reply ready' };

  var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var ease = function (x) { x = clamp(x); return x * x * (3 - 2 * x); };
  var rnd = function (i, k) { var x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };

  /* cards, built from the site's own tokens (opening.css .swarm-card); their lanes and
     drift are those of 0d2d27a (same seeds, same agent order, so the same swarm) */
  var cards = AGENTS.map(function (def, i) {
    var el = document.createElement('div');
    el.className = 'swarm-card';
    var top = document.createElement('div');
    top.className = 'sc-top';
    var title = document.createElement('span');
    title.className = 'sc-title';
    title.textContent = def[0];
    var model = document.createElement('span');
    model.className = 'sc-model';
    model.textContent = def[1];
    top.appendChild(title);
    var pill = document.createElement('span');
    pill.className = 'sc-pill';
    var dot = document.createElement('i');
    var word = document.createElement('span');
    word.textContent = WORDS.run;
    pill.appendChild(dot);
    pill.appendChild(word);
    top.appendChild(pill);
    top.appendChild(model);
    var status = document.createElement('div');
    status.className = 'sc-status';
    var state = document.createElement('span');
    state.className = 'sc-state';
    state.textContent = STATES.run;
    status.appendChild(state);
    el.appendChild(top);
    el.appendChild(status);
    swarmBox.appendChild(el);
    return {
      el: el, word: word, st: '', model: model, long: def[1], short: def[2] || '',
      /* lane in the corridor (x, y in view half-widths) and depth phase */
      x0: (rnd(i, 1) * 2 - 1) * 0.9, y0: (rnd(i, 2) * 2 - 1) * 0.8, z0: rnd(i, 3),
      /* depth speed per second; three in ten fly toward the viewer, the rest away */
      v: (0.045 + 0.06 * rnd(i, 4)) * (rnd(i, 5) < 0.3 ? -1 : 1),
      ax: 0.12 + 0.3 * rnd(i, 6), ay: 0.08 + 0.22 * rnd(i, 7),
      wx: 0.3 + 0.5 * rnd(i, 8), wy: 0.25 + 0.45 * rnd(i, 9),
      px: rnd(i, 10) * 6.283, py: rnd(i, 11) * 6.283,
      rot: 3 + 7 * rnd(i, 12), flick: 0.6 + 0.8 * rnd(i, 13)
    };
  });

  function setStatus(c, st) {
    if (c.st === st) return;
    c.st = st;
    c.el.setAttribute('data-st', st);
    c.word.textContent = WORDS[st];
    c.el.querySelector('.sc-state').textContent = STATES[st];
  }

  var rings = [];
  if (corridor) {
    for (var r = 0; r < RINGS; r++) {
      var ring = document.createElement('div');
      ring.className = 'scene-ring';
      ringsBox.appendChild(ring);
      rings.push(ring);
    }
  }
  /* style writes for the corridor: only when the value changes (the layers rest once docked) */
  function put(el, prop, val) {
    if (!el) return;
    var memo = el.__ive || (el.__ive = {});
    if (memo[prop] !== val) { memo[prop] = val; el.style[prop] = val; }
  }

  /* the corridor, as in 0d2d27a: the grid flows past and the ribs rush by on the swarm's
     clock and faster with scroll; the camera drifts; drift and ribs come to rest while the
     agents dock, the grid dims to 35 %, and everything fades to black at the cut.
     Only transform and opacity change. Brightness as in 0d2d27a: a rib peaks at opacity
     0.5 of near white (opening.css), the vignette stays at full strength. */
  function renderCorridor(sw, k, cut, emerge) {
    var still = (1 - k) * cut;
    var lines = (emerge * (0.35 + 0.65 * (1 - k)) * cut).toFixed(3);
    put(walls.floor, 'opacity', lines);
    put(walls.ceil, 'opacity', lines);
    put(walls.left, 'opacity', lines);
    put(walls.right, 'opacity', lines);
    put(scan, 'opacity', (emerge * cut).toFixed(3));
    var swayX = Math.sin(clock * 0.37) * 16 * still, swayY = Math.cos(clock * 0.29) * 10 * still;
    var swayR = Math.sin(clock * 0.23) * 0.9 * still;
    put(cam, 'transform', 'translate(' + swayX.toFixed(1) + 'px, ' + swayY.toFixed(1) + 'px) rotate(' + swayR.toFixed(2) + 'deg)');
    var dist = (clock * 90 + sw * 900) % GRID;
    var near = dist.toFixed(1), back = (-dist).toFixed(1);
    put(walls.floor, 'transform', 'rotateX(-90deg) translateY(' + back + 'px)');
    put(walls.ceil, 'transform', 'rotateX(90deg) translateY(' + near + 'px)');
    put(walls.left, 'transform', 'rotateY(90deg) translateX(' + back + 'px)');
    put(walls.right, 'transform', 'rotateY(-90deg) translateX(' + near + 'px)');
    var camz = clock * 0.32 + sw * 1.4;
    var fz = camz - Math.floor(camz);
    for (var i = 0; i < RINGS; i++) {
      var d = (i / RINGS + 1 - fz) % 1;              /* 0 = passing the viewer, 1 = far */
      var o = 0.5 * (0.4 + 0.6 * (1 - d)) * ease(d / 0.06) * ease((1 - d) / 0.3) * emerge * still;
      put(rings[i], 'opacity', o.toFixed(3));
      if (o > 0) put(rings[i], 'transform', 'translate(-50%, -50%) scale(' + (2.8 / (1 + d * 26)).toFixed(4) + ')');
    }
  }

  var m = null;
  var raw = 0, lastRaw = -1, clock = 0, age = 0, frameNo = 0, lastTs = null, looping = false, halted = false;
  var hintReady = false, dark = true, inView = true, zoomOn = false;
  var lastCountA = '', lastCountB = '';

  function measure() {
    mark.classList.add('is-measuring');
    var capEm = caps.map(function (c) { return c.getBoundingClientRect().width / 100; });
    var restEm = rests.map(function (r) { return r.getBoundingClientRect().width / 100; });
    var lineEmH = line.getBoundingClientRect().height / 100;
    mark.classList.remove('is-measuring');
    rests.forEach(function (r, i) { r.parentNode.style.setProperty('--rest-em', restEm[i].toFixed(4)); });
    var cs = getComputedStyle(pin);
    var w = pin.clientWidth, h = pin.clientHeight;
    var availW = Math.min(w - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), 1480) * 0.9;
    var availH = h * 0.56;
    var column = columnQuery.matches;
    cards.forEach(function (c) { if (c.short) c.model.textContent = column ? c.short : c.long; });
    var sumCap = capEm.reduce(function (a, b) { return a + b; }, 0);
    var sumRest = restEm.reduce(function (a, b) { return a + b; }, 0);
    /* board slots: the pitch comes from the card's real size at s = 1 */
    var card = cards[0].el;
    card.style.setProperty('--s', '1');
    var gap = column ? 8 : 10;
    var cw = card.offsetWidth + gap, ch = card.offsetHeight + gap;
    var cols = column ? 2 : (4 * cw + 28 <= w - 160 ? 4 : 3);
    var rows = Math.ceil(cards.length / cols);
    var head = 36;
    var slots = cards.map(function (c, i) {
      var col = i % cols, row = Math.floor(i / cols);
      return { x: (col - (cols - 1) / 2) * cw, y: (row - (rows - 1) / 2) * ch + head / 2 };
    });
    board.style.width = (cols * cw + 18) + 'px';
    board.style.height = (rows * ch + 18 + head) + 'px';
    m = {
      column: column, capEm: capEm, restEm: restEm, lineEmH: lineEmH,
      availW: availW, availH: availH, w: w, h: h, slots: slots,
      a: column ? Math.max.apply(null, capEm) : sumCap + 2 * GAP0,
      b: column ? Math.max.apply(null, restEm) : sumRest,
      top: mark.getBoundingClientRect().top + window.scrollY,
      travel: Math.max(1, mark.offsetHeight - pin.offsetHeight)
    };
    /* zoom origin: the V's left stroke at mid height, as a fraction of the tight IVE line */
    m.originX = column ? (0.31 * capEm[1]) / m.a : (capEm[0] + GAP0 + 0.31 * capEm[1]) / m.a;
    lastRaw = -1;
  }

  function renderScene(dt) {
    var sw = clamp(raw / T.swarmEnd);                              /* progress through the swarm */
    var k = ease((raw - T.swarmEnd) / (T.dockEnd - T.swarmEnd));    /* docking */
    var cut = 1 - ease((raw - T.dockEnd) / (T.cutEnd - T.dockEnd)); /* board and captions fade to black */
    frameNo++;
    age += dt;
    clock += dt * (1 - k);
    var emerge = ease(age / 1.2);
    if (corridor) renderCorridor(sw, k, cut, emerge);
    /* the swarm in depth, as in 0d2d27a. Every card flies down its own lane: depth
       dz runs 0 (at the viewer) to 1 (far), most cards away into the corridor and
       some toward the viewer, all faster with scroll. One perspective law gives the
       depth its size (2.4x the board card at the viewer, a third of it far away) and
       pulls the lane toward the vanishing point; each card turns in space on its own
       700px perspective, leaning in toward the corridor's axis, and rocks about its
       centre. The size is the card's real size (--s), never scale(): the same
       geometry as the old scale() step, but the text is set, not stretched (Safari). */
    var RX = m.w * 0.55, RY = m.h * 0.5;
    var t = clock;
    var counts = { run: 0, wait: 0, done: 0 };
    var doneSpan = T.dockEnd - T.doneFrom;
    for (var n = 0; n < cards.length; n++) {
      var c = cards[n];
      var dz = ((c.z0 + t * c.v + sw * 0.6 * (c.v > 0 ? 1 : -1)) % 1 + 1) % 1;
      var persp = 0.35 / (0.35 + 2.2 * dz);
      var sx = c.x0 + c.ax * Math.sin(c.wx * t + c.px);
      var sy = c.y0 + c.ay * Math.sin(c.wy * t + c.py);
      var px = sx * RX * persp, py = sy * RY * persp;
      var s = 2.4 * persp;
      var op = ease(dz / 0.05) * ease((1 - dz) / 0.2) * emerge;
      var rot = c.rot * Math.sin(c.wy * t * 1.3 + c.py);
      var tiltY = -sx * 16, tiltX = sy * 10;
      var st;
      if (raw >= T.doneFrom && (raw - T.doneFrom) / doneSpan > (n + 0.5) / cards.length) st = 'done';
      else if (k < 0.35 && raw >= T.waitFrom && Math.sin(t * c.flick + c.px * 2) > 0.76) st = 'wait';
      else st = 'run';
      /* a session that needs you shivers */
      if (st === 'wait') { px += (rnd(frameNo, n) - 0.5) * 3; py += (rnd(frameNo, n + 40) - 0.5) * 3; }
      if (k > 0) {
        /* docking: onto the board slot, flat, upright, at the board size */
        var slot = m.slots[n];
        px += (slot.x - px) * k;
        py += (slot.y - py) * k;
        s += (1 - s) * k;
        op += (1 - op) * k;
        rot *= 1 - k;
        tiltY *= 1 - k;
        tiltX *= 1 - k;
      }
      op *= cut;
      c.el.style.setProperty('--s', s.toFixed(3));
      c.el.style.transform = 'translate(-50%, -50%) translate(' + px.toFixed(1) + 'px, ' + py.toFixed(1) + 'px) perspective(700px) rotateY(' + tiltY.toFixed(1) + 'deg) rotateX(' + tiltX.toFixed(1) + 'deg) rotate(' + rot.toFixed(2) + 'deg)';
      c.el.style.opacity = op.toFixed(3);
      c.el.style.zIndex = String(k > 0.5 ? 60 : 10 + Math.round((1 - dz) * 40));
      setStatus(c, st);
      counts[st]++;
    }
    var bo = ease((raw - T.boardIn) / 0.08) * cut;
    board.style.opacity = bo.toFixed(3);
    board.style.transform = 'translate(-50%, -50%) scale(' + (0.97 + 0.03 * ease((raw - T.boardIn) / 0.08)).toFixed(4) + ')';

    capA.style.opacity = (emerge * (1 - ease((raw - (T.capSwap - 0.02)) / 0.04))).toFixed(3);
    capB.style.opacity = (ease((raw - T.capSwap) / 0.04) * cut).toFixed(3);
    var textA = counts.run + ' running · ' + counts.wait + (counts.wait === 1 ? ' needs your reply' : ' need your reply');
    var textB = counts.done + ' done';
    if (textA !== lastCountA) { countA.textContent = textA; lastCountA = textA; }
    if (textB !== lastCountB) { countB.textContent = textB; lastCountB = textB; }
  }

  function renderName() {
    var st = mark.style;
    /* zoom: out of the V's left stroke at 5× until IVE stands */
    var lit = raw >= T.cutEnd;
    var z = ease((raw - T.cutEnd) / (T.zoomEnd - T.cutEnd));
    /* unfold */
    var p = clamp((raw - T.unfoldStart) / (T.unfoldEnd - T.unfoldStart));
    var u = ease(p);
    var K = 1 + m.b / m.a;
    var reveal = (m.a / m.b) * (Math.pow(K, u) - 1);  /* exponential: the size shrinks at a steady visual rate */
    var gap = GAP0 + (GAP1 - GAP0) * ease(p / 0.5);
    var contentEm;
    if (m.column) {
      contentEm = 0;
      for (var i = 0; i < m.capEm.length; i++) contentEm = Math.max(contentEm, m.capEm[i] + m.restEm[i] * reveal);
    } else {
      contentEm = m.a - 2 * GAP0 + m.b * reveal + 2 * gap;
    }
    var size = Math.min(m.availW / contentEm, m.availH / m.lineEmH);
    /* hand-over: the name scales to 0.6 (real font size) and rises 12vh */
    var hand = ease((raw - T.handStart) / (1 - T.handStart));
    size *= 1 - 0.4 * hand;
    var pop = Math.pow(POP, 1 - z);
    var shiftX = 0, tPop = 1;
    if (pop > 1.0001) {
      /* browsers stop drawing glyphs past a few thousand px: real size up to 6000px, the rest as a transform */
      var fontPop = Math.min(pop, 6000 / size);
      tPop = pop / fontPop;
      var W1 = m.a * size;
      shiftX = m.column ? -m.originX * W1 * (fontPop - 1) : -(m.originX - 0.5) * W1 * (fontPop - 1);
      size *= fontPop;
    }
    var lineAlpha = (lit ? 1 : 0) * (1 - ease((raw - T.handStart) / (T.goneAt - T.handStart)));
    st.setProperty('--mark-size', size.toFixed(2) + 'px');
    st.setProperty('--mark-gap', gap.toFixed(4) + 'em');
    st.setProperty('--mark-reveal', reveal.toFixed(4));
    st.setProperty('--mark-slide', (-0.15 * (1 - reveal)).toFixed(4) + 'em');
    st.setProperty('--mark-fade', (0.35 * (1 - reveal)).toFixed(4) + 'em');
    st.setProperty('--mark-alpha', ease(p / 0.28).toFixed(3));
    st.setProperty('--mark-shift-x', shiftX.toFixed(1) + 'px');
    st.setProperty('--mark-rise', (-0.12 * m.h * hand).toFixed(1) + 'px');
    st.setProperty('--mark-pop', tPop.toFixed(4));
    st.setProperty('--mark-origin-x', (m.originX * 100).toFixed(2) + '%');
    st.setProperty('--mark-line-alpha', lineAlpha.toFixed(3));
    var by = ease((raw - T.byAt) / 0.03) * (1 - ease((raw - T.handStart) / (T.goneAt - T.handStart)));
    st.setProperty('--mark-by', by.toFixed(3));
    mark.classList.toggle('has-by', by > 0.5);
    mark.classList.toggle('is-lit', lit);
    /* light mode: the scene ground crossfades to the page ground (dark mode: same colour) */
    st.setProperty('--ground-mix', ease((raw - T.groundFrom) / (1 - T.groundFrom)).toFixed(3));
    st.setProperty('--mark-hint', (lit || !hintReady) ? '0' : (1 - ease(raw / 0.03)).toFixed(3));
    var zooming = lit && raw < T.zoomEnd + 0.01;
    if (zooming !== zoomOn) { zoomOn = zooming; root.classList.toggle('mark-zoom', zoomOn); }
    var wantDark = raw < T.headerAt;
    if (wantDark !== dark) { dark = wantDark; root.classList.toggle('mark-dark', dark); }
  }


  /* Keep the original tunnel's physical scroll distances, then retain the new
     name/unfold/handover duration. Desktop: 126/210/231vh; phone: 108/180/198vh.
     The semantic raw values stay unchanged for the existing render functions. */
  function scrollProgress(distance) {
    var oldTravel = m.column ? 360 : 420;
    var letterTravel = m.column ? 88 : 110;
    var unit = m.travel / (oldTravel * 0.55 + letterTravel);
    var swarm = oldTravel * 0.30 * unit;
    var dock = oldTravel * 0.50 * unit;
    var cut = oldTravel * 0.55 * unit;
    if (distance <= swarm) return clamp(distance / swarm) * T.swarmEnd;
    if (distance <= dock) return T.swarmEnd + (distance - swarm) / (dock - swarm) * (T.dockEnd - T.swarmEnd);
    if (distance <= cut) return T.dockEnd + (distance - dock) / (cut - dock) * (T.cutEnd - T.dockEnd);
    return T.cutEnd + clamp((distance - cut) / (m.travel - cut)) * (1 - T.cutEnd);
  }

  function frame(ts) {
    looping = false;
    if (!m || halted) return;
    var dt = lastTs === null ? 0 : Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    raw = scrollProgress(window.scrollY - m.top);
    inView = window.scrollY < m.top + m.travel + m.h;
    var sceneOn = raw < T.cutEnd && inView;
    if (raw !== lastRaw) {
      renderName();
      lastRaw = raw;
    }
    if (sceneOn) {
      mark.classList.remove('scene-off');
      renderScene(dt);
      loop();                      /* the swarm's idle drift */
    } else {
      if (!mark.classList.contains('scene-off')) mark.classList.add('scene-off');
      lastTs = null;
    }
  }
  function loop() {
    if (halted || looping || document.hidden) return;
    looping = true;
    window.requestAnimationFrame(frame);
  }

  var resizeTimer = 0;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { measure(); loop(); }, 120);
  }

  measure();
  loop();
  setTimeout(function () { hintReady = true; lastRaw = -1; loop(); }, 900);
  window.addEventListener('scroll', loop, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { lastTs = null; loop(); } });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); loop(); });
  window.addEventListener('load', function () { measure(); loop(); });
  /* reduced motion switched on while the page is open: fall back to the static block */
  var onMotion = function (e) {
    if (!e.matches) return;
    halted = true;                 /* no more frames: the scene is gone */
    window.removeEventListener('scroll', loop);
    mark.classList.remove('is-lit', 'has-by', 'scene-off');
    mark.removeAttribute('style'); /* drop the live custom properties (a zoom-sized --mark-size among them) */
    root.classList.remove('mark-zoom');
    staticMode();
  };
  if (motion.addEventListener) motion.addEventListener('change', onMotion);
  else if (motion.addListener) motion.addListener(onMotion);
})();
