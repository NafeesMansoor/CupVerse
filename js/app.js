import { loadMatches, getMatchById, getMatches, getTeams, invalidateCache, getActiveKnockoutStage } from './data.js';
import { performSync, getSyncStatus, runBracketSync } from './sync.js';
import { loadSquads, getSquad } from './squad.js';
import {
  renderApp, renderHomeDashboard, renderMatches, renderMatchesList,
  renderMatchDetail, renderTeams, renderCalendar, renderScorers,
  renderSettings, renderStandings, renderTeamProfile,
  renderVenues, renderVenueDetail, updateNavActive,
  showPlayerModal, updateSquadGrid,
} from './ui.js';
import {
  renderPredictionTree,
  getUserPredictions, saveUserPredictions, clearUserPredictions,
  getPredMode, setPredMode,
} from './prediction.js';
import { getStadiumByName } from './venues.js';
import { findEspnEventId, fetchEspnLiveData } from './espn.js';
import { parseRoute, navigateTo } from './router.js';
import { observePlayerPhotos, stopObservingPhotos, initPhotoObserver, preloadPhotoMap } from './photos.js';
import { createCountdown, createBlockCountdown } from './countdown.js';
import { generateShareCard } from './shareCard.js';
import {
  getTheme, setTheme, setTimezone, setAiEnabled,
  clearStorage, toggleFavoriteMatch, toggleFavTeam,
  setNote, getNote, isMatchFavorite,
  toggleCardCollapse,
} from './storage.js';

const APP_VERSION = '3.0.6';

const splash = document.getElementById('splash');
const offlineBanner = document.getElementById('offline-banner');
let countdownClear = null;
let fixtureFilterTimer = null;
let squadFilterTimer = null;
let deferredInstallPrompt = null;
let espnRefreshTimer = null;
let bracketSyncTimer = null;
let squadState = { pos: 'ALL', view: 'cards', query: '' };

function applySquadFilter(players, state) {
  return players.filter(p => {
    const posOk = state.pos === 'ALL' || p.pos === state.pos;
    const q = state.query;
    const qOk = !q || p.name.toLowerCase().includes(q)
      || String(p.number).includes(q)
      || p.club.toLowerCase().includes(q);
    return posOk && qOk;
  });
}

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

// ── Theme ─────────────────────────────────────────────────
function applyTheme(theme) {
  document.body.dataset.theme = theme;
  setTheme(theme);
}

// ── Offline banner ─────────────────────────────────────────
function updateOfflineBanner() {
  offlineBanner.classList.toggle('hidden', navigator.onLine);
}

// ── Countdown ─────────────────────────────────────────────
function attachCountdown() {
  if (countdownClear) { countdownClear(); countdownClear = null; }
  const clearFns = [];
  document.querySelectorAll('.countdown-blocks[data-countdown-target]').forEach(el => {
    clearFns.push(createBlockCountdown(el.dataset.countdownTarget, el));
  });
  document.querySelectorAll('[data-countdown-target]:not(.countdown-blocks)').forEach(el => {
    clearFns.push(createCountdown(el.dataset.countdownTarget, el));
  });
  if (clearFns.length) countdownClear = () => clearFns.forEach(f => f());
}

