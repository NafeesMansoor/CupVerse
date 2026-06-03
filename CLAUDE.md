**`CupVerse_Master_Specification.md`**


# CupVerse

## Your Tournament Command Center

---

# 1. Project Overview

## Product Name

**CupVerse**

## Tagline

**Your Tournament Command Center**

## Vision

CupVerse is a premium offline-first football tournament companion designed specifically for major competitions such as FIFA World Cup 2026.

The application should feel like a sports operating system rather than a traditional fixtures website.

The experience must be:

* Fast
* Installable
* Offline capable
* Mobile first
* Touch friendly
* Premium sports broadcast inspired

---

# 2. Core Features

## Home Dashboard

Contains:

### Next Match Hero

Shows:

* Teams
* Flags
* Countdown
* Venue
* Stage

### Today's Matches

Horizontal scrolling cards.

### Tournament Snapshot

Displays:

* Matches played
* Goals scored
* Days remaining
* Tournament progress

### Favorite Team Panel

Displays:

* Favorite team
* Next match
* Team status

---

## Full Fixtures

Features:

* Search
* Group filter
* Stage filter
* Date filter
* Infinite scrolling
* Sticky filter bar

---

## Match Detail

Displays:

* Team information
* Match status
* Countdown
* Score
* Goal scorers
* Stadium information
* Group standings snippet
* Share card generation

---

## Tournament Timeline

Vertical tournament journey.

Shows:

* Group stage
* Round of 16
* Quarterfinals
* Semifinals
* Final

---

## Favorites

Supports:

### Favorite Teams

### Starred Matches

---

## Tournament Overview

Displays:

* Progress tracking
* Statistics
* Group status

---

## Settings

Includes:

* Theme
* Timezone
* Refresh data
* Clear favorites
* Version information

---

## AI Insights Module

Optional.

Can be enabled or disabled.

Provides lightweight match analysis.

---

## Shareable Match Cards

Generate image cards after match completion.

---

# 3. Technical Requirements

## Platform

Progressive Web App (PWA)

Must work on:

* Android
* iPhone
* Tablets
* Desktop

---

## Offline First

Requirements:

* Service Worker
* Local cache
* Cached match data
* Cached assets

---

## Installable

Must support:

### Android

Chrome → Add to Home Screen

### iOS

Safari → Add to Home Screen

---

# 4. Folder Structure

```text
cupverse-pwa/
├── index.html
├── manifest.json
├── sw.js
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── data.js
│   ├── storage.js
│   ├── ui.js
│   ├── countdown.js
│   ├── shareCard.js
│   └── router.js
├── assets/
│   ├── icons/
│   │   ├── icon-72.png
│   │   ├── icon-96.png
│   │   ├── icon-128.png
│   │   ├── icon-144.png
│   │   ├── icon-152.png
│   │   ├── icon-192.png
│   │   ├── icon-384.png
│   │   └── icon-512.png
│   └── placeholder-stadium.jpg
└── data/
    └── matches.json
```

---

# 5. PWA Configuration

## manifest.json

```json
{
  "name": "CupVerse",
  "short_name": "CupVerse",
  "description": "Your World Cup 2026 Command Center",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#0A1128",
  "background_color": "#0A1128",
  "orientation": "portrait",
  "icons": [
    {
      "src": "assets/icons/icon-72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "assets/icons/icon-96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "assets/icons/icon-128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "assets/icons/icon-144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "assets/icons/icon-152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "assets/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "assets/icons/icon-384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "assets/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

# 6. Service Worker

## Strategy

### Static Assets

Cache First

### Match Data

Network First

Fallback to Cache

---

## sw.js

```javascript
const CACHE_NAME = 'cupverse-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/data.js',
  '/js/storage.js',
  '/js/ui.js',
  '/js/countdown.js',
  '/js/shareCard.js',
  '/js/router.js',
  '/data/matches.json',
  '/assets/placeholder-stadium.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', event => {

  if (event.request.url.includes('/data/matches.json')) {

    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, clone));

          return response;
        })
        .catch(() => caches.match(event.request))
    );

  } else {

    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );

  }
});

