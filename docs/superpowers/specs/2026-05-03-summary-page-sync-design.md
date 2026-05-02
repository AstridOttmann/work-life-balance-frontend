# Summary Page Sync Design

**Date:** 2026-05-03
**Status:** Approved

## Problem

Changes made on the Daily Log (Dashboard) page are not reflected on the Summary page until the browser is reloaded. Both pages are always mounted (tab-based navigation), so `SummaryPage` only re-fetches when `period` or `date` changes — switching tabs alone does not trigger a re-fetch.

## Solution

Pass `isActive: boolean` from `App.tsx` to `SummaryPage`. Add it to the `useEffect` dependency array so the page re-fetches whenever the Summary tab is activated.

## Changes

### `src/App.tsx`
- Pass `isActive={activeTab === <summary tab value>}` to `<SummaryPage />`.

### `src/pages/SummaryPage.tsx`
- Accept `isActive: boolean` prop.
- Update the existing `useEffect` to include `isActive` in its dependency array and guard the fetch behind `if (isActive)`.

```tsx
useEffect(() => {
  if (isActive) load();
}, [isActive, load]);
```

## Behaviour

- When the user switches to the Summary tab, `isActive` flips `false → true`, the effect fires, and fresh data is fetched from `GET /api/entries/summary`.
- When the user switches away, `isActive` flips `true → false` — the guard prevents an unnecessary fetch.
- The existing summary data stays visible while the re-fetch completes (no loading flash).
- Period and date navigation continues to work exactly as before.

## Out of Scope

- Mobile app (same pattern applies via `useIsFocused` — separate task).
- Global data context or React Query (not needed for this fix).
