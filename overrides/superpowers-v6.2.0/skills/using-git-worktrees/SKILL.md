---
name: using-git-worktrees
description: Use when substantive feature work in a Git repository needs isolation or an existing isolated workspace must be verified.
---

# Focused Git Worktrees

Use a worktree by default for substantive feature work in a Git repository. Do not ask for routine consent because the global workflow already declares this preference. Work in place for non-repositories, configuration outside a repository, explicit user direction, or required local environments that isolation would break; report the exception.

1. Detect whether the current directory is already a linked worktree and not a submodule.
2. Prefer harness-native worktree tools. Otherwise use an existing `.worktrees/` or `worktrees/` directory, defaulting to `.worktrees/`.
3. Verify a project-local worktree directory is ignored. Add the ignore entry if needed, but do not commit it without explicit authorization.
4. Create a clearly named worktree without modifying unrelated state.
5. Install only dependencies needed for the approved slice and run the narrowest meaningful baseline checks for its dependency surface.

If baseline checks fail, determine whether the failure affects the slice. Continue while recording unrelated pre-existing failures; ask the user only when the failure creates a material decision or prevents trustworthy implementation. Never run a broad setup or full test suite by default.
