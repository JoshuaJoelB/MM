/* ================================================================
   SCRIPT.JS – shared logic for all pages
   ================================================================ */

document.addEventListener('DOMContentLoaded', function () {

  const isIndex = document.getElementById('indexPage') !== null;
  const isStart = document.getElementById('startPage') !== null;
  const isHome  = document.getElementById('homePage')  !== null;

  // ============================================================
  // INDEX PAGE — loading bar with progress, then redirect
  // ============================================================
  if (isIndex) {
    const fill     = document.getElementById('loadingBarFill');
    const wrap     = document.getElementById('loadingBarWrap');
    const barWrap  = document.querySelector('.loading-bar-wrap');

    let progress = 0;

    function setProgress(p) {
      progress = Math.max(0, Math.min(100, p));
      if (fill) fill.style.width = progress + '%';
      if (barWrap) barWrap.style.setProperty('--progress', String(progress / 100));
      if (wrap) wrap.setAttribute('aria-valuenow', String(Math.round(progress)));
    }

    const timer = setInterval(function () {
      const remaining = 100 - progress;
      const step      = Math.max(0.6, remaining * 0.06);
      setProgress(progress + step);

      if (progress >= 100) {
        clearInterval(timer);
        setTimeout(function () {
          window.location.href = 'Start.html';
        }, 350);
      }
    }, 60);

    setProgress(0);
  }

  // ============================================================
  // START PAGE — button leads to Home.html
  // ============================================================
  if (isStart) {
    const btn = document.getElementById('letsStartBtn');
    if (btn) {
      btn.addEventListener('click', function () {
        window.location.href = 'Home.html';
      });
    }
  }

  // ============================================================
  // HOME PAGE
  // ============================================================
  if (isHome) {
    function syncChips() {
      if (typeof window.updatePlayerLevelBox === 'function') {
        window.updatePlayerLevelBox();
      }
    }
    syncChips();

    let chipTries = 0;
    const chipRetry = setInterval(function () {
      syncChips();
      if (++chipTries >= 10) clearInterval(chipRetry);
    }, 100);

    window.addEventListener('navbarLoaded', syncChips);
    window.addEventListener('focus', syncChips);
    window.addEventListener('pageshow', syncChips);

    initHomePage();
    initQuickActions();
  }

  // ============================================================
  // SETTINGS
  // ============================================================
  initSettings();

  // fallback active page
  if (!document.querySelector('.page.active-page')) {
    const first = document.querySelector('.page');
    if (first) first.classList.add('active-page');
  }

});

/* ================================================================
   QUICK ACTIONS — Rewards / Monsters / How to Play
   ================================================================ */
