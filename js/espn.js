const ESPN_API = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';

// ESPN team names that differ from local names (normalised → normalised)
const ESPN_ALIASES = {
  'cape verde':                       'cabo verde',
  'south korea':                      'korea republic',
  'turkey':                           'turkiye',
  'ivory coast':                      'cote dvoire',
  'democratic republic of the congo': 'dr congo',
  'united states':                    'usa',
  'czech republic':                   'czechia',
};

function normEspn(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveEspnTeam(espnName) {
  const n = normEspn(espnName);
  return ESPN_ALIASES[n] || n;
}

// dateStr → Map("homeNorm|awayNorm" → espnEventId)
const scoreboard = new Map();

export async function findEspnEventId(homeTeam, awayTeam, dateStr) {
  const homeNorm = normEspn(homeTeam);
  const awayNorm = normEspn(awayTeam);

  if (!scoreboard.has(dateStr)) {
    try {
      const res = await fetch(`${ESPN_API}/scoreboard?dates=${dateStr.replace(/-/g, '')}`, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      const dayMap = new Map();
      for (const ev of data.events || []) {
        const comp = ev.competitions?.[0];
        if (!comp) continue;
        const h = comp.competitors?.find(c => c.homeAway === 'home');
        const a = comp.competitors?.find(c => c.homeAway === 'away');
        const hn = resolveEspnTeam(h?.team?.displayName || '');
        const an = resolveEspnTeam(a?.team?.displayName || '');
        dayMap.set(`${hn}|${an}`, ev.id);
        dayMap.set(`${an}|${hn}`, ev.id); // reversed fallback
      }
      scoreboard.set(dateStr, dayMap);
    } catch {
      return null;
    }
  }

  const dayMap = scoreboard.get(dateStr);
  return dayMap?.get(`${homeNorm}|${awayNorm}`)
      || dayMap?.get(`${awayNorm}|${homeNorm}`)
      || null;
}

export async function fetchEspnLiveData(espnEventId) {
  const res = await fetch(`${ESPN_API}/summary?event=${espnEventId}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const d = await res.json();

  const comp  = d.header?.competitions?.[0] || {};
  const status = comp.status || {};
  const competitors = comp.competitors || [];

  const home = competitors.find(c => c.homeAway === 'home') || {};
  const away = competitors.find(c => c.homeAway === 'away') || {};

  // Build stats map for both sides
  const stats = { home: {}, away: {} };
  for (const t of d.boxscore?.teams || []) {
    const side = t.homeAway;
    if (!stats[side]) continue;
    for (const s of t.statistics || []) {
      stats[side][s.label] = s.displayValue ?? String(s.value ?? '');
    }
  }

  // Key events (goals, cards, subs) — most recent first
  const events = (d.keyEvents || [])
    .filter(e => e.type?.type && e.type.type !== 'kickoff')
    .map(e => ({
      id: e.id,
      type:   e.type.type,
      text:   e.type.text,
      clock:  e.clock?.displayValue || '',
      period: e.period?.number || 1,
      scoringPlay: !!e.scoringPlay,
      homeAway: e.homeAway || '',
      athlete: e.athleteDescription || '',
      desc:    e.text || '',
      homeScore: e.homeScore ?? null,
      awayScore: e.awayScore ?? null,
    }))
    .reverse();

  // Last 6 commentary lines, newest first
  const commentary = (d.commentary || [])
    .filter(c => c.text?.trim())
    .slice(-6)
    .reverse();

  return {
    clock:       status.displayClock || '',
    period:      status.type?.description || '',
    periodShort: status.displayPeriod || '',
    state:       status.type?.state || 'pre',
    homeScore:   home.score ?? '–',
    awayScore:   away.score ?? '–',
    homeTeam:    home.team?.displayName || '',
    awayTeam:    away.team?.displayName || '',
    stats,
    events,
    commentary,
  };
}
