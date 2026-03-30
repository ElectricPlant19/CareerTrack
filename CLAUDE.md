# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server on http://localhost:3000
npm run build      # Type-check + Vite production build
npm run lint       # Type-check only (tsc --noEmit) — there is no ESLint
npm run preview    # Preview the production build locally
npm run clean      # Remove dist/
```

There are no automated tests. `npm run lint` (TypeScript compile) is the sole correctness check — always run it after changes.

## Firebase Setup

The app requires a `firebase-applet-config.json` in the project root (gitignored). It must contain a standard Firebase web config object (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).

The Firestore database name is **`careertrack-db`** (not the default `(default)`). Auth is Google-only via popup/redirect. Firebase Storage is used for document file uploads.

## Architecture

### Auth & Layout (`src/App.tsx`)
Single-file entry point that owns:
- Firebase `onAuthStateChanged` listener → sets `UserProfile` state
- Two route trees: unauthenticated (`/` → LandingPage, `*` → /login) and authenticated (full `<Layout>` with sidebar)
- `<Layout>` contains the desktop sidebar and mobile drawer; all page components receive `user: UserProfile` as a prop

### Data Layer

**Two patterns coexist** — choose deliberately:
- `onSnapshot` (real-time): only used in `src/hooks/` hooks and nowhere else. Currently only `Dashboard.tsx` uses `useApplications` (for Kanban live updates). `useCompanies` is used in `ContactList` for the company dropdown.
- `getDocs` (one-shot): used directly inside all other page components. They call a local `fetchData()` after every mutation to refresh. This was an intentional cost-reduction decision (see commit history).

When deciding which to use: `onSnapshot` for views that need cross-tab or cross-component live sync; `getDocs` + local refresh for isolated CRUD pages.

**Service layer** (`src/services/`): thin wrappers over Firestore — one file per entity. They call `handleFirestoreError` and re-throw so callers can toast. `updateApplicationStatus` writes the full application document (not a partial) — this is intentional to avoid missing-field bugs.

**Firestore paths** (all per-user subcollections):
```
users/{uid}/applications/{id}
users/{uid}/tasks/{id}
users/{uid}/interviews/{id}
users/{uid}/companies/{id}
users/{uid}/contacts/{id}
users/{uid}/documents/{id}
```

Document file storage: `users/{uid}/documents/{timestamp}_{filename}` in Firebase Storage.

### State & UI Conventions
- **Toast notifications**: `useToast()` from `src/contexts/ToastContext.tsx` — exposes `toast.success()`, `toast.error()`, `toast.info()`. Always use this instead of alerts for operation feedback.
- **Error handling**: call `handleFirestoreError(error, OperationType.X, path)` for logging, then show a toast. Service functions handle the logging; components handle the toast.
- **Styling**: Tailwind CSS v4 (no config file — uses `@tailwindcss/vite` plugin). Design language: `rounded-2xl`/`rounded-3xl` cards, `bg-gray-50` inputs, `bg-black text-white` primary buttons, `shadow-sm hover:shadow-md` transitions.
- **Icons**: `lucide-react` exclusively.
- **Animation**: `motion` (formerly Framer Motion) — used sparingly, mainly in KanbanBoard cards.

### Key Cross-Component Relationships
- `Dashboard` owns Kanban view — it passes `applications` from `useApplications` down to `KanbanBoard`. KanbanBoard uses optimistic status overrides locally and cleans them up after ~1.5s (real data from onSnapshot propagates by then).
- `ContactList` uses `useCompanies` (real-time) for the company dropdown even though contacts themselves use getDocs — this avoids a stale company list in the select.
- `ApplicationList` persists filter state to `sessionStorage` under the key `app_list_filters`.
- `Calendar` detects scheduling conflicts between interviews within 60 minutes of each other using `date-fns/differenceInMinutes`.

### Types (`src/types.ts`)
All interfaces live here. `ApplicationStatus` is a union type — the canonical ordered list is `APPLICATION_STATUSES` in `src/constants/index.ts`. Color mappings (`STAGE_COLORS`, `PRIORITY_COLORS`, etc.) also live in constants and should be the single source of truth for badge styling.

## Deployment Workflow

At the end of every session where code changes were made, always:
1. Run `npm run build` to verify the build passes.
2. Ask the user: "Build passed — shall I commit, push to GitHub, and deploy to Firebase?"
3. On confirmation, commit and push to GitHub (`git push origin main`), then deploy to Firebase (`firebase deploy --only hosting`).
