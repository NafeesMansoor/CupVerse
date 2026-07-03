# CupVerse Team Squad Intelligence System

## Objective

Transform the Team Page from a simple national team overview into a comprehensive squad intelligence hub by displaying rich player information for every national team participating in FIFA World Cup 2026.

The Squad section should become one of the flagship features of CupVerse.

---

# Data Acquisition Strategy

## Required Player Attributes

For every player in every national team squad, collect and maintain:

### Core Information

```text
Full Name
Short Name
Player Photo
Jersey Number
Position
Date of Birth
Age
Nationality
Preferred Foot
Height
Weight
```

### Football Information

```text
Current Club
Club Logo
Caps
International Goals
Appearances
Captain Status
Vice Captain Status
```

### Advanced Information

```text
Market Value (if available)
World Cup Appearances
Major Trophies
Injury Status
Availability Status
```

The squad database should support future expansion without structural changes.

---

# Data Source Requirements

CupVerse should automatically retrieve squad information using football APIs capable of providing:

```text
Player Name
Photo
Jersey Number
Position
Age
Team Association
```

Modern football data providers typically expose squad endpoints that return current team rosters together with player metadata, including jersey numbers, positions, and player photos.

The architecture should be provider-agnostic.

Possible providers:

* API-Football
* SportMonks
* SportsDataAPI
* Other FIFA-compatible football APIs

The implementation must allow switching providers without redesigning the UI.

---

# Squad Data Caching

To reduce API calls:

```text
Cache Squad Data
Duration: 24 Hours
```

Refresh:

```text
Daily
Before Match Day
Manual Refresh
```

Store:

```text
IndexedDB
Local Storage
Service Worker Cache
```

for offline access.

---

# Team Page Redesign

## Current Tabs

```text
Overview
Fixtures
Results
Stats
```

Add:

```text
Squad
```

---

# Squad Tab Layout

## Header Section

Display:

```text
Team Flag
Team Name
FIFA Ranking
Coach
Captain
Squad Size
Average Age
```

---

# Squad Search

Add instant filtering.

Example:

```text
🔍 Search Player
```

Supports:

* Name
* Jersey Number
* Position

---

# Squad Filters

### Position Filter

```text
All
Goalkeepers
Defenders
Midfielders
Forwards
```

### Club Filter

```text
Manchester City
Real Madrid
Barcelona
Liverpool
...
```

---

# Squad View Modes

## Card View (Default)

Modern player cards.

Example:

```text
┌──────────────────┐
│ Player Photo     │
│ #10              │
│ Lionel Messi     │
│ Forward          │
│ Inter Miami      │
└──────────────────┘
```

---

## List View

Compact mode.

Example:

```text
#10  Lionel Messi      FW
#22  Lautaro Martinez  FW
#24  Enzo Fernandez    MF
```

Useful for mobile users.

---

# Player Card Design

Each player card displays:

### Top Section

```text
Player Photo
```

### Overlay

```text
Jersey Number
```

Large and visually prominent.

---

### Information Section

```text
Full Name
Position
Age
Club
```

---

### Indicators

Show badges:

```text
Captain
Vice Captain
Injured
Suspended
```

---

# Player Details Modal

Clicking a player opens:

```text
#/player/:id
```

or modal view.

---

# Player Profile

## Hero Section

Display:

```text
Large Photo
Name
Jersey Number
Position
Nationality
```

---

## Personal Information

```text
Date of Birth
Age
Height
Weight
Preferred Foot
```

---

## International Career

```text
Caps
Goals
Assists
Debut Date
```

---

## Current Club

Display:

```text
Club Name
Club Logo
League
Country
```

---

## Tournament Statistics

Dynamic during World Cup:

```text
Matches Played
Minutes Played
Goals
Assists
Yellow Cards
Red Cards
Average Rating
```

---

# Visual Formation View

Add a second squad visualization.

Button:

```text
View Formation
```

---

## Formation Screen

Render probable lineup.

Example:

```text
4-3-3
```

Visual layout:

```text
           Martinez

 Gonzalez   Messi   Alvarez

      Enzo    De Paul

           Mac Allister

Tagliafico Romero Otamendi Molina

         Emiliano Martinez
```

Player photos shown.

---

# Team Chemistry View

Optional advanced feature.

Visualize:

```text
Club Connections
League Connections
Previous Tournament Connections
```

This creates a unique analytical experience.

---

# Mobile Experience

### Mobile Cards

Two-column layout.

Example:

```text
[Photo] Messi
#10 FW

[Photo] Alvarez
#9 FW
```

---

### Small Devices

Single-column layout.

No horizontal scrolling.

Touch-friendly interactions.

---

# Offline Support

The Squad section must remain accessible when offline.

Display:

```text
Showing Cached Squad Data
Last Updated: xx hours ago
```

The PWA should gracefully use cached player information when the network is unavailable.

---

# Performance Requirements

### Lazy Loading

Do not load all player photos immediately.

Load:

```text
Visible Players First
```

Use:

```text
Intersection Observer
```

for image loading.

---

# Image Optimization

Player photos should:

* Use WebP when available
* Use responsive image sizes
* Use placeholder skeletons during loading

---

# Future AI Features

The squad architecture should support future additions such as:

### Player Comparison

```text
Messi vs Mbappe
```

### Best XI Generator

```text
Tournament Best XI
```

### Player Similarity Engine

```text
Players Similar To Bellingham
```

### Injury Impact Analysis

```text
How much does a missing player affect team strength?
```

---

# CupVerse Signature Enhancement

Add a dedicated section:

```text
⭐ Key Players
```

Automatically identify:

* Most Valuable Player
* Captain
* Top Scorer
* Rising Star

for each national team.

This section should appear at the top of the Squad tab and update dynamically as the tournament progresses.

---

# Acceptance Criteria

✅ Every national team has a complete squad page

✅ Player photo available

✅ Full player name available

✅ Jersey number displayed prominently

✅ Position displayed

✅ Search and filtering supported

✅ Player profile modal/page supported

✅ Responsive on mobile, tablet and desktop

✅ Offline-capable through PWA caching

✅ Lazy-loaded images

✅ Dynamic World Cup statistics support

✅ Extensible architecture for future AI-driven player analysis features
