/* ================================================================
   PLAYER.JS — nickname storage + local leaderboard
   ----------------------------------------------------------------
   ✅ No personal data collected (no real name, email, age, etc.)
   ✅ Everything stored in localStorage — nothing sent to a server
   ✅ Complies with the Philippine Data Privacy Act (DPA) approach
      for child-oriented apps by minimising data collection.
   ================================================================ */

(function () {
  'use strict';

  const NICKNAME_KEY    = 'mm_player_nickname';
  const LEADERBOARD_KEY = 'mm_leaderboard';

  const NICKNAME_MIN = 3;
  const NICKNAME_MAX = 12;
  const MAX_ENTRIES  = 20;

  /* ---------------- NICKNAME ---------------- */
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

  /* ---------------- LEADERBOARD ---------------- */
  function readLeaderboard() {
    try {
      const raw = localStorage.getItem(LEADERBOARD_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (e) {
        return e && typeof e.nickname === 'string' && typeof e.score === 'number';
      });
    } catch (e) { return []; }
  }
  function writeLeaderboard(list) {
    try { localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function sortEntries(a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return (a.time || 0) - (b.time || 0);
  }
  function getLeaderboard(limit) {
    const list = readLeaderboard().sort(sortEntries);
    return typeof limit === 'number' ? list.slice(0, limit) : list;
  }
  function saveScore(entry) {
    if (!entry || typeof entry.score !== 'number') return false;
    const name = sanitizeNickname(entry.nickname || getNickname()).trim();
    if (!isValidNickname(name)) return false;

    const list = readLeaderboard();
    list.push({
      nickname: name,
      score:    Math.max(0, Math.round(entry.score)),
      stars:    Math.max(0, Math.min(3, Math.round(entry.stars || 0))),
      time:     Math.max(0, Math.round(entry.time || 0)),
      date:     new Date().toISOString().slice(0, 10)
    });
    list.sort(sortEntries);
    writeLeaderboard(list.slice(0, MAX_ENTRIES));
    return true;
  }
  function clearLeaderboard() {
    try { localStorage.removeItem(LEADERBOARD_KEY); } catch (e) {}
  }

  /* ---------------- PUBLIC API ---------------- */
  window.MMPlayer = {
    sanitizeNickname: sanitizeNickname,
    isValidNickname:  isValidNickname,
    getNickname:      getNickname,
    setNickname:      setNickname,
    clearNickname:    clearNickname,
    getLeaderboard:   getLeaderboard,
    saveScore:        saveScore,
    clearLeaderboard: clearLeaderboard,
    NICKNAME_MIN:     NICKNAME_MIN,
    NICKNAME_MAX:     NICKNAME_MAX
  };
})();