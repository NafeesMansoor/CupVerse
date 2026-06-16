import { getAllScores } from './storage.js';

const DATA_URL = './world_cup_data.json';

const TEAM_META = {
  'Mexico':                 { flag: '🇲🇽', code: 'MEX' },
  'South Africa':           { flag: '🇿🇦', code: 'RSA' },
  'Korea Republic':         { flag: '🇰🇷', code: 'KOR' },
  'Czechia':                { flag: '🇨🇿', code: 'CZE' },
  'Canada':                 { flag: '🇨🇦', code: 'CAN' },
  'Bosnia and Herzegovina': { flag: '🇧🇦', code: 'BIH' },
  'Qatar':                  { flag: '🇶🇦', code: 'QAT' },
  'Switzerland':            { flag: '🇨🇭', code: 'SUI' },
  'Brazil':                 { flag: '🇧🇷', code: 'BRA' },
  'Morocco':                { flag: '🇲🇦', code: 'MAR' },
  'Haiti':                  { flag: '🇭🇹', code: 'HAI' },
  'Scotland':               { flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', code: 'SCO' },
  'USA':                    { flag: '🇺🇸', code: 'USA' },
  'Paraguay':               { flag: '🇵🇾', code: 'PAR' },
  'Australia':              { flag: '🇦🇺', code: 'AUS' },
  'Türkiye':                { flag: '🇹🇷', code: 'TUR' },
  'Germany':                { flag: '🇩🇪', code: 'GER' },
  'Curacao':                { flag: '🇨🇼', code: 'CUW' },
  "Cote D'Voire":           { flag: '🇨🇮', code: 'CIV' },
  'Ecuador':                { flag: '🇪🇨', code: 'ECU' },
  'Netherlands':            { flag: '🇳🇱', code: 'NED' },
  'Japan':                  { flag: '🇯🇵', code: 'JPN' },
  'Sweden':                 { flag: '🇸🇪', code: 'SWE' },
  'Tunisia':                { flag: '🇹🇳', code: 'TUN' },
  'Belgium':                { flag: '🇧🇪', code: 'BEL' },
  'Egypt':                  { flag: '🇪🇬', code: 'EGY' },
  'Iran':                   { flag: '🇮🇷', code: 'IRN' },
  'New Zealand':            { flag: '🇳🇿', code: 'NZL' },
  'Spain':                  { flag: '🇪🇸', code: 'ESP' },
  'Cabo Verde':             { flag: '🇨🇻', code: 'CPV' },
  'Saudi Arabia':           { flag: '🇸🇦', code: 'KSA' },
  'Uruguay':                { flag: '🇺🇾', code: 'URU' },
  'France':                 { flag: '🇫🇷', code: 'FRA' },
  'Senegal':                { flag: '🇸🇳', code: 'SEN' },
  'Iraq':                   { flag: '🇮🇶', code: 'IRQ' },
  'Norway':                 { flag: '🇳🇴', code: 'NOR' },
  'Argentina':              { flag: '🇦🇷', code: 'ARG' },
  'Algeria':                { flag: '🇩🇿', code: 'ALG' },
  'Austria':                { flag: '🇦🇹', code: 'AUT' },
  'Jordan':                 { flag: '🇯🇴', code: 'JOR' },
  'Portugal':               { flag: '🇵🇹', code: 'POR' },
  'DR Congo':               { flag: '🇨🇩', code: 'COD' },
  'Uzbekistan':             { flag: '🇺🇿', code: 'UZB' },
  'Colombia':               { flag: '🇨🇴', code: 'COL' },
  'England':                { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', code: 'ENG' },
  'Croatia':                { flag: '🇭🇷', code: 'CRO' },
  'Ghana':                  { flag: '🇬🇭', code: 'GHA' },
  'Panama':                 { flag: '🇵🇦', code: 'PAN' },
};

let rawTeams = [];
let rawMatches = [];
let rawPlayers = {};
let loaded = false;

function teamMeta(name) {
  return TEAM_META[name] || { flag: '🏳️', code: name.slice(0, 3).toUpperCase() };
}

// Resolve match status from the clock.  If we have a stored API score for this
// match (only written when worldcup26.ir returns finished=TRUE), trust that over
// the 2-hour live window so the match shows "completed" immediately after the
// final whistle rather than staying "live" until the clock ticks past 2 h.
function resolveStatus(datetimeStr, matchId) {
  const matchTime = new Date(datetimeStr);
  const now = new Date();
  const diffMs = matchTime - now;
  if (diffMs > 0) return 'upcoming';
  if (diffMs > -10800000) {
    // Within 3 h of kickoff — only keep "live" if the API hasn't confirmed finish.
    // 3 h covers 90 min play + stoppage + any delay before worldcup26.ir marks finished.
    const scores = getAllScores();
    if (scores[String(matchId)]) return 'completed';
    return 'live';
  }
  return 'completed';
}

function enrichMatch(raw) {
  if (!raw.homeTeam || !raw.awayTeam || !raw.datetime) return null;
  const meta = teamMeta(raw.homeTeam);
  const awayMeta = teamMeta(raw.awayTeam);
  const venueInfo = raw.venueInfo || {};
  const venueName = venueInfo.name || (raw.venue ? raw.venue.split(',')[0].trim() : 'TBD');
  return {
    id: String(raw.id),
    group: raw.group || null,
    stage: raw.stage || 'Unknown',
    datetime: raw.datetime,
    date: raw.datetime.slice(0, 10),
    time: raw.datetime.slice(11, 16),
    venue: raw.venue || '',
    venueInfo: {
      name: venueName,
      fullName: venueInfo.fullName || venueName,
      city: venueInfo.city || '',
      country: venueInfo.country || '',
      flag: venueInfo.flag || '',
      capacity: venueInfo.capacity || null,
      surface: venueInfo.surface || 'Natural Grass',
      opened: venueInfo.opened || null,
    },
    stadium: venueName,
    homeTeam: { name: raw.homeTeam, flag: meta.flag, code: meta.code },
    awayTeam: { name: raw.awayTeam, flag: awayMeta.flag, code: awayMeta.code },
    status: resolveStatus(raw.datetime, raw.id),
    score: null,
    goals: [],
    potm: null,
  };
}

export async function loadMatches(forceReload = false) {
  const fetchOptions = forceReload ? { cache: 'reload' } : {};
  try {
    const response = await fetch(DATA_URL, fetchOptions);
    if (!response.ok) throw new Error('Data unavailable');
    const data = await response.json();
    rawTeams = data.teams || [];
    rawMatches = data.matches || [];
    rawPlayers = data.players || {};
    loaded = true;
  } catch (err) {
    console.warn('Failed to load data from network', err);
    if (!loaded) {
      try {
        const cached = await caches.match(DATA_URL);
        if (cached) {
          const data = await cached.json();
          rawTeams = data.teams || [];
          rawMatches = data.matches || [];
          rawPlayers = data.players || {};
          loaded = true;
        }
      } catch (_) { /* no cache either */ }
    }
  }
}

export function getMatches() {
  return rawMatches.map(enrichMatch).filter(Boolean);
}

export function getMatchById(id) {
  const raw = rawMatches.find(m => String(m.id) === String(id));
  return raw ? enrichMatch(raw) : null;
}

export function getNextMatch() {
  const now = new Date();
  const upcoming = rawMatches
    .map(enrichMatch)
    .filter(Boolean)
    .filter(m => new Date(m.datetime) > now)
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  return upcoming[0] || null;
}

export function getTodaysMatches() {
  const today = new Date().toISOString().slice(0, 10);
  return rawMatches
    .filter(m => m.datetime && m.datetime.slice(0, 10) === today)
    .map(enrichMatch)
    .filter(Boolean);
}

export function getMatchesByDate(dateStr) {
  return rawMatches
    .filter(m => m.datetime && m.datetime.slice(0, 10) === dateStr)
    .map(enrichMatch)
    .filter(Boolean)
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
}

export function getAllMatchDates() {
  const dates = new Set(rawMatches.filter(m => m.datetime).map(m => m.datetime.slice(0, 10)));
  return Array.from(dates).sort();
}

export function getTournamentStats() {
  const validMatches = rawMatches.filter(m => m.datetime && m.homeTeam && m.awayTeam);
  const total = validMatches.length;
  const now = new Date();
  const played = validMatches.filter(m => new Date(m.datetime) < now - 7200000).length;
  const upcoming = total - played;
  const remainingDays = Math.max(0, Math.ceil((new Date('2026-07-19') - now) / 86400000));
  return { totalMatches: total, played, upcoming, remainingDays, progress: Math.round((played / total) * 100) };
}

export function getTeams() {
  return rawTeams.map(t => ({
    ...t,
    flag: (TEAM_META[t.name] || {}).flag || '🏳️',
    code: (TEAM_META[t.name] || {}).code || t.name.slice(0, 3).toUpperCase(),
  }));
}

export function getTeamSquad(teamName) {
  return rawPlayers[teamName] || [];
}

export function getTeamNextMatch(teamName) {
  const now = new Date();
  return rawMatches
    .filter(m => m.datetime && (m.homeTeam === teamName || m.awayTeam === teamName) && new Date(m.datetime) > now)
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
    .map(enrichMatch)
    .filter(Boolean)[0] || null;
}

export function getGroupStandings(storedScores = {}) {
  // Build per-group team records
  const groups = {};
  rawTeams.forEach(t => {
    if (!t.group) return;
    const meta = teamMeta(t.name);
    if (!groups[t.group]) groups[t.group] = {};
    groups[t.group][t.name] = {
      name: t.name,
      flag: meta.flag,
      code: meta.code,
      mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0,
    };
  });

  // Process completed group-stage matches
  rawMatches
    .filter(m => m.group && m.homeTeam && m.awayTeam && m.datetime)
    .forEach(raw => {
      const g = raw.group;
      if (!groups[g]) return;

      const storedScore = storedScores[String(raw.id)];
      const score = storedScore || raw.score;
      if (!score) return;

      const hg = Number(score.home ?? score.homeScore ?? 0);
      const ag = Number(score.away ?? score.awayScore ?? 0);
      const hName = raw.homeTeam;
      const aName = raw.awayTeam;
      if (!groups[g][hName] || !groups[g][aName]) return;

      groups[g][hName].mp++;
      groups[g][hName].gf += hg;
      groups[g][hName].ga += ag;
      groups[g][aName].mp++;
      groups[g][aName].gf += ag;
      groups[g][aName].ga += hg;

      if (hg > ag) {
        groups[g][hName].w++;  groups[g][hName].pts += 3;
        groups[g][aName].l++;
      } else if (ag > hg) {
        groups[g][aName].w++;  groups[g][aName].pts += 3;
        groups[g][hName].l++;
      } else {
        groups[g][hName].d++;  groups[g][hName].pts++;
        groups[g][aName].d++;  groups[g][aName].pts++;
      }
    });

  // Sort each group: Pts → GD → GF → name
  const result = {};
  Object.keys(groups).sort().forEach(g => {
    result[g] = Object.values(groups[g]).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      const gdA = a.gf - a.ga, gdB = b.gf - b.ga;
      if (gdB !== gdA) return gdB - gdA;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.name.localeCompare(b.name);
    });
  });
  return result;
}
