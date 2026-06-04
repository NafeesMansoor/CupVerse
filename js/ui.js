import {
  getMatches, getMatchById, getNextMatch, getTodaysMatches,
  getTournamentStats, getTeams, getTeamSquad, getTeamNextMatch,
  getMatchesByDate, getAllMatchDates, getGroupStandings,
} from './data.js';
import {
  getScore, setScore, clearScore, getAllScores,
  getNote, setNote,
  getTopScorers, addTopScorer, removeTopScorer,
  getFavTeams, isFavTeam, toggleFavTeam,
  getFavoriteMatches, toggleFavoriteMatch, isMatchFavorite,
  getTimezone, getTheme, setTheme, setTimezone,
  isAiEnabled, setAiEnabled, clearStorage,
} from './storage.js';
import { navigateTo } from './router.js';
import { getMatchIntelligence, getTeamColor, getTeamData } from './intelligence.js';

const app = document.getElementById('app');

// ── Timezone & Time helpers ───────────────────────────────
const TIMEZONES = [
  { label: 'Device Default', value: '' },
  { label: 'UTC', value: 'UTC' },
  { label: 'New York (EDT)', value: 'America/New_York' },
  { label: 'Chicago (CDT)', value: 'America/Chicago' },
  { label: 'Denver (MDT)', value: 'America/Denver' },
  { label: 'Los Angeles (PDT)', value: 'America/Los_Angeles' },
  { label: 'Toronto', value: 'America/Toronto' },
  { label: 'Vancouver', value: 'America/Vancouver' },
  { label: 'Mexico City', value: 'America/Mexico_City' },
  { label: 'Monterrey', value: 'America/Monterrey' },
  { label: 'Bogotá', value: 'America/Bogota' },
  { label: 'Buenos Aires', value: 'America/Argentina/Buenos_Aires' },
  { label: 'São Paulo', value: 'America/Sao_Paulo' },
  { label: 'London (BST)', value: 'Europe/London' },
  { label: 'Paris / Berlin', value: 'Europe/Paris' },
  { label: 'Istanbul', value: 'Europe/Istanbul' },
  { label: 'Moscow', value: 'Europe/Moscow' },
  { label: 'Dubai (GST)', value: 'Asia/Dubai' },
  { label: 'Karachi (PKT)', value: 'Asia/Karachi' },
  { label: 'New Delhi (IST)', value: 'Asia/Kolkata' },
  { label: 'Dhaka (BST+1)', value: 'Asia/Dhaka' },
  { label: 'Bangkok', value: 'Asia/Bangkok' },
  { label: 'Beijing / Shanghai', value: 'Asia/Shanghai' },
  { label: 'Seoul', value: 'Asia/Seoul' },
  { label: 'Tokyo', value: 'Asia/Tokyo' },
  { label: 'Sydney', value: 'Australia/Sydney' },
  { label: 'Auckland', value: 'Pacific/Auckland' },
];

function fmt(datetimeStr, opts) {
  const tz = getTimezone();
  const fullOpts = tz ? { ...opts, timeZone: tz } : opts;
  try {
    return new Intl.DateTimeFormat('en-US', fullOpts).format(new Date(datetimeStr));
  } catch {
    return new Intl.DateTimeFormat('en-US', opts).format(new Date(datetimeStr));
  }
}

function fmtTime(dt) {
  return fmt(dt, { hour: 'numeric', minute: '2-digit', hour12: true });
}

function fmtDate(dt) {
  return fmt(dt, { weekday: 'short', month: 'short', day: 'numeric' });
}

function fmtDateShort(dt) {
  return fmt(dt, { month: 'short', day: 'numeric' });
}

// ── Group Colors (A–L) ───────────────────────────────────
const GROUP_COLORS = {
  A:'#e74c3c', B:'#e67e22', C:'#f1c40f', D:'#2ecc71',
  E:'#1abc9c', F:'#3498db', G:'#9b59b6', H:'#e91e63',
  I:'#00bcd4', J:'#ff5722', K:'#4caf50', L:'#8bc34a',
};

function groupColor(g) { return GROUP_COLORS[g] || '#666'; }

// ── Status helpers ────────────────────────────────────────
function effectiveStatus(match) {
  const score = getScore(match.id);
  if (score) return 'completed';
  return match.status;
}

function effectiveScore(match) {
  return getScore(match.id) || match.score;
}