// ── Bracket Sync Scheduler ────────────────────────────────
function showSyncToast(lines) {
  document.getElementById('bracket-sync-toast')?.remove();
  const toast = document.createElement('div');
  toast.id = 'bracket-sync-toast';
  toast.className = 'bsync-toast';
  toast.innerHTML = `
    <div class="bsync-icon">🏆</div>
    <div class="bsync-body">
      <div class="bsync-title">Bracket Updated</div>
      ${lines.map(l => `<div class="bsync-line">${l}</div>`).join('')}
    </div>
    <button class="bsync-close" onclick="this.closest('.bsync-toast').remove()">✕</button>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('bsync-toast--in'), 50);
  setTimeout(() => {
    toast.classList.remove('bsync-toast--in');
    setTimeout(() => toast.remove(), 400);
  }, 6000);
}

async function scheduledBracketSync() {
  try {
    const { newResults, winnerNames } = await runBracketSync();
    if (newResults > 0) {
      const lines = winnerNames.map(n => `✓ ${n} advanced`);
      showSyncToast(lines);
      // Re-render the current page so bracket card / home reflects new results
      renderCurrentRoute();
    }
  } catch { /* silent — offline */ }
}

function startBracketSyncScheduler() {
  if (bracketSyncTimer) return; // already running
  // First run after 4 seconds, then every 5 minutes
  setTimeout(() => {
    scheduledBracketSync();
    bracketSyncTimer = setInterval(scheduledBracketSync, 5 * 60 * 1000);
  }, 4000);
}

// ── ESPN Live Refresh ──────────────────────────────────────
function stopEspnLiveRefresh() {
  if (espnRefreshTimer) { clearInterval(espnRefreshTimer); espnRefreshTimer = null; }
}

async function populateEspnLiveCard(matchId, homeTeam, awayTeam, dateStr) {
  const container = document.getElementById(`espn-live-${matchId}`);
  if (!container) return;

  try {
    const eventId = await findEspnEventId(homeTeam, awayTeam, dateStr);
    if (!eventId) throw new Error('no ESPN event');
    const data = await fetchEspnLiveData(eventId);
    if (!data) throw new Error('no ESPN data');

    // Update hero score
    const heroEl = document.getElementById(`espn-hero-score-${matchId}`);
    if (heroEl) {
      heroEl.innerHTML = `
        <div class="espn-hero-live-score">${data.homeScore} – ${data.awayScore}</div>
        <div class="espn-hero-clock"><span class="sb-live-dot"></span> ${data.clock}</div>`;
    }

    const hs = data.stats.home || {};
    const as = data.stats.away || {};
    const hPoss = parseFloat(hs['POSSESSION'] || 50);
    const aPoss = parseFloat(as['POSSESSION'] || 50);

    const statRow = (label, hv, av) =>
      `<div class="espn-stat-row">
        <span class="espn-stat-val">${hv || '0'}</span>
        <span class="espn-stat-label">${label}</span>
        <span class="espn-stat-val">${av || '0'}</span>
       </div>`;

    const eventsHTML = data.events.map(e => {
      const icon = e.type === 'goal' ? '⚽'
        : e.type === 'yellowcard' ? '🟡'
        : e.type === 'redcard' ? '🔴'
        : e.type === 'substitution' ? '🔄'
        : '•';
      const scoreTag = e.scoringPlay && e.homeScore != null
        ? `<span class="espn-ev-score">${e.homeScore}–${e.awayScore}</span>` : '';
      return `<div class="espn-event espn-event--${e.homeAway || 'home'}">
        <span class="espn-ev-clock">${e.clock}'</span>
        <span class="espn-ev-icon">${icon}</span>
        <span class="espn-ev-desc">${e.athlete || e.desc}</span>
        ${scoreTag}
      </div>`;
    }).join('');

    container.innerHTML = `
      <div class="glass-card espn-live-card">
        <div class="espn-live-header">
          <span class="espn-live-badge"><span class="sb-live-dot"></span> LIVE</span>
          <span class="espn-clock-label">${data.periodShort} · ${data.clock}</span>
          <button class="espn-refresh-btn" id="espn-refresh-btn-${matchId}" title="Refresh">���</button>
        </div>

        <div class="espn-poss-wrap">
          <span class="espn-poss-pct">${hPoss.toFixed(0)}%</span>
          <div class="espn-poss-bar"><div class="espn-poss-fill" style="width:${hPoss}%"></div></div>
          <span class="espn-poss-pct">${aPoss.toFixed(0)}%</span>
        </div>
        <div class="espn-poss-title">Possession</div>

        <div class="espn-stats">
          ${statRow('Shots', hs['SHOTS'], as['SHOTS'])}
          ${statRow('On Target', hs['ON GOAL'], as['ON GOAL'])}
          ${statRow('Corners', hs['Corner Kicks'], as['Corner Kicks'])}
          ${statRow('Fouls', hs['Fouls'], as['Fouls'])}
          ${statRow('Yellows', hs['Yellow Cards'], as['Yellow Cards'])}
          ${statRow('Reds', hs['Red Cards'], as['Red Cards'])}
        </div>

        ${data.events.length ? `
          <div class="espn-events-title">Key Events</div>
          <div class="espn-events">${eventsHTML}</div>` : ''}

        ${data.commentary.length ? `
          <div class="espn-events-title" style="margin-top:12px">Commentary</div>
          <div class="espn-commentary">
            ${data.commentary.map(c =>
              `<div class="espn-comment">
                ${c.clock?.displayValue ? `<span class="espn-ev-clock">${c.clock.displayValue}'</span>` : ''}
                <span>${c.text}</span>
              </div>`
            ).join('')}
          </div>` : ''}
      </div>`;

    document.getElementById(`espn-refresh-btn-${matchId}`)
      ?.addEventListener('click', () => populateEspnLiveCard(matchId, homeTeam, awayTeam, dateStr));

  } catch {
    const container2 = document.getElementById(`espn-live-${matchId}`);
    if (container2) container2.innerHTML = '';
  }
}

function startEspnLiveRefresh(matchId, homeTeam, awayTeam, dateStr) {
  stopEspnLiveRefresh();
  populateEspnLiveCard(matchId, homeTeam, awayTeam, dateStr);
  espnRefreshTimer = setInterval(
    () => populateEspnLiveCard(matchId, homeTeam, awayTeam, dateStr),
    30000
  );
}

// ── Route rendering ────────────────────────────────────────
function renderCurrentRoute() {
  const route = parseRoute();
  let view;
  switch (route.page) {
    case 'matches':   view = renderMatches(); break;
    case 'match': {
      const mid = route.params.id;
      view = renderMatchDetail(mid);
      // ESPN live refresh — start after render (handled below via matchId sentinel)
      break;
    }
    case 'teams':     view = renderTeams(); break;
    case 'team':
      squadState = { pos: 'ALL', view: 'cards', query: '' };
      view = renderTeamProfile(route.params.name);
      break;
    case 'venues':    view = renderVenues(); break;
    case 'venue':     view = renderVenueDetail(route.params.id); break;
    case 'calendar':  view = renderCalendar(); break;
    case 'scorers':   view = renderScorers(); break;
    case 'standings': view = renderStandings(); break;
    case 'settings':         view = renderSettings(APP_VERSION); break;
    case 'prediction-tree':  view = renderPredictionTree(getPredMode()); break;
    default:                 view = renderHomeDashboard(); break;
  }
  renderApp(view);
  const navPage = route.page === 'match' ? 'matches'
    : route.page === 'team'  ? 'teams'
    : route.page === 'venue' ? 'venues'
    : route.page || 'home';
  updateNavActive(navPage);
  window.scrollTo(0, 0);

  if (route.page === 'matches') {
    initMatchFilters();
  }
  if (route.page === 'calendar') {
    initCalendarFilters();
  }

  // Lazy-load player photos on pages that show player avatars
  stopObservingPhotos();
  if (route.page === 'home' || route.page === 'scorers') {
    initPhotoObserver();
    observePlayerPhotos(document.getElementById('app'));
  }

  attachCountdown();

  // ESPN live refresh — start for live match pages, stop everywhere else
  stopEspnLiveRefresh();
  if (route.page === 'match') {
    const m = getMatchById(route.params.id);
    if (m && m.status === 'live') {
      startEspnLiveRefresh(m.id, m.homeTeam.name, m.awayTeam.name, m.date);
    }
  }
}

// ── Fixture filters ───────────────────────────────────────
function initMatchFilters() {
  const search = document.getElementById('match-search');
  const stageFilter = document.getElementById('match-stage-filter');
  const groupFilter = document.getElementById('match-group-filter');

  const runFilter = () => {
    const q = (search?.value || '').trim().toLowerCase();
    const stage = stageFilter?.value || '';
    const group = groupFilter?.value || '';

    const filtered = getMatches().filter(m => {
      const text = `${m.homeTeam.name} ${m.awayTeam.name} ${m.stadium} ${m.venue}`.toLowerCase();
      return (!q || text.includes(q))
          && (!stage || m.stage === stage)
          && (!group || m.group === group);
    });
    renderMatchesList(filtered);
  };

  const debounce = (fn) => {
    clearTimeout(fixtureFilterTimer);
    fixtureFilterTimer = setTimeout(fn, 200);
  };

  if (search) search.addEventListener('input', () => debounce(runFilter));
  if (stageFilter) stageFilter.addEventListener('change', runFilter);
  if (groupFilter) groupFilter.addEventListener('change', runFilter);
  runFilter();
}

// ── Calendar filters ──────────────────────────────────────
function scrollDateStrip(targetDate) {
  requestAnimationFrame(() => {
    const strip = document.getElementById('cal-date-strip');
    if (!strip) return;
    const target = targetDate
      ? strip.querySelector(`[data-ds-date="${targetDate}"]`)
      : (strip.querySelector('.date-pill.active') || strip.querySelector('.date-pill.is-today'));
    if (!target) return;
    const left = target.offsetLeft - (strip.clientWidth / 2) + (target.offsetWidth / 2);
    strip.scrollTo({ left: Math.max(0, left), behavior: 'instant' });
  });
}

function initCalendarFilters() {
  const teamSel = document.getElementById('cal-team-filter');
  if (teamSel) teamSel.addEventListener('change', () => {
    renderApp(renderCalendar({ team: teamSel.value }));
    initCalendarFilters();
    scrollDateStrip();
  });
  scrollDateStrip();
}

// ── iCal Export ───────────────────────────────────────────
function exportIcal() {
  const matches = getMatches();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CupVerse//World Cup 2026//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:FIFA World Cup 2026',
    'X-WR-TIMEZONE:UTC',
  ];
  matches.forEach(m => {
    const start = new Date(m.datetime);
    const end   = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const fmt   = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    lines.push(
      'BEGIN:VEVENT',
      `UID:cupverse-${m.id}@wc2026`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${m.homeTeam.name} vs ${m.awayTeam.name}`,
      `LOCATION:${m.stadium}`,
      `DESCRIPTION:${m.stage}${m.group ? ` Group ${m.group}` : ''} - FIFA World Cup 2026`,
      'END:VEVENT',
    );
  });
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'wc2026-schedule.ics'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Refresh ────────────────────────────────────────────────
async function refreshData() {
  await performSync({ force: true });
  renderCurrentRoute();
  showToast('Data refreshed.');
}

