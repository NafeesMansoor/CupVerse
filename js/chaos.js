import { getMatches, getGroupStandings, getTeams } from './data.js';
import { getAllScores } from './storage.js';
import { buildBracket } from './prediction.js';

// ── Team strength (0–100) based on FIFA/World Cup reputation ──
const STRENGTH = {
  'France':                 88, 'Brazil':                 87,
  'Argentina':              86, 'Spain':                  85,
  'England':                83, 'Germany':                82,
  'Portugal':               80, 'Netherlands':            79,
  'Belgium':                77, 'Uruguay':                75,
  'Colombia':               73, 'USA':                    71,
  'Mexico':                 70, 'Japan':                  69,
  'Morocco':                68, 'Senegal':                67,
  'Croatia':                66, 'Switzerland':            65,
  'Sweden':                 64, 'Norway':                 63,
  'Austria':                62, 'Ecuador':                61,
  'Türkiye':                60, "Cote D'Voire":           59,
  'Korea Republic':         58, 'Iran':                   57,
  'Australia':              56, 'Canada':                 55,
  'Saudi Arabia':           54, 'Bosnia and Herzegovina': 53,
  'Uzbekistan':             52, 'Tunisia':                51,
  'Egypt':                  50, 'Algeria':                49,
  'Paraguay':               48, 'South Africa':           47,
  'DR Congo':               46, 'Ghana':                  45,
  'Scotland':               44, 'Iraq':                   43,
  'Jordan':                 42, 'Panama':                 41,
  'Cabo Verde':             39, 'New Zealand':            38,
  'Curacao':                36, 'Qatar':                  35,
  'Haiti':                  32,
};

// ── Chaos Index (0–100) — higher = more unpredictable ────────
const CHAOS_INDEX = {
  'Spain':                  28, 'Germany':                34,
  'France':                 36, 'Brazil':                 48,
  'Portugal':               45, 'Netherlands':            52,
  'Argentina':              55, 'Belgium':                58,
  'England':                62, 'Croatia':                60,
  'Uruguay':                61, 'Colombia':               64,
  'USA':                    70, 'Mexico':                 68,
  'Japan':                  73, 'Morocco':                76,
  'Senegal':                66, 'Australia':              69,
  'Korea Republic':         65, 'Ecuador':                67,
  'Switzerland':            42, 'Austria':                55,
  'Sweden':                 50, 'Norway':                 57,
  'Türkiye':                72, "Cote D'Voire":           74,
  'Cabo Verde':             82, 'South Africa':           71,
  'Bolivia':                78, 'Qatar':                  80,
  'Haiti':                  85, 'New Zealand':            79,
  'Curacao':                83, 'Iraq':                   75,
  'Jordan':                 77, 'Panama':                 68,
  'DR Congo':               73, 'Ghana':                  70,
  'Algeria':                65, 'Tunisia':                64,
  'Canada':                 61, 'Saudi Arabia':           69,
  'Iran':                   67, 'Scotland':               63,
  'Uzbekistan':             72, 'Paraguay':               66,
  'Egypt':                  64, 'Bosnia and Herzegovina': 60,
};

function teamStrength(name) { return STRENGTH[name] || 48; }
export function getChaosIndex(name) { return CHAOS_INDEX[name] || 60; }

// ── Seeded PRNG (mulberry32) for deterministic chaos paths ───
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Use today's date as seed so Chaos path refreshes daily
function todaySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

// ── Match win probability (home perspective) ─────────────────
function winProb(homeTeam, awayTeam, chaosLevel = 0) {
  const hs = teamStrength(homeTeam?.name || '');
  const as = teamStrength(awayTeam?.name || '');
  const total = hs + as || 1;
  let base = hs / total;

  if (chaosLevel > 0) {
    const hc = getChaosIndex(homeTeam?.name || '') / 100;
    const ac = getChaosIndex(awayTeam?.name || '') / 100;
    const chaos = ((hc + ac) / 2) * chaosLevel;
    // Chaos nudges probability toward 0.5
    base = base + (0.5 - base) * chaos;
  }
  return base;
}

// ── Simulate a single knockout bracket ───────────────────────
// matchOrder: array of match IDs in processing order
// slotResolver: fn(matchId) → { home, away } team objects
// chaosLevel: 0=standard, 1=full chaos
// rng: random function
function simulateBracket(matchOrder, matchMeta, chaosLevel, rng) {
  const results = {};

  for (const id of matchOrder) {
    const meta = matchMeta[id];
    if (!meta) continue;

    let { home, away } = meta;

    // Resolve "W #X" slots from previously computed results
    if (home?.tbd && home.name.startsWith('W #')) {
      const ref = home.name.replace('W #', '');
      home = results[ref] || home;
    }
    if (away?.tbd && away.name.startsWith('W #')) {
      const ref = away.name.replace('W #', '');
      away = results[ref] || away;
    }
    if (home?.tbd && home.name.startsWith('L #')) {
      const ref = home.name.replace('L #', '');
      home = results[`loser_${ref}`] || home;
    }
    if (away?.tbd && away.name.startsWith('L #')) {
      const ref = away.name.replace('L #', '');
      away = results[`loser_${ref}`] || away;
    }

    if (!home || !away || home.tbd || away.tbd) {
      results[id] = home || away;
      continue;
    }

    const p = winProb(home, away, chaosLevel);
    const winner = rng() < p ? home : away;
    const loser  = winner === home ? away : home;
    results[id] = winner;
    results[`loser_${id}`] = loser;
  }

  return results;
}

