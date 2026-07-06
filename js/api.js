import { getMatches, invalidateCache } from './data.js';
import { setScore, setApiScorers, setGoldenBoot, setStoredWinner, getStoredWinners, getGoldenBoot } from './storage.js';
import { getSquad } from './squad.js';

const API_BASE = 'https://worldcup26.ir';

// worldcup26.ir uses different team names than the local data.
// Keys are the normalised API name; values are the normalised local name.
const TEAM_ALIASES = {
  'south korea':                      'korea republic',
  'czech republic':                   'czechia',
  'united states':                    'usa',
  'ivory coast':                      'cote dvoire',   // local "Cote D'Voire" normalises to "cote dvoire"
  'cape verde':                       'cabo verde',
  'turkey':                           'turkiye',        // local "Türkiye" NFD-normalises to "turkiye"
  'democratic republic of the congo': 'dr congo',       // API uses full name; local uses "DR Congo"
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

// ── Player name normaliser (for squad index keys) ─────────────────────────────
function normPlayerName(n) {
  return (n || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Squad lookup index ────────────────────────────────────────────────────────
// Builds two maps for a team's squad so scorer names from the API can be
// resolved to their proper full names:
//   byLastFirst  "lastname_firstinitial" → full name  (handles "A. Diallo")
//   byLast       "lastname"              → full name  (handles bare "Mbappe")
//   byJersey     jersey number           → full name  (handles "10 Mbappe")
function buildSquadLookup(teamName) {
  const players = getSquad(teamName);
  const byLastFirst = new Map();
  const byLast      = new Map();
  const byJersey    = new Map();

  players.forEach(p => {
    const parts = normPlayerName(p.name).split(' ').filter(Boolean);
    if (!parts.length) return;
    const last    = parts[parts.length - 1];
    const initial = parts[0][0] || '';
    const lfKey   = `${last}_${initial}`;
    if (!byLastFirst.has(lfKey)) byLastFirst.set(lfKey, p.name);
    if (!byLast.has(last))       byLast.set(last, p.name);
    if (p.number != null)        byJersey.set(Number(p.number), p.name);
  });

  return { byLastFirst, byLast, byJersey };
}

// ── Resolve a cleaned scorer name to the squad's canonical full name ──────────
// Strategy (in order):
//   1. Jersey number extracted from the raw API string prefix ("10 Mbappe")
//   2. Last name + first initial              ("A. Diallo" → "Abdoulaye Diallo")
//   3. Single last name only                 ("Mbappe"    → "Kylian Mbappé")
// Returns the cleaned name unchanged when no squad match is found.
function resolvePlayerName(cleaned, raw, lookup) {
  if (!lookup || !cleaned) return cleaned;

  // 1. jersey prefix in raw
  const jerseyM = (raw || '').match(/^(\d{1,2})\s+\S/);
  if (jerseyM) {
    const num = Number(jerseyM[1]);
    if (lookup.byJersey.has(num)) return lookup.byJersey.get(num);
  }

  const parts = normPlayerName(cleaned).split(' ').filter(Boolean);
  if (!parts.length) return cleaned;

  const last    = parts[parts.length - 1];
  const initial = parts[0][0] || '';

  // 2. last + first initial (works for both "A. Diallo" and "Antoine Diallo")
  const lfKey = `${last}_${initial}`;
  if (lookup.byLastFirst.has(lfKey)) return lookup.byLastFirst.get(lfKey);

  // 3. bare last name only
  if (lookup.byLast.has(last)) return lookup.byLast.get(last);

  return cleaned;
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

// worldcup26.ir sometimes returns wrong/garbled scorer names or misattributes own goals.
// Verified against ESPN's official goal data — keyed by local match id, replaces the
// cleaned scorer list entirely for that side.
const SCORER_OVERRIDES = {
  8:  { home: ['Miro Muheim (OG)'], away: ['Breel Embolo'] },               // Qatar vs Switzerland
  11: { away: ['Keito Nakamura', 'Daichi Kamada'] },                       // Netherlands vs Japan
  13: { home: ['Abdulelah Al-Amri'], away: ['Maxi Araújo'] },              // Saudi Arabia vs Uruguay
  15: { home: ['Ramin Rezaeian', 'Mohammad Mohebbi'], away: ['Elijah Just', 'Elijah Just'] }, // Iran vs New Zealand
  16: { home: ['Mohamed Hany (OG)'] },                                    // Belgium vs Egypt
};

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

  // Build a lookup: "normalisedHome|normalisedAway" → local match object
  const localMatches = getMatches();
  const localByKey = new Map();
  localMatches.forEach(m => {
    const key = `${normTeam(m.homeTeam.name)}|${normTeam(m.awayTeam.name)}`;
    localByKey.set(key, m);
  });

  // Collect all API team names for cleanScorerName's embedded-team-name stripping
  const teamNames = new Set(
    games.flatMap(g => [g.homeTeamName, g.awayTeamName]).filter(Boolean).map(t => t.trim())
  );

  games.forEach(g => {
    if (!g.finished) return;

    // Resolve local match by team names, not by API id
    const lookupKey = `${resolveTeam(g.homeTeamName)}|${resolveTeam(g.awayTeamName)}`;
    const localMatch = localByKey.get(lookupKey);
    if (!localMatch) return; // unrecognised match — skip
    const localId = localMatch.id;

    // Build squad lookups for this match so scorer names can be resolved to
    // proper full names (e.g. "A. Diallo" → "Abdoulaye Diallo", "10 Mbappe" → "Kylian Mbappé")
    const homeLookup = buildSquadLookup(localMatch.homeTeam.name);
    const awayLookup = buildSquadLookup(localMatch.awayTeam.name);

    const resolveHome = (raw) => {
      const cleaned = cleanScorerName(raw, teamNames);
      return cleaned ? resolvePlayerName(cleaned, raw, homeLookup) : '';
    };
    const resolveAway = (raw) => {
      const cleaned = cleanScorerName(raw, teamNames);
      return cleaned ? resolvePlayerName(cleaned, raw, awayLookup) : '';
    };

    setScore(localId, g.homeScore, g.awayScore);

    // Derive and store the knockout winner so resolveBracket() can propagate
    // the team name into downstream rounds (QF, SF, Final).
    // Skip tied scores — PKS winners need manual JSON entry since the API
    // only returns the score through extra time, not the shootout result.
    const KO_TYPES = new Set(['r32', 'r16', 'qf', 'sf', 'third', 'final']);
    if (KO_TYPES.has(g.type) && g.homeScore !== g.awayScore) {
      const storedWinners = getStoredWinners();
      if (!storedWinners[localId]) {
        const winner = g.homeScore > g.awayScore
          ? localMatch.homeTeam.name
          : localMatch.awayTeam.name;
        setStoredWinner(localId, winner);
        invalidateCache(); // rebuild bracket so downstream rounds resolve immediately
      }
    }

    const override = SCORER_OVERRIDES[localId];
    const cleanHome = override?.home || g.homeScorers.map(resolveHome).filter(Boolean);
    const cleanAway = override?.away || g.awayScorers.map(resolveAway).filter(Boolean);
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

  // Merge API-computed goals into the manually curated JSON-seeded list.
  // JSON list is authoritative floor; API can only raise a player's count.
  const merged = {};
  getGoldenBoot().forEach(p => { merged[p.name] = { ...p }; });
  Object.values(goalMap).forEach(p => {
    if (!merged[p.name] || p.goals > merged[p.name].goals) merged[p.name] = p;
  });
  const boot = Object.values(merged)
    .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));
  if (boot.length) setGoldenBoot(boot);

  const newWinners = Object.keys(getStoredWinners()).length;
  return { updated: games.filter(g => g.finished).length, total: games.length, newWinners };
}
