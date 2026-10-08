/* ================================================================
   PLAYER.JS — nickname storage only
   ----------------------------------------------------------------
   The leaderboard lives in leaderboard.js.
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

  window.MMPlayer = {
    sanitizeNickname: sanitizeNickname,
    isValidNickname:  isValidNickname,
    getNickname:      getNickname,
    setNickname:      setNickname,
    clearNickname:    clearNickname,
    NICKNAME_MIN:     NICKNAME_MIN,
    NICKNAME_MAX:     NICKNAME_MAX
  };
})();