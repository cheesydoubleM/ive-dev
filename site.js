/* IVE.DEV · site.js — shared behaviour for every page. Vanilla JS, no dependencies.
   Theme (6.1), header scrolled state and phone menu (2.2), download logic (6.2),
   copy buttons (6.3), recorded clips and the full-size viewer (6.4).
   Exposes window.IVE for home.js (pickSource, openViewer, pauseAll, reduceMotion).
   Usage: design/partials/USAGE.md. */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.remove('no-js');
  var IVE = window.IVE = window.IVE || {};
  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var narrowQuery = window.matchMedia('(max-width: 719.98px)');
  var isGerman = (root.getAttribute('lang') || '').toLowerCase().indexOf('de') === 0;
  var SVG_NS = 'http://www.w3.org/2000/svg';

  IVE.reduceMotion = function () { return motionQuery.matches; };
  IVE.isNarrow = function () { return narrowQuery.matches; };
  IVE.motionQuery = motionQuery;
  IVE.narrowQuery = narrowQuery;

  function forEach(list, fn) { Array.prototype.forEach.call(list, fn); }
  function onChange(query, fn) {
    if (query.addEventListener) query.addEventListener('change', fn);
    else if (query.addListener) query.addListener(fn);
  }
  function icon(paths, cls) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'icon' + (cls ? ' ' + cls : ''));
    paths.forEach(function (d) {
      var p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', d);
      svg.appendChild(p);
    });
    return svg;
  }
  IVE.icon = icon;

  /* ── theme (6.1): dark unless the visitor chose light; only `ive-theme` is stored ── */
  var THEME_COLOR = { dark: '#0E1014', light: '#F6F7F8' };
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var themeToggles = document.querySelectorAll('[data-theme-toggle]');

  function storedTheme() {
    try {
      var t = localStorage.getItem('ive-theme');
      if (t === 'light' || t === 'dark') return t;
    } catch (e) {}
    return null;
  }
  function currentTheme() { return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }
  function applyTheme(theme, persist) {
    root.setAttribute('data-theme', theme);
    if (themeMeta) themeMeta.setAttribute('content', THEME_COLOR[theme]);
    var toLight = theme === 'dark';
    var label = isGerman
      ? (toLight ? 'Zum hellen Design wechseln' : 'Zum dunklen Design wechseln')
      : (toLight ? 'Switch to light theme' : 'Switch to dark theme');
    forEach(themeToggles, function (t) { t.setAttribute('aria-label', label); });
    if (persist) {
      try { localStorage.setItem('ive-theme', theme); } catch (e) {}
    }
    var ev;
    try { ev = new CustomEvent('ive:theme', { detail: { theme: theme } }); } catch (e) { ev = null; }
    if (ev) document.dispatchEvent(ev);
  }
  applyTheme(storedTheme() || currentTheme(), false);
  forEach(themeToggles, function (t) {
    t.addEventListener('click', function () {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
    });
  });
  window.addEventListener('storage', function (e) {
    if (e.key === 'ive-theme' && (e.newValue === 'light' || e.newValue === 'dark')) applyTheme(e.newValue, false);
  });

  /* ── header: scrolled state, current page, phone menu (2.2) ── */
  var header = document.querySelector('[data-header]');
  if (header) {
    var onScrollHeader = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScrollHeader, { passive: true });
    onScrollHeader();

    // Safety net: mark the current page when the markup does not.
    var navLinks = header.querySelectorAll('.nav-link');
    if (!header.querySelector('.nav-link[aria-current]')) {
      var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
      forEach(navLinks, function (a) {
        var target = (a.getAttribute('href') || '').split('#')[0].toLowerCase();
        if (target && target === here) a.setAttribute('aria-current', 'page');
      });
    }

    var menuBtn = header.querySelector('[data-menu-toggle]');
    var menu = menuBtn ? document.getElementById(menuBtn.getAttribute('aria-controls')) : null;
    if (menuBtn && menu) {
      var setMenu = function (open, returnFocus) {
        header.classList.toggle('is-open', open);
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!open && returnFocus) menuBtn.focus();
      };
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.addEventListener('click', function () {
        setMenu(!header.classList.contains('is-open'), false);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && header.classList.contains('is-open')) setMenu(false, true);
      });
      document.addEventListener('click', function (e) {
        if (header.classList.contains('is-open') && !header.contains(e.target)) setMenu(false, false);
      });
      forEach(menu.querySelectorAll('a'), function (a) {
        a.addEventListener('click', function () { setMenu(false, false); });
      });
      onChange(narrowQuery, function (e) { if (!e.matches) setMenu(false, false); });
    }
  }

  /* ── download (6.2): the Mac app on Apple silicon, the terminal install elsewhere ── */
  /* Every [data-mac-download] starts as the DMG link "Download for Mac" (works without JS).
     Not macOS, a touch device (iPads report Mac), or an Intel Mac in Chromium
     (userAgentData architecture x86): the button becomes "Install IVE" and points
     to #install on the homepage, #terminal on the download page and
     download.html#terminal elsewhere. Safari and
     Firefox on Intel Macs keep the link and the Apple silicon note. */
  var macButtons = document.querySelectorAll('[data-mac-download]');
  if (macButtons.length) {
    // the homepage scrolls to #install, the download page to its own #terminal
    // (also under the extensionless /download URL), every other page links there
    var installTarget = document.getElementById('install') ? '#install'
      : document.getElementById('terminal') ? '#terminal' : 'download.html#terminal';
    var converted = false;
    var toInstall = function () {
      if (converted) return;
      converted = true;
      root.classList.add('is-install-path');
      forEach(macButtons, function (b) {
        b.setAttribute('href', b.getAttribute('data-install-href') || installTarget);
        b.removeAttribute('download');
        var label = (narrowQuery.matches && b.getAttribute('data-install-label-narrow')) ||
          b.getAttribute('data-install-label') || 'Install IVE';
        var slot = b.querySelector('[data-mac-download-label]');
        if (slot) slot.textContent = label;
        else if (!b.children.length) b.textContent = label;
        forEach(b.querySelectorAll('[data-mac-download-icon]'), function (i) { i.parentNode.removeChild(i); });
        b.setAttribute('data-mac-download', 'install');
      });
      forEach(document.querySelectorAll('[data-mac-download-note]'), function (n) { n.hidden = true; });
    };
    var uaData = navigator.userAgentData;
    var platform = (uaData && uaData.platform) || navigator.platform || '';
    if (!/mac/i.test(platform) || navigator.maxTouchPoints > 1) {
      toInstall();
    } else if (uaData && uaData.getHighEntropyValues) {
      uaData.getHighEntropyValues(['architecture']).then(function (values) {
        if (values && values.architecture === 'x86') toInstall();
      }).catch(function () {});
    }
  }

  /* ── copy buttons (6.3): shipped hidden, each box announces in its own status ── */
  var COPY_TEXT = isGerman
    ? { copied: 'Kopiert', selected: 'Markiert', failed: 'Fehler', sayCopied: 'Kopiert.', saySelected: 'Befehl markiert. Mit der Tastatur kopieren.', sayFailed: 'Kopieren fehlgeschlagen.' }
    : { copied: 'Copied', selected: 'Selected', failed: 'Copy failed', sayCopied: 'Copied', saySelected: 'Command selected. Copy it with your keyboard.', sayFailed: 'Copy failed.' };
  forEach(document.querySelectorAll('[data-copy]'), function (btn) {
    var box = btn.closest('[data-copy-box]');
    var source = box ? box.querySelector('[data-copy-source]') : null;
    var status = box ? box.querySelector('[data-copy-status]') : null;
    if (box && !status) {
      status = document.createElement('span');
      status.className = 'sr-only';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.setAttribute('data-copy-status', '');
      box.appendChild(status);
    }
    var labelEl = btn.querySelector('[data-copy-label]');
    var initial = labelEl ? labelEl.textContent : btn.textContent;
    var timer = 0;
    function setLabel(text) {
      if (labelEl) labelEl.textContent = text;
      else btn.textContent = text;
    }
    function show(text, ok, announce) {
      setLabel(text);
      btn.classList.toggle('is-copied', ok);
      if (status) status.textContent = announce;
      clearTimeout(timer);
      timer = setTimeout(function () {
        btn.classList.remove('is-copied');
        setLabel(initial);
        if (status) status.textContent = '';
      }, 2200);
    }
    function fail() {
      var selected = false;
      if (source && window.getSelection && document.createRange) {
        var range = document.createRange();
        range.selectNodeContents(source);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        selected = true;
      }
      show(selected ? COPY_TEXT.selected : COPY_TEXT.failed, false, selected ? COPY_TEXT.saySelected : COPY_TEXT.sayFailed);
    }
    btn.hidden = false;
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          show(COPY_TEXT.copied, true, COPY_TEXT.sayCopied);
        }, fail);
      } else {
        fail();
      }
    });
  });

  /* ── inline sources: phone crop below 720px, 1600px otherwise; masters stay in the viewer ── */
  function pickSource(width, srcs) {
    if (narrowQuery.matches && srcs.m) return srcs.m;
    return srcs.small || srcs.src;
  }
  IVE.pickSource = pickSource;
  function mediaWidth(el) {
    var w = el.getBoundingClientRect().width;
    return w || el.offsetWidth || (el.parentNode && el.parentNode.clientWidth) || 0;
  }
  IVE.mediaWidth = mediaWidth;

  /* data-crop="cx cy cw" on any media element: set the crop variables via CSSOM (CSP-safe) */
  forEach(document.querySelectorAll('[data-crop]'), function (el) {
    var v = el.getAttribute('data-crop').split(/[\s,]+/).map(Number);
    if (v.length < 3 || v.some(isNaN)) return;
    el.classList.add('crop');
    el.style.setProperty('--cx', String(v[0]));
    el.style.setProperty('--cy', String(v[1]));
    el.style.setProperty('--cw', String(v[2]));
  });

  /* every playing page video, so the viewer and a hidden tab can pause them */
  function pauseAll(except) {
    var paused = [];
    forEach(document.querySelectorAll('video'), function (v) {
      if (v === except || v.paused || v.ended) return;
      if (v.closest && v.closest('.viewer')) return;
      v.pause();
      paused.push(v);
    });
    return paused;
  }
  IVE.pauseAll = pauseAll;


  /* Shared playback ownership: generic clips, Why and Inside choose one visible
     recording together. A visitor's play choice wins until it leaves view. */
  var inlinePlayers = [], activeInline = null, preferredInline = null;
  function visibleRatio(el) {
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return 0;
    var w = Math.max(0, Math.min(r.right, window.innerWidth) - Math.max(r.left, 0));
    var h = Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0));
    return w * h / (r.width * r.height);
  }
  function viewerIsOpen() { return !!(viewer && viewer.dialog.open); }
  function syncInline(preferred) {
    if (preferred) preferredInline = preferred;
    var best = null, bestRatio = 0, preferredEligible = false;
    if (!document.hidden && !viewerIsOpen()) {
      inlinePlayers.forEach(function (c) {
        if (!c.wantsPlay()) return;
        var ratio = visibleRatio(c.element || c.video);
        if (!ratio) return;
        if (c.video === preferredInline) preferredEligible = true;
        if (!best || c.video === preferredInline ||
            (best.video !== preferredInline && (ratio > bestRatio + 0.01 ||
              (Math.abs(ratio - bestRatio) <= 0.01 && c === activeInline)))) {
          best = c;
          bestRatio = ratio;
        }
      });
      if (!preferredEligible) preferredInline = null;
    }
    activeInline = best;
    inlinePlayers.forEach(function (c) {
      if (c !== best && !c.video.paused) c.video.pause();
    });
    if (best && best.video.paused) {
      pauseAll(best.video);
      best.play();
    }
    return !!best;
  }
  IVE.registerInline = function (control) { inlinePlayers.push(control); };
  IVE.syncInline = syncInline;
  IVE.viewerIsOpen = viewerIsOpen;
  // A queued play event or an independent page player must not start behind
  // the modal or in a hidden tab. The full-size viewer owns playback there.
  document.addEventListener('play', function (e) {
    var v = e.target;
    if (v.tagName !== 'VIDEO' || v.closest('.viewer')) return;
    if (document.hidden || viewerIsOpen()) { v.pause(); return; }
    var registered = inlinePlayers.some(function (c) { return c.video === v; });
    if (registered && (!activeInline || activeInline.video !== v)) { v.pause(); return; }
    pauseAll(v);
  }, true);

  /* ── recorded clips: [data-clip] frames (6.4) ── */
  var clips = [];
  var TEXT = isGerman
    ? { pause: 'Aufnahme anhalten', play: 'Aufnahme abspielen' }
    : { pause: 'Pause the recording', play: 'Play the recording' };

  function Clip(frame) {
    var video = frame.querySelector('video');
    if (!video) return null;
    var clip = {
      frame: frame, video: video,
      ratio: 0, near: false, loaded: false,
      userPaused: false, userStarted: false, blocked: false
    };
    var toggle = frame.querySelector('[data-clip-toggle]');
    var playBtn = frame.querySelector('[data-clip-play]');
    var media = frame.querySelector('.frame-media');

    clip.load = function () {
      if (clip.loaded) return;
      var srcs = {
        src: video.getAttribute('data-src'),
        small: video.getAttribute('data-src-small'),
        m: video.getAttribute('data-src-m')
      };
      var src = pickSource(mediaWidth(video), srcs);
      if (!src) return;
      clip.loaded = true;
      if (media && src === srcs.m) media.classList.add('is-portrait');
      video.preload = 'auto';
      video.src = src;
    };
    clip.wantsPlay = function () {
      if (document.hidden || clip.userPaused) return false;
      if (motionQuery.matches && !clip.userStarted) return false;
      return clip.ratio >= 0.5 || (clip.userStarted && clip.ratio > 0);
    };
    clip.play = function () {
      clip.load();
      var p = video.play();
      if (p && p.catch) {
        p.catch(function (err) {
          if (err && err.name === 'AbortError') return;
          clip.blocked = true;
          frame.classList.add('needs-play');
        });
      }
    };
    clip.pause = function () { if (!video.paused) video.pause(); };
    function render() {
      var playing = !video.paused && !video.ended;
      frame.classList.toggle('is-playing', playing);
      frame.classList.toggle('is-paused', !playing);
      if (playing) {
        clip.blocked = false;
        frame.classList.remove('needs-play');
      } else if (motionQuery.matches || clip.blocked) {
        frame.classList.add('needs-play');
      }
      if (toggle) {
        toggle.setAttribute('aria-label', playing ? TEXT.pause : TEXT.play);
        toggle.setAttribute('title', playing ? TEXT.pause : TEXT.play);
      }
    }
    clip.render = render;
    // the video covers its poster once it plays: a clip that is loaded ahead but not
    // playing keeps showing its chosen poster instead of its first frame
    video.addEventListener('playing', function () { video.classList.add('is-ready'); });
    video.addEventListener('play', render);
    video.addEventListener('pause', render);
    video.addEventListener('ended', render);
    if (toggle) {
      toggle.addEventListener('click', function () {
        if (video.paused) {
          clip.userPaused = false;
          clip.userStarted = true;
          frame.classList.remove('is-paused-by-user');
          syncInline(video);
        } else {
          clip.userPaused = true;
          frame.classList.add('is-paused-by-user');
          clip.pause();
          syncInline();
        }
      });
    }
    if (playBtn) {
      playBtn.hidden = false;
      playBtn.addEventListener('click', function () {
        clip.userPaused = false;
        clip.userStarted = true;
        syncInline(video);
      });
    }
    IVE.registerInline({ video: video, element: frame, wantsPlay: clip.wantsPlay, play: clip.play });
    render();
    return clip;
  }

  function syncClips() {
    syncInline();
  }
  IVE.syncClips = syncClips;

  forEach(document.querySelectorAll('[data-clip]'), function (frame) {
    var c = Clip(frame);
    if (c) clips.push(c);
  });
  if (clips.length) {
    if ('IntersectionObserver' in window) {
      var nearIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          clips.forEach(function (c) { if (c.frame === e.target && !motionQuery.matches) c.load(); });
        });
      }, { rootMargin: '100% 0px' });
      var viewIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          clips.forEach(function (c) { if (c.frame === e.target) c.ratio = e.isIntersecting ? e.intersectionRatio : 0; });
        });
        syncClips();
      }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
      clips.forEach(function (c) { nearIO.observe(c.frame); viewIO.observe(c.frame); });
    } else {
      clips.forEach(function (c) { c.ratio = 1; });
      syncClips();
    }
    onChange(motionQuery, function () {
      clips.forEach(function (c) { c.userStarted = false; c.render(); });
      syncClips();
    });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      pauseAll(null);
      if (viewer && viewer.dialog.open) viewer.video.pause();
    }
    syncInline();
  });

  /* ── the full-size viewer: one <dialog>, built on first use ── */
  var viewer = null;
  var viewerOpener = null;
  var viewerPaused = [];
  function buildViewer() {
    var d = document.createElement('dialog');
    d.className = 'viewer ink-dark';
    d.setAttribute('aria-labelledby', 'viewer-caption');
    var bar = document.createElement('div');
    bar.className = 'viewer-bar';
    var cap = document.createElement('p');
    cap.className = 'viewer-caption';
    cap.id = 'viewer-caption';
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'icon-btn viewer-close';
    close.setAttribute('aria-label', isGerman ? 'Schließen' : 'Close');
    close.appendChild(icon(['M4 4l8 8', 'M12 4l-8 8']));
    bar.appendChild(cap);
    bar.appendChild(close);
    var body = document.createElement('div');
    body.className = 'viewer-body';
    var video = document.createElement('video');
    video.controls = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    var img = document.createElement('img');
    img.alt = '';
    body.appendChild(video);
    body.appendChild(img);
    d.appendChild(bar);
    d.appendChild(body);
    document.body.appendChild(d);
    close.addEventListener('click', function () { d.close(); });
    d.addEventListener('click', function (e) {
      if (e.target === d || e.target === body) d.close();
    });
    d.addEventListener('close', function () {
      root.classList.remove('viewer-open');
      video.pause();
      video.removeAttribute('src');
      video.load();
      img.removeAttribute('src');
      // Re-evaluate today's visible controller, not the videos that happened to
      // be playing when the modal opened (the page may have moved meanwhile).
      var resumed = syncInline();
      if (!resumed && !document.hidden) viewerPaused.some(function (v) {
        if (inlinePlayers.some(function (c) { return c.video === v; }) || visibleRatio(v) < 0.5) return false;
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
        return true;
      });
      viewerPaused = [];
      if (viewerOpener && viewerOpener.focus) viewerOpener.focus({ preventScroll: true });
    });
    viewer = { dialog: d, caption: cap, video: video, img: img };
    return viewer;
  }

  /* opts: { src, small, poster, image, caption }  → opens the master clip (or a still) full size */
  function openViewer(opts, opener) {
    var v = viewer || buildViewer();
    if (typeof v.dialog.showModal !== 'function') return false;
    viewerOpener = opener || document.activeElement;
    v.caption.textContent = opts.caption || '';
    viewerPaused = pauseAll(null);
    if (opts.src || opts.small) {
      var wide = window.innerWidth * (window.devicePixelRatio || 1) > 1700;
      v.img.hidden = true;
      v.video.hidden = false;
      v.video.poster = opts.poster || '';
      v.video.src = (wide && opts.src) ? opts.src : (opts.small || opts.src);
      v.video.setAttribute('aria-label', opts.caption || '');
    } else {
      v.video.hidden = true;
      v.img.hidden = false;
      v.img.src = opts.image || opts.poster || '';
      v.img.alt = opts.caption || '';
    }
    v.dialog.showModal();
    root.classList.add('viewer-open');
    if (opts.src || opts.small) {
      var p = v.video.play();
      if (p && p.catch) p.catch(function () {});
    }
    return true;
  }
  IVE.openViewer = openViewer;

  // [data-clip-expand] links: the plain href to the mp4 works without JS
  forEach(document.querySelectorAll('[data-clip-expand]'), function (link) {
    link.addEventListener('click', function (e) {
      var frame = link.closest('[data-clip]');
      var video = frame ? frame.querySelector('video') : null;
      var opts = {
        src: link.getAttribute('data-viewer-src') || (video && video.getAttribute('data-src')) || link.getAttribute('href'),
        small: link.getAttribute('data-viewer-src-small') || (video && video.getAttribute('data-src-small')),
        poster: link.getAttribute('data-viewer-poster'),
        caption: link.getAttribute('data-caption') || (video && video.getAttribute('aria-label')) || ''
      };
      if (openViewer(opts, link)) e.preventDefault();
    });
  });
})();
