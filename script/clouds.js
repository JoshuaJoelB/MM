/* ================================================================
   CLOUDS.JS – GPU-accelerated, filter-free, lightweight
   ================================================================ */

(function () {
  'use strict';

  // ---- Image sources ----
  const CLOUD_SRCS = [
    'Assets/cloud/cloud1.png',   // front
    'Assets/cloud/cloud2.png',   // front
    'Assets/cloud/cloudpink.png' // back
  ];

  const inSubfolder = window.location.pathname.includes('/Gameplay/');
  const resolveSrc = (p) => (inSubfolder ? '../' + p : p);
  const RESOLVED = CLOUD_SRCS.map(resolveSrc);

  // ---- Config ----
  const CONFIG = {
    maxClouds: 10,           // was 22 – fewer clouds = smoother
    spawnInterval: 2600,     // was 1400 – less DOM churn
    minStartY: 38,           // % – no clouds above this
    maxStartY: 88,           // % – down to bottom
    bottomBias: 0.55,        // < 1 pushes clouds toward the bottom

    // [minSize, maxSize, minDur, maxDur, minOpac, maxOpac, weight]
    tiers: [
      { min: 130, max: 220, minDur: 30, maxDur: 50,  minOpac: 0.40, maxOpac: 0.60, weight: 3 },
      { min: 220, max: 380, minDur: 48, maxDur: 75,  minOpac: 0.55, maxOpac: 0.75, weight: 4 },
      { min: 380, max: 600, minDur: 75, maxDur: 105, minOpac: 0.70, maxOpac: 0.90, weight: 3 },
      { min: 600, max: 820, minDur: 100, maxDur: 150, minOpac: 0.85, maxOpac: 1.00, weight: 1 }
    ]
  };

  // ---- Layer ----
  let layer = document.getElementById('cloudLayer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'cloudLayer';
    document.body.appendChild(layer);
  }

  // ---- Helpers ----
  const rand = (a, b) => Math.random() * (b - a) + a;
  const randInt = (a, b) => Math.floor(rand(a, b + 1));

  function pickTier() {
    const total = CONFIG.tiers.reduce((s, t) => s + t.weight, 0);
    let r = Math.random() * total;
    for (const t of CONFIG.tiers) {
      r -= t.weight;
      if (r <= 0) return t;
    }
    return CONFIG.tiers[CONFIG.tiers.length - 1];
  }

  function biasedY() {
    const r = Math.pow(Math.random(), CONFIG.bottomBias);
    return CONFIG.minStartY + (CONFIG.maxStartY - CONFIG.minStartY) * r;
  }

  const active = [];

  // ---- Create one cloud ----
  function createCloud(goRight, srcIdx, zIndex) {
    const tier  = pickTier();
    const size  = randInt(tier.min, tier.max);
    const dur   = rand(tier.minDur, tier.maxDur);
    const opac  = rand(tier.minOpac, tier.maxOpac);

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const startX = goRight ? -size - 60 : vw + 60;
    const startY = (biasedY() / 100) * vh;
    const dx     = goRight ? (vw + size + 120) : -(vw + size + 120);
    const dy     = rand(-30, 30);

    const img = document.createElement('img');
    img.src = RESOLVED[srcIdx];
    img.alt = '';
    img.className = 'cloud';
    img.draggable = false;
    img.decoding = 'async';

    // Inline style – no filters, no left/top, pure transform
    img.style.width = size + 'px';
    img.style.height = 'auto';
    img.style.opacity = opac;
    img.style.zIndex = zIndex;
    img.style.animationDuration = dur + 's';
    img.style.setProperty('--start-x', startX + 'px');
    img.style.setProperty('--start-y', startY + 'px');
    img.style.setProperty('--dx', dx + 'px');
    img.style.setProperty('--dy', dy + 'px');

    layer.appendChild(img);

    // Kick off animation on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => img.classList.add('drifting'));
    });

    const entry = {
      el: img,
      startTime: performance.now(),
      duration: dur * 1000,
      startX, startY, dx, dy,
      opacity: opac, srcIdx, size, zIndex,
      removed: false
    };
    active.push(entry);

    // Self-cleanup
    const t = setTimeout(() => removeEntry(entry), dur * 1000 + 500);
    entry.timer = t;
  }

  function removeEntry(entry) {
    if (!entry || entry.removed) return;
    entry.removed = true;
    if (entry.timer) clearTimeout(entry.timer);
    if (entry.el.parentNode) entry.el.parentNode.removeChild(entry.el);
    const i = active.indexOf(entry);
    if (i >= 0) active.splice(i, 1);
  }

  // ---- Spawn a pair ----
  function spawnPair() {
    let alive = 0;
    for (let i = 0; i < active.length; i++) if (!active[i].removed) alive++;
    if (alive >= CONFIG.maxClouds) return;

    // Pink back layer
    createCloud(true,  2, 0);
    createCloud(false, 2, 0);
    // Blue/purple front layer
    const frontA = Math.random() < 0.5 ? 0 : 1;
    const frontB = Math.random() < 0.5 ? 0 : 1;
    createCloud(true,  frontA, 2);
    createCloud(false, frontB, 2);
  }

  function seedSky() {
    for (let i = 0; i < 3; i++) spawnPair();
  }

  // ================================================================
  //  State save / restore (only on page leave)
  // ================================================================
  function saveState() {
    const now = performance.now();
    const state = [];
    for (const c of active) {
      if (c.removed) continue;
      const prog = Math.min((now - c.startTime) / c.duration, 1);
      if (prog >= 0.98) continue;
      state.push({
        i: c.srcIdx,
        s: c.size,
        x: c.startX, y: c.startY,
        dx: c.dx, dy: c.dy,
        p: prog,
        d: c.duration,
        o: c.opacity,
        z: c.zIndex
      });
    }
    try {
      sessionStorage.setItem('mm_clouds', JSON.stringify(state));
    } catch (e) {}
  }

  function restoreState() {
    let state = [];
    try {
      const raw = sessionStorage.getItem('mm_clouds');
      if (raw) state = JSON.parse(raw);
    } catch (e) {}

    for (const s of state) {
      const remainMs = s.d * (1 - s.p);
      if (remainMs < 500) continue;

      const curX = s.x + s.dx * s.p;
      const curY = s.y + s.dy * s.p;

      const img = document.createElement('img');
      img.src = RESOLVED[s.i];
      img.alt = '';
      img.className = 'cloud';
      img.draggable = false;
      img.decoding = 'async';
      img.style.width = s.s + 'px';
      img.style.height = 'auto';
      img.style.opacity = s.o;
      img.style.zIndex = s.z;
      img.style.animationDuration = (remainMs / 1000) + 's';
      img.style.setProperty('--start-x', curX + 'px');
      img.style.setProperty('--start-y', curY + 'px');
      img.style.setProperty('--dx', (s.dx * (1 - s.p)) + 'px');
      img.style.setProperty('--dy', (s.dy * (1 - s.p)) + 'px');

      layer.appendChild(img);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => img.classList.add('drifting'));
      });

      const entry = {
        el: img,
        startTime: performance.now(),
        duration: remainMs,
        startX: curX, startY: curY,
        dx: s.dx * (1 - s.p),
        dy: s.dy * (1 - s.p),
        opacity: s.o, srcIdx: s.i, size: s.s, zIndex: s.z,
        removed: false
      };
      const t = setTimeout(() => removeEntry(entry), remainMs + 500);
      entry.timer = t;
      active.push(entry);
    }
  }

  // ================================================================
  //  Boot
  // ================================================================
  function start() {
    restoreState();
    seedSky();
    setInterval(spawnPair, CONFIG.spawnInterval);

    // Save ONLY when leaving (not every few hundred ms)
    window.addEventListener('pagehide', saveState);
    window.addEventListener('beforeunload', saveState);
  }

  function boot() {
    // Wait for preloader if available, otherwise start immediately
    if (window.cloudsReadyPromise) {
      window.cloudsReadyPromise.then(start);
    } else {
      start();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();