# CLAUDE.md

Guidance for Claude Code (or any agent) working in this repo. See `README.md` for the full
architecture writeup — this file only covers what changes how you should work here.

## Project

**Unhinged** — a mobile-first PWA for running a guided calisthenics/mobility workout. React 19 +
TypeScript + Vite, Zustand for in-session state (persisted to `localStorage`), Supabase for auth
(Google OAuth) and workout-history sync, deployed on Vercel. No backend of its own.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and build for production — must be clean before pushing |
| `npm test` | Run the full Vitest suite once — must pass before pushing |
| `npm run test:watch` | Vitest in watch mode |
| `npm run lint` | Oxlint |

There is no CI. Build and test are only ever verified locally, by whoever (or whatever) is
pushing — always run both before opening or updating a PR.

## Workflow conventions

- **Never commit or push directly to `main`.** Always branch first (`feat/…`, `fix/…`, `docs/…`,
  `chore/…`). This is enforced by a hook (`.claude/settings.json` → `hooks.PreToolUse`,
  `.claude/hooks/block-main-branch-writes.js`), not just a suggestion.
- Branch off an up-to-date `main`: `git fetch origin && git checkout main && git pull origin main --ff-only`
  before creating a new branch — this repo has had several PRs merge in quick succession, so a stale
  local `main` is a real risk.
- **Always use `.github/PULL_REQUEST_TEMPLATE.md`** when opening a PR (`gh pr create --body ...` with
  that template's sections filled in, not a freeform summary).
- One logical change per PR/branch, matching this repo's history (e.g. the interval-timer replacement,
  its follow-up UI refinements, the drawer-glow fix, and the background-timer-drift fix were each
  separate PRs even though closely related).
- See `.claude/skills/ship/SKILL.md` for the full branch → build/test → commit → push → PR sequence.

## Store conventions (`src/store/workoutStore.ts`)

**Never track elapsed/remaining time by decrementing a counter on a `setInterval` tick.** Both the
global workout-duration counter and the per-exercise work/rest countdown timers were built that way
originally, and both had to be fixed for the same bug: browsers throttle or suspend `setInterval` in a
backgrounded tab, so a tick-counted value silently falls behind real elapsed time.

The fix, and the pattern any new timer/duration state must follow: store a `startedAt` (epoch ms) and
an `accumulatedMs` (time elapsed across prior running segments, i.e. excluding paused time), and derive
the displayed value from `Date.now()` on demand — see `computeRemainingSeconds` and `refreshTimer` for
the per-exercise timers, `refreshElapsedTime` for the global counter. Refresh on a 1s interval **and**
immediately on `visibilitychange`/`focus`, so the value snaps to correct the instant the app regains
focus instead of waiting on a possibly-throttled tick.

Work/rest timer state is keyed by `` `${exerciseId}:${'work' | 'rest'}` `` (see `TimerDrawer.tsx`'s
`timerKey` helper) — reuse that helper rather than constructing the key string inline.

## Testing conventions

Any test covering time-dependent store/hook logic should use `vi.useFakeTimers()` +
`vi.setSystemTime()` to control `Date.now()` deterministically, not real timers or `sleep`. See
`src/store/workoutStore.test.ts` and `src/hooks/useTimerTicker.test.ts` for the established pattern
(set a fixed base time in `beforeEach`, advance with `vi.setSystemTime(...)`, restore real timers in
`afterEach`).

## Auth note

The whole app is gated behind a Supabase session (`AppWrapper` → `AuthScreen` if signed out). Don't try
to fake or bypass Supabase auth to test UI changes in a browser — use `.claude/skills/visual-check/SKILL.md`,
which mounts the target component directly instead.
