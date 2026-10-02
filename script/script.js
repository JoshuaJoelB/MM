<!-- ============================================================= -->
<!-- NAVIGATION BAR                                                -->
<!-- ============================================================= -->
<nav class="navbar-custom">
  <div class="nav-left">
    <!-- Player Level Box (hangs below the navbar) -->
    <div class="player-level-box">
      <div class="player-level-top">
        <div class="player-level-badge">
          <span class="player-level-label">LVL</span>
          <span class="player-level-number" data-player-level-num>1</span>
        </div>
        <div class="player-level-progress-text" data-player-progress-text>0 / 3</div>
      </div>
      <div class="player-progress-track">
        <div class="player-progress-fill" data-player-progress-fill></div>
      </div>
    </div>
  </div>

  <!-- RIGHT: points + actions -->
  <div class="nav-right">

    <!-- Stars — total rating -->
    <div class="point-chip point-chip-star" title="Star Rating">
      <i class="fas fa-star"></i>
      <span data-nav-stars>0</span>
    </div>

    <!-- Points — used to unlock levels -->
    <div class="point-chip point-chip-coin" title="Points — used to unlock levels">
      <i class="fas fa-coins"></i>
      <span data-nav-points>0</span>
    </div>

    <!-- ============================================================
         DESKTOP: Inbox + Settings as separate buttons (≥768px)
         ============================================================ -->
    <div class="nav-actions-desktop d-none d-md-flex">
      <button class="btn-icon"
              data-bs-toggle="modal"
              data-bs-target="#inboxModal"
              aria-label="Inbox">
        <i class="fas fa-inbox"></i>
        <span class="badge-notif">3</span>
      </button>

      <button class="btn-icon"
              data-bs-toggle="modal"
              data-bs-target="#settingsModal"
              aria-label="Settings">
        <i class="fas fa-cog"></i>
      </button>
    </div>

    <!-- ============================================================
         MOBILE: Hamburger dropdown (below 768px)
         ============================================================ -->
    <div class="dropdown nav-actions-mobile d-md-none">
      <button class="btn-icon"
              type="button"
              id="navMobileMenu"
              data-bs-toggle="dropdown"
              data-bs-auto-close="true"
              aria-expanded="false"
              aria-label="Open menu">
        <i class="fas fa-bars"></i>
      </button>

      <ul class="dropdown-menu dropdown-menu-end nav-mobile-dropdown"
          aria-labelledby="navMobileMenu">
        <li>
          <button class="dropdown-item nav-mobile-item"
                  type="button"
                  data-bs-toggle="modal"
                  data-bs-target="#inboxModal">
            <i class="fas fa-inbox"></i>
            <span>Inbox</span>
            <span class="nav-mobile-badge">3</span>
          </button>
        </li>
        <li>
          <button class="dropdown-item nav-mobile-item"
                  type="button"
                  data-bs-toggle="modal"
                  data-bs-target="#settingsModal">
            <i class="fas fa-cog"></i>
            <span>Settings</span>
          </button>
        </li>
      </ul>
    </div>

  </div>
</nav>

<!-- ============================================================= -->
<!-- INBOX MODAL                                                   -->
<!-- ============================================================= -->
<div class="modal fade" id="inboxModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title"><i class="fas fa-inbox me-2"></i>Inbox</h5>
        <button type="button" class="btn-modal-close" data-bs-dismiss="modal" aria-label="Close">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <ul class="inbox-list">
          <li class="inbox-item">
            <div class="inbox-icon inbox-icon-star"><i class="fas fa-star"></i></div>
            <div class="inbox-text">
              <strong>Welcome!</strong>
              <span>Start your monster matching adventure!</span>
            </div>
          </li>
          <li class="inbox-item">
            <div class="inbox-icon inbox-icon-coin"><i class="fas fa-coins"></i></div>
            <div class="inbox-text">
              <strong>Reward!</strong>
              <span>You earned 50 points for your first match.</span>
            </div>
          </li>
          <li class="inbox-item">
            <div class="inbox-icon inbox-icon-unlock"><i class="fas fa-unlock"></i></div>
            <div class="inbox-text">
              <strong>New Monster!</strong>
              <span>You unlocked the <em>Dragon</em> skin.</span>
            </div>
          </li>
          <li class="inbox-item">
            <div class="inbox-icon inbox-icon-gem"><i class="fas fa-gem"></i></div>
            <div class="inbox-text">
              <strong>Daily Bonus</strong>
              <span>Log in tomorrow for a free reward.</span>
            </div>
          </li>
        </ul>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn-modal-close" data-bs-dismiss="modal">
          <i class="fas fa-check me-2"></i> Got it!
        </button>
      </div>
    </div>
  </div>
</div>

<!-- ============================================================= -->
<!-- SETTINGS MODAL                                                -->
<!-- ============================================================= -->
<div class="modal fade" id="settingsModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title"><i class="fas fa-cog me-2"></i>Settings</h5>
        <button type="button" class="btn-modal-close" data-bs-dismiss="modal" aria-label="Close">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body settings-body">
        <div class="settings-item">
          <span><i class="fas fa-volume-up me-2"></i>Sound Effects</span>
          <div class="form-check form-switch">
            <input class="form-check-input settings-toggle" type="checkbox" id="soundToggle" data-key="soundEnabled" checked>
          </div>
        </div>
        <div class="settings-item">
          <span><i class="fas fa-music me-2"></i>Background Music</span>
          <div class="form-check form-switch">
            <input class="form-check-input settings-toggle" type="checkbox" id="musicToggle" data-key="musicEnabled" checked>
          </div>
        </div>
        <div class="settings-item">
          <span><i class="fas fa-dragon me-2"></i>Difficulty</span>
          <select class="form-select form-select-sm settings-select" id="difficultySelect">
            <option value="easy">Easy</option>
            <option value="normal" selected>Normal</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <hr class="settings-divider">
        <button class="btn-reset-progress" id="resetProgressBtn">
          <i class="fas fa-trash-alt me-2"></i> Reset Progress
        </button>
      </div>
    </div>
  </div>
</div>