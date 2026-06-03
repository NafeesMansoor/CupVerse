# CupVerse

A lightweight, offline-capable PWA for tracking FIFA World Cup 2026 fixtures, teams, and scores — optimized for mobile with full timezone support.

**Tournament:** June 11 – July 19, 2026 · USA · Canada · Mexico

---

## Features

| Screen | Capabilities |
|--------|-------------|
| **Home** | Countdown, tournament stats, 5 upcoming fixtures |
| **Matches** | 105 fixtures · filter by stage, group, team/venue · favorites |
| **Match Detail** | Manual score entry · venue info · squad lineups · notes + photos · PDF export |
| **Teams** | 48 nations · view by group or FIFA rank · favorite teams |
| **Calendar** | Day-by-day date strip with match counts |
| **Top Scorers** | Manual goals/assists tracker per player |
| **Settings** | Timezone picker (device default + full IANA list) |

---

## CupVerse Tech Stack:

Frontend: Vanilla JavaScript (ES6 modules), HTML5, CSS3
Architecture: Progressive Web App (PWA)
Offline/Caching: Service Worker (network-first for data, cache-first for assets)
State Management: LocalStorage (favorites, theme, settings)
Routing: Hash-based SPA (#home, #fixtures, #match/:id, etc.)
UI Components: Glassmorphism cards with CSS animations
Data Layer: Static JSON fixtures (matches.json)
Share Cards: html2canvas library for PNG generation
Deployment: Static hosting (HTTP server, GitHub Pages, Netlify, Vercel, Firebase)
Build Tools: None — zero build step required
Package Manager: None — runs entirely vanilla


---

## Data Model

```typescript
Team       { id, name, group, fifaRank }
Match      { id, group, homeTeam, awayTeam, venue, venueInfo, stage, datetime, homeScore?, awayScore? }
VenueInfo  { name, fullName, city, country, flag, capacity, surface, opened }
MatchScore { matchId, homeScore, awayScore }         // localStorage: wc2026_scores
MatchNote  { matchId, text, photos[], updatedAt }    // localStorage: wc2026_notes
TopScorer  { playerName, team, goals, assists }      // localStorage: wc2026_scorers
Settings   { timezone, favoriteTeams[] }             // localStorage: wc2026_settings
Favorites  Set<matchId>                              // localStorage: wc2026_favorites
```

Match `datetime` values are stored as ISO 8601 with EDT offset (`-04:00`). All display formatting converts to the user's selected timezone via `Intl.DateTimeFormat`.

---


## Data Sources  

### Before the Event Starts or for now

To collect Data regarding the teams, players, venue and other related stuffs, give a deep dive in the internet. 
Some useful sources are
- https://en.wikipedia.org/wiki/2026_FIFA_World_Cup
- https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026
- https://nynjfwc26.com/


### During Event

During the tournament, use any free and reliable portal that provides api to collect statistics of the matches. You may consider
https://www.football-data.org

## Design System

All design tokens are CSS custom properties in [`app/globals.css`](app/globals.css):

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0f0f13` | Page background |
| `--bg-card` | `#1e1e2a` | `.glass` cards |
| `--bg-elevated` | `#252535` | Inputs, selects |
| `--accent-blue` | `#3b6fd4` | Buttons, active states |
| `--accent-blue-bright` | `#5b8ef4` | Links, highlights |
| `--text-primary` | `#f0f0f5` | Body text |
| `--text-muted` | `#666680` | Labels, metadata |

The `.glass` utility class applies `bg-card` + `border` + `border-radius: 16px` — the base for all cards.

Groups A–L each have a distinct color set in `utils.ts → getGroupColor()`.

---

## PWA Notes

- `manifest.json` sets `display: standalone` and `orientation: portrait-primary`
- Theme color: `#0f0f13` (matches `--bg-primary`)
- Service worker provided by `next-pwa` — configured in `next.config.ts`
- All schedule data is embedded in the JS bundle at build time, so the app works fully offline after first load

---


## UI Theme Direction: FIFA World Cup 2026 Vibe

The entire user interface should reflect the atmosphere, energy, and visual identity inspired by the FIFA World Cup 2026. The design must feel global, modern, and stadium-like, with a strong sense of anticipation and competition.

The visual language should include:

- A bold, high-energy sports aesthetic with a premium broadcast feel
- Dynamic gradients and subtle motion-inspired elements that evoke stadium lighting and night matches
- Clean typography with strong hierarchy, similar to live sports dashboards and tournament broadcasts
- A color palette inspired by international football culture, focusing on deep blues, vibrant greens, and accent tones that feel electric and celebratory
- Subtle references to global unity and multi-host tournament spirit without cluttering the UI

The interface should feel like a live tournament command center, where every screen resembles a match-day experience. Data presentation should feel real-time, fast, and immersive, as if users are tracking a global event as it unfolds.

Avoid overly corporate or static UI styles. The experience should feel alive, competitive, and emotionally engaging, similar to watching a World Cup broadcast rather than browsing a typical app.


## Key Implementation Notes


- **Static data at build time:** `data.json` is imported directly into server components — zero runtime API calls for core schedule data
- **Score/notes are local-only:** No sync between devices; all user data lives in `localStorage`
- **Timezone handling:** Match times are stored with EDT offset; `formatMatchTime()` / `formatTimeOnly()` in `utils.js` re-project to any IANA timezone on render
- **PDF export:** Lazy-imported (`await import("jspdf")`) to keep initial bundle small; generates a formatted match report with score, summary, notes, and photos
- **Match summary generator:** `generateMatchSummary()` in `utils.js` produces natural-language text based on scoreline and stage — used in match detail and PDF export
- **`"knockout"` as alias:** `data.json` uses `"knockout"` for fixtures whose specific round is not yet confirmed. These matches surface under any knockout-stage filter pill (Round of 32 → Final) via the `KNOCKOUT_STAGES` set in `MatchesClient`. Once the tournament progresses and the data is updated with specific stage names, no code change is required — the alias simply stops matching
