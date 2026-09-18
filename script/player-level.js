/* ================================================================
   PLAYER-LEVEL.JS – global player level & progress across subjects
   Every level completed in ANY subject adds +1 to the global counter.
   3 completions → level up.
   ================================================================ */

(function () {
  'use strict';

  const SUBJECTS = ['computer', 'science', 'ap'];
  const LEVELS_PER_LEVEL = 3;

  // --------------------------------------------------------------
  // Compute the player's total progress
  // --------------------------------------------------------------
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

    // Stars & Coins now come from dedicated totals set by gameplay.js
    const stars = parseInt(localStorage.getItem('starsTotal') || '0');
    const coins = parseInt(localStorage.getItem('coinsTotal') || '0');

    return {
      total:    totalCompleted,
      level:    playerLevel,
      progress: progressInLevel,
      percent:  progressPercent,
      stars:    stars,
      coins:    coins
    };
  }

  // --------------------------------------------------------------
  // Update every visible player-level box on the page
  // --------------------------------------------------------------
  function updatePlayerLevelBox() {
    const data = getPlayerLevel();

    // Level number
    document.querySelectorAll('[data-player-level-num]').forEach(function (el) {
      el.textContent = data.level;
    });

    // Progress text (n / 3)
    document.querySelectorAll('[data-player-progress-text]').forEach(function (el) {
      el.textContent = data.progress + ' / ' + LEVELS_PER_LEVEL;
    });

    // Progress bar fill
    document.querySelectorAll('[data-player-progress-fill]').forEach(function (el) {
      el.style.width = data.percent + '%';
    });

    // Points chips
    document.querySelectorAll('[data-nav-stars]').forEach(function (el) {
      el.textContent = data.stars;
    });
    document.querySelectorAll('[data-nav-coins]').forEach(function (el) {
      el.textContent = data.coins;
    });
  }

  // --------------------------------------------------------------
  // Public: register a level completion (called after a win)
  // Returns the updated player data.
  // --------------------------------------------------------------
  function completeLevel(subject, level) {
    if (!SUBJECTS.includes(subject)) return getPlayerLevel();

    const key = 'matchMonster_completed_' + subject;
    let completed = [];
    try {
      completed = JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) { completed = []; }
    if (!Array.isArray(completed)) completed = [];

    // Only register if not already completed (avoid double counting)
    if (!completed.includes(level)) {
      completed.push(level);
      localStorage.setItem(key, JSON.stringify(completed));
    }

    updatePlayerLevelBox();
    return getPlayerLevel();
  }

  // --------------------------------------------------------------
  // Auto-run on page load + when navbar finishes loading
  // --------------------------------------------------------------
  function boot() {
    updatePlayerLevelBox();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Also re-run whenever the navbar loader finishes
  window.addEventListener('navbarLoaded', updatePlayerLevelBox);
  // And when we come back to a page (bfcache)
  window.addEventListener('pageshow', updatePlayerLevelBox);

  // Expose globally
  window.getPlayerLevel       = getPlayerLevel;
  window.updatePlayerLevelBox = updatePlayerLevelBox;
  window.completeLevel        = completeLevel;

})();