/* ================================================================
   SFX.JS — Button click + wrong card + game over sounds
   ----------------------------------------------------------------
   • Preloads all SFX on page load
   • Plays immediately on click (no delay)
   • If the button navigates, we delay navigation ~150ms
     so the sound has time to start
   • Respects the "Sound Effects" toggle in Settings
   ================================================================ */

(function () {
  'use strict';

  /* ---------- Path setup ---------- */
  var inGameplayFolder = /\/Gameplay\//i.test(window.location.pathname);
  var base = inGameplayFolder ? '../' : '';

  var SOURCES = {
    click:    base + 'Assets/sound/button click2.mp3',
    wrong:    base + 'Assets/sound/wrong card4.mp3',
    gameover: base + 'Assets/sound/game over3.mp3'
  };

  var VOLUMES = {
    click:    0.55,
    wrong:    0.70,
    gameover: 0.85
  };

  /* ---------- Respect sound toggle ---------- */
  var soundEnabled = localStorage.getItem('soundEnabled') !== 'false';

  /* ---------- Preload every SFX once ---------- */
  var cache = {};
  Object.keys(SOURCES).forEach(function (name) {
    try {
      var el = new Audio(SOURCES[name]);
      el.preload = 'auto';
      el.volume  = VOLUMES[name] || 0.7;
      el.load();
      cache[name] = el;
    } catch (e) {}
  });

  /* ---------- Play helper ---------- */
  function play(name) {
    if (!soundEnabled) return;
    var src = SOURCES[name];
    if (!src) return;

    try {
      // Clone the cached element → allows overlapping plays + instant response
      var el = cache[name] ? cache[name].cloneNode(true) : new Audio(src);
      el.volume = VOLUMES[name] || 0.7;
      el.currentTime = 0;
      el.src = src;                         // safety: ensure src is set on clone
      var p = el.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    } catch (e) {
      // Last-resort fallback
      try {
        var b = new Audio(src);
        b.volume = VOLUMES[name] || 0.7;
        b.play().catch(function () {});
      } catch (e2) {}
    }
  }

  /* ---------- Unlock playback on first gesture ---------- */
  function unlock() {
    // Just attempting to play a silent sound primes the browser's audio queue
    try {
      var a = new Audio();
      a.volume = 0;
      a.play().catch(function () {});
    } catch (e) {}
    document.removeEventListener('click',      unlock);
    document.removeEventListener('keydown',    unlock);
    document.removeEventListener('touchstart', unlock);
  }
  document.addEventListener('click',      unlock, { passive: true });
  document.addEventListener('keydown',    unlock, { passive: true });
  document.addEventListener('touchstart', unlock, { passive: true });

  /* ---------- Global button-click sound ---------- */
  var CLICK_SELECTORS = [
    '.btn-icon',
    '.btn-icon-logout',
    '.btn-play-now',
    '.btn-lets-start',
    '.btn-start-game',
    '.btn-pause-circle',
    '.btn-back-circle',
    '.btn-back-top',
    '.btn-pause-levels',
    '.btn-pause-resume',
    '.btn-win-play',
    '.btn-win-restart',
    '.btn-win-home',
    '.btn-win-levels',
    '.btn-modal-close',
    '.quick-modal-ok',
    '.quick-modal-close',
    '.dropdown-item',
    '.dropdown-toggle',
    '.lb-tab',
    '.login-parent-link',
    '.reset-confirm-cancel',
    '.reset-confirm-ok',
    '.island-link',
    '.subject-card'
  ].join(',');

  document.addEventListener('click', function (e) {
    var btn = e.target.closest(CLICK_SELECTORS);
    if (!btn) return;

    /* 1️⃣ Play click immediately */
    play('click');

    /* 2️⃣ If the button triggers navigation, delay it slightly */
    var link = e.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href');
    if (!href) return;
    if (href.charAt(0) === '#') return;
    if (href.indexOf('javascript:') === 0) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    if (e.button !== 0) return;

    e.preventDefault();
    setTimeout(function () {
      window.location.href = href;
    }, 150);          // short enough to feel instant, long enough for the sound
  }, true);          // ← capture phase so we run before any other handler

  /* ---------- React to Settings toggle in real time ---------- */
  window.addEventListener('soundToggled', function (e) {
    soundEnabled = !e.detail || e.detail.enabled !== false;
  });

  window.addEventListener('storage', function (e) {
    if (e.key === 'soundEnabled') soundEnabled = e.newValue !== 'false';
  });

  /* ---------- Public API ---------- */
  window.MMSfx = {
    play:     play,
    click:    function () { play('click'); },
    wrong:    function () { play('wrong'); },
    gameover: function () { play('gameover'); }
  };
})();