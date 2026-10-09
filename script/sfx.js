/* ================================================================
   SFX.JS — Sound effects (Web Audio, preloaded, instant)
   ----------------------------------------------------------------
   Preloads all SFX buffers, so clicking a button plays the sound
   instantly with no loading delay and no autoplay blocking.
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

  var DEFAULT_VOLUMES = {
    click:    0.55,
    wrong:    0.70,
    gameover: 0.85
  };

  /* ---------- Respect the sound toggle ---------- */
  var soundEnabled = localStorage.getItem('soundEnabled') !== 'false';

  /* ---------- Web Audio setup ---------- */
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;                    // very old browser → silent fail

  var ctx = null;
  var buffers = {};                         // name -> AudioBuffer
  var bufferPromises = {};                  // name -> Promise

  function getCtx() {
    if (!ctx) {
      try { ctx = new AudioCtx(); } catch (e) { ctx = null; }
    }
    return ctx;
  }

  /* ---------- Load a buffer once, cache it ---------- */
  function loadBuffer(name) {
    if (buffers[name]) return Promise.resolve(buffers[name]);
    if (bufferPromises[name]) return bufferPromises[name];

    var c = getCtx();
    if (!c) return Promise.resolve(null);

    bufferPromises[name] = fetch(SOURCES[name])
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.arrayBuffer();
      })
      .then(function (ab) {
        return new Promise(function (resolve) {
          // Older Safari needs the callback form
          var p = c.decodeAudioData(ab, resolve, function () { resolve(null); });
          if (p && typeof p.then === 'function') {
            p.then(resolve).catch(function () { resolve(null); });
          }
        });
      })
      .then(function (buf) {
        if (buf) buffers[name] = buf;
        return buf;
      })
      .catch(function (err) {
        console.warn('[SFX] Failed to load', name, err);
        return null;
      });

    return bufferPromises[name];
  }

  /* ---------- Instant playback from cache ---------- */
  function playBuffer(name, volume) {
    var c = getCtx();
    if (!c || !buffers[name]) return false;

    // Resume if suspended (autoplay policy)
    if (c.state === 'suspended') {
      c.resume().catch(function () {});
    }

    try {
      var src  = c.createBufferSource();
      var gain = c.createGain();
      src.buffer = buffers[name];
      gain.gain.value = volume;
      src.connect(gain);
      gain.connect(c.destination);
      src.start(0);
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ---------- Fallback (very rare) ---------- */
  function playFallback(name, volume) {
    try {
      var a = new Audio(SOURCES[name]);
      a.volume = volume;
      a.play().catch(function () {});
    } catch (e) {}
  }

  /* ---------- Public play ---------- */
  function play(name, opts) {
    if (!soundEnabled) return;
    if (!SOURCES[name]) return;

    var vol = (opts && typeof opts.volume === 'number')
      ? opts.volume
      : (DEFAULT_VOLUMES[name] || 0.7);

    if (playBuffer(name, vol)) return;

    // Not cached yet → load it now, and play fallback this time
    loadBuffer(name);
    playFallback(name, vol);
  }

  /* ---------- Preload ALL buffers on init ---------- */
  function preloadAll() {
    Object.keys(SOURCES).forEach(loadBuffer);
  }
  preloadAll();

  /* ---------- Resume context on first user gesture ---------- */
  function unlockOnGesture() {
    var c = getCtx();
    if (c && c.state === 'suspended') {
      c.resume().catch(function () {});
    }
    document.removeEventListener('click',      unlockOnGesture);
    document.removeEventListener('keydown',    unlockOnGesture);
    document.removeEventListener('touchstart', unlockOnGesture);
  }
  document.addEventListener('click',      unlockOnGesture, { passive: true });
  document.addEventListener('keydown',    unlockOnGesture, { passive: true });
  document.addEventListener('touchstart', unlockOnGesture, { passive: true });

  /* ---------- Global button-click sound ---------- */
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
    '.reset-confirm-ok',
    '.island-link',
    '.subject-card',
    '.dropdown-toggle'
  ].join(',');

  document.addEventListener('click', function (e) {
    var btn = e.target.closest(CLICK_SELECTORS);
    if (!btn) return;

    // 1️⃣ Play click sound immediately
    play('click', { volume: 0.55 });

    // 2️⃣ If it's an <a> that navigates, delay navigation slightly
    var link = e.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href');
    if (!href) return;
    if (href.charAt(0) === '#') return;
    if (href.indexOf('javascript:') === 0) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    if (e.button !== 0) return;

    // Only delay same-tab navigations
    e.preventDefault();
    setTimeout(function () {
      window.location.href = href;
    }, 140);   // enough for the sound to start, unnoticeable to the player
  }, true);

  /* ---------- React to Settings toggle ---------- */
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