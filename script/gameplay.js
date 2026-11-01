document.addEventListener('DOMContentLoaded', function() {

  /* ---- Per-player storage helpers ---- */
  function pGet(key, fallback) {
    if (window.MMPlayer && MMPlayer.pGet) return MMPlayer.pGet(key, fallback);
    try {
      const v = localStorage.getItem(key);
      return v === null ? (fallback !== undefined ? fallback : null) : v;
    } catch (e) { return fallback; }
  }
  function pSet(key, value) {
    if (window.MMPlayer && MMPlayer.pSet) return MMPlayer.pSet(key, value);
    try { localStorage.setItem(key, String(value)); } catch (e) {}
  }
  function pJSON(key, fallback) {
    if (window.MMPlayer && MMPlayer.pJSON) return MMPlayer.pJSON(key, fallback);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function pSetJSON(key, value) {
    if (window.MMPlayer && MMPlayer.pSetJSON) return MMPlayer.pSetJSON(key, value);
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  function syncChips() {
    if (typeof window.updatePlayerLevelBox === 'function') {
      window.updatePlayerLevelBox();
    } else {
      let tries = 0;
      const retry = setInterval(function () {
        if (typeof window.updatePlayerLevelBox === 'function') {
          window.updatePlayerLevelBox();
          clearInterval(retry);
        } else if (++tries > 10) clearInterval(retry);
      }, 100);
    }
  }
  syncChips();

  // ============================================================
  // AUDIO LOADER UI
  // ============================================================
  const audioLoader = document.createElement('div');
  audioLoader.id = 'audio-loader';
  audioLoader.innerHTML = '🎵 Loading sound...';
  audioLoader.style.cssText = `
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8); color: #fff; padding: 10px 20px;
    border-radius: 30px; font-family: inherit; font-size: 14px;
    z-index: 10000; opacity: 0; transition: opacity 0.3s ease;
    pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  `;
  document.body.appendChild(audioLoader);

  function showAudioLoader() { audioLoader.style.opacity = '1'; }
  function hideAudioLoader() { audioLoader.style.opacity = '0'; }

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
  const rawSubject = urlParams.get('subject')
                || (window.location.pathname.match(/Gameplay-(\w+)\.html/)?.[1])
                || 'computer';
  const subject = String(rawSubject).toLowerCase();

  // ADDED shortName HERE
  const subjectInfo = {
    ap:       { name: 'Araling Panlipunan', shortName: 'AP', icon: '../Assets/icons/ap_icon.png' },
    computer: { name: 'Edukasyong Pantahanan at Pangkabuhayan', shortName: 'EPP', icon: '../Assets/icons/computer_icon.png' },
    science:  { name: 'Science', shortName: 'Science', icon: '../Assets/icons/science_icon.png' }
  }[subject] || { name: 'Subject', shortName: 'Subject', icon: '../Assets/icons/computer_icon.png' };

  // ============================================================
  // DYNAMIC TAB TITLE + FAVICON
  // ============================================================
  (function updateTabBranding() {
    document.title = `${subjectInfo.name} · Level ${level} — Match Monster`;
    const iconUrl = '../Assets/top_icon.png';
    document.querySelectorAll('link[rel*="icon"]').forEach(el => el.remove());

    [['icon', 'image/png'], ['shortcut icon', ''], ['apple-touch-icon', '']].forEach(([rel, type]) => {
      const link = document.createElement('link');
      link.rel  = rel;
      if (type) link.type = type;
      link.href = iconUrl + '?v=' + level;
      document.head.appendChild(link);
    });
  })();

  const SUBJECT_FOLDER = { computer: 'EPP', science: 'SCIENCE', ap: 'AP' };

  const LEVEL_FOLDER_VARIANTS = {
    computer: function (n) { return ['lvl' + n, 'lvl ' + n, 'Level ' + n, 'level ' + n]; },
    science:  function (n) { return ['lvl' + n, 'Level ' + n, 'level ' + n, 'lvl ' + n]; },
    ap:       function (n) { return ['level ' + n, 'lvl' + n, 'lvl ' + n, 'Level ' + n]; }
  };

  const IMG_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'JPG', 'JPEG', 'PNG', 'WEBP', 'AVIF'];

  // ============================================================
  // FILE_MAP — image filenames (UPDATED)
  // ============================================================
  const FILE_MAP = {
    // ---- CORRECTIONS FOR DISK MATCHING ----
    'ap:5:May':                  'hottest  month',
    'computer:6:pro':            'pro',
    'computer:6:proj':           'pro',
    'computer:7:Address bar':    'adress bar',
    'computer:7:Bookmark this page': 'book mark',
    'computer:7:Display window': 'Display window buttons',
    'computer:7:Customize and control': 'tabs',
    'computer:8:Username':       'usenname',
    'science:9:Gallbladder':     'gallblader',
    // ---- AP 1 ----
    'ap:1:Pacific Ocean':        'pacific ocean',
    'ap:1:Pasig River':          'pasig river',
    'ap:1:Laguna de Bay':        'laguna debay',
    // ---- AP 2 ----
    'ap:2:Mount Apo':            'Mount-Apo-',
    'ap:2:Mayon Volcano':        'mayon',
    'ap:2:Chocolate Hills':      'chocolate hills',
    'ap:2:Central Luzon Plain':  'Central Luzon Plain',
    // ---- AP 3 ----
    'ap:3:Malaysia':             'malaysia',
    'ap:3:Indonesia':            'indonesia',
    'ap:3:Vietnam':              'Vietnam',
    'ap:3:Thailand':             'thailand',
    'ap:3:Brunei':               'brunei',
    // ---- AP 4 ----
    'ap:4:Weather':              'weather',
    'ap:4:Climate':              'climate',
    'ap:4:Temperature':          'temperature',
    'ap:4:Humidity':             'humidity',
    'ap:4:Rainfall':             'rainfall',
    'ap:4:PAGASA':               'pagasa',
    // ---- AP 5 ----
    'ap:5:Cool dry season':      'Cool dry season',
    'ap:5:Dry season':           'dry season2',
    'ap:5:Hot dry season':       'hot season',
    'ap:5:May':                  'hottest month',
    'ap:5:January':              'coolest',
    'ap:5:Rainy season':         'rainy season',
    'ap:5:Tropical climate':     'Tropical climate',
    // ---- AP 6 ----
    'ap:6:Luzon':                'Luzon',
    'ap:6:Visayas':              'visaya',
    'ap:6:Mindanao':             'mindanao',
    'ap:6:Palawan':              'palawan',
    'ap:6:Mindoro':              'mindoro',
    'ap:6:Samar':                'Samar',
    'ap:6:Leyte':                'Leyte',
    'ap:6:Cebu':                 'cebu',
    // ---- AP 7 ----
    'ap:7:Mount Pulag':          'Mount Pulag',
    'ap:7:Mount Pinatubo':       'Mount Pinatubo',
    'ap:7:Taal Volcano':         'Taal Volcano',
    'ap:7:Cagayan River':        'Cagayan River',
    'ap:7:Agusan River':         'Agusan River',
    'ap:7:Lake Lanao':           'Lake Lanao',
    'ap:7:Subic Bay':            'Subic Bay',
    'ap:7:Davao Gulf':           'Davao Gulf',
    'ap:7:Sibuyan Sea':          'Sibuyan Sea',
    // ---- AP 8 ----
    'ap:8:Datu':                 'Datu (chief)',
    'ap:8:Maharlika':            'Maharlika (noble)',
    'ap:8:Timawa':               'Timawa (freeman)',
    'ap:8:Babaylan':             'Babaylan (spiritual leader', 
    'ap:8:Balangay':             'Balangay (boat)',
    'ap:8:Baybayin':             'Baybayin (ancient writing)',
    'ap:8:Bahay Kubo':           'Bahay Kubo',
    'ap:8:Panday':               'Panday (blacksmith)',
    // ---- AP 9 ----
    'ap:9:Manunggul Jar':        'Manunggul Jar',
    'ap:9:Banaue Rice Terraces': 'Banaue Rice Terraces',
    'ap:9:Bulul':                'Bulul',
    'ap:9:Laguna Copperplate':   'Laguna Copperplate Inscription',
    'ap:9:Golden Tara':          'Golden Tara of Agusan',
    'ap:9:Tabon Cave':           'Tabon Cave',
    'ap:9:Angono Petroglyphs':   'Angono Petroglyphs',
    'ap:9:Fort Santiago':        'Fort Santiago',
    'ap:9:San Agustin Church':   'San Agustin Church',
    'ap:9:Bahay na Bato':        'Bahay na Bato',
    'ap:9:Barasoain Church':     'Barasoain Church',
    // ---- AP 10 ----
    'ap:10:Hudhud':              'hudhud',
    'ap:10:Biag ni Lam-ang':     'Biag ni Lam-ang',
    'ap:10:Alamat':              'Alamat',
    'ap:10:Bugtong':             'Bugtong',
    'ap:10:Salawikain':          'Salawikain',
    'ap:10:Kundiman':            'Kundiman',
    'ap:10:Tinikling':           'Tinikling',
    'ap:10:Singkil':             'Singkil (dance)',
    'ap:10:Pandanggo sa Ilaw':   'Pandanggo sa Ilaw (dance)',
    'ap:10:Fiesta':              'Fiesta',
    'ap:10:Pamahiin':            'Pamahiin (superstition)',
    'ap:10:Mano po':             'Mano po (respect gesture)',

    // ---- EPP ----
    'computer:1:Google':         'google',
    'computer:1:Yahoo':          'yahoo',
    'computer:1:Lycos':          'lycos',
    'computer:2:Search box':     'search box',
    'computer:2:Search button':  'search button',
    'computer:2:Search results': 'search result',
    'computer:2:Tabs':           'tabs',
    'computer:3:Safari':         'safari',
    'computer:3:Opera':          'opera',
    'computer:3:Microsoft Edge': 'microsoft edge',
    'computer:3:Mozilla Firefox':'mozilla firefox',
    'computer:3:Google Chrome':  'google chrome',
    'computer:4:Email':          'email',
    'computer:4:Chat':           'chat',
    'computer:4:Instant message':'Instant message',
    'computer:4:Video call':     'videocall',
    'computer:4:Social media':   'social media',
    'computer:4:Online class':   'onlineclass',
    'computer:5:Kind words':         'kind words',
    'computer:5:Ask permission':     'Ask permission before posting others_ photos ',
    'computer:5:Be respectful':      'Be respectful in online class ',
    'computer:5:Typing in ALL CAPS': 'Typing in ALL CAPS',
    'computer:5:Sharing password':   'Sharing password',
    'computer:5:Using bad words':    'Using bad words',
    'computer:5:Fake news':          'fake news',

    // EPP Level 6 (Domain Types)
    'computer:6:com':  'com',
    'computer:6:edu':  'edu',
    'computer:6:gov':  'gov',
    'computer:6:info': 'info',
    'computer:6:int':  'int',
    'computer:6:net':  'net',
    'computer:6:org':  'org',
    'computer:6:proj': 'proj',

    'computer:7:Browser window buttons': 'Browser window buttons',
    'computer:7:Tab name':               'tab name',
    'computer:7:Navigation buttons':     'navigation button',
    'computer:7:New tab':                'new tab',
    'computer:7:Customize and control':  'customize and control',
    'computer:7:Bookmark this page':     'book mark',
    'computer:7:Address bar':            'adress bar',
    'computer:7:Display window':         'Display window buttons',
    'computer:7:Scroll bar':             'scroll bar',

    'computer:8:Username':    'usemname',
    'computer:8:Domain name': 'domainname',
    'computer:8:Domain type': 'domain type',
    'computer:8:To':          'to',
    'computer:8:Cc':          'cc',
    'computer:8:Bcc':         'bcc',
    'computer:8:Subject':     'subject_',
    'computer:8:Forward':     'forward',
    'computer:8:Send':        'send',

    'computer:9:Gmail':        'gmail',
    'computer:9:Yahoo Mail':   'yahoo mail',
    'computer:9:Outlook':      'out look',
    'computer:9:Compose Mail': 'compose mail',
    'computer:9:Inbox':        'inbox',
    'computer:9:Sent':         'send',
    'computer:9:Drafts':       'draft',
    'computer:9:Spam':         'spam',
    'computer:9:Attachment':   'attachfile',
    'computer:9:Reply':        'reply',
    'computer:9:Forward':      'forward',

    'computer:10:Monitor':         'monitor',
    'computer:10:Keyboard':        'keyboard',
    'computer:10:Mouse':           'mouse',
    'computer:10:System unit':     'system unit',
    'computer:10:Speakers':        'speaker',
    'computer:10:Printer':         'printer_',
    'computer:10:Webcam':          'webcam_',
    'computer:10:Microphone':      'microphone',
    'computer:10:Headset':         'headset',
    'computer:10:Scanner':         'scanner',
    'computer:10:USB flash drive': 'usb_flashdrive',
    'computer:10:Touchpad':        'touch pad',

    // ---- Science ----
    'science:1:Rock':            'Rock',
    'science:1:Water':           'Water',
    'science:1:Air':             'Air',
    'science:2:Chair':           'Chair',
    'science:2:Desk':            'Desk',
    'science:2:Bag':             'Bag',
    'science:2:Shoes':           'Shoes',
    'science:3:Water':           'water',
    'science:3:Coffee':          'coffee',
    'science:3:Chocolate drink': 'chocolate_',
    'science:3:Juice':           'juice',
    'science:3:Milk':            'milk',
    'science:4:Air':             'air',
    'science:4:Wind':            'wind',
    'science:4:Oxygen':          'Oxygen_',
    'science:4:Carbon dioxide':  'carbon',
    'science:4:Water vapor':     'vapor',
    'science:4:Helium':          'helium_',
    'science:5:Mass':            'mass_',
    'science:5:Weight':          'weight_',
    'science:5:Volume':          'volume_',
    'science:5:Shape':           'shape_',
    'science:5:Color':           'color',
    'science:5:Texture':         'texture_',
    'science:5:Smell':           'smell',
    'science:6:Platform balance':      'platform_',
    'science:6:Triple beam balance':   'triple beam',
    'science:6:Weighing scale':        'weighted scale',
    'science:6:Graduated cylinder':    'cylinder_',
    'science:6:Meter stick':           'meter stick_',
    'science:6:Thermometer':           'thermometer_',
    'science:6:Measuring cup':         'measuring cup',
    'science:6:Beaker':                'beaker',
    'science:7:Gram':                  'gram',
    'science:7:Kilogram':              'kg',
    'science:7:Milliliter':            'milliliter_',
    'science:7:Liter':                 'liter',
    'science:7:Centimeter':            'cm',
    'science:7:Meter':                 'meter',
    'science:7:Degree Celsius':        'degree',
    'science:7:Cubic centimeter':      'Cubic-Centimeters-to-Liters',
    'science:7:Cubic meter':           'cubic meter',
    'science:8:Melting':               'melting',
    'science:8:Freezing':              'freeze',
    'science:8:Evaporation':           'evaporation_',
    'science:8:Condensation':          'condensation_',
    'science:8:Boiling':               'boiling_',
    'science:8:Cutting paper':         'cut',
    'science:8:Tearing paper':         'tearing',
    'science:8:Crushing a can':        'can',
    'science:8:Dissolving sugar':      'sugar',
    'science:8:Folding paper':         'fold',
    'science:9:Mouth':                 'mouth',
    'science:9:Teeth':                 'teeth_',
    'science:9:Salivary glands':       'glands',
    'science:9:Esophagus':             'esophagus_',
    'science:9:Liver':                 'liver',
    'science:9:Gallbladder':           'gallbladder',
    'science:9:Pancreas':              'pancreas',
    'science:9:Small intestine':       'small',
    'science:9:Large intestine':       'large_',
    'science:9:Rectum':                'rectum',
    'science:10:Nose':                 'nose',
    'science:10:Nasal cavity':         'nasal',
    'science:10:Mouth':                'mouth',
    'science:10:Pharynx':              'pharxn',
    'science:10:Larynx':               'larynx',
    'science:10:Trachea':              'trachea',
    'science:10:Bronchi':              'bronchi',
    'science:10:Bronchioles':          'bronchiolos',
    'science:10:Alveoli':              'alveolar_',
    'science:10:Lungs':                'lungs',
    'science:10:Diaphragm':            'diaphragm_',
    'science:10:Ribs':                 'ribs'
  };

  // ============================================================
  // AUDIO_MAP
  // ============================================================
  const AUDIO_SUBJECT_FOLDER = { ap: 'AP', computer: 'epp', science: 'science' };

  const AUDIO_MAP = {
    // ---- CORRECTIONS FOR DISK MATCHING ----
    'ap:5:May':                  'hottest month',
    'ap:5:January':              'coolest month',
    'ap:9:Manunggul Jar':        'mangunggul jar',
    'ap:10:Biag ni Lam-ang':     'biag ni lim-ang',
    'computer:5:Ask permission': 'Ask permission before posting others_ photos',
    'computer:5:Kind words':     'use kind words',
    'computer:5:Sharing password': 'sharing your password',
    'computer:5:Fake news':      'spreading fake news',
    'computer:6:pro':            'pro',
    'computer:6:proj':           'pro',
    'computer:8:Forward':        'forward',
    'science:4:Helium':          'hellum',
    'science:5:Texture':         'twxture',
    'science:7:Kilogram':        'kg',
    'science:7:Centimeter':      'cm',
    'science:8:Boiling':         'boilimg',
    'science:10:Mouth':          'mouthh',
    // ---- AP ----
    'ap:1:Pacific Ocean':       'pacific ocean', 'ap:1:Pasig River': 'pasig river', 'ap:1:Laguna de Bay': 'laguna de bay',
    'ap:2:Mount Apo':           'mount apo', 'ap:2:Mayon Volcano': 'mayon', 'ap:2:Chocolate Hills': 'chocolate hills', 'ap:2:Central Luzon Plain': 'Central Luzon Plain',
    'ap:3:Malaysia':            'malaysia', 'ap:3:Indonesia': 'Indonesia', 'ap:3:Vietnam': 'Vietnam', 'ap:3:Thailand': 'Thailand', 'ap:3:Brunei': 'Brunei',
    'ap:4:Weather':             'weather', 'ap:4:Climate': 'climate', 'ap:4:Temperature': 'temperature', 'ap:4:Humidity': 'humidity', 'ap:4:Rainfall': 'rainfall', 'ap:4:PAGASA': 'PAGASA',
    'ap:5:Cool dry season':     'cool dry season', 'ap:5:Dry season': 'dry season', 'ap:5:Hot dry season': 'hot dry season', 'ap:5:May': 'hottest month', 'ap:5:January': 'coolest month', 'ap:5:Rainy season': 'rainy season', 'ap:5:Tropical climate': 'tropical climate',
    'ap:6:Luzon':               'Luzon', 'ap:6:Visayas': 'visayas', 'ap:6:Mindanao': 'Mindanao', 'ap:6:Palawan': 'palawan', 'ap:6:Mindoro': 'mindoro', 'ap:6:Samar': 'samar', 'ap:6:Leyte': 'leyte', 'ap:6:Cebu': 'cebu',
    'ap:7:Mount Pulag':         'mount pulag', 'ap:7:Mount Pinatubo': 'mount pinatubo', 'ap:7:Taal Volcano': 'taal volcano', 'ap:7:Cagayan River': 'cagayan river', 'ap:7:Agusan River': 'agusan river', 'ap:7:Lake Lanao': 'lake lanao', 'ap:7:Subic Bay': 'subic', 'ap:7:Davao Gulf': 'davao gulf', 'ap:7:Sibuyan Sea': 'sibuyan sea',
    'ap:8:Datu':                'datu', 'ap:8:Maharlika': 'maharlika', 'ap:8:Timawa': 'timawa', 'ap:8:Babaylan': 'babaylan', 'ap:8:Balangay': 'balangay', 'ap:8:Baybayin': 'baybayin', 'ap:8:Bahay Kubo': 'bahay kubo', 'ap:8:Panday': 'panday',
    'ap:9:Manunggul Jar':       'manunggal jar', 'ap:9:Banaue Rice Terraces':'banaue rice terrace', 'ap:9:Bulul': 'bulul', 'ap:9:Laguna Copperplate': 'Laguna Copperplate Inscription', 'ap:9:Golden Tara': 'Golden Tara of Agusan', 'ap:9:Tabon Cave': 'tabon cave', 'ap:9:Angono Petroglyphs': 'angono', 'ap:9:Fort Santiago': 'fort santiago', 'ap:9:San Agustin Church': 'san agustin church', 'ap:9:Bahay na Bato': 'bahay na bato', 'ap:9:Barasoain Church': 'barasain church',
    'ap:10:Hudhud':             'hudhud', 'ap:10:Biag ni Lam-ang': 'Biag ni Lam-ang', 'ap:10:Alamat': 'alamat', 'ap:10:Bugtong': 'bugtong', 'ap:10:Salawikain': 'salawikain', 'ap:10:Kundiman': 'kundiman', 'ap:10:Tinikling': 'tinikling', 'ap:10:Singkil': 'singkil', 'ap:10:Pandanggo sa Ilaw': 'Pandanggo sa Ilaw', 'ap:10:Fiesta': 'fiesta', 'ap:10:Pamahiin': 'pamahiin', 'ap:10:Mano po': 'mano po',

    // ---- EPP ----
    'computer:1:Google':         'google', 'computer:1:Yahoo': 'yahoo', 'computer:1:Lycos': 'lycos',
    'computer:2:Search box':     'search box', 'computer:2:Search button': 'search button', 'computer:2:Search results': 'search results', 'computer:2:Tabs': 'tabs',
    'computer:3:Safari':         'safari', 'computer:3:Opera': 'opera', 'computer:3:Microsoft Edge': 'Microsoft edge', 'computer:3:Mozilla Firefox':'Mozilla Firefox', 'computer:3:Google Chrome': 'google chrome',
    'computer:4:Email':          'email', 'computer:4:Chat': 'chat', 'computer:4:Instant message':'instant message', 'computer:4:Video call': 'video call', 'computer:4:Social media': 'social media', 'computer:4:Online class': 'online class',
    'computer:5:Kind words':         'use kind words', 'computer:5:Ask permission': 'Ask permission before posting others_ photos (do)', 'computer:5:Be respectful': 'be respectful', 'computer:5:Typing in ALL CAPS': 'typing in all caps', 'computer:5:Sharing password': 'sharing your password', 'computer:5:Using bad words': 'using bad words', 'computer:5:Fake news': 'spreading fake news',
    
    'computer:6:com':  'com', 'computer:6:edu': 'edu', 'computer:6:gov': 'gov', 'computer:6:info': 'info', 'computer:6:int': 'int', 'computer:6:net': 'net', 'computer:6:org': 'org', 'computer:6:proj': 'proj',

    'computer:7:Browser window buttons': 'browser window button', 'computer:7:Tab name': 'tab name', 'computer:7:Navigation buttons': 'navigation buttons', 'computer:7:New tab': 'new tab', 'computer:7:Customize and control': 'customize and control', 'computer:7:Bookmark this page': 'bookmark', 'computer:7:Address bar': 'address bar', 'computer:7:Display window': 'display window', 'computer:7:Scroll bar': 'scroll bar',
    
    'computer:8:Username':    'username', 'computer:8:Domain name': 'domain name', 'computer:8:Domain type': 'domain type', 'computer:8:To': 'to', 'computer:8:Cc': 'Cc', 'computer:8:Bcc': 'Bcc', 'computer:8:Subject': 'subject', 'computer:8:Forward': 'forward', 'computer:8:Send': 'send',
    
    'computer:9:Gmail':        'gmail', 'computer:9:Yahoo Mail': 'yahoo mail', 'computer:9:Outlook': 'outlook', 'computer:9:Compose Mail': 'compose mail', 'computer:9:Inbox': 'inbox', 'computer:9:Sent': 'sent', 'computer:9:Drafts': 'draft', 'computer:9:Spam': 'spam', 'computer:9:Attachment': 'attachment', 'computer:9:Reply': 'reply', 'computer:9:Forward': 'forward',
    
    'computer:10:Monitor':         'monitor', 'computer:10:Keyboard': 'keyboard', 'computer:10:Mouse': 'mouse', 'computer:10:System unit': 'system unit', 'computer:10:Speakers': 'speakers', 'computer:10:Printer': 'printer', 'computer:10:Webcam': 'webcam', 'computer:10:Microphone': 'microphone', 'computer:10:Headset': 'headset', 'computer:10:Scanner': 'scanner', 'computer:10:USB flash drive': 'usb flash drive', 'computer:10:Touchpad': 'touch pad',

    // ---- Science ----
    'science:1:Rock':  'rock', 'science:1:Water': 'water', 'science:1:Air': 'airr',
    'science:2:Chair': 'chair', 'science:2:Desk': 'desk', 'science:2:Bag': 'bag', 'science:2:Shoes': 'shoes',
    'science:3:Water': 'waterr', 'science:3:Coffee': 'coffee', 'science:3:Chocolate drink': 'chocolate drink', 'science:3:Juice': 'juice', 'science:3:Milk': 'milk',
    'science:4:Air': 'airr', 'science:4:Wind': 'wind', 'science:4:Oxygen': 'oxygen', 'science:4:Carbon dioxide': 'carbon dioxide', 'science:4:Water vapor': 'water vapor', 'science:4:Helium': 'hellum',
    'science:5:Mass': 'mass', 'science:5:Weight': 'weight', 'science:5:Volume': 'volume', 'science:5:Shape': 'shape', 'science:5:Color': 'color', 'science:5:Texture': 'twxture', 'science:5:Smell': 'smell',
    'science:6:Platform balance': 'platform balance', 'science:6:Triple beam balance': 'triple beam balance', 'science:6:Weighing scale': 'Weighing scale', 'science:6:Graduated cylinder': 'graduated cylinder', 'science:6:Meter stick': 'meter stick', 'science:6:Thermometer': 'thermometer', 'science:6:Measuring cup': 'measuring cup', 'science:6:Beaker': 'beaker',
    'science:7:Gram': 'gram', 'science:7:Kilogram': 'kg', 'science:7:Milliliter': 'milliliter', 'science:7:Liter': 'liter', 'science:7:Centimeter': 'cm', 'science:7:Meter': 'meter', 'science:7:Degree Celsius': 'degree Celsius', 'science:7:Cubic meter': 'cubic meter', 'science:7:Cubic centimeter': 'cubic centimeter',
    'science:8:Melting': 'melting', 'science:8:Freezing': 'freezing', 'science:8:Evaporation': 'evaporation', 'science:8:Condensation': 'condensation', 'science:8:Boiling': 'boilimg', 'science:8:Cutting paper': 'cutting paper', 'science:8:Tearing paper': 'tearing paper', 'science:8:Crushing a can': 'crushing a can', 'science:8:Dissolving sugar': 'dissolving sugar', 'science:8:Folding paper': 'folding paper',
    'science:9:Mouth': 'mouth', 'science:9:Teeth': 'teeth', 'science:9:Salivary glands': 'salivary glands', 'science:9:Esophagus': 'esophagus', 'science:9:Liver': 'liver', 'science:9:Gallbladder': 'gallbladder', 'science:9:Pancreas': 'pancreas', 'science:9:Small intestine': 'small intestine', 'science:9:Large intestine': 'large intestine', 'science:9:Rectum': 'rectum',
    'science:10:Nose': 'nose', 'science:10:Nasal cavity': 'nasal cavity', 'science:10:Mouth': 'mouth', 'science:10:Pharynx': 'Pharynx', 'science:10:Larynx': 'Larynx', 'science:10:Trachea': 'Trachea', 'science:10:Bronchi': 'Bronchi', 'science:10:Bronchioles': 'Bronchioles', 'science:10:Alveoli': 'Alveoli', 'science:10:Lungs': 'lungs', 'science:10:Diaphragm': 'diaphragm', 'science:10:Ribs': 'ribs'
  };

  // ============================================================
  // DESC_MAP
  // ============================================================
  const DESC_MAP = {
    'ap:1:Pacific Ocean':       "Earth's largest and deepest ocean.", 'ap:1:Pasig River': "Historic river running through Manila.", 'ap:1:Laguna de Bay': "Largest lake in the Philippines.",
    'ap:2:Mount Apo':           "The highest peak in the Philippines.", 'ap:2:Mayon Volcano': "Volcano famous for its perfect cone.", 'ap:2:Chocolate Hills': "Famous brown hills in Bohol.", 'ap:2:Central Luzon Plain': "The rice granary of the country.",
    'ap:3:Malaysia':            "Southeast Asian country near Palawan.", 'ap:3:Indonesia': "Giant archipelago south of Mindanao.", 'ap:3:Vietnam': "Country across the West Philippine Sea.", 'ap:3:Thailand': "Asian country famous for tourism.", 'ap:3:Brunei': "Small, wealthy nation on Borneo.",
    'ap:4:Weather':             "Day-to-day condition of the atmosphere.", 'ap:4:Climate': "Long-term average weather pattern.", 'ap:4:Temperature': "Measure of hotness or coldness.", 'ap:4:Humidity': "Amount of moisture in air.", 'ap:4:Rainfall': "Water falling down as rain.", 'ap:4:PAGASA': "Philippine official weather forecasting agency.",
    'ap:5:Rainy season':        "Months with heavy rainfall (June-November).", 'ap:5:Dry season': "Months with very little rain.", 'ap:5:Cool dry season': "Pleasant weather with cool breezes.", 'ap:5:Hot dry season': "Warmest months of the year.", 'ap:5:May': "Peak of the dry season.", 'ap:5:January': "Time of lowest yearly temperatures.", 'ap:5:Tropical climate': "Warm, humid climate near the equator.",
    'ap:6:Luzon':               "Largest northern Philippine island group.", 'ap:6:Visayas': "Central island group of the Philippines.", 'ap:6:Mindanao': "Southern island group of the Philippines.", 'ap:6:Palawan': "Island known as the last frontier.", 'ap:6:Mindoro': "Island located south of Luzon.", 'ap:6:Samar': "Large island in eastern Visayas.", 'ap:6:Leyte': "Visayan island next to Samar.", 'ap:6:Cebu': "Major hub in the central Philippines.",
    'ap:7:Mount Pulag':         "Luzon's highest peak, above a sea of clouds.", 'ap:7:Mount Pinatubo': "Volcano that erupted in 1991.", 'ap:7:Taal Volcano': "Small active volcano within a lake.", 'ap:7:Cagayan River': "Longest river in the Philippines.", 'ap:7:Agusan River': "Large river in eastern Mindanao.", 'ap:7:Lake Lanao': "Large ancient lake in Mindanao.", 'ap:7:Subic Bay': "Famous harbor in Central Luzon.", 'ap:7:Davao Gulf': "Large gulf in southern Mindanao.", 'ap:7:Sibuyan Sea': "Sea at the center of the Philippines.",
    'ap:8:Datu':                "Ruler of an ancient barangay.", 'ap:8:Maharlika': "Feudal warrior class of the Tagalogs.", 'ap:8:Timawa': "Free citizens of ancient society.", 'ap:8:Babaylan': "Priestess or shaman of the community.", 'ap:8:Balangay': "Ancient Filipino wooden water vessel.", 'ap:8:Baybayin': "Pre-colonial native writing system.", 'ap:8:Bahay Kubo': "Traditional Filipino stilt house.", 'ap:8:Panday': "Maker of metal tools and weapons.",
    'ap:9:Manunggul Jar':       "Ancient burial jar found in Palawan.", 'ap:9:Banaue Rice Terraces':"Hand-carved mountainside agricultural terraces.", 'ap:9:Bulul': "Wooden Igorot rice granary god.", 'ap:9:Laguna Copperplate': "Oldest written document in the Philippines.", 'ap:9:Golden Tara': "Ancient Hindu golden statue artifact.", 'ap:9:Tabon Cave': "Site of early human remains.", 'ap:9:Angono Petroglyphs': "Oldest known rock art carvings.", 'ap:9:Fort Santiago': "Spanish defense fortress in Manila.", 'ap:9:San Agustin Church': "Oldest stone church in Manila.", 'ap:9:Bahay na Bato': "Spanish colonial noble stone house.", 'ap:9:Barasoain Church': "Historic site of the first republic.",
    'ap:10:Hudhud':             "Chanted epic stories of the Ifugao.", 'ap:10:Biag ni Lam-ang': "Famous Ilocano folk epic poem.", 'ap:10:Alamat': "Traditional story explaining origins.", 'ap:10:Bugtong': "Filipino rhyming word puzzle game.", 'ap:10:Salawikain': "Traditional saying containing wisdom.", 'ap:10:Kundiman': "Traditional Filipino love song genre.", 'ap:10:Tinikling': "Bamboo pole traditional dance.", 'ap:10:Singkil': "Royal Maranao bamboo dance.", 'ap:10:Pandanggo sa Ilaw': "Dance with balancing oil lamps.", 'ap:10:Fiesta': "Community celebration honoring patron saints.", 'ap:10:Pamahiin': "Traditional cultural beliefs and myths.", 'ap:10:Mano po': "Respect gesture for greeting elders.",

    'computer:1:Google':         "Most popular modern search engine.", 'computer:1:Yahoo': "Search engine with internet directory.", 'computer:1:Lycos': "Pioneer search engine from the nineties.",
    'computer:2:Search box':     "Where you type keywords online.", 'computer:2:Search button': "Click this to start searching.", 'computer:2:Search results': "List of websites found online.", 'computer:2:Tabs': "Filters search results into categories.",
    'computer:3:Safari':         "Apple devices default web browser.", 'computer:3:Opera': "Browser known for speed features.", 'computer:3:Microsoft Edge': "Windows default built-in web browser.", 'computer:3:Mozilla Firefox':"Independent, open-source web browser.", 'computer:3:Google Chrome': "Widely used browser by Google.",
    'computer:4:Email':          "Digital letters sent over the internet.", 'computer:4:Chat': "Real-time text messaging with others.", 'computer:4:Instant message':"Fast text sent instantly online.", 'computer:4:Video call': "See and hear people digitally.", 'computer:4:Social media': "Platforms for sharing media content.", 'computer:4:Online class': "Learning using internet-connected devices.",
    'computer:5:Kind words':         "Be polite in online messages.", 'computer:5:Ask permission': "Respect privacy of other people.", 'computer:5:Be respectful': "Listen carefully to your teacher.", 'computer:5:Typing in ALL CAPS': "Feels like shouting at someone.", 'computer:5:Sharing password': "Keep account access keys secret.", 'computer:5:Using bad words': "Never use offensive language online.", 'computer:5:Fake news': "Never share unverified false information.",

    'computer:6:com': "Commercial website domain type.", 'computer:6:edu': "Educational institution domain type.", 'computer:6:gov': "Government website domain type.", 'computer:6:info': "Informational website domain type.", 'computer:6:int': "International organization domain type.", 'computer:6:net': "Network infrastructure domain type.", 'computer:6:org': "Non-profit organization domain type.", 'computer:6:proj': "Project website domain type.",

    'science:1:Rock':  "Hard solid form of matter.", 'science:1:Water': "Life-sustaining liquid type of matter.", 'science:1:Air': "The gaseous atmosphere of Earth.",
    'science:2:Chair': "Solid furniture piece for sitting.", 'science:2:Desk': "Solid table used for working.", 'science:2:Bag': "Solid container carrying school items.", 'science:2:Shoes': "Solid protective footwear worn.",
    'science:3:Water': "Clear liquid essential for life.", 'science:3:Coffee': "Hot liquid energy morning drink.", 'science:3:Chocolate drink': "Sweet liquid treat enjoyed cold.", 'science:3:Juice': "Flavorful liquid squeezed from fruits.", 'science:3:Milk': "Nutritious white dairy drink.",
    'science:4:Air': "The gaseous atmosphere of Earth.", 'science:4:Wind': "Moving air across landscape terrains.", 'science:4:Oxygen': "Gas living organisms breathe in.", 'science:4:Carbon dioxide': "Gas released when breathing out.", 'science:4:Water vapor': "Water existing in gaseous state.", 'science:4:Helium': "Light gas inflating flying balloons.",
    'science:5:Mass': "Amount of matter inside object.", 'science:5:Weight': "Gravitational pull force on object.", 'science:5:Volume': "Amount of space object occupies.", 'science:5:Shape': "External form outline of matter.", 'science:5:Color': "Visual appearance shade of matter.", 'science:5:Texture': "Feel of surface when touched.", 'science:5:Smell': "Odor detected by your nose.",
    'science:6:Platform balance': "Tool comparing heavy item masses.", 'science:6:Triple beam balance': "Measures mass very precisely.", 'science:6:Weighing scale': "Displays object current weight.", 'science:6:Graduated cylinder': "Measures exact liquid volume.", 'science:6:Meter stick': "Ruler measuring long object length.", 'science:6:Thermometer': "Tracks hotness or coldness.", 'science:6:Measuring cup': "Cup for kitchen fluid measurements.", 'science:6:Beaker': "Glass cup measuring laboratory liquids.",
    'science:7:Gram': "Metric unit tracking light mass.", 'science:7:Kilogram': "Base unit tracking heavy mass.", 'science:7:Milliliter': "Small unit tracking liquid volume.", 'science:7:Liter': "Common unit tracking liquid volume.", 'science:7:Centimeter': "Unit measuring small item lengths.", 'science:7:Meter': "Base unit measuring distance.", 'science:7:Cubic centimeter':"Volume unit for solid matter.", 'science:7:Degree Celsius': "Unit measuring temperature level.", 'science:7:Cubic meter': "Large unit measuring massive volumes.",
    'science:8:Melting': "Solid turning into a liquid.", 'science:8:Freezing': "Liquid turning into a solid.", 'science:8:Evaporation': "Liquid turning into a gas.", 'science:8:Condensation': "Gas turning into a liquid.", 'science:8:Boiling': "Liquid rapidly vaporizing from heat.", 'science:8:Cutting paper': "Changing shape using scissors.", 'science:8:Tearing paper': "Pulling paper apart into pieces.", 'science:8:Crushing a can': "Smashing metal changing its form.", 'science:8:Dissolving sugar': "Mixing crystals into liquid.", 'science:8:Folding paper': "Creasing paper without tearing.",
    'science:9:Mouth': "Where food enters digestive path.", 'science:9:Teeth': "Hard structures crushing food items.", 'science:9:Salivary glands': "Glands producing spit to dissolve food.", 'science:9:Esophagus': "Tube moving food down to stomach.", 'science:9:Liver': "Filters toxins, produces bile.", 'science:9:Gallbladder': "Small sac storing digestive bile.", 'science:9:Pancreas': "Produces useful digestive enzymes.", 'science:9:Small intestine': "Where most nutrients get absorbed.", 'science:9:Large intestine': "Absorbs water from waste.", 'science:9:Rectum': "Final storage area for waste.",
    'science:10:Nose': "Main external pathway for breathing.", 'science:10:Nasal cavity': "Warms and filters inhaled air.", 'science:10:Mouth': "Secondary opening used for breathing.", 'science:10:Pharynx': "Throat passage connecting nose and mouth.", 'science:10:Larynx': "Voice box housing vocal cords.", 'science:10:Trachea': "Main windpipe tube leading to lungs.", 'science:10:Bronchi': "Two large air tube branches.", 'science:10:Bronchioles': "Smallest air tubes inside the lungs.", 'science:10:Alveoli': "Tiny sacs where gas exchange happens.", 'science:10:Lungs': "Primary organs used for breathing.", 'science:10:Diaphragm': "Muscle driving lung breathing actions.", 'science:10:Ribs': "Bones protecting vital lung organs."
  };

  // ============================================================
  // IMG — Unsplash fallback
  // ============================================================
  const IMG = {
    macbook:'photo-1517336714731-489689fd1ca8', laptopDesk:'photo-1496181133206-80ce9b88a853',
    dualMonitors:'photo-1541140532154-b024d705b90a', monitor:'photo-1587829741301-dc798b83add3',
    keyboard:'photo-1527814050087-3793815479db', mouse:'photo-1527864550417-7fd91fc51a46',
    headphones:'photo-1615663245857-ac93bb7c39e7', tablet:'photo-1593642702749-b7d2a804fbcf',
    phone:'photo-1527689368864-3a821dbccc34', circuit:'photo-1518770660439-4636190af475',
    code1:'photo-1461749280684-dccba630e2f6', code2:'photo-1542831371-29b0f74f9713',
    binary:'photo-1555949963-aa79dcee981c', codeEditor:'photo-1498050108023-c5249f4df085',
    codeScreen:'photo-1517694712202-14dd9538aa97', workspace:'photo-1555617981-dac3880eac6e',
    gadgets:'photo-1587145820266-a5951ee6f620', headset:'photo-1518444065439-e933c06ce9cd',
    webcam:'photo-1618366712010-f4ae9c647dcb', printer:'photo-1547082299-de196ea013d6',
    laptopSide:'photo-1531297484001-80022131f5a1', analytics:'photo-1460925895917-afdab827c52f',
    chart:'photo-1543286386-713bdd548da4', dashboard:'photo-1551288049-bebda4e38f71',
    docs:'photo-1454165804606-c3d57bc86b40', notebook:'photo-1506784983877-45594efa4cbe',
    writing:'photo-1434030216411-0b793f4b4173', deskWork:'photo-1486312338219-ce68d2c6f44d',
    officeDesk:'photo-1554224155-6726b3ff858f', uiDesign:'photo-1531403009284-440f080d1e12',
    security:'photo-1563986768609-322da13575f3', password:'photo-1614064641938-3bbee52942c7',
    mountain:'photo-1506905925346-21bda4d32df4', forest:'photo-1502082553048-f009c37129b9',
    forestPath:'photo-1441974231531-c6227db76b6e', lake:'photo-1470071459604-3b5ec3a7fe05',
    river:'photo-1444703686981-a3abbc4d4fe3', jungle:'photo-1418065460487-3e41a6c84dc5',
    woods:'photo-1447752875215-b2761acb3c5d', mountains2:'photo-1501785888041-af3ef285b470',
    trees:'photo-1469474968028-56623f02e42e', plant:'photo-1416879595882-3373a0480b5b',
    leaves:'photo-1466692476868-aef1dfb1e735', flower:'photo-1490750967868-88aa4486c946',
    flower2:'photo-1508610048659-a06b669e3321', flower3:'photo-1470509037663-253afd7f0f51',
    lake2:'photo-1439066615861-d1af74d74000', sunset:'photo-1500673922987-e212871fec22',
    sunset2:'photo-1495616811223-4d98c6e9c869', clouds:'photo-1534088568595-a066f410bcda',
    clouds2:'photo-1470252649378-9c29740c9fa8', sky:'photo-1446776653964-20c1d3a81b06',
    stars:'photo-1419242902214-272b3f66ee7a', earth:'photo-1451187580459-43490279c0fa',
    lightning:'photo-1502134249126-9f3755a50d78', rainbow:'photo-1419833173245-f59e1b93f9ee',
    snow:'photo-1495616811223-4d98c6e9c869', beach:'photo-1507525428034-b723cf961d3e',
    ocean:'photo-1505142468610-359e7d316be0', waterfall:'photo-1432405972618-c60b0225b8f9',
    island:'photo-1559827260-dc66d52bef19', dog:'photo-1552053831-71594a27632d',
    cat:'photo-1514888286974-6c03e2ca1dba', bird:'photo-1441057206919-63d19fac2369',
    bird2:'photo-1452570053594-1b985d6ea890', fish:'photo-1524704654690-b56c05c78a00',
    lion:'photo-1474511320723-9a56873867b5', elephant:'photo-1547721064-da6cfb341d50',
    butterfly:'photo-1425082661705-1834bfd09dca', horse:'photo-1552728089-57bdde30beb3',
    turtle:'photo-1595351298020-038700609878', penguin:'photo-1470093851219-69951fcbb533',
    rabbit:'photo-1507666405895-422eee7d517f', monkey:'photo-1517849845537-4d257902454a',
    rice:'photo-1490645935967-10de6ba17061', salad:'photo-1546069901-ba9599a7e63c',
    vegetables:'photo-1488459716781-31db52582fe9', meal:'photo-1504674900247-0877df9cc836',
    juice:'photo-1548839140-29a749e1cf4d', water:'photo-1523362628745-0c100150b504',
    soup:'photo-1512058564366-18510be2db19', snack:'photo-1498837167922-ddd27525d352',
    coffee:'photo-1509042239860-f550ce710b93', bread:'photo-1509440159596-0249088772ff',
    fruit:'photo-1519996529931-28324d5a630e', apple:'photo-1568702846914-96b305d2aaeb',
    girlPortrait:'photo-1517841905240-472988babdf9', child:'photo-1503454537195-1dcabb73ffb9',
    kid:'photo-1502086223501-7ea6ecd79368', face:'photo-1509909756405-be0199881695',
    boyPortrait:'photo-1521119989659-a83eee488004', toddler:'photo-1596815064285-45ed8a9c0463',
    portrait:'photo-1544005313-94ddf0286df2', siblings:'photo-1503919545889-aef636e10ad4',
    children:'photo-1519457431-44ccd64a579b', kidOutside:'photo-1547036967-23d11aacaee0',
    family:'photo-1511895426328-dc8714191300', motherChild:'photo-1543342380-0d1a9d6ef3e7',
    fatherChild:'photo-1609220136736-443140cffec6', grandparents:'photo-1476703993599-0035a21b17a9',
    familyWalk:'photo-1478061653917-455ba7f4a541', classroom:'photo-1580582932707-520aed937b7b',
    books:'photo-1497633762265-9d179a990aa6', teacher:'photo-1503676260728-1c00da094a0b',
    students:'photo-1509062522246-3755977927d7', schoolBldg:'photo-1588072432836-e10032774350',
    studying:'photo-1523240795612-9a054b0db644', library:'photo-1427504494785-3a9ca7044f45',
    chalkboard:'photo-1497486751825-1233686d5d80', pencils:'photo-1503945438517-f65904a52ce6',
    schoolBag:'photo-1509966756634-9c23dd6e6815', city:'photo-1449824913935-59a10b8d2000',
    street:'photo-1513635269975-59663e0ac1ad', community:'photo-1499856871958-5b9627545d1a',
    neighborhood:'photo-1526778548025-fa2f459cd5c1', church:'photo-1519501025264-65ba15a82390',
    market:'photo-1580910051074-3eb694886505', houses:'photo-1541888946425-d81bb19240f5',
    park:'photo-1499092346589-b9b6be3e94b2', buildings:'photo-1477959858617-67f85cf4f1df',
    town:'photo-1500534314209-a25ddb2bd429', doctor:'photo-1612349317150-e413f6a5b16d',
    police:'photo-1573496359142-b8d87734a5a2', firefighter:'photo-1583454110551-21f2fa2afe61',
    nurse:'photo-1559839734-2b71ea197ec2', farmer:'photo-1581092918056-0c4c3acd3789',
    chef:'photo-1531973576160-7125cd663d86', driver:'photo-1615874959474-d609969a20ed',
    car:'photo-1503376780353-7e6692767b70', bike:'photo-1485965120184-e220f721d03e',
    train:'photo-1474487548417-781cb71495f3', plane:'photo-1436491865332-7a61a109cc05',
    boat:'photo-1502680390469-be75c86b636f', bus:'photo-1544620347-c4fd4a3d5957',
    phIslands:'photo-1518509562904-e7ef99cdcc86', phProvince:'photo-1531968455001-5c5272a41129',
    phLandmark:'photo-1552832230-c0197dd311b5', riceTerraces:'photo-1505228395891-9a51e7e86bf6',
    festival:'photo-1516035069371-29a1b244cc32', culturalDance:'photo-1518548419970-58e3b4079ab2',
    tradition:'photo-1583939003579-730e3918a45a', costume:'photo-1533106418989-88406c7cc8ca',
    weaving:'photo-1518998053901-5348d3961a04', localFood:'photo-1504674900247-0877df9cc836',
    phHistory:'photo-1519638831568-d9897f54ed69', storm:'photo-1502134249126-9f3755a50d78'
  };

  // ============================================================
  // TOPIC_DATA (UPDATED WITH NICKNAMES)
  // ============================================================
  const TOPIC_DATA = {
    computer: {
      1: { title: 'Search Engines', cards: [
        { id: IMG.codeScreen, name: 'Google', nickname: 'Google' }, 
        { id: IMG.analytics,  name: 'Yahoo', nickname: 'Yahoo'  }, 
        { id: IMG.binary,     name: 'Lycos', nickname: 'Lycos'  }
      ]},
      2: { title: 'Parts of a Search Engine Home Page', cards: [
        { id: IMG.uiDesign,  name: 'Search box', nickname: 'Search Box'     }, 
        { id: IMG.uiDesign,  name: 'Search button', nickname: 'Search Btn'  },
        { id: IMG.docs,      name: 'Search results', nickname: 'Results' }, 
        { id: IMG.dashboard, name: 'Tabs', nickname: 'Tabs'           }
      ]},
      3: { title: 'Web Browsers', cards: [
        { id: IMG.macbook,    name: 'Safari', nickname: 'Safari'          }, 
        { id: IMG.codeScreen, name: 'Opera', nickname: 'Opera'           },
        { id: IMG.monitor,    name: 'Microsoft Edge', nickname: 'Edge'  }, 
        { id: IMG.code2,      name: 'Mozilla Firefox', nickname: 'Firefox' },
        { id: IMG.workspace,  name: 'Google Chrome', nickname: 'Chrome'   }
      ]},
      4: { title: 'Ways to Communicate Online', cards: [
        { id: IMG.docs,       name: 'Email', nickname: 'Email'           }, 
        { id: IMG.codeScreen, name: 'Chat', nickname: 'Chat'            },
        { id: IMG.notebook,   name: 'Instant message', nickname: 'IM' }, 
        { id: IMG.webcam,     name: 'Video call', nickname: 'Video Call'      },
        { id: IMG.uiDesign,   name: 'Social media', nickname: 'Social Media'    }, 
        { id: IMG.studying,   name: 'Online class', nickname: 'Online Class'    }
      ]},
      5: { title: "Netiquette: Do's and Don'ts", cards: [
        { id: IMG.writing,   name: 'Kind words', nickname: 'Kind Words'         }, 
        { id: IMG.docs,      name: 'Ask permission', nickname: 'Ask Permission'     },
        { id: IMG.studying,  name: 'Be respectful', nickname: 'Be Respectful'      }, 
        { id: IMG.code1,     name: 'Typing in ALL CAPS', nickname: 'ALL CAPS' },
        { id: IMG.password,  name: 'Sharing password', nickname: 'Share Pass'   }, 
        { id: IMG.docs,      name: 'Using bad words', nickname: 'Bad Words'    },
        { id: IMG.analytics, name: 'Fake news', nickname: 'Fake News'          }
      ]},
      6: { title: "Domain Types", cards: [
        { id: IMG.dashboard, name: 'com', nickname: '.com' }, 
        { id: IMG.dashboard, name: 'edu', nickname: '.edu' }, 
        { id: IMG.dashboard, name: 'gov', nickname: '.gov' },
        { id: IMG.dashboard, name: 'info', nickname: '.info' }, 
        { id: IMG.dashboard, name: 'int', nickname: '.int' }, 
        { id: IMG.dashboard, name: 'net', nickname: '.net' },
        { id: IMG.dashboard, name: 'org', nickname: '.org' }, 
        { id: IMG.dashboard, name: 'pro', nickname: '.pro' }
      ]},
      7: { title: 'Parts of a Web Browser', cards: [
        { id: IMG.monitor,    name: 'Browser window buttons', nickname: 'Window Btns' }, 
        { id: IMG.uiDesign,   name: 'Tab name', nickname: 'Tab Name'               },
        { id: IMG.mouse,      name: 'Navigation buttons', nickname: 'Nav Btns'     }, 
        { id: IMG.dashboard,  name: 'New tab', nickname: 'New Tab'                },
        { id: IMG.security,   name: 'Customize and control', nickname: 'Customize'  }, 
        { id: IMG.books,      name: 'Bookmark this page', nickname: 'Bookmark'     },
        { id: IMG.codeScreen, name: 'Address bar', nickname: 'Address Bar'            }, 
        { id: IMG.workspace,  name: 'Display window', nickname: 'Display Btns'         },
        { id: IMG.officeDesk, name: 'Scroll bar', nickname: 'Scroll Bar'             }
      ]},
      8: { title: 'Parts of an Email', cards: [
        { id: IMG.face,       name: 'Username', nickname: 'Username'    }, 
        { id: IMG.analytics,  name: 'Domain name', nickname: 'Domain Name' },
        { id: IMG.dashboard,  name: 'Domain type', nickname: 'Domain Type' }, 
        { id: IMG.docs,       name: 'To', nickname: 'To'          },
        { id: IMG.docs,       name: 'Cc', nickname: 'Cc'          }, 
        { id: IMG.security,   name: 'Bcc', nickname: 'Bcc'         },
        { id: IMG.writing,    name: 'Subject', nickname: 'Subject'     }, 
        { id: IMG.uiDesign,   name: 'Forward', nickname: 'Forward'     },
        { id: IMG.uiDesign,   name: 'Send', nickname: 'Send'        }
      ]},
      9: { title: 'Email Words', cards: [
        { id: IMG.dashboard,  name: 'Gmail', nickname: 'Gmail'        }, 
        { id: IMG.docs,       name: 'Yahoo Mail', nickname: 'Yahoo Mail'   },
        { id: IMG.macbook,    name: 'Outlook', nickname: 'Outlook'      }, 
        { id: IMG.writing,    name: 'Compose Mail', nickname: 'Compose' },
        { id: IMG.docs,       name: 'Inbox', nickname: 'Inbox'        }, 
        { id: IMG.analytics,  name: 'Sent', nickname: 'Sent'         },
        { id: IMG.notebook,   name: 'Drafts', nickname: 'Drafts'       }, 
        { id: IMG.security,   name: 'Spam', nickname: 'Spam'         },
        { id: IMG.gadgets,    name: 'Attachment', nickname: 'Attach'   }, 
        { id: IMG.mouse,      name: 'Reply', nickname: 'Reply'        },
        { id: IMG.uiDesign,   name: 'Forward', nickname: 'Forward'      }
      ]},
      10: { title: 'Parts of a Computer', cards: [
        { id: IMG.monitor,    name: 'Monitor', nickname: 'Monitor'         }, 
        { id: IMG.keyboard,   name: 'Keyboard', nickname: 'Keyboard'        },
        { id: IMG.mouse,      name: 'Mouse', nickname: 'Mouse'           }, 
        { id: IMG.macbook,    name: 'System unit', nickname: 'System Unit'     },
        { id: IMG.headset,    name: 'Speakers', nickname: 'Speakers'        }, 
        { id: IMG.printer,    name: 'Printer', nickname: 'Printer'         },
        { id: IMG.webcam,     name: 'Webcam', nickname: 'Webcam'          }, 
        { id: IMG.headphones, name: 'Microphone', nickname: 'Mic'      },
        { id: IMG.headset,    name: 'Headset', nickname: 'Headset'         }, 
        { id: IMG.printer,    name: 'Scanner', nickname: 'Scanner'         },
        { id: IMG.gadgets,    name: 'USB flash drive', nickname: 'USB Drive' }, 
        { id: IMG.laptopSide, name: 'Touchpad', nickname: 'Touchpad'        }
      ]}
    },
    science: {
      1: { title: 'Matter', cards: [
        { id: IMG.mountain, name: 'Rock', nickname: 'Rock'  }, 
        { id: IMG.water,    name: 'Water', nickname: 'Water' }, 
        { id: IMG.clouds,   name: 'Air', nickname: 'Air'   }
      ]},
      2: { title: 'Solids', cards: [
        { id: IMG.officeDesk, name: 'Chair', nickname: 'Chair' }, 
        { id: IMG.workspace,  name: 'Desk', nickname: 'Desk'  },
        { id: IMG.schoolBag,  name: 'Bag', nickname: 'Bag'   }, 
        { id: IMG.bike,       name: 'Shoes', nickname: 'Shoes' }
      ]},
      3: { title: 'Liquids', cards: [
        { id: IMG.water,  name: 'Water', nickname: 'Water'           }, 
        { id: IMG.coffee, name: 'Coffee', nickname: 'Coffee'          },
        { id: IMG.coffee, name: 'Chocolate drink', nickname: 'Choco' }, 
        { id: IMG.juice,  name: 'Juice', nickname: 'Juice'           },
        { id: IMG.fruit,  name: 'Milk', nickname: 'Milk'            }
      ]},
      4: { title: 'Gases', cards: [
        { id: IMG.clouds,  name: 'Air', nickname: 'Air'            }, 
        { id: IMG.clouds2, name: 'Wind', nickname: 'Wind'           },
        { id: IMG.forest,  name: 'Oxygen', nickname: 'Oxygen'         }, 
        { id: IMG.sky,     name: 'Carbon dioxide', nickname: 'CO2' },
        { id: IMG.clouds,  name: 'Water vapor', nickname: 'Vapor'    }, 
        { id: IMG.rainbow, name: 'Helium', nickname: 'Helium'         }
      ]},
      5: { title: 'Properties of Matter', cards: [
        { id: IMG.analytics, name: 'Mass', nickname: 'Mass'    }, 
        { id: IMG.analytics, name: 'Weight', nickname: 'Weight'  },
        { id: IMG.dashboard, name: 'Volume', nickname: 'Volume'  }, 
        { id: IMG.uiDesign,  name: 'Shape', nickname: 'Shape'   },
        { id: IMG.flower,    name: 'Color', nickname: 'Color'   }, 
        { id: IMG.leaves,    name: 'Texture', nickname: 'Texture' },
        { id: IMG.flower2,   name: 'Smell', nickname: 'Smell'   }
      ]},
      6: { title: 'Measuring Tools', cards: [
        { id: IMG.analytics,  name: 'Platform balance', nickname: 'Platform'    }, 
        { id: IMG.analytics,  name: 'Triple beam balance', nickname: 'Triple Beam' },
        { id: IMG.analytics,  name: 'Weighing scale', nickname: 'Scale'      }, 
        { id: IMG.workspace,  name: 'Graduated cylinder', nickname: 'Cylinder'  },
        { id: IMG.officeDesk, name: 'Meter stick', nickname: 'Meter Stick'         }, 
        { id: IMG.analytics,  name: 'Thermometer', nickname: 'Thermo'         },
        { id: IMG.workspace,  name: 'Measuring cup', nickname: 'Meas Cup'       }, 
        { id: IMG.soup,       name: 'Beaker', nickname: 'Beaker'              }
      ]},
      7: { title: 'Units of Measurement', cards: [
        { id: IMG.analytics,  name: 'Gram', nickname: 'Gram'             }, 
        { id: IMG.analytics,  name: 'Kilogram', nickname: 'Kg'         },
        { id: IMG.water,      name: 'Milliliter', nickname: 'mL'       }, 
        { id: IMG.water,      name: 'Liter', nickname: 'Liter'            },
        { id: IMG.officeDesk, name: 'Centimeter', nickname: 'Cm'       }, 
        { id: IMG.officeDesk, name: 'Meter', nickname: 'Meter'            },
        { id: IMG.dashboard,  name: 'Cubic centimeter', nickname: 'Cu Cm' }, 
        { id: IMG.snow,       name: 'Degree Celsius', nickname: 'Celsius'   },
        { id: IMG.dashboard,  name: 'Cubic meter', nickname: 'Cu Meter'      }
      ]},
      8: { title: 'Physical Changes', cards: [
        { id: IMG.snow,    name: 'Melting', nickname: 'Melting'          }, 
        { id: IMG.snow,    name: 'Freezing', nickname: 'Freezing'         },
        { id: IMG.clouds,  name: 'Evaporation', nickname: 'Evap'      }, 
        { id: IMG.clouds2, name: 'Condensation', nickname: 'Condense'     },
        { id: IMG.soup,    name: 'Boiling', nickname: 'Boiling'          }, 
        { id: IMG.docs,    name: 'Cutting paper', nickname: 'Cut'    },
        { id: IMG.docs,    name: 'Tearing paper', nickname: 'Tear'    }, 
        { id: IMG.gadgets, name: 'Crushing a can', nickname: 'Crush'   },
        { id: IMG.coffee,  name: 'Dissolving sugar', nickname: 'Dissolve' }, 
        { id: IMG.docs,    name: 'Folding paper', nickname: 'Fold'    }
      ]},
      9: { title: 'Digestive System', cards: [
        { id: IMG.face,      name: 'Mouth', nickname: 'Mouth'           }, 
        { id: IMG.face,      name: 'Teeth', nickname: 'Teeth'           },
        { id: IMG.face,      name: 'Salivary glands', nickname: 'Glands' }, 
        { id: IMG.analytics, name: 'Esophagus', nickname: 'Esophagus'       },
        { id: IMG.analytics, name: 'Liver', nickname: 'Liver'           }, 
        { id: IMG.analytics, name: 'Gallbladder', nickname: 'Gallbladder'     },
        { id: IMG.analytics, name: 'Pancreas', nickname: 'Pancreas'        }, 
        { id: IMG.analytics, name: 'Small intestine', nickname: 'Small Int.' },
        { id: IMG.analytics, name: 'Large intestine', nickname: 'Large Int.' }, 
        { id: IMG.analytics, name: 'Rectum', nickname: 'Rectum'          }
      ]},
      10: { title: 'Respiratory System', cards: [
        { id: IMG.face,      name: 'Nose', nickname: 'Nose'         }, 
        { id: IMG.face,      name: 'Nasal cavity', nickname: 'Nasal' },
        { id: IMG.face,      name: 'Mouth', nickname: 'Mouth'        }, 
        { id: IMG.analytics, name: 'Pharynx', nickname: 'Pharynx'      },
        { id: IMG.analytics, name: 'Larynx', nickname: 'Larynx'       }, 
        { id: IMG.analytics, name: 'Trachea', nickname: 'Trachea'      },
        { id: IMG.analytics, name: 'Bronchi', nickname: 'Bronchi'      }, 
        { id: IMG.analytics, name: 'Bronchioles', nickname: 'Bronchioles'  },
        { id: IMG.analytics, name: 'Alveoli', nickname: 'Alveoli'      }, 
        { id: IMG.analytics, name: 'Lungs', nickname: 'Lungs'        },
        { id: IMG.analytics, name: 'Diaphragm', nickname: 'Diaphragm'    }, 
        { id: IMG.analytics, name: 'Ribs', nickname: 'Ribs'         }
      ]}
    },
    ap: {
      1: { title: 'Bodies of Water', cards: [
        { id: IMG.ocean, name: 'Pacific Ocean', nickname: 'Pacific' }, 
        { id: IMG.river, name: 'Pasig River', nickname: 'Pasig'   }, 
        { id: IMG.lake,  name: 'Laguna de Bay', nickname: 'Laguna' }
      ]},
      2: { title: 'Landforms', cards: [
        { id: IMG.mountain,   name: 'Mount Apo', nickname: 'Mt. Apo'           }, 
        { id: IMG.mountains2, name: 'Mayon Volcano', nickname: 'Mayon'       },
        { id: IMG.mountains2, name: 'Chocolate Hills', nickname: 'Choco Hills'     }, 
        { id: IMG.forest,     name: 'Central Luzon Plain', nickname: 'Central Luzon' }
      ]},
      3: { title: 'Southeast Asian Neighbors', cards: [
        { id: IMG.city,      name: 'Malaysia', nickname: 'Malaysia'  }, 
        { id: IMG.island,    name: 'Indonesia', nickname: 'Indonesia' },
        { id: IMG.river,     name: 'Vietnam', nickname: 'Vietnam'   }, 
        { id: IMG.town,      name: 'Thailand', nickname: 'Thailand'  },
        { id: IMG.buildings, name: 'Brunei', nickname: 'Brunei'    }
      ]},
      4: { title: 'Weather and Climate Terms', cards: [
        { id: IMG.clouds,  name: 'Weather', nickname: 'Weather'     }, 
        { id: IMG.sunset,  name: 'Climate', nickname: 'Climate'     },
        { id: IMG.sunset,  name: 'Temperature', nickname: 'Temp' }, 
        { id: IMG.clouds2, name: 'Humidity', nickname: 'Humidity'    },
        { id: IMG.clouds,  name: 'Rainfall', nickname: 'Rainfall'    }, 
        { id: IMG.storm,   name: 'PAGASA', nickname: 'PAGASA'      }
      ]},
      5: { title: 'Climate and Seasons', cards: [
        { id: IMG.clouds,  name: 'Rainy season', nickname: 'Rainy'     }, 
        { id: IMG.sunset,  name: 'Dry season', nickname: 'Dry'       },
        { id: IMG.clouds2, name: 'Cool dry season', nickname: 'Cool Dry'  }, 
        { id: IMG.sunset2, name: 'Hot dry season', nickname: 'Hot Dry'   },
        { id: IMG.sunset,  name: 'May', nickname: 'May'              }, 
        { id: IMG.snow,    name: 'January', nickname: 'Jan'          },
        { id: IMG.forest,  name: 'Tropical climate', nickname: 'Tropical' }
      ]},
      6: { title: 'Island Groups and Major Islands', cards: [
        { id: IMG.mountains2, name: 'Luzon', nickname: 'Luzon'    }, 
        { id: IMG.island,     name: 'Visayas', nickname: 'Visayas'  },
        { id: IMG.island,     name: 'Mindanao', nickname: 'Mindanao' }, 
        { id: IMG.beach,      name: 'Palawan', nickname: 'Palawan'  },
        { id: IMG.island,     name: 'Mindoro', nickname: 'Mindoro'  }, 
        { id: IMG.island,     name: 'Samar', nickname: 'Samar'    },
        { id: IMG.beach,      name: 'Leyte', nickname: 'Leyte'    }, 
        { id: IMG.city,       name: 'Cebu', nickname: 'Cebu'     }
      ]},
      7: { title: 'More Landforms and Bodies of Water', cards: [
        { id: IMG.mountain,   name: 'Mount Pulag', nickname: 'Mt. Pulag'    }, 
        { id: IMG.mountains2, name: 'Mount Pinatubo', nickname: 'Pinatubo' },
        { id: IMG.lake2,      name: 'Taal Volcano', nickname: 'Taal'   }, 
        { id: IMG.river,      name: 'Cagayan River', nickname: 'Cagayan'  },
        { id: IMG.river,      name: 'Agusan River', nickname: 'Agusan'   }, 
        { id: IMG.lake,       name: 'Lake Lanao', nickname: 'Lanao'     },
        { id: IMG.ocean,      name: 'Subic Bay', nickname: 'Subic'      }, 
        { id: IMG.ocean,      name: 'Davao Gulf', nickname: 'Davao'     },
        { id: IMG.ocean,      name: 'Sibuyan Sea', nickname: 'Sibuyan'    }
      ]},
      8: { title: 'Ancient Filipino Society and Life', cards: [
        { id: IMG.face,      name: 'Datu', nickname: 'Datu'       }, 
        { id: IMG.police,    name: 'Maharlika', nickname: 'Maharlika'  },
        { id: IMG.farmer,    name: 'Timawa', nickname: 'Timawa'     }, 
        { id: IMG.tradition, name: 'Babaylan', nickname: 'Babaylan'   },
        { id: IMG.boat,      name: 'Balangay', nickname: 'Balangay'   }, 
        { id: IMG.weaving,   name: 'Baybayin', nickname: 'Baybayin'   },
        { id: IMG.houses,    name: 'Bahay Kubo', nickname: 'Bahay Kubo' }, 
        { id: IMG.farmer,    name: 'Panday', nickname: 'Panday'     }
      ]},
      9: { title: 'Material Culture', cards: [
        { id: IMG.tradition,    name: 'Manunggul Jar', nickname: 'Manunggul'      }, 
        { id: IMG.riceTerraces, name: 'Banaue Rice Terraces', nickname: 'Banaue'},
        { id: IMG.weaving,      name: 'Bulul', nickname: 'Bulul'              }, 
        { id: IMG.phHistory,    name: 'Laguna Copperplate', nickname: 'Copperplate' },
        { id: IMG.costume,      name: 'Golden Tara', nickname: 'Golden Tara'        }, 
        { id: IMG.phHistory,    name: 'Tabon Cave', nickname: 'Tabon'         },
        { id: IMG.phHistory,    name: 'Angono Petroglyphs', nickname: 'Angono' }, 
        { id: IMG.buildings,    name: 'Fort Santiago', nickname: 'Fort Santiago'      },
        { id: IMG.church,       name: 'San Agustin Church', nickname: 'San Agustin' }, 
        { id: IMG.houses,       name: 'Bahay na Bato', nickname: 'Bahay na Bato'      },
        { id: IMG.church,       name: 'Barasoain Church', nickname: 'Barasoain'   }
      ]},
      10: { title: 'Non-Material Culture', cards: [
        { id: IMG.books,         name: 'Hudhud', nickname: 'Hudhud'           }, 
        { id: IMG.books,         name: 'Biag ni Lam-ang', nickname: 'Lam-ang'  },
        { id: IMG.books,         name: 'Alamat', nickname: 'Alamat'           }, 
        { id: IMG.books,         name: 'Bugtong', nickname: 'Bugtong'          },
        { id: IMG.books,         name: 'Salawikain', nickname: 'Salawikain'       }, 
        { id: IMG.motherChild,   name: 'Kundiman', nickname: 'Kundiman'         },
        { id: IMG.culturalDance, name: 'Tinikling', nickname: 'Tinikling'        }, 
        { id: IMG.culturalDance, name: 'Singkil', nickname: 'Singkil'          },
        { id: IMG.culturalDance, name: 'Pandanggo sa Ilaw', nickname: 'Pandanggo'}, 
        { id: IMG.festival,      name: 'Fiesta', nickname: 'Fiesta'           },
        { id: IMG.tradition,     name: 'Pamahiin', nickname: 'Pamahiin'         }, 
        { id: IMG.family,        name: 'Mano po', nickname: 'Mano po'          }
      ]}
    }
  };

  const subjectTopics = TOPIC_DATA[subject] || TOPIC_DATA.computer;
  const topicInfo = subjectTopics[level] || subjectTopics[1];

  // ============================================================
  // IMAGE BUILDER
  // ============================================================
  function getCardLabel(pairIndex) {
    const entry = topicInfo.cards[pairIndex % topicInfo.cards.length];
    return entry ? (entry.nickname || entry.name) : topicInfo.title;
  }
  function makePlaceholderDataUri(label) {
    const safe = String(label).replace(/[<>&"']/g, '');
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
        <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1a3a5c"/>
          <stop offset="100%" stop-color="#0a1428"/>
        </linearGradient></defs>
        <rect width="400" height="500" fill="url(#g)"/>
        <circle cx="200" cy="200" r="70" fill="none"
                stroke="#FFD700" stroke-width="6" stroke-dasharray="10 8"/>
        <text x="200" y="215" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="48" fill="#FFD700">?</text>
        <text x="200" y="340" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="22" font-weight="bold"
              fill="#FFD700">${safe}</text>
      </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  function buildLocalCandidates(pairIndex) {
    const entry  = topicInfo.cards[pairIndex % topicInfo.cards.length];
    const label  = entry.name;
    const folder = SUBJECT_FOLDER[subject] || 'EPP';
    const levelFolders = (LEVEL_FOLDER_VARIANTS[subject] || LEVEL_FOLDER_VARIANTS.computer)(level);
    const mapped = FILE_MAP[subject + ':' + level + ':' + label];
    if (!mapped) return [];
    const candidates = [];
    for (const lvl of levelFolders) {
      for (const ext of IMG_EXTS) {
        candidates.push(`../Assets/topic/${folder}/${lvl}/${mapped}.${ext}`);
      }
    }
    return candidates;
  }
  function attachImageFallback(imgEl, pairIndex) {
    const entry = topicInfo.cards[pairIndex % topicInfo.cards.length];
    const cardName = entry ? entry.name : '';
    let exactUrl = null;
    if (window.assetLoader && typeof window.assetLoader.getCardImage === 'function') {
      exactUrl = window.assetLoader.getCardImage(subject, level, cardName);
    }
    const candidates = buildLocalCandidates(pairIndex);
    if (exactUrl && candidates.indexOf(exactUrl) === -1) {
      candidates.unshift(exactUrl);
    }
    const label = getCardLabel(pairIndex);
    const placeholder = makePlaceholderDataUri(label);

    let stage = 0, stopped = false;
    function advance() {
      if (stopped) return;
      if (stage < candidates.length) { imgEl.src = candidates[stage++]; return; }
      stopped = true;
      imgEl.removeEventListener('error', advance);
      imgEl.src = placeholder;
    }
    imgEl.addEventListener('error', advance);
    advance();
  }

  // ============================================================
  // AUDIO PLAYER (WITH VOLUME BOOST)
  // ============================================================
  const AUDIO_BUDGET_MS  = 3000;
  const AUDIO_PER_TRY_MS = 400;

  let voiceAudioCtx = null;
  function getVoiceCtx() {
    if (!voiceAudioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) voiceAudioCtx = new Ctx();
    }
    return voiceAudioCtx;
  }

  function buildAudioCandidates(pairIndex) {
    const entry = topicInfo.cards[pairIndex % topicInfo.cards.length];
    if (!entry) return [];

    const out = [];
    const cardName = entry.name;

    // 1. Exact verified URL from assetLoader (100% verified on disk)
    if (window.assetLoader && typeof window.assetLoader.getCardAudioUrl === 'function') {
      const exact = window.assetLoader.getCardAudioUrl(subject, level, cardName);
      if (exact && out.indexOf(exact) === -1) out.push(exact);
    }

    // 2. Fallbacks from AUDIO_MAP
    const folder = AUDIO_SUBJECT_FOLDER[subject] || 'epp';
    const mapped = AUDIO_MAP[subject + ':' + level + ':' + cardName] || '';

    const names = [];
    if (mapped && names.indexOf(mapped) === -1) names.push(mapped);
    if (cardName && names.indexOf(cardName) === -1) names.push(cardName);

    const levelFolder = String(level);
    const exts = ['m4a', 'mp3', 'wav', 'ogg'];

    for (const name of names) {
      for (const ext of exts) {
        const u1 = `../Assets/sound/${folder}/${levelFolder}/${encodeURIComponent(name)}.${ext}`;
        if (out.indexOf(u1) === -1) out.push(u1);
        const u2 = `../Assets/sound/${folder}/${levelFolder}/${name}.${ext}`;
        if (out.indexOf(u2) === -1) out.push(u2);
      }
    }
    return out;
  }

  function playAudioWithBudget(candidates, budgetMs) {
    return new Promise((resolve) => {
      const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
      if (!soundEnabled || !candidates || !candidates.length) {
        resolve(null);
        return;
      }

      let resolved = false;
      let idx = 0;
      const startTime = Date.now();
      const maxBudget = budgetMs || 2500;

      const budgetTimer = setTimeout(function () {
        if (resolved) return;
        resolved = true;
        resolve(null);
      }, maxBudget);

      function finish(audio) {
        if (resolved) return;
        resolved = true;
        clearTimeout(budgetTimer);
        resolve(audio);
      }

      function tryNext() {
        if (resolved) return;
        if (idx >= candidates.length || (Date.now() - startTime > maxBudget - 100)) {
          finish(null);
          return;
        }

        const src = candidates[idx++];
        const audio = new Audio();
        audio.preload = 'auto';

        let settled = false;
        const perTry = setTimeout(function () {
          if (settled) return;
          settled = true;
          try { audio.src = ''; } catch (e) {}
          tryNext();
        }, 500);

        function onReadyToPlay() {
          if (settled) return;
          settled = true;
          clearTimeout(perTry);

          audio.volume = 1.0;
          const p = audio.play();
          if (p && typeof p.then === 'function') {
            p.then(function () {
              finish(audio);
            }).catch(function (err) {
              console.log('[Audio] Play blocked/failed, trying next:', err && err.message);
              tryNext();
            });
          } else {
            finish(audio);
          }
        }

        audio.addEventListener('canplaythrough', onReadyToPlay, { once: true });
        audio.addEventListener('loadeddata', onReadyToPlay, { once: true });
        audio.addEventListener('error', function () {
          if (settled) return;
          settled = true;
          clearTimeout(perTry);
          tryNext();
        }, { once: true });

        audio.src = src;
        try { audio.load(); } catch (e) { tryNext(); }
      }

      tryNext();
    });
  }

  // ============================================================
  // CHARACTER DIALOG — JOJOMA
  // ============================================================
  const characterDialog = document.getElementById('characterDialog');
  const characterTitle  = document.getElementById('characterTitle');
  const characterText   = document.getElementById('characterText');

  let currentAudio  = null;
  let typingTimer   = null;
  let skipRequested = false;
  let dialogActive  = false;
  let dialogOnDone  = null;

  function showCharacterDialog(title) {
    if (!characterDialog) return;
    if (characterTitle) characterTitle.textContent = title || '';
    characterDialog.classList.add('show', 'skippable');
    dialogActive  = true;
    skipRequested = false;
  }

  function hideCharacterDialog() {
    if (!characterDialog) return;
    characterDialog.classList.remove('show', 'skippable');
    dialogActive = false;
  }

  function typeText(text, onDone) {
    if (!characterText) { if (onDone) onDone(); return; }
    if (typingTimer) { clearInterval(typingTimer); typingTimer = null; }
    characterText.textContent = '';
    characterText.classList.add('typing');
    let i = 0;
    const speed = 20;
    typingTimer = setInterval(function () {
      if (skipRequested) {
        characterText.textContent = text;
        clearInterval(typingTimer); typingTimer = null;
        characterText.classList.remove('typing');
        if (onDone) onDone();
        return;
      }
      if (i < text.length) {
        characterText.textContent += text.charAt(i++);
      } else {
        clearInterval(typingTimer); typingTimer = null;
        characterText.classList.remove('typing');
        if (onDone) onDone();
      }
    }, speed);
  }

  function speakCard(pairIndex, onDone) {
    dialogOnDone = onDone || null;

    const title      = getCardLabel(pairIndex);
    const desc       = getCardDescription(pairIndex);
    const candidates = buildAudioCandidates(pairIndex);

    showCharacterDialog(title);

    if (window.MMBgMusic) window.MMBgMusic.pause();

    let typingDone   = false;
    let audioDone    = false;
    let finishCalled = false;

    function finishDialog() {
      if (finishCalled) return;
      finishCalled = true;

      hideCharacterDialog();

      if (currentAudio) {
        try { currentAudio.pause(); } catch (e) {}
        currentAudio = null;
      }

      if (window.MMBgMusic) window.MMBgMusic.play();

      const cb = dialogOnDone;
      dialogOnDone = null;
      if (typeof cb === 'function') cb();
    }

    function checkBothDone() {
      if (typingDone && audioDone && !finishCalled) {
        setTimeout(finishDialog, 350);
      }
    }

    // Safety timeout: NEVER freeze the game! Max 3.6s total!
    const safetyTimer = setTimeout(function () {
      if (!finishCalled) finishDialog();
    }, 3800);

    // Allow user to click anywhere on dialog to skip immediately
    if (characterDialog) {
      const skipHandler = function () {
        clearTimeout(safetyTimer);
        characterDialog.removeEventListener('click', skipHandler);
        finishDialog();
      };
      characterDialog.addEventListener('click', skipHandler, { once: true });
    }

    typeText(desc, function () {
      typingDone = true;
      checkBothDone();
    });

    playAudioWithBudget(candidates, 2500).then(function (audio) {
      if (!audio) {
        audioDone = true;
        checkBothDone();
        return;
      }
      currentAudio = audio;

      const maxAudioDuration = setTimeout(function () {
        if (!audioDone) {
          audioDone = true;
          checkBothDone();
        }
      }, 4000);

      audio.addEventListener('ended', function () {
        clearTimeout(maxAudioDuration);
        if (!audioDone) {
          audioDone = true;
          checkBothDone();
        }
      }, { once: true });
    }).catch(function () {
      audioDone = true;
      checkBothDone();
    });
  }

  // SAFETY CHECKS
  // ============================================================
  let unlockedLevels = pJSON('unlocked_' + subject, [1]);
  if (!Array.isArray(unlockedLevels) || !unlockedLevels.length) unlockedLevels = [1];
  if (unlockedLevels.indexOf(level) === -1) {
    alert('This level is locked! Complete previous levels or unlock it with points.');
    window.location.href = `../Level.html?subject=${subject}`;
    return;
  }
  if (level > 1) {
    let completedLevels = pJSON('completed_' + subject, []);
    if (!Array.isArray(completedLevels)) completedLevels = [];
    if (completedLevels.indexOf(level - 1) === -1) {
      alert(`Finish Level ${level - 1} first before playing Level ${level}!`);
      window.location.href = `../Level.html?subject=${subject}`;
      return;
    }
  }

  // ============================================================
  // SPECIAL CARDS DEFINITION & PAIRS (LEVEL 6+)
  // ============================================================
  const SPECIAL_CARDS = {
    '-1': { type: 'bomb',    emoji: '💣', icon: 'fa-bomb',      label: 'Bomb',       class: 'special-bomb'    },
    '-2': { type: 'key',     emoji: '🔑', icon: 'fa-key',       label: 'Key',        class: 'special-key'     },
    '-3': { type: 'lock',    emoji: '🔒', icon: 'fa-lock',      label: 'Lock',       class: 'special-lock'    },
    '-4': { type: 'freeze',  emoji: '❄️', icon: 'fa-snowflake', label: 'Freeze',     class: 'special-freeze'  },
    '-5': { type: 'shuffle', emoji: '🔄', icon: 'fa-shuffle',   label: 'Shuffle',    class: 'special-shuffle' },
    '-6': { type: 'gem',     emoji: '💎', icon: 'fa-gem',       label: 'Multiplier', class: 'special-gem'     }
  };

  const SPECIAL_PAIRS = [
    [-1, -1], [-2, -3], [-4, -4], [-5, -5], [-6, -6]
  ];

  function isSpecialMatch(pairA, pairB) {
    if (pairA >= 0 || pairB >= 0) return false;
    if (pairA === -1 && pairB === -1) return true;
    if ((pairA === -2 && pairB === -3) || (pairA === -3 && pairB === -2)) return true;
    if (pairA === -4 && pairB === -4) return true;
    if (pairA === -5 && pairB === -5) return true;
    if (pairA === -6 && pairB === -6) return true;
    return false;
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // ============================================================
  // DECK GENERATION
  // ============================================================
  function buildDeck() {
    if (level <= 5) {
      const cardCount = 4 + (level - 1) * 2;
      const numPairs = cardCount / 2;
      const d = [];
      for (let i = 0; i < numPairs; i++) {
        d.push(i);
        d.push(i);
      }
      return shuffle(d);
    } else {
      const numSpecialPairs = (level >= 8) ? 3 : 2;
      const normalPairsCount = 6 - numSpecialPairs;
      const d = [];

      const topicCardTotal = (topicInfo && topicInfo.cards) ? topicInfo.cards.length : 6;
      const availableIndices = [];
      for (let i = 0; i < topicCardTotal; i++) availableIndices.push(i);
      const shuffledIndices = shuffle(availableIndices).slice(0, normalPairsCount);
      shuffledIndices.forEach(p => {
        d.push(p);
        d.push(p);
      });

      const chosenSpecials = [];
      if (level === 6 && pGet('specialTutorialSeen', null) !== '1') {
        chosenSpecials.push([-1, -1]);
        chosenSpecials.push([-2, -3]);
      } else {
        const pool = shuffle([...SPECIAL_PAIRS]);
        for (let s = 0; s < numSpecialPairs; s++) {
          chosenSpecials.push(pool[s % pool.length]);
        }
      }

      chosenSpecials.forEach(sp => {
        d.push(sp[0]);
        d.push(sp[1]);
      });

      return shuffle(d);
    }
  }

  let deck = buildDeck();
  let totalCards = deck.length;
  let pairs      = totalCards / 2;

  // ============================================================
  // CARD MATH + STAR BAR
  // ============================================================
  const STAR_THRESHOLDS = [5, 30, 52];
  const BAR_START = 100;
  const BAR_PENALTY_WRONG = 4;
  const BAR_PENALTY_TIME  = 0.2;
  let barPercent = BAR_START;

  function getStarCountFromBar(pct) {
    let count = 0;
    for (let i = 0; i < STAR_THRESHOLDS.length; i++) {
      if (pct >= STAR_THRESHOLDS[i]) count = i + 1;
    }
    return Math.max(1, count);
  }
  function calculateStars() { return getStarCountFromBar(barPercent); }
  function getPointsForStars(basePoints, starsEarned) {
    return Math.round(basePoints + (starsEarned - 1) * (basePoints * 0.5));
  }

  const POINTS_BASE      = 10;
  const POINTS_PER_LEVEL = level * 5;
  const basePoints       = POINTS_BASE + POINTS_PER_LEVEL;

  const GAME_DURATION = 120;
  let secondsLeft = GAME_DURATION;
  let isTimerFrozen = false;
  let freezeTimeout = null;

  function formatTime(secs) {
    secs = Math.max(0, Math.floor(secs));
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  // ============================================================
  // COMBO SYSTEM
  // ============================================================
  let comboCount  = 0;
  let bonusPoints = 0;

  function showComboToast(message) {
    const existing = document.querySelector('.combo-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'combo-toast';
    toast.innerHTML = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 400);
    }, 2200);
  }

  function showFloatingTimeBonus(seconds) {
    const anchor = document.getElementById('timerDisplay');
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();

    const el = document.createElement('div');
    el.className = 'floating-time-bonus';
    el.textContent = '+' + seconds + 's';
    el.style.left = (rect.left + rect.width / 2) + 'px';
    el.style.top  = (rect.top + rect.height / 2) + 'px';
    document.body.appendChild(el);

    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1400);
  }
  // ============================================================
  // GRID LAYOUT
  // ============================================================
  function getGridCols(count) {
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    if (count <= 8) return 4;
    if (count <= 10) return 5;
    if (count <= 12) return 4;
    if (count <= 16) return 4;
    if (count <= 18) return 6;
    if (count <= 20) return 5;
    return 4;
  }

  function applyNoScrollLayout() {
    const board = document.querySelector('.gameplay-board');
    if (!board) return;
    board.style.height = 'auto';
    board.style.maxHeight = 'none';
  }
  window.addEventListener('resize', applyNoScrollLayout);

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

  let flippedCards  = [];
  let matchedPairs  = 0;
  let moves         = 0;
  let isLocked      = false;
  let timerInterval = null;
  let gameStarted   = false;
  let gameFinished  = false;

  if (levelDisplay) levelDisplay.textContent = level;

  (function renderTopicTitle() {
    const subheader = document.querySelector('.gameplay-subheader');
    const subjectTitleEl = document.querySelector('.gameplay-subject-title');
    if (!subheader || !subjectTitleEl) return;
    subjectTitleEl.textContent = subjectInfo.name;
    const existing = subheader.querySelector('.gameplay-topic-title');
    if (existing) existing.remove();
    const topicEl = document.createElement('p');
    topicEl.className = 'gameplay-topic-title';
    topicEl.textContent = 'Level ' + level + ': ' + topicInfo.title;
    subjectTitleEl.insertAdjacentElement('afterend', topicEl);
  })();

  function wasLevelCompletedBefore() {
    const arr = pJSON('completed_' + subject, []);
    return Array.isArray(arr) && arr.indexOf(level) !== -1;
  }
  function isNextLevelUnlocked() {
    const arr = pJSON('unlocked_' + subject, [1]);
    return Array.isArray(arr) && arr.indexOf(level + 1) !== -1;
  }

  function renderCardFront(front, pairIndex) {
    front.innerHTML = '';
    if (pairIndex < 0) {
      const spec = SPECIAL_CARDS[String(pairIndex)] || {
        type: 'special', emoji: '⭐', icon: 'fa-star', label: 'Special', class: 'special-gem'
      };
      front.className = 'card-face card-face-front card-special-face ' + spec.class;

      const iconWrap = document.createElement('div');
      iconWrap.className = 'special-card-icon-wrap';

      const iconEl = document.createElement('i');
      iconEl.className = 'fas ' + spec.icon + ' special-card-fa';
      iconWrap.appendChild(iconEl);

      const emojiEl = document.createElement('span');
      emojiEl.className = 'special-card-emoji';
      emojiEl.textContent = spec.emoji;
      iconWrap.appendChild(emojiEl);

      const labelEl = document.createElement('span');
      labelEl.className = 'special-card-label';
      labelEl.textContent = spec.label;

      front.appendChild(iconWrap);
      front.appendChild(labelEl);
    } else {
      front.className = 'card-face card-face-front';
      const entry = topicInfo.cards[pairIndex % topicInfo.cards.length];
      
      const img = document.createElement('img');
      img.className = 'card-image';
      const cardName = getCardLabel(pairIndex);
      img.alt = topicInfo.title + ' — ' + cardName;
      img.loading = 'eager';
      img.draggable = false;
      attachImageFallback(img, pairIndex);
      front.appendChild(img);

      // Add the Nickname Label to the bottom of the image
      const nameLabel = document.createElement('div');
      nameLabel.className = 'card-name-label';
      nameLabel.textContent = entry.nickname || entry.name;
      front.appendChild(nameLabel);
    }
  }

  function renderCards() {
    if (!grid) return;
    grid.innerHTML = '';

    const cols = getGridCols(deck.length);
    grid.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(0, 1fr))';
    grid.style.gridTemplateRows = '';
    grid.classList.toggle('grid-5col', cols === 5);

    if (cols === 2)      grid.style.maxWidth = '380px';
    else if (cols === 3) grid.style.maxWidth = '570px';
    else if (cols === 4) grid.style.maxWidth = '760px';
    else if (cols === 5) grid.style.maxWidth = '1000px';
    else                 grid.style.maxWidth = '760px';

    deck.forEach((pairIndex, index) => {
      const div = document.createElement('div');
      div.className = 'card-item';
      if (pairIndex < 0) div.classList.add('card-special');
      div.dataset.index = index;
      div.dataset.pair  = pairIndex;

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
      subjectLabel.textContent = subjectInfo.shortName; // Short name here!
      badge.appendChild(subjectLabel);
      back.appendChild(badge);
      inner.appendChild(back);

      const front = document.createElement('div');
      renderCardFront(front, pairIndex);
      inner.appendChild(front);

      div.appendChild(inner);
      div.addEventListener('click', () => onCardClick(index));
      grid.appendChild(div);
    });

    applyNoScrollLayout();
  }

  function updateStarProgress() {
    if (!starProgressFill) return;
    if (barPercent > 100) barPercent = 100;
    if (barPercent < 0)   barPercent = 0;
    starProgressFill.style.width = barPercent + '%';
    const starsEarned = getStarCountFromBar(barPercent);
    starProgressStars.forEach((star, i) => {
      star.classList.toggle('filled', i < starsEarned);
    });
  }

  function startTimer() {
    if (timerInterval || gameFinished) return;
    timerInterval = setInterval(() => {
      if (dialogActive || isTimerFrozen) return;
      secondsLeft--;
      if (timerDisplay) timerDisplay.textContent = formatTime(secondsLeft);
      barPercent = Math.max(0, barPercent - BAR_PENALTY_TIME);
      updateStarProgress();
      if (secondsLeft <= 0) { stopTimer(); loseGame(); }
    }, 1000);
  }
  function stopTimer() { clearInterval(timerInterval); timerInterval = null; }
  function resetTimer() {
    stopTimer();
    secondsLeft = GAME_DURATION;
    if (timerDisplay) {
      timerDisplay.textContent = formatTime(secondsLeft);
      timerDisplay.classList.remove('timer-frozen', 'timer-bonus');
    }
    isTimerFrozen = false;
    if (freezeTimeout) { clearTimeout(freezeTimeout); freezeTimeout = null; }
    gameStarted  = false;
    gameFinished = false;
  }

  function onCardClick(index) {
    if (isLocked || gameFinished) return;
    const el = grid.children[index];
    if (!el) return;
    if (el.classList.contains('flipped') || el.classList.contains('matched')) return;
    if (!gameStarted) { gameStarted = true; startTimer(); }
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
    const isPairNormal  = (first.pair === second.pair && first.pair >= 0);
    const isPairSpecial = isSpecialMatch(first.pair, second.pair);

    if (isPairNormal || isPairSpecial) {
      first.el.classList.add('matched');
      second.el.classList.add('matched');
      matchedPairs++;
      flippedCards = [];

      comboCount++;
      if (comboCount >= 3 && comboCount % 3 === 0) {
        secondsLeft += 15;
        if (timerDisplay) {
          timerDisplay.textContent = formatTime(secondsLeft);
          timerDisplay.classList.add('timer-bonus');
          setTimeout(() => timerDisplay.classList.remove('timer-bonus'), 800);
        }
        showComboToast('🔥 ' + comboCount + ' Combo! +15s Time Bonus!');
        
      }

      if (isPairSpecial) {
        handleSpecialMatch(first.pair, second.pair);
      } else {
        const pairIndex = first.pair;
        const isLast    = (matchedPairs === pairs);

        if (isTimerFrozen) {
          isLocked = false;
          if (isLast) {
            stopTimer();
            setTimeout(showWin, 300);
          }
        } else {
          speakCard(pairIndex, function () {
            isLocked = false;
            if (isLast) {
              stopTimer();
              setTimeout(showWin, 300);
            }
          });
        }
      }
    } else {
      comboCount = 0;
      if (window.MMSfx && MMSfx.wrong) MMSfx.wrong();
      barPercent = Math.max(0, barPercent - BAR_PENALTY_WRONG);
      updateStarProgress();
      setTimeout(() => {
        first.el.classList.remove('flipped');
        second.el.classList.remove('flipped');
        flippedCards = [];
        isLocked = false;
      }, 800);
    }
  }

  function handleSpecialMatch(pairA, pairB) {
    if (window.MMSfx && MMSfx.click) MMSfx.click();

    if (pairA === -1 && pairB === -1) {
      showComboToast('💣 Bomb! Auto-destroyed a random pair!');
      destroyRandomPair(); 
      return;
    }

    if ((pairA === -2 && pairB === -3) || (pairA === -3 && pairB === -2)) {
      showComboToast('🔑 Key & Lock! Board revealed for 2s!');
      revealBoardFor2Seconds(); 
      return;
    }

    if (pairA === -4 && pairB === -4) {
      showComboToast('❄️ Time Freeze! Timer paused for 5s!');
      triggerTimeFreeze();
      finishSpecialTurn();
      return;
    }

    if (pairA === -5 && pairB === -5) {
      showComboToast('🔄 Shuffle! Unmatched cards rearranged!');
      shuffleRemainingCards(); 
      return;
    }

    if (pairA === -6 && pairB === -6) {
      bonusPoints += 100;
      showComboToast('💎 Multiplier! +100 Flat Points!');
      
      finishSpecialTurn();
      return;
    }

    finishSpecialTurn();
  }

  function finishSpecialTurn() {
    isLocked = false;
    if (matchedPairs >= pairs) {
      stopTimer();
      setTimeout(showWin, 400);
    }
  }

  function destroyRandomPair() {
    const unmatchedElements = Array.from(grid.children).filter(el => !el.classList.contains('matched'));
    const pairMap = {};
    unmatchedElements.forEach(el => {
      const p = parseInt(el.dataset.pair, 10);
      if (!pairMap[p]) pairMap[p] = [];
      pairMap[p].push(el);
    });

    const validPairs = Object.keys(pairMap).filter(p => {
      const pairId = parseInt(p, 10);
      if (pairId === -2 || pairId === -3) {
        return (pairMap['-2'] && pairMap['-2'].length > 0 && pairMap['-3'] && pairMap['-3'].length > 0);
      }
      return pairMap[p].length === 2;
    });

    if (validPairs.length > 0) {
      const chosenP = validPairs[Math.floor(Math.random() * validPairs.length)];
      let cardsToMatch = [];
      if (chosenP === '-2' || chosenP === '-3') {
        cardsToMatch = [pairMap['-2'][0], pairMap['-3'][0]];
      } else {
        cardsToMatch = pairMap[chosenP];
      }

      cardsToMatch.forEach(card => {
        card.classList.add('flipped', 'matched', 'bomb-destroyed');
      });
      matchedPairs++;
    }

    finishSpecialTurn();
  }

  function revealBoardFor2Seconds() {
    const unmatchedElements = Array.from(grid.children).filter(el => !el.classList.contains('matched'));
    unmatchedElements.forEach(el => el.classList.add('flipped'));

    setTimeout(() => {
      unmatchedElements.forEach(el => {
        if (!el.classList.contains('matched')) el.classList.remove('flipped');
      });
      finishSpecialTurn();
    }, 2000);
  }

  function triggerTimeFreeze() {
    isTimerFrozen = true;
    if (timerDisplay) timerDisplay.classList.add('timer-frozen');
    if (freezeTimeout) clearTimeout(freezeTimeout);

    freezeTimeout = setTimeout(() => {
      isTimerFrozen = false;
      if (timerDisplay) timerDisplay.classList.remove('timer-frozen');
      hideAudioLoader();
    }, 5000);
  }

  function shuffleRemainingCards() {
    const unmatchedElements = Array.from(grid.children).filter(el => !el.classList.contains('matched'));
    if (unmatchedElements.length <= 1) {
      finishSpecialTurn();
      return;
    }

    const currentPairs = unmatchedElements.map(el => parseInt(el.dataset.pair, 10));
    const shuffledPairs = shuffle([...currentPairs]);

    unmatchedElements.forEach((el, idx) => {
      const newP = shuffledPairs[idx];
      el.dataset.pair = newP;
      const index = parseInt(el.dataset.index, 10);
      deck[index] = newP;
      el.classList.remove('flipped');

      if (newP < 0) el.classList.add('card-special');
      else el.classList.remove('card-special');

      const front = el.querySelector('.card-face-front');
      if (front) renderCardFront(front, newP);

      el.classList.add('card-shuffling');
      setTimeout(() => el.classList.remove('card-shuffling'), 500);
    });

    finishSpecialTurn();
  }

  function loseGame() {
    if (gameFinished) return;
    gameFinished = true;
    isLocked = true;
    if (window.MMSfx && MMSfx.gameover) MMSfx.gameover();
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

  function showWin() {
    if (gameFinished) return;
    gameFinished = true;

    if (window.MMBgMusic) window.MMBgMusic.pause();

    if (window.MMSfx && window.MMSfx.win) {
      window.MMSfx.win();
    } else {
      try {
        const winSound = new Audio('../Assets/sound/mm win.mp3');
        winSound.volume = 1.0;
        winSound.play().catch(function(e) {
          console.log('Win sound play failed:', e);
        });
      } catch (e) {
        console.log('Win sound error:', e);
      }
    }

    const elapsed = GAME_DURATION - secondsLeft;
    if (winMoves) winMoves.textContent = moves;
    if (winTime)  winTime.textContent  = formatTime(elapsed);
    const wasCompletedBefore = wasLevelCompletedBefore();
    const starsEarned  = calculateStars();
    const pointsEarned = getPointsForStars(basePoints, starsEarned) + bonusPoints;

    try {
      sessionStorage.setItem('mm_preWin', JSON.stringify({
        subject: subject, level: level,
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
        const cur = parseInt(pGet('pointsTotal', '0'), 10) || 0;
        pSet('pointsTotal', String(cur + pointsEarned));
      }
    } else if (bonusPoints > 0) {
      if (typeof window.addPoints === 'function') {
        window.addPoints(bonusPoints);
      } else {
        const cur = parseInt(pGet('pointsTotal', '0'), 10) || 0;
        pSet('pointsTotal', String(cur + bonusPoints));
      }
    }
    if (winCoinsEarned) {
      winCoinsEarned.textContent = wasCompletedBefore ? (bonusPoints > 0 ? '+' + bonusPoints : '+0') : '+' + pointsEarned;
    }

    if (!winStarsRow) {
      const container = winOverlay ? winOverlay.querySelector('.win-box') : null;
      if (container) {
        const pTag = container.querySelector('p');
        const starRow = document.createElement('div');
        starRow.id = 'winStarRating';
        starRow.className = 'win-star-rating';
        starRow.innerHTML = '<i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>';
        if (pTag && pTag.parentNode) pTag.parentNode.insertBefore(starRow, pTag.nextSibling);
        else container.insertBefore(starRow, container.firstChild);
        winStarsRow = starRow;
      }
    }
    if (winStarsRow) {
      const icons = winStarsRow.querySelectorAll('i');
      icons.forEach((icon, i) => { icon.classList.toggle('filled', i < starsEarned); });
    }
    if (winStarsEarned) {
      const total = (typeof window.getStarsTotal === 'function')
        ? window.getStarsTotal()
        : parseInt(pGet('starsTotal', '0'), 10) || 0;
      winStarsEarned.textContent = total;
    }

    if (winOverlay) winOverlay.classList.add('show');
    celebrateWin();
    if (typeof window.completeLevel === 'function') window.completeLevel(subject, level);
    if (level === 1) { try { pSet('tutorialSeen', '1'); } catch (e) {} }
    if (window.MMLeaderboard && window.MMPlayer) {
      const nickname = MMPlayer.getNickname();
      if (nickname) {
        MMLeaderboard.recordWin({
          nickname: nickname, subject: subject, level: level,
          stars: starsEarned, time: elapsed,
          pointsEarned: wasCompletedBefore ? bonusPoints : pointsEarned
        });
        MMLeaderboard.prune();
      }
    }
    if (typeof window.updatePlayerLevelBox === 'function') window.updatePlayerLevelBox();

    const nextLevel = level + 1;
    if (nextLevelBtn) {
      if (nextLevel <= 10) {
        const nextUnlocked = isNextLevelUnlocked();
        if (nextUnlocked) {
          nextLevelBtn.innerHTML = 'Next Level <i class="fas fa-arrow-right ms-2"></i>';
          nextLevelBtn.onclick = function () {
            window.location.href = 'Gameplay-' + subject + '.html?level=' + nextLevel + '&subject=' + subject;
          };
        } else {
          nextLevelBtn.innerHTML = '<i class="fas fa-unlock me-2"></i> Unlock Next Level';
          nextLevelBtn.onclick = function () {
            if (typeof window.tryUnlockLevel !== 'function') {
              window.location.href = '../Level.html?subject=' + subject;
              return;
            }
            const result = window.tryUnlockLevel(subject, nextLevel);
            if (result.ok) {
              if (!result.alreadyUnlocked) {
                try { sessionStorage.setItem('mm_just_unlocked', JSON.stringify({ subject: subject, level: nextLevel })); } catch (e) {}
              }
              window.location.href = '../Level.html?subject=' + subject;
            } else if (result.reason === 'not_enough_points') {
              alert('⭐ Not enough points!\r\n\r\nLevel ' + nextLevel + ' costs ' + result.cost + ' points.\r\nYou have ' + result.points + ' points.\r\n\r\nPlay more levels to earn points!');
            } else if (result.reason === 'previous_not_completed') {
              alert('Finish Level ' + (nextLevel - 1) + ' first!');
            } else if (result.reason === 'previous_locked') {
              alert('Complete the previous level first!');
            } else if (result.reason === 'save_failed') {
              alert('Could not save your progress. Please try again.');
            }
          };
        }
        nextLevelBtn.style.display = 'inline-block';
      } else {
        nextLevelBtn.innerHTML = '<i class="fas fa-trophy me-2"></i> All Done';
        nextLevelBtn.onclick = function () { window.location.href = '../Level.html?subject=' + subject; };
      }
    }

    const stats = {
      gamesPlayed:  parseInt(pGet('gamesPlayed',  '0'), 10) || 0,
      bestTime:     pGet('bestTime', null),
      totalMatches: parseInt(pGet('totalMatches', '0'), 10) || 0,
      rewards:      parseInt(pGet('rewardsCount', '0'), 10) || 0
    };
    stats.gamesPlayed += 1;
    if (stats.bestTime === null || elapsed < Number(stats.bestTime)) stats.bestTime = elapsed;
    stats.totalMatches += pairs;
    stats.rewards += 1;
    pSet('gamesPlayed',  String(stats.gamesPlayed));
    pSet('bestTime',     String(stats.bestTime));
    pSet('totalMatches', String(stats.totalMatches));
    pSet('rewardsCount', String(stats.rewards));
  }

  function goToLevels() { window.location.href = '../Level.html?subject=' + subject; }

  const btnLevels = document.getElementById('btnLevels');
  if (btnLevels) btnLevels.addEventListener('click', goToLevels);

  const btnLoseRetry  = document.getElementById('btnLoseRetry');
  const btnLoseLevels = document.getElementById('btnLoseLevels');
  if (btnLoseRetry)  btnLoseRetry.addEventListener('click', function () { window.location.reload(); });
  if (btnLoseLevels) btnLoseLevels.addEventListener('click', goToLevels);

  function restartLevel() {
    try {
      const completed = pJSON('completed_' + subject, []);
      const filtered = Array.isArray(completed) ? completed.filter(function (l) { return l !== level; }) : [];
      pSetJSON('completed_' + subject, filtered);
    } catch (e) {}
    try {
      const starsMap = pJSON('stars_' + subject, {});
      if (starsMap && typeof starsMap === 'object') delete starsMap[level];
      pSetJSON('stars_' + subject, starsMap || {});
    } catch (e) {}
    try {
      const snap = JSON.parse(sessionStorage.getItem('mm_preWin') || 'null');
      if (snap && snap.subject === subject && snap.level === level) {
        if (snap.pointsAwarded && snap.pointsEarned > 0) {
          const cur = parseInt(pGet('pointsTotal', '0'), 10) || 0;
          const rolled = Math.max(0, cur - snap.pointsEarned);
          pSet('pointsTotal', String(rolled));
        }
      }
      sessionStorage.removeItem('mm_preWin');
    } catch (e) {}
    if (typeof window.updatePlayerLevelBox === 'function') window.updatePlayerLevelBox();
    window.location.reload();
  }
  const btnRestartLevel = document.getElementById('btnRestartLevel');
  if (btnRestartLevel) btnRestartLevel.addEventListener('click', restartLevel);

  let wasRunningBeforePause = false;
  function openPause() {
    if (gameFinished) return;
    if (pauseOverlay && pauseOverlay.classList.contains('show')) return;
    wasRunningBeforePause = timerInterval !== null;
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    if (pauseOverlay) pauseOverlay.classList.add('show');
  }
  function closePause() {
    if (pauseOverlay) pauseOverlay.classList.remove('show');
    if (wasRunningBeforePause && !gameFinished && timerInterval === null && !isTimerFrozen) startTimer();
    wasRunningBeforePause = false;
  }
  if (btnPause)       btnPause.addEventListener('click', openPause);
  if (btnPauseResume) btnPauseResume.addEventListener('click', closePause);
  if (btnPauseLevels) btnPauseLevels.addEventListener('click', goToLevels);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (document.querySelector('.tutorial-spotlight') || document.querySelector('.l6-tutorial-spotlight')) return;
      if (document.querySelector('.quiz-overlay')) return;
      if (pauseOverlay && pauseOverlay.classList.contains('show')) { closePause(); return; }
      if (winOverlay && winOverlay.classList.contains('show'))      { winOverlay.classList.remove('show'); return; }
      if (loseOverlay && loseOverlay.classList.contains('show'))    { loseOverlay.classList.remove('show'); return; }
      if (!gameFinished) { openPause(); return; }
      goToLevels();
    }
  });

  // ============================================================
  // PRE-LEVEL QUIZ — appears for every level EXCEPT level 1
  // ============================================================
  function buildQuizQuestion(prevLevel) {
    const prevTopic = subjectTopics[prevLevel];
    if (!prevTopic || !prevTopic.cards || !prevTopic.cards.length) return null;

    const correctCard = prevTopic.cards[Math.floor(Math.random() * prevTopic.cards.length)];
    const correctAnswer = correctCard.name;

    const otherNames = [];
    Object.keys(subjectTopics).forEach(function (key) {
      if (parseInt(key, 10) === prevLevel) return;
      subjectTopics[key].cards.forEach(function (c) {
        if (c.name !== correctAnswer && otherNames.indexOf(c.name) === -1) {
          otherNames.push(c.name);
        }
      });
    });

    const distractors = shuffle([...otherNames]).slice(0, 3);
    if (distractors.length < 3) return null;
    const options = shuffle([correctAnswer, ...distractors]);

    return {
      question: 'From Level ' + prevLevel + ' (' + prevTopic.title + '), which of these did we learn?',
      options: options,
      correct: correctAnswer,
      prevLevel: prevLevel
    };
  }

  function showPreLevelQuiz(onComplete) {
    if (level <= 1) { if (onComplete) onComplete(); return false; }

    const quiz = buildQuizQuestion(level - 1);
    if (!quiz) { if (onComplete) onComplete(); return false; }

    stopTimer();
    isLocked = true;

    const overlay = document.createElement('div');
    overlay.className = 'quiz-overlay';
    overlay.innerHTML =
      '<div class="quiz-box">' +
        '<div class="quiz-character">' +
          '<img src="../Assets/character_moving.png" alt="Jojoma" draggable="false" />' +
          '<div class="quiz-character-name">Jojoma</div>' +
        '</div>' +
        '<div class="quiz-content">' +
          '<div class="quiz-badge">Quick Review!</div>' +
          '<p class="quiz-question"></p>' +
          '<div class="quiz-options"></div>' +
          '<div class="quiz-feedback"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.querySelector('.quiz-question').textContent = quiz.question;
    const optionsContainer = overlay.querySelector('.quiz-options');
    const feedbackEl = overlay.querySelector('.quiz-feedback');
    let answered = false;

    function finishQuiz() {
      overlay.classList.add('fade-out');
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        isLocked = false;
        gameStarted = false;
        if (onComplete) onComplete();
      }, 300);
    }

    quiz.options.forEach(function (opt) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-option';
      btn.textContent = opt;
      btn.addEventListener('click', function () {
        if (answered) return;
        answered = true;

        const isCorrect = opt === quiz.correct;
        optionsContainer.querySelectorAll('.quiz-option').forEach(function (b) {
          b.disabled = true;
          if (b.textContent === quiz.correct) b.classList.add('correct');
          if (b === btn && !isCorrect) b.classList.add('wrong');
        });

        if (isCorrect) {
pendingQuizBonus = 10;
          if (timerDisplay) {
            timerDisplay.textContent = formatTime(secondsLeft + pendingQuizBonus);
            timerDisplay.classList.add('timer-bonus');
            setTimeout(() => timerDisplay.classList.remove('timer-bonus'), 800);
          }
          feedbackEl.textContent = 'Correct! +10s Time Bonus!';
          feedbackEl.className = 'quiz-feedback success';
          if (window.MMSfx && MMSfx.click) MMSfx.click();
        } else {
          feedbackEl.textContent = '❌ Not quite — the answer is: ' + quiz.correct;
          feedbackEl.className = 'quiz-feedback error';
          if (window.MMSfx && window.MMSfx.wrong) window.MMSfx.wrong();
        }

        setTimeout(finishQuiz, isCorrect ? 1200 : 2200);
      });
      optionsContainer.appendChild(btn);
    });

    return true;
  }

  // ============================================================
  // FIRST-TIME TUTORIAL — Level 1 only, shown once per player
  // ============================================================
  function initTutorial() {
    if (level !== 1) return;
    if (pGet('tutorialSeen', null) === '1') return;

    var STEPS = [
      { sel: '.card-grid .card-item',              text: 'Tap a card to flip it over.',        interactive: true },
      { sel: '.card-grid .card-item:nth-child(2)', text: 'Now tap another card.',              interactive: true },
      { sel: '#timerDisplay',                      text: 'You have 2 minutes to match all the cards.' },
      { sel: '#starProgress',                      text: 'Fewer mistakes mean more stars and points.' }
    ];

    var current = 0;

    var spotlight = document.createElement('div');
    spotlight.className = 'tutorial-spotlight';
    var hole = document.createElement('div');
    hole.className = 'spotlight-hole';
    spotlight.appendChild(hole);
    document.body.appendChild(spotlight);

    var tooltip = document.createElement('div');
    tooltip.className = 'tutorial-tooltip';
    tooltip.innerHTML =
      '<div class="tutorial-tooltip-text"></div>' +
      '<button type="button" class="tutorial-tooltip-btn"></button>';
    document.body.appendChild(tooltip);
    var tipText = tooltip.querySelector('.tutorial-tooltip-text');
    var tipBtn  = tooltip.querySelector('.tutorial-tooltip-btn');

    var skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 'tutorial-skip-fixed';
    skipBtn.textContent = 'Skip';
    skipBtn.setAttribute('aria-label', 'Skip tutorial');
    document.body.appendChild(skipBtn);

    var tutorialActive = true;

    function position() {
      var el = document.querySelector(STEPS[current].sel);
      if (!el) { finishTutorial(); return; }
      var r = el.getBoundingClientRect();
      var pad = 8;
      hole.style.left   = (r.left - pad) + 'px';
      hole.style.top    = (r.top - pad) + 'px';
      hole.style.width  = (r.width + pad * 2) + 'px';
      hole.style.height = (r.height + pad * 2) + 'px';

      var tipW = tooltip.offsetWidth || 280;
      var tipH = tooltip.offsetHeight || 90;
      var left = Math.max(12, Math.min(r.left + r.width / 2 - tipW / 2, window.innerWidth - tipW - 12));
      var top = r.bottom + 16;
      var arrowDown = false;
      if (top + tipH > window.innerHeight - 12) {
        top = r.top - tipH - 16;
        arrowDown = true;
      }
      if (top < 12) { top = 12; }
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
      tooltip.classList.toggle('arrow-down', arrowDown);
    }

    function renderStep() {
      var s = STEPS[current];
      tipText.textContent = s.text;
      if (s.interactive) {
        tipBtn.style.display = 'none';
      } else {
        tipBtn.style.display = 'inline-flex';
        tipBtn.textContent = (current === STEPS.length - 1) ? "Let's Play!" : 'Got it!';
      }
      position();
    }

    function next() {
      current++;
      if (current >= STEPS.length) { finishTutorial(); return; }
      renderStep();
    }

    function finishTutorial() {
      if (!tutorialActive) return;
      tutorialActive = false;
      try { pSet('tutorialSeen', '1'); } catch (e) {}
      document.removeEventListener('click', onDocClick, true);
      document.removeEventListener('keydown', onDocKeydown);
      window.removeEventListener('resize', position);
      if (spotlight.parentNode) spotlight.parentNode.removeChild(spotlight);
      if (tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
      if (skipBtn.parentNode) skipBtn.parentNode.removeChild(skipBtn);

      deck = buildDeck();
      totalCards = deck.length;
      pairs = totalCards / 2;
      renderCards();
      resetTimer();
      barPercent = BAR_START;
      updateStarProgress();
      flippedCards = [];
      matchedPairs = 0;
      moves = 0;
      comboCount = 0;
      bonusPoints = 0;
      isLocked = false;
      gameStarted = false;
      gameFinished = false;
      applyNoScrollLayout();
    }

    function onDocClick(e) {
      if (!tutorialActive) return;
      if (e.target.closest && (e.target.closest('.tutorial-tooltip') || e.target.closest('.tutorial-skip-fixed'))) return;

      var s = STEPS[current];
      if (s.interactive) {
        var card = e.target.closest && e.target.closest('.card-item');
        if (card) {
          e.stopPropagation();
          e.preventDefault();
          card.classList.add('flipped');
          next();
          return;
        }
      }
      e.stopPropagation();
      e.preventDefault();
    }

    function onDocKeydown(e) {
      if (e.key === 'Escape' && tutorialActive) finishTutorial();
    }

    document.addEventListener('click', onDocClick, true);
    document.addEventListener('keydown', onDocKeydown);
    window.addEventListener('resize', position);

    tipBtn.addEventListener('click', function (e) { e.stopPropagation(); next(); });
    skipBtn.addEventListener('click', function (e) { e.stopPropagation(); finishTutorial(); });

    renderStep();
  }

  // ============================================================
  // SPECIAL CARDS TUTORIAL — Level 6 only (First time)
  // ============================================================
  function initLevel6Tutorial() {
    if (level !== 6) return;
    if (pGet('specialTutorialSeen', null) === '1') return;

    stopTimer();
    isLocked = true;

    const STEPS = [
      {
        title: "Level 6: Special Cards!",
        text: "Welcome to Level 6! Special cards are now in play.",
        target: null,
        btnText: "Next"
      },
      {
        title: "Bomb Card 💣",
        text: "Match Bombs to destroy a random pair!",
        target: () => document.querySelector('.card-item[data-pair="-1"]'),
        flipTarget: true,
        btnText: "Next"
      },
      {
        title: "Key & Lock 🔑🔒",
        text: "Match the Key and Lock to reveal the board!",
        target: () => document.querySelector('.card-item[data-pair="-2"]') || document.querySelector('.card-item[data-pair="-3"]'),
        flipBothKeyLock: true,
        btnText: "Next"
      },
      {
        title: "Ready to Play?",
        text: "Good luck! Match all the cards to win!",
        target: null,
        btnText: "Let's Play!"
      }
    ];

    let current = 0;
    let tutorialActive = true;

    const spotlight = document.createElement('div');
    spotlight.className = 'l6-tutorial-spotlight';
    const hole = document.createElement('div');
    hole.className = 'l6-spotlight-hole';
    spotlight.appendChild(hole);
    document.body.appendChild(spotlight);

    const box = document.createElement('div');
    box.className = 'l6-tutorial-box-wrap';
    box.innerHTML = `
      <div class="l6-tutorial-box">
        <span class="l6-tutorial-icon">✨</span>
        <h3 class="l6-tutorial-title"></h3>
        <p class="l6-tutorial-text"></p>
        <div class="l6-tutorial-progress">
          <span class="l6-tutorial-dot"></span>
          <span class="l6-tutorial-dot"></span>
          <span class="l6-tutorial-dot"></span>
          <span class="l6-tutorial-dot"></span>
        </div>
        <button type="button" class="l6-tutorial-btn"></button>
      </div>
    `;
    document.body.appendChild(box);

    const titleEl = box.querySelector('.l6-tutorial-title');
    const textEl  = box.querySelector('.l6-tutorial-text');
    const btnEl   = box.querySelector('.l6-tutorial-btn');
    const dots    = box.querySelectorAll('.l6-tutorial-dot');

    const skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 'tutorial-skip-fixed';
    skipBtn.textContent = 'Skip';
    skipBtn.setAttribute('aria-label', 'Skip tutorial');
    document.body.appendChild(skipBtn);

    function positionHole(el) {
      if (!el) { hole.style.display = 'none'; return; }
      hole.style.display = 'block';
      const r = el.getBoundingClientRect();
      const pad = 6;
      hole.style.left   = (r.left - pad) + 'px';
      hole.style.top    = (r.top - pad) + 'px';
      hole.style.width  = (r.width + pad * 2) + 'px';
      hole.style.height = (r.height + pad * 2) + 'px';
    }

    function renderStep() {
      const s = STEPS[current];
      titleEl.textContent = s.title;
      textEl.textContent  = s.text;
      btnEl.textContent   = s.btnText;

      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === current);
      });

      document.querySelectorAll('.card-item.flipped').forEach(c => {
        if (!c.classList.contains('matched')) c.classList.remove('flipped');
      });

      const targetEl = (typeof s.target === 'function') ? s.target() : null;
      if (s.flipTarget && targetEl) targetEl.classList.add('flipped');
      if (s.flipBothKeyLock) {
        const k = document.querySelector('.card-item[data-pair="-2"]');
        const l = document.querySelector('.card-item[data-pair="-3"]');
        if (k) k.classList.add('flipped');
        if (l) l.classList.add('flipped');
      }

      positionHole(targetEl);
    }

    function next() {
      current++;
      if (current >= STEPS.length) { finishTutorial(); return; }
      renderStep();
    }

    function finishTutorial() {
      if (!tutorialActive) return;
      tutorialActive = false;
      try { pSet('specialTutorialSeen', '1'); } catch (e) {}

      document.removeEventListener('keydown', onDocKeydown);
      window.removeEventListener('resize', renderStep);

      if (spotlight.parentNode) spotlight.parentNode.removeChild(spotlight);
      if (box.parentNode) box.parentNode.removeChild(box);
      if (skipBtn.parentNode) skipBtn.parentNode.removeChild(skipBtn);

      deck = buildDeck();
      totalCards = deck.length;
      pairs = totalCards / 2;
      renderCards();
      resetTimer();
      barPercent = BAR_START;
      updateStarProgress();
      flippedCards = [];
      matchedPairs = 0;
      moves = 0;
      comboCount = 0;
      bonusPoints = 0;
      isLocked = false;
      gameStarted = false;
      gameFinished = false;
      applyNoScrollLayout();
    }

    function onDocKeydown(e) {
      if (e.key === 'Escape' && tutorialActive) finishTutorial();
    }

    document.addEventListener('keydown', onDocKeydown);
    window.addEventListener('resize', renderStep);
    btnEl.addEventListener('click', (e) => { e.stopPropagation(); next(); });
    skipBtn.addEventListener('click', (e) => { e.stopPropagation(); finishTutorial(); });

    renderStep();
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================
  barPercent = BAR_START;
  renderCards();
  resetTimer();
  updateStarProgress();
  applyNoScrollLayout();

  showPreLevelQuiz(function () {
    if (level === 1 && pGet('tutorialSeen', null) !== '1') {
      initTutorial();
    } else if (level === 6 && pGet('specialTutorialSeen', null) !== '1') {
      initLevel6Tutorial();
    }
  });
});