/* IVE.DEV · try.js — the "Try it yourself" page: the IVE app built into the site at window size,
   like a freshly started IVE, with the quiet introduction. The theme follows the visitor's site
   theme (localStorage ive-theme); ?at=board|terminal|… opens the app elsewhere than Home;
   ?tour=0 skips the introduction. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.remove('no-js');
  var theme = 'light';
  try { var t = localStorage.getItem('ive-theme'); if (t === 'dark' || t === 'light') theme = t; } catch (e) {}
  root.setAttribute('data-theme', theme);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0E1014' : '#FFFFFF');
  var q = new URLSearchParams(location.search);
  var at = (q.get('at') || 'home').replace(/[^a-z0-9-]/g, '') || 'home';
  var tour = q.get('tour') === '0' ? '0' : '1';
  var stage = document.querySelector('[data-try-stage]');
  if (!stage) return;
  var frame = document.createElement('iframe');
  frame.className = 'try-frame';
  frame.title = 'IVE';
  frame.setAttribute('tabindex', '0');
  frame.src = 'assets/demo/r6/frame.html?scene=' + encodeURIComponent(at) + '&mode=app&tour=' + tour + '&chip=parent&minScale=1&theme=' + theme;
  stage.appendChild(frame);
  frame.addEventListener('load', function () { try { frame.focus(); } catch (e) {} });

  /* the introduction's controls live in the strip, never over the app */
  var guide = document.querySelector('[data-try-guide]');
  var text = guide ? guide.querySelector('[data-try-guide-text]') : null;
  var skip = guide ? guide.querySelector('[data-try-skip]') : null;
  var again = guide ? guide.querySelector('[data-try-again]') : null;
  function send(action) { try { frame.contentWindow.postMessage({ target: 'ive-demo', type: 'tour', action: action }, location.origin); } catch (e) {} }
  if (skip) skip.addEventListener('click', function () { send('skip'); });
  if (again) again.addEventListener('click', function () { send('replay'); });
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data || e.data.source !== 'ive-demo' || e.data.type !== 'tour' || !guide) return;
    var t = e.data;
    guide.hidden = !t.started;
    if (!t.started) return;
    if (!t.on) { text.textContent = ''; skip.hidden = true; again.hidden = false; again.textContent = 'Show me around'; }
    else if (t.finished) { text.textContent = 'Done'; skip.hidden = true; again.hidden = false; again.textContent = 'Again'; }
    else { text.textContent = t.step + ' / ' + t.total; skip.hidden = false; again.hidden = true; }
  });
})();
