/* ================================================================
   NAVBAR-LOADER.JS
   - Injects navbar.html into #navbarContainer
   - Moves modals to <body> so Bootstrap's fixed positioning works
   - Calls updatePlayerLevelBox() after injection (belt & braces)
   ================================================================ */

(function () {
  'use strict';

  const inSubfolder = window.location.pathname.includes('/Gameplay/');
  const NAVBAR_PATH = inSubfolder ? '../navbar.html' : 'navbar.html';

  function refreshChips() {
    if (typeof window.updatePlayerLevelBox === 'function') {
      window.updatePlayerLevelBox();
    }
  }

  function injectNavbar() {
    const container = document.getElementById('navbarContainer');
    if (!container) return;

    fetch(NAVBAR_PATH)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load navbar');
        return res.text();
      })
      .then((html) => {
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // 1. Navbar → #navbarContainer
        const navbar = temp.querySelector('.navbar-custom');
        if (navbar) {
          container.innerHTML = '';
          container.appendChild(navbar);
        }

        // 2. Modals → <body> directly
        temp.querySelectorAll('.modal').forEach((modal) => {
          document.body.appendChild(modal);
        });

        // 3. Anything else → <body>
        while (temp.firstChild) {
          const node = temp.firstChild;
          if (node.nodeType === 1) document.body.appendChild(node);
          temp.removeChild(node);
        }

        // 4. Refresh chips immediately (in case player-level.js is ready)
        refreshChips();

        // 5. Retry a few times over 1s in case player-level.js loads late
        let tries = 0;
        const retry = setInterval(function () {
          refreshChips();
          if (++tries >= 10) clearInterval(retry);
        }, 100);

        // 6. Notify other scripts
        window.dispatchEvent(new Event('navbarLoaded'));
      })
      .catch((err) => {
        console.warn('Navbar loader:', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectNavbar);
  } else {
    injectNavbar();
  }
})();