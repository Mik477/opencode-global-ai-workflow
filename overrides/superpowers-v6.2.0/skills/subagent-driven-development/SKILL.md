---
name: subagent-driven-development
description: Use when an approved implementation plan contains bounded independent work that materially benefits from isolated subagent context or parallel execution.
---

# Focused Subagent Development

**REQUIRED GOVERNING SKILL:** Use `focused-delivery`. Delegation is optional and never changes its approval or review budget.

The primary agent owns architecture, integration, the goal contract, and stopping decisions. Delegate bounded research, isolated implementation, or focused verification only when it protects context or shortens wall-clock time.

Each brief states the slice context, exact owned files or read-only scope, accepted decisions, expected output, verification responsibility, and prohibitions on unrelated analysis or edits. Parallel agents must not share writable scope. Answer routine subagent questions from the approved plan rather than forwarding them to the user.

Inspect each returned diff and evidence before integration. Do not dispatch a fresh implementer for every tiny plan step, require subagent commits, create a separate ledger, or run per-task specification and quality reviews.

At an independently useful vertical-slice boundary, the primary agent may dispatch one reviewer whose prompt MUST require invoking `scope-bounded-review` in the reviewer's own context. Consolidate blockers into one fix wave and run one scoped re-review. Residual blockers return to the user; there is no autonomous third round or broad final review.
