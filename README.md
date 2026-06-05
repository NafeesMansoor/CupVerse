# CupVerse ⚽

**Your World Cup 2026 Command Center**

CupVerse is an offline-first Progressive Web App (PWA) built for the FIFA World Cup 2026. It covers all 105 matches across 48 teams and 16 venues in the USA, Canada, and Mexico — June 11 to July 19, 2026. No backend, no login, no data plan required after first load.

---

## Features

### Home Dashboard
- **Next Match Hero** — countdown timer to the nearest upcoming match with teams, venue, and stage
- **Tournament Stats** — matches played, total matches, remaining matches, and a progress bar
- **Next 5 Matches** — horizontal-scrollable quick-access cards
- **Favorite Team Widget** — surfaces your favorited team's next fixture

### Fixtures (`#matches`)
- Full list of all 105 matches grouped by stage and group
- Live filters: search by team or venue, filter by stage, filter by group
- Match status badges: Upcoming / Live / Final

### Group Standings (`#standings`)
- Point tables for all 12 groups (A–L)
- Columns: MP, W, D, L, GF, GA, GD, Pts
- Sorted by Points → Goal Difference → Goals For
- Qualification zones highlighted in green (advances) and gold (best 3rd-place)
- Updates live as you enter match scores

### Match Detail (`#match/:id`)
- Team flags, names, and match metadata (venue, date, local kickoff time)
- Live countdown for upcoming matches
- Manual score entry — persisted in localStorage, updates standings
- Expandable venue card: city, country, capacity, surface, year opened, map link
- Squad browser with player pills
- Match notes with photo attachment
- Star match / generate share card / export PDF

### Teams (`#teams`)
- All 48 nations, sortable by group or FIFA ranking
- One-tap favourite toggle (⭐)
- Shows next match date inline

### Calendar (`#calendar`)
- Scrollable date strip spanning June 11 – July 19
- All matches for the selected day displayed in a grid

### Top Scorers (`#scorers`)
- Add players manually with goals and assists
- Sorted leaderboard with gold/silver/bronze medals for top 3

### Settings (`#settings`)
- Dark / Light theme toggle, persisted across sessions
- Timezone selector (27 zones) — all match times adjust globally
- AI Insights toggle (lightweight rules-based analysis, no external API)
- Refresh Data — re-fetches `world_cup_data.json` and busts the cache
- Clear all stored data (scores, notes, favorites)

### PWA / Offline
- Installable on Android (Chrome) and iOS (Safari)
- Service Worker caches all static assets and match data on first load
- Offline banner shown when network is unavailable; cached data continues to work
- Cache-first for static assets, network-first for match data

### Share Card
- Generates a downloadable PNG card for any completed match (via `html2canvas`)
- Includes teams, flags, score, stadium, and Player of the Match if set
- Falls back to Web Share API on supported devices

---

## Getting Started

### Run locally

```bash
# Any static server works — no build step required
npx serve .
# or
python3 -m http.server 8080
# or
npx http-server . -p 8080
```

Then open `http://localhost:8080` in your browser.

> **Important:** The app must be served over HTTP/HTTPS (not opened as a `file://` URL) for ES modules and the Service Worker to function correctly.

### Install as PWA

**Android (Chrome)**
1. Open the app URL in Chrome
2. Tap the three-dot menu → **Add to Home Screen**

**iOS (Safari)**
1. Open the app URL in Safari
2. Tap the Share icon → **Add to Home Screen**

---

## Project Structure

```
CupVerse/
├── index.html              # App shell — topbar, bottom nav, script tags
├── manifest.json           # PWA manifest (icons, theme, display mode)
├── sw.js                   # Service Worker — cache-first static, network-first data
├── world_cup_data.json     # All match, team, venue, and player data
│
├── css/
│   └── styles.css          # Full design system — tokens, components, responsive
│
├── js/
│   ├── app.js              # Entry point — init, routing, event delegation
│   ├── router.js           # Hash-based SPA router (parseRoute / navigateTo)
│   ├── data.js             # Data layer — loadMatches, queries, getGroupStandings
│   ├── storage.js          # localStorage — scores, notes, scorers, settings, favorites
│   ├── ui.js               # All render functions — one per screen
│   ├── countdown.js        # Reusable live countdown utility (HH:MM:SS)
│   └── shareCard.js        # PNG share card generator via html2canvas
│
└── assets/
    ├── icons/              # PWA icons: 72 / 96 / 128 / 144 / 152 / 192 / 384 / 512px
    └── placeholder-stadium.jpg
```

