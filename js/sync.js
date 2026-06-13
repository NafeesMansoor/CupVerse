import { loadMatches } from './data.js';
import { getLastSyncDate, setLastSyncDate } from './storage.js';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(fromDate, toDate) {
  const a = new Date(fromDate);
  const b = new Date(toDate);
  return Math.max(0, Math.round((b - a) / 86400000));
}

export function getSyncStatus() {
  const lastSync = getLastSyncDate();
  const today = todayStr();
  const daysBehind = lastSync ? daysBetween(lastSync, today) : null;
  return { lastSync, today, daysBehind, needsUpdate: daysBehind === null || daysBehind > 0 };
}

export function formatSyncDate(dateStr) {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Ensures data is always loaded; forces a fresh fetch when the client is behind.
// Returns { success, date, skipped?, error? }
export async function performSync({ force = false } = {}) {
  const { needsUpdate, today } = getSyncStatus();
  const shouldFetch = force || needsUpdate;

  try {
    await loadMatches(shouldFetch);
    if (shouldFetch) setLastSyncDate(today);
    return { success: true, date: today, skipped: !shouldFetch };
  } catch (err) {
    // Network failed — try loading from cache so the app still works
    try { await loadMatches(false); } catch (_) { /* no cache */ }
    return { success: false, error: err.message };
  }
}
