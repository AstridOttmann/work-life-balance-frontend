# Mobile App + Cloud Deployment Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a React Native mobile app for iPhone that replicates the full web app feature set, backed by the existing Spring Boot API deployed to Railway.

**Architecture:** One shared backend on Railway serves both the existing React web app and a new Expo React Native mobile app. The mobile app is a separate repo. The web app requires only a one-line API URL change.

**Tech Stack:** Expo (React Native), TypeScript, Expo Router, React Native Paper, Axios, Railway (Spring Boot + PostgreSQL)

---

## Part 1: Backend Deployment (Railway)

The Spring Boot backend is deployed to Railway with a managed PostgreSQL database.

**Changes to backend:**
- `application.properties` updated to support Railway's `DATABASE_URL` environment variable while keeping local config working
- No changes to controllers, services, or entities

**Result:** Backend accessible at a public Railway URL (e.g. `https://work-life-balance-backend.up.railway.app`), replacing `localhost:8080` for both apps.

**Web frontend change:**
- `src/services/api.ts`: `baseURL` updated from `http://localhost:8080/api` to the Railway URL

---

## Part 2: Mobile App (`work-life-balance-mobile`)

A new standalone Expo project in a new GitHub repo.

### Tech stack
| Concern | Choice |
|---|---|
| Framework | Expo SDK (latest) |
| Language | TypeScript |
| Navigation | Expo Router (file-based, tab layout) |
| UI components | React Native Paper |
| HTTP client | Axios |
| Date handling | dayjs |

### Project structure
```
work-life-balance-mobile/
  app/
    _layout.tsx        # Root layout, tab navigator
    index.tsx          # Daily Log tab
    summary.tsx        # Summary tab
  components/
    EntryCard.tsx      # Single entry card with appointments
    EntryForm.tsx      # Add/edit entry modal form
    AppointmentList.tsx
    AppointmentForm.tsx
  services/
    api.ts             # Same entriesApi / appointmentsApi as web, Railway URL
  types/
    entry.ts           # Same TypeScript types as web
```

### Screens

**Daily Log (index.tsx)**
- Scrollable list of entry cards (date, work/free/sleep hours, mood, notes)
- FAB (floating action button) to add new entry
- Tap card to expand appointments; edit/delete via icon buttons
- Add appointment button per card

**Summary (summary.tsx)**
- Weekly / Monthly toggle (two buttons)
- Prev / Next navigation
- Summary stats: avg work hours, avg free time, avg sleep, avg mood

### Navigation
Two tabs at the bottom: Daily Log and Summary. Modals (add/edit entry, add/edit appointment) open as Expo Router modal sheets.

### API
`services/api.ts` is a direct copy of the web app's version with `baseURL` pointing to Railway. All existing endpoint calls (`entriesApi`, `appointmentsApi`) are unchanged.

### Error handling
Axios response interceptor shows error toasts (via React Native Paper Snackbar) — same pattern as the web app's ToastContext.

---

## Part 3: Testing

- Run `npx expo start` on the development computer
- Scan QR code with Expo Go on iPhone (same WiFi network during development)
- After Railway deployment, the app works on any network independently

---

## Out of Scope

- Apple Developer account / App Store publishing
- Push notifications
- Offline mode
- Authentication
