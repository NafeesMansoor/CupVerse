const API_BASE = 'https://worldcup26.ir';

function parseScorers(raw) {
  if (!raw || raw === 'null') return [];
  const inner = raw.replace(/^\{|\}$/g, '').trim();
  if (!inner || inner.toLowerCase() === 'null') return [];
  return inner
    .split(',')
    .map(s => s.replace(/["'‘’‚‛“”„‟‹›«»]/g, '').trim())
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

import { setScore, setApiScorers, setGoldenBoot } from './storage.js';

// Write scores + scorers to localStorage for finished matches, and compute golden boot.
export async function applyApiScores() {
  const games = await fetchLiveGames();
  const goalMap = {};

  // Collect all team names so cleanScorerName can strip embedded ones; trim to avoid whitespace mismatches
  const teamNames = new Set(
    games.flatMap(g => [g.homeTeamName, g.awayTeamName]).filter(Boolean).map(t => t.trim())
  );

  games.forEach(g => {
    if (!g.finished) return;

    setScore(g.id, g.homeScore, g.awayScore);

    // Clean names once; use the same cleaned list for both storage and the leaderboard
    const cleanHome = g.homeScorers.map(s => cleanScorerName(s, teamNames)).filter(Boolean);
    const cleanAway = g.awayScorers.map(s => cleanScorerName(s, teamNames)).filter(Boolean);
    setApiScorers(g.id, cleanHome, cleanAway);

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
