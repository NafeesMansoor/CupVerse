const SQUADS_URL = './data/squads.json';
const LS_KEY     = 'cv_squads_v1';
const LS_TS_KEY  = 'cv_squads_ts_v1';
const TTL        = 86400000; // 24 hours

let _squads = null;

export async function loadSquads(forceReload = false) {
  if (!forceReload && _squads) return _squads;

  if (!forceReload) {
    try {
      const ts = Number(localStorage.getItem(LS_TS_KEY) || 0);
      if (Date.now() - ts < TTL) {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) { _squads = JSON.parse(raw); return _squads; }
      }
    } catch (_) {}
  }

  try {
    const res = await fetch(SQUADS_URL, forceReload ? { cache: 'reload' } : {});
    if (!res.ok) throw new Error();
    _squads = await res.json();
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(_squads));
      localStorage.setItem(LS_TS_KEY, String(Date.now()));
    } catch (_) {}
    return _squads;
  } catch (_) {}

  try {
    const c = await caches.match(SQUADS_URL);
    if (c) { _squads = await c.json(); return _squads; }
  } catch (_) {}

  _squads = {};
  return _squads;
}

export function getSquad(teamName) {
  return (_squads && _squads[teamName]) || [];
}

export function squadsLoaded() {
  return _squads !== null;
}

export function getSquadCacheAge() {
  const ts = Number(localStorage.getItem(LS_TS_KEY) || 0);
  return ts ? Math.floor((Date.now() - ts) / 3600000) : null;
}
