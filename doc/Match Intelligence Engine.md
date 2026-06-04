# CupVerse Match Intelligence Engine Specification

## Overview

The Match Intelligence Engine enriches every FIFA World Cup 2026 group-stage fixture with historical context, head-to-head records, venue insights, AI-generated storylines, and predictive analytics.

The objective is to transform every fixture page into a rich football knowledge hub rather than a simple score page.

---

# Data Sources

## 1. Head-to-Head Records

Primary Sources:

* The Soccer World Cups Head-to-Head Database
* Team-specific pages such as:

```text
https://www.thesoccerworldcups.com/national_teams/argentina_head_to_head.php
https://www.thesoccerworldcups.com/national_teams/brazil_head_to_head.php
https://www.thesoccerworldcups.com/national_teams/france_head_to_head.php
...
```

The system should automatically generate source URLs using:

```javascript
https://www.thesoccerworldcups.com/national_teams/{slug}_head_to_head.php
```

for every qualified nation.

---

## 2. Match Results (All Competitions)

Sources:

* FIFA
* UEFA
* CONMEBOL
* AFC
* CAF
* CONCACAF
* OFC
* Football-Data APIs
* Transfermarkt
* RSSSF

Collected Data:

* Match date
* Competition
* Venue
* Final score
* Attendance
* Goalscorers (optional)
* Match significance

---

## 3. Venue Information

Sources:

* FIFA venue pages
* Official stadium websites
* Host city tourism boards
* Wikipedia (verification only)

Collected Data:

* Stadium name
* Capacity
* Opening year
* Altitude
* Surface type
* Host city
* Previous World Cups hosted
* Notable matches
* Architectural facts

---

# Match Intelligence Content Structure

Every World Cup 2026 fixture should generate the following structure.

```json
{
  "match_id": "",
  "home_team": "",
  "away_team": "",

  "head_to_head": {
    "all_time": {
      "played": 0,
      "home_wins": 0,
      "draws": 0,
      "away_wins": 0,
      "goals_home": 0,
      "goals_away": 0
    },

    "last_meetings": [
      {
        "date": "",
        "competition": "",
        "score": ""
      }
    ]
  },

  "world_cup_history": [],

  "interesting_facts": [],

  "venue_trivia": []
}
```

---

# Match Intelligence Example

## Argentina vs Mexico

### Head-to-Head

Overall Record:

* Matches: 36
* Argentina Wins: 19
* Draws: 12
* Mexico Wins: 5

### Recent Meetings

| Date        | Competition    | Result               |
| ----------- | -------------- | -------------------- |
| 26 Nov 2022 | FIFA World Cup | Argentina 2–0 Mexico |
| 11 Sep 2019 | Friendly       | Argentina 4–0 Mexico |
| 20 Nov 2018 | Friendly       | Argentina 2–0 Mexico |
| 16 Nov 2018 | Friendly       | Argentina 2–0 Mexico |
| 08 Sep 2015 | Friendly       | Argentina 2–2 Mexico |

---

### World Cup History

Argentina has defeated Mexico in all four FIFA World Cup meetings.

Previous World Cup Encounters:

| Year | Stage       | Result        |
| ---- | ----------- | ------------- |
| 1930 | Group Stage | Argentina Win |
| 2006 | Round of 16 | Argentina Win |
| 2010 | Round of 16 | Argentina Win |
| 2022 | Group Stage | Argentina Win |

---

### Match Trivia

* Lionel Messi scored a decisive goal against Mexico during Qatar 2022.
* Mexico has never eliminated Argentina from a FIFA World Cup.
* Their first World Cup meeting occurred in 1930.
* Argentina have historically dominated this matchup at World Cups.

---

### Venue Trivia

* First stadium to host FIFA World Cup matches in three different tournaments.
* Hosted the 1970 FIFA World Cup Final.
* Hosted the 1986 FIFA World Cup Final.
* Considered one of football's most iconic venues.
* Hosted numerous legendary matches involving Pelé and Diego Maradona.

---

# Automating All 72 Group Stage Matches

The system must automatically enrich every fixture.

---

## Step 1: Team Registry

Create:

```json
[
  {
    "name": "Argentina",
    "slug": "argentina",
    "h2h_source": "https://www.thesoccerworldcups.com/national_teams/argentina_head_to_head.php"
  }
]
```

Repeat for every qualified nation.

Example:

```json
[
  {
    "name": "Argentina",
    "slug": "argentina"
  },
  {
    "name": "Brazil",
    "slug": "brazil"
  },
  {
    "name": "France",
    "slug": "france"
  },
  {
    "name": "Germany",
    "slug": "germany"
  }
]
```

