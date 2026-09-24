/* ================================================================
   GAMEPLAY.JS – shared logic for all subject gameplay pages
   - Real photos for cards (Unsplash CDN)
   - Subject icon image displayed on card back
   - Points earned on win
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

  // ---- Subject display info ----
  // Icons live at Assets/icons/ (see Subject.html for reference).
  // Gameplay HTML files are inside the Gameplay/ folder,
  // so we go up one level with ../ to reach the project root.
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
  // Verified Unsplash CDN IDs. Kid-friendly (Grade 1–3):
  //   Computer → computer PARTS (monitors, keyboards, mice, hardware)
  //   Science  → Biology (plants) + Earth (landscapes) + Space (planets)
  const imagePools = {
    // ===== COMPUTER =====
    // Focused on physical computer parts kids can recognize:
    // monitors, keyboards, mice, laptops, headphones, printers, CPUs.
    computer: [
      'photo-1517336714731-489689fd1ca8', // laptop (friendly angle)
      'photo-1496181133206-80ce9b88a853', // open laptop
      'photo-1527814050087-3793815479db', // keyboard close-up
      'photo-1541140532154-b024d705b90a', // colorful keyboard keys
      'photo-1587829741301-dc798b83add3', // keyboard from above
      'photo-1527864550417-7fd91fc51a46', // computer mouse
      'photo-1615663245857-ac93bb7c39e7', // mouse on desk
      'photo-1593642702749-b7d2a804fbcf', // computer monitor
      'photo-1527689368864-3a821dbccc34', // desktop setup
      'photo-1518770660439-4636190af475', // circuit board (computer part)
      'photo-1555617981-dac3880eac6e',    // desktop tower
      'photo-1587145820266-a5951ee6f620'  // headphones (kids use for PC)
    ],

    // ===== SCIENCE =====
    // Biology (plants) + Earth (landscapes) + Space (planets)
    science: [
      // --- Biology: plants, flowers, trees ---
      'photo-1502082553048-f009c37129b9', // green leaves
      'photo-1416879595882-3373a0480b5b', // potted plant
      'photo-1466692476868-aef1dfb1e735', // plant sprout
      'photo-1490750967868-88aa4486c946', // colorful flowers
      'photo-1508610048659-a06b669e3321', // sunflower
      'photo-1470071459604-3b5ec3a7fe05', // forest mountains
      'photo-1441974231531-c6227db76b6e', // green forest
      'photo-1444703686981-a3abbc4d4fe3', // night sky with stars

      // --- Earth & Space ---
      'photo-1451187580459-43490279c0fa', // Earth from space
      'photo-1446776653964-20c1d3a81b06', // moon
      'photo-1419242902214-272b3f66ee7a', // galaxy / milky way
      'photo-1502134249126-9f3755a50d78'  // planet in space
    ],

    // ===== AP (Social Studies) =====
    // Maps, family, community, landscapes, houses
    ap: [
      'photo-1526778548025-fa2f459cd5c1', // world map
      'photo-1524661135-423995f22d0b',    // old world map
      'photo-1526392060635-9d6019884377', // mountain landscape
      'photo-1476514525535-07fb3b4ae5f1', // scenic landscape
      'photo-1511895426328-dc8714191300', // happy family
      'photo-1476703993599-0035a21b17a9', // family photo
      'photo-1501785888041-af3ef285b470', // lake landscape
      'photo-1449824913935-59a10b8d2000', // city buildings
      'photo-1513635269975-59663e0ac1ad', // village houses
      'photo-1500534314209-a25ddb2bd429'  // desert landscape
    ]
  };

  function getImageUrl(pairIndex) {
    const pool = imagePools[subject] || imagePools.computer;
    const photoId = pool[pairIndex % pool.length];
    return `https://images.unsplash.com/${photoId}?w=400&h=500&fit=crop&auto=format&q=70`;
  }

  // ---- Build deck of pair indices ----
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

    deck.forEach((pairIndex, index) => {
      const div = document.createElement('div');
      div.className = 'card-item';
      div.dataset.index = index;
      div.dataset.pair = pairIndex;

      const inner = document.createElement('div');
      inner.className = 'card-inner';

      // ===== CARD BACK (hidden side with subject icon) =====
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

      // ===== CARD FRONT (revealed side with photo) =====
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

  // ---- Win ----
  function showWin() {
    if (winMoves) winMoves.textContent = moves;
    if (winTime)  winTime.textContent  = seconds + 's';

    const currentStars = parseInt(localStorage.getItem('starsTotal') || '0', 10);
    const currentCoins = parseInt(localStorage.getItem('coinsTotal') || '0', 10);

    const newStarsTotal = currentStars + starsEarned;
    const newCoinsTotal = currentCoins + coinsEarned;

    localStorage.setItem('starsTotal', newStarsTotal);
    localStorage.setItem('coinsTotal', newCoinsTotal);

    const displayStars = parseInt(localStorage.getItem('starsTotal') || '0', 10);
    const displayCoins = parseInt(localStorage.getItem('coinsTotal') || '0', 10);

    if (winStarsEarned) winStarsEarned.textContent = displayStars;
    if (winCoinsEarned) winCoinsEarned.textContent = displayCoins;

    if (winOverlay) winOverlay.classList.add('show');

    if (typeof window.completeLevel === 'function') {
      window.completeLevel(subject, level);
    }

    if (typeof window.updatePlayerLevelBox === 'function') {
      window.updatePlayerLevelBox();
    }

    const nextLevel = level + 1;

    if (nextLevelBtn) {
      if (nextLevel <= 10) {
        nextLevelBtn.innerHTML = `<i class="fas fa-unlock me-2"></i> Unlock Next Level`;
        nextLevelBtn.onclick = function () {
          if (typeof window.tryUnlockLevel !== 'function') {
            window.location.href = `../Level.html?subject=${subject}`;
            return;
          }
          const result = window.tryUnlockLevel(subject, nextLevel);
          if (result.ok) {
            // If it was a FRESH unlock (not already unlocked),
            // store a flag so Level.html can play the unlock animation.
            if (!result.alreadyUnlocked) {
              try {
                sessionStorage.setItem('mm_just_unlocked', JSON.stringify({
                  subject: subject,
                  level:   nextLevel
                }));
              } catch (e) {}
            }
            // Go to the map so the player watches Jojoma hop to the next level
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
        nextLevelBtn.style.display = 'inline-block';
      } else {
        nextLevelBtn.innerHTML = `<i class="fas fa-trophy me-2"></i> All Done`;
        nextLevelBtn.onclick = function () {
          window.location.href = `../Level.html?subject=${subject}`;
        };
      }
    }
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