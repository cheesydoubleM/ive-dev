/* Made by AIFOREU: the AIFOREU logo film plays once when it comes into view.
   It asks for sound first; browsers allow that only after the visitor has
   clicked or typed on the page, otherwise it plays muted with "Sound on".
   Reduced motion starts nothing on its own; the button plays the film.
   Loading: preload="none" in the markup; the source is attached only when the
   film panel is within one viewport, and the 1600 file only where the panel
   needs it (panel width × DPR above 980), otherwise the 960 file. */
(function () {
  'use strict';
  var section = document.querySelector('[data-madeby]');
  if (!section) return;
  var video = section.querySelector('[data-madeby-video]');
  var soundBtn = section.querySelector('[data-madeby-sound]');
  var replayBtn = section.querySelector('[data-madeby-replay]');
  if (!video || !soundBtn || !replayBtn) return;
  var panel = video.parentNode;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var loaded = false, started = false, pausedByScroll = false;
  var POSTER = video.getAttribute('poster');

  function load() {
    if (loaded) return;
    loaded = true;
    var need = (panel.clientWidth || video.clientWidth || 440) * (window.devicePixelRatio || 1);
    video.src = need > 980 ? video.getAttribute('data-src-large') : video.getAttribute('data-src-small');
    video.preload = 'auto';
    video.load();
  }

  function render() {
    // After the end only "Replay" is left; it always plays with sound.
    soundBtn.hidden = video.ended;
    replayBtn.hidden = !video.ended;
    replayBtn.textContent = video.muted ? 'Replay with sound' : 'Replay';
    if (!started) {
      soundBtn.textContent = 'Play with sound';
      soundBtn.setAttribute('aria-pressed', 'false');
    } else {
      soundBtn.textContent = video.muted ? 'Sound on' : 'Sound off';
      soundBtn.setAttribute('aria-pressed', video.muted ? 'false' : 'true');
    }
  }

  function play(fromStart, withSound) {
    load();
    started = true;
    pausedByScroll = false;
    if (fromStart) video.currentTime = 0;
    video.muted = !withSound;
    var attempt = video.play();
    if (attempt && attempt.catch) {
      attempt.catch(function () {
        // No sound without an earlier click or key press: play muted instead.
        if (!withSound) { render(); return; }
        video.muted = true;
        var muted = video.play();
        if (muted && muted.catch) {
          muted.catch(function () {
            // Autoplay is off altogether (for example in a power saving mode).
            started = false;
            video.poster = POSTER;
            render();
          });
        }
        render();
      });
    }
    render();
  }

  soundBtn.addEventListener('click', function () {
    if (!started || video.muted) play(true, true);
    else { video.muted = true; render(); }
  });
  replayBtn.addEventListener('click', function () { play(true, true); });
  ['play', 'pause', 'ended', 'volumechange'].forEach(function (name) { video.addEventListener(name, render); });

  // The poster shows the finished logo; when the film starts on its own it
  // would jump back to the empty first frame, so drop it for autoplay.
  if (!reduceMotion) video.removeAttribute('poster');
  render();

  if (!('IntersectionObserver' in window)) return;
  new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        if (!started && !reduceMotion && !document.hidden) play(true, true);
        else if (pausedByScroll && video.paused && !video.ended) { pausedByScroll = false; video.play().catch(function () {}); }
      } else if (started && !video.paused && !video.ended) {
        pausedByScroll = true;
        video.pause();
      }
    });
  }, { threshold: 0.6 }).observe(video);
  // Attach the file once the panel is within one viewport.
  new IntersectionObserver(function (entries) {
    if (entries.some(function (entry) { return entry.isIntersecting; }) && !reduceMotion) load();
  }, { rootMargin: '100% 0px' }).observe(panel);
})();
