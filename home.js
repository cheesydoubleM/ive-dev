/* IVE.DEV · home.js — Why IVE (brief 4.2) and the Inside IVE reel (4.3).
   Needs site.js first (window.IVE: pickSource, mediaWidth, openViewer, pauseAll).
   Markup contract: design/partials/USAGE.md, reference: design/partials/home-scenes.html. */

/* ── Why IVE ───────────────────────────────────────────────────────
   ≥720px with motion: pinned 340vh. The viewport-wide question docks to
   40px through real font sizes, then four beats switch by scroll position
   (CSS does the 220ms crossfade). <720px: sticky panel, beats in flow.
   Reduced motion, no JS, short windows: static flow (CSS). */
(function () {
  'use strict';
  var section = document.querySelector('[data-why]');
  if (!section) return;
  // the pictures load one viewport ahead (home.css hides them until .is-near)
  if ('IntersectionObserver' in window) {
    var nearIO = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { section.classList.add('is-near'); nearIO.disconnect(); }
    }, { rootMargin: '100% 0px' });
    nearIO.observe(section);
  } else {
    section.classList.add('is-near');
  }
  var IVE = window.IVE || {};
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var wide = window.matchMedia('(min-width: 720px)');
  var tall = window.matchMedia('(min-height: 560px)');
  var pin = section.querySelector('[data-why-pin]');
  var question = section.querySelector('[data-why-question]');
  var words = Array.prototype.slice.call(section.querySelectorAll('[data-why-word]'));
  var prelude = section.querySelector('[data-why-prelude]');
  var layout = section.querySelector('[data-why-layout]');
  var beats = Array.prototype.slice.call(section.querySelectorAll('[data-why-beat]'));
  var media = Array.prototype.slice.call(section.querySelectorAll('[data-why-media]'));
  var jumps = Array.prototype.slice.call(section.querySelectorAll('[data-why-jump]'));
  var stage = section.querySelector('[data-why-stage]');
  if (!pin || !question || !layout || beats.length !== 4) return;

  var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var ease = function (x) { x = clamp(x); return x * x * (3 - 2 * x); };
  var mix = function (a, b, t) { return a + (b - a) * t; };
  var P = { dockFrom: 0.12, dockTo: 0.19, layoutFrom: 0.19, layoutTo: 0.22, beatsFrom: 0.22 };

  var mode = 'static';
  var raf = 0, active = -1, near = false, inView = false, poses = null;
  var videos = media.map(function (m) { return m.querySelector('video'); });

  /* sources: attached when the section is within one viewport */
  function loadVideo(v) {
    if (!v || (IVE.openingIsPinned && IVE.openingIsPinned())) return;
    v.preload = 'auto';
    if (v.getAttribute('src')) return;
    var srcs = { src: v.getAttribute('data-src'), small: v.getAttribute('data-src-small') };
    var pick = IVE.pickSource ? IVE.pickSource((IVE.mediaWidth ? IVE.mediaWidth(v) : v.offsetWidth), srcs) : (srcs.small || srcs.src);
    if (!pick) return;
    v.preload = 'auto';
    v.src = pick;
  }
  videos.forEach(function (v) {
    if (!v) return;
    v.addEventListener('loadeddata', function () { v.classList.add('is-ready'); });
    v.addEventListener('playing', function () { v.classList.add('is-ready'); });
  });

  videos.forEach(function (v, i) {
    if (!v || !IVE.registerInline) return;
    IVE.registerInline({
      video: v, element: media[i],
      wantsPlay: function () {
        return mode !== 'static' && i === active && inView && !layout.inert && !motion.matches &&
          !(IVE.openingIsPinned && IVE.openingIsPinned());
      },
      play: function () {
        loadVideo(v);
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      }
    });
  });

  function loadNearbyVideos() {
    if (!near || motion.matches) return;
    videos.forEach(function (v, i) { if (v && (i === 0 || mode !== 'static')) loadVideo(v); });
  }
  document.addEventListener('ive:openingchange', function () {
    if (IVE.openingIsPinned && IVE.openingIsPinned()) {
      videos.forEach(function (v) { if (v) { v.pause(); v.preload = 'none'; } });
    } else loadNearbyVideos();
    syncVideos();
  });

  function syncVideos() {
    if (IVE.syncInline) IVE.syncInline();
  }

  function setActive(i) {
    if (i === active) return;
    active = i;
    beats.forEach(function (b, k) { b.classList.toggle('is-active', k === i); });
    media.forEach(function (m, k) { m.classList.toggle('is-active', k === i); });
    jumps.forEach(function (j, k) {
      if (k === i) j.setAttribute('aria-current', 'true');
      else j.removeAttribute('aria-current');
    });
    syncVideos();
  }

  /* ── pinned: measure the docked heading, then position the words by hand ── */
  function measurePinned() {
    section.classList.add('is-measuring');
    words.forEach(function (w) { w.style.removeProperty('font-size'); w.style.removeProperty('left'); w.style.removeProperty('top'); });
    question.style.removeProperty('width');
    question.style.removeProperty('height');
    var pinBox = pin.getBoundingClientRect();
    var qBox = question.getBoundingClientRect();
    var fs = parseFloat(getComputedStyle(question).fontSize) || 40;
    var lefts = words.map(function (w) { return w.getBoundingClientRect().left - qBox.left; });
    section.classList.remove('is-measuring');
    question.style.width = qBox.width + 'px';
    question.style.height = qBox.height + 'px';
    var gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 48;
    var availW = pin.clientWidth - 2 * gutter;
    var scale = Math.max(1, Math.min(availW / qBox.width, (pin.clientHeight * 0.36) / qBox.height));
    var bigW = qBox.width * scale, bigH = qBox.height * scale;
    var groupLeft = (pin.clientWidth - bigW) / 2;
    var groupTop = (pin.clientHeight - bigH) / 2 + 24;
    var qLeft = qBox.left - pinBox.left, qTop = qBox.top - pinBox.top;
    poses = {
      fs: fs, scale: scale, lefts: lefts,
      bigX: groupLeft - qLeft, bigY: groupTop - qTop
    };
    if (prelude) prelude.style.top = Math.max(0, groupTop - 56) + 'px';
  }

  function renderPinned() {
    var box = section.getBoundingClientRect();
    var travel = Math.max(1, section.offsetHeight - pin.offsetHeight);
    var progress = clamp(-box.top / travel);
    inView = box.bottom > 0 && box.top < window.innerHeight;
    if (poses) {
      var d = ease((progress - P.dockFrom) / (P.dockTo - P.dockFrom));
      var f = mix(poses.scale, 1, d);
      words.forEach(function (w, i) {
        w.style.fontSize = (poses.fs * f).toFixed(2) + 'px';
        w.style.left = (mix(poses.bigX + poses.lefts[i] * poses.scale, poses.lefts[i], d)).toFixed(2) + 'px';
        w.style.top = (mix(poses.bigY, 0, d)).toFixed(2) + 'px';
      });
    }
    if (prelude) prelude.style.opacity = (1 - ease((progress - P.dockFrom) / 0.05)).toFixed(3);
    var la = ease((progress - P.layoutFrom) / (P.layoutTo - P.layoutFrom));
    layout.style.opacity = la.toFixed(3);
    layout.style.transform = la < 1 ? 'translateY(' + ((1 - la) * 12).toFixed(2) + 'px)' : 'none';
    layout.inert = la < 0.5;
    var t = clamp((progress - P.beatsFrom) / (1 - P.beatsFrom)) * 4;
    setActive(Math.min(3, Math.floor(t)));
    jumps.forEach(function (j, i) { j.style.setProperty('--fill', clamp(t - i).toFixed(3)); });
  }

  /* ── flow (<720px): the beat under the sticky panel is the active one ── */
  function renderFlow() {
    var box = section.getBoundingClientRect();
    inView = box.bottom > 0 && box.top < window.innerHeight;
    var line = stage ? stage.getBoundingClientRect().bottom + 24 : window.innerHeight * 0.5;
    var current = 0;
    beats.forEach(function (b, i) { if (b.getBoundingClientRect().top <= line) current = i; });
    setActive(current);
  }

  function render() {
    raf = 0;
    if (mode === 'pinned') renderPinned();
    else if (mode === 'flow') renderFlow();
    else {
      var box = section.getBoundingClientRect();
      inView = box.bottom > 0 && box.top < window.innerHeight;
    }
    syncVideos();
  }
  function schedule() {
    if (!raf && mode !== 'static') raf = window.requestAnimationFrame(render);
  }

  function clearInline() {
    words.forEach(function (w) { w.style.removeProperty('font-size'); w.style.removeProperty('left'); w.style.removeProperty('top'); });
    question.style.removeProperty('width');
    question.style.removeProperty('height');
    layout.style.removeProperty('opacity');
    layout.style.removeProperty('transform');
    layout.inert = false;
    if (prelude) { prelude.style.removeProperty('opacity'); prelude.style.removeProperty('top'); }
    jumps.forEach(function (j) { j.style.removeProperty('--fill'); });
  }

  function syncMode() {
    var next = motion.matches ? 'static' : wide.matches ? (tall.matches ? 'pinned' : 'static') : 'flow';
    if (next !== mode) {
      mode = next;
      section.classList.toggle('is-pinned', mode === 'pinned');
      section.classList.toggle('is-flow', mode === 'flow');
      clearInline();
      active = -1;
      if (mode === 'static') {
        beats.forEach(function (b) { b.classList.remove('is-active'); });
        media.forEach(function (m) { m.classList.remove('is-active'); });
        jumps.forEach(function (j) { j.removeAttribute('aria-current'); });
      }
    }
    if (mode === 'pinned') measurePinned();
    if (mode !== 'static') render();
    else syncVideos();
  }

  jumps.forEach(function (jump, i) {
    jump.addEventListener('click', function () {
      if (mode === 'pinned') {
        var top = section.getBoundingClientRect().top + window.scrollY;
        var travel = section.offsetHeight - pin.offsetHeight;
        var at = P.beatsFrom + (1 - P.beatsFrom) * ((i + 0.08) / 4);
        window.scrollTo({ top: Math.round(top + travel * at), behavior: 'auto' });
      } else if (mode === 'flow') {
        var stageH = stage ? stage.getBoundingClientRect().height : 0;
        var headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 56;
        var y = beats[i].getBoundingClientRect().top + window.scrollY - headerH - stageH + 1;
        window.scrollTo({ top: Math.round(y), behavior: 'auto' });
      }
      schedule();
    });
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        near = e.isIntersecting;
        loadNearbyVideos();
      });
    }, { rootMargin: '100% 0px' }).observe(section);
  }

  window.addEventListener('scroll', schedule, { passive: true });
  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(syncMode, 120);
  });
  document.addEventListener('visibilitychange', function () { syncVideos(); });
  [motion, wide, tall].forEach(function (q) {
    if (q.addEventListener) q.addEventListener('change', syncMode);
    else if (q.addListener) q.addListener(syncMode);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncMode);
  window.addEventListener('load', syncMode);
  syncMode();
})();

