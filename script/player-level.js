/* ================================================================
   PLAYER-LEVEL.JS — per-player progress
   ----------------------------------------------------------------
   All storage is scoped to the logged-in nickname via MMPlayer.pX().
   ================================================================ */

(function () {
  'use strict';

  const SUBJECTS          = ['computer', 'science', 'ap'];
  const LEVELS_PER_LEVEL  = 3;
  const UNLOCK_COST_FLAT  = 15;

  /* --- Storage helpers (fall back to plain localStorage if MMPlayer missing) --- */
  function pGet(key, fallback) {
    if (window.MMPlayer && MMPlayer.pGet) return MMPlayer.pGet(key, fallback);
    try {
      const v = localStorage.getItem(key);
      return v === null ? (fallback !== undefined ? fallback : null) : v;
    } catch (e) { return fallback; }
  }
  function pSet(key, value) {
    if (window.MMPlayer && MMPlayer.pSet) return MMPlayer.pSet(key, value);
    try { localStorage.setItem(key, String(value)); } catch (e) {}
  }
  function pJSON(key, fallback) {
    if (window.MMPlayer && MMPlayer.pJSON) return MMPlayer.pJSON(key, fallback);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function pSetJSON(key, value) {
    if (window.MMPlayer && MMPlayer.pSetJSON) return MMPlayer.pSetJSON(key, value);
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  /* ---------------- SUBJECT PROGRESS ---------------- */
  function getUnlockedList(subject) {
    const arr = pJSON('unlocked_' + subject, [1]);
    return (Array.isArray(arr) && arr.length) ? arr : [1];
  }
  function getCompletedList(subject) {
    const arr = pJSON('completed_' + subject, []);
    return Array.isArray(arr) ? arr : [];
  }
  function getStarsMap(subject) {
    const obj = pJSON('stars_' + subject, {});
    return (obj && typeof obj === 'object') ? obj : {};
  }
  function saveUnlockedList(subject, list) { pSetJSON('unlocked_' + subject, list); }
  function saveCompletedList(subject, list) { pSetJSON('completed_' + subject, list); }
  function saveStarsMap(subject, map) { pSetJSON('stars_' + subject, map); }

  /* ---------------- POINTS ---------------- */
  function getPointsTotal() {
    return parseInt(pGet('pointsTotal', '0'), 10) || 0;
  }
  function setPointsTotal(n) {
    pSet('pointsTotal', String(Math.max(0, Math.round(n))));
  }
  function addPoints(amount) {
    const next = getPointsTotal() + amount;
    setPointsTotal(next);
    updatePlayerLevelBox();
    return next;
  }
  function spendPoints(amount) {
    const cur = getPointsTotal();
    if (cur < amount) return false;
    setPointsTotal(cur - amount);
    updatePlayerLevelBox();
    return true;
  }

  /* ---------------- STARS ---------------- */
  function getBestStars(subject, level) {
    const map = getStarsMap(subject);
    return Number(map[level]) || 0;
  }
  function recordLevelStars(subject, level, stars) {
    if (SUBJECTS.indexOf(subject) === -1) return;
    const map = getStarsMap(subject);
    const prev = Number(map[level]) || 0;
    if (stars > prev) {
      map[level] = stars;
      saveStarsMap(subject, map);
    }
  }
  function getStarsTotal() {
    let total = 0;
    SUBJECTS.forEach(function (sub) {
      const map = getStarsMap(sub);
      Object.keys(map).forEach(function (k) {
        total += Number(map[k]) || 0;
      });
    });
    return total;
  }

  /* ---------------- PLAYER LEVEL ---------------- */
  function getPlayerLevel() {
    let totalCompleted = 0;
    SUBJECTS.forEach(function (sub) {
      totalCompleted += getCompletedList(sub).length;
    });

    const playerLevel     = Math.floor(totalCompleted / LEVELS_PER_LEVEL) + 1;
    const progressInLevel = totalCompleted % LEVELS_PER_LEVEL;
    const progressPercent = (progressInLevel / LEVELS_PER_LEVEL) * 100;

    return {
      total:    totalCompleted,
      level:    playerLevel,
      progress: progressInLevel,
      percent:  progressPercent,
      stars:    getStarsTotal(),
      points:   getPointsTotal()
    };
  }

  function updatePlayerLevelBox() {
    const data = getPlayerLevel();
    document.querySelectorAll('[data-player-level-num]').forEach(el => el.textContent = data.level);
    document.querySelectorAll('[data-player-progress-text]').forEach(el => el.textContent = data.progress + ' / ' + LEVELS_PER_LEVEL);
    document.querySelectorAll('[data-player-progress-fill]').forEach(el => el.style.width = data.percent + '%');
    document.querySelectorAll('[data-nav-stars]').forEach(el => el.textContent = data.stars);
    document.querySelectorAll('[data-nav-points], [data-nav-coins]').forEach(el => el.textContent = data.points);
  }

  /* ---------------- UNLOCK ---------------- */
  function getUnlockCost(level) {
    if (level <= 1) return 0;
    return UNLOCK_COST_FLAT;
  }

  function tryUnlockLevel(subject, level) {
    if (SUBJECTS.indexOf(subject) === -1) {
      return { ok: false, reason: 'bad_subject' };
    }

    const unlocked = getUnlockedList(subject);
    if (unlocked.indexOf(level) !== -1) {
      return { ok: true, alreadyUnlocked: true };
    }

    if (level > 1) {
      const completed = getCompletedList(subject);
      if (completed.indexOf(level - 1) === -1) {
        return { ok: false, reason: 'previous_not_completed' };
      }
    }

    const cost   = getUnlockCost(level);
    const points = getPointsTotal();

    if (points < cost) {
      return { ok: false, reason: 'not_enough_points', cost: cost, points: points };
    }

    if (!spendPoints(cost)) {
      return { ok: false, reason: 'spend_failed', cost: cost, points: points };
    }

    unlocked.push(level);
    saveUnlockedList(subject, unlocked);

    const verify = getUnlockedList(subject);
    if (verify.indexOf(level) === -1) {
      addPoints(cost);
      return { ok: false, reason: 'save_failed' };
    }

    updatePlayerLevelBox();
    return { ok: true, cost: cost };
  }

  /* ---------------- COMPLETE ---------------- */
  function completeLevel(subject, level) {
    if (SUBJECTS.indexOf(subject) === -1) return getPlayerLevel();

    const completed = getCompletedList(subject);
    if (completed.indexOf(level) === -1) {
      completed.push(level);
      saveCompletedList(subject, completed);
    }

    updatePlayerLevelBox();
    return getPlayerLevel();
  }

  /* ---------------- BOOT ---------------- */
  function boot() { updatePlayerLevelBox(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.addEventListener('navbarLoaded', updatePlayerLevelBox);
  window.addEventListener('pageshow',     updatePlayerLevelBox);
  window.addEventListener('focus',        updatePlayerLevelBox);
  window.addEventListener('storage',      updatePlayerLevelBox);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') updatePlayerLevelBox();
  });

  window.getPlayerLevel       = getPlayerLevel;
  window.updatePlayerLevelBox = updatePlayerLevelBox;
  window.completeLevel        = completeLevel;
  window.getStarsTotal        = getStarsTotal;
  window.getPointsTotal       = getPointsTotal;
  window.addPoints            = addPoints;
  window.spendPoints          = spendPoints;
  window.getUnlockCost        = getUnlockCost;
  window.tryUnlockLevel       = tryUnlockLevel;
  window.getBestStars         = getBestStars;
  window.recordLevelStars     = recordLevelStars;
  window.getUnlockedList      = getUnlockedList;
  window.getCompletedList     = getCompletedList;

  window.getCoinsTotal = getPointsTotal;
  window.addCoins      = addPoints;
  window.spendCoins    = spendPoints;
})();