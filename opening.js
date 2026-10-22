/* IVE.DEV · opening.js — the opening scene, index only.
   The mark controller of 0d2d27a (script.js), taken over as it was
   (owner, 2026-10-23: "mache es einfach so wie es vorher war"): inside
   the machine a grid corridor rushes past, coding agents swarm as session
   cards, come under control onto one Mission Control board, everything
   goes dark, the view zooms out of the V's stroke until the mark stands,
   and IVE unfolds into its name. Time drives the swarm, scroll drives
   the story. Same data, seeds, timeline, measurement and fallbacks.
   Changes: it runs from its own file once the DOM is ready, declares the
   reduced-motion flag that script.js held, and leaves out the entrance
   observer of the old hero (the new hero has none). html.mark-live and
   html.mark-dark are set by the boot script in index.html, as before. */
(function () {
  'use strict';

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduceMotion = motionQuery.matches;

  /* ── mark: inside the machine — agents swarm, come under control, IVE unfolds ── */
  function startMark() {
    var root = document.documentElement;
    var mark = document.querySelector('[data-mark]');
    if (!mark) return;
    if (reduceMotion || !root.classList.contains('mark-live')) {
      root.classList.remove('mark-live');
      root.classList.remove('mark-dark');
      return;
    }
    var pin = mark.querySelector('[data-mark-pin]');
    var line = mark.querySelector('[data-mark-line]');
    var caps = Array.prototype.slice.call(mark.querySelectorAll('[data-mark-cap]'));
    var rests = Array.prototype.slice.call(mark.querySelectorAll('[data-mark-rest]'));
    var scene = mark.querySelector('[data-scene]');
    var cam = mark.querySelector('[data-scene-cam]');
    var walls = {};
    Array.prototype.forEach.call(mark.querySelectorAll('[data-wall]'), function (w) { walls[w.getAttribute('data-wall')] = w; });
    var ringsBox = mark.querySelector('[data-scene-rings]');
    var swarmBox = mark.querySelector('[data-scene-swarm]');
    var board = mark.querySelector('[data-scene-board]');
    var capA = mark.querySelector('[data-scene-caption="a"]');
    var capB = mark.querySelector('[data-scene-caption="b"]');
    var countA = mark.querySelector('[data-scene-count="a"]');
    var countB = mark.querySelector('[data-scene-count="b"]');
    var columnQuery = window.matchMedia('(max-width: 720px)');
    var GAP0 = 0.02, GAP1 = 0.24;      /* em between the words: wordmark-tight → real word gap */
    /* story on the scroll axis */
    var T_CHAOS = 0.30;                 /* agents swarm */
    var T_CTRL = 0.50;                  /* they come under control */
    var T_END = 0.55;                   /* everything has gone dark; the mark is there, the viewer inside a stroke */
    var Z_END = 0.72;                   /* zoomed out of the letters, the mark stands */
    var P_START = 0.76, P_END = 0.92;   /* the name unfolds, then holds */
    var RINGS = 8, GRID = 120;
    /* sessions as the board's tile header names them: title + model id (mono) */
    var AGENTS = [
      ['Sign-in backend', 'sonnet'], ['Sign-in screen', 'sonnet'],
      ['Sign-in checks', 'haiku'], ['Review the changes', 'opus'],
      ['Build the workspace', 'sonnet'], ['Connect the API', 'gemini-pro'],
      ['Check the sign-in flow', 'sonnet'], ['Theme toggle', 'gemini-flash'],
      ['Session list paging', 'haiku'], ['WebSocket reconnect', 'opus'],
      ['Migrate the schema', 'sonnet'], ['Write the changelog', 'haiku']
    ];
    /* per state: the tile header's pill (word + class) and the status line's words, as the app shows them */
    var STATUS = {
      run: { pill: 'Running', cls: 'is-running', state: 'Working on your request' },
      wait: { pill: 'Waiting', cls: 'is-waiting', state: 'Your answer is needed' },
      done: { pill: 'Done', cls: 'is-done', state: 'Reply ready' }
    };
    var m = null;                       /* measurements in em (taken at 100px) */
    var raw = 0, lastRaw = -1;
    var hintReady = false;              /* the scroll hint waits a moment on the black screen */
    var clock = 0, age = 0, lastTs = null, looping = false, frameNo = 0;
    var lastCountA = '', lastCountB = '';

    var ease = function (x) {
      x = x < 0 ? 0 : x > 1 ? 1 : x;
      return x * x * (3 - 2 * x);
    };
    var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
    var rnd = function (i, k) { var x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };

    var rings = [];
    for (var r = 0; r < RINGS; r++) {
      var ring = document.createElement('div');
      ring.className = 'scene-ring';
      ringsBox.appendChild(ring);
      rings.push(ring);
    }
    var agents = AGENTS.map(function (def, i) {
      var el = document.createElement('div');
      el.className = 'scene-agent au au-tile';
      el.innerHTML = '<div class="au-tile-head"><span class="au-title"></span><span class="au-pill"></span><span class="au-model"></span></div><div class="au-tile-status"><span class="au-state"></span></div>';
      el.querySelector('.au-title').textContent = def[0];
      el.querySelector('.au-model').textContent = def[1];
      swarmBox.appendChild(el);
      return {
        el: el, pill: el.querySelector('.au-pill'), status: el.querySelector('.au-tile-status'), word: el.querySelector('.au-state'), st: '',
        x0: (rnd(i, 1) * 2 - 1) * 0.9, y0: (rnd(i, 2) * 2 - 1) * 0.8, z0: rnd(i, 3),
        v: (0.045 + 0.06 * rnd(i, 4)) * (rnd(i, 5) < 0.3 ? -1 : 1),
        ax: 0.12 + 0.3 * rnd(i, 6), ay: 0.08 + 0.22 * rnd(i, 7),
        wx: 0.3 + 0.5 * rnd(i, 8), wy: 0.25 + 0.45 * rnd(i, 9),
        px: rnd(i, 10) * 6.283, py: rnd(i, 11) * 6.283,
        rot: 3 + 7 * rnd(i, 12), flick: 0.6 + 0.8 * rnd(i, 13)
      };
    });

    function setStatus(a, st) {
      if (a.st === st) return;
      a.st = st;
      var d = STATUS[st];
      a.el.setAttribute('data-st', st);
      a.el.classList.toggle('is-waiting', st === 'wait');
      a.pill.textContent = d.pill;
      a.pill.className = 'au-pill ' + d.cls;
      a.status.className = 'au-tile-status' + (st === 'run' ? '' : ' ' + d.cls);
      a.word.textContent = d.state;
    }

    function measure() {
      mark.classList.add('is-measuring');
      var capEm = caps.map(function (c) { return c.getBoundingClientRect().width / 100; });
      var restEm = rests.map(function (r) { return r.getBoundingClientRect().width / 100; });
      var lineEmH = line.getBoundingClientRect().height / 100;
      mark.classList.remove('is-measuring');
      rests.forEach(function (r, i) {
        r.parentNode.style.setProperty('--rest-em', restEm[i].toFixed(4));
      });
      var cs = getComputedStyle(pin);
      var availW = pin.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      availW = Math.min(availW, 1480) * 0.9;
      var availH = pin.clientHeight * 0.56;
      var column = columnQuery.matches;
      var sumCap = capEm.reduce(function (a, b) { return a + b; }, 0);
      var sumRest = restEm.reduce(function (a, b) { return a + b; }, 0);
      /* board slots for the controlled agents: the pitch comes from the card's real size
         (fixed width, two strips; see app-ui-blocks.css), 4 columns where they fit, else 3, 2 on phones */
      var card = agents[0].el, gap = column ? 8 : 10;
      var cw = card.offsetWidth + gap, ch = card.offsetHeight + gap;
      var cols = column ? 2 : (4 * cw + 28 <= pin.clientWidth - 160 ? 4 : 3);   /* 4 across only with 80px to spare on each side */
      var rows = Math.ceil(AGENTS.length / cols);
      var boardScale = 1;
      var slots = agents.map(function (a, i) {
        var col = i % cols, row = Math.floor(i / cols);
        return { x: (col - (cols - 1) / 2) * cw, y: (row - (rows - 1) / 2) * ch };
      });
      board.style.width = (cols * cw + 28) + 'px';
      board.style.height = (rows * ch + 28 + 28) + 'px';
      m = {
        column: column,
        capEm: capEm, restEm: restEm,
        availW: availW, availH: availH, lineEmH: lineEmH,
        w: pin.clientWidth, h: pin.clientHeight,
        vmin: Math.min(pin.clientWidth, pin.clientHeight),
        slots: slots, boardScale: boardScale,
        /* a: width in em with nothing revealed, b: em that reveal adds at full */
        a: column ? Math.max.apply(null, capEm) : sumCap + 2 * GAP0,
        b: column ? Math.max.apply(null, restEm) : sumRest,
        top: mark.getBoundingClientRect().top + window.scrollY,
        travel: Math.max(1, mark.offsetHeight - pin.offsetHeight)
      };
      /* zoom origin: the V's left stroke at mid height, as a fraction of the tight IVE line */
      m.originX = column ? (0.31 * capEm[1]) / m.a : (capEm[0] + GAP0 + 0.31 * capEm[1]) / m.a;
      var size0 = Math.min(availW / m.a, availH / lineEmH);
      var diag = Math.sqrt(m.w * m.w + m.h * m.h);
      m.zoom0 = Math.max(10, 1.45 * diag / (0.19 * size0));
      lastRaw = -1;
    }

    function renderScene(dt) {
      frameNo++;
      var c = clamp(raw / T_CHAOS);
      var k = ease((raw - T_CHAOS) / (T_CTRL - T_CHAOS));
      var g = ease((raw - T_CTRL) / (T_END - T_CTRL));
      age += dt;
      clock += dt * (1 - k);                 /* the swarm's own time slows as control takes over */
      var emerge = ease(age / 1.4);          /* out of black */
      var dim = 1 - g;                       /* after control, everything goes dark */
      var lightFade = dim;
      var still = (1 - k) * dim;
      scene.style.setProperty('--scene-lines', (emerge * (0.35 + 0.65 * (1 - k)) * dim).toFixed(3));
      scene.style.setProperty('--scene-scan', (emerge * dim).toFixed(3));
      scene.style.setProperty('--scene-vig', '1');

      /* camera: a slow drift while flying, dead still once in control */
      var swayX = Math.sin(clock * 0.37) * 16 * still, swayY = Math.cos(clock * 0.29) * 10 * still;
      var swayR = Math.sin(clock * 0.23) * 0.9 * still;
      cam.style.transform = 'translate(' + swayX.toFixed(1) + 'px, ' + swayY.toFixed(1) + 'px) rotate(' + swayR.toFixed(2) + 'deg)';

      /* corridor: the grid flows past, faster with scroll, then stops */
      var dist = (clock * 90 + c * 900) % GRID;
      walls.floor.style.transform = 'rotateX(-90deg) translateY(' + (-dist).toFixed(1) + 'px)';
      walls.ceil.style.transform = 'rotateX(90deg) translateY(' + dist.toFixed(1) + 'px)';
      walls.left.style.transform = 'rotateY(90deg) translateX(' + (-dist).toFixed(1) + 'px)';
      walls.right.style.transform = 'rotateY(-90deg) translateX(' + dist.toFixed(1) + 'px)';

      /* ring frames rushing past */
      var camz = clock * 0.32 + c * 1.4;
      for (var i = 0; i < RINGS; i++) {
        var d = (i / RINGS + 1 - (camz - Math.floor(camz))) % 1;
        var s = 2.8 / (1 + d * 26);
        var o = 0.5 * (0.4 + 0.6 * (1 - d)) * ease(d / 0.06) * ease((1 - d) / 0.3) * emerge * still;
        rings[i].style.transform = 'translate(-50%, -50%) scale(' + s.toFixed(4) + ')';
        rings[i].style.opacity = o.toFixed(3);
      }

      /* agents: swarm in depth, then glide onto the board */
      var RX = m.w * 0.55, RY = m.h * 0.5;
      var t = clock;
      var counts = { run: 0, wait: 0, done: 0 };
      for (var n = 0; n < agents.length; n++) {
        var a = agents[n];
        var dz = ((a.z0 + t * a.v + c * 0.6 * (a.v > 0 ? 1 : -1)) % 1 + 1) % 1;   /* 0 = at the viewer, 1 = far */
        var persp = 0.35 / (0.35 + 2.2 * dz);
        var sx = a.x0 + a.ax * Math.sin(a.wx * t + a.px);
        var sy = a.y0 + a.ay * Math.sin(a.wy * t + a.py);
        var px = sx * RX * persp, py = sy * RY * persp;
        var sc = 2.4 * persp;
        var op = ease(dz / 0.05) * ease((1 - dz) / 0.2) * emerge;
        var rot = a.rot * Math.sin(a.wy * t * 1.3 + a.py);
        var tiltY = -sx * 16, tiltX = sy * 10;
        var st;
        if (k < 0.5) {
          /* now and then a session needs you: the tile flips to "Waiting" / "Your answer is needed" and shivers */
          var f = Math.sin(t * a.flick + a.px * 2);
          st = f > 0.76 ? 'wait' : 'run';
        } else {
          st = (k - 0.78) / 0.22 > (n + 0.5) / agents.length ? 'done' : 'run';
        }
        if (st === 'wait' && k < 0.5) { px += (rnd(frameNo, n) - 0.5) * 3; py += (rnd(frameNo, n + 40) - 0.5) * 3; }
        if (k > 0) {
          var slot = m.slots[n];
          px += (slot.x - px) * k; py += (slot.y - py) * k;
          sc += (m.boardScale - sc) * k; rot *= (1 - k); op += (1 - op) * k;
          tiltY *= (1 - k); tiltX *= (1 - k);
        }
        op *= lightFade;
        a.el.style.transform = 'translate(-50%, -50%) translate(' + px.toFixed(1) + 'px, ' + py.toFixed(1) + 'px) perspective(700px) rotateY(' + tiltY.toFixed(1) + 'deg) rotateX(' + tiltX.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ') rotate(' + rot.toFixed(2) + 'deg)';
        a.el.style.opacity = op.toFixed(3);
        a.el.style.zIndex = k > 0.5 ? 60 : 10 + Math.round((1 - dz) * 40);
        setStatus(a, st);
        counts[st]++;
      }

      /* the board panel appears around the controlled agents */
      var bo = ease((k - 0.45) / 0.45) * lightFade;
      board.style.opacity = bo.toFixed(3);
      board.style.transform = 'translate(-50%, -50%) translateY(-14px) scale(' + (0.96 + 0.04 * ease((k - 0.45) / 0.45)).toFixed(3) + ')';

      /* captions and live counts */
      capA.style.opacity = (ease((age - 0.6) / 0.8) * (1 - ease(k / 0.4))).toFixed(3);
      capB.style.opacity = (ease((k - 0.55) / 0.35) * dim).toFixed(3);
      var textA = counts.run + ' running · ' + counts.wait + (counts.wait === 1 ? ' needs your reply' : ' need your reply');
      var textB = counts.done + ' done' + (counts.run ? ' · ' + counts.run + ' running' : '');
      if (textA !== lastCountA) { countA.textContent = textA; lastCountA = textA; }
      if (textB !== lastCountB) { countB.textContent = textB; lastCountB = textB; }

      root.classList.add('mark-dark');
    }

    function renderUnfold() {
      var p = clamp((raw - P_START) / (P_END - P_START));
      var u = ease((p - 0.02) / 0.84);
      /* exponential reveal: the size then shrinks at a steady visual rate */
      var K = 1 + m.b / m.a;
      var reveal = (m.a / m.b) * (Math.pow(K, u) - 1);
      var gap = GAP0 + (GAP1 - GAP0) * ease(p / 0.5);
      var contentEm;
      if (m.column) {
        contentEm = 0;
        for (var i = 0; i < m.capEm.length; i++) {
          contentEm = Math.max(contentEm, m.capEm[i] + m.restEm[i] * reveal);
        }
      } else {
        contentEm = m.a - 2 * GAP0 + m.b * reveal + 2 * gap;
      }
      var size = Math.min(m.availW / contentEm, m.availH / m.lineEmH);
      /* out of the letters: the view starts inside the V's left stroke and zooms out until the mark stands */
      var z = clamp((raw - T_END) / (Z_END - T_END));
      var pop = Math.pow(m.zoom0, 1 - ease(z));
      var shiftX = 0, shiftY = 0, tPop = 1;
      if (pop > 1.0001) {
        /* browsers stop drawing glyphs past a few thousand px: grow the type up to a cap, the rest is a transform about the same point */
        var fontPop = Math.min(pop, 6000 / size);
        tPop = pop / fontPop;
        var W1 = m.a * size;
        shiftX = m.column ? -m.originX * W1 * (fontPop - 1) : -(m.originX - 0.5) * W1 * (fontPop - 1);
        size *= fontPop;
      }
      root.classList.remove('mark-dark');
      var alpha = ease(p / 0.28);
      var slide = -0.15 * (1 - reveal);
      var fade = 0.35 * (1 - reveal);
      var st = mark.style;
      st.setProperty('--mark-size', size.toFixed(2) + 'px');
      st.setProperty('--mark-gap', gap.toFixed(4) + 'em');
      st.setProperty('--mark-reveal', reveal.toFixed(4));
      st.setProperty('--mark-slide', slide.toFixed(4) + 'em');
      st.setProperty('--mark-fade', fade.toFixed(4) + 'em');
      st.setProperty('--mark-alpha', alpha.toFixed(3));
      st.setProperty('--mark-shift-x', shiftX.toFixed(1) + 'px');
      st.setProperty('--mark-shift-y', shiftY.toFixed(1) + 'px');
      st.setProperty('--mark-pop', tPop.toFixed(4));
      st.setProperty('--mark-origin-x', (m.originX * 100).toFixed(2) + '%');
      var by = ease((p - 0.78) / 0.2);
      st.setProperty('--mark-by', by.toFixed(3));
      mark.classList.toggle('has-by', by > 0.5);
    }

    function frame(ts) {
      looping = false;
      if (!m) return;
      var dt = lastTs === null ? 0 : Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;
      raw = clamp((window.scrollY - m.top) / m.travel);
      var lit = raw >= T_END;
      var inView = window.scrollY < m.top + m.travel + m.h;
      if (raw !== lastRaw) {
        mark.classList.toggle('is-lit', lit);
        if (!lit) root.classList.add('mark-dark');
        renderUnfold();
        mark.style.setProperty('--mark-hint', (lit || !hintReady) ? '0' : (1 - ease(raw / 0.03)).toFixed(3));
        lastRaw = raw;
      }
      if (!lit && inView) {
        renderScene(dt);
        loop();
      } else {
        lastTs = null;
      }
    }
    function loop() {
      if (looping) return;
      looping = true;
      window.requestAnimationFrame(frame);
    }

    var resizeTimer = null;
    var onResize = function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { measure(); loop(); }, 120);
    };

    measure(); loop();
    setTimeout(function () { hintReady = true; lastRaw = -1; loop(); }, 900);
    window.addEventListener('scroll', loop, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { measure(); loop(); });
    }
    window.addEventListener('load', function () { measure(); loop(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startMark);
  else startMark();
})();
