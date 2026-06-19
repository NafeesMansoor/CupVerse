// ── Player Photo Lazy-Loader ──────────────────────────────────────────────────
// Fetches player thumbnails from Wikipedia's REST API, caches results in
// sessionStorage, and lazily applies images when cards enter the viewport.
// Only activated when the squad tab is open or a player appears in the
// top-scorers list — never pre-loads the full 1,200+ player roster.

const CACHE_KEY   = 'cv_player_photos_v1';
const PHOTO_WIDTH = 88; // requested thumbnail width in pixels — keeps payloads small

let _cache    = null;
let _observer = null;
let _pending  = new Set(); // names currently being fetched

// ── Session cache ─────────────────────────────────────────────────────────────
function getCache() {
  if (_cache) return _cache;
  try { _cache = JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}'); }
  catch { _cache = {}; }
  return _cache;
}

function cacheSet(name, url) {
  const c = getCache();
  c[name] = url; // null means "tried and no photo found"
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch {}
}

// ── URL compression ───────────────────────────────────────────────────────────
// Wikipedia thumbnails follow the pattern:
//   …/thumb/a/ab/Photo.jpg/240px-Photo.jpg
// Replace the width segment to get a smaller, faster image.
function compressWikiUrl(url) {
  return url.replace(/\/\d+px-/, `/${PHOTO_WIDTH}px-`);
}

// ── Wikipedia name disambiguation hints ──────────────────────────────────────
// A small map for players whose Wikipedia article title differs from their
// common name, or who share a name with a non-football subject.
const WIKI_ALIASES = {
  // ── Brazil single-name players ───────────────────────────────────────────────
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

  // ── Spain ────────────────────────────────────────────────────────────────────
  'Pedri':               'Pedri',
  'Gavi':                'Gavi (footballer)',
  'Rodri':               'Rodri (footballer)',
  'Vitinha':             'Vitinha (footballer)',

  // ── Portugal ─────────────────────────────────────────────────────────────────
  'Cristiano Ronaldo':   'Cristiano Ronaldo',
  'Rúben Dias':          'Rúben Dias',
  'Bruno Fernandes':     'Bruno Fernandes (footballer, born 1994)',

  // ── France ───────────────────────────────────────────────────────────────────
  'Kylian Mbappé':       'Kylian Mbappé',

  // ── England ──────────────────────────────────────────────────────────────────
  'Jude Bellingham':     'Jude Bellingham',

  // ── Netherlands ──────────────────────────────────────────────────────────────
  'Virgil van Dijk':     'Virgil van Dijk',
  'Cody Gakpo':          'Cody Gakpo',
  'Xavi Simons':         'Xavi Simons',

  // ── Belgium ──────────────────────────────────────────────────────────────────
  'Kevin De Bruyne':     'Kevin De Bruyne',

  // ── Germany ──────────────────────────────────────────────────────────────────
  'Jamal Musiala':       'Jamal Musiala',
  'Marcel Sabitzer':     'Marcel Sabitzer',
  'David Alaba':         'David Alaba',

  // ── Norway ───────────────────────────────────────────────────────────────────
  'Erling Haaland':      'Erling Haaland',

  // ── Croatia ──────────────────────────────────────────────────────────────────
  'Luka Modrić':         'Luka Modrić',

  // ── Argentina ────────────────────────────────────────────────────────────────
  'Lautaro Martínez':    'Lautaro Martínez',
  'Federico Valverde':   'Federico Valverde',

  // ── Uruguay ──────────────────────────────────────────────────────────────────
  'Darwin Núñez':        'Darwin Núñez',

  // ── Colombia ─────────────────────────────────────────────────────────────────
  'Luis Díaz':           'Luis Díaz (footballer)',
  'James Rodríguez':     'James Rodríguez',

  // ── Canada ───────────────────────────────────────────────────────────────────
  'Alphonso Davies':     'Alphonso Davies',

  // ── Morocco ──────────────────────────────────────────────────────────────────
  'Achraf Hakimi':       'Achraf Hakimi',
  'Riyad Mahrez':        'Riyad Mahrez',

  // ── Senegal ──────────────────────────────────────────────────────────────────
  'Sadio Mané':          'Sadio Mané',
  'Idrissa Gueye':       'Idrissa Gana Gueye',

  // ── Egypt ────────────────────────────────────────────────────────────────────
  'Mohamed Salah':       'Mohamed Salah',
  'Trézéguet':           'Trézéguet (Egyptian footballer)',

  // ── South Korea ──────────────────────────────────────────────────────────────
  'Son Heung-min':       'Son Heung-min',

  // ── USA ──────────────────────────────────────────────────────────────────────
  'Christian Pulisic':   'Christian Pulisic',

  // ── Mexico ───────────────────────────────────────────────────────────────────
  'Hirving Lozano':      'Hirving Lozano',

  // ── Switzerland ──────────────────────────────────────────────────────────────
  'Granit Xhaka':        'Granit Xhaka',
  'Xherdan Shaqiri':     'Xherdan Shaqiri',

  // ── Czechia ──────────────────────────────────────────────────────────────────
  'Patrik Schick':       'Patrik Schick',

  // ── Bosnia & Herzegovina ─────────────────────────────────────────────────────
  'Edin Džeko':          'Edin Džeko',

  // ── Scotland ─────────────────────────────────────────────────────────────────
  'Andy Robertson':      'Andy Robertson (footballer)',

  // ── Turkey ───────────────────────────────────────────────────────────────────
  'Hakan Çalhanoğlu':    'Hakan Çalhanoğlu',

  // ── Qatar ────────────────────────────────────────────────────────────────────
  'Akram Afif':          'Akram Afif',

  // ── Ecuador ──────────────────────────────────────────────────────────────────
  'Enner Valencia':      'Enner Valencia',

  // ── Ghana ────────────────────────────────────────────────────────────────────
  'Jordan Ayew':         'Jordan Ayew',

  // ── Paraguay ─────────────────────────────────────────────────────────────────
  'Miguel Almirón':      'Miguel Almirón',

  // ── Uzbekistan ───────────────────────────────────────────────────────────────
  'Eldor Shomurodov':    'Eldor Shomurodov',

  // ── DR Congo ─────────────────────────────────────────────────────────────────
  'Cédric Bakambu':      'Cédric Bakambu',

  // ── New Zealand ──────────────────────────────────────────────────────────────
  'Chris Wood':          'Chris Wood (footballer)',

  // ── Côte d\'Ivoire ────────────────────────────────────────────────────────────
  'Franck Kessié':       'Franck Kessié',

  // ── South Africa ─────────────────────────────────────────────────────────────
  'Percy Tau':           'Percy Tau',

  // ── Vinícius Júnior (Brazil) ─────────────────────────────────────────────────
  'Vinícius Júnior':     'Vinícius Júnior',

  // ── Bruno Guimarães (Brazil) ─────────────────────────────────────────────────
  'Bruno Guimarães':     'Bruno Guimarães',

  // ── Wahbi Khazri (Tunisia) ───────────────────────────────────────────────────
  'Wahbi Khazri':        'Wahbi Khazri',
};

