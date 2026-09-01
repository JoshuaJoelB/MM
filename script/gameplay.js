/* ================================================================
   GAMEPLAY.JS – shared logic for all subject gameplay pages
   ================================================================ */

document.addEventListener('DOMContentLoaded', function() {

  // ---- Get subject & level from URL ----
  const urlParams = new URLSearchParams(window.location.search);
  const level = parseInt(urlParams.get('level')) || 1;
  const subject = urlParams.get('subject') || 'computer';

  // ---- Calculate cards based on level ----
  // Level 1: 6 cards (3 pairs), Level 2: 8 cards (4 pairs), ... Level 10: 24 cards (12 pairs)
  const totalCards = 4 + level * 2;
  const pairs = totalCards / 2;

  // ---- Emoji pool ----
  const emojiPool = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🦄', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🐴', '🦋', '🐞', '🐝', '🦀', '🐠', '🐟', '🐡', '🐙', '🦑', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🐘', '🦏', '🐪', '🐫', '🦒', '🐃', '🐂', '🐄', '🐖', '🐏', '🐑', '🐐', '🦌', '🐕', '🐩', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🕊️', '🐇', '🦝', '🦡', '🦨', '🦔', '🦥', '🐿️'];

  const selectedEmojis = emojiPool.slice(0, pairs);

  // ---- Build deck (double & shuffle) ----
  let deck = [...selectedEmojis, ...selectedEmojis];
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  deck = shuffle(deck);

  // ---- DOM refs ----
  const grid = document.getElementById('cardGrid');
  const levelDisplay = document.getElementById('levelDisplay');
  const movesDisplay = document.getElementById('movesDisplay');
  const timerDisplay = document.getElementById('timerDisplay');
  const winOverlay = document.getElementById('winOverlay');
  const winMoves = document.getElementById('winMoves');
  const winTime = document.getElementById('winTime');

  // ---- Game state ----
  let flippedCards = [];
  let matchedPairs = 0;
  let moves = 0;
  let isLocked = false;
  let timerInterval = null;
  let seconds = 0;
  let gameStarted = false;

  // ---- Display level ----
  if (levelDisplay) levelDisplay.textContent = level;

  // ---- Render cards ----
  function renderCards() {
    grid.innerHTML = '';
    // Dynamic columns based on total cards
    let cols = Math.min(6, Math.ceil(Math.sqrt(totalCards)));
    if (totalCards <= 6) cols = 3;
    if (totalCards <= 8) cols = 4;
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    deck.forEach((emoji, index) => {
      const div = document.createElement('div');
      div.className = 'card-item';
      div.dataset.index = index;

      const inner = document.createElement('div');
      inner.className = 'card-inner';

      const back = document.createElement('div');
      back.className = 'card-face card-face-back';

      const front = document.createElement('div');
      front.className = 'card-face card-face-front';
      front.textContent = emoji;

      inner.appendChild(back);
      inner.appendChild(front);
      div.appendChild(inner);

      div.addEventListener('click', () => onCardClick(index));
      grid.appendChild(div);
    });
  }

  // ---- Update stats ----
  function updateStats() {
    if (movesDisplay) movesDisplay.textContent = moves;
  }

  // ---- Timer ----
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

  // ---- Card click ----
  function onCardClick(index) {
    if (isLocked) return;
    const card = deck[index];
    const el = grid.children[index];
    if (!el) return;
    if (el.classList.contains('flipped') || el.classList.contains('matched')) return;

    if (!gameStarted) {
      gameStarted = true;
      startTimer();
    }

    el.classList.add('flipped');
    flippedCards.push({ index, el, card });

    if (flippedCards.length === 2) {
      moves++;
      updateStats();
      checkMatch();
    }
  }

  // ---- Check match ----
  function checkMatch() {
    isLocked = true;
    const [first, second] = flippedCards;

    if (first.card === second.card) {
      first.el.classList.add('matched');
      second.el.classList.add('matched');
      matchedPairs++;
      flippedCards = [];
      isLocked = false;

      if (matchedPairs === pairs) {
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

  // ---- Win ----
  function showWin() {
    if (winMoves) winMoves.textContent = moves;
    if (winTime) winTime.textContent = seconds + 's';
    if (winOverlay) winOverlay.classList.add('show');

    // Save stats to localStorage
    const stats = {
      gamesPlayed: parseInt(localStorage.getItem('gamesPlayed') || '0'),
      bestTime: localStorage.getItem('bestTime') || null,
      totalMatches: parseInt(localStorage.getItem('totalMatches') || '0'),
      rewards: parseInt(localStorage.getItem('rewardsCount') || '0')
    };
    stats.gamesPlayed += 1;
    if (stats.bestTime === null || seconds < stats.bestTime) {
      stats.bestTime = seconds;
    }
    stats.totalMatches += pairs;
    stats.rewards += 1;
    localStorage.setItem('gamesPlayed', stats.gamesPlayed);
    localStorage.setItem('bestTime', stats.bestTime);
    localStorage.setItem('totalMatches', stats.totalMatches);
    localStorage.setItem('rewardsCount', stats.rewards);
  }

  // ---- Replay ----
  function replayGame() {
    if (winOverlay) winOverlay.classList.remove('show');
    deck = shuffle([...selectedEmojis, ...selectedEmojis]);
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    isLocked = false;
    resetTimer();
    updateStats();
    renderCards();
  }

  // ---- Go back to Levels ----
  function goToLevels() {
    window.location.href = `../Level.html?subject=${subject}`;
  }

  // ---- Event listeners ----
  document.getElementById('btnReplay')?.addEventListener('click', replayGame);
  document.getElementById('btnLevels')?.addEventListener('click', goToLevels);

  // ---- Keyboard shortcut ----
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (winOverlay.classList.contains('show')) {
        winOverlay.classList.remove('show');
      }
      goToLevels();
    }
  });

  // ---- Initialize ----
  renderCards();
  updateStats();
  resetTimer();

});