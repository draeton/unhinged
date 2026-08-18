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

Used for three things:
1. **Auth** — Google OAuth sign-in (`AuthContext`, `AuthScreen`). The whole app is gated behind a signed-in session (`AppWrapper`).
2. **Sync** — completed workouts are upserted to a `completed_workouts` table (`utils/supabaseSync.ts`) keyed by the authenticated user, and pulled/merged with local history on load. The table schema (see `syncWorkoutToSupabase`) is: `id, user_id, date, duration_minutes, total_sets_completed, rpe, notes, exercise_logs` — managed directly in the Supabase dashboard; not tracked as a migration.
3. **Programs** — configurable workout programs/blocks/exercises (`programs`, `program_blocks`, `program_block_exercises`, `exercises`, plus the read-only `template_*` tables used to seed a new user's first program). This is the one part of the schema that *is* tracked as code, under `supabase/migrations/` — see below.

Configure via environment variables (e.g. in `.env.local`, not committed):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

#### Schema migrations (`supabase/migrations/`)

The `programs`/`exercises` schema is managed as versioned SQL migrations via the [Supabase
CLI](https://supabase.com/docs/guides/cli), checked into `supabase/migrations/`. This is a
deliberate exception to the "no schema-as-code" approach used for `completed_workouts` above —
introduced because this schema is relational and non-trivial enough that hand-editing it in the
dashboard isn't safe to do from memory.

One-time local setup:

```bash
npx supabase login                              # opens a browser to authenticate the CLI
npx supabase link --project-ref <your-project-ref>   # from the project's dashboard URL
```

To make a schema change:

```bash
npx supabase migration new <description>   # creates supabase/migrations/<timestamp>_<description>.sql
# hand-write the SQL in the generated file
npm run db:push                             # applies pending local migrations to the linked project
npm run db:types                            # optional: regenerate src/types/database.ts from the live schema
```

Migrations pushed to `main` are also applied automatically by
`.github/workflows/supabase-migrations.yml` — see **CI** below. `completed_workouts` predates
migrations and isn't managed this way; don't run `supabase db pull`, which would try to
reverse-engineer the whole existing schema into a migration.

### Vercel

The app is a static Vite build with no server-side code, so it deploys to Vercel with zero extra configuration — Vercel auto-detects the Vite framework preset and runs `npm run build`. The same `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` env vars need to be set in the Vercel project settings for production builds.

## CI

There is no build/test CI — those are only ever run locally by whoever is pushing (see
CLAUDE.md). The one exception is `.github/workflows/supabase-migrations.yml`, which applies
new files under `supabase/migrations/` to the linked Supabase project whenever they land on
`main`. It needs these repo secrets configured under **Settings → Secrets and variables →
Actions**:

| Secret | Where to find it |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Supabase dashboard → Account → Access Tokens |
| `SUPABASE_PROJECT_REF` | The project's dashboard URL (`supabase.com/dashboard/project/<ref>`), or Project Settings → General → "Reference ID". **Not** `supabase/config.toml`'s `project_id` — that's just a local disambiguation label (defaults to the folder name), not the actual project ref. |
| `SUPABASE_DB_PASSWORD` | The project's Postgres password (dashboard → Database → Settings; resettable if lost) |

This workflow pushes directly to the linked (production) project on every merge that touches a
migration file — there's no staging project in this setup. Review migration SQL carefully in
PRs before merging to `main`.

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
| `npm run db:push` | Apply pending `supabase/migrations/*.sql` to the linked Supabase project |
| `npm run db:types` | Regenerate `src/types/database.ts` from the linked project's live schema |
