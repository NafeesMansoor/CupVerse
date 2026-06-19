// ── Player Photo Loader ────────────────────────────────────────────────────────
// Primary source: data/player_photos.json (Guardian World Cup 2026 guide).
// Photos are matched to squad members by jersey number, so 1,192 of 1,246
// players have a direct entry. Falls back to Wikipedia only for the rest.
//
// Images from Guardian CDN (media.guim.co.uk) arrive as direct HTTPS URLs;
// no compression or processing is applied — they are used as-is.

const PHOTO_MAP_URL  = './data/player_photos.json';
const WIKI_CACHE_KEY = 'cv_player_photos_v2';
const PHOTO_WIDTH    = 88; // only used for Wikipedia fallback thumbnails

let _photoData  = null;   // { photos, aliases, team_assets }
let _observer   = null;
let _pending    = new Set();

// ── Load the Guardian photo map once ─────────────────────────────────────────
async function getPhotoData() {
  if (_photoData) return _photoData;
  try {
    const res  = await fetch(PHOTO_MAP_URL);
    if (!res.ok) throw new Error('no photo map');
    _photoData = await res.json();
  } catch {
    _photoData = { photos: {}, aliases: {}, team_assets: {} };
  }
  return _photoData;
}

// ── Session cache for Wikipedia fallback ──────────────────────────────────────
function getWikiCache() {
  try { return JSON.parse(sessionStorage.getItem(WIKI_CACHE_KEY) || '{}'); }
  catch { return {}; }
}
function wikiCacheSet(name, url) {
  const c = getWikiCache();
  c[name] = url;
  try { sessionStorage.setItem(WIKI_CACHE_KEY, JSON.stringify(c)); } catch {}
}

// ── Wikipedia thumbnail disambiguation ───────────────────────────────────────
// Only used for the ~54 players not in the Guardian photo map.
const WIKI_ALIASES = {
  'Alisson':             'Alisson Becker',
  'Marquinhos':          'Marquinhos (footballer)',
  'Casemiro':            'Casemiro',
  'Weverton':            'Weverton (goalkeeper)',
  'Danilo':              'Danilo Luiz da Silva',
  'Neymar':              'Neymar',
  'Raphinha':            'Raphinha',
  'Ederson':             'Ederson (goalkeeper)',
  'Fabinho':             'Fabinho (footballer)',
  'Bremer':              'Gleison Bremer',
  'Endrick':             'Endrick (footballer)',
  'Wesley':              'Wesley (footballer born 2003)',
  'Pedri':               'Pedri',
  'Gavi':                'Gavi (footballer)',
  'Rodri':               'Rodri (footballer)',
  'Vitinha':             'Vitinha (footballer)',
  'Cristiano Ronaldo':   'Cristiano Ronaldo',
  'Rúben Dias':          'Rúben Dias',
  'Bruno Fernandes':     'Bruno Fernandes (footballer, born 1994)',
  'Kylian Mbappé':       'Kylian Mbappé',
  'Jude Bellingham':     'Jude Bellingham',
  'Virgil van Dijk':     'Virgil van Dijk',
  'Cody Gakpo':          'Cody Gakpo',
  'Xavi Simons':         'Xavi Simons',
  'Kevin De Bruyne':     'Kevin De Bruyne',
  'Jamal Musiala':       'Jamal Musiala',
  'Marcel Sabitzer':     'Marcel Sabitzer',
  'David Alaba':         'David Alaba',
  'Erling Haaland':      'Erling Haaland',
  'Luka Modrić':         'Luka Modrić',
  'Lautaro Martínez':    'Lautaro Martínez',
  'Federico Valverde':   'Federico Valverde',
  'Darwin Núñez':        'Darwin Núñez',
  'Luis Díaz':           'Luis Díaz (footballer)',
  'James Rodríguez':     'James Rodríguez',
  'Alphonso Davies':     'Alphonso Davies',
  'Achraf Hakimi':       'Achraf Hakimi',
  'Riyad Mahrez':        'Riyad Mahrez',
  'Sadio Mané':          'Sadio Mané',
  'Idrissa Gueye':       'Idrissa Gana Gueye',
  'Mohamed Salah':       'Mohamed Salah',
  'Trézéguet':           'Trézéguet (Egyptian footballer)',
  'Son Heung-min':       'Son Heung-min',
  'Christian Pulisic':   'Christian Pulisic',
  'Hirving Lozano':      'Hirving Lozano',
  'Granit Xhaka':        'Granit Xhaka',
  'Xherdan Shaqiri':     'Xherdan Shaqiri',
  'Patrik Schick':       'Patrik Schick',
  'Edin Džeko':          'Edin Džeko',
  'Andy Robertson':      'Andy Robertson (footballer)',
  'Hakan Çalhanoğlu':    'Hakan Çalhanoğlu',
  'Akram Afif':          'Akram Afif',
  'Enner Valencia':      'Enner Valencia',
  'Jordan Ayew':         'Jordan Ayew',
  'Miguel Almirón':      'Miguel Almirón',
  'Eldor Shomurodov':    'Eldor Shomurodov',
  'Cédric Bakambu':      'Cédric Bakambu',
  'Chris Wood':          'Chris Wood (footballer)',
  'Franck Kessié':       'Franck Kessié',
  'Percy Tau':           'Percy Tau',
  'Vinícius Júnior':     'Vinícius Júnior',
  'Bruno Guimarães':     'Bruno Guimarães',
  'Wahbi Khazri':        'Wahbi Khazri',
};