---

## Architecture

CupVerse is a zero-dependency, zero-build vanilla JS SPA.

| Concern | Approach |
|---|---|
| Routing | Hash-based (`#home`, `#matches`, `#standings`, `#match/42`, …) |
| State | `localStorage` only — no server, no accounts |
| Data | Single `world_cup_data.json` fetch on startup; cached by SW |
| Rendering | String-template HTML injected into `<main id="app">` |
| Events | Single delegated listener on `document.body` via `data-action` attributes |
| Offline | Service Worker with cache-first (assets) / network-first (data) strategy |
| Styling | CSS custom properties + glassmorphism; zero runtime CSS-in-JS |

### Data Flow

```
world_cup_data.json
       │
       ▼
   data.js          ← enrichMatch(), resolveStatus(), getGroupStandings()
       │
       ▼
    ui.js           ← renderHomeDashboard(), renderStandings(), renderMatchDetail(), …
       │
       ▼
   app.js           ← routes hash changes → calls render fn → injects into #app
       │
       ▼
  storage.js        ← scores, notes, favorites read/written on user actions
```

### Routes

| Hash | Screen |
|---|---|
| `#home` | Home dashboard |
| `#matches` | All fixtures with filters |
| `#standings` | Group point tables (A–L) |
| `#teams` | 48-team browser |
| `#calendar` | Date-by-date match browser |
| `#scorers` | Manual top scorers leaderboard |
| `#settings` | Theme, timezone, data controls |
| `#match/:id` | Match detail, score entry, notes, share |

---

## Data Reference

### Tournament
| Stat | Value |
|---|---|
| Teams | 48 |
| Groups | 12 (A – L, 4 teams each) |
| Total matches | 105 |
| Group stage matches | 72 |
| Host countries | USA, Canada, Mexico |
| Venues | 16 cities |
| Start date | June 11, 2026 |
| Final | July 19, 2026 |

### Match object shape (`world_cup_data.json`)

```json
{
  "id": 1,
  "stage": "Group Stage",
  "group": "A",
  "homeTeam": "Mexico",
  "awayTeam": "South Africa",
  "datetime": "2026-06-11T20:00:00",
  "venue": "SoFi Stadium, Inglewood",
  "venueInfo": {
    "name": "SoFi Stadium",
    "fullName": "SoFi Stadium",
    "city": "Inglewood",
    "country": "USA",
    "flag": "🇺🇸",
    "capacity": 70240,
    "surface": "Natural Grass",
    "opened": 2020
  }
}
```

### localStorage keys

| Key | Contents |
|---|---|
| `wc2026_scores` | `{ [matchId]: { home, away } }` |
| `wc2026_notes` | `{ [matchId]: { text, photos[], updatedAt } }` |
| `wc2026_scorers` | `[{ id, playerName, team, goals, assists }]` |
| `wc2026_settings` | `{ theme, timezone, favoriteTeams[] }` |
| `wc2026_favorites` | `[matchId, …]` — starred matches |
| `wc2026_ai` | `boolean` — AI insights toggle |

---

## Design System

Defined in `css/styles.css` as CSS custom properties.

### Color Tokens

| Token | Value | Use |
|---|---|---|
| `--bg-primary` | `#0B1220` | Page background |
| `--bg-secondary` | `#0F1A2E` | Alternate background |
| `--bg-card` | `rgba(255,255,255,0.05)` | Glass card fill |
| `--accent-blue` | `#4DA3FF` | Primary interactive |
| `--accent-gold` | `#F5C542` | Gold / favourites |
| `--accent-success` | `#3DDC97` | Completed / qualifies |
| `--accent-live` | `#FF4D4D` | Live match dot |
| `--text-primary` | `#FFFFFF` | Body text |
| `--text-secondary` | `#AAB4C5` | Secondary text |
| `--text-muted` | `#6B768A` | Captions, metadata |

