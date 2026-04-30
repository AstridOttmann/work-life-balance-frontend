# UI Redesign — Work-Life Balance Frontend

**Date:** 2026-04-30  
**Status:** Approved

## Goal

Redesign the frontend from a purple-accented table layout to a navy/sky-blue card-based desktop layout inspired by a reference design. Additionally, surface all appointments in a dedicated section at the bottom of the dashboard.

---

## 1. Color Theme

Replace the current purple accent scheme with a navy + sky blue palette applied via a custom MUI theme.

| Token | Old | New |
|---|---|---|
| `palette.primary.main` | `#aa3bff` | `#1e3a8a` (navy) |
| `palette.background.default` | `#ffffff` | `#e8f3fc` (sky blue) |
| `palette.background.paper` | `#ffffff` | `#ffffff` (white) |
| `palette.text.primary` | `#08060d` | `#0f172a` |
| `palette.text.secondary` | `#6b6375` | `#475569` |

- AppBar: navy background, white text and tabs
- Buttons (contained): navy
- No purple remains anywhere in the app

---

## 2. Layout & Navigation

- `App.tsx`: `Container maxWidth="lg"` (up from `"md"`) for better desktop use of space
- `mt: 4, mb: 6` page padding unchanged
- AppBar and tab structure unchanged; only colors update
- `index.css`: update `--accent` and `--bg` CSS variables to match new theme

---

## 3. Entry Cards Grid (replaces EntryList table)

**File:** `src/components/EntryList.tsx` — rewritten as a card grid.

- Layout: CSS Grid with `repeat(auto-fill, minmax(280px, 1fr))`, `gap: 24px`
- Each card: MUI `Paper`, `borderRadius: 16px`, `padding: 20px`, soft box shadow
- Card anatomy (top to bottom):
  1. **Header row**: date (bold, `text.primary`) + Edit/Delete icon buttons (top-right)
  2. **Stats row**: 4 small chips — Work `Xh`, Free `Xh`, Sleep `Xh`, Mood `X/10`
  3. **Notes** (if present): secondary text, 2-line clamp
  4. **Footer**: appointment count badge bottom-right (e.g. `2 appointments`)
- Hover: slight shadow lift (`elevation` increase on hover via `sx`)
- Empty state: unchanged ("No entries yet. Add your first day!")

---

## 4. Appointments Section

**Location:** `DashboardPage.tsx` — below the card grid, always visible when there are entries.

- Outer container: white `Paper`, `borderRadius: 16px`, `padding: 24px`, `mt: 4`
- Title: `Typography variant="h6"` — "Appointments"
- Content: entries that have appointments are each rendered as a group:
  - Date subheader (`Typography variant="subtitle2"`, navy color)
  - `AppointmentList` component (existing) for that entry's appointments
  - `Divider` between groups
- Entries with zero appointments are skipped in this section
- If no entries have any appointments: show a subtle empty state message
- The existing "click entry to show appointments" interaction in `DashboardPage` is **removed** — the bottom section replaces it entirely

---

## 5. Files Changed

| File | Change |
|---|---|
| `src/index.css` | Update CSS variables to match new theme |
| `src/main.tsx` or `src/App.tsx` | Add custom MUI `createTheme` with new palette |
| `src/App.tsx` | `Container maxWidth="lg"` |
| `src/components/EntryList.tsx` | Rewrite as card grid |
| `src/pages/DashboardPage.tsx` | Remove click-to-expand appointments, add bottom appointments section |

---

## Out of Scope

- SummaryPage styling (not requested)
- Mobile/responsive layout (desktop only)
- Authentication
- New backend endpoints
