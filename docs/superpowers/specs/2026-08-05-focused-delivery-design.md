# Focused Delivery Design

## Purpose

Make substantive OpenCode work converge on the approved product outcome without repeated approval gates, review recursion, theoretical hardening, or agent-owned browser testing.

## Goal Contract

Before planning substantive features, bug fixes, migrations, configuration changes, or deployments, the primary agent presents a contract of at most ten labeled lines:

1. Goal
2. User-visible outcome
3. Acceptance criterion AC-1
4. Acceptance criterion AC-2
5. Acceptance criterion AC-3
6. Non-goals
7. Supported operating assumptions
8. Verification boundary
9. Review boundary
10. Browser handoff condition

The number of acceptance criteria may vary, but the whole contract remains at most ten lines. Trivial, reversible edits do not require a formal contract.

## Approval And Execution

The agent inspects relevant context, inventories foreseeable material questions, and asks independent questions in one concise batch. It then presents the goal contract, cohesive design, and implementation plan together for one approval. There is no section-by-section approval, second written-spec approval, execution-mode question, or routine permission-to-continue prompt.

After approval, the primary agent owns architecture and integration. It may delegate bounded research or isolated implementation, but delegation is a work method rather than a source of additional approval or review gates. Work is organized into independently useful, browser-testable or releasable vertical slices rather than tiny tasks created for reviewers.

## Review Budget

Each vertical slice receives at most one review. A blocking finding must identify the violated acceptance criterion (`AC-N`) or established repository invariant (`INV-N`), provide concrete evidence, describe a realistic supported failure, and state the minimal required resolution.

The agent consolidates all blocking findings into one fix wave and performs one scoped re-review. Remaining load-bearing findings, new blockers, or requests to expand supported assumptions require an explicit user decision. There is no autonomous third review round. Theoretical improvements and risks excluded by approved operating assumptions are deferred.

## Verification And Provenance

The goal contract defines the proportionate verification boundary. The agent runs the narrowest meaningful tests, type checks, lint checks, and builds covering the changed dependency surface. It does not expand verification merely because a broader suite exists.

For a runnable or deployed vertical slice, establish provenance at the first handoff-capable state and verify it freshly before saying `ready` when artifacts changed. Relevant evidence includes expected source revision/worktree, running UI/server/backend source or image identity, migration/schema state, relevant health or API result, and representative project/data prerequisites. Healthy containers alone do not prove current code is running.

## Browser Boundary

Visual and browser testing belong to the user by default. The agent does not launch browsers, Playwright, visual agents, or perform a browser preflight unless explicitly requested. The handoff includes the launch command, URL, required test state, concise checklist, changed-file summary, known gaps, and deferred risks.

## Skill Architecture

`focused-delivery` governs substantive orchestration. `scope-bounded-review` governs reviewer behavior and must be loaded inside the reviewer subagent's own context. The parent skill does not transfer automatically to a child context.

The installed Superpowers package remains pinned. Conflicting high-risk skill triggers and procedures are narrowed from tracked override sources after dependency installation because baseline pressure testing showed that global prose overrides alone were ignored. Package updates must intentionally reassess these overrides.

## Baseline Evidence

Fresh agents operating under the previous configuration exhibited these failures:

- no compact goal contract;
- section-by-section design approvals;
- a second written-spec approval;
- a separate plan approval and execution-mode gate;
- per-task review orchestration;
- a browser preflight owned by the agent despite the manual-browser boundary;
- deployment checks broader than the supported handoff required.

These observed failures define the behavior the new skills must change.
