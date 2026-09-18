/* ================================================================
   NAVBAR-LOADER.JS
   - Injects navbar.html into #navbarContainer
   - Moves modals to <body> so Bootstrap's fixed positioning works
   ================================================================ */

(function () {
  'use strict';

  const inSubfolder = window.location.pathname.includes('/Gameplay/');
  const NAVBAR_PATH = inSubfolder ? '../navbar.html' : 'navbar.html';

  function injectNavbar() {
    const container = document.getElementById('navbarContainer');
    if (!container) return;

    fetch(NAVBAR_PATH)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load navbar');
        return res.text();
      })
      .then((html) => {
        // Parse fetched HTML into a temporary container
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // 1. Navbar → #navbarContainer
        const navbar = temp.querySelector('.navbar-custom');
        if (navbar) {
          container.innerHTML = '';
          container.appendChild(navbar);
        }

        // 2. Modals → <body> (directly, so position:fixed works properly)
        temp.querySelectorAll('.modal').forEach((modal) => {
          document.body.appendChild(modal);
        });

        // 3. Anything else → <body>
        while (temp.firstChild) {
          const node = temp.firstChild;
          if (node.nodeType === 1) {
            document.body.appendChild(node);
          }
          temp.removeChild(node);
        }

        // 4. Notify other scripts
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