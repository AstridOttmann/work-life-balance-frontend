# Tracking Page — Design Spec

**Date:** 2026-05-05  
**Branch:** feature/auth  
**Repos affected:** `work-life-balance-backend`, `work-life-balance-frontend`

---

## Overview

A third tab "Tracking" lets users start, pause, and stop live timers for Work and Free Time blocks. Pressing Stop writes the completed block to the backend. Running blocks (no `endTime`) are visible in the Daily Log's edit form as "Running".

---

## Backend Changes

### `TimeBlock.java`
- `endTime`: change `@Column(nullable = false)` → `@Column(nullable = true)`

### `TimeBlockDto.java`
- Remove `@NotNull` from `endTime` field

### `TimeBlockService.java`
- `create()`: accept null `endTime` — do not set the field if not provided
- Any duration calculation: skip blocks where `endTime == null`

### `EntryService.java`
- `workHours` / `freeTimeHours` computation: add null-check — skip blocks where `endTime == null`

### DB migration (manual, one-time)
```sql
ALTER TABLE time_block ALTER COLUMN end_time DROP NOT NULL;
```
Run against the local Postgres instance after deploying the code change. Hibernate `ddl-auto=update` will not drop the constraint automatically.

### Existing endpoints (unchanged)
- `POST /api/time-blocks` — now accepts body without `endTime`
- `PUT /api/time-blocks/{id}` — used on Stop, sends all fields including `endTime`
- No new endpoints required

---

## Frontend: Type Changes (`src/types/entry.ts`)

```typescript
interface TimeBlock {
  // ...
  endTime: string | null;   // was: string
}

interface TimeBlockInput {
  dailyEntryId: number;
  type: 'WORK' | 'FREE';
  startTime: string;
  endTime?: string;          // optional — omitted when starting a tracker
}
```

---

## Frontend: New Page (`src/pages/TrackingPage.tsx`)

### State

One `TrackerState` per block type, local to `TrackingPage` (no shared context):

```typescript
interface TrackerState {
  status: 'idle' | 'running' | 'paused';
  blockId: number | null;        // DB id from POST response
  dailyEntryId: number | null;   // needed for PUT on Stop
  startTime: string | null;      // "HH:mm" — stored for PUT on Stop and display
  startTimestamp: number | null; // Date.now() when last started or resumed
  accumulatedMs: number;         // ms counted before last pause
}
```

Elapsed ms = `accumulatedMs + (status === 'running' ? Date.now() - startTimestamp : 0)`  
Display format: `HH:mm:ss`  
A `setInterval` (1 s) triggers re-render while any tracker is running.

### Start flow
1. `GET /api/entries?from=today&to=today`
2. If no entry → `POST /api/entries` with `{ date: today, mood: 5, sleepingHours: null, health: null, notes: null }`
3. `POST /api/time-blocks` with `{ dailyEntryId, type, startTime: "HH:mm" }` — no `endTime`
4. Store `blockId` from response; set `status: 'running'`, `startTimestamp: Date.now()`, `accumulatedMs: 0`

### Pause / Resume
- **Pause:** `accumulatedMs += Date.now() - startTimestamp`; `startTimestamp: null`; `status: 'paused'`. No API call.
- **Resume:** `startTimestamp: Date.now()`; `status: 'running'`. No API call.

### Stop
1. `endTime = current HH:mm`
2. `PUT /api/time-blocks/{blockId}` with `{ dailyEntryId, type, startTime, endTime }`
3. Reset state to idle
4. Refresh today's summary (re-fetch today's entry)

### Page-load recovery
On mount: fetch today's entry. For each block with `endTime === null`:
- Compute `accumulatedMs = Date.now() - parseTimeAsToday(block.startTime)` (assumes same-day)
- Set `status: 'running'`, `startTimestamp: Date.now()`, restore `blockId` and `startTime`

### Mutual exclusion
None — Work and Free timers are fully independent.

---

## Frontend: Visual Layout

**Navigation:** Third tab "Tracking" added to `App.tsx` (tabs: Daily Log | Summary | Tracking).

**Page layout:**
- Two `Paper` cards in a responsive grid: side by side on `md+`, stacked on mobile
- Summary row below the cards

**Each card (Work / Free):**
| Element | Details |
|---|---|
| Heading | `WorkIcon` / `SpaIcon` + label |
| Timer | `variant="h2"`, ~64px, monospace, `HH:mm:ss` |
| Status chip | **Running** (green), **Paused** (amber), **Idle** (grey) |
| Buttons | Start · Pause/Resume · Stop (row of 3) |
| Button states | Start disabled when running/paused; Stop disabled when idle; Pause disabled when idle |

No decorative SVG ring (unnecessary complexity; large timer provides equivalent visual weight).

**Summary row:**
- "Total Work today: Xh Ymin" and "Total Free today: Xh Ymin"
- Computed from completed blocks only (`endTime !== null`) for today's entry
- Re-fetched after each Stop

---

## Frontend: Changes to Existing Components

### `src/components/TimeBlockList.tsx`
- Guard `blockDuration()` against `null` endTime
- In list render: if `b.endTime === null`, show `"09:00 — Running"` with a green `Chip`; hide duration; hide Edit button (can't manually edit a live block)
- Delete button remains enabled (allows cancelling a running block)

### `src/services/api.ts`
- `timeBlocksApi.create()` already passes the DTO through — the type change in `TimeBlockInput` is sufficient

### `src/App.tsx`
- Add `<Tab label="Tracking" />` and render `<Box hidden={tab !== 2}><TrackingPage /></Box>` — no `isActive` prop needed; the interval self-manages on tracker `status`, and the recovery fetch runs once on mount (same pattern as `DashboardPage`)

---

## Out of Scope
- Mobile tracking page (separate future work)
- "Project / Activity" label from Stitch design (not in user requirements)
- Cross-midnight timer recovery (HH:mm startTime is ambiguous after midnight — acceptable for v1)
- Multiple simultaneous running blocks of the same type (not possible since Start is disabled when running)
