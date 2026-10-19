/* IVE.DEV — the actual app: view tabs, the recorded demos, and the full-size viewer. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── demos: recordings of the real app, one plays at a time ── */
  var demos = Array.prototype.slice.call(document.querySelectorAll('[data-demo]')).map(function (figure) {
    var video = figure.querySelector('video');
    var toggle = figure.querySelector('[data-demo-toggle]');
    var bar = figure.querySelector('.demo-bar i');
    var cover = figure.querySelector('[data-demo-cover]');
    var demo = { figure: figure, video: video, inView: false, userPaused: reduceMotion, loaded: false };
    // With reduced motion nothing starts on its own; the cover offers a play button.
    if (reduceMotion) figure.classList.add('needs-click');

    function source() {
      // 3200×2000 for sharp screens, 1600×1000 where that is all the element can show.
      var needed = figure.clientWidth * (window.devicePixelRatio || 1);
      return needed > 1700 ? video.getAttribute('data-src') : (video.getAttribute('data-src-small') || video.getAttribute('data-src'));
    }
    demo.play = function () {
      if (!demo.loaded) { video.src = source(); demo.loaded = true; }
      var p = video.play();
      if (p && p.catch) p.catch(function () { figure.classList.add('needs-click'); });
    };
    demo.pause = function () { video.pause(); };
    demo.sync = function () {
      var panel = figure.closest('.tour-panel');
      var visible = demo.inView && !(panel && panel.hidden);
      if (visible && !demo.userPaused) demo.play(); else demo.pause();
    };
    function render() {
      var playing = !video.paused && !video.ended;
      figure.classList.toggle('is-playing', playing);
      if (playing) figure.classList.remove('needs-click');
      if (toggle) {
        toggle.setAttribute('aria-pressed', playing ? 'true' : 'false');
        toggle.setAttribute('aria-label', playing ? 'Pause demo' : 'Play demo');
        toggle.title = playing ? 'Pause' : 'Play';
      }
    }
    video.addEventListener('play', render);
    video.addEventListener('pause', render);
    video.addEventListener('timeupdate', function () {
      if (bar && video.duration) bar.style.width = (video.currentTime / video.duration * 100) + '%';
    });
    if (toggle) toggle.addEventListener('click', function () {
      demo.userPaused = !video.paused;
      if (demo.userPaused) demo.pause(); else demo.play();
    });
    if (cover) cover.addEventListener('click', function () { demo.userPaused = false; demo.play(); });
    render();
    return demo;
  });

  if ('IntersectionObserver' in window) {
    var watcher = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        demos.forEach(function (demo) { if (demo.figure === entry.target) { demo.inView = entry.isIntersecting; demo.sync(); } });
      });
    }, { threshold: 0.3 });
    demos.forEach(function (demo) { watcher.observe(demo.figure); });
  } else {
    demos.forEach(function (demo) { demo.inView = true; demo.sync(); });
  }
  document.addEventListener('visibilitychange', function () {
    demos.forEach(function (demo) { if (document.hidden) demo.pause(); else demo.sync(); });
  });

  /* ── tour tabs: arrow keys, Home and End ─────────────────── */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-tab]'));

  function selectTab(name, moveFocus) {
    var target = null;
    tabs.forEach(function (tab) { if (tab.getAttribute('data-tab') === name) target = tab; });
    if (!target) return;
    tabs.forEach(function (tab) {
      var on = tab === target;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !on;
    });
    demos.forEach(function (demo) {
      var panel = demo.figure.closest('.tour-panel');
      if (panel && !panel.hidden && demo.video.currentTime > 0) demo.video.currentTime = 0;
      demo.sync();
    });
    if (moveFocus) target.focus();
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { selectTab(tab.getAttribute('data-tab'), false); });
    tab.addEventListener('keydown', function (event) {
      var next = null;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      event.preventDefault();
      selectTab(tabs[next].getAttribute('data-tab'), true);
    });
  });

  document.querySelectorAll('[data-tour-link]').forEach(function (link) {
    link.addEventListener('click', function () { selectTab(link.getAttribute('data-tour-link'), false); });
  });

  /* ── full-size viewer; plain links without JS ────────────── */
  var dialog = document.querySelector('.shot-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  var image = dialog.querySelector('img');
  var player = dialog.querySelector('video');
  var caption = dialog.querySelector('#shot-caption');
  var wrap = dialog.querySelector('.shot-dialog-wrap');
  var opener = null;
  var pausedForDialog = [];

  function open(link) {
    opener = link;
    var videoSrc = link.getAttribute('data-zoom-video');
    caption.textContent = link.getAttribute('data-caption');
    dialog.classList.toggle('is-video', !!videoSrc);
    if (videoSrc && player) {
      image.removeAttribute('src');
      player.src = videoSrc;
      player.poster = link.getAttribute('data-zoom-poster') || '';
      pausedForDialog = demos.filter(function (demo) { return !demo.video.paused; });
      pausedForDialog.forEach(function (demo) { demo.pause(); });
    } else {
      if (player) { player.pause(); player.removeAttribute('src'); player.load(); }
      image.src = link.getAttribute('data-zoom');
      image.alt = link.getAttribute('data-caption');
    }
    dialog.showModal();
    document.documentElement.classList.add('shot-open');
    wrap.scrollTo(0, 0);
    if (videoSrc && player && !reduceMotion) { var p = player.play(); if (p && p.catch) p.catch(function () {}); }
  }

  document.querySelectorAll('[data-zoom], [data-zoom-video]').forEach(function (link) {
    link.addEventListener('click', function (event) { event.preventDefault(); open(link); });
  });

  dialog.querySelector('.shot-dialog-close').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (event) {
    if (event.target !== dialog) return;
    var r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  dialog.addEventListener('close', function () {
    document.documentElement.classList.remove('shot-open');
    if (player) { player.pause(); player.removeAttribute('src'); player.load(); }
    pausedForDialog.forEach(function (demo) { demo.sync(); });
    pausedForDialog = [];
    if (opener) opener.focus({ preventScroll: true });
  });
})();
