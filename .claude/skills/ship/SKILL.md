---
name: ship
description: Branch, implement, verify, and open a PR for a change in this repo, following its established conventions (feature branch, build+test before push, PR template).
---

# Ship a change

Use this for any non-trivial change in this repo: a feature, a bug fix, a docs update, a chore. It
codifies the workflow this repo has used for every PR so far.

## Steps

1. **Get an up-to-date base.** Check `git status` first — if there are uncommitted changes on the
   current branch that belong to this change, stash them (`git stash push -u -m "..."`) before
   switching, and pop them back *after* creating the new branch. If the changes belong to a different,
   still-open PR/branch, leave them there — don't carry them onto a new branch by mistake (see the
   pitfall below).
   ```
   git fetch origin --quiet
   git checkout main
   git pull origin main --ff-only
   git checkout -b <type>/<short-description>
   ```
   Branch prefix matches the change: `feat/`, `fix/`, `docs/`, `chore/`.

2. **Implement the change.**

3. **Verify before committing anything:**
   ```
   npm run build
   npm test -- --run
   ```
   Both must be clean. If the change is UI-visible, also do a manual/visual check — see
   `.claude/skills/visual-check/SKILL.md` (the app is auth-gated, so a normal `npm run dev` +
   browser click-through doesn't work without that workaround).

4. **Commit.** Explain *why*, not just what — see recent `git log` for this repo's style. Do not use
   `--no-verify` or otherwise bypass hooks.

5. **Push and open a PR:**
   ```
   git push -u origin <branch>
   gh pr create --title "..." --body "$(cat <<'EOF'
   ... filled-in .github/PULL_REQUEST_TEMPLATE.md ...
   EOF
   )"
   ```
   Always use the repo's PR template (`.github/PULL_REQUEST_TEMPLATE.md`) — fill in every section
   (Summary, Changes, Type checkbox, Testing checkboxes, Screenshots if UI, Notes), don't replace it
   with a freeform body.

## Pitfall: stacking work on an unmerged branch

If you're starting new work while a previous branch/PR from this same session is still open (not yet
merged), **do not** blindly stash-and-branch-off-`main` — `main` won't have that branch's commits yet,
and a stash only carries *uncommitted* changes, not committed ones. Popping the stash onto a fresh
`main`-based branch silently drops anything that was already committed on the other branch, which can
produce a subtly-broken merge (files half-updated) with no error.

Before branching for new work, check whether the most recent related PR is actually merged:
```
gh pr view <number> --json state,mergedAt
```
- If merged: `git pull origin main --ff-only` will include it — safe to branch fresh off `main`.
- If still open and this new work is a direct continuation of it (not a separate concern): keep working
  on that same branch and push another commit, updating the same PR, rather than branching off `main`.
