/* ================================================================
   AUDIO.JS — Continuous background music via Web Audio API
   ----------------------------------------------------------------
   - Loads Assets/sound/bg music1.mp3 into an AudioBuffer
   - Plays it on a loop with gain (volume) control
   - Saves playback position in sessionStorage on page unload
   - Resumes from that position on the next page → feels continuous
   - Cleared on LOGOUT (via MMBgMusic.stop())
   - Respects the "Background Music" toggle in Settings
   ================================================================ */

(function () {
  'use strict';

  /* ---------- Path ---------- */
  var inGameplayFolder = /\/Gameplay\//i.test(window.location.pathname);
  var base = inGameplayFolder ? '../' : '';
  var SRC  = base + 'Assets/sound/bg music1.mp3';

  /* ---------- Session flags ---------- */
  var POS_KEY   = 'mm_music_pos';
  var STATE_KEY = 'mm_logged_in';

  // Detect fresh session (post-logout)
  var loggedIn = sessionStorage.getItem(STATE_KEY) === '1';
  if (!loggedIn) {
    try { sessionStorage.removeItem(POS_KEY); } catch (e) {}
    try { sessionStorage.setItem(STATE_KEY, '1'); } catch (e) {}
  }

  // Respect the music toggle
  var musicEnabled = localStorage.getItem('musicEnabled') !== 'false';
  if (!musicEnabled) return;

  /* ---------- AudioContext setup ---------- */
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;                      // very old browser — skip silently

  var ctx          = null;
  var buffer       = null;
  var sourceNode   = null;
  var gainNode     = null;
  var startedAt    = 0;                        // ctx.currentTime when playback began
  var startOffset  = parseFloat(sessionStorage.getItem(POS_KEY) || '0') || 0;
  var isPlaying    = false;
  var loading      = false;

  var TARGET_VOLUME = 0.35;

  function ensureCtx() {
    if (ctx) return ctx;
    try {
      ctx = new AudioCtx();
      gainNode = ctx.createGain();
      gainNode.gain.value = 0;
      gainNode.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }

  /* ---------- Load the MP3 as an ArrayBuffer → AudioBuffer ---------- */
  function loadBuffer() {
    if (buffer || loading) return;
    loading = true;

    fetch(SRC)
      .then(function (r) { return r.arrayBuffer(); })
      .then(function (ab) {
        var c = ensureCtx();
        if (!c) return;
        // Safari requires the callback form; Chrome returns a Promise.
        var p = c.decodeAudioData(
          ab,
          function (buf) { buffer = buf; loading = false; onBufferReady(); },
          function ()   { loading = false; }
        );
        if (p && typeof p.then === 'function') {
          p.then(function (buf) { buffer = buf; loading = false; onBufferReady(); })
           .catch(function () { loading = false; });
        }
      })
      .catch(function () { loading = false; });
  }

  function onBufferReady() {
    // If a user gesture already happened, start now
    if (ctx && ctx.state === 'running') {
      play();
    }
  }

  /* ---------- Playback ---------- */
  function play() {
    if (!buffer) { loadBuffer(); return; }
    var c = ensureCtx();
    if (!c) return;
    if (isPlaying) return;

    // Resume the context (needed after user gesture)
    if (c.state === 'suspended') {
      c.resume().catch(function () {});
    }

    // Determine the loop offset (clamp to buffer length)
    var dur = buffer.duration;
    if (startOffset >= dur) startOffset = 0;

    // Create source node
    sourceNode = c.createBufferSource();
    sourceNode.buffer = buffer;
    sourceNode.loop = true;
    sourceNode.loopStart = 0;
    sourceNode.loopEnd = dur;
    sourceNode.connect(gainNode);

    // Start at offset
    sourceNode.start(0, startOffset);
    startedAt = c.currentTime;

    // Fade in
    var now = c.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(TARGET_VOLUME, now + 0.6);

    isPlaying = true;

    // When it ends (won't happen with loop=true, but be safe)
    sourceNode.onended = function () {
      isPlaying = false;
    };
  }

  function pause(fade) {
    if (!isPlaying || !ctx) return;
    var now = ctx.currentTime;
    var fadeTime = (typeof fade === 'number') ? fade : 0.4;
    try {
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);
    } catch (e) {}

    var node = sourceNode;
    var stopAt = now + fadeTime + 0.05;
    try {
      node.stop(stopAt);
    } catch (e) {}

    sourceNode = null;
    isPlaying = false;
  }

  function stop() {
    // Hard stop + reset
    try {
      if (sourceNode) sourceNode.stop(0);
    } catch (e) {}
    sourceNode = null;
    isPlaying = false;
    startOffset = 0;
    try {
      sessionStorage.removeItem(POS_KEY);
      sessionStorage.removeItem(STATE_KEY);
    } catch (e) {}
    try { if (ctx) ctx.close(); } catch (e) {}
  }

  /* ---------- Position tracking ---------- */
  function currentPosition() {
    if (!isPlaying || !ctx || !buffer) {
      return startOffset;
    }
    var elapsed = ctx.currentTime - startedAt;
    var dur = buffer.duration;
    var pos = (startOffset + elapsed) % dur;
    return pos;
  }

  function savePosition() {
    try {
      if (isPlaying && buffer) {
        sessionStorage.setItem(POS_KEY, String(currentPosition()));
      }
    } catch (e) {}
  }

  window.addEventListener('beforeunload', savePosition);
  window.addEventListener('pagehide',     savePosition);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') savePosition();
  });

  /* ---------- First-gesture unlock (browser autoplay policy) ---------- */
  function onFirstGesture() {
    var c = ensureCtx();
    if (!c) return;
    // Resume context + start playback if buffer is ready
    if (c.state === 'suspended') {
      c.resume().then(function () {
        if (buffer) play();
      }).catch(function () {});
    } else if (buffer) {
      play();
    } else {
      // buffer still loading — will auto-start via onBufferReady
    }

    document.removeEventListener('click',      onFirstGesture);
    document.removeEventListener('keydown',    onFirstGesture);
    document.removeEventListener('touchstart', onFirstGesture);
  }
  document.addEventListener('click',      onFirstGesture, { passive: true });
  document.addEventListener('keydown',    onFirstGesture, { passive: true });
  document.addEventListener('touchstart', onFirstGesture, { passive: true });

  /* ---------- Kick off buffer load immediately ---------- */
  loadBuffer();

  /* ---------- React to Settings toggle ---------- */
  window.addEventListener('musicToggled', function (e) {
    var enabled = !e.detail || e.detail.enabled !== false;
    musicEnabled = enabled;
    if (enabled) {
      // Save current offset, then restart cleanly
      startOffset = currentPosition();
      play();
    } else {
      // Remember position, then fade out
      startOffset = currentPosition();
      pause(0.4);
      try { sessionStorage.setItem(POS_KEY, String(startOffset)); } catch (err) {}
    }
  });

  window.addEventListener('storage', function (e) {
    if (e.key === 'musicEnabled') {
      var enabled = e.newValue !== 'false';
      musicEnabled = enabled;
      if (enabled) {
        startOffset = currentPosition();
        play();
      } else {
        startOffset = currentPosition();
        pause(0.4);
      }
    }
  });

  /* ---------- Public API ---------- */
  window.MMBgMusic = {
    play:  play,
    pause: function () { pause(0.4); },
    stop:  stop,
    isPlaying: function () { return isPlaying; },
    get context() { return ctx; },
    get buffer()  { return buffer; }
  };
})();