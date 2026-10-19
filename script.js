/* IVE.DEV — behavior. Vanilla JS, no dependencies.
   Motion grammar: Branch → Execute → Report → Merge. */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  /* ── theme ───────────────────────────────────────────── */
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var themeToggles = document.querySelectorAll('[data-theme-toggle]');
  var isGerman = document.documentElement.lang === 'de';

  function readTheme() {
    try {
      var storedTheme = localStorage.getItem('ive-theme');
      if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;
    } catch (e) {}
    return 'light';
  }

  function applyTheme(theme, persist) {
    var isDark = theme === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeToggles.forEach(function (toggle) {
      toggle.textContent = isDark ? 'Dark' : 'Light';
      toggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      toggle.setAttribute('aria-label', isGerman
        ? (isDark ? 'Zum hellen Farbschema wechseln' : 'Zum dunklen Farbschema wechseln')
        : (isDark ? 'Switch to light theme' : 'Switch to dark theme'));
    });
    if (themeMeta) {
      themeMeta.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
    }
    if (persist) {
      try { localStorage.setItem('ive-theme', isDark ? 'dark' : 'light'); } catch (e) {}
    }
  }

  applyTheme(readTheme(), false);
  themeToggles.forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
    });
  });

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduceMotion = motionQuery.matches;

  /* ── nav ─────────────────────────────────────────────── */
  var nav = document.querySelector('.nav');
  var onScrollNav = function () {
    nav.classList.toggle('scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ── reveal figures ──────────────────────────────────── */
  var figures = document.querySelectorAll('.mc, .delegate, .ralph, .term-bleed, .models, .localbox, .memflow, .coord, .board, .pipe, .brief-card, .collab, .stats-row, .run-demo');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          revealIO.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    figures.forEach(function (f) {
      f.classList.add('reveal-fig');
      revealIO.observe(f);
    });
  }

  /* ── signature scroll story ──────────────────────────── */
  var story = document.querySelector('.story');
  var stage = document.querySelector('.story-stage');
  var railItems = document.querySelectorAll('.story-rail li');
  var captions = document.querySelectorAll('.story-caption');
  var STEPS = 7;
  var currentStep = 0;
  var storyScroll = null;
  var storySecs = document.querySelectorAll('[data-story-secs]');
  var storyClockTimer = null;

  var setStep = function (step) {
    if (step === currentStep) return;
    currentStep = step;
    stage.setAttribute('data-step', String(step));
    for (var i = 2; i <= STEPS; i++) {
      stage.classList.toggle('s' + i, step >= i);
    }
    railItems.forEach(function (li, idx) {
      li.classList.toggle('on', idx + 1 === step);
      li.classList.toggle('past', idx + 1 < step);
    });
    captions.forEach(function (c) {
      c.classList.toggle('on', c.getAttribute('data-caption') === String(step));
    });
    if (step >= 4 && step < 7) startStoryClock(); else stopStoryClock();
    if (step < 4) resetStoryClock();
  };

  /* story board: the "Assistant is responding… Ns" counters tick while the sessions work (steps 4–6) */
  function startStoryClock() {
    if (storyClockTimer || !storySecs.length || reduceMotion) return;
    storyClockTimer = setInterval(function () {
      storySecs.forEach(function (el) { el.textContent = String((parseInt(el.textContent, 10) || 0) + 1); });
    }, 1000);
  }
  function stopStoryClock() {
    if (storyClockTimer) { clearInterval(storyClockTimer); storyClockTimer = null; }
  }
  function resetStoryClock() {
    storySecs.forEach(function (el) { el.textContent = el.getAttribute('data-story-secs'); });
  }

  var clearStorySteps = function () {
    if (!stage) return;
    currentStep = 0;
    stage.removeAttribute('data-step');
    for (var i = 2; i <= STEPS; i++) stage.classList.remove('s' + i);
    railItems.forEach(function (li) {
      li.classList.remove('on');
      li.classList.remove('past');
    });
    captions.forEach(function (c) { c.classList.remove('on'); });
  };

  var setStaticStory = function () {
    if (!stage) return;
    if (story) story.classList.remove('story-scroll');
    stage.classList.add('story-static');
    clearStorySteps();
    stopStoryClock();
    resetStoryClock();
  };

  if (story && stage && !reduceMotion && window.matchMedia('(min-width: 661px)').matches) {
    story.classList.add('story-scroll');
    stage.classList.remove('story-static');
    resetStoryClock();
    storyScroll = function () {
      var rect = story.getBoundingClientRect();
      var total = story.offsetHeight - window.innerHeight;
      if (total <= 0) { setStep(STEPS); return; }
      var progress = Math.min(1, Math.max(0, -rect.top / total));
      var step = Math.min(STEPS, Math.floor(progress * (STEPS + 0.35)) + 1);
      setStep(step);
    };
    window.addEventListener('scroll', storyScroll, { passive: true });
    storyScroll();
  } else {
    setStaticStory();
  }

  /* ── ambient engine: only run while visible ──────────── */
  var ambientStops = [];
  function ambient(el, fn, ms) {
    if (reduceMotion || !el || !('IntersectionObserver' in window)) return;
    var timer = null;
    var stopped = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!stopped && !reduceMotion && e.isIntersecting && !timer) {
          timer = setInterval(fn, ms);
        } else if (!e.isIntersecting && timer) {
          clearInterval(timer); timer = null;
        }
      });
    }, { threshold: 0.2 });
    io.observe(el);
    ambientStops.push(function () {
      stopped = true;
      io.disconnect();
      if (timer) { clearInterval(timer); timer = null; }
    });
  }

  function stopAmbientIntervals() {
    ambientStops.forEach(function (stop) { stop(); });
    ambientStops = [];
    stopStoryClock();
  }

  /* ── hero ambient: step lines advance, the first tile finishes ── */
  var heroStage = document.querySelector('.hero-stage');
  var termA = document.querySelector('[data-term="a"]');
  var termB = document.querySelector('[data-term="b"]');
  var heroTileA = document.querySelector('[data-hero-tile="a"]');
  var heroSideRowA = document.querySelector('[data-side-row="a"]');
  var agentsRunning = document.querySelector('[data-agents-running]');

  /* Step lines as the app shows them: a spinner while a step runs, a check once it is done. */
  var A_LINES = [
    [['spin', 'Add session rotation to auth.js']],
    [['done', 'Add session rotation to auth.js'], ['spin', 'Invalidate old sessions on sign-out']],
    [['done', 'Add session rotation to auth.js'], ['done', 'Invalidate old sessions on sign-out'], ['spin', 'Run the auth tests']]
  ];
  var B_LINES = [
    [['spin', 'Keep the session after a refresh']],
    [['done', 'Keep the session after a refresh'], ['spin', 'Add the error states to SignIn.jsx']],
    [['done', 'Keep the session after a refresh'], ['done', 'Add the error states to SignIn.jsx'], ['spin', 'Check the redirect after expiry']]
  ];
  var A_PERIOD = 7; /* three step states, then the tile sits at Done for a while */
  var heroTick = 0;
  var heroADone = false;
  var renderTermLines = function (term, lines) {
    if (!term) return;
    var html = '';
    for (var i = 0; i < lines.length; i++) {
      var done = lines[i][0] === 'done';
      html += '<span class="au-step"><span class="' + (done ? 'au-check' : 'au-spin') + '"></span>'
        + '<span class="sr-only">' + (done ? 'done: ' : 'in progress: ') + '</span>' + lines[i][1] + '</span>';
    }
    term.innerHTML = html;
  };
  /* The first tile finishes the way a session does in the app: pill, status line,
     chat body, composer and the sidebar row all switch to Done. */
  var setTileDone = function (done) {
    if (!heroTileA) return;
    var pill = heroTileA.querySelector('[data-tile-pill]');
    var status = heroTileA.querySelector('[data-tile-status]');
    var state = heroTileA.querySelector('[data-tile-state]');
    var preview = heroTileA.querySelector('[data-tile-preview]');
    var text = heroTileA.querySelector('[data-composer-text]');
    var secs = heroTileA.querySelector('[data-secs]');
    if (pill) { pill.textContent = done ? 'Done' : 'Running'; pill.className = 'au-pill ' + (done ? 'is-done' : 'is-running'); }
    if (status) status.classList.toggle('is-done', done);
    if (state) state.textContent = done ? 'Reply ready' : 'Working on your request';
    if (preview) preview.textContent = preview.getAttribute(done ? 'data-preview-done' : 'data-preview-run');
    if (text) text.textContent = text.getAttribute(done ? 'data-text-done' : 'data-text-run');
    if (secs && !done) secs.textContent = '2';
    heroTileA.querySelectorAll('[data-tile-running]').forEach(function (el) { el.hidden = done; });
    heroTileA.querySelectorAll('[data-tile-done]').forEach(function (el) { el.hidden = !done; });
    if (heroSideRowA) {
      var dot = heroSideRowA.querySelector('[data-side-dot]');
      var meta = heroSideRowA.querySelector('[data-side-meta]');
      if (dot) dot.className = 'au-dot ' + (done ? 'is-done' : 'is-running');
      if (meta) meta.textContent = done ? 'Done' : 'Running';
    }
    if (agentsRunning) agentsRunning.textContent = done ? '1' : '2';
    heroADone = done;
  };
  ambient(heroStage, function () {
    heroTick++;
    var a = heroTick % A_PERIOD;
    if (a < A_LINES.length) {
      if (heroADone) setTileDone(false);
      renderTermLines(termA, A_LINES[a]);
    } else if (!heroADone) {
      setTileDone(true);
    }
    if (heroTick % 2 === 0) renderTermLines(termB, B_LINES[(heroTick / 2) % B_LINES.length]);
  }, 3400);
  /* "Assistant is responding… 12s" counts up like the app's timer. */
  ambient(heroStage, function () {
    heroStage.querySelectorAll('[data-secs]').forEach(function (c) {
      if (c.closest('[hidden]')) return;
      c.textContent = String((parseInt(c.textContent, 10) || 0) + 1);
    });
  }, 1000);

  /* ── what you bring: the terminal drawer replays npm test, the model menu picks Opus ── */
  var roTermWin = document.querySelector('[data-ro-terminal]');
  var roTerm = roTermWin ? roTermWin.querySelector('[data-ro-term]') : null;
  var roStep = roTermWin ? roTermWin.querySelector('[data-ro-step]') : null;
  /* npm test as vitest prints it, in the bursts a real run shows */
  var RO_BURSTS = [
    ['<span class="au-prompt">❯</span> npm test'],
    ['', '<span class="au-dim">&gt; orbit@0.4.2 test</span>', '<span class="au-dim">&gt; vitest run</span>', ''],
    ['<span class="au-dim"> RUN  v2.1.8 /Projects/orbit</span>', ''],
    [' <span class="au-ok">✓</span> test/auth.test.js <span class="au-dim">(6 tests) 212ms</span>'],
    [' <span class="au-ok">✓</span> test/session.test.js <span class="au-dim">(8 tests) 341ms</span>'],
    ['', ' <span class="au-dim">Test Files</span>  <span class="au-ok">2 passed</span> (2)', '      <span class="au-dim">Tests</span>  <span class="au-ok">14 passed</span> (14)', '   <span class="au-dim">Duration</span>  1.92s', '']
  ];
  var RO_PROMPT = '<span class="au-prompt">❯</span> <span class="au-caret"></span>';
  var RO_CYCLE = RO_BURSTS.length + 2 + 5; /* empty prompt, the bursts, the prompt back, then a hold */
  var roTick = -1;
  var setRoStep = function (done) {
    if (!roStep) return;
    roStep.innerHTML = '<span class="' + (done ? 'au-check' : 'au-spin') + '"></span><span class="sr-only">'
      + (done ? 'done: ' : 'in progress: ') + '</span>Run the auth tests';
  };
  ambient(roTermWin, function () {
    roTick = (roTick + 1) % RO_CYCLE;
    var n = Math.min(roTick, RO_BURSTS.length);
    var finished = roTick > RO_BURSTS.length;
    var lines = [];
    for (var i = 0; i < n; i++) lines = lines.concat(RO_BURSTS[i]);
    if (finished) lines.push(RO_PROMPT);
    if (roTerm) roTerm.innerHTML = roTick === 0 ? RO_PROMPT : lines.join('\n');
    setRoStep(finished);
    var roSecs = roTermWin.querySelector('[data-ro-secs]');
    if (roSecs && roTick === 0) roSecs.textContent = '2';
  }, 800);
  ambient(roTermWin, function () {
    var c = roTermWin.querySelector('[data-ro-secs]');
    if (c) c.textContent = String((parseInt(c.textContent, 10) || 0) + 1);
  }, 1000);

  var roModels = document.querySelector('[data-ro-models]');
  /* the menu as the app shows it: Sonnet is set, Opus gets hovered, then picked */
  var RO_MENU = [['sonnet', ''], ['sonnet', ''], ['sonnet', 'opus'], ['opus', 'opus'], ['opus', 'opus'], ['opus', ''], ['opus', ''], ['opus', '']];
  var roMenuTick = -1;
  ambient(roModels, function () {
    roMenuTick = (roMenuTick + 1) % RO_MENU.length;
    var selected = RO_MENU[roMenuTick][0];
    var hovered = RO_MENU[roMenuTick][1];
    var roModelId = roModels.querySelector('[data-ro-model]');
    if (roModelId) roModelId.textContent = selected;
    roModels.querySelectorAll('[data-ro-item]').forEach(function (item) {
      var m = item.getAttribute('data-ro-item');
      item.classList.toggle('is-selected', m === selected);
      item.classList.toggle('is-hover', m === hovered);
    });
  }, 1100);

  /* ── pillars · overview: the board's statuses tick like the app's ── */
  var mc = document.querySelector('[data-mc]');
  var MC_FLOW = [
    { tile: 'b', seq: [
      { kind: 'running', pill: 'Running', state: 'Working on your request', meta: 'Running', preview: 'Keeping the user signed in after a refresh; the error states come next.' },
      { kind: 'running', pill: 'Running', state: 'Working on your request', meta: 'Running', preview: 'Adding the error states for a wrong password and an expired session.' },
      { kind: 'done', pill: 'Done', state: 'Reply ready', meta: 'Done', preview: 'SignIn.jsx keeps the session after a refresh and shows both error states. npm test passes (14 tests).' }
    ] },
    { tile: 'c', seq: [
      { kind: 'waiting', pill: 'Waiting', state: 'Your answer is needed', meta: 'Needs your reply', preview: 'I’ll run the suite now. It needs your permission for npm test.' },
      { kind: 'running', pill: 'Running', state: 'Working on your request', meta: 'Running', preview: 'Running the sign-in checks.' },
      { kind: 'done', pill: 'Done', state: 'Reply ready', meta: 'Done', preview: 'npm test passes (14 tests). Sign-in works for a fresh sign-in and after a refresh.' }
    ] }
  ];
  var mcTick = 0;
  var mcKinds = { a: 'running', b: 'running', c: 'waiting', d: 'done' };
  var mcApply = function (id, s, idx) {
    var tile = mc.querySelector('[data-mc-tile="' + id + '"]');
    var row = mc.querySelector('[data-mc-row="' + id + '"]');
    if (!tile) return;
    var pill = tile.querySelector('[data-mc-pill]');
    var status = tile.querySelector('[data-mc-status]');
    if (pill) { pill.className = 'au-pill is-' + s.kind; pill.textContent = s.pill; }
    if (status) status.className = 'au-tile-status' + (s.kind === 'running' ? '' : ' is-' + s.kind);
    var state = tile.querySelector('[data-mc-state]');
    var preview = tile.querySelector('[data-mc-preview]');
    if (state) state.textContent = s.state;
    if (preview) preview.textContent = s.preview;
    tile.classList.toggle('is-waiting', s.kind === 'waiting');
    tile.querySelectorAll('[data-mc-when]').forEach(function (el) { el.hidden = el.getAttribute('data-mc-when') !== String(idx); });
    tile.querySelectorAll('[data-mc-run]').forEach(function (el) { el.hidden = s.kind !== 'running'; });
    tile.querySelectorAll('[data-mc-idle]').forEach(function (el) { el.hidden = s.kind === 'running'; });
    if (row) {
      row.classList.toggle('is-waiting', s.kind === 'waiting');
      var dot = row.querySelector('[data-mc-dot]');
      var meta = row.querySelector('[data-mc-meta]');
      if (dot) dot.className = 'au-dot is-' + s.kind;
      if (meta) meta.textContent = s.meta;
    }
    mcKinds[id] = s.kind;
  };
  ambient(mc, function () {
    mcTick++;
    MC_FLOW.forEach(function (f, i) {
      var idx = Math.floor((mcTick + i * 2) / 3) % f.seq.length;
      mcApply(f.tile, f.seq[idx], idx);
    });
    var running = 0, waiting = 0;
    Object.keys(mcKinds).forEach(function (k) {
      if (mcKinds[k] === 'running') running++;
      if (mcKinds[k] === 'waiting') waiting++;
    });
    var mcRunning = mc.querySelector('[data-mc-running]');
    var mcAttention = mc.querySelector('[data-mc-attention]');
    if (mcRunning) mcRunning.textContent = String(running);
    if (mcAttention) mcAttention.hidden = waiting === 0;
  }, 2600);

  /* ── pillars · tasks: the goal is typed on Home, the sessions appear ── */
  var delegateFig = document.querySelector('[data-delegate]');
  if (delegateFig) {
    var dText = delegateFig.querySelector('[data-delegate-text]');
    var dCaret = delegateFig.querySelector('[data-delegate-caret]');
    var dStart = delegateFig.querySelector('[data-delegate-start]');
    var dSection = delegateFig.querySelector('[data-delegate-section]');
    var dRows = delegateFig.querySelectorAll('[data-delegate-row]');
    var dCount = delegateFig.querySelector('[data-delegate-count]');
    var dCountN = delegateFig.querySelector('[data-delegate-n]');
    var dGoal = dText.getAttribute('data-delegate-goal');
    var dHint = dText.getAttribute('data-delegate-placeholder');
    var D_PAUSE = 6, D_ROW_GAP = 5, D_HOLD = 22, D_ROWS = 4;
    var dTotal = dGoal.length + D_PAUSE + D_ROWS * D_ROW_GAP + D_HOLD;
    var dFrame = -1;
    var dRender = function (f) {
      var n = Math.min(f, dGoal.length);
      dText.firstChild.nodeValue = n ? dGoal.slice(0, n) : dHint;
      dText.classList.toggle('is-typed', n > 0);
      dCaret.hidden = f >= dGoal.length + D_PAUSE;
      dStart.classList.toggle('is-ready', n >= dGoal.length);
      var shown = Math.min(D_ROWS, Math.max(0, Math.floor((f - dGoal.length - D_PAUSE) / D_ROW_GAP) + 1));
      if (f < dGoal.length + D_PAUSE) shown = 0;
      dRows.forEach(function (r) { r.hidden = parseInt(r.getAttribute('data-delegate-row'), 10) > shown; });
      dSection.hidden = shown === 0;
      if (dCount) dCount.hidden = shown === 0;
      if (dCountN) dCountN.textContent = String(shown);
    };
    if (!reduceMotion && 'IntersectionObserver' in window) dRender(0);
    ambient(delegateFig, function () {
      dFrame = (dFrame + 1) % dTotal;
      dRender(dFrame);
    }, 120);
  }

  /* ── pillars · retries: one session tile walks fail → retry → pass ── */
  var ralphTrack = document.querySelector('.ralph-track');
  var ralphState = document.querySelector('[data-ralph-state]');
  var R_STATES = [
    [0, 'Running the sign-in checks.'],
    [1, '2 of 14 tests fail: after an expired session the redirect goes to / instead of /sign-in.'],
    [2, 'Fixing the expired-session redirect, then running npm test again.'],
    [3, 'Running npm test again.'],
    [4, 'The redirect after an expired session now goes to /sign-in. npm test passes (14 tests).']
  ];
  var rTick = -1;
  ambient(ralphTrack, function () {
    rTick = (rTick + 1) % (R_STATES.length + 1);
    if (rTick === R_STATES.length) return; /* hold the pass state one beat */
    var s = R_STATES[rTick];
    ralphTrack.setAttribute('data-ralph-stage', String(s[0]));
    if (ralphState) ralphState.textContent = s[1];
  }, 1500);

  /* ── board: cause → effect loop ──────────────────────── */
  var board = document.querySelector('.board');
  var ticketMoving = document.querySelector('[data-ticket]');
  var ticketLive = document.querySelector('[data-ticket-live]');
  var bTick = -1;
  if (ticketLive && reduceMotion) ticketLive.hidden = false;
  ambient(board, function () {
    bTick = (bTick + 1) % 4;
    /* 0: only backlog ghost · 1: appears in ready · 2: agent picks up · 3: hold */
    if (ticketMoving) ticketMoving.style.opacity = bTick >= 1 ? '1' : '0';
    if (ticketLive) ticketLive.hidden = bTick < 2;
  }, 2000);

  /* ── closing run chooser: one goal branches into visible work ── */
  var runDemo = document.querySelector('.run-demo');
  var runChoiceList = document.querySelector('.run-choices');
  var runChoices = Array.prototype.slice.call(document.querySelectorAll('[data-run-choice]'));
  var runGoal = document.querySelector('[data-run-goal]');
  var finalGoal = document.querySelector('[data-final-goal]');
  var runTaskNames = document.querySelectorAll('[data-run-task-name]');
  var runTasks = document.querySelectorAll('[data-run-task]');
  var runTaskStatuses = document.querySelectorAll('[data-run-task-status]');
  var runTaskDots = document.querySelectorAll('[data-run-task-dot]');
  var runStatus = document.querySelector('[data-run-status]');
  var runAttention = document.querySelector('[data-run-attention]');
  var runResult = document.querySelector('[data-run-result]');
  var runProof = document.querySelector('[data-run-proof]');
  var runA11yStatus = document.querySelector('[data-run-a11y-status]');
  var runShouldAnnounceReady = false;
  var runTick = 4;
  var RUN_STEP_SEQUENCE = [0, 1, 2, 3, 4, 4];
  /* The figure is the app's Home screen: the goal in the prompt box, the four
     sessions it became in the sidebar and under "Continue working". Both lists
     carry the same four sessions in the same order (index % 4). All four start
     together and finish in order; `ask` names the session that needs a reply
     at its step (the app's "Needs your reply" / "Waiting"). The words are the
     app's own: sidebar rows say "Needs your reply", Home rows say "Waiting". */
  var RUNS = {
    feature: {
      goal: 'Build a secure passkey sign-in flow.',
      tasks: ['Passkey backend', 'Passkey sign-in screen', 'Passkey checks', 'Review the changes'],
      result: 'One feature. Four focused tasks. One review.',
      proof: 'Separate workspaces · checks before merge'
    },
    queue: {
      goal: 'Work through the approved accessibility queue.',
      tasks: ['Fix the navigation', 'Label the forms', 'Contrast checks', 'Review the release'],
      ask: 3,
      result: 'Queued work keeps moving while decisions stay visible.',
      proof: 'Progress and open decisions in one summary'
    },
    risk: {
      goal: 'Upgrade the authentication package safely.',
      tasks: ['Scan the dependencies', 'Upgrade in isolation', 'Compatibility checks', 'Review the diff'],
      ask: 1,
      result: 'Risk stays separate until you approve the change.',
      proof: 'Worktree isolation · dependency checks · you approve'
    }
  };
  var RUN_WORDS = {
    home: { running: 'Running', waiting: 'Waiting', done: 'Done' },
    side: { running: 'Running', waiting: 'Needs your reply', done: 'Done' }
  };
  var runCurrent = RUNS.feature;

  var runOrientationQuery = window.matchMedia('(min-width: 721px) and (max-width: 1080px)');
  function syncRunOrientation() {
    if (runChoiceList) runChoiceList.setAttribute('aria-orientation', runOrientationQuery.matches ? 'horizontal' : 'vertical');
  }
  syncRunOrientation();
  runOrientationQuery.addEventListener('change', syncRunOrientation);

  function runStateAt(index, step, data) {
    if (step >= data.tasks.length || index < step) return 'done';
    if (data.ask === index && step === index) return 'waiting';
    return 'running';
  }

  function setRunStep(step) {
    if (!runDemo) return;
    var data = runCurrent;
    var count = data.tasks.length;
    var isReady = step >= count;
    var running = 0;
    var waiting = 0;
    runDemo.classList.toggle('is-ready', isReady);
    runTasks.forEach(function (task, index) {
      task.setAttribute('data-run-state', runStateAt(index % count, step, data));
    });
    runTaskDots.forEach(function (dot, index) {
      dot.className = 'au-dot is-' + runStateAt(index % count, step, data);
    });
    runTaskStatuses.forEach(function (status, index) {
      var words = RUN_WORDS[status.getAttribute('data-run-vocab')] || RUN_WORDS.home;
      status.textContent = words[runStateAt(index % count, step, data)];
    });
    for (var i = 0; i < count; i++) {
      var state = runStateAt(i, step, data);
      if (state === 'running') running++;
      if (state === 'waiting') waiting++;
    }
    if (runStatus) {
      runStatus.textContent = running + ' running';
      runStatus.hidden = running === 0;
    }
    if (runAttention) runAttention.hidden = waiting === 0;
    if (isReady && runShouldAnnounceReady && runA11yStatus) {
      runA11yStatus.textContent = 'Ready to review. ' + (runResult ? runResult.textContent : 'The example run is complete.');
      runShouldAnnounceReady = false;
    }
  }

  function selectRun(choice, moveFocus) {
    if (!runDemo || !choice) return;
    var key = choice.getAttribute('data-run-choice');
    var data = RUNS[key];
    if (!data) return;
    runChoices.forEach(function (button) {
      var selected = button === choice;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-selected', selected ? 'true' : 'false');
      button.setAttribute('tabindex', selected ? '0' : '-1');
    });
    runDemo.setAttribute('aria-labelledby', choice.id);
    if (runGoal) runGoal.textContent = data.goal;
    if (finalGoal) finalGoal.textContent = data.goal;
    runCurrent = data;
    runTaskNames.forEach(function (name, index) { name.textContent = data.tasks[index % data.tasks.length]; });
    if (runResult) runResult.textContent = data.result;
    if (runProof) runProof.textContent = data.proof;
    if (runA11yStatus) {
      runA11yStatus.textContent = reduceMotion
        ? 'Example selected: ' + data.goal + ' The completed run is ready to review.'
        : 'Example selected: ' + data.goal + ' Four sessions started.';
    }
    runShouldAnnounceReady = !reduceMotion;
    runDemo.classList.remove('is-changing');
    void runDemo.offsetWidth;
    runDemo.classList.add('is-changing');
    runTick = 0;
    setRunStep(reduceMotion ? 4 : 0);
    if (moveFocus) choice.focus();
  }

  runChoices.forEach(function (choice, index) {
    choice.addEventListener('click', function () { selectRun(choice, false); });
    choice.addEventListener('keydown', function (event) {
      var next = null;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % runChoices.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + runChoices.length) % runChoices.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = runChoices.length - 1;
      if (next === null) return;
      event.preventDefault();
      selectRun(runChoices[next], true);
    });
  });
  if (runDemo) {
    setRunStep(4);
    ambient(runDemo, function () {
      runTick = (runTick + 1) % RUN_STEP_SEQUENCE.length;
      setRunStep(RUN_STEP_SEQUENCE[runTick]);
    }, 1450);
  }

  motionQuery.addEventListener('change', function (event) {
    if (!event.matches) return;
    reduceMotion = true;
    stopAmbientIntervals();
    if (revealIO) revealIO.disconnect();
    figures.forEach(function (f) { f.classList.remove('reveal-fig'); });
    if (storyScroll) {
      window.removeEventListener('scroll', storyScroll);
      storyScroll = null;
    }
    setStaticStory();
    if (ticketLive) ticketLive.hidden = false;
    setRunStep(4);
  });

  /* ── copy install command ────────────────────────────── */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () {
        btn.classList.add('copied');
        btn.textContent = 'Copied ✓';
        setTimeout(function () {
          btn.classList.remove('copied');
          btn.textContent = 'Copy';
        }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else { done(); }
    });
  });

  /* ── mark: inside the machine — agents swarm, come under control, IVE unfolds ── */
  (function () {
    var root = document.documentElement;
    var mark = document.querySelector('[data-mark]');
    if (!mark) return;
    if (reduceMotion || !root.classList.contains('mark-live')) {
      root.classList.remove('mark-live');
      root.classList.remove('mark-dark');
      return;
    }
    var pin = mark.querySelector('[data-mark-pin]');
    var line = mark.querySelector('[data-mark-line]');
    var caps = Array.prototype.slice.call(mark.querySelectorAll('[data-mark-cap]'));
    var rests = Array.prototype.slice.call(mark.querySelectorAll('[data-mark-rest]'));
    var scene = mark.querySelector('[data-scene]');
    var cam = mark.querySelector('[data-scene-cam]');
    var walls = {};
    Array.prototype.forEach.call(mark.querySelectorAll('[data-wall]'), function (w) { walls[w.getAttribute('data-wall')] = w; });
    var ringsBox = mark.querySelector('[data-scene-rings]');
    var swarmBox = mark.querySelector('[data-scene-swarm]');
    var board = mark.querySelector('[data-scene-board]');
    var capA = mark.querySelector('[data-scene-caption="a"]');
    var capB = mark.querySelector('[data-scene-caption="b"]');
    var countA = mark.querySelector('[data-scene-count="a"]');
    var countB = mark.querySelector('[data-scene-count="b"]');
    var hero = document.querySelector('.hero');
    var columnQuery = window.matchMedia('(max-width: 720px)');
    var GAP0 = 0.02, GAP1 = 0.24;      /* em between the words: wordmark-tight → real word gap */
    /* story on the scroll axis */
    var T_CHAOS = 0.30;                 /* agents swarm */
    var T_CTRL = 0.50;                  /* they come under control */
    var T_END = 0.55;                   /* everything has gone dark; the mark is there, the viewer inside a stroke */
    var Z_END = 0.72;                   /* zoomed out of the letters, the mark stands */
    var P_START = 0.76, P_END = 0.92;   /* the name unfolds, then holds */
    var RINGS = 8, GRID = 120;
    /* sessions as the board's tile header names them: title + model id (mono) */
    var AGENTS = [
      ['Sign-in backend', 'sonnet'], ['Sign-in screen', 'sonnet'],
      ['Sign-in checks', 'haiku'], ['Review the changes', 'opus'],
      ['Build the workspace', 'sonnet'], ['Connect the API', 'gemini-pro'],
      ['Check the sign-in flow', 'sonnet'], ['Theme toggle', 'gemini-flash'],
      ['Session list paging', 'haiku'], ['WebSocket reconnect', 'opus'],
      ['Migrate the schema', 'sonnet'], ['Write the changelog', 'haiku']
    ];
    /* per state: the tile header's pill (word + class) and the status line's words, as the app shows them */
    var STATUS = {
      run: { pill: 'Running', cls: 'is-running', state: 'Working on your request' },
      wait: { pill: 'Waiting', cls: 'is-waiting', state: 'Your answer is needed' },
      done: { pill: 'Done', cls: 'is-done', state: 'Reply ready' }
    };
    var m = null;                       /* measurements in em (taken at 100px) */
    var raw = 0, lastRaw = -1;
    var hintReady = false;              /* the scroll hint waits a moment on the black screen */
    var clock = 0, age = 0, lastTs = null, looping = false, frameNo = 0;
    var lastCountA = '', lastCountB = '';

    var ease = function (x) {
      x = x < 0 ? 0 : x > 1 ? 1 : x;
      return x * x * (3 - 2 * x);
    };
    var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
    var rnd = function (i, k) { var x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };

    var rings = [];
    for (var r = 0; r < RINGS; r++) {
      var ring = document.createElement('div');
      ring.className = 'scene-ring';
      ringsBox.appendChild(ring);
      rings.push(ring);
    }
    var agents = AGENTS.map(function (def, i) {
      var el = document.createElement('div');
      el.className = 'scene-agent au au-tile';
      el.innerHTML = '<div class="au-tile-head"><span class="au-title"></span><span class="au-pill"></span><span class="au-model"></span></div><div class="au-tile-status"><span class="au-state"></span></div>';
      el.querySelector('.au-title').textContent = def[0];
      el.querySelector('.au-model').textContent = def[1];
      swarmBox.appendChild(el);
      return {
        el: el, pill: el.querySelector('.au-pill'), status: el.querySelector('.au-tile-status'), word: el.querySelector('.au-state'), st: '',
        x0: (rnd(i, 1) * 2 - 1) * 0.9, y0: (rnd(i, 2) * 2 - 1) * 0.8, z0: rnd(i, 3),
        v: (0.045 + 0.06 * rnd(i, 4)) * (rnd(i, 5) < 0.3 ? -1 : 1),
        ax: 0.12 + 0.3 * rnd(i, 6), ay: 0.08 + 0.22 * rnd(i, 7),
        wx: 0.3 + 0.5 * rnd(i, 8), wy: 0.25 + 0.45 * rnd(i, 9),
        px: rnd(i, 10) * 6.283, py: rnd(i, 11) * 6.283,
        rot: 3 + 7 * rnd(i, 12), flick: 0.6 + 0.8 * rnd(i, 13)
      };
    });

    function setStatus(a, st) {
      if (a.st === st) return;
      a.st = st;
      var d = STATUS[st];
      a.el.setAttribute('data-st', st);
      a.el.classList.toggle('is-waiting', st === 'wait');
      a.pill.textContent = d.pill;
      a.pill.className = 'au-pill ' + d.cls;
      a.status.className = 'au-tile-status' + (st === 'run' ? '' : ' ' + d.cls);
      a.word.textContent = d.state;
    }

    function measure() {
      mark.classList.add('is-measuring');
      var capEm = caps.map(function (c) { return c.getBoundingClientRect().width / 100; });
      var restEm = rests.map(function (r) { return r.getBoundingClientRect().width / 100; });
      var lineEmH = line.getBoundingClientRect().height / 100;
      mark.classList.remove('is-measuring');
      rests.forEach(function (r, i) {
        r.parentNode.style.setProperty('--rest-em', restEm[i].toFixed(4));
      });
      var cs = getComputedStyle(pin);
      var availW = pin.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      availW = Math.min(availW, 1480) * 0.9;
      var availH = pin.clientHeight * 0.56;
      var column = columnQuery.matches;
      var sumCap = capEm.reduce(function (a, b) { return a + b; }, 0);
      var sumRest = restEm.reduce(function (a, b) { return a + b; }, 0);
      /* board slots for the controlled agents: the pitch comes from the card's real size
         (fixed width, two strips; see app-ui-blocks.css), 4 columns where they fit, else 3, 2 on phones */
      var card = agents[0].el, gap = column ? 8 : 10;
      var cw = card.offsetWidth + gap, ch = card.offsetHeight + gap;
      var cols = column ? 2 : (4 * cw + 28 <= pin.clientWidth - 160 ? 4 : 3);   /* 4 across only with 80px to spare on each side */
      var rows = Math.ceil(AGENTS.length / cols);
      var boardScale = 1;
      var slots = agents.map(function (a, i) {
        var col = i % cols, row = Math.floor(i / cols);
        return { x: (col - (cols - 1) / 2) * cw, y: (row - (rows - 1) / 2) * ch };
      });
      board.style.width = (cols * cw + 28) + 'px';
      board.style.height = (rows * ch + 28 + 28) + 'px';
      m = {
        column: column,
        capEm: capEm, restEm: restEm,
        availW: availW, availH: availH, lineEmH: lineEmH,
        w: pin.clientWidth, h: pin.clientHeight,
        vmin: Math.min(pin.clientWidth, pin.clientHeight),
        slots: slots, boardScale: boardScale,
        /* a: width in em with nothing revealed, b: em that reveal adds at full */
        a: column ? Math.max.apply(null, capEm) : sumCap + 2 * GAP0,
        b: column ? Math.max.apply(null, restEm) : sumRest,
        top: mark.getBoundingClientRect().top + window.scrollY,
        travel: Math.max(1, mark.offsetHeight - pin.offsetHeight)
      };
      /* zoom origin: the V's left stroke at mid height, as a fraction of the tight IVE line */
      m.originX = column ? (0.31 * capEm[1]) / m.a : (capEm[0] + GAP0 + 0.31 * capEm[1]) / m.a;
      var size0 = Math.min(availW / m.a, availH / lineEmH);
      var diag = Math.sqrt(m.w * m.w + m.h * m.h);
      m.zoom0 = Math.max(10, 1.45 * diag / (0.19 * size0));
      lastRaw = -1;
    }

    function renderScene(dt) {
      frameNo++;
      var c = clamp(raw / T_CHAOS);
      var k = ease((raw - T_CHAOS) / (T_CTRL - T_CHAOS));
      var g = ease((raw - T_CTRL) / (T_END - T_CTRL));
      age += dt;
      clock += dt * (1 - k);                 /* the swarm's own time slows as control takes over */
      var emerge = ease(age / 1.4);          /* out of black */
      var dim = 1 - g;                       /* after control, everything goes dark */
      var lightFade = dim;
      var still = (1 - k) * dim;
      scene.style.setProperty('--scene-lines', (emerge * (0.35 + 0.65 * (1 - k)) * dim).toFixed(3));
      scene.style.setProperty('--scene-scan', (emerge * dim).toFixed(3));
      scene.style.setProperty('--scene-vig', '1');

      /* camera: a slow drift while flying, dead still once in control */
      var swayX = Math.sin(clock * 0.37) * 16 * still, swayY = Math.cos(clock * 0.29) * 10 * still;
      var swayR = Math.sin(clock * 0.23) * 0.9 * still;
      cam.style.transform = 'translate(' + swayX.toFixed(1) + 'px, ' + swayY.toFixed(1) + 'px) rotate(' + swayR.toFixed(2) + 'deg)';

      /* corridor: the grid flows past, faster with scroll, then stops */
      var dist = (clock * 90 + c * 900) % GRID;
      walls.floor.style.transform = 'rotateX(-90deg) translateY(' + (-dist).toFixed(1) + 'px)';
      walls.ceil.style.transform = 'rotateX(90deg) translateY(' + dist.toFixed(1) + 'px)';
      walls.left.style.transform = 'rotateY(90deg) translateX(' + (-dist).toFixed(1) + 'px)';
      walls.right.style.transform = 'rotateY(-90deg) translateX(' + dist.toFixed(1) + 'px)';

      /* ring frames rushing past */
      var camz = clock * 0.32 + c * 1.4;
      for (var i = 0; i < RINGS; i++) {
        var d = (i / RINGS + 1 - (camz - Math.floor(camz))) % 1;
        var s = 2.8 / (1 + d * 26);
        var o = 0.5 * (0.4 + 0.6 * (1 - d)) * ease(d / 0.06) * ease((1 - d) / 0.3) * emerge * still;
        rings[i].style.transform = 'translate(-50%, -50%) scale(' + s.toFixed(4) + ')';
        rings[i].style.opacity = o.toFixed(3);
      }

      /* agents: swarm in depth, then glide onto the board */
      var RX = m.w * 0.55, RY = m.h * 0.5;
      var t = clock;
      var counts = { run: 0, wait: 0, done: 0 };
      for (var n = 0; n < agents.length; n++) {
        var a = agents[n];
        var dz = ((a.z0 + t * a.v + c * 0.6 * (a.v > 0 ? 1 : -1)) % 1 + 1) % 1;   /* 0 = at the viewer, 1 = far */
        var persp = 0.35 / (0.35 + 2.2 * dz);
        var sx = a.x0 + a.ax * Math.sin(a.wx * t + a.px);
        var sy = a.y0 + a.ay * Math.sin(a.wy * t + a.py);
        var px = sx * RX * persp, py = sy * RY * persp;
        var sc = 2.4 * persp;
        var op = ease(dz / 0.05) * ease((1 - dz) / 0.2) * emerge;
        var rot = a.rot * Math.sin(a.wy * t * 1.3 + a.py);
        var tiltY = -sx * 16, tiltX = sy * 10;
        var st;
        if (k < 0.5) {
          /* now and then a session needs you: the tile flips to "Waiting" / "Your answer is needed" and shivers */
          var f = Math.sin(t * a.flick + a.px * 2);
          st = f > 0.76 ? 'wait' : 'run';
        } else {
          st = (k - 0.78) / 0.22 > (n + 0.5) / agents.length ? 'done' : 'run';
        }
        if (st === 'wait' && k < 0.5) { px += (rnd(frameNo, n) - 0.5) * 3; py += (rnd(frameNo, n + 40) - 0.5) * 3; }
        if (k > 0) {
          var slot = m.slots[n];
          px += (slot.x - px) * k; py += (slot.y - py) * k;
          sc += (m.boardScale - sc) * k; rot *= (1 - k); op += (1 - op) * k;
          tiltY *= (1 - k); tiltX *= (1 - k);
        }
        op *= lightFade;
        a.el.style.transform = 'translate(-50%, -50%) translate(' + px.toFixed(1) + 'px, ' + py.toFixed(1) + 'px) perspective(700px) rotateY(' + tiltY.toFixed(1) + 'deg) rotateX(' + tiltX.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ') rotate(' + rot.toFixed(2) + 'deg)';
        a.el.style.opacity = op.toFixed(3);
        a.el.style.zIndex = k > 0.5 ? 60 : 10 + Math.round((1 - dz) * 40);
        setStatus(a, st);
        counts[st]++;
      }

      /* the board panel appears around the controlled agents */
      var bo = ease((k - 0.45) / 0.45) * lightFade;
      board.style.opacity = bo.toFixed(3);
      board.style.transform = 'translate(-50%, -50%) translateY(-14px) scale(' + (0.96 + 0.04 * ease((k - 0.45) / 0.45)).toFixed(3) + ')';

      /* captions and live counts */
      capA.style.opacity = (ease((age - 0.6) / 0.8) * (1 - ease(k / 0.4))).toFixed(3);
      capB.style.opacity = (ease((k - 0.55) / 0.35) * dim).toFixed(3);
      var textA = counts.run + ' running · ' + counts.wait + (counts.wait === 1 ? ' needs your reply' : ' need your reply');
      var textB = counts.done + ' done' + (counts.run ? ' · ' + counts.run + ' running' : '');
      if (textA !== lastCountA) { countA.textContent = textA; lastCountA = textA; }
      if (textB !== lastCountB) { countB.textContent = textB; lastCountB = textB; }

      root.classList.add('mark-dark');
    }

    function renderUnfold() {
      var p = clamp((raw - P_START) / (P_END - P_START));
      var u = ease((p - 0.02) / 0.84);
      /* exponential reveal: the size then shrinks at a steady visual rate */
      var K = 1 + m.b / m.a;
      var reveal = (m.a / m.b) * (Math.pow(K, u) - 1);
      var gap = GAP0 + (GAP1 - GAP0) * ease(p / 0.5);
      var contentEm;
      if (m.column) {
        contentEm = 0;
        for (var i = 0; i < m.capEm.length; i++) {
          contentEm = Math.max(contentEm, m.capEm[i] + m.restEm[i] * reveal);
        }
      } else {
        contentEm = m.a - 2 * GAP0 + m.b * reveal + 2 * gap;
      }
      var size = Math.min(m.availW / contentEm, m.availH / m.lineEmH);
      /* out of the letters: the view starts inside the V's left stroke and zooms out until the mark stands */
      var z = clamp((raw - T_END) / (Z_END - T_END));
      var pop = Math.pow(m.zoom0, 1 - ease(z));
      var shiftX = 0, shiftY = 0, tPop = 1;
      if (pop > 1.0001) {
        /* browsers stop drawing glyphs past a few thousand px: grow the type up to a cap, the rest is a transform about the same point */
        var fontPop = Math.min(pop, 6000 / size);
        tPop = pop / fontPop;
        var W1 = m.a * size;
        shiftX = m.column ? -m.originX * W1 * (fontPop - 1) : -(m.originX - 0.5) * W1 * (fontPop - 1);
        size *= fontPop;
      }
      root.classList.remove('mark-dark');
      var alpha = ease(p / 0.28);
      var slide = -0.15 * (1 - reveal);
      var fade = 0.35 * (1 - reveal);
      var st = mark.style;
      st.setProperty('--mark-size', size.toFixed(2) + 'px');
      st.setProperty('--mark-gap', gap.toFixed(4) + 'em');
      st.setProperty('--mark-reveal', reveal.toFixed(4));
      st.setProperty('--mark-slide', slide.toFixed(4) + 'em');
      st.setProperty('--mark-fade', fade.toFixed(4) + 'em');
      st.setProperty('--mark-alpha', alpha.toFixed(3));
      st.setProperty('--mark-shift-x', shiftX.toFixed(1) + 'px');
      st.setProperty('--mark-shift-y', shiftY.toFixed(1) + 'px');
      st.setProperty('--mark-pop', tPop.toFixed(4));
      st.setProperty('--mark-origin-x', (m.originX * 100).toFixed(2) + '%');
      var by = ease((p - 0.78) / 0.2);
      st.setProperty('--mark-by', by.toFixed(3));
      mark.classList.toggle('has-by', by > 0.5);
    }

    function frame(ts) {
      looping = false;
      if (!m) return;
      var dt = lastTs === null ? 0 : Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;
      raw = clamp((window.scrollY - m.top) / m.travel);
      var lit = raw >= T_END;
      var inView = window.scrollY < m.top + m.travel + m.h;
      if (raw !== lastRaw) {
        mark.classList.toggle('is-lit', lit);
        if (!lit) root.classList.add('mark-dark');
        renderUnfold();
        mark.style.setProperty('--mark-hint', (lit || !hintReady) ? '0' : (1 - ease(raw / 0.03)).toFixed(3));
        lastRaw = raw;
      }
      if (!lit && inView) {
        renderScene(dt);
        loop();
      } else {
        lastTs = null;
      }
    }
    function loop() {
      if (looping) return;
      looping = true;
      window.requestAnimationFrame(frame);
    }

    var resizeTimer = null;
    var onResize = function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { measure(); loop(); }, 120);
    };

    measure(); loop();
    setTimeout(function () { hintReady = true; lastRaw = -1; loop(); }, 900);
    window.addEventListener('scroll', loop, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { measure(); loop(); });
    }
    window.addEventListener('load', function () { measure(); loop(); });

    /* the hero's entrance waits until it scrolls into view */
    if (hero && 'IntersectionObserver' in window) {
      var heroIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { hero.classList.add('is-in'); heroIO.disconnect(); }
        });
      }, { threshold: 0.18 });
      heroIO.observe(hero);
    } else if (hero) {
      hero.classList.add('is-in');
    }
  })();

})();