// ── Match Card HTML ───────────────────────────────────────
function matchCardHTML(match, { compact = false, featured = false } = {}) {
  const status = effectiveStatus(match);
  const score = effectiveScore(match);
  const starred = isMatchFavorite(match.id);
  const statusClass = `status-${status}`;
  const statusLabel = status === 'live' ? '🔴 LIVE' : status === 'completed' ? 'Full Time' : 'Upcoming';
  const scoreDisplay = score ? `<span class="match-score-display">${score.home} – ${score.away}</span>` : '';
  const time = fmtTime(match.datetime);
  const featuredClass = featured ? ' match-card-featured' : '';
  return `
    <article class="match-card${featuredClass}" data-action="open-match" data-id="${match.id}">
      <div class="match-teams">
        <div class="match-team">
          <span class="match-team-flag">${match.homeTeam.flag}</span>
          <span class="match-team-name">${match.homeTeam.name}</span>
        </div>
        ${scoreDisplay || '<span class="match-vs">VS</span>'}
        <div class="match-team away">
          <span class="match-team-flag">${match.awayTeam.flag}</span>
          <span class="match-team-name">${match.awayTeam.name}</span>
        </div>
      </div>
      <div class="match-meta">
        <span class="match-meta-text">${compact ? '' : fmtDate(match.datetime) + ' · '}${time}</span>
        <span class="match-meta-text">${match.stadium}</span>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="status-badge ${statusClass}">${statusLabel}</span>
          ${starred ? '<span title="Starred">⭐</span>' : ''}
        </div>
      </div>
      <div class="match-card-footer">
        <span class="match-cta-link">View Match →</span>
        <div class="match-card-actions">
          <span style="font-size:0.8rem;color:var(--text-muted);">${match.stage}${match.group ? ` · Group ${match.group}` : ''}</span>
        </div>
      </div>
    </article>
  `;
}

// ── Render App ────────────────────────────────────────────
export function renderApp(node) {
  app.innerHTML = '';
  app.appendChild(node);
}

function makeSection(html) {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el;
}

// ── HOME ─────────────────────────────────────────────────
export function renderHomeDashboard() {
  const next = getNextMatch();
  const stats = getTournamentStats();
  const upcoming = getMatches()
    .filter(m => effectiveStatus(m) === 'upcoming')
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
    .slice(0, 5);
  const favTeams = getFavTeams();
  const allMatches = getMatches();

  let heroHTML = '<div class="empty-state"><div class="empty-state-icon">🏆</div><p class="empty-state-text">Tournament complete!</p></div>';
  if (next) {
    heroHTML = `
      <div class="hero-label">Next Match · ${next.stage}</div>
      <div class="hero-teams">
        <div class="hero-team">
          <span class="hero-team-flag">${next.homeTeam.flag}</span>
          <div class="hero-team-name">${next.homeTeam.name}</div>
        </div>
        <span class="hero-vs">VS</span>
        <div class="hero-team">
          <span class="hero-team-flag">${next.awayTeam.flag}</span>
          <div class="hero-team-name">${next.awayTeam.name}</div>
        </div>
      </div>
      <div class="hero-countdown" data-countdown-target="${next.datetime}">00:00:00</div>
      <div class="hero-meta">
        <span class="hero-meta-item">🏟️ ${next.stadium}</span>
        <span class="hero-meta-item">📅 ${fmtDate(next.datetime)}</span>
        <span class="hero-meta-item">⏰ ${fmtTime(next.datetime)}</span>
      </div>
      <button class="hero-cta" data-action="open-match" data-id="${next.id}">View Match →</button>
    `;
  }

  // Favorite team widget
  let favWidget = '<p class="text-muted">Go to Teams to add favorites.</p>';
  if (favTeams.length) {
    const favMatches = allMatches.filter(m =>
      favTeams.includes(m.homeTeam.code) || favTeams.includes(m.awayTeam.code)
    ).filter(m => effectiveStatus(m) === 'upcoming')
     .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    if (favMatches.length) {
      const fm = favMatches[0];
      favWidget = `
        <div style="cursor:pointer" data-action="open-match" data-id="${fm.id}">
          <div style="font-weight:700;margin-bottom:4px;">${fm.homeTeam.flag} ${fm.homeTeam.name} vs ${fm.awayTeam.name} ${fm.awayTeam.flag}</div>
          <div class="text-muted text-small">${fmtDate(fm.datetime)} · ${fmtTime(fm.datetime)}</div>
          <div class="text-small" style="color:var(--accent-blue-bright);margin-top:4px;">${fm.stage}</div>
        </div>
      `;
    } else {
      favWidget = '<p class="text-muted">No upcoming matches for your favorite teams.</p>';
    }
  }

  const progress = stats.totalMatches ? Math.round((stats.played / stats.totalMatches) * 100) : 0;

  const section = makeSection(`
    <div class="hero-card">${heroHTML}</div>

    <div class="glass-card">
      <div class="section-header">
        <h2>Tournament Stats</h2>
        <span class="section-badge">${stats.remainingDays}d left</span>
      </div>
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-value">${stats.played}</div>
          <div class="stat-label">Played</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.totalMatches}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.upcoming}</div>
          <div class="stat-label">Remaining</div>
        </div>
      </div>
      <div style="margin-top:14px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span class="text-small text-muted">Tournament Progress</span>
          <span class="text-small text-muted">${progress}%</span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width:${progress}%"></div>
        </div>
      </div>
    </div>

    <div class="glass-card">
      <div class="section-header"><h2>Next 5 Matches</h2></div>
      <div class="h-scroll">
        ${upcoming.length ? upcoming.map(m => `
          <div class="upcoming-card" data-action="open-match" data-id="${m.id}">
            <div class="upcoming-card-teams">${m.homeTeam.flag} ${m.homeTeam.name} vs ${m.awayTeam.name} ${m.awayTeam.flag}</div>
            <div class="upcoming-card-meta">${m.stage}</div>
            <div class="upcoming-card-time">${fmtDate(m.datetime)} · ${fmtTime(m.datetime)}</div>
          </div>
        `).join('') : '<p class="text-muted">No upcoming matches.</p>'}
      </div>
    </div>

    <div class="glass-card">
      <div class="section-header"><h2>Favorite Team</h2></div>
      ${favWidget}
    </div>
  `);
  return section;
}

