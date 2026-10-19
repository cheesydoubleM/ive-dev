/* Travel from an app step through the feedback, retry and review planes.
   Every frame follows the scroll. No autoplay, timer or live-result claim. */
(function () {
  'use strict';
  var section = document.querySelector('[data-behind]');
  if (!section) return;
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var room = window.matchMedia('(min-width: 761px) and (min-height: 820px), (min-width: 360px) and (max-width: 760px) and (min-height: 820px)');
  var front = section.querySelector('.behind-front');
  var board = section.querySelector('.behind-board');
  var stage = section.querySelector('.behind-stage');
  var failedLine = section.querySelector('.behind-failed');
  var layers = Array.from(section.querySelectorAll('.behind-layer'));
  var frames = Array.from(section.querySelectorAll('.behind-corridor > i'));
  var corridor = section.querySelector('.behind-corridor');
  var night = section.querySelector('.behind-night');
  var caption = section.querySelector('[data-behind-caption]');
  var buttons = Array.from(section.querySelectorAll('[data-behind-step]'));
  var packet = section.querySelector('.behind-packet');
  var flow = section.querySelector('.behind-flow');
  var path = section.querySelector('.behind-loop path');
  var retryPacket = section.querySelector('[data-retry-packet]');
  var retryNodes = Array.from(section.querySelectorAll('[data-retry-node]'));
  var retryState = section.querySelector('[data-retry-state]');
  var retryResult = section.querySelector('[data-retry-result]');
  var points = [0, .22, .46, .70, .94];
  var captions = [
    'Start with the whole workspace. Follow Sign-in checks into its failed test.',
    'This is Sign-in checks, one of the four sessions. Follow its red test line.',
    'The failed check supplies context for the next attempt.',
    'Fix the change. Run the checks again. Stop at the retry limit.',
    'Passing checks give you evidence. You still review the change.'
  ];
  var frame = 0, previous = -1, top = 0, distance = 1, flowWidth = 1;
  var cameras = [];
  var pathLength = path.getTotalLength();
  function clamp(n) { return Math.max(0, Math.min(1, n)); }
  function ease(n) { n = clamp(n); return n * n * (3 - 2 * n); }
  function plane(el, opacity, transform) {
    el.style.opacity = String(opacity);
    el.style.transform = transform;
    el.style.visibility = opacity < .005 ? 'hidden' : 'visible';
  }
  function render() {
    frame = 0;
    var live = section.classList.contains('is-live');
    var p = live ? clamp((window.scrollY - top) / distance) : 1;
    var darkness = live ? ease((p - .28) / .10) : 0;
    night.style.opacity = String(darkness);
    section.classList.toggle('has-depth', live && p > .34);
    corridor.style.opacity = String(darkness * .8);
    // The same board and the same tile stay on screen throughout the zoom.
    // Hold the focused session before entering its failed line.
    var focus = ease((p - .035) / .145);
    var enter = ease((p - .25) / .12);
    var start = cameras[0], target = cameras[1], deep = cameras[2];
    function mix(a, b, t) { return a + (b - a) * t; }
    var scale = mix(mix(start.scale, target.scale, focus), deep.scale, enter);
    var cx = mix(mix(start.x, target.x, focus), deep.x, enter);
    var cy = mix(mix(start.y, target.y, focus), deep.y, enter);
    plane(board, live ? 1 - ease((p - .32) / .075) : 1, live ? 'translate(' + (stage.clientWidth / 2 - cx * scale) + 'px,' + (stage.clientHeight / 2 - cy * scale) + 'px) scale(' + scale + ')' : '');
    front.classList.toggle('is-focused', live && p > .04 && p < .34);
    layers.forEach(function (layer, index) {
      var starts = [.38, .56, .80];
      var ends = [.56, .80, 2];
      var opacity = live ? ease((p - starts[index]) / .075) * (1 - ease((p - (ends[index] - .035)) / .075)) : 1;
      var z = live ? (p - points[index + 2]) * 1500 : 0;
      plane(layer, opacity, live ? 'translateZ(' + z + 'px)' : '');
    });
    frames.forEach(function (ring, index) {
      var z = -1600 + index * 260 + p * 1650;
      ring.style.transform = 'translateZ(' + z + 'px)';
      ring.style.opacity = String(clamp((z + 1700) / 700) * (1 - clamp((z - 300) / 300)));
    });
    packet.style.transform = 'translateX(' + (clamp((p - .42) / .13) * flowWidth) + 'px)';
    var retry = live ? clamp((p - .61) / .17) : 1;
    var position = path.getPointAtLength(retry * pathLength);
    retryPacket.setAttribute('transform', 'translate(' + position.x + ' ' + position.y + ')');
    var active = retry < .3 ? 0 : retry < .72 ? 1 : 2;
    retryNodes.forEach(function (node, index) {
      node.classList.toggle('is-active', index === active);
      node.classList.toggle('is-failed', index === 0 && active === 0);
      node.classList.toggle('is-passed', index === 2 && active === 2);
    });
    retryState.textContent = ['Verification failed', 'Fixing the sign-out check', 'Verification passed'][active];
    retryResult.textContent = ['13 passed · 1 failed', 'Failure context → auth.js', '14 passed'][active];
    var step = p < .12 ? 0 : p < .415 ? 1 : p < .60 ? 2 : p < .835 ? 3 : 4;
    if (step === previous) return;
    previous = step;
    section.dataset.step = String(step);
    caption.textContent = live ? captions[step] : captions[0];
    buttons.forEach(function (button, index) {
      if (index === step) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(render); }
  function measure() {
    section.classList.toggle('is-live', !motion.matches && room.matches);
    top = section.getBoundingClientRect().top + window.scrollY - 76;
    distance = Math.max(1, section.offsetHeight - (window.innerHeight - 76));
    flowWidth = Math.max(1, flow.clientWidth - 5);
    board.style.transform = '';
    var boardBox = board.getBoundingClientRect();
    var frontBox = front.getBoundingClientRect();
    var lineBox = failedLine.getBoundingClientRect();
    var tileScale = Math.min((stage.clientWidth - 16) / frontBox.width, (stage.clientHeight - 16) / frontBox.height);
    cameras = [
      {x: boardBox.width / 2, y: boardBox.height / 2, scale: Math.min((stage.clientWidth - 4) / boardBox.width, (stage.clientHeight - 4) / boardBox.height)},
      {x: frontBox.left - boardBox.left + frontBox.width / 2, y: frontBox.top - boardBox.top + frontBox.height / 2, scale: tileScale},
      {x: lineBox.left - boardBox.left + lineBox.width / 2, y: lineBox.top - boardBox.top + lineBox.height / 2, scale: tileScale * 3.8}
    ];
    previous = -1;
    schedule();
  }
  buttons.forEach(function (button, index) {
    button.addEventListener('click', function () {
      window.scrollTo({ top: top + distance * points[index], behavior: 'instant' });
      schedule();
    });
  });
  window.addEventListener('scroll', function () {
    if (section.classList.contains('is-live') && window.scrollY >= top - innerHeight && window.scrollY <= top + distance + innerHeight) schedule();
  }, { passive: true });
  window.addEventListener('resize', measure);
  motion.addEventListener('change', measure);
  room.addEventListener('change', measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
  if (document.fonts) document.fonts.ready.then(measure);
  measure();
})();
