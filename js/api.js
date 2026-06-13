const API_BASE = 'https://worldcup26.ir';

function parseScorers(raw) {
  if (!raw || raw === 'null') return [];
  const inner = raw.replace(/^\{|\}$/g, '').trim();
  if (!inner || inner.toLowerCase() === 'null') return [];
  return inner
    .split(',')
    .map(s => s.replace(/[“”‘’""'']/g, '').trim())
    .filter(s => s && s.toLowerCase() !== 'null');
}

// Strip minute suffix from scorer string → clean player name
function cleanScorerName(raw) {
  return raw.replace(/\s+\d+['′+].*$/, '').replace(/\(OG\)/, '').trim();
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

  games.forEach(g => {
    if (!g.finished) return;

    setScore(g.id, g.homeScore, g.awayScore);
    setApiScorers(g.id, g.homeScorers, g.awayScorers);

    const tally = (scorers, teamName) => {
      scorers.forEach(raw => {
        const name = cleanScorerName(raw);
        if (!name) return;
        if (!goalMap[name]) goalMap[name] = { name, team: teamName, goals: 0 };
        goalMap[name].goals++;
      });
    };
    tally(g.homeScorers, g.homeTeamName);
    tally(g.awayScorers, g.awayTeamName);
  });

  const boot = Object.values(goalMap).sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));
  setGoldenBoot(boot);

  return { updated: games.filter(g => g.finished).length, total: games.length };
}
