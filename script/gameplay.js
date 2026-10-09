/* ================================================================
   GAMEPLAY.JS — MATCH MONSTER (per-player + SFX)
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

  // ============================================================
  // IMAGE LIBRARY
  // ============================================================
  const IMG = {
    macbook:      'photo-1517336714731-489689fd1ca8',
    laptopDesk:   'photo-1496181133206-80ce9b88a853',
    dualMonitors: 'photo-1541140532154-b024d705b90a',
    monitor:      'photo-1587829741301-dc798b83add3',
    keyboard:     'photo-1527814050087-3793815479db',
    mouse:        'photo-1527864550417-7fd91fc51a46',
    headphones:   'photo-1615663245857-ac93bb7c39e7',
    tablet:       'photo-1593642702749-b7d2a804fbcf',
    phone:        'photo-1527689368864-3a821dbccc34',
    circuit:      'photo-1518770660439-4636190af475',
    code1:        'photo-1461749280684-dccba630e2f6',
    code2:        'photo-1542831371-29b0f74f9713',
    binary:       'photo-1555949963-aa79dcee981c',
    codeEditor:   'photo-1498050108023-c5249f4df085',
    codeScreen:   'photo-1517694712202-14dd9538aa97',
    workspace:    'photo-1555617981-dac3880eac6e',
    gadgets:      'photo-1587145820266-a5951ee6f620',
    headset:      'photo-1518444065439-e933c06ce9cd',
    webcam:       'photo-1618366712010-f4ae9c647dcb',
    printer:      'photo-1547082299-de196ea013d6',
    laptopSide:   'photo-1531297484001-80022131f5a1',
    analytics:    'photo-1460925895917-afdab827c52f',
    chart:        'photo-1543286386-713bdd548da4',
    dashboard:    'photo-1551288049-bebda4e38f71',
    docs:         'photo-1454165804606-c3d57bc86b40',
    notebook:     'photo-1506784983877-45594efa4cbe',
    writing:      'photo-1434030216411-0b793f4b4173',
    deskWork:     'photo-1486312338219-ce68d2c6f44d',
    officeDesk:   'photo-1554224155-6726b3ff858f',
    uiDesign:     'photo-1531403009284-440f080d1e12',
    security:     'photo-1563986768609-322da13575f3',
    password:     'photo-1614064641938-3bbee52942c7',
    mountain:     'photo-1506905925346-21bda4d32df4',
    forest:       'photo-1502082553048-f009c37129b9',
    forestPath:   'photo-1441974231531-c6227db76b6e',
    lake:         'photo-1470071459604-3b5ec3a7fe05',
    river:        'photo-1444703686981-a3abbc4d4fe3',
    jungle:       'photo-1418065460487-3e41a6c84dc5',
    woods:        'photo-1447752875215-b2761acb3c5d',
    mountains2:   'photo-1501785888041-af3ef285b470',
    trees:        'photo-1469474968028-56623f02e42e',
    plant:        'photo-1416879595882-3373a0480b5b',
    leaves:       'photo-1466692476868-aef1dfb1e735',
    flower:       'photo-1490750967868-88aa4486c946',
    flower2:      'photo-1508610048659-a06b669e3321',
    flower3:      'photo-1470509037663-253afd7f0f51',
    lake2:        'photo-1439066615861-d1af74d74000',
    sunset:       'photo-1500673922987-e212871fec22',
    sunset2:      'photo-1495616811223-4d98c6e9c869',
    clouds:       'photo-1534088568595-a066f410bcda',
    clouds2:      'photo-1470252649378-9c29740c9fa8',
    sky:          'photo-1446776653964-20c1d3a81b06',
    stars:        'photo-1419242902214-272b3f66ee7a',
    earth:        'photo-1451187580459-43490279c0fa',
    lightning:    'photo-1502134249126-9f3755a50d78',
    rainbow:      'photo-1419833173245-f59e1b93f9ee',
    snow:         'photo-1495616811223-4d98c6e9c869',
    beach:        'photo-1507525428034-b723cf961d3e',
    ocean:        'photo-1505142468610-359e7d316be0',
    waterfall:    'photo-1432405972618-c60b0225b8f9',
    island:       'photo-1559827260-dc66d52bef19',
    dog:          'photo-1552053831-71594a27632d',
    cat:          'photo-1514888286974-6c03e2ca1dba',
    bird:         'photo-1441057206919-63d19fac2369',
    bird2:        'photo-1452570053594-1b985d6ea890',
    fish:         'photo-1524704654690-b56c05c78a00',
    lion:         'photo-1474511320723-9a56873867b5',
    elephant:     'photo-1547721064-da6cfb341d50',
    butterfly:    'photo-1425082661705-1834bfd09dca',
    horse:        'photo-1552728089-57bdde30beb3',
    turtle:       'photo-1595351298020-038700609878',
    penguin:      'photo-1470093851219-69951fcbb533',
    rabbit:       'photo-1507666405895-422eee7d517f',
    monkey:       'photo-1517849845537-4d257902454a',
    rice:         'photo-1490645935967-10de6ba17061',
    salad:        'photo-1546069901-ba9599a7e63c',
    vegetables:   'photo-1488459716781-31db52582fe9',
    meal:         'photo-1504674900247-0877df9cc836',
    juice:        'photo-1548839140-29a749e1cf4d',
    water:        'photo-1523362628745-0c100150b504',
    soup:         'photo-1512058564366-18510be2db19',
    snack:        'photo-1498837167922-ddd27525d352',
    coffee:       'photo-1509042239860-f550ce710b93',
    bread:        'photo-1509440159596-0249088772ff',
    fruit:        'photo-1519996529931-28324d5a630e',
    apple:        'photo-1568702846914-96b305d2aaeb',
    girlPortrait: 'photo-1517841905240-472988babdf9',
    child:        'photo-1503454537195-1dcabb73ffb9',
    kid:          'photo-1502086223501-7ea6ecd79368',
    face:         'photo-1509909756405-be0199881695',
    boyPortrait:  'photo-1521119989659-a83eee488004',
    toddler:      'photo-1596815064285-45ed8a9c0463',
    portrait:     'photo-1544005313-94ddf0286df2',
    siblings:     'photo-1503919545889-aef636e10ad4',
    children:     'photo-1519457431-44ccd64a579b',
    kidOutside:   'photo-1547036967-23d11aacaee0',
    family:       'photo-1511895426328-dc8714191300',
    motherChild:  'photo-1543342380-0d1a9d6ef3e7',
    fatherChild:  'photo-1609220136736-443140cffec6',
    grandparents: 'photo-1476703993599-0035a21b17a9',
    familyWalk:   'photo-1478061653917-455ba7f4a541',
    classroom:    'photo-1580582932707-520aed937b7b',
    books:        'photo-1497633762265-9d179a990aa6',
    teacher:      'photo-1503676260728-1c00da094a0b',
    students:     'photo-1509062522246-3755977927d7',
    schoolBldg:   'photo-1588072432836-e10032774350',
    studying:     'photo-1523240795612-9a054b0db644',
    library:      'photo-1427504494785-3a9ca7044f45',
    chalkboard:   'photo-1497486751825-1233686d5d80',
    pencils:      'photo-1503945438517-f65904a52ce6',
    schoolBag:    'photo-1509966756634-9c23dd6e6815',
    city:         'photo-1449824913935-59a10b8d2000',
    street:       'photo-1513635269975-59663e0ac1ad',
    community:    'photo-1499856871958-5b9627545d1a',
    neighborhood: 'photo-1526778548025-fa2f459cd5c1',
    church:       'photo-1519501025264-65ba15a82390',
    market:       'photo-1580910051074-3eb694886505',
    houses:       'photo-1541888946425-d81bb19240f5',
    park:         'photo-1499092346589-b9b6be3e94b2',
    buildings:    'photo-1477959858617-67f85cf4f1df',
    town:         'photo-1500534314209-a25ddb2bd429',
    doctor:       'photo-1612349317150-e413f6a5b16d',
    police:       'photo-1573496359142-b8d87734a5a2',
    firefighter:  'photo-1583454110551-21f2fa2afe61',
    nurse:        'photo-1559839734-2b71ea197ec2',
    farmer:       'photo-1581092918056-0c4c3acd3789',
    chef:         'photo-1531973576160-7125cd663d86',
    driver:       'photo-1615874959474-d609969a20ed',
    car:          'photo-1503376780353-7e6692767b70',
    bike:         'photo-1485965120184-e220f721d03e',
    train:        'photo-1474487548417-781cb71495f3',
    plane:        'photo-1436491865332-7a61a109cc05',
    boat:         'photo-1502680390469-be75c86b636f',
    bus:          'photo-1544620347-c4fd4a3d5957',
    phIslands:    'photo-1518509562904-e7ef99cdcc86',
    phProvince:   'photo-1531968455001-5c5272a41129',
    phLandmark:   'photo-1552832230-c0197dd311b5',
    riceTerraces: 'photo-1505228395891-9a51e7e86bf6',
    festival:     'photo-1516035069371-29a1b244cc32',
    culturalDance:'photo-1518548419970-58e3b4079ab2',
    tradition:    'photo-1583939003579-730e3918a45a',
    costume:      'photo-1533106418989-88406c7cc8ca',
    weaving:      'photo-1518998053901-5348d3961a04',
    localFood:    'photo-1504674900247-0877df9cc836',
    phHistory:    'photo-1519638831568-d9897f54ed69'
  };

  // ============================================================
  // TOPIC DATA
  // ============================================================
  const TOPIC_DATA = {
    computer: {
      1: { title: 'Computer Devices', cards: [
        { id: IMG.macbook,      name: 'Laptop' },
        { id: IMG.laptopDesk,   name: 'Desktop' },
        { id: IMG.tablet,       name: 'Tablet' },
        { id: IMG.phone,        name: 'Phone' },
        { id: IMG.monitor,      name: 'Monitor' },
        { id: IMG.keyboard,     name: 'Keyboard' },
        { id: IMG.mouse,        name: 'Mouse' },
        { id: IMG.headphones,   name: 'Headphones' },
        { id: IMG.webcam,       name: 'Webcam' },
        { id: IMG.circuit,      name: 'Circuit' },
        { id: IMG.printer,      name: 'Printer' },
        { id: IMG.headset,      name: 'Speaker' }
      ]},
      2: { title: 'Tech Accessories', cards: [
        { id: IMG.headphones,   name: 'Headphones' },
        { id: IMG.mouse,        name: 'Mouse' },
        { id: IMG.keyboard,     name: 'Keyboard' },
        { id: IMG.webcam,       name: 'Webcam' },
        { id: IMG.headset,      name: 'Speaker' },
        { id: IMG.gadgets,      name: 'Cable' },
        { id: IMG.dashboard,    name: 'Charger' },
        { id: IMG.monitor,      name: 'Screen' },
        { id: IMG.uiDesign,     name: 'Stand' },
        { id: IMG.analytics,    name: 'Adapter' },
        { id: IMG.tablet,       name: 'Tablet Case' },
        { id: IMG.laptopSide,   name: 'Port' }
      ]},
      3: { title: 'Work Desk Setup', cards: [
        { id: IMG.macbook,      name: 'Laptop' },
        { id: IMG.monitor,      name: 'Monitor' },
        { id: IMG.keyboard,     name: 'Keyboard' },
        { id: IMG.mouse,        name: 'Mouse' },
        { id: IMG.notebook,     name: 'Notebook' },
        { id: IMG.writing,      name: 'Pen' },
        { id: IMG.coffee,       name: 'Coffee' },
        { id: IMG.officeDesk,   name: 'Lamp' },
        { id: IMG.deskWork,     name: 'Chair' },
        { id: IMG.workspace,    name: 'Desk' },
        { id: IMG.docs,         name: 'Paper' },
        { id: IMG.plant,        name: 'Plant' }
      ]},
      4: { title: 'Coding & Screens', cards: [
        { id: IMG.code1,        name: 'Code' },
        { id: IMG.code2,        name: 'Editor' },
        { id: IMG.codeEditor,   name: 'Terminal' },
        { id: IMG.binary,       name: 'Binary' },
        { id: IMG.codeScreen,   name: 'Screen' },
        { id: IMG.monitor,      name: 'Monitor' },
        { id: IMG.macbook,      name: 'Laptop' },
        { id: IMG.dualMonitors, name: 'Display' },
        { id: IMG.uiDesign,     name: 'Window' },
        { id: IMG.chart,        name: 'Chart' },
        { id: IMG.analytics,    name: 'Data' },
        { id: IMG.dashboard,    name: 'UI' }
      ]},
      5: { title: 'Mobile Devices', cards: [
        { id: IMG.phone,        name: 'Phone' },
        { id: IMG.tablet,       name: 'Tablet' },
        { id: IMG.headphones,   name: 'Earbuds' },
        { id: IMG.headset,      name: 'Smartwatch' },
        { id: IMG.gadgets,      name: 'Charger' },
        { id: IMG.workspace,    name: 'Case' },
        { id: IMG.monitor,      name: 'Screen' },
        { id: IMG.webcam,       name: 'Camera' },
        { id: IMG.keyboard,     name: 'Button' },
        { id: IMG.uiDesign,     name: 'App' },
        { id: IMG.codeScreen,   name: 'Wallpaper' },
        { id: IMG.password,     name: 'Lock' }
      ]},
      6: { title: 'Music & Audio', cards: [
        { id: IMG.headphones,   name: 'Headphones' },
        { id: IMG.headset,      name: 'Speaker' },
        { id: IMG.webcam,       name: 'Microphone' },
        { id: IMG.workspace,    name: 'Audio' },
        { id: IMG.code1,        name: 'Studio' },
        { id: IMG.code2,        name: 'Record' },
        { id: IMG.analytics,    name: 'Mixer' },
        { id: IMG.dashboard,    name: 'Amp' },
        { id: IMG.uiDesign,     name: 'Player' },
        { id: IMG.gadgets,      name: 'Device' },
        { id: IMG.headset,      name: 'Sound' },
        { id: IMG.monitor,      name: 'Screen' }
      ]},
      7: { title: 'Photography', cards: [
        { id: IMG.webcam,       name: 'Camera' },
        { id: IMG.uiDesign,     name: 'Lens' },
        { id: IMG.workspace,    name: 'Tripod' },
        { id: IMG.gadgets,      name: 'Photo' },
        { id: IMG.dashboard,    name: 'Flash' },
        { id: IMG.analytics,    name: 'Zoom' },
        { id: IMG.monitor,      name: 'Filter' },
        { id: IMG.codeScreen,   name: 'Album' },
        { id: IMG.sunset,       name: 'Light' },
        { id: IMG.portrait,     name: 'Shutter' },
        { id: IMG.flower,       name: 'Frame' },
        { id: IMG.books,        name: 'Print' }
      ]},
      8: { title: 'Gaming', cards: [
        { id: IMG.workspace,    name: 'Console' },
        { id: IMG.monitor,      name: 'Screen' },
        { id: IMG.headset,      name: 'Headset' },
        { id: IMG.mouse,        name: 'Joystick' },
        { id: IMG.keyboard,     name: 'Buttons' },
        { id: IMG.code1,        name: 'Arcade' },
        { id: IMG.binary,       name: 'Pixel' },
        { id: IMG.code2,        name: 'Level' },
        { id: IMG.uiDesign,     name: 'Player' },
        { id: IMG.analytics,    name: 'Score' },
        { id: IMG.dashboard,    name: 'Quest' },
        { id: IMG.macbook,      name: 'Controller' }
      ]},
      9: { title: 'Charging & Cables', cards: [
        { id: IMG.gadgets,      name: 'USB' },
        { id: IMG.workspace,    name: 'Charger' },
        { id: IMG.keyboard,     name: 'Cable' },
        { id: IMG.laptopSide,   name: 'Port' },
        { id: IMG.phone,        name: 'Battery' },
        { id: IMG.tablet,       name: 'Plug' },
        { id: IMG.monitor,      name: 'Adapter' },
        { id: IMG.circuit,      name: 'Power' },
        { id: IMG.officeDesk,   name: 'Socket' },
        { id: IMG.analytics,    name: 'Wire' },
        { id: IMG.docs,         name: 'Strip' },
        { id: IMG.dashboard,    name: 'Hub' }
      ]},
      10: { title: 'Internet & Network', cards: [
        { id: IMG.circuit,      name: 'Router' },
        { id: IMG.analytics,    name: 'Wifi' },
        { id: IMG.dashboard,    name: 'Modem' },
        { id: IMG.binary,       name: 'Antenna' },
        { id: IMG.code1,        name: 'Server' },
        { id: IMG.clouds,       name: 'Cloud' },
        { id: IMG.earth,        name: 'Signal' },
        { id: IMG.security,     name: 'Speed' },
        { id: IMG.password,     name: 'Data' },
        { id: IMG.uiDesign,     name: 'Web' },
        { id: IMG.code2,        name: 'Link' },
        { id: IMG.codeScreen,   name: 'Network' }
      ]}
    },
    science: {
      1: { title: 'Pets & Farm Animals', cards: [
        { id: IMG.dog,          name: 'Dog' },
        { id: IMG.cat,          name: 'Cat' },
        { id: IMG.bird,         name: 'Bird' },
        { id: IMG.rabbit,       name: 'Rabbit' },
        { id: IMG.horse,        name: 'Horse' },
        { id: IMG.fish,         name: 'Fish' },
        { id: IMG.turtle,       name: 'Turtle' },
        { id: IMG.penguin,      name: 'Duck' },
        { id: IMG.monkey,       name: 'Monkey' },
        { id: IMG.bird2,        name: 'Chicken' },
        { id: IMG.butterfly,    name: 'Butterfly' },
        { id: IMG.elephant,     name: 'Elephant' }
      ]},
      2: { title: 'Wild Animals', cards: [
        { id: IMG.lion,         name: 'Lion' },
        { id: IMG.elephant,     name: 'Elephant' },
        { id: IMG.monkey,       name: 'Monkey' },
        { id: IMG.horse,        name: 'Zebra' },
        { id: IMG.penguin,      name: 'Penguin' },
        { id: IMG.turtle,       name: 'Turtle' },
        { id: IMG.dog,          name: 'Wolf' },
        { id: IMG.cat,          name: 'Tiger' },
        { id: IMG.rabbit,       name: 'Rabbit' },
        { id: IMG.bird,         name: 'Eagle' },
        { id: IMG.bird2,        name: 'Owl' },
        { id: IMG.fish,         name: 'Bear' }
      ]},
      3: { title: 'Birds & Bugs', cards: [
        { id: IMG.bird,         name: 'Bird' },
        { id: IMG.bird2,        name: 'Parrot' },
        { id: IMG.butterfly,    name: 'Butterfly' },
        { id: IMG.flower,       name: 'Bee' },
        { id: IMG.flower2,      name: 'Ladybug' },
        { id: IMG.flower3,      name: 'Dragonfly' },
        { id: IMG.leaves,       name: 'Ant' },
        { id: IMG.plant,        name: 'Cricket' },
        { id: IMG.penguin,      name: 'Owl' },
        { id: IMG.cat,          name: 'Spider' },
        { id: IMG.turtle,       name: 'Snail' },
        { id: IMG.jungle,       name: 'Beetle' }
      ]},
      4: { title: 'Plants & Trees', cards: [
        { id: IMG.trees,        name: 'Tree' },
        { id: IMG.leaves,       name: 'Leaf' },
        { id: IMG.flower,       name: 'Flower' },
        { id: IMG.plant,        name: 'Grass' },
        { id: IMG.forest,       name: 'Bush' },
        { id: IMG.jungle,       name: 'Fern' },
        { id: IMG.woods,        name: 'Branch' },
        { id: IMG.forestPath,   name: 'Trunk' },
        { id: IMG.flower2,      name: 'Seed' },
        { id: IMG.flower3,      name: 'Fruit' },
        { id: IMG.lake,         name: 'Root' },
        { id: IMG.lake2,        name: 'Vine' }
      ]},
      5: { title: 'Beautiful Flowers', cards: [
        { id: IMG.flower,       name: 'Rose' },
        { id: IMG.flower2,      name: 'Tulip' },
        { id: IMG.flower3,      name: 'Sunflower' },
        { id: IMG.plant,        name: 'Daisy' },
        { id: IMG.leaves,       name: 'Orchid' },
        { id: IMG.trees,        name: 'Lily' },
        { id: IMG.jungle,       name: 'Lotus' },
        { id: IMG.forest,       name: 'Hibiscus' },
        { id: IMG.lake,         name: 'Jasmine' },
        { id: IMG.lake2,        name: 'Magnolia' },
        { id: IMG.woods,        name: 'Peony' },
        { id: IMG.forestPath,   name: 'Iris' }
      ]},
      6: { title: 'Weather & Sky', cards: [
        { id: IMG.sunset,       name: 'Sun' },
        { id: IMG.clouds,       name: 'Cloud' },
        { id: IMG.clouds2,      name: 'Rain' },
        { id: IMG.rainbow,      name: 'Rainbow' },
        { id: IMG.lightning,    name: 'Lightning' },
        { id: IMG.snow,         name: 'Snow' },
        { id: IMG.sky,          name: 'Sky' },
        { id: IMG.sunset2,      name: 'Sunset' },
        { id: IMG.stars,        name: 'Wind' },
        { id: IMG.mountain,     name: 'Storm' },
        { id: IMG.mountains2,   name: 'Fog' },
        { id: IMG.forestPath,   name: 'Dawn' }
      ]},
      7: { title: 'Space & Stars', cards: [
        { id: IMG.stars,        name: 'Star' },
        { id: IMG.earth,        name: 'Moon' },
        { id: IMG.sky,          name: 'Planet' },
        { id: IMG.clouds2,      name: 'Galaxy' },
        { id: IMG.lightning,    name: 'Comet' },
        { id: IMG.sunset,       name: 'Meteor' },
        { id: IMG.clouds,       name: 'Nebula' },
        { id: IMG.sunset2,      name: 'Eclipse' },
        { id: IMG.rainbow,      name: 'Orbit' },
        { id: IMG.mountain,     name: 'Cosmos' },
        { id: IMG.mountains2,   name: 'Aurora' },
        { id: IMG.snow,         name: 'Sky' }
      ]},
      8: { title: 'Water & Oceans', cards: [
        { id: IMG.ocean,        name: 'Ocean' },
        { id: IMG.river,        name: 'River' },
        { id: IMG.lake,         name: 'Lake' },
        { id: IMG.waterfall,    name: 'Waterfall' },
        { id: IMG.beach,        name: 'Beach' },
        { id: IMG.island,       name: 'Island' },
        { id: IMG.lake2,        name: 'Pond' },
        { id: IMG.clouds,       name: 'Wave' },
        { id: IMG.sunset,       name: 'Bay' },
        { id: IMG.earth,        name: 'Reef' },
        { id: IMG.forestPath,   name: 'Stream' },
        { id: IMG.jungle,       name: 'Coast' }
      ]},
      9: { title: 'Mountains & Land', cards: [
        { id: IMG.mountain,     name: 'Mountain' },
        { id: IMG.mountains2,   name: 'Hill' },
        { id: IMG.forest,       name: 'Valley' },
        { id: IMG.jungle,       name: 'Cliff' },
        { id: IMG.woods,        name: 'Canyon' },
        { id: IMG.earth,        name: 'Plateau' },
        { id: IMG.snow,         name: 'Glacier' },
        { id: IMG.sunset,       name: 'Desert' },
        { id: IMG.lake,         name: 'Rock' },
        { id: IMG.forestPath,   name: 'Cave' },
        { id: IMG.trees,        name: 'Peak' },
        { id: IMG.river,        name: 'Waterfall' }
      ]},
      10: { title: 'Food & Fruits', cards: [
        { id: IMG.apple,        name: 'Apple' },
        { id: IMG.fruit,        name: 'Fruit' },
        { id: IMG.vegetables,   name: 'Vegetables' },
        { id: IMG.salad,        name: 'Salad' },
        { id: IMG.bread,        name: 'Bread' },
        { id: IMG.rice,         name: 'Rice' },
        { id: IMG.soup,         name: 'Soup' },
        { id: IMG.juice,        name: 'Juice' },
        { id: IMG.water,        name: 'Water' },
        { id: IMG.coffee,       name: 'Coffee' },
        { id: IMG.meal,         name: 'Meal' },
        { id: IMG.snack,        name: 'Snack' }
      ]}
    },
    ap: {
      1: { title: 'Ako at Pamilya', cards: [
        { id: IMG.child,        name: 'Bata' },
        { id: IMG.girlPortrait, name: 'Nanay' },
        { id: IMG.boyPortrait,  name: 'Tatay' },
        { id: IMG.grandparents, name: 'Lolo at Lola' },
        { id: IMG.siblings,     name: 'Kapatid' },
        { id: IMG.toddler,      name: 'Sanggol' },
        { id: IMG.family,       name: 'Pamilya' },
        { id: IMG.motherChild,  name: 'Ina' },
        { id: IMG.fatherChild,  name: 'Ama' },
        { id: IMG.children,     name: 'Mga Anak' },
        { id: IMG.familyWalk,   name: 'Tahanan' },
        { id: IMG.face,         name: 'Larawan' }
      ]},
      2: { title: 'Mga Kaibigan', cards: [
        { id: IMG.child,        name: 'Bata' },
        { id: IMG.toddler,      name: 'Sanggol' },
        { id: IMG.boyPortrait,  name: 'Kuya' },
        { id: IMG.girlPortrait, name: 'Ate' },
        { id: IMG.kid,          name: 'Kalaro' },
        { id: IMG.kidOutside,   name: 'Barkada' },
        { id: IMG.children,     name: 'Batang Babae' },
        { id: IMG.siblings,     name: 'Batang Lalaki' },
        { id: IMG.face,         name: 'Ngiti' },
        { id: IMG.portrait,     name: 'Tawa' },
        { id: IMG.family,       name: 'Kamay' },
        { id: IMG.motherChild,  name: 'Yakap' }
      ]},
      3: { title: 'Paaralan', cards: [
        { id: IMG.teacher,      name: 'Guro' },
        { id: IMG.students,     name: 'Estudyante' },
        { id: IMG.books,        name: 'Aklat' },
        { id: IMG.pencils,      name: 'Lapis' },
        { id: IMG.schoolBag,    name: 'Bag' },
        { id: IMG.classroom,    name: 'Silid' },
        { id: IMG.library,      name: 'Aklatan' },
        { id: IMG.studying,     name: 'Klase' },
        { id: IMG.chalkboard,   name: 'Blackboard' },
        { id: IMG.docs,         name: 'Papel' },
        { id: IMG.officeDesk,   name: 'Mesa' },
        { id: IMG.schoolBldg,   name: 'Paaralan' }
      ]},
      4: { title: 'Komunidad', cards: [
        { id: IMG.houses,       name: 'Bahay' },
        { id: IMG.church,       name: 'Simbahan' },
        { id: IMG.market,       name: 'Palengke' },
        { id: IMG.park,         name: 'Parke' },
        { id: IMG.schoolBldg,   name: 'Paaralan' },
        { id: IMG.street,       name: 'Kalsada' },
        { id: IMG.buildings,    name: 'Ospital' },
        { id: IMG.city,         name: 'Gusali' },
        { id: IMG.town,         name: 'Lugar' },
        { id: IMG.neighborhood, name: 'Kapitbahay' },
        { id: IMG.community,    name: 'Bakuran' },
        { id: IMG.community,    name: 'Tindahan' }
      ]},
      5: { title: 'Katulong sa Komunidad', cards: [
        { id: IMG.doctor,       name: 'Doktor' },
        { id: IMG.nurse,        name: 'Nars' },
        { id: IMG.police,       name: 'Pulis' },
        { id: IMG.teacher,      name: 'Guro' },
        { id: IMG.firefighter,  name: 'Bumbero' },
        { id: IMG.farmer,       name: 'Magsasaka' },
        { id: IMG.chef,         name: 'Kusinero' },
        { id: IMG.driver,       name: 'Drayber' },
        { id: IMG.market,       name: 'Tindera' },
        { id: IMG.farmer,       name: 'Manggagawa' },
        { id: IMG.doctor,       name: 'Inhinyero' },
        { id: IMG.market,       name: 'Sastre' }
      ]},
      6: { title: 'Transportasyon', cards: [
        { id: IMG.car,          name: 'Kotse' },
        { id: IMG.bus,          name: 'Bus' },
        { id: IMG.bike,         name: 'Bisikleta' },
        { id: IMG.train,        name: 'Tren' },
        { id: IMG.plane,        name: 'Eroplano' },
        { id: IMG.boat,         name: 'Bangka' },
        { id: IMG.street,       name: 'Jeep' },
        { id: IMG.city,         name: 'Tricycle' },
        { id: IMG.street,       name: 'Motorsiklo' },
        { id: IMG.boat,         name: 'Barko' },
        { id: IMG.car,          name: 'Trak' },
        { id: IMG.bike,         name: 'Karwahe' }
      ]},
      7: { title: 'Pook sa Pilipinas', cards: [
        { id: IMG.phIslands,    name: 'Isla' },
        { id: IMG.mountain,     name: 'Bundok' },
        { id: IMG.ocean,        name: 'Dagat' },
        { id: IMG.river,        name: 'Ilog' },
        { id: IMG.riceTerraces, name: 'Rice Terraces' },
        { id: IMG.phLandmark,   name: 'Bulkang Mayon' },
        { id: IMG.beach,        name: 'Beach' },
        { id: IMG.church,       name: 'Simbahan' },
        { id: IMG.buildings,    name: 'Gusali' },
        { id: IMG.town,         name: 'Bayan' },
        { id: IMG.phProvince,   name: 'Lalawigan' },
        { id: IMG.market,       name: 'Palengke' }
      ]},
      8: { title: 'Pagkain ng Pilipino', cards: [
        { id: IMG.rice,         name: 'Kanin' },
        { id: IMG.meal,         name: 'Adobo' },
        { id: IMG.soup,         name: 'Sinigang' },
        { id: IMG.localFood,    name: 'Lechon' },
        { id: IMG.juice,        name: 'Halo-halo' },
        { id: IMG.salad,        name: 'Pancit' },
        { id: IMG.snack,        name: 'Lumpia' },
        { id: IMG.bread,        name: 'Bibingka' },
        { id: IMG.fruit,        name: 'Mango' },
        { id: IMG.bread,        name: 'Pandesal' },
        { id: IMG.snack,        name: 'Kakanin' },
        { id: IMG.vegetables,   name: 'Gulay' }
      ]},
      9: { title: 'Pagdiriwang at Kultura', cards: [
        { id: IMG.festival,     name: 'Pista' },
        { id: IMG.culturalDance,name: 'Sayaw' },
        { id: IMG.costume,      name: 'Kasuotan' },
        { id: IMG.culturalDance,name: 'Musika' },
        { id: IMG.tradition,    name: 'Parol' },
        { id: IMG.festival,     name: 'Christmas' },
        { id: IMG.tradition,    name: 'Simbang Gabi' },
        { id: IMG.festival,     name: 'Fiesta' },
        { id: IMG.culturalDance,name: 'Handaan' },
        { id: IMG.weaving,      name: 'Simbolo' },
        { id: IMG.phLandmark,   name: 'Watawat' },
        { id: IMG.tradition,    name: 'Handog' }
      ]},
      10: { title: 'Kalikasan ng Pilipinas', cards: [
        { id: IMG.ocean,        name: 'Dagat' },
        { id: IMG.island,       name: 'Isla' },
        { id: IMG.mountain,     name: 'Bundok' },
        { id: IMG.mountains2,   name: 'Bulkang' },
        { id: IMG.riceTerraces, name: 'Palayan' },
        { id: IMG.forest,       name: 'Gubat' },
        { id: IMG.river,        name: 'Ilog' },
        { id: IMG.waterfall,    name: 'Talon' },
        { id: IMG.beach,        name: 'Baybayin' },
        { id: IMG.sunset,       name: 'Sunset' },
        { id: IMG.riceTerraces, name: 'Rice Field' },
        { id: IMG.phIslands,    name: 'Kapuluan' }
      ]}
    }
  };

  const subjectTopics = TOPIC_DATA[subject] || TOPIC_DATA.computer;
  const topicInfo = subjectTopics[level] || subjectTopics[1];

  function unsplashUrl(id, w, h) {
    return `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&auto=format&q=70`;
  }
  function getImageUrlForPair(pairIndex) {
    const entry = topicInfo.cards[pairIndex % topicInfo.cards.length];
    return unsplashUrl(entry.id, 400, 500);
  }
  function getBackupImageUrlForPair(pairIndex) {
    const idx = (pairIndex + 1) % topicInfo.cards.length;
    const entry = topicInfo.cards[idx];
    return unsplashUrl(entry.id, 400, 500);
  }
  function getCardLabel(pairIndex) {
    const entry = topicInfo.cards[pairIndex % topicInfo.cards.length];
    return entry ? entry.name : topicInfo.title;
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
              font-family="Arial, sans-serif" font-size="22" font-weight="bold"
              fill="#FFD700">${safe}</text>
      </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  function attachImageFallback(imgEl, pairIndex) {
    let stage = 0;
    const label = getCardLabel(pairIndex);
    imgEl.addEventListener('error', function handleErr() {
      stage++;
      if (stage === 1) {
        imgEl.src = getBackupImageUrlForPair(pairIndex);
      } else {
        imgEl.removeEventListener('error', handleErr);
        imgEl.src = makePlaceholderDataUri(label);
      }
    });
  }

  // ============================================================
  // SAFETY CHECKS — per-player
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
  // CARD MATH
  // ============================================================
  const totalCards = 4 + level * 2;
  const pairs      = totalCards / 2;

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

      const img = document.createElement('img');
      img.className = 'card-image';
      const cardName = getCardLabel(pairIndex);
      img.alt = `${topicInfo.title} — ${cardName}`;
      img.loading = 'lazy';
      img.draggable = false;

      attachImageFallback(img, pairIndex);
      img.src = getImageUrlForPair(pairIndex);
      front.appendChild(img);

      inner.appendChild(front);
      div.appendChild(inner);
      div.addEventListener('click', () => onCardClick(index));
      grid.appendChild(div);
    });
  }

  function updateStarProgress() {
    if (!starProgressFill) return;
    const pct = getBarPercentage(moves, pairs);
    starProgressFill.style.width = pct + '%';
    const starsEarned = getStarCountFromBar(pct);
    starProgressStars.forEach((star, i) => {
      star.classList.toggle('filled', i < starsEarned);
    });
  }

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
      // 🔊 Wrong card SFX
      if (window.MMSfx && MMSfx.wrong) MMSfx.wrong();

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

    // 🔊 Game over SFX
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
        : parseInt(pGet('starsTotal', '0'), 10) || 0;
      winStarsEarned.textContent = total;
    }

    if (winOverlay) winOverlay.classList.add('show');
    celebrateWin();

    if (typeof window.completeLevel === 'function') {
      window.completeLevel(subject, level);
    }

    // Save to leaderboard
    if (window.MMLeaderboard && window.MMPlayer) {
      const nickname = MMPlayer.getNickname();
      if (nickname) {
        MMLeaderboard.recordWin({
          nickname:     nickname,
          subject:      subject,
          level:        level,
          stars:        starsEarned,
          time:         elapsed,
          pointsEarned: wasCompletedBefore ? 0 : pointsEarned
        });
        MMLeaderboard.prune();
      }
    }

    if (typeof window.updatePlayerLevelBox === 'function') {
      window.updatePlayerLevelBox();
    }

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

  function restartLevel() {
    try {
      const completed = pJSON('completed_' + subject, []);
      const filtered = Array.isArray(completed)
        ? completed.filter(function (l) { return l !== level; })
        : [];
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

    if (typeof window.updatePlayerLevelBox === 'function') {
      window.updatePlayerLevelBox();
    }

    window.location.reload();
  }

  const btnRestartLevel = document.getElementById('btnRestartLevel');
  if (btnRestartLevel) {
    btnRestartLevel.addEventListener('click', restartLevel);
  }

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

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (pauseOverlay && pauseOverlay.classList.contains('show')) { closePause(); return; }
      if (winOverlay && winOverlay.classList.contains('show'))      { winOverlay.classList.remove('show'); return; }
      if (loseOverlay && loseOverlay.classList.contains('show'))    { loseOverlay.classList.remove('show'); return; }
      if (!gameFinished) { openPause(); return; }
      goToLevels();
    }
  });

  renderCards();
  resetTimer();
  updateStarProgress();
});