/* IVE.DEV — exit: the call to action comes into focus.
   Three planes in depth: a wall of session tiles at the back, alive with a
   wave of running → complete; the headline in the middle; the local setup
   terminal in front. Scrolling racks the focus from plane to plane, like a
   camera, until only the setup stands sharp. Typing a goal plans it into
   four tasks and sends a wave through the wall. */
(function () {
  'use strict';

  var root = document.documentElement;
  var exit = document.querySelector('[data-exit]');
  if (!exit) return;

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduceMotion = motionQuery.matches;
  var live = root.classList.contains('mark-live') && !reduceMotion;

  var pin = exit.querySelector('[data-exit-pin]');
  var wall = exit.querySelector('[data-exit-wall]');
  var anchor = exit.querySelector('[data-exit-anchor]');
  var term = exit.querySelector('[data-exit-term]');
  var termStatus = exit.querySelector('[data-exit-status]');
  var typeEls = Array.prototype.slice.call(exit.querySelectorAll('[data-exit-type]'));
  var form = exit.querySelector('[data-exit-form]');
  var input = exit.querySelector('[data-exit-input]');
  var result = exit.querySelector('[data-exit-result]');
  var tasksBox = exit.querySelector('[data-exit-tasks]');
  var taskRows = Array.prototype.slice.call(exit.querySelectorAll('[data-exit-task]'));
  var taskNames = Array.prototype.slice.call(exit.querySelectorAll('[data-exit-task-name]'));
  var taskStatuses = Array.prototype.slice.call(exit.querySelectorAll('[data-exit-task-status]'));
  var count = exit.querySelector('[data-exit-count]');
  var finalGoal = exit.querySelector('[data-final-goal]');
  var columnQuery = window.matchMedia('(max-width: 720px)');

  /* story on the scroll axis: focus racks wall → headline → terminal, then holds */
  var H0 = 0.26, H1 = 0.48, T0 = 0.56, T1 = 0.80;
  var TYPE_SPEED = 34, PERIOD = 8;
  var STATUS = { run: ['●', 'running'], wait: ['○', 'queued'], done: ['✓', 'complete'] };
  var RULES = [
    [/sign[- ]?in|log[- ]?in|auth|passkey|session|oauth|sso|password/i, ['sign-in API', 'account interface', 'regression checks', 'final review']],
    [/upgrade|dependenc|package|version|migrat/i, ['dependency scan', 'isolated upgrade', 'compatibility checks', 'diff review']],
    [/accessib|a11y|contrast|screen reader|keyboard/i, ['navigation fixes', 'form labels', 'contrast checks', 'release review']],
    [/bug|fix|error|crash|broken|fail/i, ['reproduce the bug', 'isolated fix', 'regression test', 'final review']],
    [/test|coverage|spec/i, ['test plan', 'unit tests', 'integration run', 'final review']],
    [/docs?\b|readme|guide|manual/i, ['outline', 'draft pages', 'link checks', 'final review']],
    [/perf|speed|fast|slow|cache|latency/i, ['profile the hot path', 'targeted changes', 'benchmark run', 'final review']],
    [/api|endpoint|route|webhook|graphql/i, ['API routes', 'request validation', 'integration tests', 'final review']],
    [/deploy|release|ci\b|pipeline|docker|kubernetes/i, ['pipeline config', 'build step', 'dry run', 'release review']],
    [/database|schema|sql|table|model|data\b/i, ['schema change', 'data migration', 'integrity checks', 'final review']],
    [/ui\b|page|screen|design|layout|landing|dashboard|form|dark mode|theme|component/i, ['layout', 'components', 'visual checks', 'final review']]
  ];

  var m = null;
  var raw = 0, lastRaw = -1;
  var clock = 0, lastTs = null, looping = false;
  var tiles = [];
  var typing = { started: false, done: false, t0: 0, full: typeEls.map(function (el) { return el.textContent; }), shown: typeEls.map(function () { return -1; }) };
  var plan = null;
  var lastCount = '';
  var lastWallTs = -1e9;
  var pointer = { x: 0, y: 0, t: -1e9, used: -1e9 };

  var ease = function (x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); };
  var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };

  function setStatus(a, st) {
    if (a.st === st) return;
    a.st = st;
    a.el.setAttribute('data-st', st);
    a.glyph.textContent = STATUS[st][0];
    a.word.textContent = STATUS[st][1];
  }
  function setTermStatus(cls, glyph, word) {
    termStatus.className = 'exit-term-status mono' + (cls ? ' ' + cls : '');
    termStatus.textContent = '';
    var g = document.createElement('span'); g.className = 'glyph'; g.setAttribute('aria-hidden', 'true'); g.textContent = glyph;
    termStatus.appendChild(g);
    termStatus.appendChild(document.createTextNode(' ' + word));
  }
  function setRowStatus(i, st) {
    var el = taskStatuses[i];
    var cls = st === 'done' ? 'st-done' : st === 'run' ? 'st-running' : 'st-waiting';
    if (el.getAttribute('data-st') === st) return;
    el.setAttribute('data-st', st);
    el.className = 'status ' + cls;
    el.textContent = '';
    var g = document.createElement('span'); g.className = 'glyph'; g.setAttribute('aria-hidden', 'true'); g.textContent = STATUS[st][0];
    el.appendChild(g);
    el.appendChild(document.createTextNode(' ' + STATUS[st][1]));
  }

  /* the wall: a grid of session tiles, sized to the room, rebuilt only when the grid changes */
  function buildWall() {
    var column = columnQuery.matches;
    var tw = column ? 78 : 148, th = column ? 26 : 34, gap = column ? 6 : 8;
    var cols = Math.min(16, Math.ceil(m.w * 1.2 / (tw + gap)));
    var rows = Math.min(26, Math.ceil(m.h * 1.0 / (th + gap)));
    if (m.cols === cols && m.rows === rows && m.tw === tw) return;
    m.cols = cols; m.rows = rows; m.tw = tw; m.th = th; m.gap = gap;
    m.wallW = cols * (tw + gap) - gap; m.wallH = rows * (th + gap) - gap;
    wall.style.setProperty('--wall-cols', cols);
    wall.style.setProperty('--tile-w', tw + 'px');
    wall.style.setProperty('--tile-h', th + 'px');
    wall.style.setProperty('--tile-gap', gap + 'px');
    wall.style.width = m.wallW + 'px';
    wall.textContent = '';
    tiles = [];
    var dmax = Math.sqrt(m.wallW * m.wallW + m.wallH * m.wallH) / 2;
    var frag = document.createDocumentFragment();
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var i = r * cols + c;
        var el = document.createElement('div');
        el.className = 'exit-tile';
        el.innerHTML = '<span class="et-id"></span><span class="et-st"><span class="glyph"></span><span class="et-word"></span></span>';
        el.querySelector('.et-id').textContent = 's-' + ('00' + (i + 1)).slice(-3);
        frag.appendChild(el);
        var cx = (c - (cols - 1) / 2) * (tw + gap), cy = (r - (rows - 1) / 2) * (th + gap);
        tiles.push({ el: el, glyph: el.querySelector('.glyph'), word: el.querySelector('.et-word'), st: '', cx: cx, cy: cy, d: Math.sqrt(cx * cx + cy * cy) / dmax, hot: -1 });
      }
    }
    wall.appendChild(frag);
  }

  function measure() {
    m = m || {};
    m.column = columnQuery.matches;
    m.w = pin.clientWidth; m.h = pin.clientHeight;
    m.top = exit.getBoundingClientRect().top + window.scrollY;
    m.travel = Math.max(1, exit.offsetHeight - pin.offsetHeight);
    if (live) {
      anchor.style.top = Math.round(m.travel * 0.86) + 'px';
      buildWall();
    }
    lastRaw = -1;
  }

  /* pointer or burst position → wall coordinates (the wall's projected box is close enough) */
  function toWall(clientX, clientY) {
    var r = wall.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return { x: ((clientX - r.left) / r.width - 0.5) * m.wallW, y: ((clientY - r.top) / r.height - 0.5) * m.wallH };
  }
  function heat(x, y, radius, now, delayPerPx) {
    for (var i = 0; i < tiles.length; i++) {
      var t = tiles[i], dx = t.cx - x, dy = t.cy - y, dist = Math.sqrt(dx * dx + dy * dy);
      if (radius && dist > radius) continue;
      var at = now + (delayPerPx ? dist * delayPerPx : 0);
      if (t.hot < 0 || now - t.hot > 600 || delayPerPx) t.hot = at;
    }
  }

  function tileState(t, now) {
    if (t.hot > 0) {
      var age = now - t.hot;
      if (age >= 0) {
        if (age < 600) return 'run';
        if (age < 3800) return 'done';
        t.hot = -1;
      }
    }
    var u = (clock / PERIOD - t.d * 0.55) % 1;
    if (u < 0) u += 1;
    return u < 0.06 ? 'wait' : u < 0.28 ? 'run' : 'done';
  }

  function renderWall(now) {
    if (pointer.t > pointer.used && now - pointer.t < 200) {
      pointer.used = now;
      var p = toWall(pointer.x, pointer.y);
      if (p) heat(p.x, p.y, m.column ? 70 : 120, now, 0);
    }
    var counts = { run: 0, wait: 0, done: 0 };
    for (var i = 0; i < tiles.length; i++) {
      var s = tileState(tiles[i], now);
      setStatus(tiles[i], s);
      counts[s]++;
    }
    var text = counts.done + ' complete · ' + counts.run + ' running · ' + counts.wait + ' queued';
    if (text !== lastCount) { count.textContent = text; lastCount = text; }
  }

  /* focus racks through the three planes; the others soften, dim and drift */
  function renderLayers() {
    var f = raw < H0 ? 0 : raw < H1 ? ease((raw - H0) / (H1 - H0)) : raw < T0 ? 1 : 1 + ease((raw - T0) / (T1 - T0));
    var BL = m.column ? 6 : 9;
    var st = exit.style;
    var dz = f;
    st.setProperty('--wall-blur', Math.min(m.column ? 8 : 14, BL * dz).toFixed(2) + 'px');
    st.setProperty('--wall-o', (1 - 0.32 * Math.min(2, dz)).toFixed(3));
    st.setProperty('--wall-s', (1 + 0.16 * raw).toFixed(4));
    st.setProperty('--wall-y', (-0.12 * m.h * raw).toFixed(1) + 'px');
    st.setProperty('--wall-tilt', (14 + 8 * raw).toFixed(2) + 'deg');

    dz = Math.abs(1 - f);
    var near = Math.min(1, dz);
    st.setProperty('--head-blur', Math.min(12, BL * dz).toFixed(2) + 'px');
    st.setProperty('--head-o', (0.3 + 0.7 * (1 - near)).toFixed(3));
    var hs = f <= 1 ? 0.88 + 0.12 * (1 - dz) : 1 - (m.column ? 0.30 : 0.28) * dz;
    var hy = f <= 1 ? 0.08 * m.h * dz : -0.27 * m.h * dz;
    st.setProperty('--head-s', hs.toFixed(4));
    st.setProperty('--head-y', hy.toFixed(1) + 'px');

    dz = Math.abs(2 - f);
    near = Math.min(1, dz);
    st.setProperty('--term-blur', Math.min(12, BL * dz).toFixed(2) + 'px');
    st.setProperty('--term-o', (f < 1 ? 0 : 1 - 0.65 * near).toFixed(3));
    st.setProperty('--term-s', (0.92 + 0.08 * (1 - near)).toFixed(4));
    st.setProperty('--term-y', (-(m.column ? 0.095 : 0.10) * m.h + 0.28 * m.h * near).toFixed(1) + 'px');
    term.classList.toggle('is-live', dz < 0.35);
    st.setProperty('--cap-o', (1 - ease(f / 0.6)).toFixed(3));
    return dz;
  }

  function updateTyping(now) {
    var chars = Math.floor((now - typing.t0) / 1000 * TYPE_SPEED);
    var off = 0, allDone = true;
    for (var i = 0; i < typeEls.length; i++) {
      var full = typing.full[i];
      var n = Math.max(0, Math.min(full.length, chars - off));
      if (typing.shown[i] !== n) { typeEls[i].textContent = full.slice(0, n); typing.shown[i] = n; }
      typeEls[i].classList.toggle('is-typing', n < full.length && chars - off >= 0);
      if (n < full.length) { allDone = false; break; }
      off += full.length + 10;
    }
    if (allDone) finishTyping();
  }
  function finishTyping() {
    typeEls.forEach(function (el, i) { el.textContent = typing.full[i]; el.classList.remove('is-typing'); });
    typing.started = true; typing.done = true;
    exit.style.setProperty('--goal-alpha', '1');
    term.classList.add('is-open');
  }

  function planTasks(goal) {
    for (var i = 0; i < RULES.length; i++) if (RULES[i][0].test(goal)) return RULES[i][1];
    var topic = goal.replace(/^(please\s+)?(build|add|create|make|implement|write|set up|setup|refactor|improve|update|change|design|ship|fix|migrate|move)\s+(a|an|the|our|my)?\s*/i, '').replace(/[.!?]+$/, '').trim();
    topic = topic.split(/\s+/).slice(0, 3).join(' ') || 'the goal';
    return ['plan ' + topic, 'implement ' + topic, 'check ' + topic, 'review ' + topic];
  }
  function startPlan(text) {
    var goal = (text || '').trim() || input.placeholder;
    var tasks = planTasks(goal);
    var now = performance.now();
    plan = { t0: now, done: false };
    taskNames.forEach(function (el, i) { el.textContent = tasks[i]; });
    taskRows.forEach(function (row, i) { row.classList.remove('is-in'); setRowStatus(i, 'wait'); });
    tasksBox.hidden = false;
    setTermStatus('st-run', '●', 'working');
    result.classList.remove('is-done');
    result.textContent = '● planning · four focused tasks started';
    if (live && tiles.length) {
      var r = term.getBoundingClientRect();
      var p = toWall(r.left + r.width / 2, r.top + r.height * 0.3);
      if (p) heat(p.x, p.y, 0, now + 300, 1.3);
    }
    loop();
  }
  function renderPlan(now) {
    var u = live ? (now - plan.t0) / 1000 : 10;
    for (var i = 0; i < taskRows.length; i++) {
      var start = 0.3 + i * 0.35;
      taskRows[i].classList.toggle('is-in', u > start);
      setRowStatus(i, u > 1.5 + i * 0.35 ? 'done' : u > start ? 'run' : 'wait');
    }
    if (u > 3.0 && !plan.done) {
      plan.done = true;
      result.textContent = '✓ One goal. Four focused tasks. One review.';
      result.classList.add('is-done');
      setTermStatus('st-done', '✓', 'ready to review');
    }
    return !plan.done;
  }

  function frame(ts) {
    looping = false;
    if (!m) return;
    var dt = lastTs === null ? 0 : Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    clock += dt;
    var animating = false;
    if (live) {
      raw = clamp((window.scrollY - m.top) / m.travel);
      var inView = window.scrollY + m.h > m.top && window.scrollY < m.top + m.travel + m.h;
      if (inView) {
        var dzTerm = raw !== lastRaw ? renderLayers() : null;
        if (raw !== lastRaw) lastRaw = raw;
        if (ts - lastWallTs >= 80) { renderWall(ts); lastWallTs = ts; }
        var termNear = dzTerm === null ? term.classList.contains('is-live') : dzTerm < 0.5;
        if (termNear && !typing.started) { typing.started = true; typing.t0 = ts; }
        if (typing.started && !typing.done) updateTyping(ts);
        if (plan) renderPlan(ts);
        animating = true;
      }
    } else if (plan) {
      animating = renderPlan(ts);
    }
    if (animating) loop(); else lastTs = null;
  }
  function loop() {
    if (looping) return;
    looping = true;
    window.requestAnimationFrame(frame);
  }

  /* ── wiring ── */
  if (finalGoal) {
    var syncGoal = function () { input.placeholder = finalGoal.textContent.trim() || input.placeholder; };
    syncGoal();
    if ('MutationObserver' in window) new MutationObserver(syncGoal).observe(finalGoal, { childList: true, characterData: true, subtree: true });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); startPlan(input.value); });

  var resizeTimer = null;
  var onResize = function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { measure(); loop(); }, 120);
  };
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  if (live) {
    exit.addEventListener('pointermove', function (e) { pointer.x = e.clientX; pointer.y = e.clientY; pointer.t = performance.now(); loop(); }, { passive: true });
    measure();
    setTimeout(loop, 60);
    window.addEventListener('scroll', loop, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); loop(); });
    window.addEventListener('load', function () { measure(); loop(); });
  } else {
    exit.classList.add('is-static');
    term.classList.add('is-live');
    finishTyping();
    measure();
  }
})();

