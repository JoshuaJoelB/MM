/* ================================================================
   GAMEPLAY.JS – shared logic for all subject gameplay pages
   - Points earned on win
   - Star currency to unlock next level
   - Syncs chips on navbar + gameplay navbar
   ================================================================ */

document.addEventListener('DOMContentLoaded', function() {

  // ============================================================
  // SYNC NAVBAR CHIPS ON PAGE LOAD
  // ============================================================
  function syncChips() {
    if (typeof window.updatePlayerLevelBox === 'function') {
      window.updatePlayerLevelBox();
    } else {
      let tries = 0;
      const retry = setInterval(function () {
        if (typeof window.updatePlayerLevelBox === 'function') {
          window.updatePlayerLevelBox();
          clearInterval(retry);
        } else if (++tries > 10) {
          clearInterval(retry);
        }
      }, 100);
    }
  }
  syncChips();

  // ---- Get level & subject from URL ----
  const urlParams = new URLSearchParams(window.location.search);
  const level   = parseInt(urlParams.get('level')) || 1;
  const subject = urlParams.get('subject')
                || (window.location.pathname.match(/Gameplay-(\w+)\.html/)?.[1])
                || 'computer';

  // ---- Verify level is unlocked ----
  const storageKey = `matchMonster_unlocked_${subject}`;
  let unlockedLevels = JSON.parse(localStorage.getItem(storageKey)) || [1];
  if (!unlockedLevels.includes(level)) {
    alert('This level is locked! Complete previous levels or unlock it with stars.');
    window.location.href = `../Level.html?subject=${subject}`;
    return;
  }

  // ---- Card math ----
  const totalCards = 4 + level * 2;
  const pairs      = totalCards / 2;

  // ---- Points calculation ----
  const STARS_PER_MATCH = 5;
  const COINS_BASE      = 10;
  const COINS_PER_LEVEL = level * 5;
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
  const winStarsEarned = document.getElementById('winStarsEarned');
  const winCoinsEarned = document.getElementById('winCoinsEarned');

  // ---- State ----
  let flippedCards  = [];
  let matchedPairs  = 0;
  let moves         = 0;
  let isLocked      = false;
  let timerInterval = null;
  let seconds       = 0;
  let gameStarted   = false;

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

    // ----- 1. Add reward points to localStorage FIRST -----
    const currentStars = parseInt(localStorage.getItem('starsTotal') || '0', 10);
    const currentCoins = parseInt(localStorage.getItem('coinsTotal') || '0', 10);

    const newStarsTotal = currentStars + starsEarned;
    const newCoinsTotal = currentCoins + coinsEarned;

    localStorage.setItem('starsTotal', newStarsTotal);
    localStorage.setItem('coinsTotal', newCoinsTotal);

    // ----- 2. Read the SAME totals the navbar will display -----
    const displayStars = parseInt(localStorage.getItem('starsTotal') || '0', 10);
    const displayCoins = parseInt(localStorage.getItem('coinsTotal') || '0', 10);

    // ----- 3. Push the same values into the modal -----
    if (winStarsEarned) winStarsEarned.textContent = displayStars;
    if (winCoinsEarned) winCoinsEarned.textContent = displayCoins;

    // ----- 4. Show the overlay -----
    if (winOverlay) winOverlay.classList.add('show');

    // ----- 5. Register completion -----
    if (typeof window.completeLevel === 'function') {
      window.completeLevel(subject, level);
    }

    // ----- 6. Refresh the navbar chips (same data as modal) -----
    if (typeof window.updatePlayerLevelBox === 'function') {
      window.updatePlayerLevelBox();
    }

    // ----- 7. Build Unlock Next Level button -----
    const nextLevel = level + 1;

    if (nextLevelBtn) {
      if (nextLevel <= 10) {
        nextLevelBtn.innerHTML = `<i class="fas fa-unlock me-2"></i> Unlock Next Level`;
        nextLevelBtn.onclick = function () {
          if (typeof window.tryUnlockLevel !== 'function') {
            window.location.href = `Gameplay-${subject}.html?level=${nextLevel}&subject=${subject}`;
            return;
          }
          const result = window.tryUnlockLevel(subject, nextLevel);
          if (result.ok) {
            window.location.href = `Gameplay-${subject}.html?level=${nextLevel}&subject=${subject}`;
          } else if (result.reason === 'not_enough_stars') {
            alert(
              `⭐ Not enough stars!\n\n` +
              `Level ${nextLevel} costs ${result.cost} stars.\n` +
              `You have ${result.stars} stars.\n\n` +
              `Play more levels to earn stars!`
            );
          } else if (result.reason === 'previous_locked') {
            alert(`Complete the previous level first!`);
          }
        };
        nextLevelBtn.style.display = 'inline-block';
      } else {
        nextLevelBtn.innerHTML = `<i class="fas fa-trophy me-2"></i> All Done`;
        nextLevelBtn.onclick = function () {
          window.location.href = `../Level.html?subject=${subject}`;
        };
      }
    }

    // ----- 8. Global stats -----
    const stats = {
      gamesPlayed:  parseInt(localStorage.getItem('gamesPlayed')  || '0', 10),
      bestTime:     localStorage.getItem('bestTime') || null,
      totalMatches: parseInt(localStorage.getItem('totalMatches') || '0', 10),
      rewards:      parseInt(localStorage.getItem('rewardsCount') || '0', 10)
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