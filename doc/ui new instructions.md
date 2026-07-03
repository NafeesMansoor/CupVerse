# CupVerse Dashboard Redesign Specification (Mobile)

## Objective

Redesign the CupVerse dashboard to improve information density, usability, tournament immersion, and daily engagement while preserving the existing content structure.

The dashboard should feel like a World Cup command center rather than a match listing page.

---

# CupVerse Logo Improvements

## Current Issue

The logo appears too high on iPhone devices.

On devices with dynamic island/notch/speaker cutouts, the logo aligns too closely with the speaker area, reducing visibility and polish.

---

## Required Changes

### Logo Size

Increase the CupVerse logo size slightly.

Requirements:

* Approximately 10-15% larger
* Preserve current branding style
* Do not make it oversized or overly expressive
* Maintain premium appearance

### Logo Position

Move logo slightly downward.

Requirements:

* Respect safe-area insets
* Ensure proper visibility on iPhone devices
* Ensure no overlap with speaker/dynamic island areas
* Maintain consistent spacing across Android and iOS

---

# Dashboard Hero Redesign

## Current Issue

The hero card occupies too much space while delivering limited functionality.

The information hierarchy can be improved significantly.

---

# New Dashboard Hero Layout

Replace the current hero with a structured dashboard card.

Layout:

```text
┌─────────────────────────────────┐
│ Analytics │ Countdown │ Actions │
│           │           │         │
│           │           │         │
│           │           │         │
│           │           │ Fixtures│
└─────────────────────────────────┘
```

Three-column layout.

---

# Left Section: Tournament Analytics

Display live tournament statistics.

Examples:

```text
Matches Completed
Total Goals
Live Matches
Remaining Matches
```

Example:

```text
Played: 18
Goals: 47
Live: 2
Remaining: 86
```

Requirements:

* Live API-driven
* Compact presentation
* Automatically updated

---

# Middle Section: Next Match Countdown

Display countdown to the next scheduled match.

Use a standard sports-app countdown layout.

Example:

```text
NEXT MATCH

00
DAYS

03
HRS

15
MIN

36
SEC
```

Requirements:

* No custom styling experiments
* Use widely recognized countdown format
* Large readable numbers
* Focus on clarity

---

# Right Section: Actions Area

Split vertically into two sections.

---

## Top Right Card

Dynamic Action Card

### If PWA Not Installed

Display:

```text
Install CupVerse
```

On click:

Open installation guide screen.

Do not immediately trigger browser installation.

Provide:

* Android instructions
* iPhone instructions
* Desktop instructions

---

### If PWA Already Installed

Display:

```text
Sync Data
```

On click:

Trigger live synchronization process.

System should:

* Check latest tournament data
* Download missing updates
* Update standings
* Update matches
* Update player statistics
* Update Golden Boot race
* Update knockout progression

Display:

```text
Synchronization Complete
```

when successful.

---

## Bottom Right Card

Tournament Fixtures

Display:

```text
Tournament Fixtures
```

On click:

Navigate directly to Calendar / Fixtures page.

Purpose:

Provide one-click access to the complete tournament schedule.

---

# Dashboard Content Ordering

Recommended order:

```text
Dashboard Hero

World Cup Live Center

Golden Boot Race

Upcoming Matches

Tournament Snapshot

Tournament Progress

Tournament Journal
```

---

# Golden Boot Race Improvements

## Current Problem

Player names occasionally include jersey numbers.

Examples:

```text
10 Mbappe
7 Ronaldo
```

This appears unprofessional.

---

## Required Fix

Dashboard and Golden Boot page should display:

```text
Mbappe
Ronaldo
Kane
```

Only player names.

No:

* Jersey numbers
* Internal IDs
* API formatting artifacts

---

# Dashboard Golden Boot Widget

Display:

Top 5 players only.

Example:

```text
1. Mbappe
2. Kane
3. Vinicius Jr
4. Musiala
5. Bellingham
```

Compact format.

---

# Golden Boot Page

Display:

Top 15 players.

Include:

```text
Player
Goals
Team
Matches Played
```

---

# Golden Boot Data Source

Critical Requirement

The Golden Boot leaderboard must be generated exclusively from live tournament data.

Do NOT:

* Use hardcoded data
* Use pre-generated lists
* Use demo data
* Use cached static rankings

Leaderboard should be built dynamically from actual tournament statistics.

Every synchronization should refresh:

* Goals
* Ranking order
* Appearances

---

# Golden Boot Navigation

From dashboard:

```text
View Full List →
```

On click:

Navigate to Golden Boot page.

The Golden Boot page should always display current live standings.

---

# Upcoming Matches Section

Retain current functionality.

Improvements:

* Slightly reduce card height
* Increase visible matches above the fold
* Improve spacing consistency
* Improve typography hierarchy

Do not redesign this section aggressively.

---

# Tournament Snapshot Improvements

Current statistics cards are visually oversized.

Requirements:

* Reduce vertical height
* Increase information density
* Maintain readability

Focus on:

```text
Played
Goals
Live
Remaining
```

---

# Tournament Journal

Retain feature.

Improve presentation.

Example:

```text
World Cup Journal

Predictions
Notes
Match History
Tournament Memories
```

Should feel more personal and premium.

---

# Performance Requirements

The redesigned dashboard must:

* Load quickly
* Preserve current responsiveness
* Maintain offline support
* Respect PWA constraints
* Avoid unnecessary animations

Focus on information hierarchy over visual effects.

---

# Mandatory Validation Before Implementation

Before modifying production code:

The implementation agent must:

1. Review dashboard component architecture.
2. Validate PWA installation detection.
3. Validate synchronization workflow.
4. Validate live data refresh process.
5. Validate Golden Boot API source.
6. Validate mobile responsiveness.
7. Test iPhone safe-area compatibility.
8. Review navigation dependencies.

The agent must explicitly confirm:

```text
✓ Dashboard architecture validated

✓ PWA install detection validated

✓ Synchronization workflow validated

✓ Live data refresh validated

✓ Golden Boot live data validated

✓ Mobile responsiveness validated

✓ iPhone safe-area validated

✓ Ready for implementation
```

No production code should be modified until all validations have been completed successfully.
