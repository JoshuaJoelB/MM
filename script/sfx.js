/* ================================================================
   SFX.JS — click / wrong / gameover sounds
   ================================================================ */

(function () {
  'use strict';

  const inGameplay = /\/Gameplay\//i.test(window.location.pathname);
  const base = inGameplay ? '../' : '';

  const SOURCES = {
    click:    base + 'Assets/sound/button_click.mp3',
    wrong:    base + 'Assets/sound/wrong_card.mp3',
    gameover: base + 'Assets/sound/game_over.mp3'
  };

  const VOLUMES = { click: 0.55, wrong: 0.7, gameover: 0.85 };

  let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';

  const cache = {};
  Object.keys(SOURCES).forEach(function (name) {
    const el = new Audio(SOURCES[name]);
    el.preload = 'auto';
    el.volume  = VOLUMES[name];
    cache[name] = el;
  });

  function play(name) {
    if (!soundEnabled) return;
    const src = SOURCES[name];
    if (!src) return;
    try {
      const el = cache[name].cloneNode(true);
      el.volume = VOLUMES[name];
      el.play().catch(function () {});
    } catch (e) {}
  }

  document.addEventListener('click', function (e) {
    const btn = e.target.closest(
      '.btn-icon, .btn-lets-start, .btn-start-game, .btn-pause-circle, ' +
      '.btn-back-circle, .btn-back-top, .btn-pause-levels, .btn-pause-resume, ' +
      '.btn-win-play, .btn-win-restart, .btn-win-home, .btn-win-levels, ' +
      '.btn-modal-close, .quick-modal-ok, .quick-modal-close, ' +
      '.dropdown-item, .lb-tab, .subject-card'
    );
    if (!btn) return;
    play('click');
  }, true);

  window.addEventListener('soundToggled', function (e) {
    soundEnabled = !e.detail || e.detail.enabled !== false;
  });

  window.MMSfx = {
    play:     play,
    click:    function () { play('click'); },
    wrong:    function () { play('wrong'); },
    gameover: function () { play('gameover'); }
  };
})();