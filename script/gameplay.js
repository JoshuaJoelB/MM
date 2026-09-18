/* ================================================================
   GAMEPLAY.JS – shared logic for all subject gameplay pages
   ================================================================ */

document.addEventListener('DOMContentLoaded', function() {

  // ---- Get level & subject from URL (with filename fallback) ----
  const urlParams = new URLSearchParams(window.location.search);
  const level   = parseInt(urlParams.get('level')) || 1;
  const subject = urlParams.get('subject')
                || (window.location.pathname.match(/Gameplay-(\w+)\.html/)?.[1])
                || 'computer';

  // ---- PROGRESSION: verify level is unlocked ----
  const storageKey = `matchMonster_unlocked_${subject}`;
  let unlockedLevels = JSON.parse(localStorage.getItem(storageKey)) || [1];
  if (!unlockedLevels.includes(level)) {
    alert('This level is locked! Complete previous levels first.');
    window.location.href = `../Level.html?subject=${subject}`;
    return;
  }

  // ---- Card math ----
  const totalCards = 4 + level * 2;
  const pairs      = totalCards / 2;

  // ---- Points calculation ----
  const STARS_PER_MATCH = 5;                       // 5 stars per matched pair
  const COINS_BASE      = 10;                      // base coins for completing a level
  const COINS_PER_LEVEL = level * 5;               // +5 coins per level number
  const starsEarned     = pairs * STARS_PER_MATCH;
  const coinsEarned     = COINS_BASE + COINS_PER_LEVEL;

  // ---- Emoji pool ----
  const emojiPool = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🦄','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🐴','🦋','🐞','🐝','🦀','🐠','🐟','🐡','🐙','🦑','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🐘','🦏','🐪','🐫','🦒','🐃','🐂','🐄','🐖','🐏','🐑','🐐','🦌','🐕','🐩','🐈','🐓','🦃','🦚','🦜','🦢','🕊️','🐇','🦝','🦡','🦨','🦔','🦥','🐿️'];

  const selectedEmojis = emojiPool.slice(0, pairs);

  let deck = [...selectedEmojis, ...selectedEmojis];
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  deck = shuffle(deck);

  // ---- DOM ----
  const grid         = document.getElementById('cardGrid');
  const levelDisplay = document.getElementById('levelDisplay');
  const movesDisplay = document.getElementById('movesDisplay');
  const timerDisplay = document.getElementById('timerDisplay');
  const winOverlay   = document.getElementById('winOverlay');
  const winMoves     = document.getElementById('winMoves');
  const winTime      = document.getElementById('winTime');
  const nextLevelBtn = document.getElementById('btnNextLevel');

  // Win overlay reward fields (may be missing on old pages — safe-guarded)
  const winStarsEarned = document.getElementById('winStarsEarned');
  const winCoinsEarned = document.getElementById('winCoinsEarned');

  // ---- State ----
  let flippedCards = [];
  let matchedPairs = 0;
  let moves = 0;
  let isLocked = false;
  let timerInterval = null;
  let seconds = 0;
  let gameStarted = false;

  if (levelDisplay) levelDisplay.textContent = level;

  // ---- Render ----
  function renderCards() {
    grid.innerHTML = '';
    deck.forEach((emoji, index) => {
      const div = document.createElement('div');
      div.className = 'card-item';
      div.dataset.index = index;

      const inner = document.createElement('div');
      inner.className = 'card-inner';

      const back = document.createElement('div');
      back.className = 'card-face card-face-back';
      inner.appendChild(back);

      const front = document.createElement('div');
      front.className = 'card-face card-face-front';

      const number = document.createElement('span');
      number.className = 'card-number';
      number.textContent = String(index + 1).padStart(2, '0');
      front.appendChild(number);

      const emojiSpan = document.createElement('span');
      emojiSpan.className = 'card-emoji';
      emojiSpan.textContent = emoji;
      front.appendChild(emojiSpan);

      const footer = document.createElement('div');
      footer.className = 'card-footer';

      const bonus = document.createElement('span');
      bonus.className = 'card-bonus';
      bonus.textContent = '⭐ BONUS POINTS';
      footer.appendChild(bonus);

      const text = document.createElement('span');
      text.className = 'card-text';
      text.textContent = 'Lorem ipsum dolor sit amet, consectetur';
      footer.appendChild(text);

      front.appendChild(footer);
      inner.appendChild(front);
      div.appendChild(inner);
      div.addEventListener('click', () => onCardClick(index));
      grid.appendChild(div);
    });
  }

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
  function stopTimer() { clearInterval(timerInterval); timerInterval = null; }
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
    const el   = grid.children[index];
    if (!el) return;
    if (el.classList.contains('flipped') || el.classList.contains('matched')) return;

    if (!gameStarted) { gameStarted = true; startTimer(); }

    el.classList.add('flipped');
    flippedCards.push({ index, el, card });

    if (flippedCards.length === 2) {
      moves++;
      updateStats();
      checkMatch();
    }
  }

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
    if (winTime)  winTime.textContent  = seconds + 's';

    // Show points earned in the win modal
    if (winStarsEarned) winStarsEarned.textContent = '+' + starsEarned;
    if (winCoinsEarned) winCoinsEarned.textContent = '+' + coinsEarned;

    if (winOverlay) winOverlay.classList.add('show');

    // ----- REGISTER GLOBAL PLAYER-LEVEL COMPLETION -----
    if (typeof window.completeLevel === 'function') {
      window.completeLevel(subject, level);
    }

    // ----- ADD REWARDS TO GLOBAL POINTS -----
    // We store points in the same keys used by player-level.js:
    //   totalMatches  → stars
    //   gamesPlayed   → impacts coins (gamesPlayed * 10 + completions * 25)
    // So we bump totalMatches by pairs and gamesPlayed by 1,
    // which will make the star chip increase by (pairs * 5) — no wait.
    // Simpler: keep a dedicated starsTotal / coinsTotal and layer it on top.
    const currentStars = parseInt(localStorage.getItem('starsTotal') || '0');
    const currentCoins = parseInt(localStorage.getItem('coinsTotal') || '0');
    localStorage.setItem('starsTotal', currentStars + starsEarned);
    localStorage.setItem('coinsTotal', currentCoins + coinsEarned);

    // Refresh navbar chips using player-level.js
    if (typeof window.updatePlayerLevelBox === 'function') {
      window.updatePlayerLevelBox();
    }

    // ----- UNLOCK NEXT LEVEL -----
    const nextLevel = level + 1;
    if (nextLevel <= 10) {
      let unlocked = JSON.parse(localStorage.getItem(storageKey)) || [1];
      if (!unlocked.includes(nextLevel)) {
        unlocked.push(nextLevel);
        localStorage.setItem(storageKey, JSON.stringify(unlocked));
      }
    }

    // ----- NEXT LEVEL BUTTON -----
    if (nextLevelBtn) {
      if (nextLevel <= 10) {
        nextLevelBtn.innerHTML = `<i class="fas fa-arrow-right me-2"></i> Next Level`;
        nextLevelBtn.onclick = function() {
          window.location.href = `Gameplay-${subject}.html?level=${nextLevel}&subject=${subject}`;
        };
        nextLevelBtn.style.display = 'inline-block';
      } else {
        nextLevelBtn.innerHTML = `<i class="fas fa-trophy me-2"></i> All Done`;
        nextLevelBtn.onclick = function() {
          window.location.href = `../Level.html?subject=${subject}`;
        };
      }
    }

    // ----- Global stats -----
    const stats = {
      gamesPlayed:  parseInt(localStorage.getItem('gamesPlayed')  || '0'),
      bestTime:     localStorage.getItem('bestTime') || null,
      totalMatches: parseInt(localStorage.getItem('totalMatches') || '0'),
      rewards:      parseInt(localStorage.getItem('rewardsCount') || '0')
    };
    stats.gamesPlayed += 1;
    if (stats.bestTime === null || seconds < stats.bestTime) stats.bestTime = seconds;
    stats.totalMatches += pairs;
    stats.rewards += 1;
    localStorage.setItem('gamesPlayed',  stats.gamesPlayed);
    localStorage.setItem('bestTime',     stats.bestTime);
    localStorage.setItem('totalMatches', stats.totalMatches);
    localStorage.setItem('rewardsCount', stats.rewards);
  }

  function goToLevels() {
    window.location.href = `../Level.html?subject=${subject}`;
  }

  document.getElementById('btnLevels')?.addEventListener('click', goToLevels);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (winOverlay && winOverlay.classList.contains('show')) {
        winOverlay.classList.remove('show');
      }
      goToLevels();
    }
  });

  renderCards();
  updateStats();
  resetTimer();
});