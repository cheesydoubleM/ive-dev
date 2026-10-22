/* Behind all this: the AIFOREU logo reveal follows the scroll in both
   directions. Nothing plays on its own; only scroll and resize move it.
   Reduced motion, no JavaScript and short windows keep the poster. */
(function () {
  'use strict';
  var section = document.querySelector('[data-madeby]');
  if (!section) return;
  var video = section.querySelector('[data-madeby-video]');
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var room = window.matchMedia('(min-height: 560px)');
  var small = window.matchMedia('(max-width: 760px)');
  // The film ends on the finished logo; hold it for the last part of the pin.
  var PLAY_UNTIL = 0.82;
  var live = false, loaded = false, frame = 0, wanted = 0;

  function progress() {
    var rect = section.getBoundingClientRect();
    var travel = rect.height - window.innerHeight;
    if (travel <= 0) return 1;
    return Math.min(1, Math.max(0, -rect.top / travel));
  }

  function seek() {
    frame = 0;
    if (!live || !video.duration) return;
    wanted = Math.min(1, progress() / PLAY_UNTIL) * (video.duration - 0.04);
    // Let a running seek finish; 'seeked' picks up the latest position.
    if (!video.seeking && Math.abs(video.currentTime - wanted) > 0.015) video.currentTime = wanted;
  }

  function request() {
    if (!frame) frame = window.requestAnimationFrame(seek);
  }

  function load() {
    if (loaded) return;
    loaded = true;
    video.removeAttribute('poster');
    video.src = small.matches ? video.getAttribute('data-src-small') : video.getAttribute('data-src-large');
    video.preload = 'auto';
    video.load();
    // Safari paints frames for currentTime only after the first play().
    var started = video.play();
    if (started && started.then) started.then(function () { video.pause(); request(); }, function () {});
  }

  function setMode() {
    var shouldLive = !motion.matches && room.matches;
    if (shouldLive === live) return;
    live = shouldLive;
    section.classList.toggle('is-static', !live);
    if (live) request();
    else if (loaded && video.duration) video.currentTime = video.duration - 0.04;
  }

  if (!video) return;
  video.addEventListener('loadedmetadata', request);
  video.addEventListener('seeked', function () {
    if (live && Math.abs(video.currentTime - wanted) > 0.015) request();
  });
  setMode();
  if (motion.addEventListener) {
    motion.addEventListener('change', setMode);
    room.addEventListener('change', setMode);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && live) load();
      });
    }, { rootMargin: '150% 0px' }).observe(section);
  } else {
    load();
  }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
})();
