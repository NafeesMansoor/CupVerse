import { loadMatches, getMatchById, getMatches } from './data.js';
import {
  renderApp, renderHomeDashboard, renderMatches, renderMatchesList,
  renderMatchDetail, renderTeams, renderCalendar, renderScorers,
  renderSettings, renderStandings, updateNavActive,
} from './ui.js';
import { parseRoute, navigateTo } from './router.js';
import { createCountdown, createBlockCountdown } from './countdown.js';
import { generateShareCard } from './shareCard.js';
import {
  getTheme, setTheme, setTimezone, setAiEnabled,
  clearStorage, toggleFavoriteMatch, toggleFavTeam,
  setScore, clearScore, setNote, addTopScorer, removeTopScorer,
  getNote, isMatchFavorite,
} from './storage.js';

const splash = document.getElementById('splash');
const offlineBanner = document.getElementById('offline-banner');
let countdownClear = null;
let fixtureFilterTimer = null;
let deferredInstallPrompt = null;

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

// ── Route rendering ────────────────────────────────────────
function renderCurrentRoute() {
  const route = parseRoute();
  let view;
  switch (route.page) {
    case 'matches':   view = renderMatches(); break;
    case 'match':     view = renderMatchDetail(route.params.id); break;
    case 'teams':     view = renderTeams(); break;
    case 'calendar':  view = renderCalendar(); break;
    case 'scorers':   view = renderScorers(); break;
    case 'standings': view = renderStandings(); break;
    case 'settings':  view = renderSettings(); break;
    default:          view = renderHomeDashboard(); break;
  }
  renderApp(view);
  updateNavActive(route.page === 'match' ? 'matches' : route.page || 'home');
  window.scrollTo(0, 0);

  if (route.page === 'matches') {
    initMatchFilters();
  }
  attachCountdown();
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
    const favOnly = false;

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

// ── Refresh ────────────────────────────────────────────────
async function refreshData() {
  await loadMatches(true);
  renderCurrentRoute();
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

// ── Action handler ─────────────────────────────────────────
function handleAction(event) {
  const btn = event.target.closest('[data-action]');
  if (!btn) return;
  const { action, id, sort, date, code, scorerId } = btn.dataset;

  switch (action) {
    case 'open-match':
      navigateTo(`match/${id}`);
      break;

    case 'save-score': {
      const home = document.getElementById(`home-score-${id}`)?.value;
      const away = document.getElementById(`away-score-${id}`)?.value;
      if (home !== '' && away !== '') {
        setScore(id, home, away);
        renderCurrentRoute();
      }
      break;
    }

    case 'clear-score':
      clearScore(id);
      renderCurrentRoute();
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
      renderApp(renderCalendar(date));
      attachCountdown();
      break;

    case 'add-scorer': {
      const name = document.getElementById('scorer-name')?.value?.trim();
      const team = document.getElementById('scorer-team')?.value;
      const goals = document.getElementById('scorer-goals')?.value || '0';
      const assists = document.getElementById('scorer-assists')?.value || '0';
      if (name && team) {
        addTopScorer(name, team, goals, assists);
        renderCurrentRoute();
      }
      break;
    }

    case 'remove-scorer':
      removeTopScorer(Number(btn.dataset.scorerId));
      renderCurrentRoute();
      break;

    case 'add-scorer-prefill': {
      navigateTo('scorers');
      break;
    }

    case 'refresh-data':
      refreshData();
      break;

    case 'clear-storage':
      if (confirm('Clear all scores, notes, and favorites?')) {
        clearStorage();
        renderCurrentRoute();
      }
      break;

    case 'match-tab': {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.tab === tab));
      break;
    }

    case 'install-pwa':
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then(() => { deferredInstallPrompt = null; });
      }
      break;

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

// ── Init ───────────────────────────────────────────────────
async function init() {
  applyTheme(getTheme());
  updateOfflineBanner();
  window.addEventListener('online', updateOfflineBanner);
  window.addEventListener('offline', updateOfflineBanner);
  window.addEventListener('hashchange', renderCurrentRoute);
  document.body.addEventListener('click', handleAction);
  document.body.addEventListener('change', handleChange);

  await loadMatches();
  renderCurrentRoute();
  hideSplash();
  registerServiceWorker();
}

function hideSplash() {
  if (!splash) return;
  splash.style.opacity = '0';
  splash.style.pointerEvents = 'none';
  setTimeout(() => splash.classList.add('hidden'), 300);
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('SW registration failed', err);
    });
  }
}

init();
