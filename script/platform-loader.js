/* ================================================================
   PLATFORM-LOADER.JS – Preloads the island map + Jojoma character
   before Level.html renders the map.
   Exposes: window.platformReadyPromise
   ================================================================ */

(function () {
  'use strict';

  // Images that must be ready before the map is drawn
  const PLATFORM_SRCS = [
    'Assets/Platform_Island.png',
    'Assets/jojoma.png'
  ];

  // Level.html lives at the project root, so no ../ prefix needed.
  // (If you ever move Level.html into a subfolder, add the same
  //  inSubfolder detection that clouds.js uses.)
  const prefix = '';

  let loaded = 0;
  const total = PLATFORM_SRCS.length;

  const promise = new Promise((resolve) => {
    if (total === 0) { resolve(); return; }

    PLATFORM_SRCS.forEach((src) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = img.onerror = () => {
        loaded++;
        if (loaded === total) resolve();
      };
      img.src = prefix + src;
    });

    // Safety net: resolve anyway after 3s so nothing blocks forever
    setTimeout(resolve, 3000);
  });

  // Expose globally for Level.html to await if it wants to
  window.platformReadyPromise = promise;
  window.platformReady = false;

  promise.then(() => {
    window.platformReady = true;
    window.dispatchEvent(new Event('platformReady'));
  });
})();