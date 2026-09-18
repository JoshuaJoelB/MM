/* ================================================================
   NAVBAR-LOADER.JS
   - Injects navbar.html into #navbarContainer
   - Moves modals to <body> so Bootstrap's fixed positioning works
   - Computes player level, progress, and points
   ================================================================ */

(function () {
  'use strict';

  const inSubfolder = window.location.pathname.includes('/Gameplay/');
  const NAVBAR_PATH = inSubfolder ? '../navbar.html' : 'navbar.html';

  /* --------------------------------------------------------------
     PLAYER STATS – level, progress, points
     -------------------------------------------------------------- */
  function updatePlayerStats() {
    const subjects = ['computer', 'science', 'ap'];
    let totalCompleted = 0;

    subjects.forEach((sub) => {
      try {
        const list = JSON.parse(localStorage.getItem(`matchMonster_completed_${sub}`) || '[]');
        if (Array.isArray(list)) totalCompleted += list.length;
      } catch (e) { /* ignore */ }
    });

    // 3 completions = 1 player level
    const LEVELS_PER_LEVEL = 3;
    const playerLevel     = Math.floor(totalCompleted / LEVELS_PER_LEVEL) + 1;
    const progressInLevel = totalCompleted % LEVELS_PER_LEVEL;
    const progressPercent = (progressInLevel / LEVELS_PER_LEVEL) * 100;

    // Points
    const stars       = parseInt(localStorage.getItem('totalMatches') || '0');
    const gamesPlayed = parseInt(localStorage.getItem('gamesPlayed') || '0');
    const coins       = gamesPlayed * 10 + totalCompleted * 25;

    // DOM
    const levelNumEl     = document.getElementById('playerLevelNum');
    const progressFillEl = document.getElementById('playerProgressFill');
    const progressTextEl = document.getElementById('playerProgressText');
    const starsEl        = document.getElementById('navStars');
    const coinsEl        = document.getElementById('navCoins');

    if (levelNumEl)     levelNumEl.textContent = playerLevel;
    if (progressFillEl) progressFillEl.style.width = progressPercent + '%';
    if (progressTextEl) progressTextEl.textContent = `${progressInLevel} / ${LEVELS_PER_LEVEL}`;
    if (starsEl)        starsEl.textContent = stars;
    if (coinsEl)        coinsEl.textContent = coins;
  }

  window.updatePlayerStats = updatePlayerStats;

  /* --------------------------------------------------------------
     INJECT NAVBAR
     -------------------------------------------------------------- */
  function injectNavbar() {
    const container = document.getElementById('navbarContainer');
    if (!container) return;

    fetch(NAVBAR_PATH)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load navbar');
        return res.text();
      })
      .then((html) => {
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // 1. Navbar → #navbarContainer
        const navbar = temp.querySelector('.navbar-custom');
        if (navbar) {
          container.innerHTML = '';
          container.appendChild(navbar);
        }

        // 2. Modals → <body> directly
        temp.querySelectorAll('.modal').forEach((modal) => {
          document.body.appendChild(modal);
        });

        // 3. Anything else → <body>
        while (temp.firstChild) {
          const node = temp.firstChild;
          if (node.nodeType === 1) document.body.appendChild(node);
          temp.removeChild(node);
        }

        // 4. Update level box + points
        updatePlayerStats();

        // 5. Notify other scripts
        window.dispatchEvent(new Event('navbarLoaded'));
      })
      .catch((err) => {
        console.warn('Navbar loader:', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectNavbar);
  } else {
    injectNavbar();
  }
})();