function initQuickActions() {

  function getStats() {
    return {
      gamesPlayed:  parseInt(localStorage.getItem('gamesPlayed')  || '0', 10),
      totalMatches: parseInt(localStorage.getItem('totalMatches') || '0', 10),
      rewards:      parseInt(localStorage.getItem('rewardsCount') || '0', 10),
      points:       parseInt(localStorage.getItem('pointsTotal')  || '0', 10),
      stars: (typeof window.getStarsTotal === 'function')
             ? window.getStarsTotal()
             : 0,
      bestTime:     localStorage.getItem('bestTime') || null,
    };
  }

  const QUICK_CONTENT = {
    rewards: {
      title: 'Rewards',
      icon:  'fa-trophy',
      body: function () {
        const s = getStats();
        return `
          <div class="quick-modal-stats">
            <div class="quick-modal-stat">
              <i class="fas fa-star" style="color:#FFD700"></i>
              <span class="quick-modal-value">${s.stars}</span>
              <span class="quick-modal-label">Stars Earned</span>
            </div>
            <div class="quick-modal-stat">
              <i class="fas fa-coins" style="color:#FFD700"></i>
              <span class="quick-modal-value">${s.points}</span>
              <span class="quick-modal-label">Points</span>
            </div>
            <div class="quick-modal-stat">
              <i class="fas fa-gamepad" style="color:#FFD700"></i>
              <span class="quick-modal-value">${s.gamesPlayed}</span>
              <span class="quick-modal-label">Games Played</span>
            </div>
          </div>
          <p class="quick-modal-note">Clear more boards to earn points and unlock new levels!</p>
        `;
      },
    },

    monsters: {
      title: 'Your Monsters',
      icon:  'fa-dragon',
      body: function () {
        const s = getStats();
        const unlockedCount = Math.min(s.gamesPlayed, 10);
        const roster = ['🐲','👾','🐸','🦖','👻','🐙','🦄','🐝','🦋','🐢'];
        const grid = roster.map(function (emoji, i) {
          const unlocked = i < unlockedCount;
          return `<div class="quick-modal-monster ${unlocked ? 'unlocked' : 'locked'}">
                    ${unlocked ? emoji : '?'}
                  </div>`;
        }).join('');

        return `
          <div class="quick-modal-monsters">${grid}</div>
          <p class="quick-modal-note">
            ${unlockedCount} / 10 monsters collected.
            Keep playing to fill your Monster Book!
          </p>
        `;
      },
    },

    howto: {
      title: 'How to Play',
      icon:  'fa-circle-question',
      body: function () {
        return `
          <ol class="quick-modal-steps">
            <li><strong>Flip</strong> two cards by tapping them.</li>
            <li><strong>Match</strong> the pairs — numbers, letters, or words.</li>
            <li><strong>Win</strong> when every pair is found.</li>
          </ol>
          <p class="quick-modal-note">
            Tip: Remember where each card is. No timers. No losing. Just fun!
          </p>
        `;
      },
    },
  };

  function openQuickModal(key) {
    const data = QUICK_CONTENT[key];
    if (!data) return;

    let modal = document.getElementById('quickActionModal');

    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'quickActionModal';
      modal.className = 'quick-modal-backdrop';
      modal.innerHTML = `
        <div class="quick-modal" role="dialog" aria-modal="true" aria-labelledby="quickModalTitle">
          <button class="quick-modal-close" type="button" aria-label="Close">
            <i class="fas fa-times"></i>
          </button>
          <div class="quick-modal-header">
            <i class="fas quick-modal-icon" id="quickModalIcon"></i>
            <h2 class="quick-modal-title" id="quickModalTitle"></h2>
          </div>
          <div class="quick-modal-body" id="quickModalBody"></div>
          <button class="quick-modal-ok" type="button">
            <i class="fas fa-check me-2"></i> Got it!
          </button>
        </div>
      `;
      document.body.appendChild(modal);

      function close() { modal.classList.remove('show'); }

      modal.querySelector('.quick-modal-close').addEventListener('click', close);
      modal.querySelector('.quick-modal-ok').addEventListener('click', close);
      modal.addEventListener('click', function (e) {
        if (e.target === modal) close();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') close();
      });
    }

    modal.querySelector('#quickModalIcon').className = 'fas ' + data.icon + ' quick-modal-icon';
    modal.querySelector('#quickModalTitle').textContent = data.title;
    modal.querySelector('#quickModalBody').innerHTML = data.body();

    requestAnimationFrame(function () { modal.classList.add('show'); });
  }

  const rewardsBtn  = document.getElementById('btnQuickRewards');
  const monstersBtn = document.getElementById('btnQuickMonsters');
  const howtoBtn    = document.getElementById('btnQuickHowTo');

  if (rewardsBtn)  rewardsBtn.addEventListener('click',  function () { openQuickModal('rewards');  });
  if (monstersBtn) monstersBtn.addEventListener('click', function () { openQuickModal('monsters'); });
  if (howtoBtn)    howtoBtn.addEventListener('click',    function () { openQuickModal('howto');    });
}

/* ================================================================
   SETTINGS — event delegation (works with dynamic navbar)
   ================================================================ */