// ── Share Card ─────────────────────────────────────────────
async function handleShareCard(id) {
  const match = getMatchById(id);
  if (match) await generateShareCard(match);
}

// ── PDF Export ─────────────────────────────────────────────
async function handleExportPDF(id) {
  const match = getMatchById(id);
  if (!match) return;
  try {
    const { jsPDF } = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.es.min.js');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const note = getNote(id) || { text: '', photos: [] };
    const score = match.score;
    const vi = match.venueInfo;

    doc.setFillColor(15, 15, 19);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(240, 240, 245);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('CupVerse Match Report', 20, 28);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 200);
    doc.text(`${match.stage}${match.group ? ` · Group ${match.group}` : ''}`, 20, 38);
    doc.setDrawColor(59, 111, 212);
    doc.setLineWidth(0.5);
    doc.line(20, 42, 190, 42);

    doc.setTextColor(240, 240, 245);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`${match.homeTeam.name} vs ${match.awayTeam.name}`, 20, 54);
    if (score) {
      doc.setFontSize(28);
      doc.setTextColor(91, 142, 244);
      doc.text(`${score.home} – ${score.away}`, 20, 68);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(180, 180, 200);
    let y = score ? 80 : 66;
    doc.text(`Venue: ${vi.fullName || vi.name}`, 20, y);
    y += 8;
    doc.text(`City: ${vi.city || '—'}  |  Capacity: ${vi.capacity ? vi.capacity.toLocaleString() : '—'}`, 20, y);
    y += 8;
    doc.text(`Surface: ${vi.surface || '—'}  |  Opened: ${vi.opened || '—'}`, 20, y);
    y += 12;

    if (note.text) {
      doc.setDrawColor(59, 111, 212);
      doc.line(20, y, 190, y);
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(240, 240, 245);
      doc.text('Match Notes', 20, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 180, 200);
      const lines = doc.splitTextToSize(note.text, 170);
      doc.text(lines, 20, y);
    }

    doc.setTextColor(102, 102, 128);
    doc.setFontSize(9);
    doc.text('Generated by CupVerse · Your Tournament Command Center', 20, 285);
    doc.save(`cupverse-match-${match.id}.pdf`);
  } catch (err) {
    console.warn('PDF export failed', err);
    alert('PDF export requires an internet connection for the first load.');
  }
}

