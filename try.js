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
  var sid = (q.get('sid') || '').replace(/[^a-z0-9-]/g, '');
  var stage = document.querySelector('[data-try-stage]');
  if (!stage) return;
  var frame = document.createElement('iframe');
  frame.className = 'try-frame';
  frame.title = 'IVE';
  frame.setAttribute('tabindex', '0');
  frame.src = 'assets/demo/r9/frame.html?scene=' + encodeURIComponent(at) + (sid ? '&sid=' + encodeURIComponent(sid) : '') + '&mode=app&tour=' + tour + '&chip=parent&minScale=1&theme=' + theme;
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
    if (e.origin !== location.origin || !e.data || e.data.source !== 'ive-demo') return;
    if (e.data.type === 'theme' && (e.data.theme === 'dark' || e.data.theme === 'light')) {
      root.setAttribute('data-theme', e.data.theme);
      if (meta) meta.setAttribute('content', e.data.theme === 'dark' ? '#0E1014' : '#FFFFFF');
      try { localStorage.setItem('ive-theme', e.data.theme); } catch (err) {}
      return;
    }
    if (e.data.type !== 'tour' || !guide) return;
    var t = e.data;
    guide.hidden = !t.started;
    if (!t.started) return;
    var say = !t.on ? '' : t.finished ? 'Done' : t.step + ' / ' + t.total;
    if (text.textContent !== say) text.textContent = say; // a live region: set only when it changes
    if (!t.on) { skip.hidden = true; again.hidden = false; again.textContent = 'Show me around'; }
    else if (t.finished) { skip.hidden = true; again.hidden = false; again.textContent = 'Again'; }
    else { skip.hidden = false; again.hidden = true; }
  });
})();
