# BranchLab 2.0 · Visual 2-Player GitHub Collaboration Simulator

Learn multi-person Git & GitHub collaboration **solo** alongside **Codex**, your simulated AI teammate. Features a **Live Interactive SVG Branch Graph**, **Spotlight Step-by-Step Coach**, **1-Click Code Fill** (so you never get stuck on code syntax while learning Git), and a **Visual Merge Conflict Resolver**.

## Why BranchLab 2.0?

Practicing `git init` and `git commit` alone is easy—but real-world Git requires **at least two developers working on the same repository across different branches**. BranchLab 2.0 simulates a second developer (**Codex**) so you can visually practice:

| Mission | 2-Player Git Skill | What Happens |
| --- | --- | --- |
| **1 · Your first PR** | `checkout -b` · `commit` · `push` · `PR Merge` | You build Task A on `feature/user-task`, Codex builds Task B on `feature/codex-task`, and you review & merge each other's Pull Requests. |
| **2 · Resolve a conflict** | `git pull origin main` · `<<<<<<< HEAD` | You and Codex edit the exact same lines on different branches. Codex merges first! Use the **Visual Conflict Resolver** to combine both changes. |
| **3 · Connect the specs** | Cross-file PR review & spec matching | You write the feature spec while Codex writes the Java implementation; verify cross-file contracts before merging. |
| **4 · Fix the pipeline** | Failing GitHub Actions CI & `Request Changes` | Codex opens a PR that breaks unit tests. Inspect the red CI check, click **Request Changes**, watch Codex push a fix, and re-verify CI. |
| **5 · Rebase onto main** | `git fetch` · `git rebase main` | Codex merges a security update into `main` while you are working on your branch. Rebase your commit cleanly onto the tip of `main`. |
| **6 · Revert a bad merge** | `git log --oneline` · `git revert HEAD` | Codex accidentally merges a broken config to `main`. Safely roll it back using `git revert` and ship a hotfix PR! |
| **7 · Stash & pop work** | `git stash` · `git pull` · `git stash pop` | Codex merges an urgent config to `main` while your working tree has uncommitted WIP edits. Stash, pull `main`, and pop your stash! |
| **8 · Cherry-pick a commit** | `git log --oneline` · `git cherry-pick c0ffee7` | Codex has 3 WIP commits on an experimental branch, plus 1 critical security fix (`c0ffee7`). Pluck only `c0ffee7` onto your release branch! |
| **9 · Squash & merge PR** | `git merge --squash` · `Squash & Merge PR` | Codex opens a PR with 4 noisy WIP commits (`wip`, `fix typo`, `oops`, `done`). Squash them into 1 clean atomic commit before merging to `main`! |

## Run Locally

Requires Node.js 20 or newer. Zero external dependencies required.

```sh
npm start
```

Open **http://localhost:5173**.

```sh
npm test          # Run unit & workflow tests across all 6 missions
npm run check     # JavaScript syntax checks
npm run build     # Build static bundle to dist/
npm run verify    # Run syntax checks, test suite, and static build
```
