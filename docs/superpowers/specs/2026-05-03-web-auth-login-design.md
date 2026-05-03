# Web Frontend Auth — Login Design

**Date:** 2026-05-03
**Status:** Approved

## Problem

The backend now requires a JWT Bearer token on all API endpoints. The web frontend has no login UI and no mechanism to attach tokens to requests.

## Solution

Add an `AuthContext` (following the existing `ToastContext` pattern) to manage the JWT token and user identity. Show a login dialog when unauthenticated. Attach the token to all Axios requests via an interceptor. Show an account icon in the AppBar with a minimal logout menu when logged in.

## Out of Scope

- Register form (accounts created via `POST /api/auth/register` from the terminal)
- Password reset
- Remember-me / token refresh

---

## Architecture

### AuthContext (`src/context/AuthContext.tsx`)

- Holds `token: string | null` and `email: string | null` in React state
- On mount, reads both from `localStorage` to restore session after page refresh
- `login(email, password)`: calls `POST /api/auth/login`, stores token + email in state and `localStorage`
- `logout()`: clears state and `localStorage`
- Adds an Axios **request** interceptor to `api` that sets `Authorization: Bearer <token>` on every request when a token exists
- Adds an Axios **response** interceptor that calls `logout()` on 401 (expired/invalid token)
- Exposes `useAuth()` hook for consuming components

### ToastContext fix (`src/context/ToastContext.tsx`)

- The existing error interceptor must skip 401 responses — those are handled by `AuthContext` (logout), not toasted as errors

### Auth API (`src/services/api.ts`)

- Add `authApi.login(email, password)` → `POST /api/auth/login` → returns `{ token: string; email: string }`

---

## UI

### LoginDialog (`src/components/LoginDialog.tsx`)

- MUI `Dialog`, non-dismissable (`disableEscapeKeyDown`, no `onClose` that allows closing)
- Email field (`type="email"`) and password field (`type="password"`)
- Login button — calls `authApi.login()`, on success calls `AuthContext.login()` which closes the dialog
- Error shown inline below the form on failed login (wrong credentials)
- Uses the existing app theme (primary `#D97757`, bg `#FAF9F7`)
- Shown when `token === null`

### AccountMenu (`src/components/AccountMenu.tsx`)

- `AccountCircle` MUI icon button in the AppBar Toolbar, right-aligned
- Only rendered when `token !== null`
- Clicking opens a MUI `Menu` anchored to the icon
- Menu contains two items:
  1. User's email — non-clickable, displayed in secondary text colour
  2. "Log out" — calls `AuthContext.logout()`

### App.tsx changes

- Wrap with `AuthProvider` (inside `ToastProvider` and `LocalizationProvider`)
- Add `AccountMenu` to the right of the Toolbar
- Render `<LoginDialog open={!token} />` so it shows automatically when unauthenticated

---

## Data Flow

1. App loads → `AuthContext` reads `localStorage` → token found → app renders normally
2. App loads → no token → `LoginDialog` opens
3. User logs in → token stored → dialog closes → app renders
4. Any request → interceptor attaches `Authorization: Bearer <token>`
5. 401 received → `AuthContext` clears token → `LoginDialog` opens again
6. User clicks account icon → `AccountMenu` shows email + logout
7. Logout → token cleared → `LoginDialog` opens
