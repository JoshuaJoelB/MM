/* ================================================================
   LEADERBOARD-DATA.JS
   ----------------------------------------------------------------
   Seed / template for the local leaderboard.
   Replace `entries` with the data you want to ship with the game.

   NOTE: the game itself uses localStorage for live scores
   (see player.js). This file is only the *initial* set.
   ================================================================ */

window.MM_LEADERBOARD_SEED = {
  version: 1,
  updatedAt: null,
  entries: [
    // Example rows — replace with your own data.
    // { "nickname": "StarDragon", "score": 320, "stars": 3, "time": 45, "date": "2025-01-01" },
    // { "nickname": "PixelPanda", "score": 280, "stars": 2, "time": 62, "date": "2025-01-02" },
    // { "nickname": "BlueComet",  "score": 250, "stars": 2, "time": 70, "date": "2025-01-03" }
  ]
};

/* ----------------------------------------------------------------
   OPTIONAL: seed localStorage the first time the game runs.
   Call `MMLeaderboardData.seedIfEmpty()` from anywhere.
   ---------------------------------------------------------------- */
window.MMLeaderboardData = (function () {
  'use strict';

  const KEY = 'mm_leaderboard';

  function seedIfEmpty() {
    try {
      if (localStorage.getItem(KEY)) return;                 // already has data
      const seed = window.MM_LEADERBOARD_SEED;
      if (!seed || !Array.isArray(seed.entries)) return;
      if (!seed.entries.length) return;                      // nothing to seed
      localStorage.setItem(KEY, JSON.stringify(seed.entries));
    } catch (e) {}
  }

  return { seedIfEmpty: seedIfEmpty };
})();