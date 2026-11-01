/* ================================================================
   SFX.JS — Audio Effects (Preloaded Audio Files + Web Audio Synth Fallback)
   ----------------------------------------------------------------
   Instant SFX for button clicks, wrong match, gameover, and win.
   Zero delay, zero dependencies, works on mobile & Vercel.
   ================================================================ */

(function () {
  'use strict';

  const inGameplayFolder = /\/Gameplay\//i.test(window.location.pathname);
  const base = inGameplayFolder ? '../' : '';

  let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
  let audioCtx = null;
  let unlocked = false;

  const SFX_FILES = {
    click:    base + 'Assets/sound/button click2.mp3',
    wrong:    base + 'Assets/sound/wrong card4.mp3',
    gameover: base + 'Assets/sound/game over3.mp3',
    win:      base + 'Assets/sound/mm win.mp3'
  };

  const audioCache = {};

  // Pre-instantiate audio objects
  try {
    for (const key in SFX_FILES) {
      const a = new Audio();
      a.preload = 'auto';
      a.src = SFX_FILES[key];
      audioCache[key] = a;
    }
  } catch (e) {}

  function getCtx() {
    if (audioCtx) return audioCtx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try { audioCtx = new Ctx(); } catch (e) { return null; }
    return audioCtx;
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    const ctx = getCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(function(){});
    document.removeEventListener('click', unlock);
    document.removeEventListener('keydown', unlock);
    document.removeEventListener('touchstart', unlock);
  }
  document.addEventListener('click', unlock, { passive: true });
  document.addEventListener('keydown', unlock, { passive: true });
  document.addEventListener('touchstart', unlock, { passive: true });

  // --- Synth helpers ---
  function tone(freq, duration, type, volume) {
    if (!soundEnabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(function(){});

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume || 0.15, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.05);
  }

  function sweep(f1, f2, duration, type, volume) {
    if (!soundEnabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(function(){});

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(f1, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(f2, ctx.currentTime + duration);

    gain.gain.setValueAtTime(volume || 0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.05);
  }

  function playSynthFallback(name) {
    switch (name) {
      case 'click':
        tone(880, 0.08, 'triangle', 0.8);
        break;
      case 'wrong':
        sweep(300, 120, 0.35, 'sawtooth', 0.8);
        break;
      case 'gameover':
        tone(220, 0.25, 'square', 0.8);
        setTimeout(function () { tone(165, 0.35, 'square', 0.8); }, 200);
        setTimeout(function () { tone(110, 0.55, 'square', 0.8); }, 480);
        break;
      case 'win':
        tone(523.25, 0.15, 'sine', 0.8);
        setTimeout(function () { tone(659.25, 0.15, 'sine', 0.8); }, 120);
        setTimeout(function () { tone(783.99, 0.15, 'sine', 0.8); }, 240);
        setTimeout(function () { tone(1046.50, 0.4, 'triangle', 0.9); }, 360);
        break;
    }
  }

  // --- Sound bank ---
  function play(name) {
    if (!soundEnabled) return;

    const audio = audioCache[name];
    if (audio) {
      try {
        const soundClone = audio.cloneNode();
        soundClone.volume = (name === 'win') ? 1.0 : 0.8;
        const p = soundClone.play();
        if (p && typeof p.then === 'function') {
          p.catch(function () {
            playSynthFallback(name);
          });
        }
        return;
      } catch (e) {}
    }
    playSynthFallback(name);
  }

  // --- Global click sound on buttons ---
  document.addEventListener('click', function (e) {
    const btn = e.target.closest(
      '.btn-icon, .btn-lets-start, .btn-start-game, .btn-pause-circle, ' +
      '.btn-back-circle, .btn-back-top, .btn-pause-levels, .btn-pause-resume, ' +
      '.btn-win-play, .btn-win-restart, .btn-win-home, .btn-win-levels, ' +
      '.btn-modal-close, .quick-modal-ok, .quick-modal-close, ' +
      '.dropdown-item, .lb-tab, .subject-card, .island-link, ' +
      '.btn-play-now, .btn-back-home'
    );
    if (!btn) return;
    play('click');
  }, true);

  // --- Settings toggle ---
  window.addEventListener('soundToggled', function (e) {
    soundEnabled = !e.detail || e.detail.enabled !== false;
  });
  window.addEventListener('storage', function (e) {
    if (e.key === 'soundEnabled') soundEnabled = e.newValue !== 'false';
  });

  // --- Public API ---
  window.MMSfx = {
    play:     play,
    click:    function () { play('click'); },
    wrong:    function () { play('wrong'); },
    gameover: function () { play('gameover'); },
    win:      function () { play('win'); },
    tone:     tone,
    sweep:    sweep
  };

  console.log('[SFX] Ready with audio files + Web Audio synth fallback.');
})();
