# VittNest Design System

> Single source of truth for all UI work. Read this before touching any component.
> Last updated: 2026-04-11

---

## Brand Identity

- **Product name**: VittNest
- **Tagline**: Track every rupee. Know every position.
- **Audience**: Indian retail equity investors
- **Tone**: Editorial fintech — premium, precise, trustworthy. Not corporate. Not playful. Think Bloomberg meets a well-designed Indian app.
- **Core differentiator**: FIFO P&L calculation + live Upstox prices + immutable trade history

---

## Typography

Three fonts, three roles — never mix them up.

| Font | Role | Usage |
|---|---|---|
| **Newsreader** (serif) | Display / Headlines | Hero headlines, section titles, logo, italic accent words |
| **Manrope** | Body | Paragraphs, descriptions, card body text |
| **DM Sans** | Label / UI | Buttons, nav links, chips, table data, form labels |

### Google Fonts Import (add to `frontend/index.html`)
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Manrope:wght@200..800&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap" rel="stylesheet">
```

### Typography Scale (MUI theme)
```js
fontFamily: '"DM Sans", sans-serif'   // MUI default — used for all MUI components
// Newsreader and Manrope applied via sx={{ fontFamily: '"Newsreader", serif' }} or className
```

### Italic Accent Pattern
Key words in headlines are set in **Newsreader italic + brand teal**. This is the single most distinctive design decision.
- Examples: *rupee*, *Excel*, *financial destiny*, *Live LTP Integration*
- Implementation: `<span style={{ fontStyle: 'italic', color: theme.palette.primary.main }}>word</span>`

---

## Color System

### Brand Colors

| Token | Light Mode | Dark Mode | Notes |
|---|---|---|---|
| `primary.main` | `#0A7B7B` | `#0fb3af` | Brand teal. Buttons, links, accents, italic highlights |
| `primary.contrastText` | `#FFFFFF` | `#FFFFFF` | Text on teal buttons |
| `primary.hover` | `#086363` | `#0d9e9a` | Darken ~10% for hover states |

> **Why two teal shades?** `#0A7B7B` is deep enough for WCAG AA on white (6.8:1). `#0fb3af` is bright enough for WCAG AA on `#111827` (5.2:1). Same hue family, different luminosity.

### Background Tokens

| Token | Light Mode | Dark Mode | Notes |
|---|---|---|---|
| `background.default` | `#F9F9FB` | `#0a0a0a` | Page background. Dashboard, all pages. |
| `background.paper` | `#FFFFFF` | `#111111` | Cards, modals, nav |
| `background.elevated` | `#F0F0F5` | `#1a1a1a` | Elevated surfaces, hover states |

> **Why `#0a0a0a` for dark?** Near-true black — zero hue, no blue or navy tint. Teal accent pops cleanly against it. Used by Vercel, Linear, shadcn. Borders at `#262626` provide structure without competing with the teal accent.

> **Landing page hero override**: On the hero section only, apply a `radial-gradient` teal overlay on top of `#111827` to create atmospheric depth. This is a section-level override, not a theme change.

### Text Tokens

| Token | Light Mode | Dark Mode |
|---|---|---|
| `text.primary` | `#1A1A1C` | `#E0E6EB` |
| `text.secondary` | `#64748B` | `#7F8C8D` |

### Semantic / Data Colors (same both modes — these are functional, not brand)

| Purpose | Color | Usage |
|---|---|---|
| Gain / Positive P&L | `#22c55e` (light) / `#4CAF50` (dark) | Stock gains, positive returns |
| Loss / Negative P&L | `#ef4444` (light) / `#EF5350` (dark) | Stock losses, negative returns |
| Warning | `#f59e0b` | Alerts, expiry warnings |
| Info | `#3b82f6` | Informational badges |

> **Critical**: Semantic colors are NEVER used as brand accent. Teal is the only brand color. Green/red are data-only.

### Surface Hierarchy (Dark Mode Only)

For layered card UIs — use these in sequence, not randomly:

| Level | Color | Usage |
|---|---|---|
| Base | `#0a0a0a` | Page background |
| Paper | `#111111` | Standard cards, modals |
| Elevated | `#1a1a1a` | Hover state, elevated cards |
| High | `#222222` | Feature highlight cards |

---

## Spacing & Layout

### Container
- Max width: `1400px` (screen-2xl equivalent)
- Page padding: `px-8` (32px) on desktop, `px-4` (16px) on mobile

### Section Padding
- Standard sections: `py-32` (128px) top and bottom
- Tight sections: `py-16` (64px)

### Border Radius
- Cards / large surfaces: `16px` (`1rem`)
- Buttons: `8px` (`0.5rem`) — already in MUI theme
- Chips / badges: `9999px` (full round)
- Small elements: `8px`

---

## Landing Page Sections (Reference)

The landing page (`DemoLandingPage.jsx`) follows this exact section order:

1. **Nav** — Fixed, blur backdrop, transparent→solid on scroll. Logo (Newsreader italic teal) + Sign In + Get Started
2. **Hero** — Full viewport. Floating ghost numbers (opacity 0.10), serif headline with teal italic word, subtext, 2 CTAs
3. **Problem** — Sticky 2-col. "Most investors track in *Excel*." + 3 numbered pain points (01/02/03)
4. **Features** — "Sovereign Intel." + asymmetric 12-col grid: 8-col LTP card + 4-col FIFO card + 12-col Ledger card
5. **Steps** — "Simple. Sovereign." + 3 steps with giant ghost numbers behind (opacity ~0.05)
6. **CTA** — Glass panel centered. Toned-down copy.
7. **Footer** — Logo + footer links + copyright

