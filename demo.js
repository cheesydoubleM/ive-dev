/* IVE.DEV · demo.js — the generated IVE demos on the page (round 4, replaces the recordings).
   Every [data-demo] figure gets a same-origin iframe (assets/demo/frame.html?scene=…&theme=…),
   play/pause and expand buttons, and a scrubber with the scene's markers. The Inside IVE reel
   ([data-player] with [data-chapter] buttons) keeps one frame per chapter and advances when a
   scene ends. One demo plays at a time: the most visible one at least half in view; a hidden
   tab, reduced motion, a visitor's pause or any pointer interaction inside the demo stops the
   timer. The expand button opens the same scene full size in a <dialog>.
   Needs site.js first (window.IVE: reduceMotion, icon). Without JS the figures show their poster. */
(function () {
  'use strict';
  var root = document.documentElement;
  var IVE = window.IVE || {};
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var isGerman = (root.getAttribute('lang') || '').indexOf('de') === 0;
  var TEXT = isGerman
    ? { pause: 'Demo anhalten', play: 'Demo abspielen', expand: 'Demo groß zeigen', close: 'Schließen', scrub: 'Zeitpunkt in der Demo', at: 'Zu' }
    : { pause: 'Pause the demo', play: 'Play the demo', expand: 'Expand the demo', close: 'Close', scrub: 'Position in the demo', at: 'Go to' };
  var FRAME = 'assets/demo/frame.html';
  var demos = [];
  var viewerOpen = false;

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
  var PLAY = 'M5 3.4v9.2a.6.6 0 0 0 .92.5l7.2-4.6a.6.6 0 0 0 0-1L5.92 2.9A.6.6 0 0 0 5 3.4Z';
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
    play: '<path class="icon-fill" d="' + PLAY + '"/>',
    expand: '<path d="M9.75 2.75h3.5v3.5M13.25 2.75 9 7M6.25 13.25h-3.5v-3.5M2.75 13.25 7 9"/>',
    close: '<path d="M4 4l8 8M12 4l-8 8"/>'
  };

  /* ── one frame (iframe + its protocol) ── */
  function Frame(scene, theme, extra) {
    var f = { scene: scene, theme: theme, iframe: null, ready: false, duration: 0, markers: [], poster: 0, time: 0, playing: false, title: '', onTime: null, onEnd: null, onReady: null, onTakeover: null, onPlayState: null };
    f.mount = function (parent, title) {
      if (f.iframe) return f.iframe;
      var i = el('iframe', 'demo-frame', { title: title || 'IVE demo', loading: 'lazy', tabindex: '0' });
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
        f.ready = true; f.duration = d.duration || 0; f.markers = d.markers || []; f.poster = d.poster || 0; f.title = d.title || '';
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
      } else if (d.type === 'takeover') {
        if (f.onTakeover) f.onTakeover(f);
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

  /* ── controls: play/pause, expand, scrubber ── */
  function buildControls(media, demo) {
    var controls = el('div', 'frame-controls');
    var toggle = el('button', 'frame-btn', { type: 'button', 'aria-label': TEXT.pause, title: TEXT.pause, 'data-demo-toggle': '' });
    toggle.appendChild(svg(ICON.pause, 'icon-pause'));
    toggle.appendChild(svg(ICON.play, 'icon-play'));
    var expand = el('button', 'frame-btn', { type: 'button', 'aria-label': TEXT.expand, title: TEXT.expand, 'data-demo-expand': '' });
    expand.appendChild(svg(ICON.expand));
    controls.appendChild(toggle);
    controls.appendChild(expand);
    media.appendChild(controls);
    var playBig = el('button', 'frame-play', { type: 'button', 'data-demo-play': '' });
    playBig.appendChild(svg(ICON.play));
    playBig.appendChild(document.createTextNode(isGerman ? 'Abspielen' : 'Play'));
    media.appendChild(playBig);
    var scrub = el('div', 'demo-scrub', { role: 'slider', tabindex: '0', 'aria-label': TEXT.scrub, 'aria-valuemin': '0', 'aria-valuemax': '0', 'aria-valuenow': '0' });
    var track = el('div', 'demo-scrub-track');
    var fill = el('div', 'demo-scrub-fill');
    var marks = el('div', 'demo-scrub-marks');
    var tip = el('div', 'demo-scrub-tip');
    track.appendChild(fill);
    scrub.appendChild(track);
    scrub.appendChild(marks);
    scrub.appendChild(tip);
    media.appendChild(scrub);
    demo.ui = { toggle: toggle, expand: expand, playBig: playBig, scrub: scrub, fill: fill, marks: marks, tip: tip };

    var resume = function () { demo.userPaused = false; demo.userStarted = true; if (demo.isViewer) { if (demo.frame) demo.frame.play(); } else sync(demo); };
    toggle.addEventListener('click', function () {
      if (demo.frame && demo.frame.playing) { demo.userPaused = true; demo.frame.pause(); }
      else resume();
    });
    playBig.addEventListener('click', resume);
    if (demo.isViewer) expand.hidden = true;
    else expand.addEventListener('click', function () { openViewer(demo, expand); });

    var dragging = false;
    function fractionAt(clientX) {
      var r = track.getBoundingClientRect();
      return Math.max(0, Math.min(1, (clientX - r.left) / Math.max(1, r.width)));
    }
    function seekTo(p) {
      var f = demo.frame;
      if (!f || !f.ready) return;
      f.seek(p * f.duration);
    }
    scrub.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || !demo.frame) return;
      dragging = true;
      demo.userPaused = true;
      demo.frame.pause();
      scrub.setPointerCapture(e.pointerId);
      seekTo(fractionAt(e.clientX));
      e.preventDefault();
    });
    scrub.addEventListener('pointermove', function (e) {
      var p = fractionAt(e.clientX);
      if (demo.frame && demo.frame.duration) showTip(demo, p);
      if (dragging) seekTo(p);
    });
    scrub.addEventListener('pointerleave', function () { tip.classList.remove('is-visible'); });
    scrub.addEventListener('pointerup', function () { dragging = false; });
    scrub.addEventListener('pointercancel', function () { dragging = false; });
    scrub.addEventListener('keydown', function (e) {
      var f = demo.frame;
      if (!f || !f.ready) return;
      var step = e.shiftKey ? 5 : 1, t = f.time;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') t += step;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') t -= step;
      else if (e.key === 'Home') t = 0;
      else if (e.key === 'End') t = f.duration;
      else if (e.key === ' ' || e.key === 'Enter') { toggle.click(); e.preventDefault(); return; }
      else return;
      e.preventDefault();
      demo.userPaused = true;
      f.pause();
      f.seek(Math.max(0, Math.min(f.duration, t)));
    });
  }
  function showTip(demo, p) {
    var f = demo.frame, tip = demo.ui.tip;
    var t = p * f.duration, label = '';
    for (var k = f.markers.length - 1; k >= 0; k--) { if (f.markers[k].t <= t + 0.01) { label = f.markers[k].label; break; } }
    tip.textContent = (label ? label + ' · ' : '') + t.toFixed(1) + ' s';
    tip.style.left = (p * 100).toFixed(2) + '%';
    tip.classList.add('is-visible');
  }
  function renderMarkers(demo) {
    var f = demo.frame, ui = demo.ui;
    if (!f || !ui) return;
    ui.marks.textContent = '';
    ui.scrub.setAttribute('aria-valuemax', String(Math.round(f.duration)));
    f.markers.forEach(function (m) {
      if (!f.duration) return;
      var b = el('button', 'demo-mark', { type: 'button', title: TEXT.at + ' „' + m.label + '“', 'aria-label': TEXT.at + ' ' + m.label });
      b.style.left = ((m.t / f.duration) * 100).toFixed(2) + '%';
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        demo.userPaused = false;
        demo.userStarted = true;
        f.seek(m.t);
        if (demo.isViewer) f.play(); else sync(demo);
      });
      ui.marks.appendChild(b);
    });
  }
  function renderTime(demo) {
    var f = demo.frame, ui = demo.ui;
    if (!f || !ui || !f.duration) return;
    var p = f.time / f.duration;
    ui.fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    ui.scrub.setAttribute('aria-valuenow', String(Math.round(f.time)));
    ui.scrub.setAttribute('aria-valuetext', f.time.toFixed(0) + ' s');
    if (demo.onTime) demo.onTime(f.time, f.duration);
  }
  function renderPlayState(demo) {
    var f = demo.frame, playing = !!(f && f.playing);
    demo.figure.classList.toggle('is-playing', playing);
    demo.figure.classList.toggle('is-paused', !playing);
    demo.figure.classList.toggle('is-paused-by-user', !playing && demo.userPaused);
    demo.figure.classList.toggle('needs-play', !playing && (motion.matches || demo.userPaused) && !!(f && f.ready));
    if (demo.ui) {
      demo.ui.toggle.setAttribute('aria-label', playing ? TEXT.pause : TEXT.play);
      demo.ui.toggle.setAttribute('title', playing ? TEXT.pause : TEXT.play);
    }
  }

  /* ── a demo figure ── */
  function Demo(figure, opts) {
    var media = figure.querySelector('.frame-media') || figure;
    var demo = {
      figure: figure, media: media, frame: null, ratio: 0, near: false,
      userPaused: false, userStarted: false, loop: opts.loop !== false, ui: null, onTime: null, onEnd: opts.onEnd || null,
      mountedFrames: []
    };
    if (opts.controls !== false) buildControls(media, demo);
    demo.attach = function (frame, title) {
      if (demo.frame === frame) return;
      if (demo.frame) { demo.frame.pause(); if (demo.frame.iframe) demo.frame.iframe.classList.remove('is-active'); }
      demo.frame = frame;
      var mounted = demo.mountedFrames.indexOf(frame) >= 0;
      if (!mounted) {
        frame.mount(media, title);
        demo.mountedFrames.push(frame);
        frame.onReady = function () {
          figure.classList.add('is-ready');
          if (demo.frame === frame) { renderMarkers(demo); renderTime(demo); renderPlayState(demo); sync(demo); }
        };
        frame.onTime = function () { if (demo.frame === frame) renderTime(demo); };
        frame.onPlayState = function () { if (demo.frame === frame) renderPlayState(demo); };
        frame.onTakeover = function () { demo.userPaused = true; renderPlayState(demo); };
        frame.onEnd = function () {
          if (demo.frame !== frame) return;
          if (demo.onEnd) { demo.onEnd(demo); return; }
          if (demo.loop && !motion.matches) {
            demo.loopTimer = setTimeout(function () { if (demo.frame === frame && wantsPlay(demo)) { frame.seek(0); frame.play(); } }, 1200);
          } else renderPlayState(demo);
        };
      }
      frame.iframe.classList.add('is-active');
      figure.classList.toggle('is-ready', frame.ready);
      if (frame.ready) { renderMarkers(demo); renderTime(demo); renderPlayState(demo); }
    };
    demos.push(demo);
    return demo;
  }
  function wantsPlay(demo) {
    if (document.hidden || viewerOpen || demo.userPaused) return false;
    if (motion.matches && !demo.userStarted) return false;
    if (IVE.openingIsPinned && IVE.openingIsPinned() && demo.figure.classList.contains('hero-frame')) return false;
    // a slot of a stacked panel (the Why beats) plays only while it is the shown one
    if (demo.figure.hasAttribute('data-demo-when-active') && !demo.figure.classList.contains('is-active')) return false;
    return demo.ratio >= 0.5 || (demo.userStarted && demo.ratio > 0);
  }
  var active = null, preferred = null;
  function sync(prefer) {
    if (prefer) preferred = prefer;
    var best = null, bestRatio = 0;
    demos.forEach(function (d) {
      if (!d.frame || !wantsPlay(d)) return;
      if (d === preferred || !best || d.ratio > bestRatio + 0.01) { best = d; bestRatio = d.ratio; }
      if (d === preferred) bestRatio = 2;
    });
    if (preferred && (!best || best !== preferred)) preferred = null;
    active = best;
    demos.forEach(function (d) {
      if (!d.frame) return;
      if (d !== best) { if (d.frame.playing) d.frame.pause(); clearTimeout(d.loopTimer); }
    });
    if (best && best.frame.ready && !best.frame.playing) best.frame.play();
  }

  /* ── intersection: mount when near, play when half in view ── */
  var nearIO = null, viewIO = null;
  if ('IntersectionObserver' in window) {
    nearIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        demos.forEach(function (d) {
          if (d.figure !== e.target) return;
          d.near = e.isIntersecting;
          if (d.near && d.mount) d.mount();
        });
      });
    }, { rootMargin: '100% 0px' });
    viewIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        demos.forEach(function (d) {
          if (d.figure !== e.target) return;
          var was = d.ratio;
          d.ratio = e.isIntersecting ? e.intersectionRatio : 0;
          // leaving view ends a visitor's pause: coming back the demo runs again
          if (was >= 0.5 && d.ratio < 0.5 && d.userPaused && !motion.matches) { d.userPaused = false; }
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
    var title = figure.getAttribute('data-demo-title') || (figure.querySelector('.frame-poster') || {}).alt || 'IVE demo';
    var demo = Demo(figure, { loop: figure.getAttribute('data-demo-loop') !== 'false', controls: figure.getAttribute('data-demo-controls') !== 'false' });
    demo.caption = figure.getAttribute('data-demo-caption') || '';
    demo.scene = scene; demo.theme = theme; demo.title = title;
    var frame = newFrame(scene, theme, extra);
    demo.mount = function () { if (!frame.iframe) demo.attach(frame, title); };
    figure.classList.add('demo', 'is-demo');
    observe(demo);
  });

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
    var demo = Demo(player, { loop: false });
    demo.scene = 'reel'; demo.title = 'Inside IVE';
    demo.onTime = function (t, d) { if (current >= 0 && d) chapters[current].btn.style.setProperty('--p', (t / d).toFixed(4)); };
    demo.onEnd = function () {
      if (current < 0) return;
      chapters[current].btn.style.setProperty('--p', '1');
      if (motion.matches) { demo.userStarted = false; renderPlayState(demo); return; }
      var next = (current + 1) % chapters.length;
      select(next, true);
    };
    var rail = section.querySelector('[data-chapters]');
    function revealChapter(c) {
      if (!rail || !c.li || rail.scrollWidth <= rail.clientWidth + 1) return;
      var pad = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
      var r = rail.getBoundingClientRect(), b = c.li.getBoundingClientRect();
      if (b.left >= r.left + pad - 1 && b.right <= r.right - pad + 1) return;
      var left = rail.scrollLeft + (b.left - r.left) - pad;
      if (rail.scrollTo) rail.scrollTo({ left: left, behavior: motion.matches ? 'auto' : 'smooth' });
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
      demo.caption = c.data.caption || '';
      demo.theme = c.data.theme || 'light';
      demo.title = c.data.alt || c.btn.textContent;
      demo.attach(c.frame, demo.title);
      if (restart && c.frame.ready) c.frame.seek(0);
      sync(demo.ratio >= 0.5 ? demo : null);
    }
    demo.mount = function () { if (current < 0) select(0, false); };
    chapters.forEach(function (c, i) {
      c.btn.addEventListener('click', function () {
        demo.userPaused = false;
        demo.userStarted = true;
        select(i, true);
        sync(demo);
      });
    });
    player.classList.add('demo', 'is-demo');
    (section.classList ? section : document.body).classList.add('is-live');
    observe(demo);
  }

  /* ── the full-size viewer ── */
  var dialog = null, dialogFrame = null, dialogOpener = null;
  function buildDialog() {
    var d = el('dialog', 'viewer viewer--demo ink-dark', { 'aria-labelledby': 'demo-viewer-caption' });
    var bar = el('div', 'viewer-bar');
    var cap = el('p', 'viewer-caption', { id: 'demo-viewer-caption' });
    var close = el('button', 'icon-btn viewer-close', { type: 'button', 'aria-label': TEXT.close });
    close.appendChild(svg(ICON.close));
    bar.appendChild(cap); bar.appendChild(close);
    var body = el('div', 'viewer-body viewer-body--demo');
    var box = el('div', 'viewer-demo');
    body.appendChild(box);
    d.appendChild(bar); d.appendChild(body);
    document.body.appendChild(d);
    close.addEventListener('click', function () { d.close(); });
    d.addEventListener('click', function (e) { if (e.target === d || e.target === body) d.close(); });
    d.addEventListener('close', function () {
      root.classList.remove('viewer-open');
      viewerOpen = false;
      if (dialogFrame) { if (dialogFrame.iframe) dialogFrame.iframe.remove(); frames.splice(frames.indexOf(dialogFrame), 1); dialogFrame = null; }
      viewerDemo = null;
      sync();
      if (dialogOpener && dialogOpener.focus) dialogOpener.focus({ preventScroll: true });
    });
    dialog = { dialog: d, caption: cap, box: box };
    return dialog;
  }
  var viewerDemo = null;
  function openViewer(demo, opener) {
    var v = dialog || buildDialog();
    if (typeof v.dialog.showModal !== 'function' || !demo.frame) return;
    dialogOpener = opener || document.activeElement;
    v.caption.textContent = demo.caption || demo.title || '';
    var at = demo.frame.time || 0;
    if (demo.frame.playing) demo.frame.pause();
    viewerOpen = true;
    sync();
    v.box.textContent = '';
    v.box.className = 'viewer-demo frame demo' + (demo.theme === 'light' ? ' is-light' : '');
    dialogFrame = newFrame(demo.frame.scene, demo.frame.theme, 'at=' + at.toFixed(2));
    // the expanded scene has the same controls as the inline one
    var vd = viewerDemo = { figure: v.box, media: v.box, frame: dialogFrame, ui: null, userPaused: false, userStarted: true, isViewer: true, caption: demo.caption, title: demo.title, theme: demo.theme };
    buildControls(v.box, vd);
    dialogFrame.onReady = function () { renderMarkers(vd); renderTime(vd); renderPlayState(vd); if (!motion.matches) dialogFrame.play(); else { vd.userPaused = true; renderPlayState(vd); } };
    dialogFrame.onTime = function () { renderTime(vd); };
    dialogFrame.onPlayState = function () { renderPlayState(vd); };
    dialogFrame.onTakeover = function () { vd.userPaused = true; renderPlayState(vd); };
    dialogFrame.onEnd = function () { if (!motion.matches && !vd.userPaused) setTimeout(function () { if (viewerOpen && dialogFrame === vd.frame) { dialogFrame.seek(0); dialogFrame.play(); } }, 1200); else renderPlayState(vd); };
    dialogFrame.mount(v.box, demo.title || 'IVE demo');
    dialogFrame.iframe.classList.add('is-active');
    v.box.classList.add('is-ready');
    v.dialog.showModal();
    root.classList.add('viewer-open');
  }

  document.addEventListener('visibilitychange', sync);
  window.addEventListener('resize', sync);
  document.addEventListener('ive:openingchange', sync);
  var onMotion = function () { demos.forEach(function (d) { d.userStarted = false; renderPlayState(d); }); sync(); };
  if (motion.addEventListener) motion.addEventListener('change', onMotion);
  else if (motion.addListener) motion.addListener(onMotion);
  IVE.demos = demos;
  IVE.syncDemos = sync;
})();
