/* ================================================================
   GAMEPLAY.JS – shared logic for all subject gameplay pages
   ================================================================ */

document.addEventListener('DOMContentLoaded', function() {

  // ---- Get subject & level from URL ----
  const urlParams = new URLSearchParams(window.location.search);
  const level = parseInt(urlParams.get('level')) || 1;
  const subject = urlParams.get('subject') || 'computer';

  // ---- PROGRESSION: verify level is unlocked ----
  const storageKey = `matchMonster_unlocked_${subject}`;
  let unlockedLevels = JSON.parse(localStorage.getItem(storageKey)) || [1];
  if (!unlockedLevels.includes(level)) {
    alert('This level is locked! Complete previous levels first.');
    window.location.href = `../Level.html?subject=${subject}`;
    return;
  }

  // ---- Calculate cards based on level ----
  const totalCards = 4 + level * 2;
  const pairs = totalCards / 2;

  // ---- Emoji pool ----
  const emojiPool = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🦄', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🐴', '🦋', '🐞', '🐝', '🦀', '🐠', '🐟', '🐡', '🐙', '🦑', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🐘', '🦏', '🐪', '🐫', '🦒', '🐃', '🐂', '🐄', '🐖', '🐏', '🐑', '🐐', '🦌', '🐕', '🐩', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🕊️', '🐇', '🦝', '🦡', '🦨', '🦔', '🦥', '🐿️'];

  const selectedEmojis = emojiPool.slice(0, pairs);

  // ---- Build deck ----
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
  const nextLevelBtn = document.getElementById('btnNextLevel');

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

  // ---- Calculate the most balanced grid layout ----
  function calculateGrid(totalCards) {
    // Find the factor pair closest to sqrt (most balanced)
    let bestCols = 1;
    let bestRows = totalCards;
    let bestDiff = Math.abs(1 - totalCards);
    
    for (let c = 1; c <= Math.ceil(Math.sqrt(totalCards)); c++) {
      if (totalCards % c === 0) {
        const r = totalCards / c;
        const diff = Math.abs(c - r);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestCols = c;
          bestRows = r;
        }
      }
    }
    
    // Ensure columns are the larger dimension for landscape display
    // (makes better use of screen width on most devices)
    if (bestCols < bestRows) {
      [bestCols, bestRows] = [bestRows, bestCols];
    }
    
    // Cap columns at 6 to prevent too many on smaller screens
    if (bestCols > 6) {
      bestCols = 6;
      bestRows = Math.ceil(totalCards / bestCols);
    }
    
    // For Level 1 (6 cards), explicitly use 3 columns × 2 rows
    if (totalCards === 6) {
      bestCols = 3;
      bestRows = 2;
    }
    
    return { cols: bestCols, rows: bestRows };
  }

    // ---- Render cards (CSS handles responsive columns) ----
  function renderCards() {
    grid.innerHTML = '';
    // The CSS grid with auto-fit + minmax handles all column changes
    // No need to calculate columns in JavaScript!

    deck.forEach((emoji, index) => {
      const div = document.createElement('div');
      div.className = 'card-item';
      div.dataset.index = index;

      const inner = document.createElement('div');
      inner.className = 'card-inner';

      // ---- BACK FACE ----
      const back = document.createElement('div');
      back.className = 'card-face card-face-back';
      inner.appendChild(back);

      // ---- FRONT FACE (Blue Card) ----
      const front = document.createElement('div');
      front.className = 'card-face card-face-front';

      // 1. Card Number (top-left)
      const number = document.createElement('span');
      number.className = 'card-number';
      number.textContent = String(index + 1).padStart(2, '0');
      front.appendChild(number);

      // 2. Emoji (center)
      const emojiSpan = document.createElement('span');
      emojiSpan.className = 'card-emoji';
      emojiSpan.textContent = emoji;
      front.appendChild(emojiSpan);

      // 3. Footer (bottom bar)
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

      // ---- FINALIZE ----
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

  // ---- Win – unlock next level, save completion ----
  function showWin() {
    if (winMoves) winMoves.textContent = moves;
    if (winTime) winTime.textContent = seconds + 's';
    if (winOverlay) winOverlay.classList.add('show');

    // ----- UNLOCK NEXT LEVEL -----
    const nextLevel = level + 1;
    if (nextLevel <= 10) {
      let unlocked = JSON.parse(localStorage.getItem(storageKey)) || [1];
      if (!unlocked.includes(nextLevel)) {
        unlocked.push(nextLevel);
        localStorage.setItem(storageKey, JSON.stringify(unlocked));
        console.log(`🎉 Unlocked Level ${nextLevel} for ${subject}!`);
      }
    }

    // ----- MARK CURRENT LEVEL AS COMPLETED -----
    const completedKey = `matchMonster_completed_${subject}`;
    let completed = JSON.parse(localStorage.getItem(completedKey)) || [];
    if (!completed.includes(level)) {
      completed.push(level);
      localStorage.setItem(completedKey, JSON.stringify(completed));
    }

    // ----- UPDATE NEXT LEVEL BUTTON -----
    if (nextLevelBtn) {
      if (nextLevel <= 10) {
        nextLevelBtn.innerHTML = `<i class="fas fa-arrow-right me-2"></i> Next Level`;
        nextLevelBtn.onclick = function() {
          window.location.href = `Gameplay-${subject}.html?level=${nextLevel}`;
        };
        nextLevelBtn.style.display = 'inline-block';
      } else {
        nextLevelBtn.innerHTML = `<i class="fas fa-trophy me-2"></i> All Done`;
        nextLevelBtn.onclick = function() {
          window.location.href = `../Level.html?subject=${subject}`;
        };
      }
    }

    // ----- Save global stats -----
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

  // ---- Go back to Levels ----
  function goToLevels() {
    window.location.href = `../Level.html?subject=${subject}`;
  }

  // ---- Event listeners ----
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