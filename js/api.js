const API_BASE = 'https://worldcup26.ir';

// Handles {" Scorer 45'"," Scorer2 67'"} format with curly/straight quotes
function parseScorers(raw) {
  if (!raw || raw === 'null') return [];
  const inner = raw.replace(/^\{|\}$/g, '').trim();
  if (!inner || inner.toLowerCase() === 'null') return [];
  return inner
    .split(',')
    .map(s => s.replace(/[“”‘’""]/g, '').trim())
    .filter(s => s && s.toLowerCase() !== 'null');
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
    finished: g.finished === 'TRUE',
    timeElapsed: g.time_elapsed || 'notstarted',
  }));
}

import { setScore, setApiScorers } from './storage.js';

// Write scores + scorers to localStorage for every game the API marks as finished.
// Returns { updated: number } — count of matches written.
export async function applyApiScores() {
  const games = await fetchLiveGames();
  let updated = 0;
  games.forEach(g => {
    if (g.finished) {
      setScore(g.id, g.homeScore, g.awayScore);
      setApiScorers(g.id, g.homeScorers, g.awayScorers);
      updated++;
    }
  });
  return { updated, total: games.length };
}
