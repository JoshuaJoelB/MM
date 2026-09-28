/* ================================================================
   PLAYER-LEVEL.JS
   - POINTS = spendable currency (used to unlock levels)
   - STARS  = 3-star rating per level (best kept)
   - Level 1 is free. Levels 2-10 cost 15 points each.
   - To unlock Level N, Level N-1 must be COMPLETED.
   ================================================================ */

(function () {
  'use strict';

  const SUBJECTS          = ['computer', 'science', 'ap'];
  const LEVELS_PER_LEVEL  = 3;
  const UNLOCK_COST_FLAT  = 15;

  // ---- Safe localStorage helpers ----
  function safeParse(json, fallback) {
    try { return JSON.parse(json); } catch (e) { return fallback; }
  }

  function getUnlockedList(subject) {
    const arr = safeParse(localStorage.getItem('matchMonster_unlocked_' + subject), [1]);
    return (Array.isArray(arr) && arr.length) ? arr : [1];
  }
  function getCompletedList(subject) {
    const arr = safeParse(localStorage.getItem('matchMonster_completed_' + subject), []);
    return Array.isArray(arr) ? arr : [];
  }
  function getStarsMap(subject) {
    const obj = safeParse(localStorage.getItem('matchMonster_stars_' + subject), {});
    return (obj && typeof obj === 'object') ? obj : {};
  }
  function saveUnlockedList(subject, list) {
    localStorage.setItem('matchMonster_unlocked_' + subject, JSON.stringify(list));
  }
  function saveCompletedList(subject, list) {
    localStorage.setItem('matchMonster_completed_' + subject, JSON.stringify(list));
  }
  function saveStarsMap(subject, map) {
    localStorage.setItem('matchMonster_stars_' + subject, JSON.stringify(map));
  }

  // ================================================================
  // POINTS
  // ================================================================
  function getPointsTotal() {
    return parseInt(localStorage.getItem('pointsTotal') || '0', 10);
  }
  function addPoints(amount) {
    const next = getPointsTotal() + amount;
    localStorage.setItem('pointsTotal', String(next));
    updatePlayerLevelBox();
    return next;
  }
  function spendPoints(amount) {
    const cur = getPointsTotal();
    if (cur < amount) return false;
    localStorage.setItem('pointsTotal', String(cur - amount));
    updatePlayerLevelBox();
    return true;
  }

  // ================================================================
  // STARS (rating)
  // ================================================================
  function getBestStars(subject, level) {
    const map = getStarsMap(subject);
    return Number(map[level]) || 0;
  }
  function recordLevelStars(subject, level, stars) {
    if (!SUBJECTS.includes(subject)) return;
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

  // ================================================================
  // PLAYER LEVEL
  // ================================================================
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

  // ================================================================
  // UNLOCK — 15 points flat, previous level must be COMPLETED
  // ================================================================
  function getUnlockCost(level) {
    if (level <= 1) return 0;
    return UNLOCK_COST_FLAT;
  }

  function tryUnlockLevel(subject, level) {
    if (!SUBJECTS.includes(subject)) {
      return { ok: false, reason: 'bad_subject' };
    }

    const unlocked = getUnlockedList(subject);
    if (unlocked.includes(level)) {
      return { ok: true, alreadyUnlocked: true };
    }

    // NEW RULE: previous level must be COMPLETED
    if (level > 1) {
      const completed = getCompletedList(subject);
      if (!completed.includes(level - 1)) {
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

    // ---- READ-BACK VERIFICATION ----
    const verify = getUnlockedList(subject);
    if (!verify.includes(level)) {
      // Safety net: refund if save failed
      addPoints(cost);
      return { ok: false, reason: 'save_failed' };
    }

    updatePlayerLevelBox();
    return { ok: true, cost: cost };
  }

  // ================================================================
  // COMPLETE
  // ================================================================
  function completeLevel(subject, level) {
    if (!SUBJECTS.includes(subject)) return getPlayerLevel();

    const completed = getCompletedList(subject);
    if (!completed.includes(level)) {
      completed.push(level);
      saveCompletedList(subject, completed);
    }

    // ---- READ-BACK VERIFICATION ----
    const verify = getCompletedList(subject);
    if (!verify.includes(level)) {
      console.warn('[player-level] completeLevel save verification failed');
    }

    updatePlayerLevelBox();
    return getPlayerLevel();
  }

  // ================================================================
  // BOOT
  // ================================================================
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

  // Expose API
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

  // Legacy aliases (harmless)
  window.getCoinsTotal = getPointsTotal;
  window.addCoins      = addPoints;
  window.spendCoins    = spendPoints;
})();