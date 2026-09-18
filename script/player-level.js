/* ================================================================
   PLAYER-LEVEL.JS – global player level, points, and star currency
   ================================================================ */

(function () {
  'use strict';

  const SUBJECTS = ['computer', 'science', 'ap'];
  const LEVELS_PER_LEVEL = 3;
  const UNLOCK_BASE_COST = 5;

  function getStarsTotal() {
    return parseInt(localStorage.getItem('starsTotal') || '0', 10);
  }
  function getCoinsTotal() {
    return parseInt(localStorage.getItem('coinsTotal') || '0', 10);
  }

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

  function getUnlockCost(level) {
    if (level <= 1) return 0;
    return level * UNLOCK_BASE_COST;
  }

  function spendStars(amount) {
    const current = getStarsTotal();
    if (current < amount) return false;
    localStorage.setItem('starsTotal', current - amount);
    return true;
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
    const stars = getStarsTotal();

    if (stars < cost) {
      return { ok: false, reason: 'not_enough_stars', cost: cost, stars: stars };
    }

    if (!spendStars(cost)) {
      return { ok: false, reason: 'spend_failed', cost: cost, stars: stars };
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
  window.getCoinsTotal        = getCoinsTotal;
  window.getUnlockCost        = getUnlockCost;
  window.spendStars           = spendStars;
  window.tryUnlockLevel       = tryUnlockLevel;

})();