// ── Save Note ─────────────────────────────────────────────
function handleSaveNote(id) {
  const textarea = document.getElementById(`match-note-${id}`);
  const photoInput = document.getElementById(`note-photos-${id}`);
  const text = textarea ? textarea.value : '';

  const existingNote = getNote(id) || { photos: [] };
  const newPhotos = [];

  if (photoInput && photoInput.files.length) {
    const files = Array.from(photoInput.files);
    let processed = 0;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        newPhotos.push(e.target.result);
        processed++;
        if (processed === files.length) {
          setNote(id, text, [...existingNote.photos, ...newPhotos]);
          renderCurrentRoute();
        }
      };
      reader.readAsDataURL(file);
    });
  } else {
    setNote(id, text, existingNote.photos);
    showToast('Note saved.');
  }
}

// ── Install Guide Modal ───────────────────────────────────
function showInstallGuide() {
  const existing = document.getElementById('cv-install-guide');
  if (existing) existing.remove();

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const el = document.createElement('div');
  el.id = 'cv-install-guide';
  el.className = 'cv-install-guide-wrap';
  el.innerHTML = `
    <div class="cv-guide-backdrop" data-action="close-install-guide"></div>
    <div class="cv-guide-card glass-card">
      <button class="cv-modal-close" data-action="close-install-guide">×</button>
      <div class="cv-guide-title">📲 Install CupVerse</div>
      <div class="cv-guide-sub">Add to your home screen for the full app experience.</div>

      <div class="cv-guide-platform ${isIOS ? 'active' : ''}">
        <div class="cv-guide-platform-label">🍎 iPhone / iPad (Safari)</div>
        <div class="cv-guide-steps">
          <div class="cv-guide-step"><span class="cv-guide-num">1</span>Open this page in <strong>Safari</strong></div>
          <div class="cv-guide-step"><span class="cv-guide-num">2</span>Tap the <strong>Share</strong> button (square with arrow)</div>
          <div class="cv-guide-step"><span class="cv-guide-num">3</span>Scroll and tap <strong>"Add to Home Screen"</strong></div>
          <div class="cv-guide-step"><span class="cv-guide-num">4</span>Tap <strong>"Add"</strong> — CupVerse appears on your screen</div>
        </div>
      </div>

      <div class="cv-guide-platform ${!isIOS ? 'active' : ''}">
        <div class="cv-guide-platform-label">🤖 Android (Chrome)</div>
        <div class="cv-guide-steps">
          <div class="cv-guide-step"><span class="cv-guide-num">1</span>Open this page in <strong>Chrome</strong></div>
          <div class="cv-guide-step"><span class="cv-guide-num">2</span>Tap the <strong>⋮ menu</strong> (top right)</div>
          <div class="cv-guide-step"><span class="cv-guide-num">3</span>Tap <strong>"Add to Home screen"</strong></div>
          <div class="cv-guide-step"><span class="cv-guide-num">4</span>Tap <strong>"Add"</strong> to confirm</div>
        </div>
      </div>

      <div class="cv-guide-platform">
        <div class="cv-guide-platform-label">🖥️ Desktop (Chrome / Edge)</div>
        <div class="cv-guide-steps">
          <div class="cv-guide-step"><span class="cv-guide-num">1</span>Look for the <strong>install icon</strong> in the address bar</div>
          <div class="cv-guide-step"><span class="cv-guide-num">2</span>Click it and select <strong>"Install"</strong></div>
        </div>
      </div>

      ${deferredInstallPrompt ? `
      <button class="btn btn-primary" style="width:100%;margin-top:14px;" data-action="install-pwa">Install Now</button>` : ''}
    </div>`;

  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('visible'));
}

