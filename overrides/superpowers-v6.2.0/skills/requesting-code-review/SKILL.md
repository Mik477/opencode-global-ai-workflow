---
name: requesting-code-review
description: Use when a focused-delivery vertical slice reaches its approved review boundary or the user explicitly requests a code review.
---

# Requesting Scope-Bounded Review

Dispatch at most one reviewer for the current independently useful slice. The reviewer prompt MUST say: `Invoke scope-bounded-review before inspecting the change and follow its report contract.` Parent skill context does not transfer automatically. If the skill was installed during this still-running session and invocation is unavailable until restart, require the reviewer to read `~/.config/opencode/skills/scope-bounded-review/SKILL.md` and follow it instead; never review without loading that content.

Provide the reviewer only:

- the goal contract with `AC-N`, non-goals, and supported assumptions;
- applicable established `INV-N` repository invariants;
- the slice's diff or exact changed files;
- targeted verification evidence;
- whether this is the first review or scoped re-review.

Do not review after every task or dispatch an automatic whole-branch review. Accept `APPROVE`. For `BLOCK`, consolidate every valid blocker into one fix wave, then run one scoped re-review limited to those blockers and fix-introduced regressions. Do not start another review round; return residual blockers or proposed scope expansion to the user.
