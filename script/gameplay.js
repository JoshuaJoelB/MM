/* ================================================================
   GAMEPLAY.JS – shared logic for all subject gameplay pages
   - Real photos for cards (Unsplash CDN)
   - Subject icon image displayed on card back
   - Points earned on FIRST completion only (no replay farming)
   - "Next Level" skips star cost when next level is already unlocked
   - 🎉 Confetti celebration on win (child-friendly)
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

  // ============================================================
  // CONFETTI LOADER
  // ============================================================
  let confettiPromise = null;
  function loadConfetti() {
    if (confettiPromise) return confettiPromise;
    confettiPromise = new Promise((resolve) => {
      if (window.confetti) { resolve(window.confetti); return; }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
      script.async = true;
      script.onload  = () => resolve(window.confetti);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
      setTimeout(() => resolve(window.confetti || null), 2500);
    });
    return confettiPromise;
  }

  const CONFETTI_COLORS = [
    '#dc73bf', '#ef9886', '#fcd34d',
    '#65a5d9', '#4ade80', '#a78bfa', '#ffffff'
  ];

  function celebrateWin() {
    loadConfetti().then((confetti) => {
      if (!confetti) return;
      const defaults = {
        spread: 80,
        ticks: 220,
        gravity: 0.85,
        decay: 0.92,
        startVelocity: 42,
        colors: CONFETTI_COLORS,
        zIndex: 3000,
        disableForReducedMotion: true
      };
      confetti({ ...defaults, particleCount: 90, origin: { x: 0.5, y: 0.55 }, scalar: 1.1 });
      setTimeout(() => {
        confetti({ ...defaults, particleCount: 55, angle: 60,  origin: { x: 0, y: 0.7 }, scalar: 1.0 });
        confetti({ ...defaults, particleCount: 55, angle: 120, origin: { x: 1, y: 0.7 }, scalar: 1.0 });
      }, 180);
      setTimeout(() => {
        confetti({ ...defaults, particleCount: 40, spread: 100, startVelocity: 30, gravity: 0.6, shapes: ['star'], scalar: 0.9, origin: { x: 0.5, y: 0.4 } });
      }, 420);
      setTimeout(() => {
        confetti({ ...defaults, particleCount: 60, spread: 160, startVelocity: 22, gravity: 0.4, scalar: 0.85, origin: { x: 0.5, y: 0.15 } });
      }, 700);
    });
  }

  // ---- Get level & subject from URL ----
  const urlParams = new URLSearchParams(window.location.search);
  const level   = parseInt(urlParams.get('level')) || 1;
  const subject = urlParams.get('subject')
                || (window.location.pathname.match(/Gameplay-(\w+)\.html/)?.[1])
                || 'computer';

  const subjectInfo = {
    ap:       { name: 'AP',       icon: '../Assets/icons/ap_icon.png' },
    computer: { name: 'Computer', icon: '../Assets/icons/computer_icon.png' },
    science:  { name: 'Science',  icon: '../Assets/icons/science_icon.png' }
  }[subject] || { name: 'Subject', icon: '../Assets/icons/computer_icon.png' };

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

  // ---- Image source ----
  const imagePools = {
    computer: [
      'photo-1517336714731-489689fd1ca8',
      'photo-1496181133206-80ce9b88a853',
      'photo-1527814050087-3793815479db',
      'photo-1541140532154-b024d705b90a',
      'photo-1587829741301-dc798b83add3',
      'photo-1527864550417-7fd91fc51a46',
      'photo-1615663245857-ac93bb7c39e7',
      'photo-1593642702749-b7d2a804fbcf',
      'photo-1527689368864-3a821dbccc34',
      'photo-1518770660439-4636190af475',
      'photo-1555617981-dac3880eac6e',
      'photo-1587145820266-a5951ee6f620'
    ],
    science: [
      'photo-1502082553048-f009c37129b9',
      'photo-1416879595882-3373a0480b5b',
      'photo-1466692476868-aef1dfb1e735',
      'photo-1490750967868-88aa4486c946',
      'photo-1508610048659-a06b669e3321',
      'photo-1470071459604-3b5ec3a7fe05',
      'photo-1441974231531-c6227db76b6e',
      'photo-1444703686981-a3abbc4d4fe3',
      'photo-1451187580459-43490279c0fa',
      'photo-1446776653964-20c1d3a81b06',
      'photo-1419242902214-272b3f66ee7a',
      'photo-1502134249126-9f3755a50d78'
    ],
    ap: [
      'photo-1526778548025-fa2f459cd5c1',
      'photo-1524661135-423995f22d0b',
      'photo-1526392060635-9d6019884377',
      'photo-1476514525535-07fb3b4ae5f1',
      'photo-1511895426328-dc8714191300',
      'photo-1476703993599-0035a21b17a9',
      'photo-1501785888041-af3ef285b470',
      'photo-1449824913935-59a10b8d2000',
      'photo-1513635269975-59663e0ac1ad',
      'photo-1500534314209-a25ddb2bd429'
    ]
  };

  function getImageUrl(pairIndex) {
    const pool = imagePools[subject] || imagePools.computer;
    const photoId = pool[pairIndex % pool.length];
    return `https://images.unsplash.com/${photoId}?w=400&h=500&fit=crop&auto=format&q=70`;
  }

  // ---- Build deck ----
  let deck = [];
  for (let i = 0; i < pairs; i++) {
    deck.push(i);
    deck.push(i);
  }
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  deck = shuffle(deck);

  // ---- DOM ----
  const grid           = document.getElementById('cardGrid');
  const levelDisplay   = document.getElementById('levelDisplay');
  const movesDisplay   = document.getElementById('movesDisplay');
  const timerDisplay   = document.getElementById('timerDisplay');
  const winOverlay     = document.getElementById('winOverlay');
  const winMoves       = document.getElementById('winMoves');
  const winTime        = document.getElementById('winTime');
  const nextLevelBtn   = document.getElementById('btnNextLevel');
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

  // ============================================================
  // REWARD HELPERS
  // ============================================================

  // Was this level already completed BEFORE this play?
  function wasLevelCompletedBefore() {
    try {
      const arr = JSON.parse(localStorage.getItem('matchMonster_completed_' + subject) || '[]');
      return Array.isArray(arr) && arr.includes(level);
    } catch (e) { return false; }
  }

  // Is the next level already unlocked?
  function isNextLevelUnlocked() {
    try {
      const arr = JSON.parse(localStorage.getItem('matchMonster_unlocked_' + subject) || '[1]');
      return Array.isArray(arr) && arr.includes(level + 1);
    } catch (e) { return false; }
  }

  // ---- Render ----
  function renderCards() {
    grid.innerHTML = '';

    deck.forEach((pairIndex, index) => {
      const div = document.createElement('div');
      div.className = 'card-item';
      div.dataset.index = index;
      div.dataset.pair = pairIndex;

      const inner = document.createElement('div');
      inner.className = 'card-inner';

      // CARD BACK
      const back = document.createElement('div');
      back.className = 'card-face card-face-back';

      const badge = document.createElement('div');
      badge.className = 'card-subject-badge';

      const iconImg = document.createElement('img');
      iconImg.className = 'card-subject-icon';
      iconImg.src = subjectInfo.icon;
      iconImg.alt = subjectInfo.name;
      iconImg.draggable = false;
      badge.appendChild(iconImg);

      const subjectLabel = document.createElement('span');
      subjectLabel.className = 'card-subject-name';
      subjectLabel.textContent = subjectInfo.name;
      badge.appendChild(subjectLabel);

      back.appendChild(badge);
      inner.appendChild(back);

      // CARD FRONT
      const front = document.createElement('div');
      front.className = 'card-face card-face-front';

      const number = document.createElement('span');
      number.className = 'card-number';
      number.textContent = String(index + 1).padStart(2, '0');
      front.appendChild(number);

      const img = document.createElement('img');
      img.className = 'card-image';
      img.src = getImageUrl(pairIndex);
      img.alt = `Card ${index + 1}`;
      img.loading = 'lazy';
      img.draggable = false;
      front.appendChild(img);

      const footer = document.createElement('div');
      footer.className = 'card-footer';

      const bonus = document.createElement('span');
      bonus.className = 'card-bonus';
      bonus.textContent = '★ BONUS POINTS';
      footer.appendChild(bonus);

      const text = document.createElement('span');
      text.className = 'card-text';
      text.textContent = 'Lorem ipsum dolor sit amet';
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
    const el = grid.children[index];
    if (!el) return;
    if (el.classList.contains('flipped') || el.classList.contains('matched')) return;

    if (!gameStarted) { gameStarted = true; startTimer(); }

    el.classList.add('flipped');
    flippedCards.push({ index, el, pair: deck[index] });

    if (flippedCards.length === 2) {
      moves++;
      updateStats();
      checkMatch();
    }
  }

  function checkMatch() {
    isLocked = true;
    const [first, second] = flippedCards;

    if (first.pair === second.pair) {
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
      }, 800);
    }
  }

  // ============================================================
  // WIN — only rewards on FIRST completion
  // ============================================================
  function showWin() {
    if (winMoves) winMoves.textContent = moves;
    if (winTime)  winTime.textContent  = seconds + 's';

    const wasCompletedBefore = wasLevelCompletedBefore();

    // ---- ONLY award stars/coins on FIRST completion ----
    if (!wasCompletedBefore) {
      const currentStars = parseInt(localStorage.getItem('starsTotal') || '0', 10);
      const currentCoins = parseInt(localStorage.getItem('coinsTotal') || '0', 10);
      localStorage.setItem('starsTotal', currentStars + starsEarned);
      localStorage.setItem('coinsTotal', currentCoins + coinsEarned);
    }

    // Always show the CURRENT total (even on replay)
    const displayStars = parseInt(localStorage.getItem('starsTotal') || '0', 10);
    const displayCoins = parseInt(localStorage.getItem('coinsTotal') || '0', 10);
    if (winStarsEarned) winStarsEarned.textContent = displayStars;
    if (winCoinsEarned) winCoinsEarned.textContent = displayCoins;

    // ---- Show overlay + celebrate ----
    if (winOverlay) winOverlay.classList.add('show');
    celebrateWin();

    // ---- Register completion (safe — only adds if not there) ----
    if (typeof window.completeLevel === 'function') {
      window.completeLevel(subject, level);
    }
    if (typeof window.updatePlayerLevelBox === 'function') {
      window.updatePlayerLevelBox();
    }

    // ============================================================
    // NEXT LEVEL BUTTON — two modes:
    //   1) Next level already unlocked → "Next Level" (no rewards needed)
    //   2) Next level still locked     → "Unlock Next Level" (costs stars)
    // ============================================================
    const nextLevel = level + 1;

    if (nextLevelBtn) {
      if (nextLevel <= 10) {
        const nextUnlocked = isNextLevelUnlocked();

        if (nextUnlocked) {
          // --- No rewards needed — go straight to next level ---
          nextLevelBtn.innerHTML = `Next Level <i class="fas fa-arrow-right ms-2"></i>`;
          nextLevelBtn.onclick = function () {
            window.location.href =
              `Gameplay-${subject}.html?level=${nextLevel}&subject=${subject}`;
          };
        } else {
          // --- Still locked — charge stars to unlock ---
          nextLevelBtn.innerHTML = `<i class="fas fa-unlock me-2"></i> Unlock Next Level`;
          nextLevelBtn.onclick = function () {
            if (typeof window.tryUnlockLevel !== 'function') {
              window.location.href = `../Level.html?subject=${subject}`;
              return;
            }
            const result = window.tryUnlockLevel(subject, nextLevel);
            if (result.ok) {
              if (!result.alreadyUnlocked) {
                try {
                  sessionStorage.setItem('mm_just_unlocked', JSON.stringify({
                    subject: subject,
                    level:   nextLevel
                  }));
                } catch (e) {}
              }
              window.location.href = `../Level.html?subject=${subject}`;
            } else if (result.reason === 'not_enough_stars') {
              alert(
                `★ Not enough stars!\n\n` +
                `Level ${nextLevel} costs ${result.cost} stars.\n` +
                `You have ${result.stars} stars.\n\n` +
                `Play more levels to earn stars!`
              );
            } else if (result.reason === 'previous_locked') {
              alert(`Complete the previous level first!`);
            }
          };
        }

        nextLevelBtn.style.display = 'inline-block';
      } else {
        // Level 10 = final level
        nextLevelBtn.innerHTML = `<i class="fas fa-trophy me-2"></i> All Done`;
        nextLevelBtn.onclick = function () {
          window.location.href = `../Level.html?subject=${subject}`;
        };
      }
    }

    // ---- Global stats (always update, even on replay) ----
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