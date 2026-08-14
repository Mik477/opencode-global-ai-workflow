---
name: finishing-a-development-branch
description: Use only when the user explicitly asks to commit, merge, push, create a pull request, integrate, discard, or clean up completed branch work.
---

# Finishing A Development Branch

Do not invoke this skill merely because implementation is complete. A browser-testing handoff preserves the branch or worktree and requires no integration menu.

When the user explicitly requests integration:

1. Inspect `git status`, the intended diff, recent commits, branch/worktree state, and base branch.
2. Run fresh proportionate verification for the requested operation; do not automatically expand to the full suite.
3. Execute only the requested commit, merge, push, PR, discard, or cleanup action.
4. Preserve unrelated user changes and stage only intended files.
5. Confirm destructive cleanup separately with the exact affected branch, commits, and worktree.

Do not present a generic integration menu when the user already specified the desired action. Never commit, push, merge, create a PR, deploy, delete a branch, or remove a worktree without explicit user authorization.