/* Why IVE: first let the question fill the viewport and hold.
   It then docks above four answers. Four board tiles, drawn as the app draws them,
   spread from one stack into a 2×2 board, change state (running, waiting, failed,
   retried, done) and finally stack beneath one "Reply ready" review tile.
   Scroll owns the timeline in both directions; there is no autoplay. */
(function () {
  'use strict';
  var section = document.querySelector('[data-why]');
  if (!section) return;
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var compact = window.matchMedia('(max-height: 600px)');
  var pin = section.querySelector('.why-pin');
  var scene = section.querySelector('.why-scene');
  var deck = section.querySelector('[data-why-deck]');
  var question = section.querySelector('.why-question');
  var words = Array.from(section.querySelectorAll('[data-why-word]'));
  var prelude = section.querySelector('[data-why-prelude]');
  var cue = section.querySelector('[data-why-cue]');
  var layout = section.querySelector('.why-layout');
  var controls = section.querySelector('.why-progress');
  var beats = Array.from(section.querySelectorAll('[data-why-beat]'));
  var planes = Array.from(section.querySelectorAll('[data-why-plane]'));
  var statuses = Array.from(section.querySelectorAll('[data-why-status]'));
  var jumps = Array.from(section.querySelectorAll('[data-why-jump]'));
  var receipt = section.querySelector('[data-why-receipt]');
  var caption = section.querySelector('[data-why-caption]');
  var captions = ['one goal, four focused tasks', 'every session, one clear view', 'check, retry, check again', 'the final decision stays yours'];
  var clamp = function (n) { return Math.max(0, Math.min(1, n)); };
  var ease = function (n) { n = clamp(n); return n * n * (3 - 2 * n); };
  var mix = function (a, b, t) { return a + (b - a) * t; };
  var live = false, raf = 0, current = -1, scale = 1, questionPoses = [];
  var ANSWERS_START = 0.28;
  // x, y — per tile, per step. The tiles sit flat, as on the board: one stack
  // becomes a 2×2 grid, the grid holds for two steps, then everything stacks
  // beneath the review tile (which is the fourth tile's reply, full size).
  var board = [[-134, -96], [134, -96], [-134, 96], [134, 96]];
  var poses = [board, board, board, [[0, 10], [0, 26], [0, 42], [0, 58]]];
  // The pill in each tile header uses the app's words and colours.
  var PILLS = {
    run: ['is-running', 'Running'], wait: ['is-waiting', 'Waiting'], fail: ['is-failed', 'Failed'],
    retry: ['is-running', 'Running'], done: ['is-done', 'Done'], idle: ['is-idle', 'Not Started']
  };

  function setState(index, state) {
    var plane = planes[index];
    if (plane.dataset.state === state && plane.dataset.whySynced) return;
    plane.dataset.state = state;
    plane.dataset.whySynced = '1';
    plane.classList.toggle('is-waiting', state === 'wait');
    statuses[index].className = 'au-pill ' + PILLS[state][0];
    statuses[index].textContent = PILLS[state][1];
    // Each tile carries its status line, step lines and composer text for every
    // state it passes through; only the current state's elements show.
    Array.prototype.forEach.call(plane.querySelectorAll('[data-why-on]'), function (el) {
      el.hidden = (' ' + el.getAttribute('data-why-on') + ' ').indexOf(' ' + state + ' ') < 0;
    });
  }

  function render() {
    raf = 0;
    if (!live || document.hidden) return;
    // Read the section position each time: upstream sections can change height.
    var box = section.getBoundingClientRect();
    var height = pin.offsetHeight;
    var progress = clamp(-box.top / Math.max(1, section.offsetHeight - height));
    var dock = ease((progress - 0.10) / 0.15);
    var answerAlpha = ease((progress - 0.245) / (ANSWERS_START - 0.245));
    words.forEach(function (word, i) {
      var pose = questionPoses[i];
      if (!pose) return;
      // On mobile, make room horizontally before bringing the two lines together.
      var collapse = pose.stacked ? 1 - Math.pow(1 - clamp(dock / 0.72), 2) : dock;
      // Set real type size, not a compositor scale of small rasterized glyphs.
      word.style.fontSize = (pose.fontSize * mix(pose.scale, 1, collapse)).toFixed(3) + 'px';
      word.style.left = (pose.left + pose.x * (1 - collapse)).toFixed(3) + 'px';
      word.style.top = (pose.y * (1 - dock)).toFixed(3) + 'px';
    });
    prelude.style.opacity = (1 - ease((progress - 0.07) / 0.04)).toFixed(3);
    cue.style.opacity = (1 - ease((progress - 0.06) / 0.05)).toFixed(3);
    layout.style.opacity = answerAlpha.toFixed(3);
    layout.style.transform = 'translateY(' + ((1 - answerAlpha) * 24).toFixed(2) + 'px)';
    controls.style.opacity = answerAlpha.toFixed(3);
    controls.inert = answerAlpha < 0.5;

    var timeline = Math.min(3.9999, clamp((progress - ANSWERS_START) / (1 - ANSWERS_START)) * 4);
    var step = Math.floor(timeline);
    var local = timeline - step;
    var incoming = step === 0 ? 1 : ease(local / 0.19);
    var outgoing = step === 3 ? 1 : 1 - ease((local - 0.82) / 0.18);

    var active = answerAlpha > 0.5 ? step : -1;
    if (current !== active) {
      current = active;
      beats.forEach(function (beat, i) {
        beat.style.pointerEvents = i === active ? 'auto' : 'none';
        // All four explanations stay available to assistive technology in DOM order.
      });
      jumps.forEach(function (jump, i) {
        if (i === active) jump.setAttribute('aria-current', 'step');
        else jump.removeAttribute('aria-current');
      });
      caption.textContent = captions[step];
    }
    beats.forEach(function (beat, i) {
      if (i !== step) { beat.style.opacity = '0'; return; }
      beat.style.opacity = (incoming * outgoing).toFixed(3);
      beat.style.transform = 'translate3d(0,' + ((1 - incoming) * 28 - (1 - outgoing) * 20).toFixed(2) + 'px,0) rotateX(' + ((1 - incoming) * -6).toFixed(2) + 'deg)';
      beat.style.filter = 'blur(' + ((1 - incoming * outgoing) * 5).toFixed(2) + 'px)';
    });
    jumps.forEach(function (jump, i) {
      jump.style.setProperty('--why-fill', clamp(timeline - i).toFixed(3));
    });

    var review = step === 3 ? ease((local - 0.2) / 0.38) : 0;
    // The small tiles' content goes first, then they gather; the review tile last.
    var detail = step === 3 ? 1 - ease((local - 0.04) / 0.22) : 1;
    deck.style.transform = 'scale(' + scale.toFixed(3) + ')';
    planes.forEach(function (plane, i) {
      var to = poses[step][i];
      // Before the first step the four tiles lie on one stack, the first on top.
      var from = step === 0 ? [0, i * 9] : poses[step - 1][i];
      var transition = ease((local - i * 0.035) / (step === 0 ? 0.46 : 0.38));
      var p = to.map(function (value, axis) { return mix(from[axis], value, transition); });
      // In the last step the small tiles grow to the review tile's footprint, so the
      // stack peeks out beneath it; their content has faded by then.
      plane.style.transform = 'translate3d(' + p[0].toFixed(2) + 'px,' + p[1].toFixed(2) + 'px,0) scale(' + (1 + review * 0.5).toFixed(3) + ',' + (1 + review * 0.58).toFixed(3) + ')';
      plane.style.setProperty('--why-detail', detail.toFixed(3));
      var done = step === 3 || (step === 2 && local > 0.48 + i * 0.075);
      // The review session starts once the first sessions have replied.
      var state = done ? 'done'
        : i === 2 ? (step === 1 ? 'wait' : step === 2 ? (local < 0.26 ? 'fail' : 'retry') : 'run')
        : i === 3 ? (step === 2 && local > 0.5 ? 'run' : 'idle') : 'run';
      setState(i, state);
    });
    receipt.style.opacity = review.toFixed(3);
    receipt.style.transform = 'translate3d(0,' + ((1 - review) * 35).toFixed(2) + 'px,0)';
  }

  function schedule() {
    if (live && !raf && !document.hidden) raf = requestAnimationFrame(render);
  }

  function measure() {
    scale = Math.min(1, scene.clientWidth / 590, scene.clientHeight / 420);
    if (live) {
      // Measure the docked heading in flow, then reserve that same space while
      // its words are independently positioned and typeset at full resolution.
      section.classList.add('is-measuring');
      var pinBox = pin.getBoundingClientRect();
      var titleBox = question.getBoundingClientRect();
      var fontSize = parseFloat(getComputedStyle(question).fontSize);
      var mobile = pin.clientWidth <= 720;
      var padding = parseFloat(getComputedStyle(pin).paddingLeft);
      var width = pin.clientWidth - padding * 2;
      var lineHeight = titleBox.height;
      var wordWidths = words.map(function (word) { return word.getBoundingClientRect().width; });
      var largeScale = mobile
        ? Math.min(width / Math.max(wordWidths[0], wordWidths[1]), pin.offsetHeight * 0.44 / (lineHeight * 2.05))
        : Math.min(width / titleBox.width, pin.offsetHeight * 0.36 / lineHeight);
      var groupHeight = lineHeight * largeScale * (mobile ? 2.05 : 1);
      var groupTop = (pin.offsetHeight - groupHeight) / 2 + 24;
      var groupLeft = (pin.clientWidth - titleBox.width * largeScale) / 2;
      questionPoses = words.map(function (word, i) {
        var left = word.getBoundingClientRect().left - titleBox.left;
        var x = mobile ? (pin.clientWidth - wordWidths[i] * largeScale) / 2 : groupLeft + left * largeScale;
        var y = groupTop + (mobile ? i * lineHeight * largeScale * 1.05 : 0);
        return { x: x - (titleBox.left - pinBox.left) - left, y: y - (titleBox.top - pinBox.top), left: left, fontSize: fontSize, scale: largeScale, stacked: mobile };
      });
      question.style.width = titleBox.width + 'px';
      question.style.height = titleBox.height + 'px';
      section.classList.remove('is-measuring');
      prelude.style.top = (groupTop - 56) + 'px';
    }
    schedule();
  }

  function syncMode() {
    // Short landscape windows use ordinary flow so every benefit is reachable.
    live = !motion.matches && !compact.matches;
    section.classList.toggle('is-live', live);
    current = -1;
    if (!live) {
      cancelAnimationFrame(raf); raf = 0;
      words.forEach(function (word) {
        word.style.removeProperty('font-size'); word.style.removeProperty('left'); word.style.removeProperty('top');
      });
      question.style.removeProperty('width'); question.style.removeProperty('height');
      layout.style.removeProperty('opacity'); layout.style.removeProperty('transform');
      controls.style.removeProperty('opacity'); controls.inert = false;
      beats.forEach(function (beat) {
        beat.style.removeProperty('pointer-events'); beat.style.removeProperty('opacity');
        beat.style.removeProperty('transform'); beat.style.removeProperty('filter');
      });
    }
    measure();
  }

  jumps.forEach(function (jump, i) {
    jump.addEventListener('click', function () {
      if (!live) return;
      var top = section.getBoundingClientRect().top + window.scrollY;
      var travel = section.offsetHeight - pin.offsetHeight;
      // Arrive on the settled pose, with the selected sentence fully readable.
      window.scrollTo({ top: top + travel * (ANSWERS_START + (1 - ANSWERS_START) * ((i + 0.64) / 4)), behavior: 'instant' });
      schedule();
    });
  });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', syncMode);
  compact.addEventListener('change', syncMode);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  syncMode();
})();