// ── Update Banner ──────────────────────────────────────────
function showUpdateBanner() {
  const banner = document.getElementById('update-banner');
  if (banner) banner.classList.remove('hidden');
}

// ── Toast ──────────────────────────────────────────────────
function showToast(msg) {
  const toast = document.createElement('div');
  toast.textContent = msg;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
    background: 'var(--accent-blue)', color: '#fff', padding: '10px 20px',
    borderRadius: '999px', fontWeight: '600', fontSize: '0.9rem',
    zIndex: '9999', opacity: '0', transition: 'opacity 0.2s ease',
    pointerEvents: 'none',
  });
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; });
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 250); }, 2000);
}

// ── Double-click collapse ─────────────────────────────────
function handleDblClick(event) {
  const card = event.target.closest('[data-card-id]');
  if (!card) return;
  event.preventDefault();
  const cardId = card.dataset.cardId;
  const isNowCollapsed = toggleCardCollapse(cardId);
  card.dataset.collapsed = String(isNowCollapsed);
}

// ── Action handler ─────────────────────────────────────────
function handleAction(event) {
  const btn = event.target.closest('[data-action]');
  if (!btn) return;
  const { action, id, sort, date, code, scorerId } = btn.dataset;

  switch (action) {
    case 'open-match':
      navigateTo(`match/${id}`);
      break;

    case 'open-team': {
      const name = btn.dataset.name;
      if (name) navigateTo(`team/${encodeURIComponent(name)}`);
      break;
    }

    case 'open-venue':
      navigateTo(`venue/${btn.dataset.id}`);
      break;

    case 'open-venue-by-name': {
      const st = getStadiumByName(btn.dataset.name);
      if (st) navigateTo(`venue/${st.id}`);
      else    navigateTo('venues');
      break;
    }

    case 'venue-country':
      renderApp(renderVenues(btn.dataset.country));
      break;

    case 'nav-back':
      if (history.length > 1) history.back();
      else navigateTo('teams');
      break;

    case 'toggle-star':
      toggleFavoriteMatch(id);
      renderCurrentRoute();
      break;

    case 'share-card':
      handleShareCard(id);
      break;

    case 'export-pdf':
      handleExportPDF(id);
      break;

    case 'save-note':
      handleSaveNote(id);
      break;

    case 'teams-sort':
      renderApp(renderTeams(sort));
      break;

    case 'toggle-fav-team':
      toggleFavTeam(code);
      renderApp(renderTeams());
      break;

    case 'calendar-date':
      renderApp(renderCalendar({ date }));
      initCalendarFilters();
      scrollDateStrip(date);
      attachCountdown();
      break;

    case 'cal-filter': {
      const filter = btn.dataset.filter;
      if (filter === 'favs') {
        const isActive = btn.classList.contains('active');
        renderApp(renderCalendar({ favs: !isActive }));
      }
      initCalendarFilters();
      scrollDateStrip();
      break;
    }

    case 'cal-clear-filters':
      renderApp(renderCalendar({ clearFilters: true }));
      initCalendarFilters();
      scrollDateStrip();
      break;

    case 'ical-export':
      exportIcal();
      break;

    case 'pulse-chip': {
      const pulse = btn.dataset.pulse;
      renderApp(renderHomeDashboard(pulse));
      attachCountdown();
      break;
    }

    case 'refresh-data':
      refreshData();
      break;

    case 'clear-storage':
      if (confirm('Clear all notes and favorites?')) {
        clearStorage();
        renderCurrentRoute();
      }
      break;

    case 'generate-pdf':
      window.print();
      break;

    case 'kb-tab': {
      const stage = btn.dataset.stage;
      const card = document.getElementById('kb-card');
      if (!card) break;
      card.querySelectorAll('.kb-tab').forEach(b => b.classList.toggle('kb-tab--active', b.dataset.stage === stage));
      card.querySelectorAll('.kb-panel').forEach(p => p.classList.toggle('kb-panel--active', p.dataset.stage === stage));
      break;
    }

    case 'match-tab': {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.tab === tab));
      break;
    }

    case 'team-tab': {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tp-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
      document.querySelectorAll('.tp-tab-panel').forEach(p => p.classList.toggle('active', p.dataset.tab === tab));
      if (tab === 'squad') {
        // Start lazy-loading player photos now that the squad panel is visible
        const squadPanel = document.querySelector('.tp-tab-panel[data-tab="squad"]');
        if (squadPanel) observePlayerPhotos(squadPanel);
      } else {
        stopObservingPhotos();
      }
      break;
    }

    case 'open-player': {
      const teamName = btn.dataset.team;
      const num = parseInt(btn.dataset.playerNum);
      const player = getSquad(teamName).find(p => p.number === num);
      const team = getTeams().find(t => t.name === teamName);
      if (player && team) {
        showPlayerModal(player, teamName, team.flag);
        // Lazy-load photo in the modal after it appears in the DOM
        requestAnimationFrame(() => {
          const modal = document.getElementById('cv-player-modal');
          if (modal) observePlayerPhotos(modal);
        });
      }
      break;
    }

    case 'close-player-modal': {
      const modal = document.getElementById('cv-player-modal');
      if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => modal.remove(), 220);
      }
      break;
    }

    case 'squad-filter': {
      const teamName = btn.dataset.team;
      squadState.pos = btn.dataset.pos;
      document.querySelectorAll('.spf-btn').forEach(b => b.classList.toggle('active', b.dataset.pos === squadState.pos));
      updateSquadGrid(teamName, applySquadFilter(getSquad(teamName), squadState), squadState.view);
      break;
    }

    case 'squad-view': {
      const teamName = btn.dataset.team;
      squadState.view = btn.dataset.view;
      document.querySelectorAll('.svt-btn[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === squadState.view));
      updateSquadGrid(teamName, applySquadFilter(getSquad(teamName), squadState), squadState.view);
      break;
    }

    case 'squad-formation': {
      const teamName = btn.dataset.team;
      const panel = document.getElementById(`formation-panel-${teamName}`);
      if (panel) {
        panel.classList.toggle('hidden');
        btn.classList.toggle('active');
      }
      break;
    }

    case 'install-pwa':
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then(() => { deferredInstallPrompt = null; });
      }
      break;

    case 'install-guide':
      showInstallGuide();
      break;

    case 'close-install-guide': {
      const guide = document.getElementById('cv-install-guide');
      if (guide) { guide.classList.remove('visible'); setTimeout(() => guide.remove(), 220); }
      break;
    }

    case 'sync-data':
      refreshData();
      break;

    case 'nav-calendar':
      navigateTo('calendar');
      break;

    case 'nav-fixtures':
      navigateTo('matches');
      break;

    case 'go-prediction-tree':
      navigateTo('prediction-tree');
      break;

    case 'pred-mode': {
      const m = btn.dataset.mode;
      setPredMode(m);
      renderApp(renderPredictionTree(m));
      updateNavActive('prediction-tree');
      attachCountdown();
      break;
    }

    case 'predict-pick': {
      const matchId = btn.dataset.match;
      const code    = btn.dataset.code;
      const preds   = getUserPredictions();
      if (preds[matchId] === code) {
        delete preds[matchId];
      } else {
        preds[matchId] = code;
      }
      saveUserPredictions(preds);
      renderApp(renderPredictionTree('predict'));
      updateNavActive('prediction-tree');
      break;
    }

    case 'toggle-round': {
      const roundSlug = btn.dataset.round;
      const section = btn.closest('.mob-round');
      if (section) section.classList.toggle('mob-open');
      break;
    }

    case 'clear-predictions':
      clearUserPredictions();
      renderApp(renderPredictionTree('predict'));
      updateNavActive('prediction-tree');
      break;

    case 'update-now':
      window.location.reload();
      break;

    case 'dismiss-update': {
      const banner = document.getElementById('update-banner');
      if (banner) banner.classList.add('hidden');
      break;
    }

    default:
      break;
  }
}

