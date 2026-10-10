/* ================================================================
   GAMEPLAY.JS — MATCH MONSTER (FINAL · JOJOMA EDITION)
   - Jojoma: card title + typed description + per-card audio
   - Audio has a HARD 3-second budget — no more hangs
   - Win modal gated until the final audio finishes
   ================================================================ */

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
    computer: { name: 'EPP',      icon: '../Assets/icons/computer_icon.png' },
    science:  { name: 'Science',  icon: '../Assets/icons/science_icon.png' }
  }[subject] || { name: 'Subject', icon: '../Assets/icons/computer_icon.png' };

  const SUBJECT_FOLDER = { computer: 'EPP', science: 'SCIENCE', ap: 'AP' };

  const LEVEL_FOLDER_VARIANTS = {
    computer: function (n) { return ['lvl ' + n, 'lvl' + n, 'Level ' + n, 'level ' + n]; },
    science:  function (n) { return ['Level ' + n, 'level ' + n, 'lvl ' + n, 'lvl' + n]; },
    ap:       function (n) {
      const list = ['level ' + n, 'Level ' + n, 'lvl ' + n, 'lvl' + n];
      if (n === 5) list.unshift('level 5 incomplete');
      return list;
    }
  };

  const IMG_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'avif'];

  // ============================================================
  // FILE_MAP — image filenames
  // ============================================================
  const FILE_MAP = {
    'ap:1:Pacific Ocean':        'pacific ocean',
    'ap:1:Pasig River':          'pasig river',
    'ap:1:Laguna de Bay':        'laguna debay',
    'ap:2:Mount Apo':            'Mount-Apo-',
    'ap:2:Mayon Volcano':        'mayon',
    'ap:2:Chocolate Hills':      'chocolate hills',
    'ap:2:Central Luzon Plain':  'Central Luzon Plain',
    'ap:3:Malaysia':             'malaysia',
    'ap:3:Indonesia':            'indonesia',
    'ap:3:Vietnam':              'Vietnam',
    'ap:3:Thailand':             'thailand',
    'ap:3:Brunei':               'brunei',
    'ap:4:Weather':              'weather',
    'ap:4:Climate':              'climate',
    'ap:4:Temperature':          'temperature',
    'ap:4:Humidity':             'humidity',
    'ap:4:Rainfall':             'rainfall',
    'ap:4:PAGASA':               'pagasa',
    'computer:1:Google':         'google',
    'computer:1:Yahoo':          'yahoo',
    'computer:1:Lycos':          'lycos',
    'computer:2:Search box':     'search box',
    'computer:2:Search button':  'search button',
    'computer:2:Search results': 'search result',
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
    'computer:5:Kind words':         'dos/kind words',
    'computer:5:Ask permission':     'dos/Ask permission before posting others_ photos (do)',
    'computer:5:Be respectful':      'dos/Be respectful in online class (do)_',
    'computer:5:Typing in ALL CAPS': 'dont/Typing in ALL CAPS (dont)',
    'computer:5:Sharing password':   'dont/Sharing password_',
    'computer:5:Using bad words':    'dont/Using bad words_',
    'computer:5:Fake news':          'dont/fake news',
    'science:1:Rock':            'rock',
    'science:1:Water':           'Water',
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
    'science:7:Gram':                  'gram',
    'science:7:Kilogram':              'kg',
    'science:7:Milliliter':            'milliliter_',
    'science:7:Liter':                 'liter',
    'science:7:Centimeter':            'cm',
    'science:7:Meter':                 'meter',
    'science:7:Degree Celsius':        'degree',
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
  const AUDIO_SUBJECT_FOLDER = { ap: 'ap', computer: 'epp', science: 'science' };

  const AUDIO_MAP = {
    'ap:1:Pacific Ocean':       'pacific ocean',
    'ap:1:Pasig River':         'Pasig River',
    'ap:1:Laguna de Bay':       'Laguna de Bay',
    'ap:2:Mount Apo':           'Mount Apo',
    'ap:2:Mayon Volcano':       'Mayon Volcano',
    'ap:2:Chocolate Hills':     'chocolate hills',
    'ap:2:Central Luzon Plain': 'central luzon plain',
    'ap:3:Malaysia':            'malaysia',
    'ap:3:Indonesia':           'Indonesia',
    'ap:3:Vietnam':             'vietnam',
    'ap:3:Thailand':            'thailand',
    'ap:3:Brunei':              'Brunei',
    'computer:1:Google':         'Google',
    'computer:1:Yahoo':          'yahoo',
    'computer:1:Lycos':          'lycos',
    'computer:2:Search box':     'search box',
    'computer:2:Search button':  'search button',
    'computer:2:Search results': 'search result',
    'computer:2:Tabs':           'tabs',
    'computer:3:Safari':          'safari',
    'computer:3:Opera':           'opera',
    'computer:3:Microsoft Edge':  'microsoft edge',
    'computer:3:Mozilla Firefox': 'mozilla firefox',
    'computer:3:Google Chrome':   'google chrome',
    'computer:4:Email':           'email',
    'computer:4:Chat':            'chat',
    'computer:4:Instant message': 'instant message',
    'computer:4:Video call':      'video call',
    'computer:4:Social media':    'social media',
    'computer:4:Online class':    'online class',
    'computer:5:Kind words':         'kind words',
    'computer:5:Ask permission':     'ask permission',
    'computer:5:Be respectful':      'be respectful',
    'computer:5:Typing in ALL CAPS': 'typing in all caps',
    'computer:5:Sharing password':   'sharing password',
    'computer:5:Using bad words':    'using bad words',
    'computer:5:Fake news':          'fake news',
    'computer:6:.com':  'com', 'computer:6:.edu':  'edu',
    'computer:6:.net':  'net', 'computer:6:.org':  'org',
    'computer:6:.gov':  'gov', 'computer:6:.pro':  'pro',
    'computer:6:.info': 'info','computer:6:.int':  'int',
    'computer:7:Browser window buttons': 'browser window buttons',
    'computer:7:Tab name':               'tab name',
    'computer:7:Navigation buttons':     'navigation buttons',
    'computer:7:New tab':                'new tab',
    'computer:7:Customize and control':  'customize and control',
    'computer:7:Bookmark this page':     'bookmark this page',
    'computer:7:Address bar':            'address bar',
    'computer:7:Display window':         'display window',
    'computer:7:Scroll bar':             'scroll bar',
    'computer:8:Username':    'username',
    'computer:8:Domain name': 'domain name',
    'computer:8:Domain type': 'domain type',
    'computer:8:To':          'to', 'computer:8:Cc':  'cc',
    'computer:8:Bcc':         'bcc', 'computer:8:Subject': 'subject',
    'computer:8:Body':        'body', 'computer:8:Attach File': 'attach file',
    'computer:8:Send':        'send',
    'computer:9:Gmail':        'gmail',
    'computer:9:Yahoo Mail':   'yahoo mail',
    'computer:9:Outlook':      'outlook',
    'computer:9:Compose Mail': 'compose mail',
    'computer:9:Inbox':        'inbox',
    'computer:9:Sent':         'sent',
    'computer:9:Drafts':       'drafts',
    'computer:9:Spam':         'spam',
    'computer:9:Attachment':   'attachment',
    'computer:9:Reply':        'reply',
    'computer:9:Forward':      'forward',
    'computer:10:Monitor':         'monitor',
    'computer:10:Keyboard':        'keyboard',
    'computer:10:Mouse':           'mouse',
    'computer:10:System unit':     'system unit',
    'computer:10:Speakers':        'speakers',
    'computer:10:Printer':         'printer',
    'computer:10:Webcam':          'webcam',
    'computer:10:Microphone':      'microphone',
    'computer:10:Headset':         'headset',
    'computer:10:Scanner':         'scanner',
    'computer:10:USB flash drive': 'usb flash drive',
    'computer:10:Touchpad':        'touchpad'
  };

  // ============================================================
  // DESC_MAP
  // ============================================================
  const DESC_MAP = {
    'ap:1:Pacific Ocean':       "Earth's largest and deepest ocean.",
    'ap:1:Pasig River':         "Historic river running through Manila.",
    'ap:1:Laguna de Bay':       "Largest lake in the Philippines.",
    'ap:2:Mount Apo':           "The highest peak in the Philippines.",
    'ap:2:Mayon Volcano':       "Volcano famous for its perfect cone.",
    'ap:2:Chocolate Hills':     "Famous brown hills in Bohol.",
    'ap:2:Central Luzon Plain': "The rice granary of the country.",
    'ap:3:Malaysia':            "Southeast Asian country near Palawan.",
    'ap:3:Indonesia':           "Giant archipelago south of Mindanao.",
    'ap:3:Vietnam':             "Country across the West Philippine Sea.",
    'ap:3:Thailand':            "Asian country famous for tourism.",
    'ap:3:Brunei':              "Small, wealthy nation on Borneo.",
    'ap:4:Weather':             "Day-to-day condition of the atmosphere.",
    'ap:4:Climate':             "Long-term average weather pattern.",
    'ap:4:Temperature':         "Measure of hotness or coldness.",
    'ap:4:Humidity':            "Amount of moisture in air.",
    'ap:4:Rainfall':            "Water falling down as rain.",
    'ap:4:PAGASA':              "Philippine official weather forecasting agency.",
    'computer:1:Google':         "Most popular modern search engine.",
    'computer:1:Yahoo':          "Search engine with internet directory.",
    'computer:1:Lycos':          "Pioneer search engine from the nineties.",
    'computer:2:Search box':     "Where you type keywords online.",
    'computer:2:Search button':  "Click this to start searching.",
    'computer:2:Search results': "List of websites found online.",
    'computer:2:Tabs':           "Filters search results into categories.",
    'computer:3:Safari':         "Apple devices default web browser.",
    'computer:3:Opera':          "Browser known for speed features.",
    'computer:3:Microsoft Edge': "Windows default built-in web browser.",
    'computer:3:Mozilla Firefox':"Independent, open-source web browser.",
    'computer:3:Google Chrome':  "Widely used browser by Google.",
    'computer:4:Email':          "Digital letters sent over the internet.",
    'computer:4:Chat':           "Real-time text messaging with others.",
    'computer:4:Instant message':"Fast text sent instantly online.",
    'computer:4:Video call':     "See and hear people digitally.",
    'computer:4:Social media':   "Platforms for sharing media content.",
    'computer:4:Online class':   "Learning using internet-connected devices.",
    'computer:5:Kind words':         "Be polite in online messages.",
    'computer:5:Ask permission':     "Respect privacy of other people.",
    'computer:5:Be respectful':      "Listen carefully to your teacher.",
    'computer:5:Typing in ALL CAPS': "Feels like shouting at someone.",
    'computer:5:Sharing password':   "Keep account access keys secret.",
    'computer:5:Using bad words':    "Never use offensive language online.",
    'computer:5:Fake news':          "Never share unverified false information.",
    'computer:6:.com':  "For general commercial businesses.",
    'computer:6:.edu':  "Used by schools and universities.",
    'computer:6:.net':  "Used by network provider systems.",
    'computer:6:.org':  "Used mostly by non-profit groups.",
    'computer:6:.gov':  "Official government website extension.",
    'computer:6:.pro':  "Reserved for certified professionals.",
    'computer:6:.info': "Open extension for informational websites.",
    'computer:6:.int':  "Used by international treaty organizations.",
    'computer:7:Browser window buttons': "Minimize, maximize, or close window.",
    'computer:7:Tab name':               "Displays current web page title.",
    'computer:7:Navigation buttons':     "Go backward or forward online.",
    'computer:7:New tab':                "Opens a blank web page window.",
    'computer:7:Customize and control':  "Browser settings and options menu.",
    'computer:7:Bookmark this page':     "Saves web address for later.",
    'computer:7:Address bar':            "Where you type web addresses.",
    'computer:7:Display window':         "Main area showing website content.",
    'computer:7:Scroll bar':             "Moves page up and down.",
    'computer:8:Username':    "Unique name identifying email owner.",
    'computer:8:Domain name': "Website company hosting email service.",
    'computer:8:Domain type': "Shows type of email organization.",
    'computer:8:To':          "Field for main recipient address.",
    'computer:8:Cc':          "Sends copies to other people.",
    'computer:8:Bcc':         "Hides recipient names from others.",
    'computer:8:Subject':     "Title of email message topic.",
    'computer:8:Body':        "Main written message text area.",
    'computer:8:Attach File': "Add documents or images here.",
    'computer:8:Send':        "Button to deliver your email.",
    'computer:9:Gmail':        "Google electronic mail provider system.",
    'computer:9:Yahoo Mail':   "Longtime popular email provider service.",
    'computer:9:Outlook':      "Microsoft email client service provider.",
    'computer:9:Compose Mail': "Start writing a new email message.",
    'computer:9:Inbox':        "Where incoming new emails arrive.",
    'computer:9:Sent':         "Folder storing delivered email messages.",
    'computer:9:Drafts':       "Stores unfinished email message texts.",
    'computer:9:Spam':         "Folder filtering unwanted junk emails.",
    'computer:9:Attachment':   "File attached to an email message.",
    'computer:9:Reply':        "Answer back to the sender email.",
    'computer:9:Forward':      "Send received email to someone.",
    'computer:10:Monitor':        "Screen showing visual output.",
    'computer:10:Keyboard':       "Device for typing letters, numbers.",
    'computer:10:Mouse':          "Pointing device used to click.",
    'computer:10:System unit':    "Main case housing internal hardware.",
    'computer:10:Speakers':       "Audio output device for sound.",
    'computer:10:Printer':        "Prints digital documents onto paper.",
    'computer:10:Webcam':         "Camera capturing live video feeds.",
    'computer:10:Microphone':     "Input hardware capturing audio voice.",
    'computer:10:Headset':        "Headphones with voice microphone.",
    'computer:10:Scanner':        "Copies paper documents into computer.",
    'computer:10:USB flash drive':"Portable file storage device.",
    'computer:10:Touchpad':       "Touch-sensitive mouse surface.",
    'science:1:Rock':  "Hard solid form of matter.",
    'science:1:Water': "Life-sustaining liquid type of matter.",
    'science:1:Air':   "Invisible gas surrounding the Earth.",
    'science:2:Chair': "Solid furniture piece for sitting.",
    'science:2:Desk':  "Solid table used for working.",
    'science:2:Bag':   "Solid container carrying school items.",
    'science:2:Shoes': "Solid protective footwear worn.",
    'science:3:Water':           "Clear liquid essential for life.",
    'science:3:Coffee':          "Hot liquid energy morning drink.",
    'science:3:Chocolate drink': "Sweet liquid treat enjoyed cold.",
    'science:3:Juice':           "Flavorful liquid squeezed from fruits.",
    'science:3:Milk':            "Nutritious white dairy drink.",
    'science:4:Air':            "The gaseous atmosphere of Earth.",
    'science:4:Wind':           "Moving air across landscape terrains.",
    'science:4:Oxygen':         "Gas living organisms breathe in.",
    'science:4:Carbon dioxide': "Gas released when breathing out.",
    'science:4:Water vapor':    "Water existing in gaseous state.",
    'science:4:Helium':         "Light gas inflating flying balloons.",
    'science:5:Mass':    "Amount of matter inside object.",
    'science:5:Weight':  "Gravitational pull force on object.",
    'science:5:Volume':  "Amount of space object occupies.",
    'science:5:Shape':   "External form outline of matter.",
    'science:5:Color':   "Visual appearance shade of matter.",
    'science:5:Texture': "Feel of surface when touched.",
    'science:5:Smell':   "Odor detected by your nose.",
    'science:6:Platform balance':    "Tool comparing heavy item masses.",
    'science:6:Triple beam balance': "Measures mass very precisely.",
    'science:6:Weighing scale':      "Displays object current weight.",
    'science:6:Graduated cylinder':  "Measures exact liquid volume.",
    'science:6:Meter stick':         "Ruler measuring long object length.",
    'science:6:Thermometer':         "Tracks hotness or coldness.",
    'science:6:Measuring cup':       "Cup for kitchen fluid measurements.",
    'science:6:Beaker':              "Glass cup measuring laboratory liquids.",
    'science:7:Gram':            "Metric unit tracking light mass.",
    'science:7:Kilogram':        "Base unit tracking heavy mass.",
    'science:7:Milliliter':      "Small unit tracking liquid volume.",
    'science:7:Liter':           "Common unit tracking liquid volume.",
    'science:7:Centimeter':      "Unit measuring small item lengths.",
    'science:7:Meter':           "Base unit measuring distance.",
    'science:7:Cubic centimeter':"Volume unit for solid matter.",
    'science:7:Degree Celsius':  "Unit measuring temperature level.",
    'science:7:Cubic meter':     "Large unit measuring massive volumes.",
    'science:8:Melting':          "Solid turning into a liquid.",
    'science:8:Freezing':         "Liquid turning into a solid.",
    'science:8:Evaporation':      "Liquid turning into a gas.",
    'science:8:Condensation':     "Gas turning into a liquid.",
    'science:8:Boiling':          "Liquid rapidly vaporizing from heat.",
    'science:8:Cutting paper':    "Changing shape using scissors.",
    'science:8:Tearing paper':    "Pulling paper apart into pieces.",
    'science:8:Crushing a can':   "Smashing metal changing its form.",
    'science:8:Dissolving sugar': "Mixing crystals into liquid.",
    'science:8:Folding paper':    "Creasing paper without tearing.",
    'science:9:Mouth':           "Where food enters digestive path.",
    'science:9:Teeth':           "Hard structures crushing food items.",
    'science:9:Salivary glands': "Glands producing spit to dissolve food.",
    'science:9:Esophagus':       "Tube moving food down to stomach.",
    'science:9:Stomach':         "Organ churning food using acid.",
    'science:9:Liver':           "Filters toxins, produces bile.",
    'science:9:Gallbladder':     "Small sac storing digestive bile.",
    'science:9:Pancreas':        "Produces useful digestive enzymes.",
    'science:9:Small intestine': "Where most nutrients get absorbed.",
    'science:9:Large intestine': "Absorbs water from waste.",
    'science:9:Rectum':          "Final storage area for waste.",
    'science:10:Nose':         "Main external pathway for breathing.",
    'science:10:Nasal cavity': "Warms and filters inhaled air.",
    'science:10:Mouth':        "Secondary opening used for breathing.",
    'science:10:Pharynx':      "Throat passage connecting nose and mouth.",
    'science:10:Larynx':       "Voice box housing vocal cords.",
    'science:10:Trachea':      "Main windpipe tube leading to lungs.",
    'science:10:Bronchi':      "Two large air tube branches.",
    'science:10:Bronchioles':  "Smallest air tubes inside the lungs.",
    'science:10:Alveoli':      "Tiny sacs where gas exchange happens.",
    'science:10:Lungs':        "Primary organs used for breathing.",
    'science:10:Diaphragm':    "Muscle driving lung breathing actions.",
    'science:10:Ribs':         "Bones protecting vital lung organs."
  };

  function getCardDescription(pairIndex) {
    const entry = topicInfo.cards[pairIndex % topicInfo.cards.length];
    if (!entry) return '';
    const key = subject + ':' + level + ':' + entry.name;
    return DESC_MAP[key] || entry.desc || entry.name;
  }

  // ============================================================
  // IMG — Unsplash fallback library
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
  // TOPIC_DATA
  // ============================================================
  const TOPIC_DATA = {
    computer: {
      1: { title: 'Search Engines', cards: [
        { id: IMG.codeScreen, name: 'Google' },
        { id: IMG.analytics,  name: 'Yahoo'  },
        { id: IMG.binary,     name: 'Lycos'  }
      ]},
      2: { title: 'Parts of a Search Engine Home Page', cards: [
        { id: IMG.uiDesign,  name: 'Search box'     },
        { id: IMG.mouse,     name: 'Search button'  },
        { id: IMG.docs,      name: 'Search results' },
        { id: IMG.dashboard, name: 'Tabs'           }
      ]},
      3: { title: 'Web Browsers', cards: [
        { id: IMG.macbook,    name: 'Safari'          },
        { id: IMG.codeScreen, name: 'Opera'           },
        { id: IMG.monitor,    name: 'Microsoft Edge'  },
        { id: IMG.code2,      name: 'Mozilla Firefox' },
        { id: IMG.workspace,  name: 'Google Chrome'   }
      ]},
      4: { title: 'Ways to Communicate Online', cards: [
        { id: IMG.docs,       name: 'Email'           },
        { id: IMG.codeScreen, name: 'Chat'            },
        { id: IMG.notebook,   name: 'Instant message' },
        { id: IMG.webcam,     name: 'Video call'      },
        { id: IMG.uiDesign,   name: 'Social media'    },
        { id: IMG.studying,   name: 'Online class'    }
      ]},
      5: { title: "Netiquette: Do's and Don'ts", cards: [
        { id: IMG.writing,   name: 'Kind words'         },
        { id: IMG.docs,      name: 'Ask permission'     },
        { id: IMG.studying,  name: 'Be respectful'      },
        { id: IMG.code1,     name: 'Typing in ALL CAPS' },
        { id: IMG.password,  name: 'Sharing password'   },
        { id: IMG.docs,      name: 'Using bad words'    },
        { id: IMG.analytics, name: 'Fake news'          }
      ]},
      6: { title: 'Domain Types', cards: [
        { id: IMG.dashboard,  name: '.com'  },
        { id: IMG.schoolBldg, name: '.edu'  },
        { id: IMG.circuit,    name: '.net'  },
        { id: IMG.community,  name: '.org'  },
        { id: IMG.buildings,  name: '.gov'  },
        { id: IMG.workspace,  name: '.pro'  },
        { id: IMG.docs,       name: '.info' },
        { id: IMG.earth,      name: '.int'  }
      ]},
      7: { title: 'Parts of a Web Browser', cards: [
        { id: IMG.monitor,    name: 'Browser window buttons' },
        { id: IMG.uiDesign,   name: 'Tab name'               },
        { id: IMG.mouse,      name: 'Navigation buttons'     },
        { id: IMG.dashboard,  name: 'New tab'                },
        { id: IMG.security,   name: 'Customize and control'  },
        { id: IMG.books,      name: 'Bookmark this page'     },
        { id: IMG.codeScreen, name: 'Address bar'            },
        { id: IMG.workspace,  name: 'Display window'         },
        { id: IMG.officeDesk, name: 'Scroll bar'             }
      ]},
      8: { title: 'Parts of an Email', cards: [
        { id: IMG.face,       name: 'Username'    },
        { id: IMG.analytics,  name: 'Domain name' },
        { id: IMG.dashboard,  name: 'Domain type' },
        { id: IMG.docs,       name: 'To'          },
        { id: IMG.docs,       name: 'Cc'          },
        { id: IMG.security,   name: 'Bcc'         },
        { id: IMG.writing,    name: 'Subject'     },
        { id: IMG.docs,       name: 'Body'        },
        { id: IMG.gadgets,    name: 'Attach File' },
        { id: IMG.uiDesign,   name: 'Send'        }
      ]},
      9: { title: 'Email Words', cards: [
        { id: IMG.dashboard,  name: 'Gmail'        },
        { id: IMG.docs,       name: 'Yahoo Mail'   },
        { id: IMG.macbook,    name: 'Outlook'      },
        { id: IMG.writing,    name: 'Compose Mail' },
        { id: IMG.docs,       name: 'Inbox'        },
        { id: IMG.analytics,  name: 'Sent'         },
        { id: IMG.notebook,   name: 'Drafts'       },
        { id: IMG.security,   name: 'Spam'         },
        { id: IMG.gadgets,    name: 'Attachment'   },
        { id: IMG.mouse,      name: 'Reply'        },
        { id: IMG.uiDesign,   name: 'Forward'      }
      ]},
      10: { title: 'Parts of a Computer', cards: [
        { id: IMG.monitor,    name: 'Monitor'         },
        { id: IMG.keyboard,   name: 'Keyboard'        },
        { id: IMG.mouse,      name: 'Mouse'           },
        { id: IMG.macbook,    name: 'System unit'     },
        { id: IMG.headset,    name: 'Speakers'        },
        { id: IMG.printer,    name: 'Printer'         },
        { id: IMG.webcam,     name: 'Webcam'          },
        { id: IMG.headphones, name: 'Microphone'      },
        { id: IMG.headset,    name: 'Headset'         },
        { id: IMG.printer,    name: 'Scanner'         },
        { id: IMG.gadgets,    name: 'USB flash drive' },
        { id: IMG.laptopSide, name: 'Touchpad'        }
      ]}
    },
    science: {
      1: { title: 'Matter', cards: [
        { id: IMG.mountain, name: 'Rock'  },
        { id: IMG.water,    name: 'Water' },
        { id: IMG.clouds,   name: 'Air'   }
      ]},
      2: { title: 'Solids', cards: [
        { id: IMG.officeDesk, name: 'Chair' },
        { id: IMG.workspace,  name: 'Desk'  },
        { id: IMG.schoolBag,  name: 'Bag'   },
        { id: IMG.bike,       name: 'Shoes' }
      ]},
      3: { title: 'Liquids', cards: [
        { id: IMG.water,  name: 'Water'           },
        { id: IMG.coffee, name: 'Coffee'          },
        { id: IMG.coffee, name: 'Chocolate drink' },
        { id: IMG.juice,  name: 'Juice'           },
        { id: IMG.fruit,  name: 'Milk'            }
      ]},
      4: { title: 'Gases', cards: [
        { id: IMG.clouds,  name: 'Air'            },
        { id: IMG.clouds2, name: 'Wind'           },
        { id: IMG.forest,  name: 'Oxygen'         },
        { id: IMG.sky,     name: 'Carbon dioxide' },
        { id: IMG.clouds,  name: 'Water vapor'    },
        { id: IMG.rainbow, name: 'Helium'         }
      ]},
      5: { title: 'Properties of Matter', cards: [
        { id: IMG.analytics, name: 'Mass'    },
        { id: IMG.analytics, name: 'Weight'  },
        { id: IMG.dashboard, name: 'Volume'  },
        { id: IMG.uiDesign,  name: 'Shape'   },
        { id: IMG.flower,    name: 'Color'   },
        { id: IMG.leaves,    name: 'Texture' },
        { id: IMG.flower2,   name: 'Smell'   }
      ]},
      6: { title: 'Measuring Tools', cards: [
        { id: IMG.analytics,  name: 'Platform balance'    },
        { id: IMG.analytics,  name: 'Triple beam balance' },
        { id: IMG.analytics,  name: 'Weighing scale'      },
        { id: IMG.workspace,  name: 'Graduated cylinder'  },
        { id: IMG.officeDesk, name: 'Meter stick'         },
        { id: IMG.analytics,  name: 'Thermometer'         },
        { id: IMG.workspace,  name: 'Measuring cup'       },
        { id: IMG.soup,       name: 'Beaker'              }
      ]},
      7: { title: 'Units of Measurement', cards: [
        { id: IMG.analytics,  name: 'Gram'             },
        { id: IMG.analytics,  name: 'Kilogram'         },
        { id: IMG.water,      name: 'Milliliter'       },
        { id: IMG.water,      name: 'Liter'            },
        { id: IMG.officeDesk, name: 'Centimeter'       },
        { id: IMG.officeDesk, name: 'Meter'            },
        { id: IMG.dashboard,  name: 'Cubic centimeter' },
        { id: IMG.snow,       name: 'Degree Celsius'   },
        { id: IMG.dashboard,  name: 'Cubic meter'      }
      ]},
      8: { title: 'Physical Changes', cards: [
        { id: IMG.snow,    name: 'Melting'          },
        { id: IMG.snow,    name: 'Freezing'         },
        { id: IMG.clouds,  name: 'Evaporation'      },
        { id: IMG.clouds2, name: 'Condensation'     },
        { id: IMG.soup,    name: 'Boiling'          },
        { id: IMG.docs,    name: 'Cutting paper'    },
        { id: IMG.docs,    name: 'Tearing paper'    },
        { id: IMG.gadgets, name: 'Crushing a can'   },
        { id: IMG.coffee,  name: 'Dissolving sugar' },
        { id: IMG.docs,    name: 'Folding paper'    }
      ]},
      9: { title: 'Digestive System', cards: [
        { id: IMG.face,      name: 'Mouth'           },
        { id: IMG.face,      name: 'Teeth'           },
        { id: IMG.face,      name: 'Salivary glands' },
        { id: IMG.analytics, name: 'Esophagus'       },
        { id: IMG.analytics, name: 'Stomach'         },
        { id: IMG.analytics, name: 'Liver'           },
        { id: IMG.analytics, name: 'Gallbladder'     },
        { id: IMG.analytics, name: 'Pancreas'        },
        { id: IMG.analytics, name: 'Small intestine' },
        { id: IMG.analytics, name: 'Large intestine' },
        { id: IMG.analytics, name: 'Rectum'          }
      ]},
      10: { title: 'Respiratory System', cards: [
        { id: IMG.face,      name: 'Nose'         },
        { id: IMG.face,      name: 'Nasal cavity' },
        { id: IMG.face,      name: 'Mouth'        },
        { id: IMG.analytics, name: 'Pharynx'      },
        { id: IMG.analytics, name: 'Larynx'       },
        { id: IMG.analytics, name: 'Trachea'      },
        { id: IMG.analytics, name: 'Bronchi'      },
        { id: IMG.analytics, name: 'Bronchioles'  },
        { id: IMG.analytics, name: 'Alveoli'      },
        { id: IMG.analytics, name: 'Lungs'        },
        { id: IMG.analytics, name: 'Diaphragm'    },
        { id: IMG.analytics, name: 'Ribs'         }
      ]}
    },
    ap: {
      1: { title: 'Bodies of Water', cards: [
        { id: IMG.ocean, name: 'Pacific Ocean' },
        { id: IMG.river, name: 'Pasig River'   },
        { id: IMG.lake,  name: 'Laguna de Bay' }
      ]},
      2: { title: 'Landforms', cards: [
        { id: IMG.mountain,   name: 'Mount Apo'           },
        { id: IMG.mountains2, name: 'Mayon Volcano'       },
        { id: IMG.mountains2, name: 'Chocolate Hills'     },
        { id: IMG.forest,     name: 'Central Luzon Plain' }
      ]},
      3: { title: 'Southeast Asian Neighbors', cards: [
        { id: IMG.city,      name: 'Malaysia'  },
        { id: IMG.island,    name: 'Indonesia' },
        { id: IMG.river,     name: 'Vietnam'   },
        { id: IMG.town,      name: 'Thailand'  },
        { id: IMG.buildings, name: 'Brunei'    }
      ]},
      4: { title: 'Weather and Climate Terms', cards: [
        { id: IMG.clouds,  name: 'Weather'     },
        { id: IMG.sunset,  name: 'Climate'     },
        { id: IMG.sunset,  name: 'Temperature' },
        { id: IMG.clouds2, name: 'Humidity'    },
        { id: IMG.clouds,  name: 'Rainfall'    },
        { id: IMG.storm,   name: 'PAGASA'      }
      ]},
      5: { title: 'Climate and Seasons', cards: [
        { id: IMG.clouds,  name: 'Rainy season'     },
        { id: IMG.sunset,  name: 'Dry season'       },
        { id: IMG.clouds2, name: 'Cool dry season'  },
        { id: IMG.sunset2, name: 'Hot dry season'   },
        { id: IMG.sunset,  name: 'May'              },
        { id: IMG.snow,    name: 'January'          },
        { id: IMG.forest,  name: 'Tropical climate' }
      ]},
      6: { title: 'Island Groups and Major Islands', cards: [
        { id: IMG.mountains2, name: 'Luzon'    },
        { id: IMG.island,     name: 'Visayas'  },
        { id: IMG.island,     name: 'Mindanao' },
        { id: IMG.beach,      name: 'Palawan'  },
        { id: IMG.island,     name: 'Mindoro'  },
        { id: IMG.island,     name: 'Samar'    },
        { id: IMG.beach,      name: 'Leyte'    },
        { id: IMG.city,       name: 'Cebu'     }
      ]},
      7: { title: 'More Landforms and Bodies of Water', cards: [
        { id: IMG.mountain,   name: 'Mount Pulag'    },
        { id: IMG.mountains2, name: 'Mount Pinatubo' },
        { id: IMG.lake2,      name: 'Taal Volcano'   },
        { id: IMG.river,      name: 'Cagayan River'  },
        { id: IMG.river,      name: 'Agusan River'   },
        { id: IMG.lake,       name: 'Lake Lanao'     },
        { id: IMG.ocean,      name: 'Subic Bay'      },
        { id: IMG.ocean,      name: 'Davao Gulf'     },
        { id: IMG.ocean,      name: 'Sibuyan Sea'    }
      ]},
      8: { title: 'Ancient Filipino Society and Life', cards: [
        { id: IMG.town,      name: 'Barangay'   },
        { id: IMG.face,      name: 'Datu'       },
        { id: IMG.police,    name: 'Maharlika'  },
        { id: IMG.farmer,    name: 'Timawa'     },
        { id: IMG.farmer,    name: 'Alipin'     },
        { id: IMG.tradition, name: 'Babaylan'   },
        { id: IMG.boat,      name: 'Balangay'   },
        { id: IMG.weaving,   name: 'Baybayin'   },
        { id: IMG.houses,    name: 'Bahay Kubo' },
        { id: IMG.farmer,    name: 'Panday'     }
      ]},
      9: { title: 'Material Culture', cards: [
        { id: IMG.tradition,    name: 'Manunggul Jar'      },
        { id: IMG.riceTerraces, name: 'Banaue Rice Terraces'},
        { id: IMG.weaving,      name: 'Bulul'              },
        { id: IMG.phHistory,    name: 'Laguna Copperplate' },
        { id: IMG.costume,      name: 'Golden Tara'        },
        { id: IMG.phHistory,    name: 'Tabon Cave'         },
        { id: IMG.phHistory,    name: 'Angono Petroglyphs' },
        { id: IMG.buildings,    name: 'Fort Santiago'      },
        { id: IMG.church,       name: 'San Agustin Church' },
        { id: IMG.houses,       name: 'Bahay na Bato'      },
        { id: IMG.church,       name: 'Barasoain Church'   }
      ]},
      10: { title: 'Non-Material Culture', cards: [
        { id: IMG.books,         name: 'Hudhud'           },
        { id: IMG.books,         name: 'Biag ni Lam-ang'  },
        { id: IMG.books,         name: 'Alamat'           },
        { id: IMG.books,         name: 'Bugtong'          },
        { id: IMG.books,         name: 'Salawikain'       },
        { id: IMG.motherChild,   name: 'Kundiman'         },
        { id: IMG.culturalDance, name: 'Tinikling'        },
        { id: IMG.culturalDance, name: 'Singkil'          },
        { id: IMG.culturalDance, name: 'Pandanggo sa Ilaw'},
        { id: IMG.festival,      name: 'Fiesta'           },
        { id: IMG.tradition,     name: 'Pamahiin'         },
        { id: IMG.family,        name: 'Mano po'          }
      ]}
    }
  };

  const subjectTopics = TOPIC_DATA[subject] || TOPIC_DATA.computer;
  const topicInfo = subjectTopics[level] || subjectTopics[1];

  // ============================================================
  // IMAGE BUILDER
  // ============================================================
  function getUnsplashUrl(pairIndex) {
    const entry = topicInfo.cards[pairIndex % topicInfo.cards.length];
    return `https://images.unsplash.com/${entry.id}?w=400&h=500&fit=crop&auto=format&q=70`;
  }
  function getCardLabel(pairIndex) {
    const entry = topicInfo.cards[pairIndex % topicInfo.cards.length];
    return entry ? entry.name : topicInfo.title;
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
    const candidates  = buildLocalCandidates(pairIndex);
    const unsplash    = getUnsplashUrl(pairIndex);
    const label       = getCardLabel(pairIndex);
    const placeholder = makePlaceholderDataUri(label);
    let stage = 0, stopped = false;
    function advance() {
      if (stopped) return;
      if (stage < candidates.length) { imgEl.src = candidates[stage++]; return; }
      if (stage === candidates.length) { imgEl.src = unsplash; stage++; return; }
      stopped = true;
      imgEl.removeEventListener('error', advance);
      imgEl.src = placeholder;
    }
    imgEl.addEventListener('error', advance);
    advance();
  }

  // ============================================================
  // AUDIO — SMART BUILDER + HARD BUDGET PLAYER
  // ============================================================
  const AUDIO_BUDGET_MS = 3000;   // max time spent trying to find audio
  const AUDIO_PER_TRY_MS = 280;   // max time per candidate

  // Build a small candidate list (≤12) — folders most likely first
  function buildAudioCandidates(pairIndex) {
    const entry = topicInfo.cards[pairIndex % topicInfo.cards.length];
    if (!entry) return [];
    const cardName = entry.name;
    const folder   = AUDIO_SUBJECT_FOLDER[subject] || 'epp';
    const mapped   = AUDIO_MAP[subject + ':' + level + ':' + cardName];

    // Names to try (max 3)
    const names = [];
    if (mapped) names.push(mapped);
    if (cardName !== mapped) names.push(cardName);
    const lc = cardName.toLowerCase();
    if (names.indexOf(lc) === -1 && lc !== cardName) names.push(lc);

    // Folders most likely first (max 4)
    const lvlDirs = [
      'lvl ' + level,     // epp level 1
      'lvl' + level,      // ap level 1
      'lv' + level,       // epp level 2
      'Level ' + level    // fallback
    ];

    const out = [];
    for (const dir of lvlDirs) {
      for (const name of names) {
        out.push(`../Assets/sound/${folder}/${dir}/${name}.mp3`);
        if (out.length >= 12) return out;
      }
    }
    return out;
  }

  /**
   * Try each candidate URL with a short timeout and a HARD overall budget.
   * Resolves with the Audio element on success, or null if nothing works.
   */
  function playAudioWithBudget(candidates, budgetMs) {
    return new Promise((resolve) => {
      if (!candidates || !candidates.length) { resolve(null); return; }

      let resolved = false;
      let idx = 0;
      const startTime = Date.now();

      const budgetTimer = setTimeout(function () {
        if (resolved) return;
        resolved = true;
        console.warn('[Jojoma] Audio budget exceeded — skipping');
        resolve(null);
      }, budgetMs);

      function finishWith(audio) {
        if (resolved) return;
        resolved = true;
        clearTimeout(budgetTimer);
        resolve(audio);
      }

      function tryNext() {
        if (resolved) return;
        if (idx >= candidates.length) { finishWith(null); return; }
        if (Date.now() - startTime > budgetMs) { finishWith(null); return; }

        const src = candidates[idx++];
        const audio = new Audio();
        audio.preload = 'auto';
        audio.volume = 1.0;

        let settled = false;

        const perTry = setTimeout(function () {
          if (settled) return;
          settled = true;
          try { audio.src = ''; } catch(e){}
          tryNext();
        }, AUDIO_PER_TRY_MS);

        audio.addEventListener('loadedmetadata', function () {
          if (settled) return;
          settled = true;
          clearTimeout(perTry);
          console.log('[Jojoma] ▶ Playing:', src);

          // Try to play — best effort
          const p = audio.play();
          if (p && typeof p.catch === 'function') {
            p.catch(function (err) {
              console.warn('[Jojoma] Play blocked:', err && err.name);
            });
          }
          finishWith(audio);
        });

        audio.addEventListener('error', function () {
          if (settled) return;
          settled = true;
          clearTimeout(perTry);
          tryNext();
        });

        audio.src = src;
        try { audio.load(); } catch(e) { tryNext(); }
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
    characterDialog.classList.add('show');
    dialogActive = true;
    skipRequested = false;
    characterDialog.classList.add('skippable');
    if (!characterDialog.__skipBound) {
      characterDialog.addEventListener('click', function () { skipRequested = true; });
      characterDialog.__skipBound = true;
    }
  }
  function hideCharacterDialog() {
    if (!characterDialog) return;
    characterDialog.classList.remove('show');
    characterDialog.classList.remove('skippable');
    dialogActive = false;
  }

  function typeText(text, onDone) {
    if (!characterText) { if (onDone) onDone(); return; }
    if (typingTimer) { clearInterval(typingTimer); typingTimer = null; }
    characterText.textContent = '';
    characterText.classList.add('typing');
    let i = 0;
    const speed = 22;
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

  /**
   * Show Jojoma + type description + play audio.
   * Dialog closes when BOTH typing AND audio phase finish.
   * Audio has a hard 3s budget — if no file found, moves on.
   */
  function speakCard(pairIndex, onDone) {
    dialogOnDone = onDone || null;

    const title      = getCardLabel(pairIndex);
    const desc       = getCardDescription(pairIndex);
    const candidates = buildAudioCandidates(pairIndex);

    console.log('[Jojoma] Card:', title, '· candidates:', candidates.length);
    if (candidates.length) console.log('[Jojoma] First try:', candidates[0]);

    showCharacterDialog(title);

    let typingDone   = false;
    let audioDone    = false;
    let finishCalled = false;

    function checkBothDone() {
      if (typingDone && audioDone && !finishCalled) {
        finishCalled = true;
        setTimeout(function () {
          hideCharacterDialog();
          if (currentAudio) {
            try { currentAudio.pause(); } catch (e) {}
            currentAudio = null;
          }
          const cb = dialogOnDone;
          dialogOnDone = null;
          if (typeof cb === 'function') cb();
        }, 400);
      }
    }

    // 1) Start typing
    typeText(desc, function () {
      typingDone = true;
      checkBothDone();
    });

    // 2) Try to play audio (hard 3s budget)
    playAudioWithBudget(candidates, AUDIO_BUDGET_MS).then(function (audio) {
      if (!audio) {
        // No audio available — just finish the audio phase
        audioDone = true;
        checkBothDone();
        return;
      }

      currentAudio = audio;

      // Safety cap: force finish after 15s max
      const maxDur = setTimeout(function () {
        if (!audioDone) { audioDone = true; checkBothDone(); }
      }, 15000);

      audio.addEventListener('ended', function () {
        clearTimeout(maxDur);
        if (!audioDone) { audioDone = true; checkBothDone(); }
      });
    });
  }

  // ============================================================
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
  // CARD MATH + STAR BAR
  // ============================================================
  const totalCards = 4 + level * 2;
  const pairs      = totalCards / 2;
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

  function formatTime(secs) {
    secs = Math.max(0, Math.floor(secs));
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

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
    topicEl.textContent = `Level ${level}: ${topicInfo.title}`;
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

  function renderCards() {
    if (!grid) return;
    grid.innerHTML = '';
    deck.forEach((pairIndex, index) => {
      const div = document.createElement('div');
      div.className = 'card-item';
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
      subjectLabel.textContent = subjectInfo.name;
      badge.appendChild(subjectLabel);
      back.appendChild(badge);
      inner.appendChild(back);
      const front = document.createElement('div');
      front.className = 'card-face card-face-front';
      const img = document.createElement('img');
      img.className = 'card-image';
      const cardName = getCardLabel(pairIndex);
      img.alt = `${topicInfo.title} — ${cardName}`;
      img.loading = 'eager';
      img.draggable = false;
      attachImageFallback(img, pairIndex);
      front.appendChild(img);
      inner.appendChild(front);
      div.appendChild(inner);
      div.addEventListener('click', () => onCardClick(index));
      grid.appendChild(div);
    });
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
      if (dialogActive) return;
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
    if (timerDisplay) timerDisplay.textContent = formatTime(secondsLeft);
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
    if (first.pair === second.pair) {
      first.el.classList.add('matched');
      second.el.classList.add('matched');
      matchedPairs++;
      flippedCards = [];
      const pairIndex = first.pair;
      const isLast    = (matchedPairs === pairs);
      speakCard(pairIndex, function () {
        isLocked = false;
        if (isLast) {
          stopTimer();
          setTimeout(showWin, 300);
        }
      });
    } else {
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
    const elapsed = GAME_DURATION - secondsLeft;
    if (winMoves) winMoves.textContent = moves;
    if (winTime)  winTime.textContent  = formatTime(elapsed);
    const wasCompletedBefore = wasLevelCompletedBefore();
    const starsEarned  = calculateStars();
    const pointsEarned = getPointsForStars(basePoints, starsEarned);

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
        starRow.innerHTML = `<i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>`;
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
    if (window.MMLeaderboard && window.MMPlayer) {
      const nickname = MMPlayer.getNickname();
      if (nickname) {
        MMLeaderboard.recordWin({
          nickname: nickname, subject: subject, level: level,
          stars: starsEarned, time: elapsed,
          pointsEarned: wasCompletedBefore ? 0 : pointsEarned
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
          nextLevelBtn.innerHTML = `Next Level <i class="fas fa-arrow-right ms-2"></i>`;
          nextLevelBtn.onclick = function () {
            window.location.href = `Gameplay-${subject}.html?level=${nextLevel}&subject=${subject}`;
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
                try { sessionStorage.setItem('mm_just_unlocked', JSON.stringify({ subject: subject, level: nextLevel })); } catch (e) {}
              }
              window.location.href = `../Level.html?subject=${subject}`;
            } else if (result.reason === 'not_enough_points') {
              alert(`⭐ Not enough points!\n\nLevel ${nextLevel} costs ${result.cost} points.\nYou have ${result.points} points.\n\nPlay more levels to earn points!`);
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
        nextLevelBtn.onclick = function () { window.location.href = `../Level.html?subject=${subject}`; };
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

  function goToLevels() { window.location.href = `../Level.html?subject=${subject}`; }

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
    if (wasRunningBeforePause && !gameFinished && timerInterval === null) startTimer();
    wasRunningBeforePause = false;
  }
  if (btnPause)       btnPause.addEventListener('click', openPause);
  if (btnPauseResume) btnPauseResume.addEventListener('click', closePause);
  if (btnPauseLevels) btnPauseLevels.addEventListener('click', goToLevels);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (pauseOverlay && pauseOverlay.classList.contains('show')) { closePause(); return; }
      if (winOverlay && winOverlay.classList.contains('show'))      { winOverlay.classList.remove('show'); return; }
      if (loseOverlay && loseOverlay.classList.contains('show'))    { loseOverlay.classList.remove('show'); return; }
      if (!gameFinished) { openPause(); return; }
      goToLevels();
    }
  });

  barPercent = BAR_START;
  renderCards();
  resetTimer();
  updateStarProgress();
});