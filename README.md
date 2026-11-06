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
