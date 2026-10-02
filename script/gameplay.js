

document.addEventListener('DOMContentLoaded', function() {

  // ---- SYNC NAVBAR CHIPS ----
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
  // CONFETTI
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
        spread: 80, ticks: 220, gravity: 0.85, decay: 0.92,
        startVelocity: 42, colors: CONFETTI_COLORS,
        zIndex: 3000, disableForReducedMotion: true
      };
      confetti({ ...defaults, particleCount: 90, origin: { x: 0.5, y: 0.55 }, scalar: 1.1 });
      setTimeout(() => {
        confetti({ ...defaults, particleCount: 55, angle: 60,  origin: { x: 0, y: 0.7 }, scalar: 1.0 });
        confetti({ ...defaults, particleCount: 55, angle: 120, origin: { x: 1, y: 0.7 }, scalar: 1.0 });
      }, 180);
      setTimeout(() => {
        confetti({ ...defaults, particleCount: 40, spread: 100, startVelocity: 30, gravity: 0.6, shapes: ['star'], scalar: 0.9, origin: { x: 0.5, y: 0.4 } });
      }, 420);
    });
  }

  // ============================================================
  // URL PARAMS
  // ============================================================
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

  // ============================================================
  // SAFETY CHECKS
  // ============================================================

  // 1) Level must be unlocked
  const storageKey = `matchMonster_unlocked_${subject}`;
  let unlockedLevels = [];
  try {
    unlockedLevels = JSON.parse(localStorage.getItem(storageKey) || '[1]');
    if (!Array.isArray(unlockedLevels) || !unlockedLevels.length) unlockedLevels = [1];
  } catch (e) { unlockedLevels = [1]; }

  if (!unlockedLevels.includes(level)) {
    alert('This level is locked! Complete previous levels or unlock it with points.');
    window.location.href = `../Level.html?subject=${subject}`;
    return;
  }

  // 2) Previous level must be COMPLETED (Level 1 is exempt)
  if (level > 1) {
    let completedLevels = [];
    try {
      completedLevels = JSON.parse(localStorage.getItem('matchMonster_completed_' + subject) || '[]');
      if (!Array.isArray(completedLevels)) completedLevels = [];
    } catch (e) { completedLevels = []; }

    if (!completedLevels.includes(level - 1)) {
      alert(`Finish Level ${level - 1} first before playing Level ${level}!`);
      window.location.href = `../Level.html?subject=${subject}`;
      return;
    }
  }

  // ============================================================
  // CARD MATH
  // ============================================================
  const totalCards = 4 + level * 2;
  const pairs      = totalCards / 2;

  // ============================================================
  // REWARD FORMULA  (Level 1 → 15, Level 2 → 20, ...)
  // ============================================================
  const POINTS_BASE      = 10;
  const POINTS_PER_LEVEL = level * 5;
  const pointsEarned     = POINTS_BASE + POINTS_PER_LEVEL;

  // ============================================================
  // QUALITY / STAR LOGIC (single source of truth)
  // ------------------------------------------------------------
  // The bar starts FULL (100%) and shrinks as moves accumulate.
  //   moves = 0                 → 100%
  //   moves = 1.4 × pairs       →  66.67%   (3-star boundary)
  //   moves = 2.0 × pairs       →  33.33%   (2-star boundary)
  //   moves = 3.0 × pairs       →   0%
  // Both the navbar bar AND the win modal read from this function.
  // ============================================================
  const T3_RATIO = 1.4;   // 3-star ceiling
  const T2_RATIO = 2.0;   // 2-star ceiling
  const T1_RATIO = 3.0;   // 1-star ceiling

  function getBarPercentage(mv, pairCount) {
    if (pairCount <= 0) return 100;

    const t3 = T3_RATIO * pairCount;
    const t2 = T2_RATIO * pairCount;
    const t1 = T1_RATIO * pairCount;

    if (mv <= t3) {
      // 100% → 66.67%
      return 100 - (mv / t3) * 33.33;
    }
    if (mv <= t2) {
      // 66.67% → 33.33%
      return 66.67 - ((mv - t3) / (t2 - t3)) * 33.34;
    }
    if (mv <= t1) {
      // 33.33% → 0%
      return 33.33 - ((mv - t2) / (t1 - t2)) * 33.33;
    }
    return 0;
  }

  function getStarCountFromBar(pct) {
    if (pct >= 66.66) return 3;
    if (pct >= 33.33) return 2;
    return 1;
  }

  // Win-modal star calculation delegates to the SAME logic
  function calculateStars(mv, pairCount) {
    return getStarCountFromBar(getBarPercentage(mv, pairCount));
  }

  // ============================================================
  // TIMER — 2 MINUTES (120 seconds) COUNTDOWN
  // ============================================================
  const GAME_DURATION = 120;
  let secondsLeft = GAME_DURATION;

  function formatTime(secs) {
    secs = Math.max(0, Math.floor(secs));
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  // ============================================================
  // IMAGE POOLS
  // ============================================================
  const imagePools = {
    computer: [
      'photo-1517336714731-489689fd1ca8','photo-1496181133206-80ce9b88a853',
      'photo-1527814050087-3793815479db','photo-1541140532154-b024d705b90a',
      'photo-1587829741301-dc798b83add3','photo-1527864550417-7fd91fc51a46',
      'photo-1615663245857-ac93bb7c39e7','photo-1593642702749-b7d2a804fbcf',
      'photo-1527689368864-3a821dbccc34','photo-1518770660439-4636190af475',
      'photo-1555617981-dac3880eac6e','photo-1587145820266-a5951ee6f620'
    ],
    science: [
      'photo-1502082553048-f009c37129b9','photo-1416879595882-3373a0480b5b',
      'photo-1466692476868-aef1dfb1e735','photo-1490750967868-88aa4486c946',
      'photo-1508610048659-a06b669e3321','photo-1470071459604-3b5ec3a7fe05',
      'photo-1441974231531-c6227db76b6e','photo-1444703686981-a3abbc4d4fe3',
      'photo-1451187580459-43490279c0fa','photo-1446776653964-20c1d3a81b06',
      'photo-1419242902214-272b3f66ee7a','photo-1502134249126-9f3755a50d78'
    ],
    ap: [
      'photo-1526778548025-fa2f459cd5c1','photo-1524661135-423995f22d0b',
      'photo-1526392060635-9d6019884377','photo-1476514525535-07fb3b4ae5f1',
      'photo-1511895426328-dc8714191300','photo-1476703993599-0035a21b17a9',
      'photo-1501785888041-af3ef285b470','photo-1449824913935-59a10b8d2000',
      'photo-1513635269975-59663e0ac1ad','photo-1500534314209-a25ddb2bd429'
    ]
  };

  function getImageUrl(pairIndex) {
    const pool = imagePools[subject] || imagePools.computer;
    return `https://images.unsplash.com/${pool[pairIndex % pool.length]}?w=400&h=500&fit=crop&auto=format&q=70`;
  }

  // ============================================================
  // BUILD DECK
  // ============================================================
  let deck = [];
  for (let i = 0; i < pairs; i++) { deck.push(i); deck.push(i); }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  deck = shuffle(deck);

  // ============================================================
  // DOM REFS
  // ============================================================
  const grid           = document.getElementById('cardGrid');
  const levelDisplay   = document.getElementById('levelDisplay');
  const timerDisplay   = document.getElementById('timerDisplay');
  const winOverlay     = document.getElementById('winOverlay');
  const loseOverlay    = document.getElementById('loseOverlay');
  const winMoves       = document.getElementById('winMoves');
  const winTime        = document.getElementById('winTime');
  const nextLevelBtn   = document.getElementById('btnNextLevel');
  const winStarsEarned = document.getElementById('winStarsEarned');
  const winCoinsEarned = document.getElementById('winCoinsEarned');

  const starProgressFill  = document.getElementById('starProgressFill');
  const starProgressStars = document.querySelectorAll('.star-progress-stars i');

  const btnPause        = document.getElementById('btnPause');
  const pauseOverlay    = document.getElementById('pauseOverlay');
  const btnPauseResume  = document.getElementById('btnPauseResume');
  const btnPauseLevels  = document.getElementById('btnPauseLevels');

  let winStarsRow = document.getElementById('winStarRating');

  // ============================================================
  // STATE
  // ============================================================
  let flippedCards  = [];
  let matchedPairs  = 0;
  let moves         = 0;
  let isLocked      = false;
  let timerInterval = null;
  let gameStarted   = false;
  let gameFinished  = false;

  if (levelDisplay) levelDisplay.textContent = level;

  // ============================================================
  // HELPERS
  // ============================================================
  function wasLevelCompletedBefore() {
    try {
      const arr = JSON.parse(localStorage.getItem('matchMonster_completed_' + subject) || '[]');
      return Array.isArray(arr) && arr.includes(level);
    } catch (e) { return false; }
  }
  function isNextLevelUnlocked() {
    try {
      const arr = JSON.parse(localStorage.getItem('matchMonster_unlocked_' + subject) || '[1]');
      return Array.isArray(arr) && arr.includes(level + 1);
    } catch (e) { return false; }
  }

  // ============================================================
  // RENDER CARDS
  // ============================================================
  function renderCards() {
    if (!grid) return;
    grid.innerHTML = '';

    deck.forEach((pairIndex, index) => {
      const div = document.createElement('div');
      div.className = 'card-item';
      div.dataset.index = index;
      div.dataset.pair = pairIndex;

      const inner = document.createElement('div');
      inner.className = 'card-inner';

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
      front.appendChild(footer);

      inner.appendChild(front);
      div.appendChild(inner);
      div.addEventListener('click', () => onCardClick(index));
      grid.appendChild(div);
    });
  }

  // ============================================================
  // STAR PROGRESS BAR  (single source of truth for rating)
  // ============================================================
  function updateStarProgress() {
    if (!starProgressFill) return;

    const pct = getBarPercentage(moves, pairs);
    starProgressFill.style.width = pct + '%';

    const starsEarned = getStarCountFromBar(pct);

    starProgressStars.forEach((star, i) => {
      star.classList.toggle('filled', i < starsEarned);
    });
  }

  // ============================================================
  // TIMER
  // ============================================================
  function startTimer() {
    if (timerInterval || gameFinished) return;

    timerInterval = setInterval(() => {
      secondsLeft--;
      if (timerDisplay) timerDisplay.textContent = formatTime(secondsLeft);

      if (secondsLeft <= 0) {
        stopTimer();
        loseGame();
      }
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  function resetTimer() {
    stopTimer();
    secondsLeft = GAME_DURATION;
    if (timerDisplay) timerDisplay.textContent = formatTime(secondsLeft);
    gameStarted  = false;
    gameFinished = false;
  }

  // ============================================================
  // GAMEPLAY
  // ============================================================
  function onCardClick(index) {
    if (isLocked || gameFinished) return;
    const el = grid.children[index];
    if (!el) return;
    if (el.classList.contains('flipped') || el.classList.contains('matched')) return;

    if (!gameStarted) {
      gameStarted = true;
      startTimer();
    }

    el.classList.add('flipped');
    flippedCards.push({ index, el, pair: deck[index] });

    if (flippedCards.length === 2) {
      moves++;
      updateStarProgress();  // ✅ bar updates on every move
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
  // LOSE
  // ============================================================
  function loseGame() {
    if (gameFinished) return;
    gameFinished = true;
    isLocked = true;

    if (winOverlay) winOverlay.classList.remove('show');

    if (loseOverlay) {
      loseOverlay.classList.add('show');

      const loseTimeEl  = document.getElementById('loseTime');
      const loseMovesEl = document.getElementById('loseMoves');
      const losePairsEl = document.getElementById('losePairs');

      if (loseTimeEl)  loseTimeEl.textContent  = formatTime(0);
      if (loseMovesEl) loseMovesEl.textContent = moves;
      if (losePairsEl) losePairsEl.textContent = matchedPairs + ' / ' + pairs;
    }
  }

  // ============================================================
  // WIN
  // ============================================================
  function showWin() {
    if (gameFinished) return;
    gameFinished = true;

    const elapsed = GAME_DURATION - secondsLeft;

    if (winMoves) winMoves.textContent = moves;
    if (winTime)  winTime.textContent  = formatTime(elapsed);

    const wasCompletedBefore = wasLevelCompletedBefore();

    // ---- Star rating comes FROM THE BAR — guaranteed identical ----
    const starsEarned = calculateStars(moves, pairs);

    if (typeof window.recordLevelStars === 'function') {
      window.recordLevelStars(subject, level, starsEarned);
    }

    if (!wasCompletedBefore) {
      if (typeof window.addPoints === 'function') {
        window.addPoints(pointsEarned);
      } else {
        const cur = parseInt(localStorage.getItem('pointsTotal') || '0', 10);
        localStorage.setItem('pointsTotal', String(cur + pointsEarned));
      }
    }

    if (winCoinsEarned) {
      winCoinsEarned.textContent = wasCompletedBefore ? '+0' : '+' + pointsEarned;
    }

    // Build star row (once)
    if (!winStarsRow) {
      const container = winOverlay ? winOverlay.querySelector('.win-box') : null;
      if (container) {
        const pTag = container.querySelector('p');
        const starRow = document.createElement('div');
        starRow.id = 'winStarRating';
        starRow.className = 'win-star-rating';
        starRow.innerHTML = `
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
        `;
        if (pTag && pTag.parentNode) {
          pTag.parentNode.insertBefore(starRow, pTag.nextSibling);
        } else {
          container.insertBefore(starRow, container.firstChild);
        }
        winStarsRow = starRow;
      }
    }

    if (winStarsRow) {
      const icons = winStarsRow.querySelectorAll('i');
      icons.forEach((icon, i) => {
        icon.classList.toggle('filled', i < starsEarned);
      });
    }

    if (winStarsEarned) {
      const total = (typeof window.getStarsTotal === 'function')
        ? window.getStarsTotal()
        : parseInt(localStorage.getItem('starsTotal') || '0', 10);
      winStarsEarned.textContent = total;
    }

    if (winOverlay) winOverlay.classList.add('show');
    celebrateWin();

    if (typeof window.completeLevel === 'function') {
      window.completeLevel(subject, level);
    }
    if (typeof window.updatePlayerLevelBox === 'function') {
      window.updatePlayerLevelBox();
    }

    // ---- NEXT LEVEL BUTTON ----
    const nextLevel = level + 1;

    if (nextLevelBtn) {
      if (nextLevel <= 10) {
        const nextUnlocked = isNextLevelUnlocked();

        if (nextUnlocked) {
          nextLevelBtn.innerHTML = `Next Level <i class="fas fa-arrow-right ms-2"></i>`;
          nextLevelBtn.onclick = function () {
            window.location.href =
              `Gameplay-${subject}.html?level=${nextLevel}&subject=${subject}`;
          };
        } else {
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
            } else if (result.reason === 'not_enough_points') {
              alert(
                `⭐ Not enough points!\n\n` +
                `Level ${nextLevel} costs ${result.cost} points.\n` +
                `You have ${result.points} points.\n\n` +
                `Play more levels to earn points!`
              );
            } else if (result.reason === 'previous_not_completed') {
              alert(`Finish Level ${nextLevel - 1} first!`);
            } else if (result.reason === 'previous_locked') {
              alert(`Complete the previous level first!`);
            } else if (result.reason === 'save_failed') {
              alert(`Could not save your progress. Please try again.`);
            }
          };
        }

        nextLevelBtn.style.display = 'inline-block';
      } else {
        nextLevelBtn.innerHTML = `<i class="fas fa-trophy me-2"></i> All Done`;
        nextLevelBtn.onclick = function () {
          window.location.href = `../Level.html?subject=${subject}`;
        };
      }
    }

    // ---- Global stats ----
    const stats = {
      gamesPlayed:  parseInt(localStorage.getItem('gamesPlayed')  || '0', 10),
      bestTime:     localStorage.getItem('bestTime') || null,
      totalMatches: parseInt(localStorage.getItem('totalMatches') || '0', 10),
      rewards:      parseInt(localStorage.getItem('rewardsCount') || '0', 10)
    };
    stats.gamesPlayed += 1;
    if (stats.bestTime === null || elapsed < stats.bestTime) stats.bestTime = elapsed;
    stats.totalMatches += pairs;
    stats.rewards += 1;
    localStorage.setItem('gamesPlayed',  String(stats.gamesPlayed));
    localStorage.setItem('bestTime',     String(stats.bestTime));
    localStorage.setItem('totalMatches', String(stats.totalMatches));
    localStorage.setItem('rewardsCount', String(stats.rewards));
  }

  // ============================================================
  // NAVIGATION
  // ============================================================
  function goToLevels() {
    window.location.href = `../Level.html?subject=${subject}`;
  }

  const btnLevels = document.getElementById('btnLevels');
  if (btnLevels) btnLevels.addEventListener('click', goToLevels);

  const btnLoseRetry  = document.getElementById('btnLoseRetry');
  const btnLoseLevels = document.getElementById('btnLoseLevels');
    // ---- Restart Level (win modal) ----
  const btnRestartLevel = document.getElementById('btnRestartLevel');
  if (btnRestartLevel) {
    btnRestartLevel.addEventListener('click', function () {
      window.location.reload();
    });
  }

  if (btnLoseRetry)  btnLoseRetry.addEventListener('click', function () {
    window.location.reload();
  });
  if (btnLoseLevels) btnLoseLevels.addEventListener('click', goToLevels);

  // ============================================================
  // PAUSE / RESUME
  // ============================================================
  let wasRunningBeforePause = false;

  function openPause() {
    if (gameFinished) return;
    if (pauseOverlay && pauseOverlay.classList.contains('show')) return;

    wasRunningBeforePause = timerInterval !== null;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    if (pauseOverlay) pauseOverlay.classList.add('show');
  }

  function closePause() {
    if (pauseOverlay) pauseOverlay.classList.remove('show');

    if (wasRunningBeforePause && !gameFinished && timerInterval === null) {
      startTimer();
    }
    wasRunningBeforePause = false;
  }

  if (btnPause)       btnPause.addEventListener('click', openPause);
  if (btnPauseResume) btnPauseResume.addEventListener('click', closePause);
  if (btnPauseLevels) btnPauseLevels.addEventListener('click', goToLevels);

  // ============================================================
  // KEYBOARD
  // ============================================================
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (pauseOverlay && pauseOverlay.classList.contains('show')) { closePause(); return; }
      if (winOverlay && winOverlay.classList.contains('show'))      { winOverlay.classList.remove('show'); return; }
      if (loseOverlay && loseOverlay.classList.contains('show'))    { loseOverlay.classList.remove('show'); return; }
      if (!gameFinished) { openPause(); return; }
      goToLevels();
    }
  });

  // ============================================================
  // BOOT
  // ============================================================
  renderCards();
  resetTimer();
  updateStarProgress();  // starts at 100% / 3 stars
});