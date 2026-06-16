import {
  getMatches, getMatchById, getNextMatch, getTodaysMatches,
  getTournamentStats, getTeams, getTeamSquad, getTeamNextMatch,
  getMatchesByDate, getAllMatchDates, getGroupStandings,
} from './data.js';
import { getSquad } from './squad.js';
import {
  getScore, getAllScores,
  getNote,
  getFavTeams, isFavTeam, toggleFavTeam,
  getFavoriteMatches, toggleFavoriteMatch, isMatchFavorite,
  getTimezone, getTheme, setTheme, setTimezone,
  isAiEnabled, setAiEnabled, clearStorage,
  isCardCollapsed, getApiScorers, getGoldenBoot,
} from './storage.js';
import { getSyncStatus, formatSyncDate } from './sync.js';
import { navigateTo } from './router.js';
import { getMatchIntelligence, getTeamColor, getTeamData } from './intelligence.js';
import { STADIUMS, getStadiumByName } from './venues.js';

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

// ── Display name normalization ────────────────────────────
const SHORT_NAMES = { 'Bosnia and Herzegovina': 'Bosnia' };
function displayName(name) { return SHORT_NAMES[name] || name; }

// Strip quotes, Arabic/Persian script, and trailing digits from stored scorer names
function sanitizeScorerName(name) {
  const s = (name || '')
    .replace(/["'''‚‛""„‟‹›«»]/g, '')
    .replace(/[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]+/g, '')
    .replace(/\s+\d+(?:\+\d+)?['′]?\s*$/, '')
    .replace(/\(\s*p(?:en)?\s*\)/gi, '')
    .replace(/\(\s*OG\s*\)/gi, '')
    .replace(/\s+\d+$/, '')
    .trim();
  return /^\d+$/.test(s) ? '' : s;
}

// Match a short API scorer name ("J. Quiñones") to full squad player using initial + last name
function resolvePlayerFromSquad(apiName, teamName) {
  const squad = getSquad(teamName);
  if (!squad || !squad.length) return null;
  const q = apiName.trim().toLowerCase();
  // 1. Exact
  let found = squad.find(p => p.name.toLowerCase() === q);
  if (found) return found;
  // 2. "A. LastName" → match by initial + last name fragment
  const m = q.match(/^([a-zÀ-ɏ])\.\s*(.+)$/);
  if (m) {
    const [, init, last] = m;
    found = squad.find(p => {
      const ws = p.name.toLowerCase().split(/\s+/);
      return ws.length >= 2 && ws[0][0] === init && ws.slice(1).join(' ').includes(last);
    });
    if (found) return found;
    // looser: any word in full name matches last part
    found = squad.find(p => p.name[0].toLowerCase() === init && p.name.toLowerCase().includes(last));
    if (found) return found;
  }
  // 3. Any meaningful word in the API name exists in squad name
  for (const part of q.split(/\s+/).filter(p => p.length > 3)) {
    found = squad.find(p => p.name.toLowerCase().includes(part));
    if (found) return found;
  }
  return null;
}

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
function matchCardHTML(match, { compact = false, featured = false, calendar = false } = {}) {
  const status = effectiveStatus(match);
  const score = effectiveScore(match);
  const starred = isMatchFavorite(match.id);
  const statusClass = `status-${status}`;
  const statusLabel = status === 'live' ? '🔴 LIVE' : status === 'completed' ? 'Full Time' : 'Upcoming';
  const scoreDisplay = score ? `<span class="match-score-display">${score.home} – ${score.away}</span>` : '';
  const time = fmtTime(match.datetime);
  const featuredClass = featured ? ' match-card-featured' : '';
  const vi = match.venueInfo || {};

  const calVenueRow = calendar ? `
    <div class="cal-match-venue">
      <span class="cal-venue-item">🏟️ ${match.stadium}${vi.city ? ` · ${vi.city}` : ''}</span>
      ${vi.capacity ? `<span class="cal-venue-item">👥 ${vi.capacity.toLocaleString()}</span>` : ''}
    </div>` : '';

  return `
    <article class="match-card${featuredClass}" data-action="open-match" data-id="${match.id}">
      <div class="match-teams">
        <div class="match-team">
          <span class="match-team-flag">${match.homeTeam.flag}</span>
          <span class="match-team-name team-link" data-action="open-team" data-name="${match.homeTeam.name}">${displayName(match.homeTeam.name)}</span>
        </div>
        ${scoreDisplay || '<span class="match-vs">VS</span>'}
        <div class="match-team away">
          <span class="match-team-flag">${match.awayTeam.flag}</span>
          <span class="match-team-name team-link" data-action="open-team" data-name="${match.awayTeam.name}">${displayName(match.awayTeam.name)}</span>
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
      ${calVenueRow}
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
let activePulse = 'upcoming';

// Stadium-inspired gradient backgrounds keyed by venue city
const STADIUM_GRADIENTS = [
  'linear-gradient(160deg,#1a3a5c 0%,#0d1f35 50%,#0a1128 100%)',
  'linear-gradient(160deg,#1f2d1a 0%,#0f1d10 50%,#0a1128 100%)',
  'linear-gradient(160deg,#2d1a1a 0%,#1a0d0d 50%,#0a1128 100%)',
  'linear-gradient(160deg,#1a1a2d 0%,#0d0d1a 50%,#0a1128 100%)',
];

function stadiumGradient(matchId) {
  return STADIUM_GRADIENTS[Number(matchId) % STADIUM_GRADIENTS.length];
}

function getPulseMatches(pulse, allMatches, favTeams) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const tomorrowDate = new Date(now); tomorrowDate.setDate(now.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().slice(0, 10);
  const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);
  const knockoutStages = new Set(['Round of 32','Round of 16','Quarterfinals','Semifinals','Third Place','Final']);

  switch (pulse) {
    case 'today':
      return allMatches.filter(m => m.date === todayStr);
    case 'tomorrow':
      return allMatches.filter(m => m.date === tomorrowStr);
    case 'week':
      return allMatches.filter(m => m.date >= todayStr && m.date <= weekEndStr);
    case 'favorites':
      return allMatches.filter(m => favTeams.includes(m.homeTeam.code) || favTeams.includes(m.awayTeam.code));
    case 'knockouts':
      return allMatches.filter(m => knockoutStages.has(m.stage));
    case 'final':
      return allMatches.filter(m => m.stage === 'Final');
    default: // 'upcoming'
      return allMatches
        .filter(m => effectiveStatus(m) === 'upcoming')
        .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
        .slice(0, 8);
  }
}

export function renderHomeDashboard(pulse) {
  if (pulse) activePulse = pulse;

  const next       = getNextMatch();
  const stats      = getTournamentStats();
  const favTeams   = getFavTeams();
  const allMatches = getMatches();
  const intel      = next ? getMatchIntelligence(next) : null;

  const now        = new Date();
  const todayStr   = now.toISOString().slice(0, 10);
  const liveMatches    = allMatches.filter(m => effectiveStatus(m) === 'live');
  const completedMatches = allMatches.filter(m => effectiveStatus(m) === 'completed');
  const totalGoals = allMatches.reduce((sum, m) => {
    const s = effectiveScore(m);
    return sum + (s ? (Number(s.home) + Number(s.away)) : 0);
  }, 0);

  // ── § 1  DASHBOARD HERO (3-column: Analytics | Countdown | Actions) ──
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches
    || !!window.navigator.standalone;

  const isLight = document.documentElement.dataset.theme === 'light';
  const hc = next ? getTeamColor(next.homeTeam.name) : '#4DA3FF';
  const ac = next ? getTeamColor(next.awayTeam.name) : '#F5B042';
  // Very subtle team-color hints at the edges — columns provide the main visual identity
  const heroGradient = isLight
    ? `linear-gradient(135deg, ${hc}18 0%, rgba(238,242,249,0.0) 50%, ${ac}12 100%)`
    : `linear-gradient(135deg, ${hc}22 0%, rgba(8,14,30,0.0) 50%, ${ac}15 100%)`;

  const rightTopCard = isInstalled
    ? `<div class="dh-action-card dh-action-card--sync" data-action="sync-data">
         <div class="dh-action-icon">🔄</div>
         <div class="dh-action-label">Sync Data</div>
       </div>`
    : `<div class="dh-action-card dh-action-card--install" data-action="install-guide">
         <div class="dh-action-icon">📲</div>
         <div class="dh-action-label">Install App</div>
       </div>`;

  const countdownCol = next
    ? `<div class="dhc-label">NEXT MATCH</div>
       <div class="countdown-blocks dhc-blocks" data-countdown-target="${next.datetime}">
         <div class="cd-block"><span class="cd-val" data-cd="d">--</span><span class="cd-label">D</span></div>
         <span class="cd-sep">:</span>
         <div class="cd-block"><span class="cd-val" data-cd="h">--</span><span class="cd-label">H</span></div>
         <span class="cd-sep">:</span>
         <div class="cd-block"><span class="cd-val" data-cd="m">--</span><span class="cd-label">M</span></div>
         <span class="cd-sep">:</span>
         <div class="cd-block"><span class="cd-val" data-cd="s">--</span><span class="cd-label">S</span></div>
       </div>
       <div class="dhc-vs-row">
         <span class="dhc-tname">${displayName(next.homeTeam.name)}</span>
         <span class="dhc-vs-text">vs</span>
         <span class="dhc-tname">${displayName(next.awayTeam.name)}</span>
       </div>
       <div class="dhc-stage">${next.stage}${next.group ? ` · G${next.group}` : ''}</div>`
    : `<div class="dhc-label">FIFA WORLD CUP</div>
       <div class="dhc-done">🏆<br><span>Tournament Complete</span></div>`;

  const dashHeroHTML = `
    <div class="dash-hero-card" style="background:${heroGradient};">
      <div class="dh-branding-row">
        <span class="dh-trophy-icon">🏆</span>
        <span class="dh-brand-text">FIFA WORLD CUP 2026™</span>
      </div>
      <div class="dh-main-grid">
        <div class="dhg-col dhg-analytics">
          <div class="dha-eyebrow">STATS</div>
          <div class="dha-stats">
            <div class="dha-item">
              <div class="dha-val">${stats.played}</div>
              <div class="dha-lbl">Played</div>
            </div>
            <div class="dha-item">
              <div class="dha-val">${totalGoals}</div>
              <div class="dha-lbl">Goals</div>
            </div>
            <div class="dha-item${liveMatches.length ? ' dha-item--live' : ''}">
              <div class="dha-val">${liveMatches.length}</div>
              <div class="dha-lbl">Live</div>
            </div>
            <div class="dha-item">
              <div class="dha-val">${stats.upcoming}</div>
              <div class="dha-lbl">Left</div>
            </div>
          </div>
        </div>

        <div class="dhg-col dhg-countdown">
          ${countdownCol}
        </div>

        <div class="dhg-col dhg-actions">
          ${rightTopCard}
          <div class="dh-action-divider"></div>
          <div class="dh-action-card dh-action-card--fixtures" data-action="nav-fixtures">
            <div class="dh-action-icon">📅</div>
            <div class="dh-action-label">Fixtures</div>
          </div>
        </div>
      </div>
    </div>`;

  // ── § 3  LIVE CENTER ───────────────────────────────────
  const motd = (() => {
    const scored = completedMatches
      .map(m => { const s = effectiveScore(m); return s ? { m, goals: Number(s.home) + Number(s.away) } : null; })
      .filter(Boolean)
      .sort((a, b) => b.goals - a.goals);
    return scored[0]?.m || null;
  })();

  const upsetMatch = (() => {
    return completedMatches.find(m => {
      const s = effectiveScore(m);
      return s && Math.abs(Number(s.home) - Number(s.away)) >= 3;
    }) || null;
  })();

  const liveCenterCards = [];

  if (liveMatches.length) {
    liveCenterCards.push(`
      <div class="lc-card lc-card--live" data-action="open-match" data-id="${liveMatches[0].id}">
        <div class="lc-badge lc-badge--live"><span class="sb-live-dot"></span> LIVE</div>
        <div class="lc-matchup">
          <div class="lc-team">
            <span class="lc-flag">${liveMatches[0].homeTeam.flag}</span>
            <span class="lc-tname">${displayName(liveMatches[0].homeTeam.name)}</span>
          </div>
          <div class="lc-centre">VS</div>
          <div class="lc-team lc-team--right">
            <span class="lc-flag">${liveMatches[0].awayTeam.flag}</span>
            <span class="lc-tname">${displayName(liveMatches[0].awayTeam.name)}</span>
          </div>
        </div>
        <div class="lc-card-sub">${liveMatches.length} match${liveMatches.length !== 1 ? 'es' : ''} live now</div>
      </div>`);
  } else {
    liveCenterCards.push(`
      <div class="lc-card lc-card--dim">
        <div class="lc-badge">⚽ LIVE</div>
        <div class="lc-no-match">
          <span class="lc-no-match-icon">🌍</span>
          <span class="lc-no-match-text">No Live<br>Matches</span>
        </div>
        <div class="lc-card-sub">Next match soon</div>
      </div>`);
  }

  if (motd) {
    const ms = effectiveScore(motd);
    liveCenterCards.push(`
      <div class="lc-card lc-card--motd" data-action="open-match" data-id="${motd.id}">
        <div class="lc-badge lc-badge--gold">🔥 MATCH OF THE DAY</div>
        <div class="lc-matchup">
          <div class="lc-team">
            <span class="lc-flag">${motd.homeTeam.flag}</span>
            <span class="lc-tname">${displayName(motd.homeTeam.name)}</span>
          </div>
          <div class="lc-centre${ms ? ' lc-centre--score' : ''}">${ms ? `${ms.home}–${ms.away}` : 'FT'}</div>
          <div class="lc-team lc-team--right">
            <span class="lc-flag">${motd.awayTeam.flag}</span>
            <span class="lc-tname">${displayName(motd.awayTeam.name)}</span>
          </div>
        </div>
        <div class="lc-card-sub">${motd.stage}</div>
      </div>`);
  }

  if (upsetMatch) {
    const us = effectiveScore(upsetMatch);
    liveCenterCards.push(`
      <div class="lc-card lc-card--upset" data-action="open-match" data-id="${upsetMatch.id}">
        <div class="lc-badge lc-badge--red">📈 BIGGEST UPSET</div>
        <div class="lc-matchup">
          <div class="lc-team">
            <span class="lc-flag">${upsetMatch.homeTeam.flag}</span>
            <span class="lc-tname">${displayName(upsetMatch.homeTeam.name)}</span>
          </div>
          <div class="lc-centre${us ? ' lc-centre--score' : ''}">${us ? `${us.home}–${us.away}` : 'FT'}</div>
          <div class="lc-team lc-team--right">
            <span class="lc-flag">${upsetMatch.awayTeam.flag}</span>
            <span class="lc-tname">${displayName(upsetMatch.awayTeam.name)}</span>
          </div>
        </div>
        <div class="lc-card-sub">Result</div>
      </div>`);
  }

  const liveCenterHTML = `
    <div class="home-section-header">
      <span class="hsh-title">🔴 LIVE CENTER</span>
      <a href="#calendar" class="hsh-more">View All →</a>
    </div>
    <div class="lc-scroll">${liveCenterCards.join('')}</div>`;

  // ── § 3.5  GROUP STANDINGS ────────────────────────────
  const allScores = getAllScores();
  const groupStandings = getGroupStandings(allScores);
  const groupKeys = Object.keys(groupStandings).sort();

  const gsCards = groupKeys.map(grp => {
    const gColor = groupColor(grp);
    const rows = groupStandings[grp].map((t, i) => {
      const gd = t.gf - t.ga;
      return `
        <div class="gs-row${i < 2 ? ' gs-row--qualify' : ''}">
          <div class="gs-col-team">
            <span class="gs-rank">${i + 1}</span>
            <span class="gs-flag-sm">${t.flag}</span>
            <span class="gs-team-name">${displayName(t.name)}</span>
          </div>
          <span class="gs-stat-val">${t.mp}</span>
          <span class="gs-stat-val">${t.w}</span>
          <span class="gs-stat-val">${t.d}</span>
          <span class="gs-stat-val">${t.l}</span>
          <span class="gs-stat-val gs-gd-val">${gd >= 0 ? '+' : ''}${gd}</span>
          <span class="gs-stat-val gs-pts-val">${t.pts}</span>
        </div>`;
    }).join('');
    return `
      <div class="gs-group-card">
        <div class="gs-group-hdr">
          <span class="gs-badge" style="background:${gColor}22;color:${gColor}">GROUP ${grp}</span>
        </div>
        <div class="gs-thead">
          <span class="gs-th-team"></span>
          <span class="gs-th-stat">P</span>
          <span class="gs-th-stat">W</span>
          <span class="gs-th-stat">D</span>
          <span class="gs-th-stat">L</span>
          <span class="gs-th-stat">GD</span>
          <span class="gs-th-stat gs-th-pts">Pts</span>
        </div>
        ${rows}
      </div>`;
  }).join('');

  const groupStandingsHTML = `
    <div class="home-section-header">
      <span class="hsh-title">📊 GROUP STANDINGS</span>
      <a href="#standings" class="hsh-more">Full Tables →</a>
    </div>
    <div class="gs-scroll">${gsCards}</div>`;

  // ── § 4  FEATURED MATCHES CAROUSEL ────────────────────
  const carouselMatches = (() => {
    const upcoming = allMatches
      .filter(m => effectiveStatus(m) === 'upcoming')
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
      .slice(0, 6);
    // If fewer than 3 upcoming, pad with recent completed
    if (upcoming.length < 3) {
      const recent = completedMatches.slice(-3);
      return [...upcoming, ...recent].slice(0, 6);
    }
    return upcoming;
  })();

  const carouselCards = carouselMatches.map(m => {
    const st = effectiveStatus(m);
    const sc = effectiveScore(m);
    const hc = getTeamColor(m.homeTeam.name);
    const ac = getTeamColor(m.awayTeam.name);
    const isKnockout = !m.group;
    const isFinal = m.stage?.toLowerCase().includes('final') && !m.stage?.toLowerCase().includes('quarter') && !m.stage?.toLowerCase().includes('semi');
    const cardClass = isFinal ? 'fc-card fc-card--final' : isKnockout ? 'fc-card fc-card--knockout' : 'fc-card';
    return `
      <div class="${cardClass}" data-action="open-match" data-id="${m.id}"
           style="background:linear-gradient(145deg,${hc}30 0%,${isLight ? 'rgba(240,244,253,0.94)' : 'rgba(10,17,40,0.95)'} 55%,${ac}20 100%);">
        ${isFinal ? '<div class="fc-ribbon fc-ribbon--final">🏆 FINAL</div>' : isKnockout ? '<div class="fc-ribbon fc-ribbon--knockout">⚡ KNOCKOUT</div>' : ''}
        ${st === 'live' ? '<div class="fc-live-badge"><span class="sb-live-dot"></span> LIVE</div>' : ''}
        <div class="fc-stage">${m.stage}${m.group ? ` · Group ${m.group}` : ''}</div>
        <div class="fc-teams">
          <div class="fc-team">
            <span class="fc-flag">${m.homeTeam.flag}</span>
            <span class="fc-name">${displayName(m.homeTeam.name)}</span>
          </div>
          <div class="fc-score">
            ${sc ? `<span class="fc-score-val">${sc.home}–${sc.away}</span>` : '<span class="fc-score-vs">VS</span>'}
          </div>
          <div class="fc-team fc-team--away">
            <span class="fc-flag">${m.awayTeam.flag}</span>
            <span class="fc-name">${displayName(m.awayTeam.name)}</span>
          </div>
        </div>
        <div class="fc-meta">🏟️ ${m.stadium} &nbsp;·&nbsp; ${fmtDateShort(m.datetime)} ${fmtTime(m.datetime)}</div>
        <div class="fc-cta">Quick View →</div>
      </div>`;
  }).join('');

  const carouselHTML = `
    <div class="home-section-header">
      <span class="hsh-title">FEATURED MATCHES</span>
      <a href="#calendar" class="hsh-more">View Calendar →</a>
    </div>
    <div class="fc-scroll">${carouselCards}</div>`;

  // ── § 5  GOLDEN BOOT RACE ──────────────────────────────
  const boot = getGoldenBoot().slice(0, 5);
  const maxGoals = boot[0]?.goals || 1;
  const bootRows = boot.length
    ? boot.map((p, i) => {
        const cleanN = sanitizeScorerName(p.name);
        const resolved = resolvePlayerFromSquad(cleanN, p.team);
        const dispName = resolved ? resolved.name : cleanN;
        const clickAttr = resolved
          ? `data-action="open-player" data-team="${p.team}" data-player-num="${resolved.number}" style="cursor:pointer"`
          : '';
        return `
        <div class="gb-row" ${clickAttr}>
          <span class="gb-rank">${i + 1}</span>
          <div class="gb-info">
            <span class="gb-name">${dispName}</span>
            <span class="gb-team">${p.team}</span>
          </div>
          <div class="gb-bar-wrap">
            <div class="gb-bar-fill" style="width:${Math.round((p.goals / maxGoals) * 100)}%"></div>
          </div>
          <span class="gb-goals">${p.goals} ⚽</span>
        </div>`;
      }).join('')
    : `<p class="text-muted" style="font-size:0.85rem;text-align:center;padding:12px 0;">Scoring data loads from API on first sync.</p>`;

  const goldenBootHTML = `
    <div class="home-section-header">
      <span class="hsh-title">🏆 GOLDEN BOOT RACE</span>
      <a href="#scorers" class="hsh-more">Full List →</a>
    </div>
    <div class="glass-card gb-card">${bootRows}</div>`;

  // ── § 6  FAVOURITE TEAM ────────────────────────────────
  const allTeams = getTeams();
  const favTeamItems = favTeams.slice(0, 2).map(code => {
    const team = allTeams.find(t => t.code === code);
    if (!team) return null;
    const nextM = getTeamNextMatch(team.name);
    const tc = getTeamColor(team.name);
    return { team, nextM, tc };
  }).filter(Boolean);

  let favTeamHTML = '';
  if (favTeamItems.length === 0) {
    favTeamHTML = `
      <div class="home-section-header">
        <span class="hsh-title">⭐ MY TEAM</span>
      </div>
      <div class="glass-card fav-team-empty">
        <div class="fte-icon">⭐</div>
        <div class="fte-title">No Favourite Team</div>
        <div class="fte-sub">Track your team's World Cup journey in real time.</div>
        <ol class="fte-steps">
          <li>Open the <strong>Teams</strong> tab in the bottom nav</li>
          <li>Find your nation</li>
          <li>Tap <strong>☆</strong> next to the team name</li>
        </ol>
        <a href="#teams" class="btn btn-primary fte-cta">Browse 48 Teams →</a>
      </div>`;
  } else {
    const teamRows = favTeamItems.map(({ team, nextM, tc }) => {
      const isHome = nextM && nextM.homeTeam.name === team.name;
      const opp    = nextM ? (isHome ? nextM.awayTeam : nextM.homeTeam) : null;
      return `
        <div class="fav-team-row" data-action="open-team" data-name="${team.name}" style="border-left-color:${tc};">
          <div class="ftr-flag">${team.flag}</div>
          <div class="ftr-info">
            <div class="ftr-name">${displayName(team.name)}</div>
            <div class="ftr-meta">#${team.fifaRank} FIFA · Group ${team.group}</div>
            ${opp ? `
              <div class="ftr-next">
                <span class="ftr-next-label">NEXT</span>
                ${opp.flag} ${displayName(opp.name)} · ${fmtDateShort(nextM.datetime)} ${fmtTime(nextM.datetime)}
              </div>` : `<div class="ftr-meta" style="margin-top:4px;">No upcoming matches</div>`}
          </div>
          ${nextM ? `<button class="ftr-view-btn" data-action="open-match" data-id="${nextM.id}">View →</button>` : ''}
        </div>`;
    }).join('');

    favTeamHTML = `
      <div class="home-section-header">
        <span class="hsh-title">⭐ MY TEAM</span>
        <a href="#teams" class="hsh-more">Edit →</a>
      </div>
      <div class="glass-card fav-team-card">${teamRows}</div>`;
  }

  // ── § 7  TOURNAMENT JOURNEY ────────────────────────────
  const journeyStages = [
    { label: 'Group Stage',   dates: 'Jun 12 – Jun 27', key: 'group'   },
    { label: 'Round of 32',   dates: 'Jun 28 – Jul 1',  key: 'r32'     },
    { label: 'Round of 16',   dates: 'Jul 2 – Jul 5',   key: 'r16'     },
    { label: 'Quarterfinals', dates: 'Jul 8 – Jul 9',   key: 'qf'      },
    { label: 'Semifinals',    dates: 'Jul 12 – Jul 13', key: 'sf'      },
    { label: 'Final',         dates: 'Jul 19',          key: 'final'   },
  ];

  // Determine current stage from played matches
  const currentStageKey = (() => {
    const d = now;
    if (d < new Date('2026-06-28')) return 'group';
    if (d < new Date('2026-07-02')) return 'r32';
    if (d < new Date('2026-07-06')) return 'r16';
    if (d < new Date('2026-07-10')) return 'qf';
    if (d < new Date('2026-07-14')) return 'sf';
    return 'final';
  })();

  const journeyRows = journeyStages.map(s => {
    const isCurrent = s.key === currentStageKey;
    const isPast = journeyStages.indexOf(s) < journeyStages.findIndex(j => j.key === currentStageKey);
    return `
      <div class="tj-row ${isCurrent ? 'tj-row--current' : isPast ? 'tj-row--past' : ''}">
        <div class="tj-dot ${isCurrent ? 'tj-dot--current' : isPast ? 'tj-dot--past' : ''}"></div>
        <div class="tj-info">
          <span class="tj-label">${s.label}</span>
          <span class="tj-dates">${s.dates}</span>
        </div>
        ${isCurrent ? '<span class="tj-now">NOW</span>' : ''}
      </div>`;
  }).join('');

  const journeyHTML = `
    <div class="home-section-header">
      <span class="hsh-title">TOURNAMENT JOURNEY</span>
    </div>
    <div class="glass-card tj-card">${journeyRows}</div>`;

  return makeSection(`
    ${dashHeroHTML}
    ${liveCenterHTML}
    ${groupStandingsHTML}
    ${goldenBootHTML}
    ${favTeamHTML}
    ${carouselHTML}
    ${journeyHTML}
  `);
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

  const score     = getScore(match.id);
  const status    = effectiveStatus(match);
  const apiScorers = getApiScorers(match.id);
  const note      = getNote(match.id) || { text: '', photos: [] };
  const starred   = isMatchFavorite(match.id);
  const homeSquad = getTeamSquad(match.homeTeam.name);
  const awaySquad = getTeamSquad(match.awayTeam.name);
  const vi        = match.venueInfo;
  const intel     = getMatchIntelligence(match);
  const hc = getTeamColor(match.homeTeam.name);
  const ac = getTeamColor(match.awayTeam.name);
  const hData = getTeamData(match.homeTeam.name);
  const aData = getTeamData(match.awayTeam.name);

  // ── Scoreboard ribbon center ──
  let sbCenter = '';
  if (score) {
    sbCenter = `<div class="sb-score">${score.home}&nbsp;–&nbsp;${score.away}</div><div class="sb-status-text">Full Time</div>`;
  } else if (status === 'live') {
    sbCenter = `<div class="sb-score"><span class="sb-live-dot"></span>LIVE</div>`;
  } else if (status === 'completed') {
    sbCenter = `<div class="sb-score" style="font-size:1rem;letter-spacing:0.12em;opacity:0.7;">FT</div><div class="sb-status-text">Full Time</div>`;
  } else {
    sbCenter = `<div class="sb-score" style="font-size:1rem;letter-spacing:0.12em;opacity:0.7;">VS</div><div class="sb-status-text">${fmtTime(match.datetime)}</div>`;
  }

  // ── Below-ribbon content (read-only — no manual score entry) ──
  let broadcastBottom = '';
  if (status === 'upcoming') {
    const prob = intel ? `
      <div class="hero-win-prob" style="width:100%;max-width:320px;">
        <div class="hwp-bar">
          <div class="hwp-home" style="width:${intel.prediction.home}%"></div>
          <div class="hwp-draw"  style="width:${intel.prediction.draw}%"></div>
          <div class="hwp-away" style="width:${intel.prediction.away}%"></div>
        </div>
        <div class="hwp-labels">
          <span>${intel.prediction.home}%</span>
          <span>${intel.prediction.draw}% Draw</span>
          <span>${intel.prediction.away}%</span>
        </div>
      </div>` : '';
    broadcastBottom = `
      <div class="cd-kickoff-label">Kicks off in</div>
      <div class="countdown-blocks" data-countdown-target="${match.datetime}">
        <div class="cd-block"><span class="cd-val" data-cd="d">--</span><span class="cd-label">Days</span></div>
        <span class="cd-sep">:</span>
        <div class="cd-block"><span class="cd-val" data-cd="h">--</span><span class="cd-label">Hrs</span></div>
        <span class="cd-sep">:</span>
        <div class="cd-block"><span class="cd-val" data-cd="m">--</span><span class="cd-label">Min</span></div>
        <span class="cd-sep">:</span>
        <div class="cd-block"><span class="cd-val" data-cd="s">--</span><span class="cd-label">Sec</span></div>
      </div>
      ${prob}`;
  } else if (status === 'live') {
    broadcastBottom = `
      <div style="display:flex;align-items:center;gap:8px;font-size:0.85rem;font-weight:700;color:var(--accent-live);">
        <span class="sb-live-dot"></span> Match in progress
      </div>`;
  } else if (status === 'completed' && apiScorers) {
    const goalRow = (scorers, align) => scorers.length
      ? `<div style="display:flex;flex-direction:column;gap:3px;align-items:${align};">
           ${scorers.map(s => `<span style="font-size:0.78rem;color:var(--text-secondary);">⚽ ${s}</span>`).join('')}
         </div>`
      : '';
    broadcastBottom = `
      <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px;width:100%;max-width:380px;padding-top:4px;">
        ${goalRow(apiScorers.home, 'flex-start')}
        <div></div>
        ${goalRow(apiScorers.away, 'flex-end')}
      </div>`;
  }

  // ── Form badges ──
  const formBadge = c => {
    const cls = c === 'W' ? 'form-w' : c === 'D' ? 'form-d' : 'form-l';
    return `<span class="form-badge ${cls}">${c}</span>`;
  };

  // ── Squad (collapsed) ──
  const squadPills = (squad, teamName) => !squad.length ? '' : `
    <details style="margin-bottom:10px;">
      <summary style="cursor:pointer;font-weight:700;font-size:0.9rem;padding:6px 0;list-style:none;display:flex;align-items:center;gap:8px;">
        <span>${teamName} Squad</span><span class="section-badge">${squad.length}</span>
      </summary>
      <div class="squad-list" style="margin-top:10px;">
        ${squad.map(p => `<span class="player-pill">${p}</span>`).join('')}
      </div>
    </details>`;

  const photoThumbsHTML = (note.photos || []).map(src => `<img class="photo-thumb" src="${src}" alt="photo" />`).join('');

  // ── Intelligence tab content ──
  const intelTabHTML = renderMatchIntelligence(match);

  return makeSection(`

    <!-- ══ BROADCAST HERO ══ -->
    <div class="broadcast-hero" style="background:linear-gradient(135deg,${hc}28 0%,transparent 40%,transparent 60%,${ac}28 100%),var(--bg-secondary);">

      <div class="broadcast-stage">
        ${match.stage}${match.group ? `&nbsp;·&nbsp;Group ${match.group}` : ''}
        ${status === 'live' ? `&nbsp;·&nbsp;<span class="status-badge status-live">🔴 LIVE</span>` : ''}
        ${status === 'completed' && score ? `&nbsp;·&nbsp;<span class="status-badge status-completed">Full Time</span>` : ''}
      </div>

      <div class="broadcast-shields">
        <div class="shield-wrap">
          <div class="shield-outer" style="background:linear-gradient(145deg,rgba(255,255,255,0.65),${hc}55,rgba(11,18,32,0.8));">
            <div class="shield-inner" style="background:radial-gradient(circle at 35% 35%,${hc}30,rgba(11,18,32,0.92));">
              ${match.homeTeam.flag}
            </div>
          </div>
          <div class="shield-team-name team-link" data-action="open-team" data-name="${match.homeTeam.name}">${displayName(match.homeTeam.name)}</div>
        </div>

        <div class="broadcast-vs">
          <div class="broadcast-vs-text">VS</div>
        </div>

        <div class="shield-wrap">
          <div class="shield-outer" style="background:linear-gradient(145deg,rgba(255,255,255,0.65),${ac}55,rgba(11,18,32,0.8));">
            <div class="shield-inner" style="background:radial-gradient(circle at 35% 35%,${ac}30,rgba(11,18,32,0.92));">
              ${match.awayTeam.flag}
            </div>
          </div>
          <div class="shield-team-name team-link" data-action="open-team" data-name="${match.awayTeam.name}">${displayName(match.awayTeam.name)}</div>
        </div>
      </div>

      <div class="scoreboard-ribbon">
        <div class="sb-home team-link" data-action="open-team" data-name="${match.homeTeam.name}">${displayName(match.homeTeam.name)}</div>
        <div class="sb-center">${sbCenter}</div>
        <div class="sb-away team-link" data-action="open-team" data-name="${match.awayTeam.name}">${displayName(match.awayTeam.name)}</div>
      </div>

      <div class="broadcast-date">${fmtDate(match.datetime)} &nbsp;·&nbsp; ${vi.flag} ${vi.city || vi.name}</div>

      ${broadcastBottom ? `<div class="broadcast-bottom">${broadcastBottom}</div>` : ''}
    </div>

    <!-- ══ TAB BAR ══ -->
    <div class="match-tabs">
      <div class="tab-bar">
        <button class="tab-btn active" data-action="match-tab" data-tab="overview">Overview</button>
        <button class="tab-btn"        data-action="match-tab" data-tab="intelligence">Intelligence</button>
        <button class="tab-btn"        data-action="match-tab" data-tab="journal">Journal</button>
        <button class="tab-btn"        data-action="match-tab" data-tab="info">Info</button>
      </div>

      <!-- ── Tab: Overview ── -->
      <div class="tab-panel active" data-tab="overview">
        <div class="glass-card">
          <div class="intel-section-label">Recent Form</div>
          <div class="form-compare">
            <div class="form-team-side">
              <span class="form-team-label">${match.homeTeam.flag} ${match.homeTeam.name}</span>
              <div class="form-strip">${(hData.form||'WDWLW').split('').map(formBadge).join('')}</div>
            </div>
            <div class="form-divider-label">Last 5</div>
            <div class="form-team-side right">
              <span class="form-team-label">${match.awayTeam.name} ${match.awayTeam.flag}</span>
              <div class="form-strip">${(aData.form||'WDWLW').split('').map(formBadge).join('')}</div>
            </div>
          </div>
        </div>
        ${intel ? `
        <div class="intel-storyline">
          <div class="intel-section-label">Match Story</div>
          <div class="intel-headline">${intel.headline}</div>
          <div class="intel-narrative">${intel.narrative}</div>
        </div>
        <div class="glass-card">
          <div class="intel-section-label">Prediction</div>
          <div class="prediction-row">
            <div class="pred-team"><div class="pred-pct">${intel.prediction.home}%</div><div class="pred-label">${match.homeTeam.flag} Win</div></div>
            <div class="pred-draw"><div class="pred-draw-pct">${intel.prediction.draw}%</div><div class="pred-draw-label">Draw</div></div>
            <div class="pred-team"><div class="pred-pct" style="color:var(--accent-gold)">${intel.prediction.away}%</div><div class="pred-label">${match.awayTeam.flag} Win</div></div>
          </div>
          <div class="pred-bar-wrap">
            <div class="pred-bar-home" style="width:${intel.prediction.home}%"></div>
            <div class="pred-bar-draw" style="width:${intel.prediction.draw}%"></div>
            <div class="pred-bar-away" style="width:${intel.prediction.away}%"></div>
          </div>
          <p class="pred-disclaimer">Based on FIFA rankings, H2H &amp; form. For entertainment only.</p>
        </div>` : ''}
      </div>

      <!-- ── Tab: Intelligence ── -->
      <div class="tab-panel" data-tab="intelligence">
        ${intelTabHTML || '<div class="glass-card"><div class="empty-state"><div class="empty-state-icon">🔍</div><p class="empty-state-text">Intelligence available for group stage matches once teams are confirmed.</p></div></div>'}
      </div>

      <!-- ── Tab: Journal ── -->
      <div class="tab-panel" data-tab="journal">
        <div class="glass-card">
          <div class="intel-section-label">Match Notes</div>
          <div class="journal-prompt">Your personal notes for this match. Only visible to you.</div>
          <textarea class="notes-area" id="match-note-${match.id}" placeholder="Add your observations, predictions or memories…">${note.text}</textarea>
          <div style="margin-top:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <label class="btn btn-sm" style="cursor:pointer;">📷 Add Photo
              <input type="file" id="note-photos-${match.id}" accept="image/*" multiple style="display:none;" />
            </label>
            <button class="btn btn-primary btn-sm" data-action="save-note" data-id="${match.id}">Save Notes</button>
          </div>
          ${photoThumbsHTML ? `<div class="photo-preview">${photoThumbsHTML}</div>` : ''}
        </div>

        <div class="glass-card">
          <div class="intel-section-label">Tactical Notes</div>
          <div class="journal-prompt">Observations on formations, key battles and tactical decisions.</div>
          <textarea class="tactical-input" placeholder="e.g. High press vs low block, wing overloads, set-piece routines…"></textarea>
        </div>

        ${intel ? `
        <div class="glass-card">
          <div class="intel-section-label">Match Story</div>
          <div class="intel-headline">${intel.headline}</div>
          <div class="intel-narrative" style="margin-top:8px;">${intel.narrative}</div>
        </div>` : ''}

        <div class="glass-card">
          <div class="intel-section-label">AI Generated Summary</div>
          <div class="gb-watch-note" style="margin-bottom:0;">
            ${status === 'completed'
              ? `${intel ? intel.narrative : 'Match completed. Full AI analysis available when connected to live data.'}`
              : 'AI summary will be generated after the match is complete.'}
          </div>
        </div>
      </div>

      <!-- ── Tab: Info ── -->
      <div class="tab-panel" data-tab="info">

        <!-- Venue Intelligence Card -->
        <div class="glass-card">
          <div class="intel-section-label">Venue Intelligence</div>
          <div class="venue-intel-card">
            <div class="vic-header">
              <span class="vic-flag">${vi.flag || '🏟️'}</span>
              <div style="flex:1;min-width:0;">
                <div class="vic-name team-link" data-action="open-venue-by-name" data-name="${vi.fullName || vi.name}">${vi.fullName || vi.name}</div>
                <div class="vic-city">${[vi.city, vi.country].filter(Boolean).join(', ') || '—'}</div>
              </div>
            </div>
            <div class="vic-stats">
              <div class="vic-stat">
                <div class="vic-stat-val">${vi.capacity ? vi.capacity.toLocaleString() : '—'}</div>
                <div class="vic-stat-label">Capacity</div>
              </div>
              <div class="vic-stat">
                <div class="vic-stat-val">${vi.opened || '—'}</div>
                <div class="vic-stat-label">Opened</div>
              </div>
              <div class="vic-stat">
                <div class="vic-stat-val">${vi.surface || 'Grass'}</div>
                <div class="vic-stat-label">Surface</div>
              </div>
            </div>
            <div class="vic-fact">
              🏆 Hosting FIFA World Cup 2026 · ${match.stage}${match.group ? ` Group ${match.group}` : ''}
            </div>
            <div style="margin-top:4px;">
              <a href="https://maps.google.com?q=${encodeURIComponent(vi.fullName||vi.name)}" target="_blank" rel="noreferrer" class="btn btn-sm" style="display:inline-flex;text-decoration:none;">🗺️ View on Map</a>
            </div>
          </div>
        </div>

        ${homeSquad.length||awaySquad.length ? `
        <div class="glass-card">
          <div class="intel-section-label">Squads</div>
          ${squadPills(homeSquad, match.homeTeam.name)}
          ${squadPills(awaySquad, match.awayTeam.name)}
        </div>` : ''}

        <div class="glass-card">
          <div class="action-row">
            <button class="btn ${starred?'btn-primary':''}" data-action="toggle-star" data-id="${match.id}">
              ${starred?'⭐ Starred':'☆ Star Match'}
            </button>
            <button class="btn" data-action="share-card" data-id="${match.id}">🖼️ Share Card</button>
            <button class="btn" data-action="export-pdf" data-id="${match.id}">📄 Export PDF</button>
          </div>
        </div>
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
  const fav   = favTeams.includes(t.code);
  const nextM = getTeamNextMatch(t.name);
  const td    = getTeamData(t.name);
  const tc    = getTeamColor(t.name);

  const formBadge = c => {
    const cls = c === 'W' ? 'form-w' : c === 'D' ? 'form-d' : 'form-l';
    return `<span class="form-badge ${cls}" style="width:22px;height:22px;font-size:0.58rem;">${c}</span>`;
  };
  const formHTML = (td.form || '').split('').map(formBadge).join('');

  return `
    <div class="team-item ${fav ? 'fav' : ''}" style="border-left-color:${tc}55;">
      <div class="team-item-left" data-action="open-team" data-name="${t.name}" style="cursor:pointer;flex:1;min-width:0;">
        <span class="team-item-flag">${t.flag}</span>
        <div style="min-width:0;">
          <div class="team-item-name">${displayName(t.name)}</div>
          <div class="team-item-rank">#${t.fifaRank} FIFA · ${td.wcApps || '—'} WC apps${nextM ? ` · ${fmtDateShort(nextM.datetime)}` : ''}</div>
          ${formHTML ? `<div class="form-strip" style="margin-top:4px;gap:3px;">${formHTML}</div>` : ''}
        </div>
      </div>
      <div class="team-item-right">
        <button class="fav-btn" data-action="toggle-fav-team" data-code="${t.code}" title="${fav ? 'Unfavorite' : 'Favorite'}">${fav ? '⭐' : '☆'}</button>
      </div>
    </div>
  `;
}

// ── Squad helpers ─────────────────────────────────────────
function pAge(dob) {
  return Math.floor((new Date('2026-06-12') - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25));
}

function pInitials(name) {
  const p = name.split(' ').filter(Boolean);
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

function pAvatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return `hsl(${Math.abs(h) % 360},45%,28%)`;
}

function pShortName(name) {
  const p = name.split(' ').filter(Boolean);
  return p.length <= 1 ? name : p[p.length - 1];
}

function playerCardHTML(p, teamName) {
  return `
    <div class="player-card" data-action="open-player" data-team="${teamName}" data-player-num="${p.number}">
      <div class="pc-avatar" style="background:${pAvatarColor(p.name)}">
        <span class="pc-initials">${pInitials(p.name)}</span>
        <span class="pc-num">#${p.number}</span>
      </div>
      <div class="pc-body">
        <div class="pc-name">${p.name}</div>
        <span class="pc-pos-badge pos-${p.pos}">${p.pos}</span>
        <div class="pc-club">${p.club}</div>
        ${p.captain ? '<div class="pc-captain">© Captain</div>' : ''}
      </div>
    </div>`;
}

function playerRowHTML(p, teamName) {
  return `
    <div class="player-row" data-action="open-player" data-team="${teamName}" data-player-num="${p.number}">
      <span class="pr-num">#${p.number}</span>
      <span class="pr-pos pos-${p.pos}">${p.pos}</span>
      <span class="pr-name">${p.name}${p.captain ? ' ©' : ''}</span>
      <span class="pr-club">${p.club}</span>
    </div>`;
}

export function updateSquadGrid(teamName, players, view) {
  const grid = document.getElementById(`squad-grid-${teamName}`);
  if (!grid) return;
  if (!players.length) {
    grid.innerHTML = `<div class="empty-state" style="padding:24px 0;"><div class="empty-state-icon">👤</div><p class="empty-state-text">No players match.</p></div>`;
    return;
  }
  if (view === 'list') {
    grid.innerHTML = `
      <div class="player-list-view">
        <div class="plv-header">
          <span class="pr-num">#</span><span class="pr-pos">POS</span>
          <span class="pr-name">NAME</span><span class="pr-club">CLUB</span>
        </div>
        ${players.map(p => playerRowHTML(p, teamName)).join('')}
      </div>`;
  } else {
    grid.innerHTML = `<div class="squad-grid">${players.map(p => playerCardHTML(p, teamName)).join('')}</div>`;
  }
}

export function showPlayerModal(player, teamName, teamFlag) {
  const existing = document.getElementById('cv-player-modal');
  if (existing) existing.remove();

  const age    = pAge(player.dob);
  const dobStr = new Date(player.dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const bg     = pAvatarColor(player.name);
  const POS_FULL = { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FWD: 'Forward' };

  const el = document.createElement('div');
  el.id = 'cv-player-modal';
  el.className = 'cv-player-modal-wrap';
  el.innerHTML = `
    <div class="cv-modal-backdrop" data-action="close-player-modal"></div>
    <div class="cv-modal-card glass-card">
      <button class="cv-modal-close" data-action="close-player-modal">×</button>
      <div class="cv-modal-header">
        <div class="cv-modal-avatar" style="background:${bg}">
          <div class="cv-modal-initials">${pInitials(player.name)}</div>
          <div class="cv-modal-jersey">#${player.number}</div>
        </div>
        <div class="cv-modal-info">
          <div class="cv-modal-name">${player.name}</div>
          <div class="cv-modal-tags">
            <span class="pc-pos-badge pos-${player.pos}">${player.pos}</span>
            ${player.captain ? '<span class="cv-captain-tag">© Captain</span>' : ''}
          </div>
          <div class="cv-modal-nation">${teamFlag} ${teamName}</div>
        </div>
      </div>
      <div class="cv-modal-stats-row">
        <div class="cv-ms"><div class="cv-ms-val">${player.caps}</div><div class="cv-ms-lbl">Caps</div></div>
        <div class="cv-ms"><div class="cv-ms-val">${player.goals}</div><div class="cv-ms-lbl">Int'l Goals</div></div>
        <div class="cv-ms"><div class="cv-ms-val">${age}</div><div class="cv-ms-lbl">Age</div></div>
      </div>
      <div class="cv-modal-details">
        <div class="cv-detail-row"><span class="cv-detail-lbl">Date of Birth</span><span class="cv-detail-val">${dobStr}</span></div>
        <div class="cv-detail-row"><span class="cv-detail-lbl">Club</span><span class="cv-detail-val">${player.club}</span></div>
        <div class="cv-detail-row"><span class="cv-detail-lbl">Position</span><span class="cv-detail-val">${POS_FULL[player.pos] || player.pos}</span></div>
      </div>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('visible'));
}

// ── TEAM PROFILE ─────────────────────────────────────────
export function renderTeamProfile(teamName) {
  const allTeams   = getTeams();
  const teamMeta   = allTeams.find(t => t.name === teamName);
  const td         = getTeamData(teamName);
  const tc         = getTeamColor(teamName);
  const players    = getSquad(teamName);
  const favTeams   = getFavTeams();
  const isFav      = teamMeta ? favTeams.includes(teamMeta.code) : false;
  const allMatches = getMatches()
    .filter(m => m.homeTeam.name === teamName || m.awayTeam.name === teamName)
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

  if (!teamMeta) {
    return makeSection(`
      <div class="glass-card">
        <button class="btn btn-sm" data-action="nav-back" style="margin-bottom:14px;">← Back</button>
        <div class="empty-state"><div class="empty-state-icon">❌</div><p class="empty-state-text">Team not found.</p></div>
      </div>
    `);
  }

  const formBadge = c => {
    const cls = c === 'W' ? 'form-w' : c === 'D' ? 'form-d' : 'form-l';
    return `<span class="form-badge ${cls}">${c}</span>`;
  };
  const formHTML = (td.form || '').split('').map(formBadge).join('');

  const upcomingMatches  = allMatches.filter(m => effectiveStatus(m) === 'upcoming');
  const completedMatches = allMatches.filter(m => effectiveStatus(m) === 'completed');
  let tw = 0, td2 = 0, tl = 0, tgf = 0, tga = 0;
  completedMatches.forEach(m => {
    const s = effectiveScore(m);
    if (!s) return;
    const isHome = m.homeTeam.name === teamName;
    const gf = Number(isHome ? s.home : s.away);
    const ga = Number(isHome ? s.away : s.home);
    tgf += gf; tga += ga;
    if (gf > ga) tw++; else if (gf < ga) tl++; else td2++;
  });

  // ── Squad tab data ───────────────────────────────────────
  const squadSize  = players.length;
  const captain    = players.find(p => p.captain);
  const avgAge     = squadSize
    ? (players.reduce((sum, p) => sum + pAge(p.dob), 0) / squadSize).toFixed(1)
    : '—';
  const topScorer  = [...players].sort((a, b) => b.goals - a.goals)[0];
  const risingCandidates = [...players].filter(p => p.pos !== 'GK').sort((a, b) => new Date(b.dob) - new Date(a.dob));
  const risingStar = risingCandidates.find(p => pAge(p.dob) <= 23) || risingCandidates[0];
  const mostCapped = [...players].sort((a, b) => b.caps - a.caps)[0];

  const kpCard = (label, stat, p) => !p ? '' : `
    <div class="kp-card" data-action="open-player" data-team="${teamName}" data-player-num="${p.number}">
      <div class="kp-label">${label}</div>
      <div class="kp-avatar" style="background:${pAvatarColor(p.name)}">${pInitials(p.name)}</div>
      <div class="kp-num">#${p.number}</div>
      <div class="kp-name">${p.name}</div>
      <div class="kp-stat">${stat}</div>
    </div>`;

  const keyPlayers = squadSize ? `
    <div class="squad-section">
      <div class="intel-section-label">⭐ Key Players</div>
      <div class="key-players-scroll">
        ${kpCard('© Captain', `${captain?.caps ?? 0} caps`, captain)}
        ${topScorer && topScorer !== captain ? kpCard('⚽ Top Scorer', `${topScorer.goals} goals`, topScorer) : ''}
        ${risingStar && risingStar !== captain && risingStar !== topScorer
          ? kpCard('⭐ Rising Star', `Age ${pAge(risingStar.dob)}`, risingStar) : ''}
        ${mostCapped && mostCapped !== captain ? kpCard('🏆 Most Capped', `${mostCapped.caps} caps`, mostCapped) : ''}
      </div>
    </div>` : '';

  // Formation (4-3-3 by most-capped)
  const fGK  = [...players].filter(p => p.pos === 'GK').sort((a, b) => b.caps - a.caps);
  const fDEF = [...players].filter(p => p.pos === 'DEF').sort((a, b) => b.caps - a.caps);
  const fMID = [...players].filter(p => p.pos === 'MID').sort((a, b) => b.caps - a.caps);
  const fFWD = [...players].filter(p => p.pos === 'FWD').sort((a, b) => b.caps - a.caps);
  const fpCard = p => !p ? '' : `
    <div class="fp-player">
      <div class="fp-circle" style="background:${pAvatarColor(p.name)}">${pInitials(p.name)}</div>
      <div class="fp-label">${pShortName(p.name)}</div>
    </div>`;

  const formationBlock = squadSize ? `
    <div id="formation-panel-${teamName}" class="formation-pitch hidden">
      <div class="formation-tag">4-3-3 · Probable Lineup</div>
      <div class="formation-row">${fpCard(fFWD[0])}${fpCard(fFWD[1])}${fpCard(fFWD[2])}</div>
      <div class="formation-row">${fpCard(fMID[0])}${fpCard(fMID[1])}${fpCard(fMID[2])}</div>
      <div class="formation-row">${fpCard(fDEF[0])}${fpCard(fDEF[1])}${fpCard(fDEF[2])}${fpCard(fDEF[3])}</div>
      <div class="formation-row formation-gk-row">${fpCard(fGK[0])}</div>
    </div>` : '';

  // ── Tab panels ───────────────────────────────────────────
  const overviewPanel = `
    <div class="stats-row" style="grid-template-columns:repeat(${completedMatches.length ? 4 : 3},1fr);">
      <div class="stat-item"><div class="stat-value">#${teamMeta.fifaRank}</div><div class="stat-label">FIFA Rank</div></div>
      <div class="stat-item"><div class="stat-value">${td.wcApps || '—'}</div><div class="stat-label">WC Apps</div></div>
      <div class="stat-item"><div class="stat-value">${upcomingMatches.length}</div><div class="stat-label">Upcoming</div></div>
      ${completedMatches.length ? `<div class="stat-item"><div class="stat-value">${tgf}-${tga}</div><div class="stat-label">GF-GA</div></div>` : ''}
    </div>
    ${completedMatches.length ? `
    <div class="glass-card">
      <div class="intel-section-label">Tournament Record</div>
      <div class="stats-row" style="grid-template-columns:repeat(4,1fr);">
        <div class="stat-item"><div class="stat-value" style="color:var(--accent-success)">${tw}</div><div class="stat-label">Won</div></div>
        <div class="stat-item"><div class="stat-value" style="color:var(--text-muted)">${td2}</div><div class="stat-label">Drawn</div></div>
        <div class="stat-item"><div class="stat-value" style="color:var(--accent-live)">${tl}</div><div class="stat-label">Lost</div></div>
        <div class="stat-item"><div class="stat-value">${tw * 3 + td2}</div><div class="stat-label">Points</div></div>
      </div>
    </div>` : ''}
    <div class="glass-card">
      <div class="intel-section-label">Recent Form (Last 5)</div>
      <div class="form-strip">${formHTML || '<span class="text-muted">No data</span>'}</div>
      <div style="margin-top:8px;font-size:0.78rem;color:var(--text-muted);">Play style: ${td.style || '—'} · Confederation: ${td.conf || '—'}</div>
    </div>`;

  const fixturesPanel = allMatches.length ? `
    <div class="glass-card">
      <div class="intel-section-label">Tournament Fixtures</div>
      <div class="match-grid">${allMatches.map(m => matchCardHTML(m)).join('')}</div>
    </div>` : `<div class="empty-state" style="padding:32px 0;"><div class="empty-state-icon">📅</div><p class="empty-state-text">No fixtures found.</p></div>`;

  const squadPanel = squadSize ? `
    ${keyPlayers}
    <div class="squad-section">
      <div class="squad-header-stats glass-card">
        <div class="shs-item"><div class="shs-val">${squadSize}</div><div class="shs-lbl">Players</div></div>
        <div class="shs-item"><div class="shs-val">${avgAge}</div><div class="shs-lbl">Avg Age</div></div>
        <div class="shs-item"><div class="shs-val">${captain ? pShortName(captain.name) : '—'}</div><div class="shs-lbl">Captain</div></div>
        <div class="shs-item"><div class="shs-val">${fGK.length}/${fDEF.length}/${fMID.length}/${fFWD.length}</div><div class="shs-lbl">GK/D/M/F</div></div>
      </div>
      ${formationBlock}
      <div class="squad-controls-bar glass-card">
        <input class="squad-search-input" data-squad-search="${teamName}" placeholder="🔍 Search player, number, club…" />
        <div class="squad-controls-row">
          <div class="squad-pos-bar">
            ${['ALL','GK','DEF','MID','FWD'].map(pos => `
              <button class="spf-btn ${pos === 'ALL' ? 'active' : ''}" data-action="squad-filter" data-team="${teamName}" data-pos="${pos}">${pos === 'ALL' ? 'All' : pos}</button>
            `).join('')}
          </div>
          <div class="squad-view-btns">
            <button class="svt-btn active" data-action="squad-view" data-team="${teamName}" data-view="cards" title="Cards">⊞</button>
            <button class="svt-btn" data-action="squad-view" data-team="${teamName}" data-view="list" title="List">☰</button>
            <button class="svt-btn" data-action="squad-formation" data-team="${teamName}" title="Formation">⬡</button>
          </div>
        </div>
      </div>
      <div id="squad-grid-${teamName}">
        <div class="squad-grid">${players.map(p => playerCardHTML(p, teamName)).join('')}</div>
      </div>
    </div>` : `<div class="empty-state" style="padding:32px 0;"><div class="empty-state-icon">👥</div><p class="empty-state-text">Squad data not available offline.</p></div>`;

  return makeSection(`
    <button class="btn btn-sm" data-action="nav-back" style="margin-bottom:4px;">← Back</button>

    <div class="tp-hero glass-card" style="border-color:${tc}44;background:linear-gradient(135deg,${tc}1A 0%,var(--bg-card) 100%);">
      <div class="tp-flag-row">
        <span class="tp-flag">${teamMeta.flag}</span>
        <div class="tp-info">
          <h1 class="tp-name">${displayName(teamMeta.name)}</h1>
          <div class="tp-meta">Group ${teamMeta.group} · #${teamMeta.fifaRank} FIFA · ${td.conf || '—'}</div>
          ${td.star && td.star !== '—' ? `<div class="tp-star">⭐ Key Player: ${td.star}</div>` : ''}
        </div>
        <button class="fav-btn" data-action="toggle-fav-team" data-code="${teamMeta.code}" title="${isFav ? 'Unfavorite' : 'Favorite'}" style="font-size:1.3rem;">${isFav ? '⭐' : '☆'}</button>
      </div>
      <div class="tp-best">🏆 Best World Cup Result: <strong>${td.wcBest || '—'}</strong> &nbsp;·&nbsp; ${td.wcApps || '?'} WC appearances</div>
    </div>

    <div class="tp-tab-bar">
      <button class="tp-tab-btn active" data-action="team-tab" data-tab="overview">Overview</button>
      <button class="tp-tab-btn" data-action="team-tab" data-tab="fixtures">Fixtures <span class="tp-tab-badge">${allMatches.length}</span></button>
      <button class="tp-tab-btn" data-action="team-tab" data-tab="squad">Squad ${squadSize ? `<span class="tp-tab-badge">${squadSize}</span>` : ''}</button>
    </div>

    <div class="tp-tab-panel active" data-tab="overview">${overviewPanel}</div>
    <div class="tp-tab-panel" data-tab="fixtures">${fixturesPanel}</div>
    <div class="tp-tab-panel" data-tab="squad">${squadPanel}</div>
  `);
}

// ── CALENDAR — iOS-style 2D month grid ────────────────────
let calendarDate  = null;
let calFilterTeam = '';
let calFilterFavs = false;

function applyCalFilters(matches) {
  const favTeams = getFavTeams();
  return matches.filter(m => {
    if (calFilterTeam && m.homeTeam.name !== calFilterTeam && m.awayTeam.name !== calFilterTeam) return false;
    if (calFilterFavs && !favTeams.includes(m.homeTeam.code) && !favTeams.includes(m.awayTeam.code)) return false;
    return true;
  });
}

function buildMonthGrid(year, month, matchDateMap, selectedDate) {
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Date(year, month, 1).toLocaleString('en-US', { month: 'long' });
  const todayStr = new Date().toISOString().slice(0, 10);

  const cells = [];
  // Padding before 1st
  for (let i = 0; i < firstDow; i++) cells.push('<div class="cal-day-cell"></div>');

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const count   = matchDateMap.get(dateStr) || 0;
    const sel     = dateStr === selectedDate;
    const today   = dateStr === todayStr;

    let cls = 'cal-day-cell in-month';
    if (count)  cls += ' has-matches';
    if (sel)    cls += ' is-selected';
    if (today)  cls += ' is-today';

    const action = count ? `data-action="calendar-date" data-date="${dateStr}"` : '';
    const dot    = count && !sel ? '<div class="cal-day-dot"></div>' : '';

    cells.push(`<div class="${cls}" ${action}>${d}${dot}</div>`);
  }

  return `
    <div class="cal-month-card">
      <div class="cal-month-title">${monthName} <span class="cal-month-year">${year}</span></div>
      <div class="cal-dow-row">
        <span class="cal-dow">Sun</span><span class="cal-dow">Mon</span><span class="cal-dow">Tue</span>
        <span class="cal-dow">Wed</span><span class="cal-dow">Thu</span><span class="cal-dow">Fri</span>
        <span class="cal-dow">Sat</span>
      </div>
      <div class="cal-days-grid">${cells.join('')}</div>
    </div>
  `;
}

export function renderCalendar(opts = {}) {
  if (opts.date)    calendarDate  = opts.date;
  if ('team' in opts) calFilterTeam = opts.team;
  if ('favs' in opts) calFilterFavs  = opts.favs;
  if (opts.clearFilters) { calFilterTeam = ''; calFilterFavs = false; }

  const allMatches = getMatches();
  const filtered   = applyCalFilters(allMatches);

  // Build date→count map from filtered matches
  const matchDateMap = new Map();
  filtered.forEach(m => {
    matchDateMap.set(m.date, (matchDateMap.get(m.date) || 0) + 1);
  });

  // Default selected date: first match date or today
  if (!calendarDate) {
    const firstDate = [...matchDateMap.keys()].sort()[0];
    calendarDate = firstDate || new Date().toISOString().slice(0, 10);
  }

  const matchesForDate = applyCalFilters(getMatchesByDate(calendarDate));
  const selDt = new Date(calendarDate + 'T12:00:00');
  const selectedLabel = selDt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // June 2026 (month index 5) + July 2026 (month index 6)
  const juneGrid = buildMonthGrid(2026, 5, matchDateMap, calendarDate);
  const julyGrid = buildMonthGrid(2026, 6, matchDateMap, calendarDate);

  const allTeams = getTeams();
  const teamOptions = allTeams
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(t => `<option value="${t.name}" ${calFilterTeam === t.name ? 'selected' : ''}>${t.flag} ${displayName(t.name)}</option>`)
    .join('');

  const hasFilter = calFilterTeam || calFilterFavs;

  return makeSection(`
    <div class="glass-card" style="position:sticky;top:53px;z-index:30;">
      <div class="section-header" style="margin-bottom:10px;">
        <h2>Calendar</h2>
        ${hasFilter ? `<button class="cal-clear-btn" data-action="cal-clear-filters">✕ Clear</button>` : ''}
      </div>
      <div class="cal-filter-panel">
        <select id="cal-team-filter" data-action="cal-filter" data-filter="team">
          <option value="">All Teams</option>${teamOptions}
        </select>
        <button class="cal-favs-toggle ${calFilterFavs ? 'active' : ''}" data-action="cal-filter" data-filter="favs">⭐ Favorites</button>
        <button class="cal-ical-btn" data-action="ical-export">📅 iCal</button>
      </div>
    </div>

    <div class="cal-months-grid">
      ${juneGrid}
      ${julyGrid}
    </div>

    <div class="glass-card">
      <div class="cal-selected-header">
        <span>${selectedLabel}</span>
        <span class="cal-selected-badge">${matchesForDate.length} match${matchesForDate.length !== 1 ? 'es' : ''}</span>
      </div>
      <div class="match-grid">
        ${matchesForDate.length
          ? matchesForDate.map(m => matchCardHTML(m, { calendar: true })).join('')
          : `<div class="no-matches">${hasFilter ? 'No matches for this filter on this day.' : 'No matches on this day.'}</div>`
        }
      </div>
    </div>
  `);
}

// ── GOLDEN BOOT RACE ──────────────────────────────────────
export function renderScorers() {
  const medals = ['🥇', '🥈', '🥉'];
  const liveData = getGoldenBoot().slice(0, 15);
  const hasLiveData = liveData.length > 0;

  const tableHTML = hasLiveData
    ? `<div class="gb-live-table">
        <div class="gb-table-header">
          <span class="gbt-rank">#</span>
          <span class="gbt-player">Player</span>
          <span class="gbt-team">Team</span>
          <span class="gbt-goals">Goals</span>
        </div>
        ${liveData.map((p, i) => {
          const cleanN = sanitizeScorerName(p.name);
          const resolved = resolvePlayerFromSquad(cleanN, p.team);
          const dispName = resolved ? resolved.name : cleanN;
          const clickAttr = resolved
            ? `data-action="open-player" data-team="${p.team}" data-player-num="${resolved.number}" style="cursor:pointer"`
            : '';
          return `
          <div class="gb-table-row ${i < 3 ? `gbt-top-${i + 1}` : ''}" ${clickAttr}>
            <span class="gbt-rank">${medals[i] || i + 1}</span>
            <span class="gbt-player-name">${dispName}</span>
            <span class="gbt-team-name">${p.team}</span>
            <span class="gbt-goals-val">${p.goals} ⚽</span>
          </div>`;
        }).join('')}
      </div>`
    : `<div class="gb-watch-note">Live scoring data loads on first sync. Tap Sync Data to refresh.</div>`;

  return makeSection(`
    <div class="glass-card">
      <div class="section-header">
        <h2>Golden Boot Race</h2>
        <span class="gb-contender-badge">${hasLiveData ? `⚽ Top ${liveData.length}` : '⚽ Live'}</span>
      </div>
      ${tableHTML}
    </div>
  `);
}

// ── VENUES LIST ───────────────────────────────────────────
let venueCountryFilter = 'All';

export function renderVenues(country) {
  if (country !== undefined) venueCountryFilter = country;

  const countries = ['All', 'USA 🇺🇸', 'Mexico 🇲🇽', 'Canada 🇨🇦'];
  const countryMap = { 'USA 🇺🇸': 'USA', 'Mexico 🇲🇽': 'Mexico', 'Canada 🇨🇦': 'Canada' };
  const filtered = venueCountryFilter === 'All'
    ? STADIUMS
    : STADIUMS.filter(s => s.country === countryMap[venueCountryFilter]);

  const filterBtns = countries.map(c => `
    <button class="venue-filter-btn ${venueCountryFilter === c ? 'active' : ''}" data-action="venue-country" data-country="${c}">${c}</button>
  `).join('');

  const cards = filtered.map(s => `
    <div class="venue-card" data-action="open-venue" data-id="${s.id}">
      <div class="venue-card-banner" style="background:linear-gradient(135deg,${s.color}cc 0%,${s.color}55 55%,rgba(8,14,32,0.97) 100%);">
        <div class="vcb-top">
          <span class="vcb-flag">${s.flag}</span>
          <span class="vcb-highlight">${s.highlight}</span>
        </div>
        <div class="vcb-name">${s.name}</div>
        <div class="vcb-city">${s.city} · ${s.country}</div>
        <div class="vcb-stats">
          <span>🏟 ${s.capacity.toLocaleString()}</span>
          <span>⚽ ${s.worldCupMatches} matches</span>
          <span>📅 ${s.opened}</span>
        </div>
      </div>
    </div>
  `).join('');

  return makeSection(`
    <div class="glass-card">
      <div class="section-header">
        <h2>Venues</h2>
        <span class="section-badge">${filtered.length} stadiums</span>
      </div>
      <div class="stats-row" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px;">
        <div class="stat-item">
          <div class="stat-value">16</div>
          <div class="stat-label">Stadiums</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">3</div>
          <div class="stat-label">Nations</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">94K</div>
          <div class="stat-label">Max Capacity</div>
        </div>
      </div>
      <div class="venue-filter-bar">${filterBtns}</div>
    </div>
    <div class="venue-grid">${cards}</div>
  `);
}

// ── VENUE DETAIL / VIRTUAL TOUR ────────────────────────────
export function renderVenueDetail(id) {
  const s = STADIUMS.find(st => st.id === Number(id));
  if (!s) {
    return makeSection(`
      <div class="glass-card">
        <button class="btn btn-sm" data-action="nav-back" style="margin-bottom:14px;">← Back</button>
        <div class="empty-state"><div class="empty-state-icon">❌</div><p class="empty-state-text">Venue not found.</p></div>
      </div>
    `);
  }

  // Find matches at this venue
  const venueMatches = getMatches().filter(m => {
    const n = (m.stadium || '').toLowerCase();
    return n.includes(s.name.toLowerCase().slice(0, 8))
        || s.name.toLowerCase().includes(n.slice(0, 8));
  });

  const factsHTML = s.facts.map(f => `
    <div class="venue-fact-item">
      <span class="venue-fact-icon">⚡</span>
      <span>${f}</span>
    </div>
  `).join('');

  const matchesHTML = venueMatches.length ? `
    <div class="glass-card">
      <div class="intel-section-label">Matches at this Venue</div>
      <div class="match-grid">${venueMatches.map(m => matchCardHTML(m, { compact: true })).join('')}</div>
    </div>` : '';

  const mapsBase  = `https://maps.google.com/?q=${s.lat},${s.lng}`;
  const streetView = `https://www.google.com/maps/@${s.lat},${s.lng},3a,90y,0h,85t/data=!3m6!1e1`;
  const embedSrc  = `https://maps.google.com/maps?q=${s.lat},${s.lng}&z=15&output=embed`;

  // Prev / Next navigation
  const idx  = STADIUMS.findIndex(st => st.id === s.id);
  const prev = STADIUMS[idx - 1];
  const next = STADIUMS[idx + 1];
  const prevNext = `
    <div style="display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap;">
      ${prev ? `<button class="btn btn-sm" data-action="open-venue" data-id="${prev.id}">← ${prev.name}</button>` : '<span></span>'}
      ${next ? `<button class="btn btn-sm" data-action="open-venue" data-id="${next.id}">${next.name} →</button>` : '<span></span>'}
    </div>
  `;

  return makeSection(`
    <button class="btn btn-sm" data-action="nav-back" style="margin-bottom:4px;">← Venues</button>

    <!-- Text-based venue hero banner -->
    <div class="venue-detail-banner" style="background:linear-gradient(145deg,${s.color}cc 0%,${s.color}66 40%,rgba(5,10,22,0.98) 100%);">
      <div class="vdb-eyebrow">${s.flag} ${s.country} · FIFA World Cup 2026</div>
      <div class="vdb-name">${s.name}</div>
      <div class="vdb-city">${s.city}</div>
      <div class="vdb-badge">⭐ ${s.highlight}</div>
      <div class="vdb-stats-row">
        <div class="vdb-stat"><span class="vdb-stat-val">${s.capacity.toLocaleString()}</span><span class="vdb-stat-lbl">Capacity</span></div>
        <div class="vdb-stat"><span class="vdb-stat-val">${s.worldCupMatches}</span><span class="vdb-stat-lbl">WC Matches</span></div>
        <div class="vdb-stat"><span class="vdb-stat-val">${s.opened}</span><span class="vdb-stat-lbl">Opened</span></div>
        <div class="vdb-stat"><span class="vdb-stat-val" style="font-size:0.8rem;">${s.surface.split(' ').map(w=>w[0]).join('')}</span><span class="vdb-stat-lbl">Surface</span></div>
      </div>
    </div>

    <!-- Description -->
    <div class="glass-card">
      <div class="intel-section-label">About the Venue</div>
      <p class="venue-description">${s.description}</p>
      ${s.teams ? `<div style="margin-top:12px;font-size:0.8rem;color:var(--text-muted);">🏟️ Home teams: ${s.teams}</div>` : ''}
    </div>

    <!-- Key facts -->
    <div class="glass-card">
      <div class="intel-section-label">Key Facts</div>
      <div class="venue-facts-list">${factsHTML}</div>
    </div>

    <!-- Virtual Tour -->
    <div class="glass-card">
      <div class="intel-section-label">Virtual Tour &amp; Map</div>
      <div class="venue-tour-section">
        <iframe class="venue-map-frame" loading="lazy"
          src="${embedSrc}"
          title="${s.name} map" allowfullscreen referrerpolicy="no-referrer-when-downgrade">
        </iframe>
        <div class="venue-tour-links">
          <a class="venue-tour-btn primary" href="${streetView}" target="_blank" rel="noreferrer">🏟️ Street View Tour</a>
          <a class="venue-tour-btn" href="${mapsBase}" target="_blank" rel="noreferrer">🗺️ Open in Maps</a>
        </div>
      </div>
    </div>

    <!-- Matches at this venue -->
    ${matchesHTML}

    <!-- Prev / Next -->
    ${prevNext}
  `);
}

// ── SETTINGS ──────────────────────────────────────────────
export function renderSettings() {
  const theme = getTheme();
  const tz = getTimezone();
  const ai = isAiEnabled();
  const { lastSync, daysBehind, needsUpdate } = getSyncStatus();

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const tzOptions = TIMEZONES.map(t =>
    `<option value="${t.value}" ${tz === t.value ? 'selected' : ''}>${t.label}</option>`
  ).join('');

  const installSection = isStandalone ? `
    <div class="setting-row">
      <div><div class="setting-label">App Status</div><div class="setting-sub">Running as installed app</div></div>
      <span class="section-badge" style="color:var(--accent-success);">✓ Installed</span>
    </div>` : isIOS ? `
    <div class="setting-row" style="flex-direction:column;align-items:flex-start;gap:12px;">
      <div>
        <div class="setting-label">Install on iPhone / iPad</div>
        <div class="setting-sub">Add CupVerse to your Home Screen for the full app experience</div>
      </div>
      <div class="ios-steps">
        <div class="ios-step"><span class="ios-step-num">1</span> Tap the <strong>Share</strong> button in Safari (the square with an arrow)</div>
        <div class="ios-step"><span class="ios-step-num">2</span> Scroll down and tap <strong>"Add to Home Screen"</strong></div>
        <div class="ios-step"><span class="ios-step-num">3</span> Tap <strong>"Add"</strong> — CupVerse will appear on your home screen</div>
      </div>
    </div>` : `
    <div class="setting-row">
      <div><div class="setting-label">Install App</div><div class="setting-sub">Add CupVerse to your home screen</div></div>
      <button class="btn btn-primary btn-sm" data-action="install-pwa">Install</button>
    </div>`;

  return makeSection(`
    <div class="glass-card">
      <div class="section-header"><h2>Settings</h2></div>
      <div class="settings-group">
        ${installSection}
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
            <div class="setting-label">Data Sync</div>
            <div class="setting-sub">Last updated: ${formatSyncDate(lastSync)}</div>
            ${needsUpdate && daysBehind !== null ? `<div class="setting-sub" style="color:var(--accent-cyan);margin-top:2px;">⟳ ${daysBehind} day${daysBehind !== 1 ? 's' : ''} of updates available</div>` : ''}
          </div>
          <button class="btn btn-sm ${needsUpdate ? 'btn-primary' : ''}" data-action="refresh-data">
            ${needsUpdate ? 'Update Now' : 'Refresh'}
          </button>
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
          <span class="text-muted">CupVerse v2.4.4</span>
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

    <div class="glass-card">
      <div class="section-header"><h2>Credits</h2></div>
      <p class="text-muted" style="font-size:0.88rem;line-height:1.7;margin-bottom:14px;">
        For feedback, bug reports, or feature suggestions, please visit
        <a href="https://github.com/nafeesmansoor" target="_blank" rel="noreferrer" style="color:var(--accent-blue);font-weight:600;">🐙 GitHub</a>
        or
        <a href="https://nafees.info" target="_blank" rel="noreferrer" style="color:var(--accent-blue);font-weight:600;">nafees.info</a>
      </p>
      <p class="text-muted" style="font-size:0.84rem;line-height:1.65;">
        Built with ❤️ as an offline-first Progressive Web App (PWA). No backend. No tracking. Privacy-first by design.
      </p>
    </div>
  `);
}

// ── STANDINGS — Visual Group Cards ────────────────────────
export function renderStandings() {
  const storedScores = getAllScores();
  const standings = getGroupStandings(storedScores);
  const groups = Object.keys(standings).sort();

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

  const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣'];
  // Base qualification chances; shift up if a team has points on the board
  const baseChances = [95, 82, 30, 4];

  const groupCards = groups.map(g => {
    const teams = standings[g];
    const color = groupColor(g);
    const maxPts = teams[0]?.pts ?? 0;

    const teamRows = teams.map((team, i) => {
      const gd = team.gf - team.ga;
      const gdStr = gd > 0 ? `+${gd}` : String(gd);
      const record = `${team.w}W ${team.d}D ${team.l}L`;
      const qualifyClass = i < 2 ? `qualify-${i + 1}` : i === 2 ? 'qualify-3' : '';
      const chance = baseChances[i] ?? 2;
      return `
        <div class="gvc-team-row ${qualifyClass}">
          <span class="gvc-medal">${MEDALS[i] || `${i + 1}`}</span>
          <span class="gvc-flag">${team.flag}</span>
          <span class="gvc-name">${team.name}</span>
          <span class="gvc-record">${record} · GD ${gdStr}</span>
          <span class="gvc-pts">${team.pts}pts</span>
        </div>
      `;
    }).join('');

    // Simulate top team's advance chance based on points earned
    const leader = teams[0];
    let advanceChance = 95;
    if (leader) {
      if (leader.pts >= 7)      advanceChance = 99;
      else if (leader.pts >= 6) advanceChance = 97;
      else if (leader.pts >= 4) advanceChance = 88;
      else if (leader.pts >= 3) advanceChance = 72;
      else if (leader.pts >= 1) advanceChance = 55;
    }

    return `
      <div class="glass-card">
        <div class="stage-group-header">
          <div class="group-dot" style="background:${color}"></div>
          <h3>Group ${g}</h3>
          <span class="section-badge">${teams.length} teams</span>
        </div>
        <div class="gvc-body">${teamRows}</div>
        <div class="qual-simulator">
          <span class="qs-label">🟢 Top 2 advance to Round of 32</span>
          <span class="qs-val">Leader: ${advanceChance}%</span>
        </div>
      </div>
    `;
  }).join('');

  return makeSection(`
    <div class="standings-top-bar">
      <div class="standings-legend">
        <div class="legend-item">
          <span class="legend-dot" style="background:var(--accent-success)"></span>
          Qualifies to Round of 32
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background:var(--accent-gold)"></span>
          Potential best 3rd-place
        </div>
      </div>
      <button class="standings-pred-btn" data-action="go-prediction-tree">🏆 View Prediction Tree</button>
    </div>
    <div class="standings-groups-grid">${groupCards}</div>
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
