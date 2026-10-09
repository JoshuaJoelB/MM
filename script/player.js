/* ================================================================
   PLAYER.JS — nickname + per-player storage
   ----------------------------------------------------------------
   Every progress key is prefixed with the player's nickname:
     mm_{nickname}_unlocked_computer
     mm_{nickname}_completed_science
     mm_{nickname}_pointsTotal
     ...

   So logging in as "jojo" gives jojo's save, logging in as "anna"
   gives anna's save, and re-entering "jojo" restores jojo's data.
   ================================================================ */

(function () {
  'use strict';

  const NICKNAME_KEY = 'mm_player_nickname';
  const NICKNAME_MIN = 3;
  const NICKNAME_MAX = 12;

  function sanitizeNickname(raw) {
    if (typeof raw !== 'string') return '';
    return raw
      .replace(/[^A-Za-z0-9 ]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/^\s+/, '')
      .slice(0, NICKNAME_MAX);
  }

  function isValidNickname(name) {
    if (typeof name !== 'string') return false;
    const n = name.trim();
    if (n.length < NICKNAME_MIN || n.length > NICKNAME_MAX) return false;
    return /^[A-Za-z0-9 ]+$/.test(n);
  }

  function getNickname() {
    try { return localStorage.getItem(NICKNAME_KEY) || ''; } catch (e) { return ''; }
  }

  function setNickname(name) {
    const clean = sanitizeNickname(name).trim();
    if (!isValidNickname(clean)) return false;
    try { localStorage.setItem(NICKNAME_KEY, clean); return true; }
    catch (e) { return false; }
  }

  function clearNickname() {
    try { localStorage.removeItem(NICKNAME_KEY); } catch (e) {}
  }

  /* ---------------- PER-PLAYER STORAGE ---------------- */
  function pKey(key) {
    const name = getNickname();
    const prefix = name ? ('mm_' + name.toLowerCase() + '_') : 'mm_guest_';
    return prefix + key;
  }

  function pGet(key, fallback) {
    try {
      const v = localStorage.getItem(pKey(key));
      if (v === null) return (fallback !== undefined) ? fallback : null;
      return v;
    } catch (e) { return (fallback !== undefined) ? fallback : null; }
  }

  function pSet(key, value) {
    try { localStorage.setItem(pKey(key), String(value)); } catch (e) {}
  }

  function pRemove(key) {
    try { localStorage.removeItem(pKey(key)); } catch (e) {}
  }

  function pJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(pKey(key));
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) { return fallback; }
  }

  function pSetJSON(key, value) {
    try { localStorage.setItem(pKey(key), JSON.stringify(value)); } catch (e) {}
  }

  /* Remove ALL keys for a specific nickname */
  function wipePlayerData(nickname) {
    if (!nickname) return;
    const prefix = 'mm_' + nickname.toLowerCase() + '_';
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf(prefix) === 0) keys.push(k);
      }
      keys.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) {}
  }

  window.MMPlayer = {
    sanitizeNickname: sanitizeNickname,
    isValidNickname:  isValidNickname,
    getNickname:      getNickname,
    setNickname:      setNickname,
    clearNickname:    clearNickname,
    pKey:             pKey,
    pGet:             pGet,
    pSet:             pSet,
    pRemove:          pRemove,
    pJSON:            pJSON,
    pSetJSON:         pSetJSON,
    wipePlayerData:   wipePlayerData,
    NICKNAME_MIN:     NICKNAME_MIN,
    NICKNAME_MAX:     NICKNAME_MAX
  };
})();