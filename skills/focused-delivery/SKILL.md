---
name: focused-delivery
description: Use when substantive feature, bug-fix, migration, configuration, or deployment work needs planning and execution across multiple steps or components.
---

# Focused Delivery

## Core Principle

Optimize for the approved user outcome. Scope, review, and verification serve the goal contract; they do not generate new requirements.

## Start Contract

After inspecting relevant context, inventory foreseeable material questions and ask independent questions in one concise batch. Then present the design and implementation plan with a contract of at most ten labeled lines:

```text
Goal:
User-visible outcome:
Acceptance criterion AC-1:
Acceptance criterion AC-2:
Acceptance criterion AC-3:
Non-goals:
Supported operating assumptions:
Verification boundary:
Review boundary:
Browser handoff condition:
```

Vary the acceptance count when needed, but keep the contract within ten lines. Request one approval for the contract, design, and plan together.

Do not add section approvals, written-spec approval, execution-mode selection, or a second plan gate. After approval, proceed autonomously unless a new material product, security, compatibility, data-loss, cost, or scope decision falls outside the contract.

## Execute In Vertical Slices

Organize work around independently useful, browser-testable or releasable outcomes. Do not split work merely to create reviewer gates. Delegate only bounded research, isolated implementation, or focused verification; the primary agent owns architecture and integration.

At each slice boundary:

1. Verify only the approved dependency surface.
2. Dispatch at most one reviewer. The reviewer prompt MUST require invoking `scope-bounded-review` in its own context before inspection. If a session that just installed these files cannot invoke the skill until restart, the reviewer MUST read `~/.config/opencode/skills/scope-bounded-review/SKILL.md` directly and follow it; this fallback is only for the pre-restart session.
3. Consolidate blocking findings into one fix wave.
4. Run one scoped re-review.
5. Ask the user about any residual blocker, new load-bearing finding, or proposed assumption change. Never start a third review round autonomously.

## Readiness And Browser Boundary

Before saying `ready`, verify relevant runtime provenance when runnable artifacts changed: expected source revision/worktree, running UI/server/backend identity, migration/schema state, relevant health or API result, and representative data prerequisites. Healthy processes alone do not prove current code is running. Do not broaden this list when a component is outside the approved slice.

Visual and browser testing belong to the user unless the user explicitly asks the agent to perform it. A statement that testing is manual, that the user will test, or that the agent should prepare browser scenarios is not authorization for agent-run browser testing. Do not launch browsers, browser automation, visual agents, or perform a browser preflight. Handoff with the launch command, URL, required state, concise checklist, changed files, known gaps, and deferred risks.

## Red Flags

- A reviewer finding cannot cite `AC-N` or `INV-N`.
- Work is justified only by possible future use.
- Another approval is requested for an already approved routine choice.
- A task exists mainly so it can be reviewed.
- Verification expands beyond the named dependency surface.
- The agent starts doing the user's browser testing.

Any red flag means stop that activity and return to the goal contract.

## Rationalizations

| Thought | Decision |
|---|---|
| "One more review will be safer" | A third round is a user decision. |
| "This could matter in future" | Defer it unless it violates the current contract. |
| "The skill requires another approval" | This global user workflow has one approval. |
| "Healthy containers are enough" | Verify relevant source and state provenance. |
| "A quick browser check helps" | Browser testing belongs to the user. |
| "Manual browser testing means I should do it" | Only an explicit request that the agent run it transfers ownership. |
