/* ================================================================
   ASSET-LOADER.JS — Silent background preloader
   ----------------------------------------------------------------
   Runs quietly in the background. No visible UI.
   By the time the player taps a card, the image is already cached.

   Exposes:
     window.assetLoader.ready    (Promise)
     window.assetLoader.progress (0–100)
     window 'assetsLoaded' event
   ================================================================ */

(function () {
  'use strict';

  /* ---------- Detect folder depth ---------- */
  const inGameplayFolder = /\/Gameplay\//i.test(window.location.pathname);
  const base = inGameplayFolder ? '../' : '';

  /* ---------- Detect current page ---------- */
  const path = window.location.pathname.toLowerCase();
  const isSubject  = /subject\.html$/.test(path);
  const isLevel    = /level\.html$/.test(path);
  const isGameplay = /gameplay-/.test(path);

  /* ============================================================
     SUBJECT IMAGES
     ============================================================ */
  const SUBJECT_IMAGES = [
    base + 'Assets/subject/computer_t.png',
    base + 'Assets/subject/sci_sub.png',
    base + 'Assets/subject/ap_sub.png'
  ];

  /* ============================================================
     LEVEL MAP ASSETS
     ============================================================ */
  const LEVEL_IMAGES = [
    base + 'Assets/Platform_Island.png',
    base + 'Assets/jojoma.png',
    base + 'Assets/island_castle.png',
    base + 'Assets/single_island.png'
  ];

  /* ============================================================
     GAMEPLAY TOPIC IMAGES — same maps as gameplay.js
     ============================================================ */
  const SUBJECT_FOLDER = {
    computer: 'EPP',
    science:  'SCIENCE',
    ap:       'AP'
  };

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

  const FILE_MAP = {
    /* --- AP --- */
    'ap:1:Pacific Ocean':'pacific ocean','ap:1:Pasig River':'pasig river','ap:1:Laguna de Bay':'laguna debay',
    'ap:2:Mount Apo':'Mount-Apo-','ap:2:Mayon Volcano':'mayon','ap:2:Chocolate Hills':'chocolate hills','ap:2:Central Luzon Plain':'Central Luzon Plain',
    'ap:3:Malaysia':'malaysia','ap:3:Indonesia':'indonesia','ap:3:Vietnam':'Vietnam','ap:3:Thailand':'thailand','ap:3:Brunei':'brunei',
    'ap:4:Weather':'weather','ap:4:Climate':'climate','ap:4:Temperature':'temperature','ap:4:Humidity':'humidity','ap:4:Rainfall':'rainfall','ap:4:PAGASA':'pagasa',
    /* --- EPP --- */
    'computer:1:Google':'google','computer:1:Yahoo':'yahoo','computer:1:Lycos':'lycos',
    'computer:2:Search box':'search box','computer:2:Search button':'search button','computer:2:Search results':'search result',
    'computer:3:Safari':'safari','computer:3:Opera':'opera','computer:3:Microsoft Edge':'microsoft edge','computer:3:Mozilla Firefox':'mozilla firefox','computer:3:Google Chrome':'google chrome',
    'computer:4:Email':'email','computer:4:Chat':'chat','computer:4:Instant message':'Instant message','computer:4:Video call':'videocall','computer:4:Social media':'social media','computer:4:Online class':'onlineclass',
    'computer:5:Kind words':'kind words','computer:5:Ask permission':'_Ask permission before posting others_ photos (do)','computer:5:Be respectful':'_Be respectful in online class (do)__','computer:5:Typing in ALL CAPS':'Typing in ALL CAPS (don_t)','computer:5:Sharing password':'Sharing password_','computer:5:Using bad words':'Using bad words_','computer:5:Fake news':'fake news',
    /* --- SCIENCE --- */
    'science:1:Rock':'rock','science:1:Water':'Water',
    'science:2:Chair':'Chair','science:2:Desk':'Desk','science:2:Bag':'Bag','science:2:Shoes':'Shoes',
    'science:3:Water':'water','science:3:Coffee':'coffee','science:3:Chocolate drink':'chocolate_','science:3:Juice':'juice','science:3:Milk':'milk',
    'science:4:Air':'air','science:4:Wind':'wind','science:4:Oxygen':'Oxygen_','science:4:Carbon dioxide':'carbon','science:4:Water vapor':'vapor','science:4:Helium':'helium_',
    'science:5:Mass':'mass_','science:5:Weight':'weight_','science:5:Volume':'volume_','science:5:Shape':'shape_','science:5:Color':'color','science:5:Texture':'texture_','science:5:Smell':'smell',
    'science:6:Platform balance':'platform_','science:6:Triple beam balance':'triple beam','science:6:Weighing scale':'weighted scale','science:6:Graduated cylinder':'cylinder_','science:6:Meter stick':'meter stick_','science:6:Thermometer':'thermometer_','science:6:Measuring cup':'measuring cup',
    'science:7:Gram':'gram','science:7:Kilogram':'kg','science:7:Milliliter':'milliliter_','science:7:Liter':'liter','science:7:Centimeter':'cm','science:7:Meter':'meter','science:7:Degree Celsius':'degree','science:7:Cubic meter':'cubic meter',
    'science:8:Melting':'melting','science:8:Freezing':'freeze','science:8:Evaporation':'evaporation_','science:8:Condensation':'condensation_','science:8:Boiling':'boiling_','science:8:Cutting paper':'cut','science:8:Tearing paper':'tearing','science:8:Crushing a can':'can','science:8:Dissolving sugar':'sugar','science:8:Folding paper':'fold',
    'science:9:Mouth':'mouth','science:9:Teeth':'teeth_','science:9:Salivary glands':'glands','science:9:Esophagus':'esophagus_','science:9:Liver':'liver','science:9:Gallbladder':'gallbladder','science:9:Pancreas':'pancreas','science:9:Small intestine':'small','science:9:Large intestine':'large_','science:9:Rectum':'rectum',
    'science:10:Nose':'nose','science:10:Nasal cavity':'nasal','science:10:Mouth':'mouth','science:10:Pharynx':'pharxn','science:10:Larynx':'larynx','science:10:Trachea':'trachea','science:10:Bronchi':'bronchi','science:10:Bronchioles':'bronchiolos','science:10:Alveoli':'alveolar_','science:10:Lungs':'lungs','science:10:Diaphragm':'diaphragm_','science:10:Ribs':'ribs'
  };

  const TOPIC_CARDS = {
    computer: {
      1: ['Google','Yahoo','Lycos'],
      2: ['Search box','Search button','Search results','Tabs'],
      3: ['Safari','Opera','Microsoft Edge','Mozilla Firefox','Google Chrome'],
      4: ['Email','Chat','Instant message','Video call','Social media','Online class'],
      5: ['Kind words','Ask permission','Be respectful','Typing in ALL CAPS','Sharing password','Using bad words','Fake news']
    },
    science: {
      1: ['Rock','Water','Air'],
      2: ['Chair','Desk','Bag','Shoes'],
      3: ['Water','Coffee','Chocolate drink','Juice','Milk'],
      4: ['Air','Wind','Oxygen','Carbon dioxide','Water vapor','Helium'],
      5: ['Mass','Weight','Volume','Shape','Color','Texture','Smell'],
      6: ['Platform balance','Triple beam balance','Weighing scale','Graduated cylinder','Meter stick','Thermometer','Measuring cup'],
      7: ['Gram','Kilogram','Milliliter','Liter','Centimeter','Meter','Degree Celsius','Cubic meter'],
      8: ['Melting','Freezing','Evaporation','Condensation','Boiling','Cutting paper','Tearing paper','Crushing a can','Dissolving sugar','Folding paper'],
      9: ['Mouth','Teeth','Salivary glands','Esophagus','Liver','Gallbladder','Pancreas','Small intestine','Large intestine','Rectum'],
      10:['Nose','Nasal cavity','Mouth','Pharynx','Larynx','Trachea','Bronchi','Bronchioles','Alveoli','Lungs','Diaphragm','Ribs']
    },
    ap: {
      1: ['Pacific Ocean','Pasig River','Laguna de Bay'],
      2: ['Mount Apo','Mayon Volcano','Chocolate Hills','Central Luzon Plain'],
      3: ['Malaysia','Indonesia','Vietnam','Thailand','Brunei'],
      4: ['Weather','Climate','Temperature','Humidity','Rainfall','PAGASA']
    }
  };

  /* ============================================================
     BUILD CANDIDATES FOR A CARD
     ============================================================ */
  function buildLocalCandidates(subject, level, label) {
    const folder = SUBJECT_FOLDER[subject];
    if (!folder) return [];

    const levelFolders = (LEVEL_FOLDER_VARIANTS[subject] ||
      LEVEL_FOLDER_VARIANTS.computer)(level);

    const mapKey = subject + ':' + level + ':' + label;
    const mapped = FILE_MAP[mapKey];
    if (!mapped) return [];

    const candidates = [];
    for (const lvl of levelFolders) {
      for (const ext of IMG_EXTS) {
        candidates.push(base + `Assets/topic/${folder}/${lvl}/${mapped}.${ext}`);
      }
    }
    return candidates;
  }

  /* ============================================================
     TRY EACH CANDIDATE UNTIL ONE LOADS
     ============================================================ */
  function tryLoadImage(candidates) {
    return new Promise((resolve) => {
      if (!candidates.length) { resolve(null); return; }

      let i = 0;
      function attempt() {
        if (i >= candidates.length) { resolve(null); return; }
        const src = candidates[i++];
        const img = new Image();
        img.decoding = 'async';
        img.onload  = () => resolve(src);
        img.onerror = () => attempt();
        img.src = src;
      }
      attempt();
    });
  }

  /* ============================================================
     BUILD QUEUE FOR CURRENT PAGE
     ============================================================ */
  function getImageQueue() {
    if (isSubject) {
      return SUBJECT_IMAGES.map(src => ({ type: 'direct', src }));
    }

    if (isLevel) {
      return LEVEL_IMAGES.map(src => ({ type: 'direct', src }));
    }

    if (isGameplay) {
      const urlParams = new URLSearchParams(window.location.search);
      const subject = urlParams.get('subject') || 'computer';
      const level   = parseInt(urlParams.get('level')) || 1;

      const cards = (TOPIC_CARDS[subject] && TOPIC_CARDS[subject][level]) || [];
      return cards.map(label => ({
        type: 'candidates',
        candidates: buildLocalCandidates(subject, level, label)
      }));
    }

    return [];
  }

  /* ============================================================
     MAIN — Silent loading, no UI
     ============================================================ */
  const queue = getImageQueue();
  const total = queue.length;

  const state = {
    progress: 0,
    loadedCount: 0,
    total: total,
    ready: false
  };

  const readyPromise = (async () => {
    if (total === 0) {
      state.progress = 100;
      state.ready = true;
      window.dispatchEvent(new Event('assetsLoaded'));
      return;
    }

    // Concurrency cap — keeps mobile smooth
    const CONCURRENCY = 6;
    let index = 0;

    async function worker() {
      while (index < queue.length) {
        const myIndex = index++;
        const item = queue[myIndex];

        if (item.type === 'direct') {
          await tryLoadImage([item.src]);
        } else if (item.type === 'candidates') {
          await tryLoadImage(item.candidates);
        }

        state.loadedCount++;
        state.progress = Math.round((state.loadedCount / total) * 100);
      }
    }

    const workers = [];
    for (let i = 0; i < Math.min(CONCURRENCY, total); i++) {
      workers.push(worker());
    }

    await Promise.all(workers);

    state.progress = 100;
    state.ready = true;
    window.dispatchEvent(new Event('assetsLoaded'));
  })();

  /* ============================================================
     EXPORT
     ============================================================ */
  window.assetLoader = {
    ready: readyPromise,
    progress: function () { return state.progress; },
    isReady:  function () { return state.ready; },
    state:    state
  };
})();