# CupVerse — World Cup 2026 Stadium Virtual Tour

A cinematic, editorial-style virtual tour of all 16 FIFA World Cup 2026 stadiums across the United States, Mexico, and Canada.

---

## Project Structure

```
cupverse/
├── index.html              ← Main page (open this in a browser)
├── css/
│   └── styles.css          ← All styles (dark cinematic theme)
├── js/
│   ├── stadiums-data.js    ← Stadium data, stats, descriptions
│   └── app.js              ← Application logic & interactivity
└── README.md
```

---

## How to Run

Simply open `index.html` in any modern browser (Chrome, Firefox, Safari, Edge).

**No server required.** All JavaScript, CSS, and fonts are loaded locally or from Google Fonts CDN. Stadium images are loaded from Wikimedia Commons (requires internet).

> **Tip:** For best results, serve via a local web server:
> ```bash
> # Python 3
> cd cupverse
> python3 -m http.server 8080
> # Then open http://localhost:8080
> ```

---

## Features

- **Cinematic dark theme** with gold editorial accents
- **Animated loader** with CupVerse branding
- **Hero section** with animated statistics counter
- **Country filter** — filter by USA / Mexico / Canada
- **Grid & List view** toggle
- **Detailed modal** for each stadium with:
  - Full-size hero image
  - Stats (capacity, opened, WC matches, surface type)
  - Home teams
  - Rich description
  - Key facts
  - Prev/Next navigation + keyboard support (← → ESC)
- **Country band navigation** — click a host nation to filter
- **Fully responsive** — mobile, tablet, desktop
- **Keyboard accessible** — arrow keys navigate modal, ESC to close

---

## Stadiums Covered

| # | Stadium | City | Country | Capacity |
|---|---------|------|---------|----------|
| 1 | Estadio Azteca | Mexico City | Mexico 🇲🇽 | 83,000 |
| 2 | MetLife Stadium | East Rutherford, NJ | USA 🇺🇸 | 82,500 |
| 3 | AT&T Stadium | Arlington, TX | USA 🇺🇸 | 94,000 |
| 4 | SoFi Stadium | Inglewood, CA | USA 🇺🇸 | 70,000 |
| 5 | Mercedes-Benz Stadium | Atlanta, GA | USA 🇺🇸 | 75,000 |
| 6 | Arrowhead Stadium | Kansas City, MO | USA 🇺🇸 | 76,416 |
| 7 | NRG Stadium | Houston, TX | USA 🇺🇸 | 72,220 |
| 8 | Hard Rock Stadium | Miami Gardens, FL | USA 🇺🇸 | 65,000 |
| 9 | Gillette Stadium | Foxborough, MA | USA 🇺🇸 | 65,878 |
| 10 | Lincoln Financial Field | Philadelphia, PA | USA 🇺🇸 | 69,176 |
| 11 | Levi's Stadium | Santa Clara, CA | USA 🇺🇸 | 71,000 |
| 12 | Lumen Field | Seattle, WA | USA 🇺🇸 | 69,000 |
| 13 | Estadio Akron | Zapopan, Jalisco | Mexico 🇲🇽 | 48,000 |
| 14 | Estadio BBVA | Guadalupe, NL | Mexico 🇲🇽 | 53,500 |
| 15 | BC Place | Vancouver, BC | Canada 🇨🇦 | 54,000 |
| 16 | BMO Field | Toronto, ON | Canada 🇨🇦 | 45,000 |

---

## Branding

**CupVerse** — Every Pitch. Every Story.

Design language: Cinematic dark / editorial magazine with Bebas Neue display type and Barlow Condensed body type, gold accent palette.

---

## Data Sources

- Stadium stats: [Olympics.com — FIFA World Cup 2026 Stadiums](https://www.olympics.com/en/news/fifa-world-cup-2026-full-list-stadiums-mexico-canada-usa)
- Images: [Wikimedia Commons](https://commons.wikimedia.org) (CC-BY-SA / Public Domain)
- Fonts: [Google Fonts](https://fonts.google.com) — Bebas Neue, Barlow Condensed, Barlow
