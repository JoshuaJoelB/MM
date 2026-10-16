/* ================================================================
   TUTORIAL.JS — reusable first-time spotlight guide
   ----------------------------------------------------------------
   Usage:
     MMTutorial.show([
       { sel: '.some-selector', text: 'Do this.',          type: 'info'     },
       { sel: '#a-button',      text: 'Tap this to go.',   type: 'navigate' }
     ], { flagKey: 'onboardHomeSeen' });

   Step types:
     - 'info'      : shows a "Next / Got it!" button; the target is only
                     highlighted so the player can read about it.
     - 'navigate'  : the player must click the highlighted target. Clicking
                     it marks the tutorial done and lets the normal action
                     run (for example, following a link to the next page).

   Reuses the `.tutorial-spotlight` / `.tutorial-tooltip` styles already
   defined in style.css.
   ================================================================ */
(function () {
  'use strict';

  function pGet(key, fallback) {
    if (window.MMPlayer && MMPlayer.pGet) return MMPlayer.pGet(key, fallback);
    try {
      var v = localStorage.getItem(key);
      return v === null ? (fallback !== undefined ? fallback : null) : v;
    } catch (e) { return fallback; }
  }

  function pSet(key, value) {
    if (window.MMPlayer && MMPlayer.pSet) return MMPlayer.pSet(key, value);
    try { localStorage.setItem(key, String(value)); } catch (e) {}
  }

  function show(steps, opts) {
    if (!steps || !steps.length) return;
    opts = opts || {};
    var flagKey = opts.flagKey || 'mm_onboard_seen';
    if (pGet(flagKey, null) === '1') return;

    var current = 0;
    var active = true;

    // Spotlight layer (visual only — clicks pass through to the page).
    var spotlight = document.createElement('div');
    spotlight.className = 'tutorial-spotlight';
    var hole = document.createElement('div');
    hole.className = 'spotlight-hole';
    spotlight.appendChild(hole);
    document.body.appendChild(spotlight);

    // Instruction bubble.
    var tooltip = document.createElement('div');
    tooltip.className = 'tutorial-tooltip';
    tooltip.innerHTML =
      '<div class="tutorial-tooltip-text"></div>' +
      '<button type="button" class="tutorial-tooltip-btn"></button>';
    document.body.appendChild(tooltip);
    var tipText = tooltip.querySelector('.tutorial-tooltip-text');
    var tipBtn = tooltip.querySelector('.tutorial-tooltip-btn');

    // Fixed Skip button (top-right).
    var skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 'tutorial-skip-fixed';
    skipBtn.textContent = 'Skip';
    skipBtn.setAttribute('aria-label', 'Skip tutorial');
    document.body.appendChild(skipBtn);

    function position() {
      var s = steps[current];
      var el = s.sel ? document.querySelector(s.sel) : null;
      if (!el) { finish(); return; }
      var r = el.getBoundingClientRect();
      var pad = 8;
      hole.style.left = (r.left - pad) + 'px';
      hole.style.top = (r.top - pad) + 'px';
      hole.style.width = (r.width + pad * 2) + 'px';
      hole.style.height = (r.height + pad * 2) + 'px';

      var tipW = tooltip.offsetWidth || 280;
      var tipH = tooltip.offsetHeight || 90;
      var left = Math.max(12, Math.min(r.left + r.width / 2 - tipW / 2, window.innerWidth - tipW - 12));
      var top = r.bottom + 16;
      var arrowDown = false;
      if (top + tipH > window.innerHeight - 12) {
        top = r.top - tipH - 16;
        arrowDown = true;
      }
      if (top < 12) { top = 12; }
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
      tooltip.classList.toggle('arrow-down', arrowDown);
    }

    function renderStep() {
      var s = steps[current];
      tipText.textContent = s.text;
      if (s.type === 'navigate') {
        tipBtn.style.display = 'none';
      } else {
        tipBtn.style.display = 'inline-flex';
        tipBtn.textContent = (current === steps.length - 1) ? 'Got it!' : 'Next';
      }
      position();
    }

    function next() {
      current++;
      if (current >= steps.length) { finish(); return; }
      renderStep();
    }

    function finish() {
      if (!active) return;
      active = false;
      try { pSet(flagKey, '1'); } catch (e) {}
      document.removeEventListener('click', onDocClick, true);
      document.removeEventListener('keydown', onDocKeydown);
      window.removeEventListener('resize', position);
      if (spotlight.parentNode) spotlight.parentNode.removeChild(spotlight);
      if (tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
      if (skipBtn.parentNode) skipBtn.parentNode.removeChild(skipBtn);
      if (opts.onFinish) { try { opts.onFinish(); } catch (e) {} }
    }

    function isTargetHit(e, s) {
      if (!s.sel) return false;
      var el = document.querySelector(s.sel);
      if (!el) return false;
      return el === e.target || el.contains(e.target);
    }

    function onDocClick(e) {
      if (!active) return;
      if (e.target.closest && (e.target.closest('.tutorial-tooltip') || e.target.closest('.tutorial-skip-fixed'))) return;

      var s = steps[current];
      if (s.type === 'navigate' && isTargetHit(e, s)) {
        // Mark done and let the link/button do its normal thing (navigation).
        finish();
        return;
      }

      // Block everything else so the player focuses on the highlighted target.
      e.stopPropagation();
      e.preventDefault();
    }

    function onDocKeydown(e) {
      if (e.key === 'Escape' && active) finish();
    }

    document.addEventListener('click', onDocClick, true);
    document.addEventListener('keydown', onDocKeydown);
    window.addEventListener('resize', position);

    tipBtn.addEventListener('click', function (e) { e.stopPropagation(); next(); });
    skipBtn.addEventListener('click', function (e) { e.stopPropagation(); finish(); });

    renderStep();
  }

  window.MMTutorial = { show: show };
})();
