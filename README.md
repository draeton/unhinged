# Unhinged

A mobile-first Progressive Web App for running a guided calisthenics/mobility workout: warm-up, strength, mobility, and cooldown blocks with per-exercise work/rest timers, set tracking, and workout history.

## Tech stack

- **React 19** + **TypeScript**, built with **Vite**
- **Zustand** for in-session workout state (persisted to `localStorage`)
- **Supabase** for authentication and cloud sync of workout history
- **vite-plugin-pwa** for installable/offline PWA support
- **lucide-react** for icons, **canvas-confetti** for the completion celebration
- **Vitest** + **@testing-library/react** for tests
- Deployed on **Vercel** (zero-config static build of the Vite output)

No backend server of its own — Supabase is the only external service, accessed directly from the client.

## Architecture

```
src/
  App.tsx              # Main authenticated app shell: screens, drawers, workout lifecycle
  AppWrapper.tsx        # Auth gate: shows AuthScreen, a loading state, or App
  context/AuthContext.tsx   # Wraps Supabase auth session/user state
  store/workoutStore.ts     # Zustand store: workout progress, set completion, per-exercise timers
  types/
    workout.ts               # Exercise (library entity), timer/history types
    program.ts                # Program/ProgramBlock/BlockExercise + the ResolvedBlock/
                               # ResolvedExercise runtime shapes the player actually consumes
  services/
    exercises.ts              # CRUD for the user's exercise library (Supabase-backed)
    programs.ts                # CRUD for programs/blocks/placements + getResolvedProgram
    resolveExercise.ts          # Merges a library exercise's defaults with a placement's overrides
    programBootstrap.ts          # Clones the seeded template program for a brand-new user
  hooks/
    useActiveProgram.ts        # Loads/caches the user's currently-active program
    useTimerTicker.ts           # Background interval that drives all running work/rest timers
  components/            # UI: StartScreen, LivePlayer (exercise carousel), TimerDrawer,
                          # RingTimer, PreWorkoutDrawer, HistoryStats, CalendarDrawer,
                          # ProgramListDrawer/ProgramEditorDrawer/BlockEditorDrawer,
                          # ExerciseLibraryDrawer/ExerciseEditorDrawer, etc.
  utils/
    storage.ts              # localStorage persistence (completed workouts, PRs, settings,
                             # active-program pointer + a read-only cache for offline continuity)
    supabase.ts              # Supabase client
    supabaseSync.ts           # Push/pull completed workouts to/from Supabase
    audio.ts                  # Web Audio countdown beeps / chimes
```

**State model:**
- The active workout session (current exercise index, completed sets, running timers) lives in a Zustand store persisted to `localStorage`, so an in-progress workout survives a page reload.
- Each exercise can have an independent **work** timer and/or **rest** timer (see `Exercise.workSeconds` / `restSeconds`, nullable — a `null` value hides that timer's button). Timers are started manually from `LivePlayer` and run in a `TimerDrawer`; `useTimerTicker` ticks all running timers once a second.
- Finished workouts are local-first: saved to `localStorage` immediately, then opportunistically synced to Supabase (`completed_workouts` table) when the user is signed in, so history works offline and across devices.
- Programs/blocks/exercises are the opposite: **Supabase-only** for editing (fetched on demand, written directly, no local merge logic) — see "Programs" under Integrations below. The one exception is `useActiveProgram`, which caches the *resolved* active program in `localStorage` purely so an in-progress workout can keep running if connectivity drops mid-session.

## Integrations

### Supabase

Used for two things:
1. **Auth** — Google OAuth sign-in (`AuthContext`, `AuthScreen`). The whole app is gated behind a signed-in session (`AppWrapper`).
2. **Sync** — completed workouts are upserted to a `completed_workouts` table (`utils/supabaseSync.ts`) keyed by the authenticated user, and pulled/merged with local history on load. The table schema (see `syncWorkoutToSupabase`) is: `id, user_id, date, duration_minutes, total_sets_completed, rpe, notes, exercise_logs` — managed directly in the Supabase dashboard; this repo doesn't track migrations.

Configure via environment variables (e.g. in `.env.local`, not committed):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

### Vercel

The app is a static Vite build with no server-side code, so it deploys to Vercel with zero extra configuration — Vercel auto-detects the Vite framework preset and runs `npm run build`. The same `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` env vars need to be set in the Vercel project settings for production builds.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in your Supabase project values
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run lint` | Run Oxlint |