### Spacing (8pt grid)
`4px` · `8px` · `12px` · `16px` · `24px` · `32px` · `48px` · `64px`

### Radius
`--radius-sm: 8px` · `--radius-md: 12px` · `--border-radius: 16px` · pill: `999px`

### Motion
- Card hover: `scale(1.02)` + blue glow shadow
- Transition: `0.2s ease`
- Live badge: CSS keyframe pulse on dot indicator

---

## JS Module API

### `data.js`

| Function | Description |
|---|---|
| `loadMatches(forceReload?)` | Fetches and caches `world_cup_data.json`; falls back to SW cache |
| `getMatches()` | All 105 enriched match objects |
| `getMatchById(id)` | Single match by ID |
| `getNextMatch()` | Nearest future match by datetime |
| `getTodaysMatches()` | Matches whose date matches today |
| `getMatchesByDate(dateStr)` | Matches on a given `YYYY-MM-DD` |
| `getAllMatchDates()` | Sorted array of all unique match dates |
| `getTournamentStats()` | `{ totalMatches, played, upcoming, remainingDays, progress }` |
| `getTeams()` | All 48 teams with flag, FIFA rank, group |
| `getTeamSquad(teamName)` | Player name array for a team |
| `getTeamNextMatch(teamName)` | Next upcoming match for a team |
| `getGroupStandings(storedScores)` | Group point tables derived from match scores |

### `storage.js`

| Function | Description |
|---|---|
| `getScore(matchId)` / `setScore` / `clearScore` | Manual score CRUD |
| `getAllScores()` | All stored scores as `{ [id]: { home, away } }` |
| `getNote(matchId)` / `setNote` | Match notes with photo attachments |
| `getTopScorers()` / `addTopScorer` / `removeTopScorer` | Scorer leaderboard |
| `getFavTeams()` / `toggleFavTeam` / `isFavTeam` | Favourite team set |
| `getFavoriteMatches()` / `toggleFavoriteMatch` | Starred matches set |
| `getTheme()` / `setTheme` | `'dark'` or `'light'` |
| `getTimezone()` / `setTimezone` | IANA timezone string |
| `isAiEnabled()` / `setAiEnabled` | AI insights toggle |
| `clearStorage()` | Wipes all app data from localStorage |

---

## Deployment

The app is a static folder — deploy anywhere that serves files over HTTPS.

```bash
# Netlify (drag-and-drop or CLI)
netlify deploy --dir . --prod

# Vercel
vercel .

# GitHub Pages
# Push to a repo, enable Pages from the root of main branch

# Firebase Hosting
firebase deploy
```

> The Service Worker requires HTTPS. `localhost` is the only HTTP exception browsers allow.

---

## Offline Behaviour

On first load the Service Worker caches:
- `index.html`, `css/styles.css`, all `js/*.js` files
- `world_cup_data.json`, `manifest.json`, `assets/`

On subsequent loads:
- Static assets are served from cache (cache-first)
- `world_cup_data.json` attempts network first, falls back to cache
- An orange banner appears at the top when the device is offline

When **Refresh Data** is clicked in Settings:
```js
fetch('/world_cup_data.json', { cache: 'reload' })
```
This bypasses the SW cache, re-fetches fresh data, and re-renders the current screen.

---

## Lighthouse Targets

| Category | Target |
|---|---|
| Performance | ≥ 95 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| PWA | ≥ 95 |

---

## Roadmap

### Phase 2
- Live scores via public API
- Push notifications for match start / full-time
- Team detail pages
- Stadium pages with photos
- Live group standings auto-update

### Phase 3
- Fantasy squad builder
- Prediction league with scoring
- User accounts + cross-device sync
- AI match forecasts (LLM-backed)

---

## License

MIT — free to use, fork, and deploy.

---

*CupVerse v2.0 · Built with vanilla JS, zero dependencies, zero build step.*