const KNOCKOUT_ORDER = [
  '73','74','75','76','77','78','79','80',
  '81','82','83','84','85','86','87','88',
  '89','90','91','92','93','94','95','96',
  '97','98','99','100','101','102','103','104',
];

// ── Run N simulations, return champion probability map ───────
export function simulateChampionProbabilities(n = 1000) {
  const scores    = getAllScores();
  const standings = getGroupStandings(scores);
  const { matchMeta } = buildBracket('official', {});

  const counts = {};
  const seed0  = todaySeed();

  for (let i = 0; i < n; i++) {
    const rng = mulberry32(seed0 + i * 1337);
    const res = simulateBracket(KNOCKOUT_ORDER, matchMeta, 0.3, rng);
    const champ = res['104'];
    if (champ) counts[champ.name] = (counts[champ.name] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([name, c]) => ({ name, pct: Math.round((c / n) * 100) }))
    .sort((a, b) => b.pct - a.pct);
}

// ── Build one Chaos bracket (deterministic for today) ─────────
export function buildChaosBracket() {
  const { matchMeta } = buildBracket('official', {});
  const rng = mulberry32(todaySeed() * 31337);
  const results = simulateBracket(KNOCKOUT_ORDER, matchMeta, 0.85, rng);
  return { results, matchMeta };
}

// ── Build standard bracket (low chaos, most-likely path) ─────
export function buildStandardBracket() {
  const { matchMeta } = buildBracket('official', {});
  const rng = mulberry32(todaySeed() * 7);
  const results = simulateBracket(KNOCKOUT_ORDER, matchMeta, 0.05, rng);
  return { results, matchMeta };
}

// ── Match Chaos Score (0–100) ─────────────────────────────────
export function getMatchChaosScore(match) {
  const hs = teamStrength(match.homeTeam?.name || '');
  const as = teamStrength(match.awayTeam?.name || '');
  const hc = getChaosIndex(match.homeTeam?.name || '');
  const ac = getChaosIndex(match.awayTeam?.name || '');
  const strengthGap = Math.abs(hs - as);
  const avgChaos    = (hc + ac) / 2;
  // Close match + high chaos teams = high chaos score
  const proximity   = 1 - strengthGap / 100;
  return Math.round(proximity * 0.5 * 100 + avgChaos * 0.5);
}

// ── Most fragile favorite ─────────────────────────────────────
export function getMostFragileFavorite() {
  const probs = simulateChampionProbabilities(500);
  if (!probs.length) return null;

  // Fragility = high chance of winning but also high chaos index
  const top5 = probs.slice(0, 5);
  const fragile = top5
    .map(p => ({ ...p, fragility: getChaosIndex(p.name) }))
    .sort((a, b) => b.fragility - a.fragility)[0];

  if (!fragile) return null;
  const upsetRisk = Math.round(fragile.fragility * 0.4);
  return { name: fragile.name, pct: fragile.pct, upsetRisk };
}

// ── Butterfly events (completed matches that caused upsets) ───
export function getButterflyEvents() {
  const scores   = getAllScores();
  const matches  = getMatches();
  const events   = [];

  matches.forEach(m => {
    const score = scores[String(m.id)] || m.score;
    if (!score) return;

    const hs = teamStrength(m.homeTeam?.name);
    const as = teamStrength(m.awayTeam?.name);
    const hg = Number(score.home ?? score.homeScore ?? 0);
    const ag = Number(score.away ?? score.awayScore ?? 0);

    let upset = false, winner, loser, diff;
    if (hg > ag && hs < as) { upset = true; winner = m.homeTeam; loser = m.awayTeam; diff = as - hs; }
    if (ag > hg && as < hs) { upset = true; winner = m.awayTeam; loser = m.homeTeam; diff = hs - as; }

    if (upset && diff >= 8) {
      const impact = Math.min(Math.round(diff * 0.6), 35);
      events.push({
        matchId: m.id,
        stage: m.stage,
        winner: winner.name,
        loser:  loser.name,
        score:  `${hg}–${ag}`,
        impact,
      });
    }
  });

  return events.sort((a, b) => b.impact - a.impact).slice(0, 12);
}

// ── Chaos path HTML helper (shared between tree + timeline) ──
export function getChaosPathLabel(chaosLevel) {
  if (chaosLevel <= 0.1) return { label: 'Most Likely',   pct: 67, cls: 'path-likely'  };
  if (chaosLevel <= 0.5) return { label: 'Alternative',   pct: 21, cls: 'path-alt'     };
  return                         { label: 'Chaos Path',   pct: 12, cls: 'path-chaos'   };
}