// ── Change handler ─────────────────────────────────────────
function handleChange(event) {
  const el = event.target;
  if (el.id === 'theme-select') {
    applyTheme(el.value);
  } else if (el.id === 'timezone-select') {
    setTimezone(el.value);
    renderCurrentRoute();
  } else if (el.id === 'ai-toggle') {
    setAiEnabled(el.value === 'true');
  }
}

// ── Squad search (input event delegation) ─────────────────
function handleInput(event) {
  const el = event.target;
  const teamName = el.dataset.squadSearch;
  if (!teamName) return;
  clearTimeout(squadFilterTimer);
  squadFilterTimer = setTimeout(() => {
    squadState.query = el.value.trim().toLowerCase();
    updateSquadGrid(teamName, applySquadFilter(getSquad(teamName), squadState), squadState.view);
  }, 200);
}

// ── Init ───────────────────────────────────────────────────
async function init() {
  applyTheme(getTheme());
  updateOfflineBanner();
  window.addEventListener('online', updateOfflineBanner);
  window.addEventListener('offline', updateOfflineBanner);
  window.addEventListener('hashchange', renderCurrentRoute);
  document.body.addEventListener('click', handleAction);
  document.body.addEventListener('change', handleChange);
  document.body.addEventListener('dblclick', handleDblClick);
  document.body.addEventListener('input', handleInput);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('cv-player-modal');
      if (modal) { modal.classList.remove('visible'); setTimeout(() => modal.remove(), 220); }
      const guide = document.getElementById('cv-install-guide');
      if (guide) { guide.classList.remove('visible'); setTimeout(() => guide.remove(), 220); }
    }
  });

  // Phase 1 — render immediately from cached local data
  await Promise.all([loadMatches(false), loadSquads(), preloadPhotoMap()]);
  renderCurrentRoute();
  hideSplash();
  registerServiceWorker();

  // Phase 2 — background sync: fetch live scores + refresh local data if stale
  // Don't block the UI on the external worldcup26.ir request
  performSync().then(() => renderCurrentRoute()).catch(() => {});

  // Phase 3 — bracket sync scheduler: detects new knockout results every 5 min
  // and updates the bracket / home screen automatically
  startBracketSyncScheduler();
}

function hideSplash() {
  if (!splash) return;
  splash.style.opacity = '0';
  splash.style.pointerEvents = 'none';
  setTimeout(() => splash.classList.add('hidden'), 300);
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  const hadController = !!navigator.serviceWorker.controller;

  // sessionStorage persists across reloads but not across app closes.
  // We set this flag just before reloading so that the fresh page knows it
  // was already reloaded once and should not trigger another reload —
  // preventing the infinite loop caused by the new SW re-claiming the page
  // and firing controllerchange again immediately after each reload.
  const justReloaded = sessionStorage.getItem('cv_sw_reload') === '1';
  if (justReloaded) sessionStorage.removeItem('cv_sw_reload');

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !justReloaded) {
      sessionStorage.setItem('cv_sw_reload', '1');
      showToast('Updating CupVerse…');
      setTimeout(() => window.location.reload(), 800);
    }
  });

  navigator.serviceWorker.register('./sw.js').then(reg => {
    reg.update();
  }).catch(err => {
    console.warn('SW registration failed', err);
  });
}

init();
