# CupVerse Feature Specification: Dynamic Prediction Tree & Global Responsiveness Improvements

## Overview

Introduce a fully interactive **Prediction Tree (Tournament Bracket)** that allows users to visualize the knockout stage progression and predict tournament outcomes.

The Prediction Tree should be accessible from:

* Home Page
* Standings Page

The tree must dynamically adapt as tournament results become available and automatically update the bracket structure throughout the FIFA World Cup 2026 tournament.

Additionally, a comprehensive responsiveness audit and redesign must be implemented across the entire application, with particular focus on the Home Hero Card and Standings Page cards.

---

# Feature 1: Dynamic Prediction Tree

## Entry Points

### Home Page

Add a prominent action button within the Hero Section:

```text
🏆 Prediction Tree
```

### Standings Page

Add a secondary action button near the page header:

```text
View Prediction Tree
```

Both buttons should navigate to:

```text
#/prediction-tree
```

---

# Prediction Tree Page

## Purpose

Provide users with a complete visual representation of:

* Round of 32
* Round of 16
* Quarter Finals
* Semi Finals
* Third Place Match
* Final
* Champion

The structure should closely resemble official FIFA knockout brackets.

---

# Dynamic Bracket Generation

## Data Source

The bracket must not be hardcoded.

Instead, it should be generated dynamically from:

### Group Standings

Example:

```text
Group A Winner
Group A Runner-Up

Group B Winner
Group B Runner-Up
```

### Official FIFA Knockout Mapping

Example:

```text
A1 vs B2
C1 vs D2
E1 vs F2
...
```

---

# Tournament Progression Logic

As results become available:

### Before Knockout Stage

Display:

```text
Argentina (Projected)
vs
France (Projected)
```

### During Knockout Stage

Display:

```text
Argentina
2 - 1

France
```

### After Completion

Advance winner automatically:

```text
Argentina
```

to the next round.

---

# Prediction Modes

## Mode 1: Official Tournament Bracket

Default mode.

Displays actual tournament progression.

Updates automatically from API results.

---

## Mode 2: User Prediction Mode

Allow users to create their own prediction path.

Features:

* Tap team
* Advance selected team
* Continue through bracket
* Predict champion

Save locally.

```javascript id="kpjrxn"
localStorage.predictionTree
```

No login required.

---

# Visual Design

## Desktop

```text
Round of 32
    │
Round of 16
    │
Quarter Finals
    │
Semi Finals
    │
Final
    │
Champion
```

Horizontal FIFA-style bracket.

---

## Tablet

Condensed bracket.

Horizontal scroll allowed.

Smooth touch scrolling.

---

## Mobile

Vertical-first design.

Avoid tiny text.

Allow swipe navigation.

Rounds should collapse/expand.

Example:

```text
▶ Round of 32

▶ Round of 16

▶ Quarter Finals

▶ Semi Finals

▶ Final

🏆 Champion
```

---

# Champion Section

Display prominently.

Example:

```text
🏆 Predicted Champion

Argentina
```

or

```text
🏆 World Champion

Argentina
```

depending on tournament state.

---

# Live Tournament Adaptation

The bracket must automatically react to:

* Completed matches
* Updated standings
* Knockout qualification
* Team eliminations
* Match postponements
* Extra-time results
* Penalty shootouts

The bracket should never require manual maintenance.

---

# Animation Guidelines

### Winner Advancement

Animate progression:

```text
Winner → Next Round
```

using:

* Slide animation
* Fade transition
* Smooth bracket redraw

---

### Champion Reveal

When champion is determined:

* Trophy animation
* Confetti effect
* Highlight champion card

without excessive visual clutter.

---

# Feature 2: Global Responsiveness Audit

## Objective

Every screen must work flawlessly from:

```text
320px
to
2560px+
```

without overflow, clipping, overlapping content, or horizontal scrolling.

---

# Home Page Improvements

## Hero Card Redesign

Current hero card should be fully responsive.

Requirements:

### Large Displays

Content must scale proportionally.

Avoid oversized countdown numbers.

Prevent card stretching.

Maintain balanced whitespace.

---

### Tablet

Stack content intelligently.

Preserve visual hierarchy.

---

### Mobile

Hero card becomes single-column.

Example:

```text
FIFA World Cup 2026

Tournament Countdown

[Countdown]

[Next Match]

[Prediction Tree]
```

No element may overflow card boundaries.

---

## Countdown Behavior

Requirements:

* Digits always remain inside card
* Fluid typography
* Auto-scaling font sizes
* No clipping
* No overflow

Use:

```css id="cim6jq"
clamp()
```

for responsive sizing.

---

# Standings Page Improvements

## Card Responsiveness

Current standings cards must adapt smoothly.

### Desktop

Multi-column layout.

### Tablet

Two-column layout.

### Mobile

Single-column layout.

---

## Team Information

Ensure:

* Long country names wrap correctly
* Flags remain aligned
* Statistics remain readable

Example:

```text
Bosnia
P 3
W 2
D 1
L 0
Pts 7
```

Never allow horizontal overflow.

---

## Card Height Consistency

Cards within the same row should maintain visual balance.

Avoid:

* uneven heights
* broken grids
* stretched cards

---

# Responsive Design Requirements

Apply throughout the application.

## Must Support

### Mobile

```text
320px
360px
375px
390px
414px
```

### Tablet

```text
768px
820px
1024px
```

### Desktop

```text
1280px
1440px
1920px
2560px+
```

---

# Performance Requirements

The Prediction Tree must:

* Render instantly
* Support offline mode
* Use cached tournament data
* Minimize re-renders
* Maintain 60fps animations

---

# Acceptance Criteria

### Prediction Tree

* Accessible from Home Page
* Accessible from Standings Page
* Fully dynamic bracket generation
* Auto-updates throughout tournament
* Supports user predictions
* Stores predictions locally
* Responsive on all devices
* FIFA-style visual presentation

### Responsiveness

* No overflow anywhere in the app
* No clipped text
* No horizontal scrolling
* Home Hero Card fully responsive
* Standings Cards fully responsive
* Mobile-first implementation
* Consistent spacing and alignment across all breakpoints

The final experience should feel like a premium World Cup companion app, combining live tournament progression, interactive prediction mechanics, and flawless responsiveness across every device size.
