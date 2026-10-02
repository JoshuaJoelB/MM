/* ================================================================
   GAMEPLAY.JS — MATCH MONSTER
   - Topic-driven, Philippine Curriculum (Grades 1–3)
   - Curated Unsplash image library + 3-tier fallback chain
   - 2-minute countdown · quality bar → stars · win/lose/pause
   ================================================================ */

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
  // 📚 UNSPLASH IMAGE LIBRARY
  // ------------------------------------------------------------
  // Curated set of well-known, stable Unsplash photo IDs.
  // Grouped by theme so each topic can pull from a relevant pool.
  // If a specific image ever breaks, swap it here — the fallback
  // chain will keep the game playable in the meantime.
  // ============================================================
  const LIB = {
    // ---- Computers & tech ----
    computer: [
      'photo-1517336714731-489689fd1ca8', // MacBook on desk
      'photo-1496181133206-80ce9b88a853', // laptop workspace
      'photo-1527814050087-3793815479db', // mechanical keyboard
      'photo-1541140532154-b024d705b90a', // dual monitor setup
      'photo-1587829741301-dc798b83add3', // monitor
      'photo-1527864550417-7fd91fc51a46', // mouse
      'photo-1615663245857-ac93bb7c39e7', // headphones
      'photo-1593642702749-b7d2a804fbcf', // tablet
      'photo-1518770660439-4636190af475', // circuit / motherboard
      'photo-1555617981-dac3880eac6e',    // workspace
      'photo-1587145820266-a5951ee6f620', // gadgets
      'photo-1527689368864-3a821dbccc34', // smartphone
      'photo-1547082299-de196ea013d6',    // printer
      'photo-1518444065439-e933c06ce9cd', // headset
      'photo-1618366712010-f4ae9c647dcb', // webcam
      'photo-1531297484001-80022131f5a1'  // laptop side view
    ],
    coding: [
      'photo-1461749280684-dccba630e2f6', // code
      'photo-1542831371-29b0f74f9713',    // code screen
      'photo-1555949963-aa79dcee981c',    // binary
      'photo-1498050108023-c5249f4df085', // code editor
      'photo-1517694712202-14dd9538aa97', // laptop code
      'photo-1531403009284-440f080d1e12'  // UI / app
    ],
    office: [
      'photo-1454165804606-c3d57bc86b40', // documents
      'photo-1506784983877-45594efa4cbe', // notebook
      'photo-1499750310107-5fef28a66643', // journal
      'photo-1434030216411-0b793f4b4173', // writing
      'photo-1486312338219-ce68d2c6f44d', // laptop work
      'photo-1554224155-6726b3ff858f',    // office desk
      'photo-1517245386807-bb43f82c33c4', // documents
      'photo-1455390582262-044cdead277a'  // typography
    ],
    security: [
      'photo-1563986768609-322da13575f3', // cyber security
      'photo-1614064641938-3bbee52942c7', // password
      'photo-1526374965328-7f61d4dc18c5', // digital privacy
      'photo-1550751827-4bd374c3f58b',    // online safety
      'photo-1504639725590-34d0984388bd'  // privacy
    ],
    data: [
      'photo-1460925895917-afdab827c52f', // analytics
      'photo-1543286386-713bdd548da4',    // chart
      'photo-1591696205602-2f950c417cb9', // rows/columns
      'photo-1611974789855-9c2a0a7236a3', // spreadsheet
      'photo-1551288049-bebda4e38f71'     // dashboard
    ],

    // ---- Nature & science ----
    nature: [
      'photo-1502082553048-f009c37129b9', // forest
      'photo-1416879595882-3373a0480b5b', // plant
      'photo-1466692476868-aef1dfb1e735', // leaves
      'photo-1490750967868-88aa4486c946', // flower
      'photo-1508610048659-a06b669e3321', // nature
      'photo-1470071459604-3b5ec3a7fe05', // lake
      'photo-1441974231531-c6227db76b6e', // forest path
      'photo-1444703686981-a3abbc4d4fe3', // river
      'photo-1501785888041-af3ef285b470', // mountains
      'photo-1469474968028-56623f02e42e', // woods
      'photo-1447752875215-b2761acb3c5d', // trees
      'photo-1418065460487-3e41a6c84dc5'  // jungle
    ],
    space: [
      'photo-1451187580459-43490279c0fa', // earth from space
      'photo-1446776653964-20c1d3a81b06', // sky
      'photo-1419242902214-272b3f66ee7a', // starry sky
      'photo-1502134249126-9f3755a50d78', // lightning
      'photo-1506905925346-21bda4d32df4', // mountain sky
      'photo-1470071459604-3b5ec3a7fe05', // lake reflection
      'photo-1419833173245-f59e1b93f9ee', // rainbow
      'photo-1495616811223-4d98c6e9c869'  // snowy
    ],
    animals: [
      'photo-1552053831-71594a27632d',    // dog
      'photo-1514888286974-6c03e2ca1dba', // cat
      'photo-1441057206919-63d19fac2369', // bird
      'photo-1524704654690-b56c05c78a00', // fish
      'photo-1474511320723-9a56873867b5', // lion
      'photo-1547721064-da6cfb341d50',    // elephant
      'photo-1425082661705-1834bfd09dca', // butterfly
      'photo-1552728089-57bdde30beb3',    // horse
      'photo-1595351298020-038700609878', // turtle
      'photo-1470093851219-69951fcbb533', // penguin
      'photo-1507666405895-422eee7d517f', // rabbit
      'photo-1517849845537-4d257902454a'  // monkey
    ],
    hands: [
      'photo-1587854692152-cbe660dbde88', // washing hands
      'photo-1585421514738-01798e348b17', // brushing teeth
      'photo-1607619056574-7b8d3ee536b2', // oral care
      'photo-1526947425960-945c6e72858f', // hygiene
      'photo-1512069772995-ec65ed45afd6', // sunscreen
      'photo-1519861531473-9200262188bf'  // clean hands
    ],

    // ---- People & community (AP) ----
    people: [
      'photo-1517841905240-472988babdf9', // portrait girl
      'photo-1503454537195-1dcabb73ffb9', // child
      'photo-1502086223501-7ea6ecd79368', // kid
      'photo-1509909756405-be0199881695', // face
      'photo-1521119989659-a83eee488004', // boy portrait
      'photo-1596815064285-45ed8a9c0463', // toddler
      'photo-1544005313-94ddf0286df2',    // portrait
      'photo-1503919545889-aef636e10ad4'  // siblings
    ],
    family: [
      'photo-1511895426328-dc8714191300', // family
      'photo-1543342380-0d1a9d6ef3e7',    // mother & child
      'photo-1609220136736-443140cffec6', // father & child
      'photo-1476703993599-0035a21b17a9', // grandparents
      'photo-1518791841217-8f162f1e1131', // siblings
      'photo-1478061653917-455ba7f4a541', // family walk
      'photo-1542037104857-ffbb0b9155fb', // mother
      'photo-1552058544-f2b08422138a'     // father
    ],
    school: [
      'photo-1580582932707-520aed937b7b', // classroom
      'photo-1497633762265-9d179a990aa6', // books
      'photo-1503676260728-1c00da094a0b', // teacher
      'photo-1509062522246-3755977927d7', // students
      'photo-1588072432836-e10032774350', // school building
      'photo-1523240795612-9a054b0db644', // studying
      'photo-1427504494785-3a9ca7044f45', // library
      'photo-1497486751825-1233686d5d80', // chalkboard
      'photo-1503945438517-f65904a52ce6', // pencils
      'photo-1509966756634-9c23dd6e6815'  // school bag
    ],
    community: [
      'photo-1449824913935-59a10b8d2000', // city
      'photo-1513635269975-59663e0ac1ad', // street
      'photo-1499856871958-5b9627545d1a', // community
      'photo-1526778548025-fa2f459cd5c1', // neighborhood
      'photo-1519501025264-65ba15a82390', // church
      'photo-1580910051074-3eb694886505', // market
      'photo-1541888946425-d81bb19240f5', // houses
      'photo-1499092346589-b9b6be3e94b2'  // park
    ],
    helpers: [
      'photo-1612349317150-e413f6a5b16d', // doctor
      'photo-1573496359142-b8d87734a5a2', // police
      'photo-1583454110551-21f2fa2afe61', // firefighter
      'photo-1595273670150-bd0c3c392e46', // teacher
      'photo-1559839734-2b71ea197ec2',    // nurse
      'photo-1581092918056-0c4c3acd3789'  // farmer
    ],
    maps: [
      'photo-1524661135-423995f22d0b',    // map
      'photo-1526778548025-fa2f459cd5c1', // town map
      'photo-1502920917128-1aa500764cbd', // compass
      'photo-1526392060635-9d6019884377', // travel
      'photo-1569336415962-a4bd9f69cd83', // world map
      'photo-1521295121783-8a321d551ad2', // street map
      'photo-1517760444937-f6397edcbbcd', // compass on map
      'photo-1493246507139-91e8fad9978e'  // atlas
    ],
    philippines: [
      'photo-1518509562904-e7ef99cdcc86', // PH islands
      'photo-1531968455001-5c5272a41129', // province
      'photo-1552733407-5d5c46c3bb3b',    // travel
      'photo-1505228395891-9a51e7e86bf6', // rice terraces
      'photo-1552832230-c0197dd311b5',    // landmark
      'photo-1537996194471-e657df975ab4'  // country view
    ],
    culture: [
      'photo-1516035069371-29a1b244cc32', // festival
      'photo-1518548419970-58e3b4079ab2', // cultural dance
      'photo-1583939003579-730e3918a45a', // tradition
      'photo-1533106418989-88406c7cc8ca', // costume
      'photo-1524230572899-a752b3835840', // church
      'photo-1518998053901-5348d3961a04', // weaving
      'photo-1580746738099-78d6833b3c40', // folk
      'photo-1504674900247-0877df9cc836'  // local food
    ]
  };

  // ============================================================
  // 🎯 TOPIC → IMAGE POOL MAPPING
  // Each topic pulls a themed pool; length must be ≥ pairs needed
  // (max level = 12 pairs, so ≥12 images recommended).
  // ============================================================
  const TOPIC_DATA = {
    // ---------------- COMPUTER ----------------
    computer: {
      1:  { title: 'What is a Computer?',        pool: [...LIB.computer, ...LIB.coding] },
      2:  { title: 'Basic Computer Parts',       pool: [...LIB.computer] },
      3:  { title: 'Caring for the Computer',    pool: [...LIB.computer, ...LIB.hands] },
      4:  { title: 'Hardware and Software',      pool: [...LIB.computer, ...LIB.coding] },
      5:  { title: 'Input and Output Devices',   pool: [...LIB.computer] },
      6:  { title: 'Keyboard Basics',            pool: [...LIB.computer, ...LIB.office] },
      7:  { title: 'Word Processing',            pool: [...LIB.office, ...LIB.coding] },
      8:  { title: 'Formatting Text',            pool: [...LIB.office] },
      9:  { title: 'Digital Citizenship',        pool: [...LIB.security, ...LIB.computer] },
      10: { title: 'Spreadsheets',               pool: [...LIB.data, ...LIB.office] }
    },

    // ---------------- SCIENCE ----------------
    science: {
      1:  { title: 'The Five Sense Organs',      pool: [...LIB.people, ...LIB.hands] },
      2:  { title: 'Caring for Sense Organs',    pool: [...LIB.hands, ...LIB.people] },
      3:  { title: 'Animals & Body Parts',       pool: [...LIB.animals] },
      4:  { title: 'Animals & Habitats',         pool: [...LIB.nature, ...LIB.animals] },
      5:  { title: 'Plants Around Us',           pool: [...LIB.nature] },
      6:  { title: 'States of Matter',           pool: [...LIB.nature, ...LIB.space] },
      7:  { title: 'Force and Motion',           pool: [...LIB.space, ...LIB.nature] },
      8:  { title: 'Light and Sound',            pool: [...LIB.space, ...LIB.nature] },
      9:  { title: 'Basic Needs of Living Things', pool: [...LIB.nature, ...LIB.family] },
      10: { title: 'Weather & Environment',      pool: [...LIB.space, ...LIB.nature] }
    },

    // ---------------- AP ----------------
    ap: {
      1:  { title: 'Ako ay Natatangi',           pool: [...LIB.people] },
      2:  { title: 'Ang Aking Pamilya',          pool: [...LIB.family] },
      3:  { title: 'Ang Aking Paaralan',         pool: [...LIB.school] },
      4:  { title: 'Ang Aking Komunidad',        pool: [...LIB.community] },
      5:  { title: 'Mga Bumubuo ng Komunidad',   pool: [...LIB.helpers, ...LIB.community] },
      6:  { title: 'Mapa ng Aking Komunidad',    pool: [...LIB.maps] },
      7:  { title: 'Ang Aking Rehiyon',          pool: [...LIB.philippines, ...LIB.maps] },
      8:  { title: 'Mga Simbolo ng Lalawigan',   pool: [...LIB.philippines, ...LIB.culture] },
      9:  { title: 'Kultura ng Aking Rehiyon',   pool: [...LIB.culture] },
      10: { title: 'Mga Bayani ng Lalawigan',    pool: [...LIB.culture, ...LIB.philippines] }
    }
  };

  // ---- Resolve current topic ----
  const subjectTopics = TOPIC_DATA[subject] || TOPIC_DATA.computer;
  const topicInfo = subjectTopics[level] || subjectTopics[1];

  // Guarantee at least 12 unique images per topic via repetition + shuffle
  function buildImagePool(rawPool) {
    const unique = Array.from(new Set(rawPool));
    const out = [...unique];
    while (out.length < 12) {
      out.push(...unique);
    }
    return out.slice(0, 12);
  }
  const IMAGE_POOL = buildImagePool(topicInfo.pool);

  // ============================================================
  // IMAGE URLS + FALLBACK CHAIN
  // ------------------------------------------------------------
  // primary:    chosen Unsplash photo
  // backup:     a different Unsplash photo from the same pool
  // placeholder: inline SVG with the topic name (always works)
  // ============================================================
  function unsplashUrl(id, w, h) {
    return `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&auto=format&q=70`;
  }

  function getPrimaryImageUrl(pairIndex) {
    const id = IMAGE_POOL[pairIndex % IMAGE_POOL.length];
    return unsplashUrl(id, 400, 500);
  }

  function getBackupImageUrl(pairIndex) {
    const idx = (pairIndex + 1) % IMAGE_POOL.length;
    const id = IMAGE_POOL[idx];
    return unsplashUrl(id, 400, 500);
  }

  function makePlaceholderDataUri(label) {
    const safe = String(label).replace(/[<>&"']/g, '');
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1a3a5c"/>
            <stop offset="100%" stop-color="#0a1428"/>
          </linearGradient>
        </defs>
        <rect width="400" height="500" fill="url(#g)"/>
        <circle cx="200" cy="200" r="70" fill="none"
                stroke="#FFD700" stroke-width="6" stroke-dasharray="10 8"/>
        <text x="200" y="215" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="48" fill="#FFD700">?</text>
        <text x="200" y="340" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="24" font-weight="bold"
              fill="#FFD700">${safe}</text>
      </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  // Attach the fallback chain to an <img>
  function attachImageFallback(imgEl, pairIndex, label) {
    let stage = 0;
    imgEl.addEventListener('error', function handleErr() {
      stage++;
      if (stage === 1) {
        // Try the backup image
        imgEl.src = getBackupImageUrl(pairIndex);
      } else {
        // Give up → placeholder SVG
        imgEl.removeEventListener('error', handleErr);
        imgEl.src = makePlaceholderDataUri(label);
      }
    });
  }

  // ============================================================
  // SAFETY CHECKS
  // ============================================================
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
  // STAR THRESHOLDS (must match CSS positions 5% · 30% · 52%)
  // ============================================================
  const STAR_THRESHOLDS = [5, 30, 52];

  function getBarPercentage(mv, pairCount) {
    if (pairCount <= 0) return 100;
    const t3 = 1.4 * pairCount;
    const t2 = 2.0 * pairCount;
    const t1 = 3.0 * pairCount;
    if (mv <= t3) return 100 - (mv / t3) * 33.33;
    if (mv <= t2) return 66.67 - ((mv - t3) / (t2 - t3)) * 33.34;
    if (mv <= t1) return 33.33 - ((mv - t2) / (t1 - t2)) * 33.33;
    return 0;
  }

  function getStarCountFromBar(pct) {
    let count = 0;
    for (let i = 0; i < STAR_THRESHOLDS.length; i++) {
      if (pct >= STAR_THRESHOLDS[i]) count = i + 1;
    }
    return Math.max(1, count);
  }

  function calculateStars(mv, pairCount) {
    return getStarCountFromBar(getBarPercentage(mv, pairCount));
  }

  function getPointsForStars(basePoints, starsEarned) {
    const bonus = basePoints * 0.5;
    return Math.round(basePoints + (starsEarned - 1) * bonus);
  }

  // ============================================================
  // BASE REWARD
  // ============================================================
  const POINTS_BASE      = 10;
  const POINTS_PER_LEVEL = level * 5;
  const basePoints       = POINTS_BASE + POINTS_PER_LEVEL;

  // ============================================================
  // TIMER
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
  // TOPIC TITLE IN SUBHEADER
  // ============================================================
  (function renderTopicTitle() {
    const subheader = document.querySelector('.gameplay-subheader');
    const subjectTitleEl = document.querySelector('.gameplay-subject-title');
    if (!subheader || !subjectTitleEl) return;

    subjectTitleEl.textContent = subjectInfo.name;

    const existing = subheader.querySelector('.gameplay-topic-title');
    if (existing) existing.remove();

    const topicEl = document.createElement('p');
    topicEl.className = 'gameplay-topic-title';
    topicEl.textContent = `Level ${level}: ${topicInfo.title}`;
    subjectTitleEl.insertAdjacentElement('afterend', topicEl);
  })();

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

      // ---- BACK ----
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

      // ---- FRONT ----
      const front = document.createElement('div');
      front.className = 'card-face card-face-front';

      const number = document.createElement('span');
      number.className = 'card-number';
      number.textContent = String(index + 1).padStart(2, '0');
      front.appendChild(number);

      const img = document.createElement('img');
      img.className = 'card-image';
      img.alt = `${topicInfo.title} — Card ${index + 1}`;
      img.loading = 'lazy';
      img.draggable = false;

      // Attach fallback chain BEFORE setting src
      attachImageFallback(img, pairIndex, topicInfo.title);
      img.src = getPrimaryImageUrl(pairIndex);
      front.appendChild(img);

      const footer = document.createElement('div');
      footer.className = 'card-footer';
      const bonus = document.createElement('span');
      bonus.className = 'card-bonus';
      bonus.textContent = topicInfo.title;
      footer.appendChild(bonus);
      front.appendChild(footer);

      inner.appendChild(front);
      div.appendChild(inner);
      div.addEventListener('click', () => onCardClick(index));
      grid.appendChild(div);
    });
  }

  // ============================================================
  // STAR PROGRESS BAR
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
      updateStarProgress();
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
    const starsEarned  = calculateStars(moves, pairs);
    const pointsEarned = getPointsForStars(basePoints, starsEarned);

    try {
      sessionStorage.setItem('mm_preWin', JSON.stringify({
        subject: subject,
        level: level,
        wasCompleted: wasCompletedBefore,
        pointsEarned: pointsEarned,
        pointsAwarded: !wasCompletedBefore
      }));
    } catch (e) {}

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

  if (btnLoseRetry)  btnLoseRetry.addEventListener('click', function () {
    window.location.reload();
  });
  if (btnLoseLevels) btnLoseLevels.addEventListener('click', goToLevels);

  // ============================================================
  // RESTART LEVEL (win modal) — undoes this level's win data
  // ============================================================
  function restartLevel() {
    try {
      const completedKey = 'matchMonster_completed_' + subject;
      let completed = JSON.parse(localStorage.getItem(completedKey) || '[]');
      if (!Array.isArray(completed)) completed = [];
      completed = completed.filter(function (l) { return l !== level; });
      localStorage.setItem(completedKey, JSON.stringify(completed));
    } catch (e) {}

    try {
      const starsKey = 'matchMonster_stars_' + subject;
      let starsMap = JSON.parse(localStorage.getItem(starsKey) || '{}');
      if (!starsMap || typeof starsMap !== 'object') starsMap = {};
      delete starsMap[level];
      localStorage.setItem(starsKey, JSON.stringify(starsMap));
    } catch (e) {}

    try {
      const snap = JSON.parse(sessionStorage.getItem('mm_preWin') || 'null');
      if (snap && snap.subject === subject && snap.level === level) {
        if (snap.pointsAwarded && snap.pointsEarned > 0) {
          const cur = parseInt(localStorage.getItem('pointsTotal') || '0', 10);
          const rolled = Math.max(0, cur - snap.pointsEarned);
          localStorage.setItem('pointsTotal', String(rolled));
        }
      }
      sessionStorage.removeItem('mm_preWin');
    } catch (e) {}

    if (typeof window.updatePlayerLevelBox === 'function') {
      window.updatePlayerLevelBox();
    }

    window.location.reload();
  }

  const btnRestartLevel = document.getElementById('btnRestartLevel');
  if (btnRestartLevel) {
    btnRestartLevel.addEventListener('click', restartLevel);
  }

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
  updateStarProgress();
});