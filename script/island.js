/* ================================================================
   ISLAND.JS — 3 randomly placed floating islands
   ----------------------------------------------------------------
   Each page load generates 3 fresh positions that never overlap.
   Size + opacity scale with height:
       higher on screen  →  smaller + fainter  (looks "far away")
       lower on screen   →  bigger  + bolder   (looks "close")

   All islands sit at z-index 1 inside #cloudLayer, so clouds at
   z-index 0 (back) and z-index 2 (front) naturally drift both
   behind AND in front of every island.
   ================================================================ */

(function () {
  'use strict';

  // ------------------------------------------------------------------
  // CONFIG
  // ------------------------------------------------------------------
  const ISLAND_FILE  = 'Assets/single_island.png';
  const inSubfolder  = window.location.pathname.includes('/Gameplay/');
  const SRC          = inSubfolder ? '../' + ISLAND_FILE : ISLAND_FILE;

  const ISLAND_COUNT = 3;      // ← exactly 3 islands

  // Horizontal placement zones (as % of viewport width).
  // Splitting the screen into 3 lanes guarantees no overlap.
  const X_LANES = [
    { min: 6,  max: 28 },   // left third
    { min: 38, max: 62 },   // middle
    { min: 72, max: 94 },   // right third
  ];

  // Vertical placement zones (as % of viewport height).
  // Higher = farther away = smaller + fainter.
  const Y_ZONES = [
    { min: 28, max: 44 },   // far   → small / faint
    { min: 44, max: 62 },   // mid   → medium
    { min: 62, max: 78 },   // close → big / bold
  ];

  // Size presets matched to the Y zones above (still responsive).
  const SIZE_BY_ZONE = [
    'clamp(140px, 20vw, 260px)',   // far
    'clamp(200px, 28vw, 400px)',   // mid
    'clamp(280px, 42vw, 620px)',   // close
  ];
  const OPACITY_BY_ZONE = [0.72, 0.88, 1.0];

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  const rand = (min, max) => Math.random() * (max - min) + min;
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function shuffle(array) {
    const a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ------------------------------------------------------------------
  // Ensure the cloud layer exists
  // ------------------------------------------------------------------
  function ensureLayer() {
    let layer = document.getElementById('cloudLayer');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'cloudLayer';
      Object.assign(layer.style, {
        position:      'fixed',
        inset:         '0',
        pointerEvents: 'none',
        overflow:      'hidden',
        zIndex:        '1',
      });
      document.body.appendChild(layer);
    }
    return layer;
  }

  // ------------------------------------------------------------------
  // Generate 3 non-overlapping random positions.
  //   - Each island gets its own X lane (left / middle / right)
  //   - Each island gets its own Y zone (far / mid / close)
  //   → so two islands can never land on top of each other,
  //     and the depth layering stays believable every time.
  // ------------------------------------------------------------------
  function generatePositions() {
    const lanes = shuffle(X_LANES);   // random lane order per load
    const zones = shuffle(Y_ZONES);   // random depth order per load

    return Array.from({ length: ISLAND_COUNT }, (_, i) => {
      const lane = lanes[i];
      const zone = zones[i];
      const zoneIdx = Y_ZONES.indexOf(zone);   // 0=far, 1=mid, 2=close

      return {
        id:      'island' + i,
        x:       rand(lane.min, lane.max).toFixed(1) + '%',
        y:       rand(zone.min, zone.max).toFixed(1) + '%',
        width:   SIZE_BY_ZONE[zoneIdx],
        opacity: OPACITY_BY_ZONE[zoneIdx],
        rotate:  rand(-7, 7).toFixed(1) + 'deg',
        z:       1,
      };
    });
  }

  // ------------------------------------------------------------------
  // Build one island
  // ------------------------------------------------------------------
  function createIsland(cfg, layer) {
    const el = document.createElement('div');
    el.id = cfg.id;
    el.className = 'middle-island';
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('role', 'presentation');

    Object.assign(el.style, {
      position:           'absolute',
      left:               cfg.x,
      top:                cfg.y,
      transform:          `translate(-50%, -50%) rotate(${cfg.rotate})`,
      width:              cfg.width,
      aspectRatio:        '16 / 10',   // keeps height even if image fails
      backgroundImage:    `url("${SRC}")`,
      backgroundSize:     'contain',
      backgroundRepeat:   'no-repeat',
      backgroundPosition: 'center',
      pointerEvents:      'none',
      userSelect:         'none',
      opacity:            String(cfg.opacity),
      filter:
        'drop-shadow(0 20px 50px rgba(30, 144, 255, 0.35)) ' +
        'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.35))',
      zIndex:             String(cfg.z),
      transition:         'opacity 0.4s ease',
    });

    layer.appendChild(el);
  }

  // ------------------------------------------------------------------
  // Responsive tweak — on phones, shrink the far-away islands a bit
  // so they stay readable.
  // ------------------------------------------------------------------
  function applyResponsive() {
    const isPhone = window.innerWidth < 480;
    document.querySelectorAll('.middle-island').forEach((el) => {
      el.style.maxHeight = isPhone ? '42vh' : '62vh';
    });
  }

  // ------------------------------------------------------------------
  // Boot
  // ------------------------------------------------------------------
  function boot() {
    const layer = ensureLayer();

    // Probe the image so we can warn if the path is wrong
    const probe = new Image();
    probe.onload  = () => console.log('[island.js] ✅ Image loaded:', SRC);
    probe.onerror = () => console.warn(
      '[island.js] ❌ Image FAILED to load. Expected path: ' + SRC
    );
    probe.src = SRC;

    // Build the 3 islands
    const positions = generatePositions();
    positions.forEach((cfg) => createIsland(cfg, layer));

    console.log('[island.js] Islands placed:', positions.map(
      (p) => `${p.id} @ ${p.x}, ${p.y}`
    ));

    applyResponsive();
    window.addEventListener('resize', applyResponsive);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();