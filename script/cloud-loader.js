/* ================================================================
   CLOUD-LOADER.JS – Preloads cloud images before the game starts
   ================================================================ */

(function () {
  'use strict';

  const CLOUD_SRCS = [
    'Assets/cloud/cloud1.png',
    'Assets/cloud/cloud2.png',
    'Assets/cloud/cloudpink.png'
  ];

  const inSubfolder = window.location.pathname.includes('/Gameplay/');
  const prefix = inSubfolder ? '../' : '';

  let loaded = 0;
  const total = CLOUD_SRCS.length;

  const promise = new Promise((resolve) => {
    if (total === 0) { resolve(); return; }

    CLOUD_SRCS.forEach((src) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = img.onerror = () => {
        loaded++;
        if (loaded === total) resolve();
      };
      img.src = prefix + src;
    });

    // Safety: resolve anyway after 3s so nothing blocks forever
    setTimeout(resolve, 3000);
  });

  // Expose globally for clouds.js
  window.cloudsReadyPromise = promise;
  window.cloudsReady = false;
  promise.then(() => {
    window.cloudsReady = true;
    window.dispatchEvent(new Event('cloudsReady'));
  });
})();