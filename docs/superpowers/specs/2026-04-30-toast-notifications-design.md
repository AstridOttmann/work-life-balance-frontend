# Toast Notifications — Design Spec

**Date:** 2026-04-30  
**Status:** Approved

## Goal

Add toast notifications to inform the user of success and error outcomes. Errors are handled globally via an Axios interceptor; success messages are called directly in the components that perform mutations.

---

## 1. Architecture

| Layer | Responsibility |
|---|---|
| `ToastContext` (new) | Holds the queue of one active toast; exposes `toast.success(msg)` and `toast.error(msg)` via `useToast` hook |
| `ToastProvider` (new) | Renders the MUI `Snackbar` + `Alert`; registers the Axios interceptor in `useEffect`; ejects it on unmount |
| `App.tsx` | Wraps the app in `<ToastProvider>` |
| Components | Call `toast.success(...)` after successful mutations only |

---

## 2. ToastContext

**File:** `src/context/ToastContext.tsx`

State: `{ open: boolean, message: string, severity: 'success' | 'error' }`.

Exported:
- `ToastProvider` — renders context + Snackbar + sets up Axios interceptor
- `useToast` — returns `{ toast: { success(msg), error(msg) } }`

Axios interceptor (registered inside `ToastProvider` via `useEffect`):
- On response error: extract `error.response?.data?.message`, fall back to status-based message (`400` → `"Bad request"`, `404` → `"Not found"`, `500` → `"Server error"`), final fallback `"Something went wrong"`
- Call `toast.error(message)`
- Re-throw the error so callers are not silently swallowed
- On unmount: eject the interceptor via `axios.interceptors.response.eject(id)`

---

## 3. Snackbar Display

- Position: `anchorOrigin={{ vertical: 'top', horizontal: 'center' }}`
- Auto-hide: `autoHideDuration={4000}` (4 seconds)
- Content: MUI `Alert` with `severity` (success = green, error = red), `variant="filled"`, `sx={{ width: '100%' }}`
- Close: clicking the X or clicking away dismisses it

---

## 4. Success Toast Locations

| Component | Event | Message |
|---|---|---|
| `DashboardPage` | Entry created | `"Entry created"` |
| `DashboardPage` | Entry updated | `"Entry updated"` |
| `DashboardPage` | Entry deleted | `"Entry deleted"` |
| `AppointmentList` | Appointment created | `"Appointment created"` |
| `AppointmentList` | Appointment updated | `"Appointment updated"` |
| `AppointmentList` | Appointment deleted | `"Appointment deleted"` |

---

## 5. Files Changed

| File | Change |
|---|---|
| `src/context/ToastContext.tsx` | Create — context, provider, hook, Axios interceptor |
| `src/App.tsx` | Wrap app in `<ToastProvider>` |
| `src/pages/DashboardPage.tsx` | Add `toast.success(...)` after entry mutations |
| `src/components/AppointmentList.tsx` | Add `toast.success(...)` after appointment mutations |

---

## Out of Scope

- Warning toasts
- Stacking multiple toasts simultaneously
- Persistent toasts (all auto-dismiss after 4s)
- SummaryPage (read-only, no mutations)
