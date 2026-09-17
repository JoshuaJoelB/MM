/* ================================================================
   CLOUDS.JS – Persistent clouds across pages (no reset on nav)
   ================================================================ */

(function () {
  'use strict';

  // ---- Cloud images ----
  const FRONT_CLOUDS = [
    'Assets/cloud/cloud1.png',
    'Assets/cloud/cloud2.png'
  ];
  const BACK_CLOUDS = [
    'Assets/cloud/cloudpink.png'
  ];

  // ---- Size tiers ----
  const SIZE_TIERS = [
    { minSize: 120, maxSize: 200, minDur: 24, maxDur: 40, minOpac: 0.35, maxOpac: 0.55, blur: 1.4, weight: 3 },
    { minSize: 200, maxSize: 300, minDur: 36, maxDur: 60, minOpac: 0.5,  maxOpac: 0.7,  blur: 0.8, weight: 4 },
    { minSize: 300, maxSize: 460, minDur: 50, maxDur: 80, minOpac: 0.65, maxOpac: 0.85, blur: 0.4, weight: 4 },
    { minSize: 460, maxSize: 640, minDur: 65, maxDur: 100, minOpac: 0.8, maxOpac: 0.95, blur: 0.2, weight: 3 },
    { minSize: 640, maxSize: 900, minDur: 85, maxDur: 140, minOpac: 0.9, maxOpac: 1.0,  blur: 0,   weight: 2 }
  ];

  const CONFIG = {
    maxClouds: 22,
    spawnInterval: 1400,
    minStartY: 35,          // % – no clouds above this
    maxStartY: 90,          // % – down to bottom
    bottomBias: 0.55,       // < 1 pushes clouds to bottom
    verticalDriftMax: 40,
    stateKey: 'matchMonster_clouds_v1'  // sessionStorage key
  };

  // ---- Cloud layer ----
  let cloudLayer = document.getElementById('cloudLayer');
  if (!cloudLayer) {
    cloudLayer = document.createElement('div');
    cloudLayer.id = 'cloudLayer';
    document.body.appendChild(cloudLayer);
  }

  // ---- Detect if we're in a subfolder ----
  const inSubfolder = window.location.pathname.includes('/Gameplay/');
  function resolveSrc(relPath) {
    return inSubfolder ? '../' + relPath : relPath;
  }

  // ---- Active cloud tracker ----
  const activeClouds = [];

  // ---- Helpers ----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const pick = (arr) => arr[randInt(0, arr.length - 1)];

  function biasedY() {
    const r = Math.pow(Math.random(), CONFIG.bottomBias);
    return CONFIG.minStartY + (CONFIG.maxStartY - CONFIG.minStartY) * r;
  }

  function pickTier() {
    const total = SIZE_TIERS.reduce((s, t) => s + t.weight, 0);
    let roll = Math.random() * total;
    for (const tier of SIZE_TIERS) {
      roll -= tier.weight;
      if (roll <= 0) return tier;
    }
    return SIZE_TIERS[SIZE_TIERS.length - 1];
  }

  // ---- Build a cloud and start it ----
  function buildCloud(goRight, imageList, zIndex) {
    const tier = pickTier();
    const size = randInt(tier.minSize, tier.maxSize);
    const duration = rand(tier.minDur, tier.maxDur);
    const opacity = rand(tier.minOpac, tier.maxOpac);

    const vh = window.innerHeight;
    const startX = goRight ? -size - 60 : window.innerWidth + 60;
    const startTopPx = (biasedY() / 100) * vh;

    const driftX = goRight
      ? window.innerWidth + size + 120
      : -(window.innerWidth + size + 120);
    const driftY = rand(-CONFIG.verticalDriftMax, CONFIG.verticalDriftMax);

    const blurFilter = tier.blur > 0
      ? `blur(${tier.blur}px) drop-shadow(0 4px 20px rgba(220, 115, 191, 0.15))`
      : 'drop-shadow(0 6px 24px rgba(220, 115, 191, 0.2))';

    const img = document.createElement('img');
    img.src = resolveSrc(pick(imageList));
    img.alt = '';
    img.className = 'cloud';
    img.draggable = false;
    img.style.width = size + 'px';
    img.style.height = 'auto';
    img.style.left = startX + 'px';
    img.style.top = startTopPx + 'px';
    img.style.zIndex = zIndex;
    img.style.opacity = opacity;
    img.style.filter = blurFilter;
    img.style.setProperty('--drift-x', driftX + 'px');
    img.style.setProperty('--drift-y', driftY + 'px');
    img.style.animationDuration = duration + 's';

    cloudLayer.appendChild(img);

    // Track for persistence
    activeClouds.push({
      el: img,
      src: img.src,              // absolute URL after assignment
      size,
      startLeft: startX,
      startTopPx,
      driftX,
      driftY,
      duration,
      startedAt: Date.now(),
      opacity,
      zIndex,
      blurFilter,
      finished: false
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        img.classList.add('drifting');
      });
    });

    const finish = () => {
      img.remove();
      const found = activeClouds.find(c => c.el === img);
      if (found) found.finished = true;
    };
    img.addEventListener('animationend', finish, { once: true });
    setTimeout(finish, duration * 1000 + 800);
  }

  // ---- Spawn a pair (pink on back layer, blue/purple on front) ----
  function spawnPair() {
    if (activeClouds.filter(c => !c.finished).length >= CONFIG.maxClouds - 1) return;

    buildCloud(true,  BACK_CLOUDS,  0);
    buildCloud(false, BACK_CLOUDS,  0);
    buildCloud(true,  FRONT_CLOUDS, 2);
    buildCloud(false, FRONT_CLOUDS, 2);
  }

  // ================================================================
  //  PERSISTENCE – save & restore cloud state across page loads
  // ================================================================

  function saveState() {
    const now = Date.now();
    const vh = window.innerHeight || 1;
    const state = [];

    for (const c of activeClouds) {
      if (c.finished) continue;

      const elapsed = (now - c.startedAt) / 1000;
      const progress = Math.min(elapsed / c.duration, 1);
      if (progress >= 1) continue;

      // Current on-screen position
      const currentLeft = c.startLeft + c.driftX * progress;
      const currentTopPx = c.startTopPx + c.driftY * progress;

      // Remaining values for the next page to continue from
      state.push({
        src: c.src,
        size: c.size,
        currentLeft,
        currentTopPx,
        remainingDriftX: c.driftX * (1 - progress),
        remainingDriftY: c.driftY * (1 - progress),
        remainingDuration: c.duration * (1 - progress),
        opacity: c.opacity,
        zIndex: c.zIndex,
        blurFilter: c.blurFilter
      });
    }

    try {
      sessionStorage.setItem(CONFIG.stateKey, JSON.stringify(state));
    } catch (e) { /* ignore quota errors */ }
  }

  function restoreState() {
    let state = [];
    try {
      const raw = sessionStorage.getItem(CONFIG.stateKey);
      if (raw) state = JSON.parse(raw);
    } catch (e) { state = []; }

    for (const s of state) {
      if (!s.remainingDuration || s.remainingDuration <= 0.5) continue;

      const img = document.createElement('img');
      img.src = s.src;
      img.alt = '';
      img.className = 'cloud';
      img.draggable = false;
      img.style.width = s.size + 'px';
      img.style.height = 'auto';
      img.style.left = s.currentLeft + 'px';
      img.style.top = s.currentTopPx + 'px';
      img.style.zIndex = s.zIndex;
      img.style.opacity = s.opacity;
      img.style.filter = s.blurFilter || '';
      img.style.setProperty('--drift-x', s.remainingDriftX + 'px');
      img.style.setProperty('--drift-y', s.remainingDriftY + 'px');
      img.style.animationDuration = s.remainingDuration + 's';

      cloudLayer.appendChild(img);

      activeClouds.push({
        el: img,
        src: s.src,
        size: s.size,
        startLeft: s.currentLeft,
        startTopPx: s.currentTopPx,
        driftX: s.remainingDriftX,
        driftY: s.remainingDriftY,
        duration: s.remainingDuration,
        startedAt: Date.now(),
        opacity: s.opacity,
        zIndex: s.zIndex,
        blurFilter: s.blurFilter,
        finished: false
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          img.classList.add('drifting');
        });
      });

      const finish = () => {
        img.remove();
        const found = activeClouds.find(c => c.el === img);
        if (found) found.finished = true;
      };
      img.addEventListener('animationend', finish, { once: true });
      setTimeout(finish, s.remainingDuration * 1000 + 800);
    }
  }

  // ================================================================
  //  BOOT
  // ================================================================

  function seedSky() {
    // Fill sky immediately if there aren't enough clouds from restore
    const alive = activeClouds.filter(c => !c.finished).length;
    if (alive < 8) {
      const pairsToAdd = Math.ceil((8 - alive) / 4);
      for (let i = 0; i < pairsToAdd; i++) spawnPair();
    }
  }

  function start() {
    // 1. Restore from previous page (if any)
    restoreState();

    // 2. Fill any gap so the sky isn't empty
    seedSky();

    // 3. Continuous spawning
    setInterval(spawnPair, CONFIG.spawnInterval);

    // 4. Save state frequently so navigation always has fresh data
    setInterval(saveState, 400);

    // 5. Save on page leave (covers all browsers)
    window.addEventListener('beforeunload', saveState);
    window.addEventListener('pagehide', saveState);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') saveState();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();