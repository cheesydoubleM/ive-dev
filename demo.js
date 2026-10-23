/* IVE.DEV · demo.js — the app demos on the page (round 5).
   Every [data-demo] figure shows a sharp, generated preview of the IVE interface in a same-origin
   iframe (assets/demo/frame.html?scene=…&theme=…). Previews always play while in view (one at a
   time, the most visible), loop, pause off-screen and in a hidden tab; the preview surface itself
   is inert (no click or wheel inside, no focus). Next to a preview there are two controls only:
   Pause/Play and "Try it yourself", which opens the IVE app built into the site (frame.html with
   mode=app) in a <dialog>, at the slot's place in the app. The Inside IVE reel keeps one frame per
   chapter and advances when a scene ends. Needs site.js first (window.IVE). Without JS the figures
   show their poster. */
(function () {
  'use strict';
  var root = document.documentElement;
  var IVE = window.IVE || {};
  var isGerman = (root.getAttribute('lang') || '').indexOf('de') === 0;
  var TEXT = isGerman
    ? { pause: 'Pause', play: 'Abspielen', pauseLabel: 'Vorschau anhalten', playLabel: 'Vorschau abspielen', close: 'Schließen', tryIt: 'Selbst ausprobieren', tryTitle: 'IVE Demo' }
    : { pause: 'Pause', play: 'Play', pauseLabel: 'Pause the preview', playLabel: 'Play the preview', close: 'Close', tryIt: 'Try it yourself', tryTitle: 'IVE demo' };
  // the app route a preview opens in "Try it yourself" (the Why panel's tile opens the board)
  var APP_ROUTE = { attention: 'board' };
  var FRAME = 'assets/demo/r5/frame.html'; // versioned runtime folder (CDN caches these files for hours)
  var demos = [];
  var viewerOpen = false;
  var whyGroup = [];

  function frameUrl(scene, theme, extra) {
    var q = 'scene=' + encodeURIComponent(scene) + '&theme=' + encodeURIComponent(theme || 'light');
    if (extra) q += '&' + extra;
    return FRAME + '?' + q;
  }
  function el(tag, cls, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }
  function svg(inner, cls) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 16 16');
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('class', 'icon' + (cls ? ' ' + cls : ''));
    s.innerHTML = inner;
    return s;
  }
  var ICON = {
    pause: '<rect class="icon-fill" x="4.25" y="3" width="2.5" height="10" rx="0.6"/><rect class="icon-fill" x="9.25" y="3" width="2.5" height="10" rx="0.6"/>',
    play: '<path class="icon-fill" d="M5 3.4v9.2a.6.6 0 0 0 .92.5l7.2-4.6a.6.6 0 0 0 0-1L5.92 2.9A.6.6 0 0 0 5 3.4Z"/>',
    close: '<path d="M4 4l8 8M12 4l-8 8"/>'
  };

  /* ── one frame (iframe + its protocol) ── */
  function Frame(scene, theme, extra) {
    var f = { scene: scene, theme: theme, iframe: null, ready: false, isApp: false, duration: 0, time: 0, playing: false, title: '', onTime: null, onEnd: null, onReady: null, onPlayState: null };
    f.mount = function (parent, title, inert) {
      if (f.iframe) return f.iframe;
      var i = el('iframe', 'demo-frame', { title: title || 'IVE demo', loading: 'lazy' });
      if (inert) {
        // a preview surface: no focus, no pointer, not announced (the figure's caption describes it)
        i.setAttribute('tabindex', '-1');
        i.setAttribute('aria-hidden', 'true');
        i.inert = true;
      } else i.setAttribute('tabindex', '0');
      i.src = frameUrl(scene, theme, extra);
      f.iframe = i;
      parent.appendChild(i);
      return i;
    };
    f.send = function (msg) {
      if (!f.iframe || !f.iframe.contentWindow) return;
      msg.target = 'ive-demo';
      try { f.iframe.contentWindow.postMessage(msg, location.origin); } catch (e) {}
    };
    f.play = function () { if (f.ready) f.send({ type: 'play' }); };
    f.pause = function () { if (f.ready) f.send({ type: 'pause' }); };
    f.seek = function (t) { if (f.ready) f.send({ type: 'seek', time: t }); };
    f.handle = function (d) {
      if (d.type === 'ready') {
        f.ready = true; f.isApp = !!d.app; f.duration = d.duration || 0; f.title = d.title || '';
        if (f.onReady) f.onReady(f);
      } else if (d.type === 'time') {
        f.time = d.time; f.duration = d.duration || f.duration;
        if (f.onTime) f.onTime(f.time, f.duration);
      } else if (d.type === 'ended') {
        f.playing = false;
        if (f.onEnd) f.onEnd(f);
      } else if (d.type === 'playstate') {
        f.playing = !!d.playing;
        if (f.onPlayState) f.onPlayState(f.playing);
      } else if (d.type === 'key' && d.key === 'Escape') {
        if (dialog && dialog.dialog.open) dialog.dialog.close();
      }
    };
    return f;
  }
  var frames = [];
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data || e.data.source !== 'ive-demo') return;
    for (var k = 0; k < frames.length; k++) {
      if (frames[k].iframe && frames[k].iframe.contentWindow === e.source) { frames[k].handle(e.data); return; }
    }
  });
  function newFrame(scene, theme, extra) { var f = Frame(scene, theme, extra); frames.push(f); return f; }

  /* ── the two controls next to a preview: Pause/Play and Try it yourself ── */
  function controlRow(demo) {
    var row = demo.figure.querySelector('.try-row');
    if (!row && demo.section) row = demo.section.querySelector('.player-provenance');
    return row;
  }
  function buildControls(demo) {
    var row = controlRow(demo);
    if (!row) return;
    var toggle = el('button', 'btn btn-outline btn-sm demo-toggle', { type: 'button', 'data-demo-toggle': '', 'aria-label': TEXT.pauseLabel, 'aria-pressed': 'false' });
    toggle.appendChild(svg(ICON.pause, 'icon-pause'));
    toggle.appendChild(svg(ICON.play, 'icon-play'));
    toggle.appendChild(document.createTextNode(TEXT.pause));
    row.insertBefore(toggle, row.firstChild);
    demo.ui = { toggle: toggle };
    toggle.addEventListener('click', function () {
      if (demo.frame && demo.frame.playing) { demo.userPaused = true; demo.frame.pause(); }
      else { demo.userPaused = false; sync(demo); }
      renderPlayState(demo);
    });
    if (!row.querySelector('[data-demo-try]')) {
      var tryBtn = el('button', 'btn btn-outline btn-sm', { type: 'button', 'data-demo-try': demo.appRoute || APP_ROUTE[demo.scene] || demo.scene, 'data-demo-try-theme': demo.theme || 'light' });
      tryBtn.textContent = TEXT.tryIt;
      row.appendChild(tryBtn);
      wireTry(tryBtn);
    }
  }
  function paintToggle(t, playing, userPaused) {
    t.setAttribute('aria-label', playing ? TEXT.pauseLabel : TEXT.playLabel);
    t.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
    t.classList.toggle('is-paused', !playing);
    t.lastChild.nodeValue = playing ? TEXT.pause : TEXT.play;
  }
  function renderPlayState(demo) {
    var f = demo.frame, playing = !!(f && f.playing);
    demo.figure.classList.toggle('is-playing', playing);
    demo.figure.classList.toggle('is-paused', !playing);
    demo.figure.classList.toggle('is-paused-by-user', !playing && demo.userPaused);
    if (demo.ui && demo.ui.toggle) paintToggle(demo.ui.toggle, playing, demo.userPaused);
    if (whyShared && whyGroup.indexOf(demo) >= 0 && activeWhy() === demo) paintToggle(whyShared.toggle, playing, demo.userPaused);
  }

  /* ── a preview figure ── */
  function Demo(figure, opts) {
    var media = figure.querySelector('.frame-media') || figure;
    var demo = { figure: figure, media: media, section: opts.section || null, frame: null, ratio: 0, near: false, userPaused: false, loop: opts.loop !== false, ui: null, onTime: null, onEnd: opts.onEnd || null, mountedFrames: [] };
    demo.attach = function (frame, title) {
      if (demo.frame === frame) return;
      if (demo.frame) { demo.frame.pause(); if (demo.frame.iframe) demo.frame.iframe.classList.remove('is-active'); }
      demo.frame = frame;
      if (demo.mountedFrames.indexOf(frame) < 0) {
        frame.mount(media, title, true);
        demo.mountedFrames.push(frame);
        frame.onReady = function () { figure.classList.add('is-ready'); if (demo.frame === frame) { renderPlayState(demo); sync(demo.ratio >= 0.5 ? demo : null); } };
        frame.onTime = function (t, d) { if (demo.frame === frame && demo.onTime) demo.onTime(t, d); };
        frame.onPlayState = function () { if (demo.frame === frame) renderPlayState(demo); };
        frame.onEnd = function () {
          if (demo.frame !== frame) return;
          if (demo.onEnd) { demo.onEnd(demo); return; }
          if (demo.loop) demo.loopTimer = setTimeout(function () { if (demo.frame === frame && wantsPlay(demo)) { frame.seek(0); frame.play(); } }, 1200);
          else renderPlayState(demo);
        };
      }
      frame.iframe.classList.add('is-active');
      figure.classList.toggle('is-ready', frame.ready);
      if (frame.ready) renderPlayState(demo);
    };
    if (opts.controls !== false) buildControls(demo);
    demos.push(demo);
    return demo;
  }
  function wantsPlay(demo) {
    if (document.hidden || viewerOpen || demo.userPaused) return false;
    if (IVE.openingIsPinned && IVE.openingIsPinned() && demo.figure.classList.contains('hero-frame')) return false;
    if (demo.figure.hasAttribute('data-demo-when-active') && stackedMode(demo) && !demo.figure.classList.contains('is-active')) return false;
    return demo.ratio >= 0.5;
  }
  // a slot of a stacked panel (the Why beats) plays only while shown, as long as the panel stacks
  function stackedMode(demo) {
    var sec = demo.figure.closest('[data-why]');
    return !!sec && (sec.classList.contains('is-pinned') || sec.classList.contains('is-flow'));
  }
  var preferred = null;
  function sync(prefer) {
    if (prefer) preferred = prefer;
    var best = null, bestRatio = 0;
    demos.forEach(function (d) {
      if (!d.frame || !wantsPlay(d)) return;
      if (d === preferred || !best || d.ratio > bestRatio + 0.01) { best = d; bestRatio = d.ratio; }
      if (d === preferred) bestRatio = 2;
    });
    if (preferred && (!best || best !== preferred)) preferred = null;
    // paired previews (two figures side by side, data-demo-pair) play together
    var playing = best ? [best] : [];
    if (best && best.pair) demos.forEach(function (d) { if (d !== best && d.frame && d.pair === best.pair && wantsPlay(d)) playing.push(d); });
    demos.forEach(function (d) {
      if (!d.frame) return;
      if (playing.indexOf(d) < 0) { if (d.frame.playing) d.frame.pause(); clearTimeout(d.loopTimer); }
    });
    playing.forEach(function (d) { if (d.frame.ready && !d.frame.playing) d.frame.play(); });
  }

  /* ── intersection: mount when near, play when half in view ── */
  var nearIO = null, viewIO = null;
  if ('IntersectionObserver' in window) {
    nearIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        demos.forEach(function (d) { if (d.figure === e.target) { d.near = e.isIntersecting; if (d.near && d.mount) d.mount(); } });
      });
    }, { rootMargin: '100% 0px' });
    viewIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        demos.forEach(function (d) {
          if (d.figure !== e.target) return;
          var was = d.ratio;
          d.ratio = e.isIntersecting ? e.intersectionRatio : 0;
          // leaving view ends a visitor's pause: coming back the preview plays again
          if (was >= 0.5 && d.ratio < 0.5 && d.userPaused) { d.userPaused = false; renderPlayState(d); }
        });
      });
      sync();
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
  }
  function observe(demo) {
    if (nearIO) { nearIO.observe(demo.figure); viewIO.observe(demo.figure); }
    else { demo.ratio = 1; demo.near = true; demo.mount(); }
  }

  /* ── standalone figures: [data-demo] ── */
  Array.prototype.forEach.call(document.querySelectorAll('[data-demo]'), function (figure) {
    var scene = figure.getAttribute('data-demo');
    var theme = figure.getAttribute('data-demo-theme') || 'light';
    var extra = figure.getAttribute('data-demo-params') || '';
    var title = figure.getAttribute('data-demo-title') || 'IVE demo';
    var demo = Demo(figure, { loop: figure.getAttribute('data-demo-loop') !== 'false', controls: figure.getAttribute('data-demo-controls') !== 'false' });
    demo.scene = scene; demo.theme = theme; demo.title = title;
    demo.appRoute = figure.getAttribute('data-demo-app') || null;
    demo.pair = figure.getAttribute('data-demo-pair') || null;
    if (figure.hasAttribute('data-demo-when-active')) whyGroup.push(demo);
    var frame = newFrame(scene, theme, extra);
    demo.mount = function () { if (!frame.iframe) demo.attach(frame, title); };
    figure.classList.add('demo', 'is-demo');
    observe(demo);
  });

  /* ── the Why panel: one shared Pause/Play under the stacked panel (pinned and flow layouts);
        in the static layout each slot gets its own Pause + Try row at the start of its beat ── */
  var whyShared = null;
  function activeWhy() {
    var act = whyGroup.filter(function (d) { return d.figure.classList.contains('is-active'); })[0];
    if (act) return act;
    return whyGroup.slice().sort(function (a, b) { return b.ratio - a.ratio; })[0] || null;
  }
  function makeToggle() {
    var toggle = el('button', 'btn btn-outline btn-sm demo-toggle', { type: 'button', 'data-demo-toggle': '', 'aria-label': TEXT.pauseLabel, 'aria-pressed': 'false' });
    toggle.appendChild(svg(ICON.pause, 'icon-pause'));
    toggle.appendChild(svg(ICON.play, 'icon-play'));
    toggle.appendChild(document.createTextNode(TEXT.pause));
    return toggle;
  }
  (function () {
    var row = document.querySelector('.why-try');
    if (!row || !whyGroup.length) return;
    var toggle = makeToggle();
    row.insertBefore(toggle, row.firstChild);
    whyShared = { toggle: toggle };
    toggle.addEventListener('click', function () {
      var d = activeWhy();
      if (!d) return;
      if (d.frame && d.frame.playing) { whyGroup.forEach(function (x) { x.userPaused = true; }); d.frame.pause(); }
      else { whyGroup.forEach(function (x) { x.userPaused = false; }); sync(d); }
      renderPlayState(d);
    });
    // static layout: a row of its own right under each preview, inside the beat that follows it
    whyGroup.forEach(function (d) {
      var n = d.figure.getAttribute('data-why-media');
      var beat = document.querySelector('[data-why-beat="' + n + '"]');
      if (!beat) return;
      var own = el('div', 'try-row why-slot-row');
      var t = makeToggle();
      own.appendChild(t);
      var tryBtn = el('button', 'btn btn-outline btn-sm', { type: 'button', 'data-demo-try': d.appRoute || APP_ROUTE[d.scene] || d.scene, 'data-demo-try-theme': d.theme || 'dark' });
      tryBtn.textContent = TEXT.tryIt;
      own.appendChild(tryBtn);
      wireTry(tryBtn);
      beat.insertBefore(own, beat.firstChild);
      d.ui = { toggle: t };
      t.addEventListener('click', function () {
        if (d.frame && d.frame.playing) { d.userPaused = true; d.frame.pause(); }
        else { d.userPaused = false; sync(d); }
        renderPlayState(d);
      });
    });
  })();

  /* ── the reel: [data-player] with [data-chapter] buttons ── */
  var player = document.querySelector('[data-player][data-demo-player]');
  if (player) {
    var section = player.closest('[data-inside]') || document;
    var buttons = Array.prototype.slice.call(section.querySelectorAll('[data-chapter]'));
    var captions = Array.prototype.slice.call(section.querySelectorAll('[data-chapter-caption]'));
    var posterImg = player.querySelector('[data-player-poster]');
    var chapters = buttons.map(function (btn) {
      var data = {};
      try { data = JSON.parse(btn.getAttribute('data-chapter-demo') || '{}'); } catch (e) { data = {}; }
      return { btn: btn, li: btn.closest('li'), n: btn.getAttribute('data-chapter'), data: data, frame: data.scene ? newFrame(data.scene, data.theme || 'light', data.params || '') : null };
    });
    var current = -1;
    var demo = Demo(player, { loop: false, section: section });
    demo.scene = 'reel'; demo.title = 'Inside IVE';
    demo.onTime = function (t, d) { if (current >= 0 && d) chapters[current].btn.style.setProperty('--p', (t / d).toFixed(4)); };
    demo.onEnd = function () {
      if (current < 0) return;
      chapters[current].btn.style.setProperty('--p', '1');
      select((current + 1) % chapters.length, true);
    };
    var rail = section.querySelector('[data-chapters]');
    function revealChapter(c) {
      if (!rail || !c.li || rail.scrollWidth <= rail.clientWidth + 1) return;
      var pad = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
      var r = rail.getBoundingClientRect(), b = c.li.getBoundingClientRect();
      if (b.left >= r.left + pad - 1 && b.right <= r.right - pad + 1) return;
      var left = rail.scrollLeft + (b.left - r.left) - pad;
      if (rail.scrollTo) rail.scrollTo({ left: left, behavior: 'smooth' });
      else rail.scrollLeft = left;
    }
    function select(i, restart) {
      var c = chapters[i];
      if (!c || !c.frame) return;
      current = i;
      chapters.forEach(function (o, k) {
        o.btn.setAttribute('aria-pressed', k === i ? 'true' : 'false');
        if (k !== i) o.btn.style.setProperty('--p', '0');
      });
      captions.forEach(function (cap) { cap.classList.toggle('is-active', cap.getAttribute('data-chapter-caption') === c.n); });
      revealChapter(c);
      if (posterImg && c.data.poster && posterImg.getAttribute('src') !== c.data.poster) {
        posterImg.setAttribute('src', c.data.poster);
        if (c.data.poster2x) posterImg.setAttribute('srcset', c.data.poster + ' 1600w, ' + c.data.poster2x + ' 3200w');
      }
      demo.theme = c.data.theme || 'light';
      demo.title = c.data.alt || c.btn.textContent;
      demo.scene = c.data.scene;
      demo.appRoute = c.data.app || null;
      var tryBtn = section.querySelector('[data-player-try]');
      if (tryBtn) { tryBtn.setAttribute('data-demo-try', demo.appRoute || APP_ROUTE[demo.scene] || demo.scene); tryBtn.setAttribute('data-demo-try-theme', demo.theme); }
      demo.attach(c.frame, demo.title);
      if (restart && c.frame.ready) c.frame.seek(0);
      sync(demo.ratio >= 0.5 ? demo : null);
    }
    demo.mount = function () { if (current < 0) select(0, false); };
    chapters.forEach(function (c, i) {
      c.btn.addEventListener('click', function () { demo.userPaused = false; select(i, true); sync(demo); });
    });
    player.classList.add('demo', 'is-demo');
    (section.classList ? section : document.body).classList.add('is-live');
    observe(demo);
  }

  /* ── "Try it yourself": the IVE app built into the site, in a dialog, at the slot's route ── */
  var dialog = null, dialogFrame = null, dialogOpener = null;
  function buildDialog() {
    var d = el('dialog', 'viewer viewer--demo ink-dark', { 'aria-labelledby': 'demo-viewer-caption' });
    var bar = el('div', 'viewer-bar');
    var cap = el('p', 'viewer-caption', { id: 'demo-viewer-caption' });
    var close = el('button', 'icon-btn viewer-close', { type: 'button', 'aria-label': TEXT.close });
    close.appendChild(svg(ICON.close));
    bar.appendChild(cap); bar.appendChild(close);
    var body = el('div', 'viewer-body viewer-body--demo');
    var box = el('div', 'viewer-demo viewer-app');
    body.appendChild(box);
    d.appendChild(bar); d.appendChild(body);
    document.body.appendChild(d);
    close.addEventListener('click', function () { d.close(); });
    d.addEventListener('click', function (e) { if (e.target === d || e.target === body) d.close(); });
    d.addEventListener('close', function () {
      root.classList.remove('viewer-open');
      viewerOpen = false;
      if (dialogFrame) { if (dialogFrame.iframe) dialogFrame.iframe.remove(); frames.splice(frames.indexOf(dialogFrame), 1); dialogFrame = null; }
      sync();
      if (dialogOpener && dialogOpener.focus) dialogOpener.focus({ preventScroll: true });
    });
    dialog = { dialog: d, caption: cap, box: box };
    return dialog;
  }
  function openApp(route, theme, opener) {
    var v = dialog || buildDialog();
    if (typeof v.dialog.showModal !== 'function') return;
    dialogOpener = opener || document.activeElement;
    v.caption.textContent = TEXT.tryTitle;
    viewerOpen = true;
    sync();
    v.box.textContent = '';
    v.box.className = 'viewer-demo viewer-app frame demo is-ready' + (theme === 'light' ? ' is-light' : '');
    dialogFrame = newFrame(route, theme || 'light', 'mode=app');
    dialogFrame.mount(v.box, TEXT.tryTitle, false);
    dialogFrame.iframe.classList.add('is-active');
    dialogFrame.iframe.removeAttribute('loading');
    v.dialog.showModal();
    root.classList.add('viewer-open');
    setTimeout(function () { try { dialogFrame.iframe.focus(); } catch (e) {} }, 50);
  }
  function wireTry(btn) {
    btn.addEventListener('click', function () {
      var route = btn.getAttribute('data-demo-try') || 'board';
      var theme = btn.getAttribute('data-demo-try-theme') || (root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
      openApp(route, theme, btn);
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-demo-try]'), wireTry);
  IVE.openApp = openApp;

  document.addEventListener('visibilitychange', sync);
  window.addEventListener('resize', sync);
  document.addEventListener('ive:openingchange', sync);
  IVE.demos = demos;
  IVE.syncDemos = sync;
})();