function initSettings() {

  function applySettingsToUI() {
    const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    const musicEnabled = localStorage.getItem('musicEnabled') !== 'false';
    const difficulty   = localStorage.getItem('difficulty') || 'normal';

    const soundToggle = document.getElementById('soundToggle');
    const musicToggle = document.getElementById('musicToggle');
    const diffSelect  = document.getElementById('difficultySelect');

    if (soundToggle) soundToggle.checked = soundEnabled;
    if (musicToggle) musicToggle.checked = musicEnabled;
    if (diffSelect)  diffSelect.value = difficulty;
  }

  applySettingsToUI();
  window.addEventListener('navbarLoaded', applySettingsToUI);

  let tries = 0;
  const pollInterval = setInterval(function () {
    if (document.getElementById('resetProgressBtn') || tries++ > 20) {
      clearInterval(pollInterval);
      applySettingsToUI();
    }
  }, 100);

  // ---- Reset Progress ----
  document.addEventListener('click', function (e) {
    const resetBtn = e.target.closest('#resetProgressBtn');
    if (!resetBtn) return;

    e.preventDefault();

    const ok = confirm(
      '⚠️ Reset all progress?\n\n' +
      'This will erase:\n' +
      '• All stats (games, matches, best time)\n' +
      '• All unlocked & completed levels\n' +
      '• All star ratings\n' +
      '• All points\n' +
      '• Everything for Computer, Science, and AP\n\n' +
      'This cannot be undone!'
    );
    if (!ok) return;

    // Clear global stats
    localStorage.removeItem('gamesPlayed');
    localStorage.removeItem('bestTime');
    localStorage.removeItem('totalMatches');
    localStorage.removeItem('rewardsCount');

    // Clear currency (new + legacy keys)
    localStorage.removeItem('pointsTotal');
    localStorage.removeItem('coinsTotal');
    localStorage.removeItem('starsTotal');

    // Clear per-subject progress + stars
    ['computer', 'science', 'ap'].forEach(function (sub) {
      localStorage.removeItem('matchMonster_unlocked_' + sub);
      localStorage.removeItem('matchMonster_completed_' + sub);
      localStorage.removeItem('matchMonster_stars_' + sub);
    });

    // Refresh UI
    if (typeof updateStatsDisplay === 'function') updateStatsDisplay();
    if (typeof window.updatePlayerLevelBox === 'function') {
      window.updatePlayerLevelBox();
    }

    // Close settings modal
    const modalEl = document.getElementById('settingsModal');
    if (modalEl && window.bootstrap) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    }

    // Toast
    const toast = document.createElement('div');
    toast.textContent = '✅ Progress reset! Level 1 is unlocked.';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #FFE066, #FFC107);
      color: #1a0f2e;
      padding: 12px 28px;
      border-radius: 100px;
      font-family: 'DynaPuff', system-ui, sans-serif;
      font-weight: 700;
      font-size: 1rem;
      box-shadow: 0 12px 40px rgba(255, 184, 0, 0.5);
      z-index: 3000;
      animation: fadeUp 0.4s ease;
      pointer-events: none;
    `;
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 2600);

    // Reset home board view
    const homeLobby      = document.getElementById('homeLobby');
    const homeGameScreen = document.getElementById('homeGameScreen');
    if (homeLobby)      homeLobby.style.display = 'block';
    if (homeGameScreen) homeGameScreen.style.display = 'none';
    if (typeof window.__quitGame === 'function') window.__quitGame();
  });

  // ---- Toggles + difficulty ----
  document.addEventListener('change', function (e) {
    const target = e.target;

    if (target.classList && target.classList.contains('settings-toggle')) {
      const key = target.dataset.key;
      if (key) localStorage.setItem(key, target.checked);
      return;
    }

    if (target.id === 'difficultySelect') {
      localStorage.setItem('difficulty', target.value);
    }
  });
}

/* ================================================================
   STATS — read/write
   ================================================================ */
function getStats() {
  return {
    gamesPlayed:  parseInt(localStorage.getItem('gamesPlayed')  || '0', 10),
    bestTime:     localStorage.getItem('bestTime') || null,
    totalMatches: parseInt(localStorage.getItem('totalMatches') || '0', 10),
    rewards:      parseInt(localStorage.getItem('rewardsCount') || '0', 10),
  };
}

function updateStatsDisplay() {
  const stats = getStats();
  const gp = document.getElementById('gamesPlayed');
  const bt = document.getElementById('bestTime');
  const tm = document.getElementById('totalMatches');
  const rw = document.getElementById('rewardsCount');

  if (gp) gp.textContent = stats.gamesPlayed;
  if (bt) bt.textContent = stats.bestTime !== null ? stats.bestTime + 's' : '--';
  if (tm) tm.textContent = stats.totalMatches;
  if (rw) rw.textContent = stats.rewards;
}

function saveStats(stats) {
  localStorage.setItem('gamesPlayed',  String(stats.gamesPlayed));
  localStorage.setItem('bestTime',     String(stats.bestTime));
  localStorage.setItem('totalMatches', String(stats.totalMatches));
  localStorage.setItem('rewardsCount', String(stats.rewards));
  updateStatsDisplay();
}

/* ================================================================
   HOME PAGE – inline board (only if elements exist)
   ================================================================ */
function initHomePage() {
  if (!document.getElementById('homePage')) return;

  updateStatsDisplay();

  const lobby        = document.getElementById('homeLobby');
  const gameScreen   = document.getElementById('homeGameScreen');
  const startBtn     = document.getElementById('homeStartBtn');
  const quitBtn      = document.getElementById('btnQuitGame');
  const grid         = document.getElementById('cardGrid');
  const moveDisplay  = document.getElementById('moveCount');
  const matchDisplay = document.getElementById('matchCount');
  const timerDisplay = document.getElementById('timerDisplay');
  const winOverlay   = document.getElementById('winOverlay');
  const winMoves     = document.getElementById('winMoves');
  const winTime      = document.getElementById('winTime');

  if (!grid) return;

  const MONSTERS = ['👾', '🧛', '🧟', '🧙', '🧝', '🧚', '🦄', '🐉'];
  const PAIR_COUNT = MONSTERS.length;

  let cards = [], flippedCards = [], matchedPairs = 0, moves = 0, isLocked = false;
  let timerInterval = null, seconds = 0, gameStarted = false;

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildCardData() {
    const deck = [];
    MONSTERS.forEach(function (emoji, idx) {
      deck.push({ id: idx, emoji: emoji, matched: false });
      deck.push({ id: idx, emoji: emoji, matched: false });
    });
    return shuffle(deck);
  }

  function renderCards() {
    grid.innerHTML = '';
    cards.forEach(function (card, index) {
      const div = document.createElement('div');
      div.className = 'card-item';
      div.dataset.index = index;

      const inner = document.createElement('div');
      inner.className = 'card-inner';

      const back = document.createElement('div');
      back.className = 'card-face card-face-back';

      const front = document.createElement('div');
      front.className = 'card-face card-face-front';
      front.textContent = card.emoji;

      inner.appendChild(back);
      inner.appendChild(front);
      div.appendChild(inner);
      div.addEventListener('click', function () { onCardClick(index); });
      grid.appendChild(div);
    });
  }

  function updateGameStats() {
    if (moveDisplay)  moveDisplay.textContent  = moves;
    if (matchDisplay) matchDisplay.textContent = matchedPairs;
  }

  function startTimer() {
    if (timerInterval) return;
    seconds = 0;
    timerInterval = setInterval(function () {
      seconds++;
      if (timerDisplay) timerDisplay.textContent = seconds + 's';
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  function resetTimer() {
    stopTimer();
    seconds = 0;
    if (timerDisplay) timerDisplay.textContent = '0s';
    gameStarted = false;
  }

  function onCardClick(index) {
    if (isLocked) return;
    const card = cards[index];
    const el   = grid.children[index];
    if (!el) return;
    if (el.classList.contains('flipped') || el.classList.contains('matched')) return;

    if (!gameStarted) { gameStarted = true; startTimer(); }

    el.classList.add('flipped');
    flippedCards.push({ index: index, el: el, card: card });

    if (flippedCards.length === 2) {
      moves++;
      updateGameStats();
      checkMatch();
    }
  }

  function checkMatch() {
    isLocked = true;
    const first  = flippedCards[0];
    const second = flippedCards[1];

    if (first.card.id === second.card.id) {
      first.card.matched  = true;
      second.card.matched = true;
      first.el.classList.add('matched');
      second.el.classList.add('matched');
      matchedPairs++;
      updateGameStats();
      flippedCards = [];
      isLocked = false;

      if (matchedPairs === PAIR_COUNT) {
        stopTimer();
        setTimeout(showWin, 400);
      }
    } else {
      setTimeout(function () {
        first.el.classList.remove('flipped');
        second.el.classList.remove('flipped');
        flippedCards = [];
        isLocked = false;
      }, 700);
    }
  }

  function showWin() {
    if (winMoves) winMoves.textContent = moves;
    if (winTime)  winTime.textContent  = seconds + 's';
    if (winOverlay) winOverlay.classList.add('show');

    const stats = getStats();
    stats.gamesPlayed += 1;
    if (stats.bestTime === null || seconds < stats.bestTime) {
      stats.bestTime = seconds;
    }
    stats.totalMatches += PAIR_COUNT;
    stats.rewards += 1;
    saveStats(stats);
  }

  function initGame() {
    if (winOverlay) winOverlay.classList.remove('show');
    cards = buildCardData();
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    isLocked = false;
    gameStarted = false;
    resetTimer();
    updateGameStats();
    renderCards();
    if (lobby)      lobby.style.display = 'none';
    if (gameScreen) gameScreen.style.display = 'block';
  }

  function quitGame() {
    stopTimer();
    if (winOverlay) winOverlay.classList.remove('show');
    if (lobby)      lobby.style.display = 'block';
    if (gameScreen) gameScreen.style.display = 'none';

    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    isLocked = false;
    gameStarted = false;
    resetTimer();

    if (grid) grid.innerHTML = '';
    updateGameStats();
    updateStatsDisplay();
  }

  if (startBtn) startBtn.addEventListener('click', initGame);
  if (quitBtn)  quitBtn.addEventListener('click', quitGame);

  const replayBtn = document.getElementById('btnWinReplay');
  const homeBtn   = document.getElementById('btnWinHome');

  if (replayBtn) replayBtn.addEventListener('click', function () {
    if (winOverlay) winOverlay.classList.remove('show');
    initGame();
  });
  if (homeBtn) homeBtn.addEventListener('click', function () {
    if (winOverlay) winOverlay.classList.remove('show');
    quitGame();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const homePage = document.getElementById('homePage');
      if (homePage && homePage.classList.contains('active-page')) {
        if (gameScreen && gameScreen.style.display !== 'none') quitGame();
        if (winOverlay && winOverlay.classList.contains('show')) {
          winOverlay.classList.remove('show');
          quitGame();
        }
      }
    }
  });

  function adjustGridColumns() {
    const width = window.innerWidth;
    let cols = 4;
    if (width < 400) cols = 3;
    if (width < 320) cols = 2;
    grid.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
  }
  window.addEventListener('resize', adjustGridColumns);

  cards = buildCardData();
  renderCards();
  updateGameStats();
  resetTimer();
  adjustGridColumns();

  if (lobby)      lobby.style.display = 'block';
  if (gameScreen) gameScreen.style.display = 'none';

  window.__quitGame = quitGame;
}

/* ================================================================
   NAVBAR HAMBURGER MENU
   - Toggle open/close on button click
   - Close on outside click, Escape, or menu item select
   - Menu items open the Inbox / Settings modals
   ================================================================ */
(function () {
  'use strict';

  // ---- Toggle open/close ----
  document.addEventListener('click', function (e) {
    const wrap = document.getElementById('navMenuWrap');
    if (!wrap) return;

    const toggle = e.target.closest('#navMenuToggle');

    // Click on the toggle button
    if (toggle) {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = wrap.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      return;
    }

    // Click on a menu item → close menu, then open the modal
    const item = e.target.closest('.nav-menu-item');
    if (item) {
      wrap.classList.remove('open');
      const tgl = wrap.querySelector('#navMenuToggle');
      if (tgl) tgl.setAttribute('aria-expanded', 'false');

      const action = item.dataset.navAction;
      const modalId =
        action === 'inbox'    ? 'inboxModal' :
        action === 'settings' ? 'settingsModal' : null;

      if (modalId && window.bootstrap) {
        const modalEl = document.getElementById(modalId);
        if (modalEl) {
          const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
          modal.show();
        }
      }
      return;
    }

    // Click outside → close
    if (!e.target.closest('#navMenuWrap')) {
      if (wrap.classList.contains('open')) {
        wrap.classList.remove('open');
        const tgl = wrap.querySelector('#navMenuToggle');
        if (tgl) tgl.setAttribute('aria-expanded', 'false');
      }
    }
  });

  // ---- Close on Escape ----
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    const wrap = document.getElementById('navMenuWrap');
    if (wrap && wrap.classList.contains('open')) {
      wrap.classList.remove('open');
      const tgl = wrap.querySelector('#navMenuToggle');
      if (tgl) tgl.setAttribute('aria-expanded', 'false');
    }
  });

  // ---- Close when navbar reloads (page navigation, etc.) ----
  window.addEventListener('navbarLoaded', function () {
    const wrap = document.getElementById('navMenuWrap');
    if (wrap) wrap.classList.remove('open');
  });
})();

/* ================================================================
   LEADERBOARD MODAL — populate when opened
   ================================================================ */
(function () {
  'use strict';

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderLeaderboard() {
    const listEl  = document.getElementById('navLbList');
    const emptyEl = document.getElementById('navLbEmpty');
    if (!listEl || !emptyEl) return;
    if (!window.MMPlayer) return;

    const scores = MMPlayer.getLeaderboard(10);
    listEl.innerHTML = '';

    if (!scores.length) {
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;

    scores.forEach(function (entry, i) {
      const li = document.createElement('li');
      li.className = 'lb-row' + (i === 0 ? ' top1' : i === 1 ? ' top2' : i === 2 ? ' top3' : '');
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);

      li.innerHTML =
        '<span class="lb-rank">' + medal + '</span>' +
        '<span class="lb-name">' + escapeHtml(entry.nickname) + '</span>' +
        '<span class="lb-score">' + entry.score + '</span>';

      listEl.appendChild(li);
    });
  }

  // Re-render every time the leaderboard modal is shown
  document.addEventListener('shown.bs.modal', function (e) {
    if (e.target && e.target.id === 'leaderboardModal') {
      renderLeaderboard();
    }
  });

  // Also re-render when the navbar is (re)loaded
  window.addEventListener('navbarLoaded', renderLeaderboard);

  // Initial render (in case modal is opened via script before navbar fires)
  document.addEventListener('DOMContentLoaded', renderLeaderboard);
})();