function compressWikiUrl(url) {
  return url.replace(/\/\d+px-/, `/${PHOTO_WIDTH}px-`);
}

async function fetchWikiPhoto(playerName) {
  const cache = getWikiCache();
  if (playerName in cache) return cache[playerName];
  if (_pending.has(playerName)) return null;
  _pending.add(playerName);

  const wikiTitle = WIKI_ALIASES[playerName] || playerName;
  try {
    const res  = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) throw new Error('no page');
    const data = await res.json();
    const raw  = data.thumbnail?.source ?? null;
    const url  = raw ? compressWikiUrl(raw) : null;
    wikiCacheSet(playerName, url);
    return url;
  } catch {
    wikiCacheSet(playerName, null);
    return null;
  } finally {
    _pending.delete(playerName);
  }
}

// ── Primary photo lookup ──────────────────────────────────────────────────────
export async function fetchPlayerPhoto(playerName) {
  const data = await getPhotoData();
  // Direct match
  if (data.photos[playerName]) return data.photos[playerName];
  // Guardian stored the name slightly differently; check alias map
  const aliased = data.aliases?.[playerName];
  if (aliased && data.photos[aliased]) return data.photos[aliased];
  // Fall back to Wikipedia
  return fetchWikiPhoto(playerName);
}

// ── Team asset helpers (badge / kits) ────────────────────────────────────────
export async function getTeamAssets(teamName) {
  const data = await getPhotoData();
  return data.team_assets?.[teamName] ?? null;
}

// ── IntersectionObserver ──────────────────────────────────────────────────────
function createObserver() {
  return new IntersectionObserver(async (entries) => {
    for (const { isIntersecting, target } of entries) {
      if (!isIntersecting) continue;
      const name = target.dataset.playerPhoto;
      if (!name) continue;
      _observer.unobserve(target);
      const url = await fetchPlayerPhoto(name);
      if (url) applyPhoto(target, url);
    }
  }, { threshold: 0.05, rootMargin: '160px 0px' });
}

function applyPhoto(el, url) {
  el.style.backgroundImage    = `url(${url})`;
  el.style.backgroundSize     = 'cover';
  el.style.backgroundPosition = 'center top';
  el.classList.add('has-photo');
  const initials = el.querySelector('.pc-initials, .kp-initials, .cv-modal-initials, .fp-initials');
  if (initials) initials.style.opacity = '0';
  const num = el.querySelector('.pc-num');
  if (num) num.style.opacity = '0';
}

export function initPhotoObserver() {
  if (_observer) _observer.disconnect();
  _observer = createObserver();
}

export function observePlayerPhotos(container) {
  if (!_observer) initPhotoObserver();
  const els = (container || document).querySelectorAll('[data-player-photo]:not(.has-photo)');
  els.forEach(el => _observer.observe(el));
}

export function stopObservingPhotos() {
  if (_observer) { _observer.disconnect(); _observer = null; }
}

// Pre-warm the photo map (call once on app init so squad tabs feel instant).
export async function preloadPhotoMap() {
  await getPhotoData();
}

// Synchronous getter — only valid after preloadPhotoMap() has resolved.
export function getTeamAssetsSync(teamName) {
  return _photoData?.team_assets?.[teamName] ?? null;
}
