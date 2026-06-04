# Design System (Ready to Build)

## 1. 🎯 Design Philosophy

### Core Principles
- “Control center, not scoreboard”
- Calm premium sports OS feel
- Minimal cognitive load
- Fast scan, instant understanding
- Emotion through spacing and typography, not decoration

## 2. 🎨 Design Tokens (Figma Variables)

### Color System

#### Backgrounds
- `BG/Primary`: `#0B1220` (deep navy)
- `BG/Secondary`: `#0F1A2E`
- `BG/Card`: `rgba(255, 255, 255, 0.06)`
- `BG/Glass`: `rgba(255, 255, 255, 0.08)`

#### Text
- `Text/Primary`: `#FFFFFF`
- `Text/Secondary`: `#AAB4C5`
- `Text/Muted`: `#6B768A`

#### Accent Colors
- `Accent/Primary`: `#4DA3FF` (electric blue)
- `Accent/Gold`: `#F5C542`
- `Accent/Success`: `#3DDC97`
- `Accent/Live`: `#FF4D4D`

#### Status Colors
- `Status/Upcoming`: `#6B768A`
- `Status/Live`: `#4DA3FF`
- `Status/Completed`: `#3DDC97`

### Typography (Figma Text Styles)

- **Font Family**: Inter / SF Pro / system-ui fallback

#### Text Styles

| Style Name     | Size | Weight     | Use                        |
|----------------|------|------------|----------------------------|
| Display XL     | 40px | Bold       | Hero match screen          |
| Display L      | 32px | Bold       | Home headers               |
| Heading M      | 24px | SemiBold   | Section titles             |
| Heading S      | 18px | SemiBold   | Card titles                |
| Body L         | 16px | Regular    | Main text                  |
| Body S         | 14px | Regular    | Secondary text             |
| Caption        | 12px | Medium     | Metadata                   |

### Spacing System (8pt Grid)
- `4px` (xs)
- `8px` (s)
- `12px` (sm)
- `16px` (m)
- `24px` (l)
- `32px` (xl)
- `48px` (2xl)
- `64px` (3xl)

### Radius System
- Small: `8px`
- Medium: `12px`
- Large: `16px`
- Pill: `999px` (chips, buttons)

### Shadows
- **Card Shadow**: `0px 4px 20px rgba(0,0,0,0.25)`
- **Glass Elevation**: `Blur: 20px`, `Overlay: rgba(255,255,255,0.06)`

## 3. 🧱 Core Components

### 3.1 Match Card (Primary Component)

**Variants**: Upcoming, Live, Completed, Favorite

**Structure**:
- `[ Team A ] VS [ Team B ]`
- `Time: 9:00 PM`
- `Stage: Group A`

**Figma Layout**:
- Container: 16px radius
- Padding: 16px
- Background: BG/Card
- Left: Team A block
- Center: VS badge
- Right: Team B block

### 3.2 Countdown Hero Card (MOST IMPORTANT)

**Layout**:
- Large match title
- Countdown timer
- Stadium name
- CTA button

**Hierarchy**:
- Match name (Display L)
- Countdown (Display XL)
- Stadium (Body S)
- Button

### 3.3 Team Badge Chip
- Circular flag icon
- Team abbreviation
- Optional favorite star

### 3.4 Filter Chips

Rounded pill. States: Default, Selected, Disabled.

Example:
All Group A Knockout Favorites

text

### 3.5 Timeline Item

**Structure**:
- Left: vertical line + dot
- Right: match card

**Dot states**:
- Gray: upcoming
- Blue: live
- Green: completed

### 3.6 Stat Card

Used in dashboard:
- Label
- Value
- Optional icon

Example:
Matches Played: 12
Goals: 34

text

### 3.7 Glass Panel (Base Container)

Reusable wrapper:
- Blur background
- Rounded 16px
- Soft border
- Padding 16–24px

### 3.8 Bottom Navigation (Mobile)

**Tabs**:
- Home
- Fixtures
- Timeline
- Favorites
- Settings

**Active state**: Accent color underline or glow

## 4. 📱 Screen Frames (Figma Pages)

Create these frames:

### 4.1 Home Dashboard (375×812)

**Sections**:
- Top Bar
- Countdown Hero Card
- Today’s Matches (horizontal scroll)
- Tournament Snapshot
- Favorite Team Panel

### 4.2 Fixtures Screen
- Search bar fixed top
- Filter chips row
- Scrollable grouped list

### 4.3 Match Detail Screen

**Sections**:
- Hero match title
- Countdown
- Teams comparison block
- Stadium card
- Group info

### 4.4 Timeline Screen
- Vertical scroll
- Left timeline rail
- Right match cards

### 4.5 Favorites Screen
- Favorite teams list
- Starred matches list

### 4.6 Tournament Overview
- Progress bar
- Stats grid (2x2 cards)
- Group overview grid

### 4.7 Settings Screen
- Toggle rows
- Version info
- Data refresh button

### 4.8 AI Insight Screen (Optional)
- Toggle switch at top
- Insight card
- Disclaimer label

## 5. 🧩 Layout Grid System

### Mobile (Primary)
- Columns: 4
- Margin: 16px
- Gutter: 16px

### Tablet
- Columns: 8
- Margin: 24px
- Gutter: 16px

### Desktop (PWA)
- Columns: 12
- Margin: 80px
- Gutter: 24px

## 6. 🎬 Motion System (Micro-interactions)

Keep subtle:
- Card hover: scale 1.02
- Countdown tick: fade pulse
- Live match: soft glow pulse (2s loop)
- Page transitions: 150–250ms fade

## 7. 🧠 UX Rules (Non-Negotiable)

- Everything reachable in ≤2 taps
- Home screen must show next match immediately
- No visual clutter above fold
- Offline state must be invisible
- Favor clarity over animation
- Information density increases only in deeper screens

## 8. 🧱 Figma File Structure

Create pages:
1. `01 - Foundations`
2. `02 - Components`
3. `03 - Patterns`
4. `04 - Screens (Mobile)`
5. `05 - Screens (PWA Desktop)`
6. `06 - Prototype Flow`

## 9. 🚀 Prototype Flow (Figma Prototype)

Link flows:
- `Home → Match Detail → Fixtures → Timeline → Back Home`

Primary interaction loop:
- `Home → Match Detail → Favorites → Home`

## 💡 What makes this design “WOW”

- It feels like a sports operating system
- Not a “sports app”
- Not a “score tracker”
- A tournament command center