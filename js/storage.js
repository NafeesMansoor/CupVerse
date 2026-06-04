const KEYS = {
  scores:    'wc2026_scores',
  notes:     'wc2026_notes',
  scorers:   'wc2026_scorers',
  settings:  'wc2026_settings',
  favorites: 'wc2026_favorites',
  collapsed: 'wc2026_collapsed',
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

// ── Scores ──────────────────────────────────────────────
export function getScore(matchId) {
  const scores = readJSON(KEYS.scores, {});
  return scores[String(matchId)] || null;
}

export function setScore(matchId, homeScore, awayScore) {
  const scores = readJSON(KEYS.scores, {});
  scores[String(matchId)] = { home: Number(homeScore), away: Number(awayScore) };
  writeJSON(KEYS.scores, scores);
}

export function clearScore(matchId) {
  const scores = readJSON(KEYS.scores, {});
  delete scores[String(matchId)];
  writeJSON(KEYS.scores, scores);
}

export function getAllScores() {
  return readJSON(KEYS.scores, {});
}

// ── Notes ────────────────────────────────────────────────
export function getNote(matchId) {
  const notes = readJSON(KEYS.notes, {});
  return notes[String(matchId)] || null;
}

export function setNote(matchId, text, photos = []) {
  const notes = readJSON(KEYS.notes, {});
  notes[String(matchId)] = { text, photos, updatedAt: new Date().toISOString() };
  writeJSON(KEYS.notes, notes);
}

// ── Top Scorers ──────────────────────────────────────────
export function getTopScorers() {
  return readJSON(KEYS.scorers, []);
}

export function addTopScorer(playerName, team, goals, assists) {
  const scorers = getTopScorers();
  scorers.push({ id: Date.now(), playerName, team, goals: Number(goals), assists: Number(assists) });
  scorers.sort((a, b) => b.goals - a.goals || b.assists - a.assists);
  writeJSON(KEYS.scorers, scorers);
}

export function updateTopScorer(id, goals, assists) {
  const scorers = getTopScorers().map(s =>
    s.id === id ? { ...s, goals: Number(goals), assists: Number(assists) } : s
  );
  scorers.sort((a, b) => b.goals - a.goals || b.assists - a.assists);
  writeJSON(KEYS.scorers, scorers);
}

export function removeTopScorer(id) {
  writeJSON(KEYS.scorers, getTopScorers().filter(s => s.id !== id));
}

// ── Settings ─────────────────────────────────────────────
function getSettings() {
  return readJSON(KEYS.settings, { timezone: '', favoriteTeams: [], theme: 'dark' });
}

function saveSettings(settings) {
  writeJSON(KEYS.settings, settings);
}

export function getTimezone() {
  return getSettings().timezone || '';
}

export function setTimezone(tz) {
  saveSettings({ ...getSettings(), timezone: tz });
}

export function getTheme() {
  return getSettings().theme || 'dark';
}

export function setTheme(theme) {
  saveSettings({ ...getSettings(), theme });
}

// ── Favorite Teams ────────────────────────────────────────
export function getFavTeams() {
  return getSettings().favoriteTeams || [];
}

export function toggleFavTeam(teamCode) {
  const settings = getSettings();
  const favs = new Set(settings.favoriteTeams || []);
  if (favs.has(teamCode)) favs.delete(teamCode);
  else favs.add(teamCode);
  saveSettings({ ...settings, favoriteTeams: Array.from(favs) });
  return favs.has(teamCode);
}

export function isFavTeam(teamCode) {
  return getFavTeams().includes(teamCode);
}

// Legacy aliases (used by V1 code paths still referenced)
export function addFavTeam(code) { if (!isFavTeam(code)) toggleFavTeam(code); }
export function removeFavTeam(code) { if (isFavTeam(code)) toggleFavTeam(code); }

// ── Favorite Matches (starred) ───────────────────────────
export function getFavoriteMatches() {
  return readJSON(KEYS.favorites, []);
}

export function toggleFavoriteMatch(matchId) {
  const favs = new Set(getFavoriteMatches().map(String));
  const id = String(matchId);
  if (favs.has(id)) favs.delete(id);
  else favs.add(id);
  writeJSON(KEYS.favorites, Array.from(favs));
  return favs.has(id);
}

export function isMatchFavorite(matchId) {
  return getFavoriteMatches().map(String).includes(String(matchId));
}

// Legacy alias
export function toggleStarredMatch(id) { return toggleFavoriteMatch(id); }
export function getStarredMatches() { return getFavoriteMatches(); }

// ── AI enabled (kept for settings toggle) ───────────────
export function isAiEnabled() {
  return readJSON('wc2026_ai', false);
}
export function setAiEnabled(v) {
  writeJSON('wc2026_ai', Boolean(v));
}

// ── Collapsed Cards ───────────────────────────────────────
export function getCollapsedCards() {
  return readJSON(KEYS.collapsed, {});
}

export function toggleCardCollapse(cardId) {
  const state = getCollapsedCards();
  state[cardId] = !state[cardId];
  writeJSON(KEYS.collapsed, state);
  return state[cardId];
}

export function isCardCollapsed(cardId) {
  return Boolean(getCollapsedCards()[cardId]);
}

// ── Clear All ────────────────────────────────────────────
export function clearStorage() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  localStorage.removeItem('wc2026_ai');
}