/* IVE.DEV — merge: every session comes back as one review.
   One lane per session, drawn by scroll as they curve into a single trunk;
   a packet travels each lane while it runs; the trunk ends in one review.
   The lane heads are the app's session rows (dot + name + status word, static
   HTML in index.html); the trunk ends in the review tile's head and status line.
   build() measures the rows, fits as many lanes as the width takes and places
   rows and tile; render() turns each row from Running to Done as its lane lands. */
(function () {
  'use strict';

  var root = document.documentElement;
  var sec = document.querySelector('[data-merge]');
  if (!sec) return;

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduceMotion = motionQuery.matches;
  var live = root.classList.contains('mark-live') && !reduceMotion;

  var pin = sec.querySelector('[data-merge-pin]');
  var copy = sec.querySelector('[data-merge-copy]');
  var svg = sec.querySelector('[data-merge-svg]');
  var ghostsG = sec.querySelector('[data-merge-ghosts]');
  var lanesG = sec.querySelector('[data-merge-lanes]');
  var packetsG = sec.querySelector('[data-merge-packets]');
  var dotsG = sec.querySelector('[data-merge-dots]');
  var trunk = sec.querySelector('[data-merge-trunk]');
  var node = sec.querySelector('[data-merge-node]');
  var review = sec.querySelector('[data-merge-review]');
  var rows = Array.prototype.slice.call(sec.querySelectorAll('[data-merge-row]'));
  var columnQuery = window.matchMedia('(max-width: 720px)');
  var NS = 'http://www.w3.org/2000/svg';
  var TRUNK0 = 0.60, TRUNK1 = 0.82;

  var m = null, raw = 0, lastRaw = -1;
  var clock = 0, lastTs = null, looping = false;
  var lanes = [], trunkLen = 0;

  var ease = function (x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); };
  var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var el = function (name, cls) { var e = document.createElementNS(NS, name); if (cls) e.setAttribute('class', cls); return e; };

  function build() {
    var column = columnQuery.matches;
    var isStatic = sec.classList.contains('is-static');
    var box = svg.getBoundingClientRect();
    var W = Math.round(box.width), H = Math.round(box.height);
    if (!W || !H) return;
    /* the rows at their natural width (fonts can settle late), the tile's height.
       Measured at left 0 and fractional: an absolute box with a left offset is
       squeezed by the space remaining to its right, and a rounded width would
       trip the name's ellipsis by a sub-pixel. Each row is then placed at its
       centre minus half its own width, so no width is ever frozen. */
    var rowW = 0, rowH = 0, widths = [], i;
    for (i = 0; i < rows.length; i++) {
      rows[i].hidden = false;
      rows[i].style.left = '0px';
      rows[i].style.maxWidth = '';
      var rb = rows[i].getBoundingClientRect();
      widths[i] = rb.width;
      rowW = Math.max(rowW, rb.width);
      rowH = Math.max(rowH, rb.height);
    }
    var place = function (k, x) { rows[k].style.left = (x - widths[k] / 2).toFixed(2) + 'px'; };
    var cardH = review.offsetHeight;
    if (m && m.W === W && m.H === H && m.column === column && m.rowW === rowW && m.cardH === cardH) {
      for (i = 0; i < rows.length; i++) {
        rows[i].hidden = i >= m.n;
        rows[i].style.maxWidth = m.maxW;
        if (i < m.n) place(i, m.xs[i]);
      }
      m.top = sec.getBoundingClientRect().top + window.scrollY;
      m.travel = Math.max(1, sec.offsetHeight - pin.offsetHeight);
      return;
    }
    var gap = column ? 10 : 16;
    var pad = Math.ceil(rowW / 2) + (column ? 12 : 32);
    var n = Math.min(rows.length, Math.max(2, Math.floor((W - 2 * pad) / (rowW + gap)) + 1));
    var spacing = n > 1 ? (W - 2 * pad) / (n - 1) : 0;
    var maxW = Math.ceil(n > 1 ? spacing - gap : rowW) + 'px';
    /* the lanes start under the rows, which sit clear of the heading; the trunk ends in the tile */
    var copyBottom = isStatic ? 0 : copy.offsetTop + copy.offsetHeight;
    var y0 = isStatic ? rowH + 20 : Math.max((column ? 0.36 : 0.34) * H, copyBottom + rowH + 48);
    var stem = column ? 22 : 28;
    var ym = H - cardH - stem - (column ? 16 : 24);
    if (ym < y0 + 120) ym = y0 + 120;
    var cx = W / 2;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    ghostsG.textContent = ''; lanesG.textContent = ''; packetsG.textContent = ''; dotsG.textContent = '';
    lanes = [];
    var xs = [];
    for (i = 0; i < rows.length; i++) {
      var row = rows[i];
      row.hidden = i >= n;
      row.style.maxWidth = maxW;
      if (i >= n) continue;
      var x = pad + (W - 2 * pad) * (n === 1 ? 0.5 : i / (n - 1));
      xs[i] = x;
      place(i, x);
      row.style.top = (y0 - 12).toFixed(1) + 'px';
      var d = 'M' + x.toFixed(1) + ' ' + y0.toFixed(1) + ' C' + x.toFixed(1) + ' ' + (y0 + (ym - y0) * 0.58).toFixed(1) + ', ' + cx.toFixed(1) + ' ' + (y0 + (ym - y0) * 0.42).toFixed(1) + ', ' + cx.toFixed(1) + ' ' + ym.toFixed(1);
      var ghost = el('path', 'merge-ghost'); ghost.setAttribute('d', d); ghostsG.appendChild(ghost);
      var path = el('path', 'merge-lane'); path.setAttribute('d', d); lanesG.appendChild(path);
      var len = path.getTotalLength();
      path.style.strokeDasharray = len.toFixed(1);
      path.style.strokeDashoffset = len.toFixed(1);
      var dot = el('circle', 'merge-dot'); dot.setAttribute('r', column ? 3.5 : 4.5); dotsG.appendChild(dot);
      var packet = el('circle', 'merge-packet'); packet.setAttribute('r', column ? 2 : 2.5); packetsG.appendChild(packet);
      lanes.push({ path: path, len: len, dot: dot, packet: packet, row: row, rowDot: row.querySelector('.au-dot'), a0: 0.04 + 0.33 * (n > 1 ? i / (n - 1) : 0), seed: (i * 0.37) % 1 });
    }
    trunk.setAttribute('d', 'M' + cx.toFixed(1) + ' ' + ym.toFixed(1) + ' L' + cx.toFixed(1) + ' ' + (H + 40).toFixed(1));
    trunkLen = trunk.getTotalLength();
    trunk.style.strokeDasharray = trunkLen.toFixed(1);
    trunk.style.strokeDashoffset = trunkLen.toFixed(1);
    node.setAttribute('transform', 'translate(' + cx.toFixed(1) + ' ' + ym.toFixed(1) + ') scale(0)');
    review.style.left = cx.toFixed(1) + 'px';
    review.style.top = (ym + stem).toFixed(1) + 'px';
    review.style.opacity = '0';
    m = { W: W, H: H, cx: cx, ym: ym, column: column, n: n, rowW: rowW, cardH: cardH, maxW: maxW, xs: xs, top: sec.getBoundingClientRect().top + window.scrollY, travel: Math.max(1, sec.offsetHeight - pin.offsetHeight) };
    lastRaw = -1;
  }

  function render() {
    for (var i = 0; i < lanes.length; i++) {
      var L = lanes[i];
      var p = live ? ease((raw - L.a0) / 0.42) : 1;
      L.path.style.strokeDashoffset = (L.len * (1 - p)).toFixed(1);
      var pt = L.path.getPointAtLength(L.len * p);
      L.dot.setAttribute('cx', pt.x.toFixed(1)); L.dot.setAttribute('cy', pt.y.toFixed(1));
      var done = p >= 1;
      L.dot.classList.toggle('is-done', done);
      L.row.classList.toggle('is-done', done);
      L.rowDot.classList.toggle('is-done', done);
      L.rowDot.classList.toggle('is-running', !done);
      if (p > 0.08 && !done) {
        var q = ((clock * 0.16 + L.seed) % 1) * p;
        var pp = L.path.getPointAtLength(L.len * q);
        L.packet.setAttribute('cx', pp.x.toFixed(1)); L.packet.setAttribute('cy', pp.y.toFixed(1));
        L.packet.style.opacity = '1';
      } else {
        L.packet.style.opacity = '0';
      }
    }
    var tp = live ? ease((raw - TRUNK0) / (TRUNK1 - TRUNK0)) : 1;
    trunk.style.strokeDashoffset = (trunkLen * (1 - tp)).toFixed(1);
    var ns = live ? ease((raw - (TRUNK0 - 0.06)) / 0.08) : 1;
    node.setAttribute('transform', 'translate(' + m.cx.toFixed(1) + ' ' + m.ym.toFixed(1) + ') scale(' + ns.toFixed(3) + ')');
    var ro = live ? ease((raw - TRUNK0) / 0.12) : 1;
    review.style.opacity = ro.toFixed(3);
    review.style.transform = 'translate(-50%, ' + ((1 - ro) * 10).toFixed(1) + 'px)';
  }

  function frame(ts) {
    looping = false;
    if (!m) return;
    var dt = lastTs === null ? 0 : Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    clock += dt;
    if (live) {
      raw = clamp((window.scrollY - m.top) / m.travel);
      var inView = window.scrollY + m.H > m.top && window.scrollY < m.top + m.travel + m.H;
      if (!inView) { lastTs = null; return; }
      render();
      loop();
    } else {
      render();
    }
  }
  function loop() {
    if (looping) return;
    looping = true;
    window.requestAnimationFrame(frame);
  }

  var resizeTimer = null;
  var onResize = function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { build(); loop(); }, 120);
  };
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  if (!live) sec.classList.add('is-static');
  build();
  loop();
  if (live) window.addEventListener('scroll', loop, { passive: true });
  window.addEventListener('load', function () { build(); loop(); });
  /* the box can settle after the first build (fonts, late style); follow it */
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(svg);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { build(); loop(); });
})();