/* ── Inside IVE: a reel of four recorded chapters ─────────────────
   At least half of the player in view: the current chapter loads and plays;
   timeupdate drives the rail underline (--p); on ended the next chapter
   follows, after the fourth the first. A click switches at once and keeps the
   auto-advance. Off-screen or a hidden tab: pause, resume where it was.
   Reduced motion: posters, a centred play button, no autoplay, no advance.
   A chapter whose clip fails to load leaves the rail. */
(function () {
  'use strict';
  var section = document.querySelector('[data-inside]');
  if (!section) return;
  var IVE = window.IVE || {};
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var narrow = window.matchMedia('(max-width: 719.98px)');
  var player = section.querySelector('[data-player]');
  var video = player ? player.querySelector('video') : null;
  var buttons = Array.prototype.slice.call(section.querySelectorAll('[data-chapter]'));
  if (!player || !video || !buttons.length) return;
  var mediaBox = player.querySelector('.frame-media');
  var posterImg = player.querySelector('[data-player-poster]');
  var toggle = player.querySelector('[data-player-toggle]');
  var playBtn = player.querySelector('[data-player-play]');
  var expand = player.querySelector('[data-player-expand]');
  var captions = Array.prototype.slice.call(section.querySelectorAll('[data-chapter-caption]'));
  var isGerman = (document.documentElement.getAttribute('lang') || '').indexOf('de') === 0;
  var TEXT = isGerman
    ? { pause: 'Aufnahme anhalten', play: 'Aufnahme abspielen' }
    : { pause: 'Pause the recording', play: 'Play the recording' };

  var chapters = buttons.map(function (btn) {
    var data = {};
    try { data = JSON.parse(btn.getAttribute('data-chapter-clip') || '{}'); } catch (e) { data = {}; }
    return {
      btn: btn,
      li: btn.closest('li'),
      n: btn.getAttribute('data-chapter'),
      data: data,
      missing: !data.src && !data.small,
      time: 0
    };
  });
  chapters.forEach(function (c) { if (c.missing && c.li) c.li.hidden = true; });

  var current = -1, loadedSrc = '', inView = false, userPaused = false, userStarted = false, switching = false;
  section.classList.add('is-live');

  function available(from, step) {
    for (var k = 1; k <= chapters.length; k++) {
      var i = (from + step * k + chapters.length * 2) % chapters.length;
      if (!chapters[i].missing) return i;
    }
    return -1;
  }
  function render() {
    var playing = !video.paused && !video.ended;
    player.classList.toggle('is-playing', playing);
    player.classList.toggle('is-paused', !playing);
    player.classList.toggle('needs-play', !playing && (motion.matches || userPaused || player.classList.contains('was-blocked')));
    if (toggle) {
      toggle.setAttribute('aria-label', playing ? TEXT.pause : TEXT.play);
      toggle.setAttribute('title', playing ? TEXT.pause : TEXT.play);
    }
  }
  function sourceFor(c) {
    var w = IVE.mediaWidth ? IVE.mediaWidth(video) : video.offsetWidth;
    var srcs = { src: c.data.src, small: c.data.small, m: c.data.m };
    return IVE.pickSource ? IVE.pickSource(w, srcs) : (srcs.small || srcs.src);
  }
  function posterFor(c) {
    if (narrow.matches && c.data.posterM) return c.data.posterM;
    var w = (mediaBox ? mediaBox.clientWidth : 1200) * (window.devicePixelRatio || 1);
    return (w > 1700 && c.data.poster2x) || c.data.poster || c.data.poster2x || '';
  }
  /* below 1024px the rail is a scroll strip: keep the active chapter inside it
     (also when the reel advances by itself), without moving the page */
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
  function select(i, opts) {
    opts = opts || {};
    if (i < 0) return;
    var c = chapters[i];
    if (current >= 0 && current !== i) chapters[current].time = video.currentTime || 0;
    current = i;
    chapters.forEach(function (o, k) {
      o.btn.setAttribute('aria-pressed', k === i ? 'true' : 'false');
      if (k !== i) o.btn.style.setProperty('--p', '0');
    });
    revealChapter(c);
    captions.forEach(function (cap) { cap.classList.toggle('is-active', cap.getAttribute('data-chapter-caption') === c.n); });
    var poster = posterFor(c);
    if (posterImg && poster && posterImg.getAttribute('src') !== poster) posterImg.setAttribute('src', poster);
    if (posterImg && c.data.alt) posterImg.setAttribute('alt', '');
    video.setAttribute('aria-label', c.data.alt || '');
    if (expand) {
      expand.setAttribute('href', c.data.src || c.data.small || '#');
      expand.setAttribute('data-caption', c.data.caption || c.data.alt || '');
    }
    if (mediaBox) mediaBox.classList.toggle('is-portrait', narrow.matches && !!c.data.m);
    var src = sourceFor(c);
    if (opts.restart) c.time = 0;
    if (src && src !== loadedSrc && (opts.load || inView)) {
      loadedSrc = src;
      switching = true;
      video.classList.remove('is-ready');
      video.preload = 'auto';
      video.src = src;
      if (c.time) {
        var t = c.time;
        video.addEventListener('loadedmetadata', function once() {
          video.removeEventListener('loadedmetadata', once);
          try { video.currentTime = t; } catch (e) {}
        });
      }
    }
    sync();
  }
  function wantsPlay() {
    if (document.hidden || !inView || userPaused) return false;
    if (motion.matches && !userStarted) return false;
    return current >= 0;
  }
  function playVideo() {
    var p = video.play();
    if (p && p.catch) {
      p.catch(function (err) {
        if (err && err.name === 'AbortError') return;
        player.classList.add('was-blocked');
        render();
      });
    }
  }
  if (IVE.registerInline) IVE.registerInline({
    video: video, element: player, wantsPlay: wantsPlay, play: playVideo
  });
  function sync(preferred) {
    if (wantsPlay()) {
      var c = chapters[current];
      var src = sourceFor(c);
      if (src && src !== loadedSrc) { select(current, { load: true }); return; }
    }
    if (IVE.syncInline) IVE.syncInline(preferred === true ? video : null);
    render();
  }

  // the poster stays until the chapter plays (a clip loaded ahead shows its poster, not frame 1)
  video.addEventListener('loadeddata', function () { switching = false; });
  video.addEventListener('playing', function () { video.classList.add('is-ready'); player.classList.remove('was-blocked'); render(); });
  video.addEventListener('play', render);
  video.addEventListener('pause', render);
  video.addEventListener('timeupdate', function () {
    if (current < 0 || !video.duration) return;
    chapters[current].btn.style.setProperty('--p', (video.currentTime / video.duration).toFixed(4));
  });
  video.addEventListener('ended', function () {
    if (current < 0) return;
    chapters[current].time = 0;
    chapters[current].btn.style.setProperty('--p', '1');
    if (motion.matches) { userStarted = false; render(); return; }
    var next = available(current, 1);
    if (next >= 0) select(next, { load: true, restart: true });
  });
  video.addEventListener('error', function () {
    if (current < 0) return;
    var c = chapters[current];
    c.missing = true;
    if (c.li) c.li.hidden = true;
    loadedSrc = '';
    var next = available(current, 1);
    if (next >= 0 && next !== current) select(next, { load: true, restart: true });
  });

  chapters.forEach(function (c, i) {
    c.btn.addEventListener('click', function () {
      if (c.missing) return;
      if (i === current && !video.paused) return;
      userPaused = false;
      select(i, { load: true, restart: true });
      if (IVE.syncInline) IVE.syncInline(video);
    });
  });
  if (toggle) {
    toggle.addEventListener('click', function () {
      if (video.paused) { userPaused = false; userStarted = true; sync(true); }
      else { userPaused = true; video.pause(); sync(); }
    });
  }
  if (playBtn) {
    playBtn.hidden = false;
    playBtn.addEventListener('click', function () {
      userPaused = false;
      userStarted = true;
      player.classList.remove('was-blocked');
      sync(true);
    });
  }
  if (expand) {
    expand.addEventListener('click', function (e) {
      if (current < 0 || !IVE.openViewer) return;
      var c = chapters[current];
      var opened = IVE.openViewer({
        src: c.data.src, small: c.data.small, poster: c.data.poster,
        caption: c.data.caption || c.data.alt || ''
      }, expand);
      if (opened) e.preventDefault();
    });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        inView = e.isIntersecting && e.intersectionRatio >= 0.5;
        sync();
      });
    }, { threshold: [0, 0.5, 1] }).observe(player);
    new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; }) && !motion.matches && current >= 0) {
        var src = sourceFor(chapters[current]);
        if (src && src !== loadedSrc) {
          loadedSrc = src;
          video.preload = 'auto';
          video.src = src;
        }
      }
    }, { rootMargin: '100% 0px' }).observe(player);
  } else {
    inView = true;
  }
  document.addEventListener('visibilitychange', sync);
  var onMotion = function () { userStarted = false; sync(); };
  if (motion.addEventListener) motion.addEventListener('change', onMotion);
  else if (motion.addListener) motion.addListener(onMotion);
  var onNarrow = function () { if (current >= 0) select(current, { load: inView }); };
  if (narrow.addEventListener) narrow.addEventListener('change', onNarrow);
  else if (narrow.addListener) narrow.addListener(onNarrow);

  select(available(-1, 1), { load: false });
})();