self.addEventListener('activate', event => {

  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
  );

});
```

---

# 7. Index.html Requirements

Include:

```html
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#0A1128">
```

Register service worker:

```html
<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
</script>
```

---

# 8. Data Architecture

## matches.json

Generate realistic World Cup style dummy data.

Requirements:

### 32 Total Matches Minimum

Include:

* Group A
* Group B
* Group C
* Group D
* Group E
* Group F
* Group G
* Group H

Include:

* Round of 16
* Quarterfinals
* Semifinals
* Final

Date range:

```text
June 12, 2026
to
July 19, 2026
```

---

## Match Schema

```json
{
  "id": "1",
  "stage": "Group A",
  "homeTeam": {
    "name": "Brazil",
    "code": "BRA",
    "flag": "🇧🇷"
  },
  "awayTeam": {
    "name": "Spain",
    "code": "ESP",
    "flag": "🇪🇸"
  },
  "date": "2026-06-12",
  "time": "21:00",
  "stadium": "Lusail Stadium",
  "status": "upcoming",
  "score": null,
  "goals": [],
  "potm": null
}
```

---

# 9. JavaScript Modules

## data.js

Responsibilities:

### Load Matches

```javascript
loadMatches()
```

### Expose Matches

```javascript
getMatches()
```

### Find Match

```javascript
getMatchById(id)
```

### Next Match

```javascript
getNextMatch()
```

### Today's Matches

```javascript
getTodaysMatches()
```

### Tournament Statistics

```javascript
getTournamentStats()
```

---

## storage.js

### Favorite Teams

```javascript
getFavTeams()
addFavTeam()
removeFavTeam()
isFavTeam()
```

### Starred Matches

```javascript
getStarredMatches()
toggleStarredMatch()
```

### Theme

```javascript
getTheme()
setTheme()
```

### AI Toggle

```javascript
isAiEnabled()
setAiEnabled()
```

---

## countdown.js

Create reusable countdown utility.

Displays:

```text
HH:MM:SS
```

Updates continuously.

---

## ui.js

Must implement:

```javascript
renderHomeDashboard()
renderFixtures()
renderMatchDetail()
renderTimeline()
renderFavorites()
renderOverview()
renderSettings()
renderAiInsights()
```

---

## shareCard.js

Uses:

```html
html2canvas
```

Generates:

```text
PNG Share Card
```

Contains:

* Teams
* Flags
* Score
* Stadium
* POTM

---

## router.js

Hash based SPA routing.

Routes:

```text
#home
#fixtures
#match/:id
#timeline
#favorites
#overview
#settings
```

---

# 10. Screen Specifications

---

## Home Dashboard

### Hero Card

Contains:

* Teams
* Countdown
* Stage
* Stadium

---

### Today's Matches

Horizontal scroll.

---

### Tournament Snapshot

Shows:

* Matches Played
* Goals
* Remaining Days

---

### Favorite Team Widget

Displays:

* Team
* Upcoming Match

---

## Fixtures Screen

### Search

Search by:

* Team
* Stadium

---

### Filters

* Group
* Stage
* Date

---

### Layout

Grouped sections:

```text
Group A
Group B
...
Quarterfinals
Semifinals
Final
```

---

## Match Detail

### Header

Shows:

* Flags
* Team Names

---

### Match Information

Shows:

* Venue
* Date
* Time
* Local Time

---

### Status Logic

Upcoming:

```text
Countdown
```

Live:

```text
LIVE
```

Completed:

```text
Final Score
```

---

### Stadium Panel

Expandable.

Displays:

* Capacity
* Weather
* Placeholder Map Link

---

### Group Snapshot

Displays standings.

---

### Actions

Buttons:

* Star Match
* Share Match

---

## Timeline

Vertical timeline.

Color coding:

### Upcoming

Grey

### Live

Cyan

### Completed

Green

---

## Favorites

### Teams

Display:

* Flag
* Team Name
* Next Match

---

### Starred Matches

Card list.

---

## Tournament Overview

### Progress

```text
Matches Played / Total Matches
```

---

### Statistics

Show:

* Goals
* Clean Sheets
* Average Goals
* Top Scorers 

---

### Group Grid

```text
A
B
C
D
E
F
G
H
```

Clickable.

---

## Settings

### Theme

Dark / Light

---

### Timezone

Auto

Manual

---

### Refresh Data

Refetch matches.

---

### Clear Favorites

Reset storage.

---

### Version

Example:

```text
CupVerse v1.0.0
```

---

## AI Insights

Disabled by default.

When enabled:

Example:

```text
Brazil's attacking pace could challenge Spain's possession-heavy approach.
```

Use simple rules engine.

No external AI required.

---

## Share Card

Available after match completion.

Must support:

### Download PNG

### Web Share API

---

# 11. Splash Screen

Show immediately on launch.

Layout:

```text
CupVerse
Loading Matches...
```

Hide after:

```javascript
loadMatches()
```

completes.

---

# 12. Design System

## Color Tokens

```css
:root {
  --bg-deep: #0A1128;
  --bg-surface: rgba(18,25,55,0.7);
  --accent-gold: #F5B042;
  --accent-cyan: #00E5FF;
  --text-primary: #FFFFFF;
  --text-secondary: #B0B8D0;
  --status-upcoming: #6C757D;
  --status-live: #00E5FF;
  --status-completed: #28A745;
  --border-radius-card: 16px;
  --blur-amount: 12px;
}
```

---

## Typography

```css
font-family:
'Inter',
'Segoe UI',
system-ui,
sans-serif;
```

---

## Glassmorphism Card

```css
.glass-card {
  background: var(--bg-surface);
  backdrop-filter: blur(var(--blur-amount));
  border-radius: var(--border-radius-card);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 8px 20px rgba(0,0,0,0.2);
  padding: 16px;
}
```

---

## Horizontal Scroll

```css
.horizontal-scroll {
  display: flex;
  overflow-x: auto;
  gap: 16px;
}
```

---

## Animations

### Tap

```css
transform: scale(0.98);
```

### Hover

```css
transform: translateY(-2px);
```

### Transition

```css
transition: all .25s ease;
```

---

# 13. Offline Support

Requirements:

### Cache

* HTML
* CSS
* JS
* JSON
* Images

---

### Offline Banner

Display:

```text
You are offline – displaying cached data.
```

---

# 14. Data Refresh

When Refresh Data clicked:

```javascript
fetch('/data/matches.json', {
  cache: 'reload'
});
```

Then:

* update cache
* update state
* rerender screen

---

# 15. Performance Targets

### Lighthouse

Target:

```text
Performance > 95
Accessibility > 95
Best Practices > 95
PWA > 95
```

---

### First Load

Under:

```text
2 seconds
```

on mid-range mobile devices.

---

# 16. Future Roadmap

## Phase 2

* Live scores
* Push notifications
* Team pages
* Stadium pages
* Match events
* Live standings

---

## Phase 3

* Fantasy integration
* Prediction league
* User accounts
* Sync across devices
* AI match forecasts

---

# 17. Deployment

Deploy to:

* GitHub Pages
* Netlify
* Vercel
* Firebase Hosting

Local testing:

```bash
npm install -g serve
serve .
```

---

# 18. Acceptance Criteria

The project is complete when:

* PWA installs successfully
* Works offline
* All screens function
* Routing works
* Favorites persist
* Theme persists
* Countdown updates live
* Share cards generate correctly
* Lighthouse PWA audit passes
* Mobile experience is smooth
* Tournament data loads from matches.json
* Refresh Data updates cached content
* CupVerse branding is visible throughout

---

**CupVerse**
**Your Tournament Command Center** 🌍⚽🏆