// ── Core fetch ────────────────────────────────────────────────────────────────
export async function fetchPlayerPhoto(playerName) {
  const cache = getCache();
  if (playerName in cache) return cache[playerName];
  if (_pending.has(playerName)) return null; // already in-flight

  _pending.add(playerName);
  const wikiTitle = WIKI_ALIASES[playerName] || playerName;
  const encoded   = encodeURIComponent(wikiTitle);

  try {
    const res  = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) throw new Error('no page');
    const data = await res.json();
    const raw  = data.thumbnail?.source ?? null;
    const url  = raw ? compressWikiUrl(raw) : null;
    cacheSet(playerName, url);
    return url;
  } catch {
    cacheSet(playerName, null);
    return null;
  } finally {
    _pending.delete(playerName);
  }
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
  // hide initials text when photo is present
  const initials = el.querySelector('.pc-initials, .kp-initials, .cv-modal-initials, .fp-initials');
  if (initials) initials.style.opacity = '0';
  const num = el.querySelector('.pc-num');
  if (num) num.style.opacity = '0';
}

// ── Public API ────────────────────────────────────────────────────────────────

// Start the observer (or re-start it after stopping).
export function initPhotoObserver() {
  if (_observer) _observer.disconnect();
  _observer = createObserver();
}

// Observe all [data-player-photo] elements inside a container.
// Call this whenever new squad cards are rendered.
export function observePlayerPhotos(container) {
  if (!_observer) initPhotoObserver();
  const els = (container || document).querySelectorAll('[data-player-photo]:not(.has-photo)');
  els.forEach(el => _observer.observe(el));
}

// Disconnect observer (called when navigating away from squad tab or team page).
export function stopObservingPhotos() {
  if (_observer) { _observer.disconnect(); _observer = null; }
}
