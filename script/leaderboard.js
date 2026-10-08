/* ================================================================
   LEADERBOARD MODAL — render podium + rows
   ================================================================ */
(function () {
  'use strict';

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function starString(n) {
    return '⭐'.repeat(Math.max(0, Math.min(3, n || 0)));
  }

  function formatScore(n) {
    return Number(n || 0).toLocaleString();
  }

  function currentNickname() {
    return (window.MMPlayer && MMPlayer.getNickname) ? MMPlayer.getNickname() : '';
  }

  function renderPodium(players) {
    const podiumEl = document.getElementById('lbPodium');
    if (!podiumEl) return;

    if (players.length < 3) { podiumEl.hidden = true; return; }
    podiumEl.hidden = false;

    const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };

    [1, 2, 3].forEach(function (rank) {
      const slot = podiumEl.querySelector('[data-slot="' + rank + '"]');
      if (!slot) return;
      const p = players[rank - 1];
      if (!p) { slot.innerHTML = ''; return; }

      slot.innerHTML =
        '<span class="lb-podium-medal">' + medals[rank] + '</span>' +
        '<span class="lb-podium-name">'  + escapeHtml(p.nickname) + '</span>' +
        '<span class="lb-podium-score">' + formatScore(p.score) + '</span>' +
        '<span class="lb-podium-stars">' + starString(p.totalStars) + ' · Lv ' + p.highestLevel + '</span>';
    });
  }

  function renderRows(players, startRank) {
    const listEl = document.getElementById('navLbList');
    if (!listEl) return;
    listEl.innerHTML = '';

    const me = currentNickname().toLowerCase();

    players.forEach(function (p, i) {
      const rank = (startRank || 1) + i;
      const li = document.createElement('li');
      li.className = 'lb-row' + (p.nickname.toLowerCase() === me ? ' me' : '');

      li.innerHTML =
        '<span class="lb-rank">'  + rank + '</span>' +
        '<span class="lb-name">'  + escapeHtml(p.nickname) + '</span>' +
        '<span class="lb-sub">'   + starString(p.totalStars) + ' · Lv ' + p.highestLevel + '</span>' +
        '<span class="lb-score">' + formatScore(p.score) + '</span>';

      listEl.appendChild(li);
    });
  }

  function renderLeaderboard() {
    const emptyEl = document.getElementById('navLbEmpty');
    if (!emptyEl || !window.MMLeaderboard) return;

    const all = MMLeaderboard.getAllPlayers();

    // ---- No players yet ----
    if (!all.length) {
      emptyEl.hidden = false;
      renderPodium([]);
      renderRows([]);
      return;
    }
    emptyEl.hidden = true;

    // ---- FIX: only split podium/rows when we have ≥ 3 players ----
    if (all.length >= 3) {
      renderPodium(all.slice(0, 3));
      renderRows(all.slice(3, MMLeaderboard.DISPLAY_LIMIT), 4);
    } else {
      // 1 or 2 players → show them as plain ranked rows starting at #1
      renderPodium([]);
      renderRows(all, 1);
    }
  }

  document.addEventListener('shown.bs.modal', function (e) {
    if (e.target && e.target.id === 'leaderboardModal') renderLeaderboard();
  });

  window.addEventListener('navbarLoaded', renderLeaderboard);
  document.addEventListener('DOMContentLoaded', renderLeaderboard);
})();