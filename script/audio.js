/* ================================================================
   AUDIO.JS — Background music (autoplay-friendly)
   ----------------------------------------------------------------
   Strategy:
     1. Try to autoplay immediately (works for returning visitors)
     2. If blocked, retry on ANY activity (mousemove, scroll, hover,
        touch, click, keydown, focus, visibility change)
     3. Once unlocked, remember it in sessionStorage so the NEXT
        page can autoplay without waiting for a click.
   ================================================================ */

(function () {
  'use strict';

  const inGameplay = /\/Gameplay\//i.test(window.location.pathname);
  const base = inGameplay ? '../' : '';

  // Filename variants — first one that works is used
  const BG_VARIANTS = [
    base + 'Assets/sound/bgmusic.mp3',
    base + 'Assets/sound/bgmusic1.mp3',
    base + 'Assets/sound/bg_music.mp3',
    base + 'Assets/sound/bg_music1.mp3',
    base + 'Assets/sound/BGM.mp3',
    base + 'Assets/sound/backgroundmusic.mp3',
    base + 'Assets/sound/' + encodeURIComponent('bg music1') + '.mp3'
  ];

  let musicEnabled = localStorage.getItem('musicEnabled') !== 'false';
  let isPlaying = false;

  // Was audio already unlocked this session (from a prior page)?
  const UNLOCK_KEY = 'mm_audio_unlocked';
  let audioUnlocked = sessionStorage.getItem(UNLOCK_KEY) === '1';

  const audio = new Audio();
  audio.loop    = true;
  audio.preload = 'auto';
  audio.volume  = 0;

  // ---------- Pick working BGM file ----------
  let srcReady = false;
  (function tryVariant(i) {
    if (i >= BG_VARIANTS.length) {
      console.warn('[BGM] No BGM file found. Add one of:', BG_VARIANTS);
      return;
    }
    const probe = new Audio();
    probe.preload = 'auto';
    probe.addEventListener('canplaythrough', function () {
      if (srcReady) return;
      srcReady = true;
      audio.src = BG_VARIANTS[i];
      console.log('[BGM] Using:', BG_VARIANTS[i]);
      // Try to autoplay immediately — may fail if never interacted
      attemptAutoplay();
    }, { once: true });
    probe.addEventListener('error', function () { tryVariant(i + 1); }, { once: true });
    probe.src = BG_VARIANTS[i];
    probe.load();
  })(0);

  // ---------- Fade helpers ----------
  function fadeIn() {
    let v = audio.volume;
    const target = 0.35;
    if (v >= target) return;
    const step = setInterval(function () {
      v += 0.02;
      if (v >= target) { audio.volume = target; clearInterval(step); return; }
      audio.volume = v;
    }, 30);
  }
  function fadeOut(cb) {
    let v = audio.volume;
    const step = setInterval(function () {
      v -= 0.04;
      if (v <= 0) {
        audio.volume = 0;
        clearInterval(step);
        audio.pause();
        if (cb) cb();
        return;
      }
      audio.volume = v;
    }, 30);
  }

  // ---------- Play / pause ----------
  function play() {
    if (isPlaying || !musicEnabled || !audio.src) return Promise.resolve(false);

    const p = audio.play();
    if (!p || typeof p.then !== 'function') {
      // Very old browser — treat as success
      isPlaying = true;
      fadeIn();
      return Promise.resolve(true);
    }

    return p.then(function () {
      isPlaying = true;
      fadeIn();
      console.log('[BGM] ▶ Playing');
      return true;
    }).catch(function (err) {
      console.log('[BGM] Blocked:', err && err.name);
      return false;
    });
  }

  function pause() {
    if (!isPlaying) return;
    fadeOut(function () { isPlaying = false; });
  }

  // ---------- AUTOPLAY STRATEGY ----------
  // Step 1: try to play immediately (silent attempt)
  function attemptAutoplay() {
    if (!musicEnabled) return;
    play().then(function (ok) {
      if (ok) markUnlocked();
    });
  }

  // Step 2: on ANY user activity, retry
  function markUnlocked() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    try { sessionStorage.setItem(UNLOCK_KEY, '1'); } catch (e) {}
  }

  function tryUnlockFromActivity() {
    if (isPlaying) return;
    // Prime a silent context to satisfy autoplay policy
    if (!musicEnabled) return;
    play().then(function (ok) {
      if (ok) {
        markUnlocked();
        // Remove listeners — we succeeded
        removeAllUnlockListeners();
      }
    });
  }

  const unlockEvents = ['click', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel', 'pointerdown', 'focus'];
  function addAllUnlockListeners() {
    unlockEvents.forEach(function (evt) {
      document.addEventListener(evt, tryUnlockFromActivity, { passive: true });
    });
    window.addEventListener('focus', tryUnlockFromActivity);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') tryUnlockFromActivity();
    });
  }
  function removeAllUnlockListeners() {
    unlockEvents.forEach(function (evt) {
      document.removeEventListener(evt, tryUnlockFromActivity);
    });
    window.removeEventListener('focus', tryUnlockFromActivity);
  }

  // Add unlock listeners right away — they run on first activity
  addAllUnlockListeners();

  // Step 3: If we were already unlocked this session, autoplay right now
  if (audioUnlocked) {
    // Small delay so the source is ready
    setTimeout(function () { attemptAutoplay(); }, 200);
  }

  // Step 4: Try again after the page fully loads — sometimes autoplay
  //         is allowed if the user has visited before
  window.addEventListener('load', function () {
    setTimeout(function () {
      if (!isPlaying && musicEnabled) attemptAutoplay();
    }, 300);
  });

  // Step 5: Belt-and-suspenders — try every 1.5s up to 10 tries if
  //         the browser is being extra strict
  let retries = 0;
  const retryInterval = setInterval(function () {
    if (isPlaying || !musicEnabled || retries++ > 10) {
      clearInterval(retryInterval);
      return;
    }
    attemptAutoplay();
  }, 1500);

  // ---------- Settings toggle ----------
  window.addEventListener('musicToggled', function (e) {
    musicEnabled = !e.detail || e.detail.enabled !== false;
    if (musicEnabled) {
      play().then(function (ok) { if (ok) markUnlocked(); });
    } else {
      pause();
    }
  });
  window.addEventListener('storage', function (e) {
    if (e.key === 'musicEnabled') {
      musicEnabled = e.newValue !== 'false';
      if (musicEnabled) {
        play().then(function (ok) { if (ok) markUnlocked(); });
      } else {
        pause();
      }
    }
  });

  // ---------- Save playback position across pages ----------
  function savePosition() {
    try {
      if (!isNaN(audio.currentTime) && audio.currentTime > 0) {
        sessionStorage.setItem('mm_music_pos', String(audio.currentTime));
      }
    } catch (e) {}
  }
  window.addEventListener('beforeunload', savePosition);
  window.addEventListener('pagehide', savePosition);

  // Restore position when metadata loads
  const startOffset = parseFloat(sessionStorage.getItem('mm_music_pos') || '0') || 0;
  audio.addEventListener('loadedmetadata', function () {
    try {
      if (startOffset > 0 && startOffset < (audio.duration || 9999)) {
        audio.currentTime = startOffset;
      }
    } catch (e) {}
  });

  // ---------- Public API ----------
  window.MMBgMusic = {
    play:  play,
    pause: pause,
    stop:  function () {
      audio.pause();
      audio.currentTime = 0;
      isPlaying = false;
      try {
        sessionStorage.removeItem('mm_music_pos');
        sessionStorage.removeItem(UNLOCK_KEY);
      } catch (e) {}
    },
    isPlaying: function () { return isPlaying; }
  };

  console.log('[BGM] Ready — will autoplay when the browser allows it.');
})();