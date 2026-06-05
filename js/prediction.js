import { getMatches, getGroupStandings } from './data.js';
import { getAllScores } from './storage.js';
import { buildChaosBracket, simulateChampionProbabilities, getChaosIndex, getMatchChaosScore } from './chaos.js';

const PRED_KEY = 'cupverse_predictions';
const MODE_KEY = 'cupverse_pred_mode';

export function getUserPredictions() {
  try { return JSON.parse(localStorage.getItem(PRED_KEY) || '{}'); }
  catch { return {}; }
}
export function saveUserPredictions(preds) {
  localStorage.setItem(PRED_KEY, JSON.stringify(preds));
}
export function clearUserPredictions() {
  localStorage.removeItem(PRED_KEY);
}
export function getPredMode() {
  return localStorage.getItem(MODE_KEY) || 'official';
}
export function setPredMode(m) {
  localStorage.setItem(MODE_KEY, m);
}

// ── Slot resolver ─────────────────────────────────────────
function resolveSlot(raw, standings, results) {
  if (!raw) return null;
  const s = raw.trim();

  const winM = s.match(/Winner #(\d+)/);
  if (winM) {
    const t = results[winM[1]];
    return t || { name: `W #${winM[1]}`, flag: '❓', code: `W${winM[1]}`, tbd: true };
  }

  const losM = s.match(/Loser #(\d+)/);
  if (losM) {
    const t = results[`loser_${losM[1]}`];
    return t || { name: `L #${losM[1]}`, flag: '❓', code: `L${losM[1]}`, tbd: true };
  }

  const f = s.match(/❶\s*([A-L])/);
  if (f) {
    const g = f[1];
    const t = standings[g]?.[0];
    return t || { name: `Group ${g} 1st`, flag: '🏳️', code: `${g}1`, tbd: true };
  }

  const sec = s.match(/❷\s*([A-L])/);
  if (sec) {
    const g = sec[1];
    const t = standings[g]?.[1];
    return t || { name: `Group ${g} 2nd`, flag: '🏳️', code: `${g}2`, tbd: true };
  }

  const trd = s.match(/❸\s*([A-L/]+)/);
  if (trd) {
    const gs = trd[1].split('/');
    const best = gs.map(g => standings[g]?.[2]).filter(Boolean)
      .sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        const gd = x => x.gf - x.ga;
        if (gd(b) !== gd(a)) return gd(b) - gd(a);
        return b.gf - a.gf;
      })[0];
    return best || { name: `Best 3rd (${gs.join('/')})`, flag: '🏳️', code: '3rd', tbd: true };
  }

  return { name: s, flag: '🏳️', code: s.slice(0, 4), tbd: true };
}

// ── Bracket builder ───────────────────────────────────────
export function buildBracket(mode = 'official', userPred = {}) {
  const matches = getMatches();
  const scores  = getAllScores();
  const standings = getGroupStandings(scores);

  const results  = {};
  const matchMeta = {};

  const knockouts = matches
    .filter(m => m.stage !== 'Group Stage')
    .sort((a, b) => parseInt(a.id) - parseInt(b.id));

  for (const m of knockouts) {
    const id = String(m.id);
    const home = resolveSlot(m.homeTeam.name, standings, results);
    const away = resolveSlot(m.awayTeam.name, standings, results);

    const scoreData = scores[id] || m.score;
    let winner = null, loser = null;

    if (mode === 'official' && scoreData) {
      const hg = Number(scoreData.home ?? scoreData.homeScore ?? 0);
      const ag = Number(scoreData.away ?? scoreData.awayScore ?? 0);
      if (hg > ag)      { winner = home; loser = away; }
      else if (ag > hg) { winner = away; loser = home; }
    } else if (mode === 'predict' && userPred[id]) {
      const code = userPred[id];
      if (home?.code === code)      { winner = home; loser = away; }
      else if (away?.code === code) { winner = away; loser = home; }
    }

    if (winner) {
      results[id] = winner;
      if (loser) results[`loser_${id}`] = loser;
    }

    matchMeta[id] = { home, away, score: scoreData || null, stage: m.stage, group: m.group, datetime: m.datetime };
  }

  const champion = results['104'] || null;

  return { matchMeta, results, standings, champion };
}

