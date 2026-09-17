/* ================================================================
   CLOUDS.JS – Instant, continuous clouds (center + bottom only)
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
  // [minSize, maxSize, minDur, maxDur, minOpac, maxOpac, blur, weight]
  const SIZE_TIERS = [
    { minSize: 120, maxSize: 200, minDur: 24, maxDur: 40, minOpac: 0.35, maxOpac: 0.55, blur: 1.4, weight: 3 },
    { minSize: 200, maxSize: 300, minDur: 36, maxDur: 60, minOpac: 0.5,  maxOpac: 0.7,  blur: 0.8, weight: 4 },
    { minSize: 300, maxSize: 460, minDur: 50, maxDur: 80, minOpac: 0.65, maxOpac: 0.85, blur: 0.4, weight: 4 },
    { minSize: 460, maxSize: 640, minDur: 65, maxDur: 100, minOpac: 0.8, maxOpac: 0.95, blur: 0.2, weight: 3 },
    { minSize: 640, maxSize: 900, minDur: 85, maxDur: 140, minOpac: 0.9, maxOpac: 1.0,  blur: 0,   weight: 2 }
  ];

  const CONFIG = {
    maxClouds: 22,
    spawnInterval: 1400,         // continuous spawning
    minStartY: 35,               // % – no clouds above this line (center)
    maxStartY: 90,               // % – down to bottom
    bottomBias: 0.55,            // < 1 pushes clouds toward the bottom (0.5–0.7 is good)
    verticalDriftMax: 40
  };

  // ---- Cloud layer ----
  let cloudLayer = document.getElementById('cloudLayer');
  if (!cloudLayer) {
    cloudLayer = document.createElement('div');
    cloudLayer.id = 'cloudLayer';
    document.body.appendChild(cloudLayer);
  }

  // ---- Helpers ----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const pick = (arr) => arr[randInt(0, arr.length - 1)];

  // Biased Y: more likely near the bottom
  function biasedY() {
    const r = Math.pow(Math.random(), CONFIG.bottomBias); // closer to 1 → bottom
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

  // ---- Build one cloud ----
  function buildCloud(goRight, imageList, zIndex) {
    const tier = pickTier();
    const size = randInt(tier.minSize, tier.maxSize);
    const duration = rand(tier.minDur, tier.maxDur);
    const opacity = rand(tier.minOpac, tier.maxOpac);

    const startX = goRight ? -size - 60 : window.innerWidth + 60;
    const startY = biasedY();

    const driftX = goRight
      ? window.innerWidth + size + 120
      : -(window.innerWidth + size + 120);
    const driftY = rand(-CONFIG.verticalDriftMax, CONFIG.verticalDriftMax);

    const img = document.createElement('img');
    img.src = pick(imageList);
    img.alt = '';
    img.className = 'cloud';
    img.draggable = false;
    img.style.width = size + 'px';
    img.style.height = 'auto';
    img.style.left = startX + 'px';
    img.style.top = startY + '%';
    img.style.zIndex = zIndex;
    img.style.setProperty('--drift-x', driftX + 'px');
    img.style.setProperty('--drift-y', driftY + 'px');
    img.style.animationDuration = duration + 's';
    img.style.opacity = opacity;

    if (tier.blur > 0) {
      img.style.filter = `blur(${tier.blur}px) drop-shadow(0 4px 20px rgba(220, 115, 191, 0.15))`;
    } else {
      img.style.filter = 'drop-shadow(0 6px 24px rgba(220, 115, 191, 0.2))';
    }

    cloudLayer.appendChild(img);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        img.classList.add('drifting');
      });
    });

    const cleanup = () => img.remove();
    img.addEventListener('animationend', cleanup, { once: true });
    setTimeout(cleanup, duration * 1000 + 800);
  }

  // ---- Spawn a pair (pink on back layer, blue/purple on front) ----
  function spawnPair() {
    if (cloudLayer.children.length >= CONFIG.maxClouds - 1) return;

    // BACK LAYER (pink)
    buildCloud(true,  BACK_CLOUDS, 0);
    buildCloud(false, BACK_CLOUDS, 0);

    // FRONT LAYER (blue/purple)
    buildCloud(true,  FRONT_CLOUDS, 2);
    buildCloud(false, FRONT_CLOUDS, 2);
  }

  // ---- Spawn instantly on load (no delay) ----
  function seedSky() {
    // Fill the sky with clouds right away so there's no empty moment
    for (let i = 0; i < 6; i++) {
      spawnPair();
    }
  }

  // ---- Continuous spawning loop ----
  function startSpawning() {
    seedSky();                                    // immediate clouds
    setInterval(spawnPair, CONFIG.spawnInterval); // forever
  }

  // ---- Run ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startSpawning);
  } else {
    startSpawning();
  }
})();