The crawler should dynamically generate source URLs.

---

## Step 2: Head-to-Head Crawler

For every team:

```javascript
scrapeTeamHeadToHead(team);
```

Extract:

* Opponent
* Matches Played
* Wins
* Draws
* Losses
* Goals For
* Goals Against

Store:

```json
{
  "Argentina": {
    "Mexico": {
      "played": 4,
      "wins": 4,
      "draws": 0,
      "losses": 0,
      "goals_for": 10,
      "goals_against": 2
    }
  }
}
```

---

## Step 3: Fixture Enrichment Engine

Input:

```text
Argentina vs Mexico
```

Pipeline:

1. Fetch head-to-head data
2. Fetch last five meetings
3. Fetch World Cup meetings
4. Fetch venue information
5. Fetch stadium trivia
6. Generate AI storyline
7. Generate rivalry score
8. Generate prediction indicators
9. Build match intelligence page

Output:

```json
{
  "headline": "Argentina seek to extend their unbeaten World Cup record against Mexico",

  "h2h": {},

  "last5": [],

  "worldCupHistory": [],

  "trivia": [],

  "venue": {}
}
```

---

# AI Storyline Generator

For every fixture generate:

## Headline

Example:

```text
Argentina seek to extend their unbeaten World Cup record against Mexico.
```

## Narrative

Example:

```text
Argentina enter this fixture with a perfect World Cup record against Mexico.
Despite Mexico's competitive performances in recent years, history has consistently favored the South American giants.
```

---

# Rivalry Meter

Automatically classify:

```text
★★★★★ Historic Rivalry
★★★★☆ Major Rivalry
★★★☆☆ Competitive Matchup
★★☆☆☆ Occasional Meeting
★☆☆☆☆ Rare Meeting
```

Calculation Factors:

* Total meetings
* Competitive matches
* World Cup encounters
* Knockout encounters
* Historic significance

---

# World Cup History Meter

Display:

```text
Previous World Cup Meetings: 4
Knockout Meetings: 2
Group Stage Meetings: 2
Final Meetings: 0
```

---

# Venue Snapshot

Display:

```json
{
  "stadium": "",
  "city": "",
  "capacity": 0,
  "opened": 0,
  "altitude": "",
  "surface": "",
  "world_cups_hosted": [],
  "famous_matches": []
}
```

Rendered Card:

```text
Capacity: 87,523
Opened: 1966
Altitude: 2,240m
World Cups Hosted: 1970, 1986, 2026

Famous Matches:
- 1970 Final
- 1986 Final
- Maradona's Goal of the Century
```

---

# Prediction Factors

Display:

| Factor                   | Team A | Team B |
| ------------------------ | ------ | ------ |
| FIFA Ranking             |        |        |
| ELO Ranking              |        |        |
| Recent Form              |        |        |
| Goals Scored (Last 10)   |        |        |
| Goals Conceded (Last 10) |        |        |
| Clean Sheets             |        |        |
| H2H Advantage            |        |        |
| World Cup Experience     |        |        |

---

# Advanced Statistics

Optional Premium Features

### Form Index

```text
WWDWW
```

### Goal Trend

```text
Scored in 9 of last 10 matches
```

### Clean Sheet Rate

```text
50%
```

### Possession Average

```text
61%
```

### Tournament Experience

```text
World Cup Appearances: 18
Best Finish: Champions
```

---

# Build-Time Generation Strategy

The Match Intelligence Engine should run during build time.

Benefits:

* Fast loading
* SEO friendly
* Offline PWA support
* Reduced API calls
* Consistent content

Generated Files:

```text
/data/matches/ARG-MEX.json
/data/matches/BRA-JPN.json
/data/matches/FRA-USA.json
...
```

One enriched JSON file should exist for every group-stage fixture.

---

# Final Objective

Every FIFA World Cup 2026 group-stage fixture should become a complete football intelligence page containing:

* Historical head-to-head records
* Last five meetings
* World Cup history
* Match trivia
* Stadium trivia
* Host city insights
* AI-generated storylines
* Rivalry meter
* World Cup history meter
* Venue snapshot
* Prediction factors
* Advanced team statistics

The result should provide a unique experience where every match tells a story, not just a score.


# Design Guidence 

Please redesign CupVerse to feel closer to:

- FIFA World Cup official experience
- Apple Sports
- OneFootball
- Sofascore
- FotMob
- EA Sports FC Ultimate Team