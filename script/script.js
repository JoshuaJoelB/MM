/* ================================================================
   SCRIPT.JS – shared logic for all pages
   Uses event delegation so it works with dynamically-loaded UI
   ================================================================ */

document.addEventListener('DOMContentLoaded', function () {

  const isIndex = document.getElementById('indexPage') !== null;
  const isStart = document.getElementById('startPage') !== null;
  const isHome  = document.getElementById('homePage') !== null;

  // ---- INDEX PAGE (auto-redirect to Start.html) ----
  if (isIndex) {
    setTimeout(function () {
      window.location.href = 'Start.html';
    }, 2000);
  }

  // ---- START PAGE (button leads to Home.html) ----
  if (isStart) {
    const btn = document.getElementById('letsStartBtn');
    if (btn) {
      btn.addEventListener('click', function () {
        window.location.href = 'Home.html';
      });
    }
  }

  // ---- HOME PAGE ----
  if (isHome) {
    initHomePage();
  }

  // ---- SETTINGS: initialize whenever the navbar is loaded ----
  initSettings();

  // fallback: if no active page, set the first one
  if (!document.querySelector('.page.active-page')) {
    const first = document.querySelector('.page');
    if (first) first.classList.add('active-page');
  }

});

// --------------------------------------------------------------
// SETTINGS – uses event delegation (works with dynamic navbar)
// --------------------------------------------------------------
function initSettings() {

  // ---- Apply saved settings to UI whenever navbar gets injected ----
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

  // Apply now (in case navbar is already there)
  applySettingsToUI();

  // Re-apply whenever the navbar loader finishes
  window.addEventListener('navbarLoaded', applySettingsToUI);

  // Fallback polling for the first 2 seconds (in case navbarLoaded never fires)
  let tries = 0;
  const pollInterval = setInterval(function () {
    if (document.getElementById('resetProgressBtn') || tries++ > 20) {
      clearInterval(pollInterval);
      applySettingsToUI();
    }
  }, 100);

  // ==============================================================
  // EVENT DELEGATION – works for dynamically-injected elements
  // ==============================================================

  // ---- Click handler (Reset Progress) ----
  document.addEventListener('click', function (e) {

    // Check if the click was on (or inside) the Reset Progress button
    const resetBtn = e.target.closest('#resetProgressBtn');
    if (!resetBtn) return;

    e.preventDefault();

    const ok = confirm(
      '⚠️ Reset all progress?\n\n' +
      'This will erase:\n' +
      '• All stats (games, matches, rewards, best time)\n' +
      '• All unlocked & completed levels\n' +
      '• Everything for Computer, Science, and AP\n\n' +
      'This cannot be undone!'
    );
    if (!ok) return;

    // ----- Clear GLOBAL STATS -----
    localStorage.removeItem('gamesPlayed');
    localStorage.removeItem('bestTime');
    localStorage.removeItem('totalMatches');
    localStorage.removeItem('rewardsCount');

    // ----- Clear LEVEL PROGRESSION for ALL subjects -----
    ['computer', 'science', 'ap'].forEach(function (sub) {
      localStorage.removeItem('matchMonster_unlocked_' + sub);
      localStorage.removeItem('matchMonster_completed_' + sub);
    });

    // ----- Refresh the UI ----
    if (typeof updateStatsDisplay === 'function') updateStatsDisplay();
    if (typeof window.updatePlayerStats === 'function') window.updatePlayerStats();

    // Close the settings modal
    const modalEl = document.getElementById('settingsModal');
    if (modalEl && window.bootstrap) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    }

    // Quiet, non-blocking notification
    const toast = document.createElement('div');
    toast.textContent = ' Progress reset! Level 1 is unlocked.';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #ef9886, #dc73bf);
      color: #2a1a3a;
      padding: 12px 28px;
      border-radius: 100px;
      font-family: 'Irish Grover', cursive;
      font-size: 1rem;
      box-shadow: 0 12px 40px rgba(220, 115, 191, 0.5);
      z-index: 3000;
      animation: fadeUp 0.4s ease;
      pointer-events: none;
    `;
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 2600);

    // If on home page, reset the game board
    const homeLobby      = document.getElementById('homeLobby');
    const homeGameScreen = document.getElementById('homeGameScreen');
    if (homeLobby)      homeLobby.style.display = 'block';
    if (homeGameScreen) homeGameScreen.style.display = 'none';
    if (typeof window.__quitGame === 'function') window.__quitGame();
  });

  // ---- Change handler for settings toggles + difficulty select ----
  document.addEventListener('change', function (e) {
    const target = e.target;

    // Settings toggles (sound / music)
    if (target.classList && target.classList.contains('settings-toggle')) {
      const key = target.dataset.key;
      if (key) localStorage.setItem(key, target.checked);
      return;
    }

    // Difficulty select
    if (target.id === 'difficultySelect') {
      localStorage.setItem('difficulty', target.value);
    }
  });
}

// --------------------------------------------------------------
// STATS – read/write from localStorage
// --------------------------------------------------------------
function getStats() {
  return {
    gamesPlayed: parseInt(localStorage.getItem('gamesPlayed') || '0'),
    bestTime:    localStorage.getItem('bestTime') || null,
    totalMatches: parseInt(localStorage.getItem('totalMatches') || '0'),
    rewards:      parseInt(localStorage.getItem('rewardsCount') || '0')
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
  localStorage.setItem('gamesPlayed', stats.gamesPlayed);
  localStorage.setItem('bestTime',    stats.bestTime);
  localStorage.setItem('totalMatches', stats.totalMatches);
  localStorage.setItem('rewardsCount', stats.rewards);
  updateStatsDisplay();
}

// --------------------------------------------------------------
// HOME PAGE – GAME LOGIC
// --------------------------------------------------------------
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
    MONSTERS.forEach((emoji, idx) => {
      deck.push({ id: idx, emoji, matched: false });
      deck.push({ id: idx, emoji, matched: false });
    });
    return shuffle(deck);
  }

  function renderCards() {
    if (!grid) return;
    grid.innerHTML = '';
    cards.forEach((card, index) => {
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
      div.addEventListener('click', () => onCardClick(index));
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
    timerInterval = setInterval(() => {
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
    flippedCards.push({ index, el, card });

    if (flippedCards.length === 2) {
      moves++;
      updateGameStats();
      checkMatch();
    }
  }

  function checkMatch() {
    isLocked = true;
    const [first, second] = flippedCards;

    if (first.card.id === second.card.id) {
      first.card.matched = true;
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
      setTimeout(() => {
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

  // ---- Event listeners ----
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
    if (!grid) return;
    const width = window.innerWidth;
    let cols = 4;
    if (width < 400) cols = 3;
    if (width < 320) cols = 2;
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
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