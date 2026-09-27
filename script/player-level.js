/* ================================================================
   PLAYER-LEVEL.JS
   - STARS = 3-star rating per level (best) — never spent
   - COINS = spendable currency — used to unlock levels
   ================================================================ */

(function () {
  'use strict';

  const SUBJECTS        = ['computer', 'science', 'ap'];
  const LEVELS_PER_LEVEL = 3;
  const COIN_UNLOCK_BASE = 10;

  // ================================================================
  // STARS — rating (0-3) per level, best score kept
  // Stored as: matchMonster_stars_<subject> = { 1: 3, 2: 2, ... }
  // ================================================================
  function getBestStars(subject, level) {
    try {
      const data = JSON.parse(localStorage.getItem('matchMonster_stars_' + subject) || '{}');
      return Number(data[level]) || 0;
    } catch (e) { return 0; }
  }

  function recordLevelStars(subject, level, stars) {
    if (!SUBJECTS.includes(subject)) return;
    let data = {};
    try {
      data = JSON.parse(localStorage.getItem('matchMonster_stars_' + subject) || '{}') || {};
    } catch (e) { data = {}; }
    const prev = Number(data[level]) || 0;
    if (stars > prev) {
      data[level] = stars;
      localStorage.setItem('matchMonster_stars_' + subject, JSON.stringify(data));
    }
  }

  function getStarsTotal() {
    let total = 0;
    SUBJECTS.forEach(function (sub) {
      try {
        const data = JSON.parse(localStorage.getItem('matchMonster_stars_' + sub) || '{}') || {};
        Object.keys(data).forEach(function (k) {
          total += Number(data[k]) || 0;
        });
      } catch (e) {}
    });
    return total;
  }

  // ================================================================
  // COINS — spendable currency
  // ================================================================
  function getCoinsTotal() {
    return parseInt(localStorage.getItem('coinsTotal') || '0', 10);
  }
  function addCoins(amount) {
    const next = getCoinsTotal() + amount;
    localStorage.setItem('coinsTotal', next);
    return next;
  }
  function spendCoins(amount) {
    const cur = getCoinsTotal();
    if (cur < amount) return false;
    localStorage.setItem('coinsTotal', cur - amount);
    return true;
  }

  // ================================================================
  // PLAYER LEVEL (unchanged logic)
  // ================================================================
  function getPlayerLevel() {
    let totalCompleted = 0;
    SUBJECTS.forEach(function (sub) {
      try {
        const list = JSON.parse(localStorage.getItem('matchMonster_completed_' + sub) || '[]');
        if (Array.isArray(list)) totalCompleted += list.length;
      } catch (e) {}
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
      coins:    getCoinsTotal()
    };
  }

  function updatePlayerLevelBox() {
    const data = getPlayerLevel();

    document.querySelectorAll('[data-player-level-num]').forEach(el => {
      el.textContent = data.level;
    });
    document.querySelectorAll('[data-player-progress-text]').forEach(el => {
      el.textContent = data.progress + ' / ' + LEVELS_PER_LEVEL;
    });
    document.querySelectorAll('[data-player-progress-fill]').forEach(el => {
      el.style.width = data.percent + '%';
    });
    document.querySelectorAll('[data-nav-stars]').forEach(el => {
      el.textContent = data.stars;
    });
    document.querySelectorAll('[data-nav-coins]').forEach(el => {
      el.textContent = data.coins;
    });
  }

  // ================================================================
  // UNLOCK — now spent in COINS, not stars
  // ================================================================
  function getUnlockCost(level) {
    if (level <= 1) return 0;
    return level * COIN_UNLOCK_BASE;
  }

  function tryUnlockLevel(subject, level) {
    if (!SUBJECTS.includes(subject)) return { ok: false, reason: 'bad_subject' };

    const unlockedKey = 'matchMonster_unlocked_' + subject;
    let unlocked = [];
    try { unlocked = JSON.parse(localStorage.getItem(unlockedKey) || '[1]'); } catch (e) { unlocked = [1]; }
    if (!Array.isArray(unlocked)) unlocked = [1];

    if (unlocked.includes(level)) {
      return { ok: true, alreadyUnlocked: true };
    }

    if (level > 1 && !unlocked.includes(level - 1)) {
      return { ok: false, reason: 'previous_locked' };
    }

    const cost  = getUnlockCost(level);
    const coins = getCoinsTotal();

    if (coins < cost) {
      return { ok: false, reason: 'not_enough_coins', cost: cost, coins: coins };
    }

    if (!spendCoins(cost)) {
      return { ok: false, reason: 'spend_failed', cost: cost, coins: coins };
    }

    unlocked.push(level);
    localStorage.setItem(unlockedKey, JSON.stringify(unlocked));
    updatePlayerLevelBox();
    return { ok: true, cost: cost };
  }

  function completeLevel(subject, level) {
    if (!SUBJECTS.includes(subject)) return getPlayerLevel();

    const key = 'matchMonster_completed_' + subject;
    let completed = [];
    try { completed = JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { completed = []; }
    if (!Array.isArray(completed)) completed = [];

    if (!completed.includes(level)) {
      completed.push(level);
      localStorage.setItem(key, JSON.stringify(completed));
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
  window.getCoinsTotal        = getCoinsTotal;
  window.addCoins             = addCoins;
  window.spendCoins           = spendCoins;
  window.getUnlockCost        = getUnlockCost;
  window.tryUnlockLevel       = tryUnlockLevel;
  window.getBestStars         = getBestStars;
  window.recordLevelStars     = recordLevelStars;

})();