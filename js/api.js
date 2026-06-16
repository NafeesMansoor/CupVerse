import { getMatches } from './data.js';
import { setScore, setApiScorers, setGoldenBoot } from './storage.js';

const API_BASE = 'https://worldcup26.ir';

// worldcup26.ir uses different team names than the local data.
// Keys are the normalised API name; values are the normalised local name.
const TEAM_ALIASES = {
  'south korea':   'korea republic',
  'czech republic':'czechia',
  'united states': 'usa',
  'ivory coast':   'cote dvoire',   // local "Cote D'Voire" normalises to "cote dvoire"
  'cape verde':    'cabo verde',
  'turkey':        'turkiye',        // local "Türkiye" NFD-normalises to "turkiye"
};

// Strip accents + punctuation, lowercase — used to match API names to local names.
function normTeam(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // ü→u, ç→c, etc.
    .replace(/[^a-z0-9\s]/g, '')                      // drop apostrophes, hyphens
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveTeam(apiName) {
  const n = normTeam(apiName);
  return TEAM_ALIASES[n] || n;
}

function parseScorers(raw) {
  if (!raw || raw === 'null') return [];
  const inner = raw.replace(/^\{|\}$/g, '').trim();
  if (!inner || inner.toLowerCase() === 'null') return [];
  return inner
    .split(',')
    .map(s => s.replace(/["'''‚‛""„‟‹›«»]/g, '').trim())
    .filter(s => s && s.toLowerCase() !== 'null');
}

// Produce a clean player name from the raw API scorer string.
// The worldcup26.ir API returns strings in inconsistent formats, e.g.:
//   "A. Diallo 90"        – name + bare minute (no apostrophe)
//   "Breel Embolo 17 (p)" – name + minute + penalty marker
//   "B. Khoukhi Qatar"    – name + embedded team name
//   "Mbappe 45'"          – name + minute with apostrophe
//   "10 Mbappe"           – jersey number + name
function cleanScorerName(raw, teamNames) {
  // Step 0: strip ALL quote variants (API sometimes wraps names in quotes)
  let s = raw.replace(/["'''‚‛""„‟‹›«»]/g, '').trim();

  // Step 0b: strip Arabic/Persian script — worldcup26.ir returns Farsi names for
  // Iranian players (e.g. "تارمی 23" or "Taremi تارمی 23"); keep only Latin chars.
  s = s.replace(/[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]+/g, '').trim();
  // If nothing remains, or only a bare minute number remains (pure-Farsi entry), skip.
  if (!s || /^\d+$/.test(s)) return '';

  // 1. Strip embedded team name at end (case-insensitive match handles API inconsistencies)
  if (teamNames) {
    const sLow = s.toLowerCase();
    for (const team of teamNames) {
      if (!team) continue;
      const suffix = ' ' + team.trim();
      if (s.endsWith(suffix) || sLow.endsWith(suffix.toLowerCase())) {
        s = s.slice(0, -(suffix.length)).trim();
        break;
      }
    }
  }

  return s
    // 2. Leading jersey number "10 Mbappe" → "Mbappe"
    .replace(/^\d+\s+/, '')
    // 3. Trailing minute with optional stoppage time, apostrophe, and markers
    //    handles: "90", "45'", "90+3'", "17 (p)", "45 (OG)", "90+2' (p)", "9"
    .replace(/\s+\d+(?:\+\d+)?['′]?(?:\s*\([^)]+\))*\s*$/, '')
    // 4. Standalone OG/penalty markers
    .replace(/\(\s*OG\s*\)/gi, '')
    .replace(/\(\s*p(?:en)?\s*\)/gi, '')
    // 5. Final safety net — catches any trailing digits the regex above missed
    .replace(/\s+\d+$/, '')
    .trim();
}

export async function fetchLiveGames() {
  const res = await fetch(`${API_BASE}/get/games`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`worldcup26.ir API returned ${res.status}`);
  const data = await res.json();
  return (data.games || []).map(g => ({
    id: String(g.id),
    homeScore: Number(g.home_score),
    awayScore: Number(g.away_score),
    homeScorers: parseScorers(g.home_scorers),
    awayScorers: parseScorers(g.away_scorers),
    homeTeamName: g.home_team_name_en || '',
    awayTeamName: g.away_team_name_en || '',
    finished: g.finished === 'TRUE',
    timeElapsed: g.time_elapsed || 'notstarted',
  }));
}

// Write scores + scorers to localStorage for finished matches, and compute golden boot.
// Matches API games to local matches by team name (not by id) because the API's internal
// numbering diverges from the local match ids from game 13 onwards.
export async function applyApiScores() {
  const games = await fetchLiveGames();
  const goalMap = {};

  // Build a lookup: "normalisedHome|normalisedAway" → local match id
  const localMatches = getMatches();
  const localById = new Map();
  localMatches.forEach(m => {
    const key = `${normTeam(m.homeTeam.name)}|${normTeam(m.awayTeam.name)}`;
    localById.set(key, m.id);
  });

  // Collect all API team names for cleanScorerName's embedded-team-name stripping
  const teamNames = new Set(
    games.flatMap(g => [g.homeTeamName, g.awayTeamName]).filter(Boolean).map(t => t.trim())
  );

  games.forEach(g => {
    if (!g.finished) return;

    // Resolve local match id by team names, not by API id
    const lookupKey = `${resolveTeam(g.homeTeamName)}|${resolveTeam(g.awayTeamName)}`;
    const localId = localById.get(lookupKey);
    if (!localId) return; // unrecognised match — skip

    setScore(localId, g.homeScore, g.awayScore);

    const cleanHome = g.homeScorers.map(s => cleanScorerName(s, teamNames)).filter(Boolean);
    const cleanAway = g.awayScorers.map(s => cleanScorerName(s, teamNames)).filter(Boolean);
    setApiScorers(localId, cleanHome, cleanAway);

    const tally = (names, teamName) => {
      names.forEach(name => {
        if (!goalMap[name]) goalMap[name] = { name, team: teamName, goals: 0 };
        goalMap[name].goals++;
      });
    };
    tally(cleanHome, g.homeTeamName);
    tally(cleanAway, g.awayTeamName);
  });

  const boot = Object.values(goalMap)
    .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));
  setGoldenBoot(boot);

  return { updated: games.filter(g => g.finished).length, total: games.length };
}
