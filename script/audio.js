/* ================================================================
   AUDIO.JS — Background music via HTMLAudioElement (GitHub-Pages safe)
   - Streams instead of buffering the whole file
   - Remembers playback position across pages
   - Respects the "Background Music" toggle
   - Cleared on LOGOUT via MMBgMusic.stop()
   ================================================================ */

(function () {
  'use strict';

  /* ---------- Path ---------- */
  var inGameplayFolder = /\/Gameplay\//i.test(window.location.pathname);
  var base = inGameplayFolder ? '../' : '';
  // ✅ Encode the space in "bg music1.mp3" so GitHub Pages resolves it
  var SRC  = base + 'Assets/sound/' + encodeURIComponent('bg music1') + '.mp3';

  /* ---------- Session flags ---------- */
  var POS_KEY   = 'mm_music_pos';
  var STATE_KEY = 'mm_logged_in';

  var loggedIn = sessionStorage.getItem(STATE_KEY) === '1';
  if (!loggedIn) {
    try { sessionStorage.removeItem(POS_KEY); } catch (e) {}
    try { sessionStorage.setItem(STATE_KEY, '1'); } catch (e) {}
  }

  // Respect the music toggle
  var musicEnabled = localStorage.getItem('musicEnabled') !== 'false';
  if (!musicEnabled) {
    // Still expose the API so the toggle can turn it on later
    window.MMBgMusic = {
      play:  function () {},
      pause: function () {},
      stop:  function () {},
      isPlaying: function () { return false; }
    };
    return;
  }

  var TARGET_VOLUME = 0.35;
  var startOffset   = parseFloat(sessionStorage.getItem(POS_KEY) || '0') || 0;

  /* ---------- Create a single, persistent audio element ---------- */
  var audio = new Audio();
  audio.src = SRC;
  audio.loop = true;              // native loop — no gap
  audio.preload = 'auto';         // start streaming right away
  audio.volume = 0;               // fade in from silent
  audio.crossOrigin = 'anonymous'; // safe on GitHub Pages

  var isPlaying = false;
  var unlocked  = false;

  /* ---------- Save position periodically (survives page nav) ---------- */
  function savePosition() {
    try {
      if (!isNaN(audio.currentTime) && audio.currentTime > 0) {
        sessionStorage.setItem(POS_KEY, String(audio.currentTime));
      }
    } catch (e) {}
  }
  window.addEventListener('beforeunload', savePosition);
  window.addEventListener('pagehide',     savePosition);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') savePosition();
  });

  /* ---------- Restore position once metadata is ready ---------- */
  audio.addEventListener('loadedmetadata', function () {
    try {
      if (startOffset > 0 && startOffset < (audio.duration || 9999)) {
        audio.currentTime = startOffset;
      }
    } catch (e) {}
  });

  /* ---------- Fade helpers ---------- */
  function fadeTo(targetVolume, ms) {
    var steps = 20;
    var step = ms / steps;
    var delta = (targetVolume - audio.volume) / steps;
    var i = 0;
    var t = setInterval(function () {
      i++;
      var v = audio.volume + delta;
      if (v > 1) v = 1;
      if (v < 0) v = 0;
      audio.volume = v;
      if (i >= steps) clearInterval(t);
    }, step);
  }

  /* ---------- Playback API ---------- */
  function play() {
    if (isPlaying) return;
    var p = audio.play();
    if (p && typeof p.then === 'function') {
      p.then(function () {
        isPlaying = true;
        fadeTo(TARGET_VOLUME, 600);
      }).catch(function (err) {
        // Autoplay blocked — wait for a gesture
        console.log('[BGM] play blocked:', err && err.name);
      });
    } else {
      isPlaying = true;
      fadeTo(TARGET_VOLUME, 600);
    }
  }

  function pause(fadeMs) {
    if (!isPlaying) return;
    fadeTo(0, fadeMs || 400);
    setTimeout(function () {
      audio.pause();
      isPlaying = false;
    }, (fadeMs || 400) + 60);
  }

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

  /* ---------- First-gesture unlock (autoplay policy) ---------- */
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    // Prime the element with a silent play/pause so later calls work
    var p = audio.play();
    if (p && typeof p.then === 'function') {
      p.then(function () {
        audio.pause();
        play();
      }).catch(function () {
        play();
      });
    } else {
      play();
    }
    document.removeEventListener('click',      unlock);
    document.removeEventListener('keydown',    unlock);
    document.removeEventListener('touchstart', unlock);
  }
  document.addEventListener('click',      unlock, { passive: true });
  document.addEventListener('keydown',    unlock, { passive: true });
  document.addEventListener('touchstart', unlock, { passive: true });

  /* ---------- React to Settings toggle ---------- */
  function setEnabled(enabled) {
    musicEnabled = enabled;
    if (enabled) {
      audio.currentTime = audio.currentTime || startOffset || 0;
      play();
    } else {
      savePosition();
      pause(400);
    }
  }

  window.addEventListener('musicToggled', function (e) {
    setEnabled(!e.detail || e.detail.enabled !== false);
  });
  window.addEventListener('storage', function (e) {
    if (e.key === 'musicEnabled') setEnabled(e.newValue !== 'false');
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