/* ================================================================
   AUDIO.JS — Background music (native <audio> streaming)
   - Streams instead of buffering — starts instantly
   - URL-encodes spaces in filenames (GitHub Pages safe)
   - Remembers playback position across pages
   - Respects the "Background Music" toggle
   - Cleared on LOGOUT via MMBgMusic.stop()
   ================================================================ */

(function () {
  'use strict';

  /* ---------- Detect folder depth ---------- */
  const inGameplay = /\/Gameplay\//i.test(window.location.pathname);
  const base = inGameplay ? '../' : '';

  // ✅ Encode the space in "bg music1.mp3" — critical for GitHub Pages
  const SRC = base + 'Assets/sound/' + encodeURIComponent('bg music1') + '.mp3';

  /* ---------- Session flags ---------- */
  const POS_KEY   = 'mm_music_pos';
  const STATE_KEY = 'mm_logged_in';

  const loggedIn = sessionStorage.getItem(STATE_KEY) === '1';
  if (!loggedIn) {
    try { sessionStorage.removeItem(POS_KEY); } catch (e) {}
    try { sessionStorage.setItem(STATE_KEY, '1'); } catch (e) {}
  }

  /* ---------- Respect the music toggle ---------- */
  let musicEnabled = localStorage.getItem('musicEnabled') !== 'false';

  /* ---------- Create a persistent audio element ---------- */
  const audio = new Audio();
  audio.src      = SRC;
  audio.loop     = true;
  audio.preload  = 'auto';
  audio.volume   = 0;   // start silent, fade in
  audio.crossOrigin = 'anonymous';

  let isPlaying   = false;
  let unlocked    = false;
  let startOffset = parseFloat(sessionStorage.getItem(POS_KEY) || '0') || 0;

  const TARGET_VOLUME = 0.35;

  /* ---------- Restore playback position ---------- */
  audio.addEventListener('loadedmetadata', function () {
    try {
      if (startOffset > 0 && startOffset < (audio.duration || 9999)) {
        audio.currentTime = startOffset;
      }
    } catch (e) {}
  });

  /* ---------- Fade volume ---------- */
  function fadeTo(target, ms) {
    const steps = 20;
    const stepMs = ms / steps;
    const delta = (target - audio.volume) / steps;
    let i = 0;
    const t = setInterval(function () {
      i++;
      let v = audio.volume + delta;
      if (v > 1) v = 1;
      if (v < 0) v = 0;
      audio.volume = v;
      if (i >= steps) clearInterval(t);
    }, stepMs);
  }

  /* ---------- Play ---------- */
  function play() {
    if (isPlaying) return;
    if (!musicEnabled) return;

    const p = audio.play();
    if (p && typeof p.then === 'function') {
      p.then(function () {
        isPlaying = true;
        fadeTo(TARGET_VOLUME, 600);
        console.log('[BGM] ▶ Playing');
      }).catch(function (err) {
        console.log('[BGM] play blocked:', err && err.name);
      });
    } else {
      isPlaying = true;
      fadeTo(TARGET_VOLUME, 600);
    }
  }

  /* ---------- Pause ---------- */
  function pause(fadeMs) {
    if (!isPlaying) return;
    fadeTo(0, fadeMs || 400);
    setTimeout(function () {
      audio.pause();
      isPlaying = false;
    }, (fadeMs || 400) + 60);
  }

  /* ---------- Stop (hard) ---------- */
  function stop() {
    try { audio.pause(); } catch (e) {}
    try { audio.currentTime = 0; } catch (e) {}
    audio.volume = 0;
    isPlaying = false;
    try {
      sessionStorage.removeItem(POS_KEY);
      sessionStorage.removeItem(STATE_KEY);
    } catch (e) {}
  }

  /* ---------- Save position ---------- */
  function savePosition() {
    try {
      if (!isNaN(audio.currentTime) && audio.currentTime > 0) {
        sessionStorage.setItem(POS_KEY, String(audio.currentTime));
      }
    } catch (e) {}
  }
  window.addEventListener('beforeunload', savePosition);
  window.addEventListener('pagehide', savePosition);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') savePosition();
  });

  /* ---------- First-gesture unlock ---------- */
  function unlock() {
    if (unlocked) return;
    unlocked = true;

    const p = audio.play();
    if (p && typeof p.then === 'function') {
      p.then(function () {
        audio.pause();
        if (musicEnabled) play();
      }).catch(function () {
        if (musicEnabled) play();
      });
    } else {
      audio.pause();
      if (musicEnabled) play();
    }

    document.removeEventListener('click',      unlock);
    document.removeEventListener('keydown',    unlock);
    document.removeEventListener('touchstart', unlock);
  }
  document.addEventListener('click',      unlock, { passive: true });
  document.addEventListener('keydown',    unlock, { passive: true });
  document.addEventListener('touchstart', unlock, { passive: true });

  /* ---------- Settings toggle ---------- */
  window.addEventListener('musicToggled', function (e) {
    musicEnabled = !e.detail || e.detail.enabled !== false;
    if (musicEnabled) play();
    else { savePosition(); pause(400); }
  });
  window.addEventListener('storage', function (e) {
    if (e.key === 'musicEnabled') {
      musicEnabled = e.newValue !== 'false';
      if (musicEnabled) play();
      else { savePosition(); pause(400); }
    }
  });

  /* ---------- Public API ---------- */
  window.MMBgMusic = {
    play:  play,
    pause: function () { pause(400); },
    stop:  stop,
    isPlaying: function () { return isPlaying; },
    audio: audio
  };
})();