### Content Rules
- ✅ Keep: "Most investors track in Excel. That breaks the moment you add a second buy."
- ✅ Keep: 01/02/03 pain point labels
- ✅ Keep: FIFO Engine mock table, HDFCBANK price card, Ledger preview
- ❌ Remove: Nav links (MARKETS, ADVISORY, DOSSIER, INTEL) — don't exist in app
- ❌ Remove: "Import CSVs from any broker" — not implemented
- ❌ Remove: "sector concentration" — not a feature
- ❌ Remove: "Join the exclusive circle of investors" — too pretentious
- ❌ Remove: "institutional-grade", "family office" references
- ✏️ Fix: Step 1 → "Add stocks manually with buy date and price"
- ✏️ Fix: Step 3 → "Track your realized and unrealized P&L"
- ✏️ Fix: CTA → "Start tracking your portfolio for free."
- ✏️ Fix: Footer copyright → © 2026 VittNest

---

## Animation Standards

### Entrance (on page load)
- Hero headline: staggered word/line fade-in, `animation-delay` increments of 100ms
- Keyframe: `fadeUp` — `opacity: 0, translateY(30px)` → `opacity: 1, translateY(0)`, duration `0.6s ease-out`

### Scroll-triggered
- All sections below hero: fade-up on Intersection Observer trigger
- Threshold: `0.15` (trigger when 15% of element is visible)

### Ambient
- Hero floating ghost numbers: slow `translateY` drift loop, `animation: floatDrift 8s ease-in-out infinite`
- Each number gets a different `animation-delay` and `animation-duration` (6s–12s range) so they don't sync

### Hover
- Feature cards: subtle `translateY(-4px)` + shadow increase
- Buttons: `brightness(1.1)` (already in MUI theme)
- Nav links: `color` transition `0.2s`

### Nav scroll behavior
- Default: `background: transparent`
- After scroll > 20px: `background: rgba(bg, 0.85)`, `backdrop-filter: blur(20px)`, `border-bottom: 1px solid border-color`

---

## Glass Panel Pattern

Used in hero CTA section and Sign In button:

```css
/* Light mode */
background: rgba(255, 255, 255, 0.6);
backdrop-filter: blur(20px);
border: 1px solid rgba(10, 123, 123, 0.1);

/* Dark mode */
background: rgba(26, 31, 46, 0.4);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.08);
```

---

## MUI Theme File

Location: `frontend/src/theme/appTheme.js`

This is the **only place** colors, typography, and component overrides are defined. When redesigning any component:
1. Use `theme.palette.primary.main` for teal accent
2. Use `theme.palette.background.default/paper/elevated` for backgrounds
3. Use `theme.palette.text.primary/secondary` for text
4. Never hardcode hex values in components — always reference theme tokens

### Key changes from original theme
- `primary.main`: was `#df6035` (orange) → now `#0A7B7B` / `#0fb3af` (teal)
- `secondary.main`: was `#2f4b79` (blue) → repurposed or removed (teal is the only accent)
- `background.default` dark: was `#1a1a1a` → now `#111827`
- Typography: was `Outfit` → now `DM Sans` as MUI base, Newsreader/Manrope via sx props on landing page

---

## Responsive Breakpoints (MUI defaults)

| Breakpoint | Width | Notes |
|---|---|---|
| `xs` | 0px+ | Mobile — single column everywhere |
| `sm` | 600px+ | Large mobile — some 2-col |
| `md` | 900px+ | Tablet — sticky sections activate, 2-col layouts |
| `lg` | 1200px+ | Desktop — full 12-col grid |
| `xl` | 1536px+ | Wide — max-width container kicks in |

### Landing Page Responsive Behaviour
- **Hero font**: `clamp(2.5rem, 8vw, 6rem)` — scales fluidly, no breakpoint jumps
- **Problem section**: stacked on mobile (no sticky), 2-col sticky on md+
- **Feature grid**: single col → 2-col → 12-col asymmetric
- **Steps**: single col → 3-col on md+
- **Nav mobile**: Logo left + "Get Started" button right only (Sign In hidden on mobile)

---

## Decision Log

| Decision | Chosen | Rejected | Reason |
|---|---|---|---|
| Brand color | Teal `#0A7B7B` | Orange `#df6035` | Orange felt generic; teal is distinctive, trustworthy, different from gain-green |
| Dark bg | `#111827` | `#1A242B` (Stitch blue-grey), `#0d1f1e` (teal-dark) | Neutral for data-dense dashboard; blue-grey competes with teal; near-black universal |
| Display font | Newsreader | Playfair Display, Cormorant | Newsreader has better optical sizing range, feels more editorial/newspaper |
| Body font | Manrope | DM Sans, Outfit | Manrope has better weight range, more geometric, pairs well with Newsreader |
| Label font | DM Sans | Inter, Outfit | Clean, technical, good for numbers and UI labels |
| Landing page | Scrollable sections | Single card | Modern SaaS standard; allows storytelling |
| Animations | CSS + Intersection Observer | Framer Motion | No extra dependency for landing page; CSS is sufficient |
