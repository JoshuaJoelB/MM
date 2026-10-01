/* ================================================================
   ISLAND.JS — 3 fixed floating islands (lower placement)
   ----------------------------------------------------------------
   - Left / Right islands  → single_island.png
   - Center hero island    → island_castle.png
   All islands sit between 62% and 100% vertically, well inside the
   cloud spawn band, so every island constantly has clouds drifting
   behind and in front of it.
   ================================================================ */

(function () {
  'use strict';

  // ------------------------------------------------------------------
  // CONFIG
  // ------------------------------------------------------------------
  const inSubfolder = window.location.pathname.includes('/Gameplay/');
  const resolve = (p) => (inSubfolder ? '../' + p : p);

  const ISLAND_SRC  = resolve('Assets/single_island.png');
  const CASTLE_SRC  = resolve('Assets/island_castle.png');

  /*
    LOCKED POSITIONS — do not change on refresh.
    Each island now carries its own `src`.
  */
  const ISLANDS = [
    // ---- Left island (low) ----  → single island
    {
      id:      'islandTopLeft',
      src:     ISLAND_SRC,
      x:       '17%',
      y:       '68%',
      width:   'clamp(220px, 28vw, 440px)',
      rotate:  '0deg',
      opacity: 0.95,
      z:       1,
    },

    // ---- Right island (low) ----  → single island
    {
      id:      'islandMidRight',
      src:     ISLAND_SRC,
      x:       '82%',
      y:       '72%',
      width:   'clamp(280px, 36vw, 560px)',
      rotate:  '0deg',
      opacity: 1,
      z:       1,
    },

        // ---- Center hero island (lower-center) ----  → CASTLE
    {
      id:      'islandCenter',
      src:     CASTLE_SRC,
      x:       '46%',
      y:       '88%',          // ← raised from 100%
      width:   'clamp(440px, 62vw, 900px)',
      rotate:  '0deg',
      opacity: 1,
      z:       1,
    },
  ];

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
  // Build one island
  // ------------------------------------------------------------------
  function createIsland(cfg, layer) {
    if (document.getElementById(cfg.id)) return;

    const el = document.createElement('div');
    el.id = cfg.id;
    el.className = 'middle-island';
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('role', 'presentation');

    // Castle has a slightly taller silhouette — use 5/4 to preserve it
    const aspect = (cfg.id === 'islandCenter') ? '5 / 4' : '16 / 10';

    Object.assign(el.style, {
      position:           'absolute',
      left:               cfg.x,
      top:                cfg.y,
      transform:          `translate(-50%, -50%) rotate(${cfg.rotate})`,
      width:              cfg.width,
      aspectRatio:        aspect,
      backgroundImage:    `url("${cfg.src}")`,
      backgroundSize:     'contain',
      backgroundRepeat:   'no-repeat',
      backgroundPosition: 'center',
      pointerEvents:      'none',
      userSelect:         'none',
      opacity:            String(cfg.opacity),
      filter:
        'drop-shadow(0 24px 60px rgba(30, 144, 255, 0.4)) ' +
        'drop-shadow(0 10px 26px rgba(0, 0, 0, 0.4))',
      zIndex:             String(cfg.z),
      transition:         'opacity 0.4s ease',
    });

    layer.appendChild(el);
  }

  // ------------------------------------------------------------------
  // Responsive — cap island height on phones
  // ------------------------------------------------------------------
  function applyResponsive() {
    const isPhone = window.innerWidth < 480;
    document.querySelectorAll('.middle-island').forEach((el) => {
      el.style.maxHeight = isPhone ? '52vh' : '78vh';
    });
  }

  // ------------------------------------------------------------------
  // Boot
  // ------------------------------------------------------------------
  function boot() {
    const layer = ensureLayer();

    // Probe both images so we can see what loaded in the console
    [ISLAND_SRC, CASTLE_SRC].forEach((src) => {
      const probe = new Image();
      probe.onload  = () => console.log('[island.js] ✅ Image loaded:', src);
      probe.onerror = () => console.warn(
        '[island.js] ❌ Image FAILED to load. Expected path: ' + src
      );
      probe.src = src;
    });

    ISLANDS.forEach((cfg) => createIsland(cfg, layer));

    console.log('[island.js] Islands placed:', ISLANDS.map(
      (i) => `${i.id} → ${i.src.split('/').pop()} @ ${i.x}, ${i.y}`
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