// ── Bracket match HTML ────────────────────────────────────
function bMatchHTML(id, { home, away, score, stage }, results, mode, userPred, compact = false) {
  const winnerCode = results[id]?.code;
  const pickedCode = userPred[id];
  const isPred = mode === 'predict';

  function teamRow(team, sideScore) {
    if (!team) return `<div class="bm-team bm-tbd"><span class="bm-flag">❓</span><span class="bm-name">TBD</span></div>`;
    const won   = winnerCode && winnerCode === team.code;
    const lost  = winnerCode && winnerCode !== team.code;
    const picked = isPred && pickedCode === team.code;
    const pickable = isPred && !team.tbd && !winnerCode;
    return `
      <div class="bm-team${won ? ' bm-winner' : ''}${lost ? ' bm-loser' : ''}${picked ? ' bm-picked' : ''}${pickable ? ' bm-pickable' : ''}"
           ${pickable ? `data-action="predict-pick" data-match="${id}" data-code="${team.code}"` : ''}>
        <span class="bm-flag">${team.flag}</span>
        <span class="bm-name">${team.name}</span>
        ${sideScore != null ? `<span class="bm-score">${sideScore}</span>` : ''}
        ${won ? `<span class="bm-win-mark">✓</span>` : ''}
      </div>`;
  }

  const hScore = score ? (score.home ?? score.homeScore ?? null) : null;
  const aScore = score ? (score.away ?? score.awayScore ?? null) : null;

  return `
    <div class="bracket-match${compact ? ' bm-compact' : ''}" data-id="${id}">
      ${teamRow(home, hScore)}
      <div class="bm-divider"></div>
      ${teamRow(away, aScore)}
    </div>`;
}

// ── Bracket round column HTML ─────────────────────────────
function roundColHTML(label, matchIds, matchMeta, results, mode, userPred) {
  const cards = matchIds.map(id =>
    bMatchHTML(id, matchMeta[id] || { home: null, away: null, score: null }, results, mode, userPred)
  ).join('');
  return `
    <div class="bracket-col" data-round="${label.toLowerCase().replace(/\s+/g, '-')}">
      <div class="bc-label">${label}</div>
      <div class="bc-matches">${cards}</div>
    </div>`;
}

// ── Collapsible mobile section ────────────────────────────
function mobileRoundHTML(label, matchIds, matchMeta, results, mode, userPred, defaultOpen = false) {
  const slug = label.toLowerCase().replace(/\s+/g, '-');
  const cards = matchIds.map(id =>
    bMatchHTML(id, matchMeta[id] || { home: null, away: null, score: null }, results, mode, userPred)
  ).join('');
  return `
    <div class="mob-round ${defaultOpen ? 'mob-open' : ''}" data-round="${slug}">
      <button class="mob-round-hd" data-action="toggle-round" data-round="${slug}">
        <span>${label}</span>
        <span class="mob-round-count">${matchIds.length} matches</span>
        <span class="mob-round-chevron">▶</span>
      </button>
      <div class="mob-round-body">${cards}</div>
    </div>`;
}

// ── Wrap HTML into a DOM node (same pattern as makeSection in ui.js) ─────
function makeNode(html) {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el;
}