// ── MATCHES ───────────────────────────────────────────────
export function renderMatches() {
  const matches = getMatches();
  const stages = [...new Set(matches.map(m => m.stage))];
  const groups = [...new Set(matches.filter(m => m.group).map(m => m.group))].sort();

  const section = makeSection(`
    <div class="glass-card" style="position:sticky;top:53px;z-index:30;">
      <div class="filter-bar">
        <input id="match-search" placeholder="Search team or venue…" />
        <select id="match-stage-filter">
          <option value="">All Stages</option>
          ${stages.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
        <select id="match-group-filter">
          <option value="">All Groups</option>
          ${groups.map(g => `<option value="${g}">Group ${g}</option>`).join('')}
        </select>
      </div>
    </div>
    <div id="matches-list"></div>
  `);
  return section;
}

export function renderMatchesList(filtered) {
  const list = document.getElementById('matches-list');
  if (!list) return;
  if (!filtered.length) {
    list.innerHTML = '<div class="no-matches">No matches found.</div>';
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const live    = filtered.filter(m => effectiveStatus(m) === 'live');
  const todayMs = filtered.filter(m => m.date === today && effectiveStatus(m) !== 'live');
  const rest    = filtered.filter(m => m.date !== today && effectiveStatus(m) !== 'live');

  // ── Live Now ──
  let html = '';
  if (live.length) {
    html += `
      <div class="live-now-wrap">
        <div class="live-section-header">
          <span class="live-now-badge">Live Now</span>
          <span class="live-section-title">${live.length} match${live.length > 1 ? 'es' : ''} in progress</span>
        </div>
        <div class="match-grid">
          ${live.map((m, i) => matchCardHTML(m, { featured: i === 0 })).join('')}
        </div>
      </div>`;
  }

  // ── Today's Matches ──
  if (todayMs.length) {
    const dt = new Date(today + 'T12:00:00');
    const label = dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    html += `
      <div class="glass-card">
        <div class="today-section-header">
          <div class="today-section-label">Today's Matches</div>
          <div class="today-section-title">${label}</div>
        </div>
        <div class="match-grid">
          ${todayMs.map((m, i) => matchCardHTML(m, { featured: i === 0 })).join('')}
        </div>
      </div>`;
  }

  // ── Rest grouped by stage/group ──
  const byStage = {};
  rest.forEach(m => {
    const key = m.stage + (m.group ? `|${m.group}` : '');
    if (!byStage[key]) byStage[key] = { stage: m.stage, group: m.group, matches: [] };
    byStage[key].matches.push(m);
  });

  const stageOrder = ['Group Stage','Round of 32','Round of 16','Quarterfinals','Semifinals','Third Place','Final','knockout'];
  const sortedKeys = Object.keys(byStage).sort((a, b) => {
    const ai = stageOrder.indexOf(byStage[a].stage);
    const bi = stageOrder.indexOf(byStage[b].stage);
    if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return (byStage[a].group || '').localeCompare(byStage[b].group || '');
  });

  html += sortedKeys.map(key => {
    const { stage, group, matches } = byStage[key];
    const color = group ? groupColor(group) : '#4DA3FF';
    return `
      <div class="glass-card">
        <div class="stage-group-header">
          <div class="group-dot" style="background:${color}"></div>
          <h3>${stage}${group ? ` · Group ${group}` : ''}</h3>
          <span class="section-badge">${matches.length}</span>
        </div>
        <div class="match-grid">
          ${matches.map((m, i) => matchCardHTML(m, { featured: i === 0 })).join('')}
        </div>
      </div>`;
  }).join('');

  list.innerHTML = html;
}

// ── MATCH DETAIL ─────────────────────────────────────────
export function renderMatchDetail(id) {
  const match = getMatchById(id);
  if (!match) return makeSection('<div class="glass-card"><div class="empty-state"><div class="empty-state-icon">❌</div><p>Match not found.</p></div></div>');

  const score    = getScore(match.id);
  const status   = effectiveStatus(match);
  const note     = getNote(match.id) || { text: '', photos: [] };
  const starred  = isMatchFavorite(match.id);
  const homeSquad = getTeamSquad(match.homeTeam.name);
  const awaySquad = getTeamSquad(match.awayTeam.name);
  const vi = match.venueInfo;
  const intel = getMatchIntelligence(match);

  const statusClass = `status-${status}`;
  const statusLabel = status === 'live' ? '🔴 LIVE' : status === 'completed' ? 'Full Time' : 'Upcoming';

  // ── National identity gradient ──
  const hc = getTeamColor(match.homeTeam.name);
  const ac = getTeamColor(match.awayTeam.name);
  const natGrad = `background:linear-gradient(135deg,${hc}30 0%,transparent 42%,transparent 58%,${ac}30 100%),linear-gradient(180deg,rgba(11,18,32,0.3) 0%,rgba(11,18,32,0.7) 100%)`;

  // ── Center column of hero ──
  let heroCenter = '';
  if (score) {
    heroCenter = `
      <div class="detail-hero-score">${score.home}&nbsp;–&nbsp;${score.away}</div>
      <button class="btn btn-sm" data-action="clear-score" data-id="${match.id}" style="margin-top:10px;">Edit Score</button>
    `;
  } else if (status === 'live') {
    heroCenter = `
      <div class="detail-hero-score" style="color:var(--accent-live)">LIVE</div>
      <div class="hero-score-entry">
        <input type="number" id="home-score-${match.id}" min="0" max="99" placeholder="0" />
        <span class="score-entry-dash">–</span>
        <input type="number" id="away-score-${match.id}" min="0" max="99" placeholder="0" />
        <button class="btn btn-primary btn-sm" data-action="save-score" data-id="${match.id}">Save</button>
      </div>
    `;
  } else {
    const probHTML = intel ? `
      <div class="hero-win-prob">
        <div class="hwp-bar">
          <div class="hwp-home" style="width:${intel.prediction.home}%"></div>
          <div class="hwp-draw" style="width:${intel.prediction.draw}%"></div>
          <div class="hwp-away" style="width:${intel.prediction.away}%"></div>
        </div>
        <div class="hwp-labels">
          <span>${intel.prediction.home}%</span>
          <span>${intel.prediction.draw}% Draw</span>
          <span>${intel.prediction.away}%</span>
        </div>
      </div>` : '';
    heroCenter = `
      <div class="detail-hero-countdown" data-countdown-target="${match.datetime}">00:00:00</div>
      <div class="detail-hero-kickoff">${fmtDate(match.datetime)} · ${fmtTime(match.datetime)}</div>
      ${probHTML}
      <div class="hero-score-entry" style="margin-top:14px;">
        <input type="number" id="home-score-${match.id}" min="0" max="99" placeholder="0" />
        <span class="score-entry-dash">–</span>
        <input type="number" id="away-score-${match.id}" min="0" max="99" placeholder="0" />
        <button class="btn btn-primary btn-sm" data-action="save-score" data-id="${match.id}">Save Score</button>
      </div>
    `;
  }

  // ── Form comparison ──
  const hData = getTeamData(match.homeTeam.name);
  const aData = getTeamData(match.awayTeam.name);
  const formBadge = c => {
    const cls = c === 'W' ? 'form-w' : c === 'D' ? 'form-d' : 'form-l';
    return `<span class="form-badge ${cls}">${c}</span>`;
  };
  const formCard = `
    <div class="glass-card">
      <div class="intel-section-label">Recent Form</div>
      <div class="form-compare">
        <div class="form-team-side">
          <span class="form-team-label">${match.homeTeam.flag} ${match.homeTeam.name}</span>
          <div class="form-strip">${(hData.form || 'WDWLW').split('').map(formBadge).join('')}</div>
        </div>
        <div class="form-divider-label">Last 5</div>
        <div class="form-team-side right">
          <span class="form-team-label">${match.awayTeam.name} ${match.awayTeam.flag}</span>
          <div class="form-strip">${(aData.form || 'WDWLW').split('').map(formBadge).join('')}</div>
        </div>
      </div>
    </div>`;

  // ── Squad block (collapsed) ──
  const squadPills = (squad, teamName) => squad.length ? `
    <details style="margin-bottom:10px;">
      <summary style="cursor:pointer;font-weight:700;font-size:0.9rem;padding:6px 0;list-style:none;display:flex;align-items:center;gap:8px;">
        <span>${teamName} Squad</span>
        <span class="section-badge">${squad.length}</span>
      </summary>
      <div class="squad-list" style="margin-top:10px;">
        ${squad.map(p => `<span class="player-pill" data-action="add-scorer-prefill" data-player="${p}" data-team="${teamName}">${p}</span>`).join('')}
      </div>
    </details>` : '';

  const photoThumbsHTML = note.photos && note.photos.length
    ? note.photos.map(src => `<img class="photo-thumb" src="${src}" alt="photo" />`).join('')
    : '';

  return makeSection(`

    <!-- ── TIER 1: Hero — fills first viewport ── -->
    <div class="detail-hero" style="${natGrad}">
      <div class="detail-hero-status">
        ${match.stage}${match.group ? ` · Group ${match.group}` : ''}
        &nbsp;·&nbsp;
        <span class="status-badge ${statusClass}">${statusLabel}</span>
      </div>
      <div class="detail-hero-teams">
        <div class="detail-hero-team">
          <span class="detail-hero-flag">${match.homeTeam.flag}</span>
          <div class="detail-hero-name">${match.homeTeam.name}</div>
        </div>
        <div class="detail-hero-center">${heroCenter}</div>
        <div class="detail-hero-team">
          <span class="detail-hero-flag">${match.awayTeam.flag}</span>
          <div class="detail-hero-name">${match.awayTeam.name}</div>
        </div>
      </div>
    </div>

    <!-- ── TIER 2: Insights ── -->
    ${formCard}
    ${renderMatchIntelligence(match)}

    <!-- ── TIER 3: Reference ── -->
    ${homeSquad.length || awaySquad.length ? `
    <div class="glass-card">
      <div class="intel-section-label">Squads</div>
      ${squadPills(homeSquad, match.homeTeam.name)}
      ${squadPills(awaySquad, match.awayTeam.name)}
    </div>` : ''}

    <div class="glass-card">
      <div class="intel-section-label">Venue</div>
      <div style="font-size:1rem;font-weight:700;margin-bottom:12px;">${vi.flag} ${vi.fullName || vi.name}</div>
      <div class="venue-grid">
        <div class="venue-stat"><div class="venue-stat-label">City</div><div class="venue-stat-value">${vi.city || '—'}</div></div>
        <div class="venue-stat"><div class="venue-stat-label">Country</div><div class="venue-stat-value">${vi.country || '—'}</div></div>
        <div class="venue-stat"><div class="venue-stat-label">Capacity</div><div class="venue-stat-value">${vi.capacity ? vi.capacity.toLocaleString() : '—'}</div></div>
        <div class="venue-stat"><div class="venue-stat-label">Surface</div><div class="venue-stat-value">${vi.surface || '—'}</div></div>
        <div class="venue-stat"><div class="venue-stat-label">Opened</div><div class="venue-stat-value">${vi.opened || '—'}</div></div>
        <div class="venue-stat"><div class="venue-stat-label">Kickoff</div><div class="venue-stat-value">${fmtTime(match.datetime)}</div></div>
      </div>
      <div style="margin-top:12px;">
        <a href="https://maps.google.com?q=${encodeURIComponent(vi.fullName || vi.name)}" target="_blank" rel="noreferrer" class="btn btn-sm" style="display:inline-flex;text-decoration:none;">🗺️ View Map</a>
      </div>
    </div>

    <div class="glass-card">
      <div class="intel-section-label">Match Notes</div>
      <textarea class="notes-area" id="match-note-${match.id}" placeholder="Add your match notes here…">${note.text}</textarea>
      <div style="margin-top:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <label class="btn btn-sm" style="cursor:pointer;">📷 Add Photo
          <input type="file" id="note-photos-${match.id}" accept="image/*" multiple style="display:none;" />
        </label>
        <button class="btn btn-primary btn-sm" data-action="save-note" data-id="${match.id}">Save Note</button>
      </div>
      ${photoThumbsHTML ? `<div class="photo-preview">${photoThumbsHTML}</div>` : ''}
    </div>

    <div class="glass-card">
      <div class="action-row">
        <button class="btn ${starred ? 'btn-primary' : ''}" data-action="toggle-star" data-id="${match.id}">
          ${starred ? '⭐ Starred' : '☆ Star Match'}
        </button>
        <button class="btn" data-action="share-card" data-id="${match.id}">🖼️ Share Card</button>
        <button class="btn" data-action="export-pdf" data-id="${match.id}">📄 Export PDF</button>
      </div>
    </div>
  `);
}

// ── MATCH INTELLIGENCE ────────────────────────────────────
function renderMatchIntelligence(match) {
  const intel = getMatchIntelligence(match);
  if (!intel) return '';

  const { h2h, rivalry, headline, narrative, facts, prediction } = intel;

  // ── Rivalry meter ──
  const starsHTML = Array.from({ length: 5 }, (_, i) =>
    `<span class="rivalry-star ${i < rivalry.stars ? 'lit' : ''}">★</span>`
  ).join('');

  // ── H2H bar widths ──
  const total = h2h.homeWins + h2h.draws + h2h.awayWins || 1;
  const hw = Math.round(h2h.homeWins / total * 100);
  const dw = Math.round(h2h.draws   / total * 100);
  const aw = 100 - hw - dw;

  // ── Last 5 meetings ──
  const COMP_LABEL = { WC:'World Cup', WCQ:'WC Qualifier', EURO:'Euro', NL:'Nations Lg',
    CA:'Copa América', FR:'Friendly', AFCON:'AFCON', CONC:'Gold Cup' };
  const meetingsHTML = h2h.last5.length ? h2h.last5.slice(0, 5).map(m => `
    <div class="meeting-row">
      <span class="meeting-year">${m.y}</span>
      <span class="meeting-comp">${COMP_LABEL[m.comp] || m.comp}</span>
      <span class="meeting-score">${m.homeScore} – ${m.awayScore}</span>
      ${m.note ? `<span class="meeting-note">${m.note}</span>` : ''}
    </div>
  `).join('') : `<p class="text-muted" style="font-size:0.85rem;padding:8px 0;">No previous meetings recorded.</p>`;

  // ── Facts ──
  const FACT_ICONS = ['⚡','📖','🏆','🔥'];
  const factsHTML = facts.map((f, i) => `
    <div class="intel-fact">
      <span class="intel-fact-icon">${FACT_ICONS[i % FACT_ICONS.length]}</span>
      <span>${f}</span>
    </div>
  `).join('');

  return `
    <!-- ── AI Storyline ── -->
    <div class="intel-storyline">
      <div class="intel-section-label">Match Intelligence</div>
      <div class="intel-headline">${headline}</div>
      <div class="intel-narrative">${narrative}</div>
    </div>

    <!-- ── Rivalry Meter ── -->
    <div class="glass-card">
      <div class="intel-section-label">Rivalry Meter</div>
      <div class="rivalry-meter">
        <div class="rivalry-stars">${starsHTML}</div>
        <div class="rivalry-label">${rivalry.label}</div>
      </div>
      ${h2h.famous ? `<div class="rivalry-famous">${h2h.famous}</div>` : ''}
    </div>

    <!-- ── Head-to-Head ── -->
    <div class="glass-card">
      <div class="intel-section-label">Head-to-Head Record</div>
      ${h2h.played > 0 ? `
      <div class="h2h-summary">
        <div class="h2h-team-block">
          <span class="h2h-team-flag">${match.homeTeam.flag}</span>
          <div class="h2h-team-wins">${h2h.homeWins}</div>
          <div class="h2h-team-name">${match.homeTeam.name}</div>
        </div>
        <div class="h2h-centre">
          <div class="h2h-draws-val">${h2h.draws}</div>
          <div class="h2h-draws-label">Draws</div>
        </div>
        <div class="h2h-team-block">
          <span class="h2h-team-flag">${match.awayTeam.flag}</span>
          <div class="h2h-team-wins">${h2h.awayWins}</div>
          <div class="h2h-team-name">${match.awayTeam.name}</div>
        </div>
      </div>
      <div class="h2h-bar-wrap">
        <div class="h2h-bar-home" style="width:${hw}%"></div>
        <div class="h2h-bar-draw" style="width:${dw}%"></div>
        <div class="h2h-bar-away" style="width:${aw}%"></div>
      </div>
      <div class="h2h-meta">
        <span>${match.homeTeam.name}</span>
        <span>${h2h.played} played · ${h2h.wcMeetings} WC meetings</span>
        <span>${match.awayTeam.name}</span>
      </div>
      ` : `<p class="text-muted" style="font-size:0.85rem;">No previous meetings recorded between these sides.</p>`}
    </div>

    <!-- ── Last 5 Meetings ── -->
    ${h2h.last5.length ? `
    <div class="glass-card">
      <div class="intel-section-label">Recent Meetings</div>
      <div class="last-meetings">${meetingsHTML}</div>
    </div>` : ''}

    <!-- ── Prediction ── -->
    <div class="glass-card">
      <div class="intel-section-label">Prediction Indicator</div>
      <div class="prediction-row">
        <div class="pred-team">
          <div class="pred-pct">${prediction.home}%</div>
          <div class="pred-label">${match.homeTeam.flag} Win</div>
        </div>
        <div class="pred-draw">
          <div class="pred-draw-pct">${prediction.draw}%</div>
          <div class="pred-draw-label">Draw</div>
        </div>
        <div class="pred-team">
          <div class="pred-pct" style="color:var(--accent-gold)">${prediction.away}%</div>
          <div class="pred-label">${match.awayTeam.flag} Win</div>
        </div>
      </div>
      <div class="pred-bar-wrap">
        <div class="pred-bar-home" style="width:${prediction.home}%"></div>
        <div class="pred-bar-draw" style="width:${prediction.draw}%"></div>
        <div class="pred-bar-away" style="width:${prediction.away}%"></div>
      </div>
      <p class="pred-disclaimer">Based on FIFA rankings, H2H record & recent form. For entertainment only.</p>
    </div>

    <!-- ── Match Facts ── -->
    <div class="glass-card">
      <div class="intel-section-label">Match Facts</div>
      <div class="intel-facts">${factsHTML}</div>
    </div>
  `;
}

// ── TEAMS ─────────────────────────────────────────────────
let teamsSortMode = 'group';

export function renderTeams(sortMode) {
  if (sortMode) teamsSortMode = sortMode;
  const teams = getTeams();
  const favTeams = getFavTeams();

  let teamsHTML = '';
  if (teamsSortMode === 'rank') {
    const sorted = [...teams].sort((a, b) => a.fifaRank - b.fifaRank);
    teamsHTML = `<div class="team-list">${sorted.map(t => teamItemHTML(t, favTeams)).join('')}</div>`;
  } else {
    const groups = [...new Set(teams.map(t => t.group))].sort();
    teamsHTML = groups.map(g => {
      const groupTeams = teams.filter(t => t.group === g);
      return `
        <div class="group-section">
          <div class="group-section-header">
            <div class="group-color-dot" style="background:${groupColor(g)}"></div>
            <h3>Group ${g}</h3>
          </div>
          <div class="team-list">${groupTeams.map(t => teamItemHTML(t, favTeams)).join('')}</div>
        </div>
      `;
    }).join('');
  }

  return makeSection(`
    <div class="glass-card">
      <div class="section-header"><h2>Teams</h2><span class="section-badge">48 nations</span></div>
      <div class="teams-sort-bar">
        <button class="sort-btn ${teamsSortMode === 'group' ? 'active' : ''}" data-action="teams-sort" data-sort="group">By Group</button>
        <button class="sort-btn ${teamsSortMode === 'rank' ? 'active' : ''}" data-action="teams-sort" data-sort="rank">By FIFA Rank</button>
      </div>
      ${teamsHTML}
    </div>
  `);
}

function teamItemHTML(t, favTeams) {
  const fav = favTeams.includes(t.code);
  const nextM = getTeamNextMatch(t.name);
  return `
    <div class="team-item ${fav ? 'fav' : ''}">
      <div class="team-item-left">
        <span class="team-item-flag">${t.flag}</span>
        <div>
          <div class="team-item-name">${t.name}</div>
          <div class="team-item-rank">#${t.fifaRank} FIFA${nextM ? ` · ${fmtDateShort(nextM.datetime)}` : ''}</div>
        </div>
      </div>
      <div class="team-item-right">
        <button class="fav-btn" data-action="toggle-fav-team" data-code="${t.code}" title="${fav ? 'Unfavorite' : 'Favorite'}">${fav ? '⭐' : '☆'}</button>
      </div>
    </div>
  `;
}

// ── CALENDAR ──────────────────────────────────────────────
let calendarDate = null;

export function renderCalendar(date) {
  const allDates = getAllMatchDates();
  if (!calendarDate) calendarDate = allDates[0] || new Date().toISOString().slice(0, 10);
  if (date) calendarDate = date;

  const matchesForDate = getMatchesByDate(calendarDate);

  const dateStripHTML = allDates.map(d => {
    const dt = new Date(d + 'T12:00:00');
    const dayStr = dt.toLocaleDateString('en-US', { weekday: 'short' });
    const numStr = dt.getDate();
    const count = getMatchesByDate(d).length;
    const active = d === calendarDate ? 'active' : '';
    return `
      <div class="date-pill ${active}" data-action="calendar-date" data-date="${d}">
        <div class="date-pill-day">${dayStr}</div>
        <div class="date-pill-num">${numStr}</div>
        <div class="date-pill-count">${count}</div>
      </div>
    `;
  }).join('');

  const dt = new Date(calendarDate + 'T12:00:00');
  const selectedLabel = dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return makeSection(`
    <div class="glass-card">
      <div class="section-header"><h2>Calendar</h2></div>
      <div class="calendar-date-strip">${dateStripHTML}</div>
    </div>
    <div class="glass-card">
      <div class="section-header">
        <h2>${selectedLabel}</h2>
        <span class="section-badge">${matchesForDate.length} matches</span>
      </div>
      <div class="match-grid">
        ${matchesForDate.length
          ? matchesForDate.map(m => matchCardHTML(m)).join('')
          : '<div class="no-matches">No matches on this day.</div>'
        }
      </div>
    </div>
  `);
}

// ── TOP SCORERS ───────────────────────────────────────────
export function renderScorers() {
  const scorers = getTopScorers();
  const teams = getTeams();
  const teamOptions = teams.map(t => `<option value="${t.name}">${t.flag} ${t.name}</option>`).join('');
  const medals = ['🥇','🥈','🥉'];

  const tableRows = scorers.length ? scorers.map((s, i) => `
    <tr>
      <td class="scorer-rank ${i < 3 ? `scorer-rank-${i+1}` : ''}">${medals[i] || `#${i+1}`}</td>
      <td style="font-weight:600;">${s.playerName}</td>
      <td class="text-muted">${s.team}</td>
      <td class="scorer-goals">${s.goals}</td>
      <td class="scorer-assists">${s.assists}</td>
      <td><button class="btn btn-sm" data-action="remove-scorer" data-scorer-id="${s.id}" style="min-width:auto;padding:5px 10px;font-size:0.75rem;">✕</button></td>
    </tr>
  `).join('') : '<tr><td colspan="6" class="no-matches">No scorers added yet.</td></tr>';

  return makeSection(`
    <div class="glass-card">
      <div class="section-header"><h2>Top Scorers</h2></div>
      <div class="scorer-form" id="scorer-form">
        <input id="scorer-name" placeholder="Player Name" />
        <select id="scorer-team">
          <option value="">Select Team</option>
          ${teamOptions}
        </select>
        <input id="scorer-goals" type="number" min="0" max="99" placeholder="Goals" />
        <input id="scorer-assists" type="number" min="0" max="99" placeholder="Assists" />
        <button class="btn btn-primary scorer-form-full" data-action="add-scorer">Add Player</button>
      </div>
    </div>
    <div class="glass-card">
      <div class="section-header"><h2>Leaderboard</h2><span class="section-badge">${scorers.length} players</span></div>
      <table class="scorers-table">
        <thead>
          <tr>
            <th>#</th><th>Player</th><th>Team</th><th>⚽ Goals</th><th>🅰️ Assists</th><th></th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
  `);
}

// ── SETTINGS ──────────────────────────────────────────────
export function renderSettings() {
  const theme = getTheme();
  const tz = getTimezone();
  const ai = isAiEnabled();

  const tzOptions = TIMEZONES.map(t =>
    `<option value="${t.value}" ${tz === t.value ? 'selected' : ''}>${t.label}</option>`
  ).join('');

  return makeSection(`
    <div class="glass-card">
      <div class="section-header"><h2>Settings</h2></div>
      <div class="settings-group">
        <div class="setting-row">
          <div>
            <div class="setting-label">Theme</div>
            <div class="setting-sub">Visual appearance</div>
          </div>
          <select class="setting-control" id="theme-select">
            <option value="dark" ${theme === 'dark' ? 'selected' : ''}>Dark</option>
            <option value="light" ${theme === 'light' ? 'selected' : ''}>Light</option>
          </select>
        </div>
        <div class="setting-row">
          <div>
            <div class="setting-label">Timezone</div>
            <div class="setting-sub">Match times display</div>
          </div>
          <select class="setting-control" id="timezone-select">${tzOptions}</select>
        </div>
        <div class="setting-row">
          <div>
            <div class="setting-label">AI Insights</div>
            <div class="setting-sub">Light match analysis</div>
          </div>
          <select class="setting-control" id="ai-toggle">
            <option value="false" ${!ai ? 'selected' : ''}>Disabled</option>
            <option value="true" ${ai ? 'selected' : ''}>Enabled</option>
          </select>
        </div>
        <div class="setting-row">
          <div>
            <div class="setting-label">Refresh Data</div>
            <div class="setting-sub">Re-fetch match data</div>
          </div>
          <button class="btn btn-sm" data-action="refresh-data">Refresh</button>
        </div>
        <div class="setting-row">
          <div>
            <div class="setting-label">Clear All Data</div>
            <div class="setting-sub">Scores, notes, favorites</div>
          </div>
          <button class="btn btn-sm" data-action="clear-storage" style="color:#ff6b6b;border-color:#ff6b6b;">Clear</button>
        </div>
        <div class="setting-row">
          <div class="setting-label">Version</div>
          <span class="text-muted">CupVerse v2.0.0</span>
        </div>
      </div>
    </div>

    <div class="glass-card">
      <div class="section-header"><h2>About</h2></div>
      <p class="text-muted" style="line-height:1.6;font-size:0.9rem;">
        CupVerse is your offline-first FIFA World Cup 2026 command center. Track 105 matches across 16 host venues in USA, Canada, and Mexico. Works fully offline after first load.
      </p>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
        <span class="section-badge">🏟️ 16 Venues</span>
        <span class="section-badge">⚽ 105 Matches</span>
        <span class="section-badge">🌍 48 Teams</span>
        <span class="section-badge">📱 Installable PWA</span>
      </div>
    </div>
  `);
}

// ── STANDINGS ─────────────────────────────────────────────
export function renderStandings() {
  const storedScores = getAllScores();
  const standings = getGroupStandings(storedScores);
  const groups = Object.keys(standings);

  if (!groups.length) {
    return makeSection(`
      <div class="glass-card">
        <div class="empty-state">
          <div class="empty-state-icon">📊</div>
          <p class="empty-state-text">Group standings will appear once match data loads.</p>
        </div>
      </div>
    `);
  }

  const groupsHTML = groups.map(g => {
    const teams = standings[g];
    const color = groupColor(g);

    const rows = teams.map((team, i) => {
      const gd = team.gf - team.ga;
      const gdStr = gd > 0 ? `+${gd}` : String(gd);
      const gdClass = gd > 0 ? 'gd-pos' : gd < 0 ? 'gd-neg' : '';
      // Top 2 advance, 3rd may qualify as best third-place
      const rowClass = i < 2 ? `standing-q${i + 1}` : i === 2 ? 'standing-q3' : '';
      return `
        <tr class="${rowClass}">
          <td class="standings-pos">${i + 1}</td>
          <td>
            <div class="standings-team-cell">
              <span class="standings-team-flag">${team.flag}</span>
              <span class="standings-team-name">${team.name}</span>
            </div>
          </td>
          <td class="standings-num">${team.mp}</td>
          <td class="standings-num">${team.w}</td>
          <td class="standings-num">${team.d}</td>
          <td class="standings-num">${team.l}</td>
          <td class="standings-num">${team.gf}</td>
          <td class="standings-num">${team.ga}</td>
          <td class="standings-num ${gdClass}">${gdStr}</td>
          <td class="standings-pts">${team.pts}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="glass-card">
        <div class="stage-group-header">
          <div class="group-dot" style="background:${color}"></div>
          <h3>Group ${g}</h3>
          <span class="section-badge">${teams.length} teams</span>
        </div>
        <div class="standings-table-wrap">
          <table class="standings-table">
            <thead>
              <tr>
                <th>#</th>
                <th class="standings-th-team">Team</th>
                <th title="Matches Played">MP</th>
                <th title="Wins">W</th>
                <th title="Draws">D</th>
                <th title="Losses">L</th>
                <th title="Goals For">GF</th>
                <th title="Goals Against">GA</th>
                <th title="Goal Difference">GD</th>
                <th title="Points">Pts</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');

  return makeSection(`
    <div class="standings-legend">
      <div class="legend-item">
        <span class="legend-dot" style="background:var(--accent-success)"></span>
        Advances to Round of 32
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background:var(--accent-gold)"></span>
        Potential 3rd-place qualification
      </div>
      <div class="legend-item" style="margin-left:auto;">
        <span style="font-size:0.7rem;color:var(--text-muted);">Enter scores in match detail to update standings</span>
      </div>
    </div>
    ${groupsHTML}
  `);
}

// ── Nav active link ────────────────────────────────────────
export function updateNavActive(page) {
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === `#${page}` || (page === 'home' && href === '#home'));
  });
  document.querySelectorAll('.bottom-nav-item').forEach(a => {
    const dp = a.dataset.page;
    a.classList.toggle('active', dp === page || (page === 'home' && dp === 'home'));
  });
}
