/* ================================================================
   SFX.JS — Sound effects for Match Monsters
   ----------------------------------------------------------------
   - click    →  button clicks anywhere in the app
   - wrong    →  when two flipped cards don't match
   - gameover →  when the timer runs out (lose overlay)
   Respects the "Sound Effects" toggle in Settings.
   ================================================================ */

(function () {
  'use strict';

  /* ---------- Path setup (gameplay is one folder deeper) ---------- */
  var inGameplayFolder = /\/Gameplay\//i.test(window.location.pathname);
  var base = inGameplayFolder ? '../' : '';

  var SOURCES = {
    click:    base + 'Assets/sound/button click2.mp3',
    wrong:    base + 'Assets/sound/wrong card4.mp3',
    gameover: base + 'Assets/sound/game over3.mp3'
  };

  /* ---------- Respect the sound toggle ---------- */
  var soundEnabled = localStorage.getItem('soundEnabled') !== 'false';

  /* ---------- Preload (browser caches them after first play) ---------- */
  Object.keys(SOURCES).forEach(function (name) {
    try {
      var a = new Audio(SOURCES[name]);
      a.preload = 'auto';
      a.load();
    } catch (e) {}
  });

  /* ---------- Play helper (fresh element → allows overlapping SFX) ---------- */
  function play(name, opts) {
    if (!soundEnabled) return;
    var src = SOURCES[name];
    if (!src) return;
    try {
      var a = new Audio(src);
      a.volume = (opts && typeof opts.volume === 'number') ? opts.volume : 0.7;
      a.play().catch(function () { /* autoplay blocked — first click will unlock */ });
    } catch (e) {}
  }

  /* ---------- Auto click sound on every button-like element ---------- */
  var CLICK_SELECTORS = [
    '.btn-icon',
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
    '.lb-tab',
    '.login-parent-link',
    '.reset-confirm-cancel',
    '.reset-confirm-ok'
  ].join(',');

  document.addEventListener('click', function (e) {
    var el = e.target.closest(CLICK_SELECTORS);
    if (!el) return;
    play('click', { volume: 0.55 });
  }, true);   // use capture so it fires even if inner handler stops propagation

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
    click:    function () { play('click',    { volume: 0.55 }); },
    wrong:    function () { play('wrong',    { volume: 0.70 }); },
    gameover: function () { play('gameover', { volume: 0.85 }); }
  };
})();