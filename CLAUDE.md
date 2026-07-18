# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Markdorio — a local-first Markdown note-taking PWA (React 19 + TypeScript + Vite + MUI), with optional Google-auth sign-in and Firebase Firestore sync, plus public read-only note sharing. UI text and commit messages are in French; user-facing strings should stay in French.

## Commands

```bash
npm run dev       # Vite dev server (HMR)
npm run build     # tsc -b (project references, noEmit) then vite build
npm run lint      # oxlint (see .oxlintrc.json — react, typescript, oxc plugins)
npm run preview   # serve the production build locally
```

There is no test suite configured in this repo. `tsc -b` is the type-check gate; run it (or `npm run build`) after non-trivial changes.

Firebase env vars (`VITE_FIREBASE_*`, see `.env.example`) are optional at dev/build time — see "Firebase is optional" below.

## Architecture

### Local-first data flow, Firebase is optional

The app works fully offline with no Firebase config: `notes` live in React state (`NotesContext`) and are persisted to `localStorage` (debounced 500ms via `useDebouncedCallback`, flushed on `beforeunload`/tab-hide). `src/firebase.ts` only calls `initializeApp` if `VITE_FIREBASE_API_KEY`/`VITE_FIREBASE_PROJECT_ID` are set; `isFirebaseConfigured` gates this, and `auth`/`db`/`googleProvider` are `undefined` otherwise. Every hook/component that touches Firebase (`AuthContext`, `useNotesSync`, `useShareNote`, `usePublicSharedNotes`, `SharedNoteView`) null-checks `auth`/`db` before use and degrades gracefully (sync/sharing becomes unavailable, everything else still works).

Two independent state layers, kept deliberately separate:
- **`NotesContext`** (`src/context/NotesContext.tsx`) — source of truth for notes in memory + localStorage. Owns CRUD, the debounced autosave, and `deletedNoteIds` (a tombstone list so remote deletes get replayed on the next sync).
- **`useNotesSync`** (`src/hooks/useNotesSync.ts`) — a separate, manually-triggered two-way merge against Firestore: fetches `users/{uid}/notes`, replays pending deletes, uploads any local note whose `updatedAt` is newer than its cloud copy, then merges by last-write-wins on `updatedAt` and calls `replaceAllNotes`. This is not automatic/realtime — it's invoked explicitly (see `AppHeader`/`SettingsMenu`).

### Firestore layout & sharing model

- `users/{uid}/notes/{noteId}` — private, owner-only (see `firestore.rules`).
- `sharedNotes/{noteId}` — a *separate top-level collection*, not a subcollection. Publishing a note (`useShareNote.publishNote`) copies a trimmed `SharedNote` projection (title/content/fontFamily/labels/updatedAt/ownerId — no `isPublic`/`createdAt`/`id`) into `sharedNotes/{noteId}` and flips `isPublic: true` on the local `Note`. `useNotesSync` also re-pushes this projection for any public note it uploads, so the two collections can drift briefly but reconverge on next sync. Label edits on a public note must go through both `updateNote` (local) and `useShareNote.updateSharedLabels` (remote projection) — see `ManageLabelsDialog`.
- `sharedNotes` is world-readable (`allow read: if true`) and rendered by `usePublicSharedNotes` (live `onSnapshot`, latest 50) and by the public route `/share/:noteId` (`SharedNoteView`, one-shot `getDoc`). `SharedNoteView` is mounted *outside* `AuthProvider`/`NotesProvider` in `App.tsx` — it must not depend on either context.
- `NotesSidebar` merges the user's own notes with other users' public notes (`usePublicSharedNotes`, filtered to exclude the current user's own) into one label-grouped list; keep that merge logic in sync if you touch either data source.

### Routing

`App.tsx` defines exactly two routes: `/share/:noteId` (public, unauthenticated) and `/*` (the authenticated app shell, wrapped in `AuthProvider` + `NotesProvider`). Anything requiring `useAuth()`/`useNotes()` must live under `/*`.

### Styling

MUI (`ThemeProvider`, hand-drawn "sketchbook" theme in `App.tsx`: `Caveat` for headings, `Nunito` for body, offset box-shadows on buttons) combined with a `.less` file per component (`ComponentName.less` next to `ComponentName.tsx`), plus shared mixins in `src/styles/mixins.less`. Fonts for note content are user-selectable and loaded dynamically at runtime via `src/utils/loadGoogleFont.ts` against the `src/data/fonts.ts` catalog (used identically in the editor and in `SharedNoteView`).

### PWA / build

`vite-plugin-pwa` (prompt-based update flow, surfaced via `PwaUpdatePrompt`) with Workbox runtime caching for Google Fonts. `vite.config.ts` manually chunks vendor code (react, mui, markdown stack, firebase/auth, firebase/firestore, firebase/core) — extend those `manualChunks` groupings rather than letting new large deps fall into the default vendor bucket.

## Deployment

Push to `main` triggers `.github/workflows/firebase-deploy.yml`: `npm ci` → `npm run build` (with `VITE_FIREBASE_*` injected as build-time secrets, baked statically into the bundle by Vite) → `firebase-tools deploy --only hosting,firestore` (using a separate `GCP_SA_KEY` secret, which never touches the build step). `main` is branch-protected (PR required); direct pushes are rejected. Firestore security rules (`firestore.rules`) are the actual data access boundary — the Firebase web config/API key is not a secret. Background/rationale: `Apprentissage/cicd-firebase.md` (French).