// ── Main render ───────────────────────────────────────────
export function renderPredictionTree(mode = 'official') {
  const userPred = getUserPredictions();

  // Resolve bracket data depending on mode
  let activeMeta, activeResults, activeChamp;
  if (mode === 'chaos') {
    const cb = buildChaosBracket();
    activeMeta    = cb.matchMeta;
    activeResults = cb.results;
    activeChamp   = cb.results['104'] || null;
  } else {
    const b = buildBracket(mode === 'predict' ? 'predict' : 'official', userPred);
    activeMeta    = b.matchMeta;
    activeResults = b.results;
    activeChamp   = b.champion;
  }

  // Match order (top→bottom)
  const R32 = ['74','77','73','75','83','84','81','82','76','78','79','80','86','88','85','87'];
  const R16 = ['89','90','93','94','91','92','95','96'];
  const QF  = ['97','98','99','100'];
  const SF  = ['101','102'];

  // Champion card
  const champLabel = mode === 'predict' ? 'Predicted Champion'
                   : mode === 'chaos'   ? '🦋 Chaos Champion'
                   : 'World Champion';
  const champEmptyLabel = mode === 'predict' ? 'Pick your champion'
                        : mode === 'chaos'   ? 'Simulating…'
                        : 'Champion TBD';
  const champHTML = activeChamp
    ? `<div class="champion-card${mode === 'chaos' ? ' champ-chaos' : ''}">
         <div class="champ-trophy">🏆</div>
         <div class="champ-flag">${activeChamp.flag}</div>
         <div class="champ-name">${activeChamp.name}</div>
         <div class="champ-label">${champLabel}</div>
         ${mode === 'chaos' ? `<div class="champ-chaos-idx">Chaos Index: ${getChaosIndex(activeChamp.name)}</div>` : ''}
       </div>`
    : `<div class="champion-card champ-empty"><div class="champ-trophy">🏆</div><div class="champ-label">${champEmptyLabel}</div></div>`;

  // Third place
  const thirdMeta = activeMeta['103'] || { home: null, away: null, score: null };
  const thirdHTML = bMatchHTML('103', thirdMeta, activeResults, mode, userPred);

  // Chaos probability table
  let champProbHTML = '';
  if (mode === 'chaos') {
    const probs = simulateChampionProbabilities(800);
    champProbHTML = probs.length ? `
      <div class="chaos-probs glass-card">
        <div class="cp-title">Champion Probabilities <span class="cp-sim">800 simulations</span></div>
        ${probs.slice(0, 8).map(p => `
          <div class="cp-row">
            <span class="cp-name">${p.name}</span>
            <div class="cp-bar-wrap"><div class="cp-bar" style="width:${Math.min(p.pct * 4, 100)}%"></div></div>
            <span class="cp-pct">${p.pct}%</span>
            <span class="cp-chaos-badge chaos-lvl-${p.pct > 20 ? 'low' : p.pct > 8 ? 'med' : 'high'}" title="Chaos Index">${getChaosIndex(p.name)}</span>
          </div>`).join('')}
      </div>` : '';
  }

  const subTexts = {
    official: 'Live tournament progression. Results update automatically.',
    chaos:    '🦋 Chaos Theory — small upsets reshape the entire bracket daily.',
    predict:  'Tap a team in each match to advance them. Predict the champion!',
  };

  const html = `
    <div class="pred-page">

      <div class="pred-header glass-card">
        <div class="pred-title-row">
          <h1 class="pred-title">🏆 Prediction Tree</h1>
          <div class="pred-mode-toggle">
            <button class="pmt-btn${mode === 'official' ? ' active' : ''}" data-action="pred-mode" data-mode="official">Official</button>
            <button class="pmt-btn pmt-chaos${mode === 'chaos' ? ' active' : ''}" data-action="pred-mode" data-mode="chaos">🦋 Chaos</button>
            <button class="pmt-btn${mode === 'predict' ? ' active' : ''}" data-action="pred-mode" data-mode="predict">My Picks</button>
          </div>
        </div>
        <p class="pred-sub">${subTexts[mode] || subTexts.official}</p>
        ${mode === 'predict' ? `<button class="pred-clear-btn" data-action="clear-predictions">Reset picks</button>` : ''}
      </div>

      ${champProbHTML}

      <div class="champion-card-desktop">${champHTML}</div>

      <div class="bracket-desktop">
        ${roundColHTML('Round of 32', R32, activeMeta, activeResults, mode, userPred)}
        ${roundColHTML('Round of 16', R16, activeMeta, activeResults, mode, userPred)}
        ${roundColHTML('Quarter Finals', QF, activeMeta, activeResults, mode, userPred)}
        ${roundColHTML('Semi Finals', SF, activeMeta, activeResults, mode, userPred)}
        <div class="bracket-col" data-round="final">
          <div class="bc-label">Final</div>
          <div class="bc-matches bc-final">
            ${bMatchHTML('104', activeMeta['104'] || { home: null, away: null, score: null }, activeResults, mode, userPred)}
          </div>
        </div>
      </div>

      <div class="bracket-mobile">
        ${mobileRoundHTML('Round of 32', R32, activeMeta, activeResults, mode, userPred, false)}
        ${mobileRoundHTML('Round of 16', R16, activeMeta, activeResults, mode, userPred, false)}
        ${mobileRoundHTML('Quarter Finals', QF, activeMeta, activeResults, mode, userPred, false)}
        ${mobileRoundHTML('Semi Finals', SF, activeMeta, activeResults, mode, userPred, true)}
        ${mobileRoundHTML('Final', ['104'], activeMeta, activeResults, mode, userPred, true)}
      </div>

      <div class="glass-card" style="margin-top:8px;">
        <div class="section-header" style="margin-bottom:12px;">
          <h3 style="font-size:0.9rem;">Third Place Match</h3>
        </div>
        ${thirdHTML}
      </div>

      <div class="champion-card-mobile">${champHTML}</div>

    </div>`;

  return makeNode(html);
}
