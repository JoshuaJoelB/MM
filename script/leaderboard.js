/* ================================================================
   LEADERBOARD.JS — 3 subject leaderboards (no seed)
   ----------------------------------------------------------------
   Each subject (computer / science / ap) has its own leaderboard.
   Ranking: highest level → fastest time → most stars → earliest date.
   One row per nickname per subject.
   ✅ No personal data — nickname only, stored on-device.
   ✅ Starts empty. Only real wins are recorded.
   ✅ Auto-wipes old seed data once per version bump.
   ================================================================ */

(function () {
  'use strict';

  const KEY            = 'mm_leaderboard_v2';
  const OLD_KEY        = 'mm_leaderboard_players';
  const OLD_KEY2       = 'mm_leaderboard';
  const SUBJECTS       = ['computer', 'science', 'ap'];
  const MAX_KEEP       = 50;
  const DISPLAY_LIMIT  = 10;

  /* ---------------- ONE-TIME WIPE OF OLD SEED DATA ---------------- */
  const SEED_VERSION_KEY = 'mm_leaderboard_seed_ver';
  const CURRENT_SEED_VER = '2';

  function wipeOldSeedOnce() {
    try {
      const last = localStorage.getItem(SEED_VERSION_KEY);
      if (last === CURRENT_SEED_VER) return;

      localStorage.removeItem(KEY);
      localStorage.removeItem(OLD_KEY);
      localStorage.removeItem(OLD_KEY2);

      localStorage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VER);
    } catch (e) {}
  }

  /* ---------------- STORAGE ---------------- */
  function emptyStore() {
    return { computer: {}, science: {}, ap: {} };
  }

  function readAll() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return emptyStore();
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== 'object') return emptyStore();
      SUBJECTS.forEach(function (s) {
        if (!obj[s] || typeof obj[s] !== 'object') obj[s] = {};
      });
      return obj;
    } catch (e) { return emptyStore(); }
  }

  function writeAll(store) {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {}
  }

  /* ---------------- MIGRATE OLD DATA (v1 → v2) ---------------- */
  function migrateOldData() {
    try {
      const old = localStorage.getItem(OLD_KEY);
      if (old) {
        const oldObj = JSON.parse(old);
        if (oldObj && typeof oldObj === 'object') {
          const newStore = readAll();
          Object.keys(oldObj).forEach(function (k) {
            const p = oldObj[k];
            if (!p || !p.nickname) return;
            SUBJECTS.forEach(function (sub) {
              const key = p.nickname.toLowerCase();
              if (!newStore[sub][key]) {
                newStore[sub][key] = {
                  nickname:     p.nickname,
                  highestLevel: p.highestLevel || 1,
                  bestTime:     (p.bestTime === Infinity || p.bestTime == null) ? null : p.bestTime,
                  totalStars:   p.totalStars   || 0,
                  totalPoints:  p.totalPoints  || 0,
                  gamesPlayed:  p.gamesPlayed  || 0,
                  lastDate:     p.lastDate     || null
                };
              }
            });
          });
          writeAll(newStore);
        }
        localStorage.removeItem(OLD_KEY);
      }
      localStorage.removeItem(OLD_KEY2);
    } catch (e) {}
  }

  /* ---------------- SEED — disabled ---------------- */
  function seedIfEmpty() {
    // Intentionally a no-op. No fake names are shipped.
    // If you ever want to seed data, uncomment and fill:
    //
    // try {
    //   if (localStorage.getItem(KEY)) return;
    //   const seed = window.MM_LEADERBOARD_SEED;
    //   if (!seed || !Array.isArray(seed.entries) || !seed.entries.length) return;
    //   const store = emptyStore();
    //   seed.entries.forEach(function (e) {
    //     if (!e || !e.nickname) return;
    //     const subj = (e.subject && SUBJECTS.indexOf(e.subject) !== -1) ? e.subject : 'computer';
    //     const key  = e.nickname.toLowerCase();
    //     store[subj][key] = {
    //       nickname:     e.nickname,
    //       highestLevel: Math.max(1, e.level || e.highestLevel || 1),
    //       bestTime:     (e.time != null) ? Math.max(0, Math.round(e.time)) : null,
    //       totalStars:   Math.max(0, e.stars || e.totalStars || 0),
    //       totalPoints:  Math.max(0, e.points || e.totalPoints || 0),
    //       gamesPlayed:  Math.max(0, e.gamesPlayed || 0),
    //       lastDate:     e.date || null
    //     };
    //   });
    //   writeAll(store);
    // } catch (e) {}
  }

  /* ---------------- RECORD A WIN ---------------- */
  function recordWin(result) {
    if (!result || !result.nickname) return false;
    const subject = result.subject || 'computer';
    if (SUBJECTS.indexOf(subject) === -1) return false;

    const store = readAll();
    const sub   = store[subject];
    const key   = result.nickname.toLowerCase();

    const existing = sub[key] || {
      nickname:     result.nickname,
      highestLevel: 1,
      bestTime:     null,
      totalStars:   0,
      totalPoints:  0,
      gamesPlayed:  0,
      lastDate:     null
    };

    existing.nickname     = result.nickname;
    existing.highestLevel = Math.max(existing.highestLevel, result.level || 1);

    const t = Math.max(0, Math.round(result.time || 0));
    if (t > 0 && (existing.bestTime === null || t < existing.bestTime)) {
      existing.bestTime = t;
    }

    existing.totalStars  += Math.max(0, Math.min(3, Math.round(result.stars || 0)));
    existing.totalPoints += Math.max(0, Math.round(result.pointsEarned || 0));
    existing.gamesPlayed += 1;
    existing.lastDate     = new Date().toISOString().slice(0, 10);

    sub[key] = existing;
    writeAll(store);
    return true;
  }

  /* ---------------- SORTING ---------------- */
  function sortPlayers(a, b) {
    if (b.highestLevel !== a.highestLevel) return b.highestLevel - a.highestLevel;
    const aT = (a.bestTime === null || a.bestTime === undefined) ? Infinity : a.bestTime;
    const bT = (b.bestTime === null || b.bestTime === undefined) ? Infinity : b.bestTime;
    if (aT !== bT) return aT - bT;
    if (b.totalStars !== a.totalStars) return b.totalStars - a.totalStars;
    return String(a.lastDate || '').localeCompare(String(b.lastDate || ''));
  }

  /* ---------------- PUBLIC READS ---------------- */
  function getSubjectPlayers(subject) {
    if (SUBJECTS.indexOf(subject) === -1) return [];
    const store = readAll();
    const sub   = store[subject] || {};
    const list  = Object.keys(sub).map(function (k) { return sub[k]; });
    list.sort(sortPlayers);
    return list;
  }

  function getAllForSubject(subject, limit) {
    const list = getSubjectPlayers(subject);
    return typeof limit === 'number' ? list.slice(0, limit) : list;
  }

  function getPlayerRank(subject, nickname) {
    if (!nickname) return null;
    const list = getSubjectPlayers(subject);
    const idx = list.findIndex(function (p) {
      return p.nickname.toLowerCase() === nickname.toLowerCase();
    });
    return idx === -1 ? null : { rank: idx + 1, entry: list[idx], total: list.length };
  }

  /* ---------------- PRUNE ---------------- */
  function prune() {
    const store = readAll();
    SUBJECTS.forEach(function (sub) {
      const list = getSubjectPlayers(sub);
      if (list.length <= MAX_KEEP) return;
      const keep = {};
      list.slice(0, MAX_KEEP).forEach(function (p) {
        keep[p.nickname.toLowerCase()] = p;
      });
      store[sub] = keep;
    });
    writeAll(store);
  }

  /* ---------------- CLEAR / REMOVE ---------------- */
  function clearAll() {
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  function clearSubject(subject) {
    const store = readAll();
    if (store[subject]) {
      store[subject] = {};
      writeAll(store);
    }
  }

  function removePlayer(nickname) {
    if (!nickname) return;
    const store = readAll();
    const key   = nickname.toLowerCase();
    SUBJECTS.forEach(function (sub) {
      if (store[sub] && store[sub][key]) delete store[sub][key];
    });
    writeAll(store);
  }

  /* ---------------- BOOT ---------------- */
  wipeOldSeedOnce();
  migrateOldData();
  seedIfEmpty();

  /* ---------------- EXPORT ---------------- */
  window.MMLeaderboard = {
    recordWin:         recordWin,
    getSubjectPlayers: getSubjectPlayers,
    getAllForSubject:  getAllForSubject,
    getPlayerRank:     getPlayerRank,
    prune:             prune,
    clearAll:          clearAll,
    clearSubject:      clearSubject,
    removePlayer:      removePlayer,
    SUBJECTS:          SUBJECTS,
    DISPLAY_LIMIT:     DISPLAY_LIMIT
  };
})();