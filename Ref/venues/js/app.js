/* ═══════════════════════════════════════════════════════════════════
   CupVerse – Main Application Script
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── State ── */
  let currentFilter = 'All';
  let currentView = 'grid';
  let currentModalIndex = null;
  let filteredStadiums = [...STADIUMS];

  /* ── DOM refs ── */
  const loader = document.getElementById('loader');
  const grid = document.getElementById('stadiums-grid');
  const counterEl = document.getElementById('stadiums-count');
  const modalOverlay = document.getElementById('modal-overlay');
  const filterBtns = document.querySelectorAll('.nav-filter-btn');
  const viewBtns = document.querySelectorAll('.view-btn');

  /* ── Loader ── */
  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('hidden');
    }, 2200);
  });

  /* ── Render Cards ── */
  function renderCards() {
    grid.innerHTML = '';
    counterEl.textContent = filteredStadiums.length;

    filteredStadiums.forEach((s, i) => {
      const card = buildCard(s, i);
      grid.appendChild(card);
    });
  }

  function buildCard(s, delay) {
    const card = document.createElement('article');
    card.className = 'stadium-card';
    card.style.animationDelay = `${delay * 60}ms`;
    card.dataset.id = s.id;

    card.innerHTML = `
      <div class="stadium-card-img">
        <img src="${s.thumb}" 
             alt="${s.name}" 
             loading="lazy"
             onerror="this.src='https://via.placeholder.com/640x360/12151C/C9A84C?text=${encodeURIComponent(s.name)}'">
        <div class="stadium-card-img-overlay"></div>
        <div class="stadium-card-country-tag">${s.flag} ${s.country}</div>
        <div class="stadium-highlight-tag">${s.highlight}</div>
      </div>
      <div class="stadium-card-body">
        <div class="stadium-card-location">
          <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="currentColor" opacity="0.4"/><circle cx="5" cy="5" r="2" fill="currentColor"/></svg>
          ${s.city}
        </div>
        <h3 class="stadium-card-name">${s.name}</h3>
        <div class="stadium-card-stats">
          <div class="stat-item">
            <span class="stat-value">${(s.capacity / 1000).toFixed(0)}K</span>
            <span class="stat-label">Capacity</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${s.opened}</span>
            <span class="stat-label">Opened</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${s.worldCupMatches}</span>
            <span class="stat-label">WC Matches</span>
          </div>
        </div>
        <div class="stadium-card-teams">${s.teams}</div>
      </div>
      <div class="stadium-card-arrow">→</div>
    `;

    card.addEventListener('click', () => openModal(s.id));
    return card;
  }

  /* ── Filters ── */
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;

      if (currentFilter === 'All') {
        filteredStadiums = [...STADIUMS];
      } else {
        filteredStadiums = STADIUMS.filter(s => s.country === currentFilter);
      }

      // Also sync country bands
      document.querySelectorAll('.country-band').forEach(b => {
        b.classList.toggle('active', b.dataset.country === currentFilter);
      });

      renderCards();
    });
  });

  /* ── Country Bands ── */
  document.querySelectorAll('.country-band').forEach(band => {
    band.addEventListener('click', () => {
      const country = band.dataset.country;
      // Scroll to stadiums
      document.getElementById('stadiums-section').scrollIntoView({ behavior: 'smooth' });
      // Trigger filter
      const filterBtn = document.querySelector(`.nav-filter-btn[data-filter="${country}"]`);
      if (filterBtn) filterBtn.click();
    });
  });

  /* ── View Toggle ── */
  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      grid.className = currentView === 'list' ? 'list-view' : '';
      grid.id = 'stadiums-grid';
    });
  });

  /* ── Modal ── */
  function openModal(id) {
    const s = STADIUMS.find(x => x.id === id);
    if (!s) return;
    currentModalIndex = STADIUMS.indexOf(s);
    populateModal(s);
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function populateModal(s) {
    const mc = document.getElementById('modal-container');
    mc.innerHTML = `
      <div class="modal-hero">
        <img src="${s.image}" 
             alt="${s.name}"
             onerror="this.src='https://via.placeholder.com/960x380/12151C/C9A84C?text=${encodeURIComponent(s.name)}'">
        <div class="modal-hero-overlay">
          <div class="modal-country-badge">${s.flag} ${s.country} · ${s.city}</div>
          <h2 class="modal-stadium-name">${s.name}</h2>
          <span class="modal-highlight-tag">${s.highlight}</span>
        </div>
        <button class="modal-close" id="modal-close-btn" aria-label="Close">✕</button>
      </div>
      <div class="modal-body">
        <div class="modal-stats-row">
          <div class="modal-stat-card">
            <span class="modal-stat-icon">🏟️</span>
            <span class="modal-stat-value">${s.capacity.toLocaleString()}</span>
            <span class="modal-stat-label">Capacity</span>
          </div>
          <div class="modal-stat-card">
            <span class="modal-stat-icon">📅</span>
            <span class="modal-stat-value">${s.opened}</span>
            <span class="modal-stat-label">Year Opened</span>
          </div>
          <div class="modal-stat-card">
            <span class="modal-stat-icon">⚽</span>
            <span class="modal-stat-value">${s.worldCupMatches}</span>
            <span class="modal-stat-label">WC Matches</span>
          </div>
          <div class="modal-stat-card">
            <span class="modal-stat-icon">🌱</span>
            <span class="modal-stat-value" style="font-size:1rem;padding-top:4px">${s.surface}</span>
            <span class="modal-stat-label">Surface</span>
          </div>
        </div>
        <div class="modal-teams-row">
          <span class="modal-teams-label">Home Teams</span>
          <span class="modal-teams-value">${s.teams}</span>
        </div>
        <div class="modal-grid">
          <div>
            <div class="modal-facts-title">About this Venue</div>
            <div class="modal-description">${s.description}</div>
          </div>
          <div>
            <div class="modal-facts-title">Key Facts</div>
            <ul class="modal-facts-list">
              ${s.facts.map(f => `<li>${f}</li>`).join('')}
            </ul>
          </div>
        </div>
        <div class="modal-nav">
          <button class="modal-nav-btn" id="modal-prev" ${currentModalIndex === 0 ? 'disabled' : ''}>
            ← Prev
          </button>
          <div class="modal-nav-counter">
            Venue <span>${currentModalIndex + 1}</span> of <span>${STADIUMS.length}</span>
          </div>
          <button class="modal-nav-btn" id="modal-next" ${currentModalIndex === STADIUMS.length - 1 ? 'disabled' : ''}>
            Next →
          </button>
        </div>
      </div>
    `;

    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal-prev').addEventListener('click', () => {
      if (currentModalIndex > 0) openModal(STADIUMS[currentModalIndex - 1].id);
    });
    document.getElementById('modal-next').addEventListener('click', () => {
      if (currentModalIndex < STADIUMS.length - 1) openModal(STADIUMS[currentModalIndex + 1].id);
    });
  }

  function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
    currentModalIndex = null;
  }

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (!modalOverlay.classList.contains('open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowRight' && currentModalIndex < STADIUMS.length - 1)
      openModal(STADIUMS[currentModalIndex + 1].id);
    if (e.key === 'ArrowLeft' && currentModalIndex > 0)
      openModal(STADIUMS[currentModalIndex - 1].id);
  });

  /* ── Scroll animation for cards ── */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '';
        entry.target.style.transform = '';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  /* ── Hero CTA ── */
  document.getElementById('hero-explore-btn').addEventListener('click', () => {
    document.getElementById('stadiums-section').scrollIntoView({ behavior: 'smooth' });
  });

  /* ── Init ── */
  renderCards();

  /* ── Animate hero numbers ── */
  function animateCounter(el, target, duration) {
    let start = 0;
    const step = target / (duration / 16);
    const update = () => {
      start += step;
      el.textContent = Math.round(Math.min(start, target)).toLocaleString();
      if (start < target) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  setTimeout(() => {
    const capEl = document.getElementById('hero-total-cap');
    if (capEl) animateCounter(capEl, 1036000, 1600);
  }, 2400);

})();
