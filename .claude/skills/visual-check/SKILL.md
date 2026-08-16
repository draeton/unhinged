---
name: visual-check
description: Take real-browser screenshots of a component in this app, bypassing the Supabase auth gate that blocks a normal npm run dev + browser check.
---

# Visual-check a UI change

The whole app is gated behind Supabase auth (`src/main.tsx` → `AuthProvider` → `AppWrapper` →
`AuthScreen` if signed out), so you can't just start the dev server and click around without a real
Google login. This mounts the target component directly instead, using real app data
(`DEFAULT_WORKOUT_BLOCKS` etc.) so it looks and behaves like the real thing.

**Follow every step, including the cleanup at the end — skipping the revert leaves the real app
unbootable behind a component-only harness.**

## Steps

1. **Confirm a clean working tree** before touching `src/main.tsx` (`git status --short`) — you're
   about to overwrite it and revert with `git checkout --`, which requires nothing else was pending
   there.

2. **Start the dev server** if it isn't already running:
   ```
   npm run dev
   ```
   (runs on :5173 by default; note the actual port it prints).

3. **Temporarily rewrite `src/main.tsx`** to mount the target component directly instead of `<AppWrapper />`.
   Example, for `LivePlayer`:
   ```tsx
   import { StrictMode } from 'react'
   import { createRoot } from 'react-dom/client'
   import './index.css'
   import { LivePlayer } from './components/LivePlayer.tsx'
   import { DEFAULT_WORKOUT_BLOCKS } from './data/workoutData.ts'

   createRoot(document.getElementById('root')!).render(
     <StrictMode>
       <div style={{ background: 'var(--bg-dark)', minHeight: '100vh' }}>
         <LivePlayer blocks={DEFAULT_WORKOUT_BLOCKS} onPlayVideo={() => {}} />
       </div>
     </StrictMode>,
   )
   ```
   Swap in whatever props/component the change actually touches. Vite's HMR picks this up immediately.

4. **Install a throwaway browser driver** (not saved to `package.json`/lockfile):
   ```
   npm install --no-save playwright-core
   ```
   Drive the machine's already-installed Chrome rather than downloading Chromium:
   `executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'` (macOS path — adjust
   per platform).

5. **Write a small `.cjs` script** (must be `.cjs` — this package is `"type": "module"`) at the repo
   root, e.g. `.tmp-shoot.cjs`, that launches headless Chrome, navigates to the dev server URL,
   interacts as needed (`page.getByRole(...).click()`, etc.), and screenshots to a path in the
   session's scratchpad directory — not inside the repo. Log `pageerror`/console `error` events too, to
   catch runtime issues screenshots alone wouldn't show.

6. **Run it**: `node .tmp-shoot.cjs`. Review the screenshots (Read tool supports PNGs directly).

7. **Clean up — always, even if the check failed or you're switching to another check:**
   ```
   git checkout -- src/main.tsx
   rm -f .tmp-shoot.cjs
   npm uninstall playwright-core --no-save
   ```
   Confirm with `git status --short` that the tree is clean again before moving on.

## Notes

- For a multi-step interaction (open a drawer, wait, screenshot again), `page.waitForTimeout(...)`
  between steps is fine for this kind of one-off check — no need for a full Playwright test harness.
- If the check needs real elapsed time to matter (e.g. verifying a countdown actually ticks), wait
  several real seconds between screenshots rather than trying to fake time in a live browser — that's
  what the Vitest fake-timer tests are for; this check is about confirming real-world behavior.
