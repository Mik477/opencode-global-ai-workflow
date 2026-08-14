# Focused Delivery Workflow

These are explicit global user instructions. They override conflicting package-skill defaults.

## Applicability

- For substantive feature, bug-fix, migration, configuration, deployment, or other multi-step artifact work, invoke `focused-delivery` before planning or implementation.
- Substantive work always pauses once for combined approval of the goal contract, cohesive design, and comprehensive plan, even when the request appears technically determinate.
- Trivial questions, read-only lookups, discussion-only requests, and small reversible edits do not require the formal contract. If the user explicitly requests only analysis, advice, brainstorming, or a plan, do not implement.
- `/autofeature` is optional. Normal prompts activate the same workflow.

## Discovery

- Inspect project instructions, relevant code, documentation, tests, recent changes, runtime configuration, and supplied evidence before proposing a solution.
- Inventory all foreseeable questions whose answers could materially change purpose, behavior, UX, compatibility, data handling, supported assumptions, or acceptance. Ask independent questions in one concise batch. Ask a later question only when an answer reveals a genuinely new dependency.
- Resolve routine methods from the request, repository evidence, conventions, and safe reversible judgment. Present alternatives only when a material user preference exists.

## Single Approval Contract

Present one cohesive analysis, design, and implementation plan with a goal contract of at most ten labeled lines:

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

Vary the acceptance count when needed but keep the contract within ten lines. Request one combined approval. After approval, save useful design and plan records, self-review them once, choose work methods internally, and implement autonomously.

Do not request section approvals, a second written-spec review, a separate plan approval, an execution-mode choice, routine task approval, permission to continue, or compulsory commits. Ask again only when an unexpected discovery creates a material product, security, compatibility, data-loss, cost, or scope decision outside the approved contract.

## Planning And Execution

- Save a durable plan under `docs/superpowers/plans/` for substantive multi-step work. Organize it into independently useful, browser-testable or releasable vertical slices, not two-to-five-minute micro-tasks or reviewer gates.
- Use `task_create`, `task_get`, `task_list`, and `task_update` as the only writable progress source. Keep a small dynamic execution tree separate from the detailed plan. Native `todowrite` remains disabled.
- The main model owns architecture, integration, the goal contract, and stopping decisions. Delegate bounded research, isolated implementation, or focused verification only when it protects context or shortens wall-clock time. Never overlap writable scope.
- Give subagents accepted decisions, narrow scope, relevant paths, expected output, and verification responsibility. Answer routine questions yourself. Inspect returned changes and evidence before integration.

## Review Budget

- Review once at each independently releasable or browser-testable vertical-slice boundary, not after every task.
- Every reviewer prompt MUST require the reviewer to invoke `scope-bounded-review` in its own context. Skills loaded by the parent do not transfer automatically. If the skill was installed during the current session and is unavailable until restart, the reviewer must read `~/.config/opencode/skills/scope-bounded-review/SKILL.md` directly and follow it; do not review without one of these two loading paths.
- A blocker must cite a violated `AC-N` acceptance criterion or `INV-N` established repository invariant, concrete evidence, a realistic supported failure, and the minimal required resolution.
- Consolidate valid blockers into one fix wave, then run one scoped re-review. Do not start a third review round. Return any residual blocker, new load-bearing finding, or proposed assumption expansion to the user for a decision.
- Defer unsupported concurrency, future scale, speculative hardening, optional polish, and risks excluded by approved assumptions. Do not dispatch automatic specification, quality, security, or final-review swarms.

## Verification And Provenance

- Run the narrowest meaningful existing tests, type checks, lint checks, builds, and inspections covering the changed dependency surface. Broaden only for concrete shared-dependency risk.
- Add automated regression tests for meaningful behavior and reproduced defects. Do not add tests for prose, static configuration, trivial wiring, visual appearance, or behavior assigned to user browser testing.
- Never claim a check passed unless its evidence was inspected. Do not rerun unchanged evidence merely to satisfy process; state when prior evidence still applies.
- When runnable artifacts change, establish provenance at the first handoff-capable state and verify it freshly before saying `ready`: expected revision/worktree, running UI/server/backend identity, migration/schema state, relevant health or API result, and representative data prerequisites. Limit this to components in the approved slice. Healthy containers alone do not prove current code is running.

## Workspace And Git

- Use a Git worktree by default for substantive feature work in a Git repository without asking routine consent. Work in place for non-repositories, global configuration, explicit user direction, or required environments that isolation would break; state the exception.
- Do not create commits, push, publish, deploy, merge, open pull requests, release, discard, or clean up branches/worktrees unless the user explicitly requests that action.
- Preserve unrelated worktree changes and never revert work you did not create.

## Browser Handoff

- Visual and browser testing belong to the user unless the user explicitly asks the agent to perform it. Saying testing is manual, that the user will test, or that browser scenarios should be prepared does not authorize agent-run browser testing.
- Do not launch browsers, Playwright, Cypress, visual agents, browser automation, or a browser preflight by default.
- Handoff with the exact launch command, URL, required state, concise browser checklist, changed-file summary, automated evidence, known gaps, and deferred risks. Clearly label browser behavior as pending user verification.

## Skill Precedence And Maintenance

- `focused-delivery` governs substantive orchestration. `scope-bounded-review` governs reviewer output. Invoke other skills only for useful techniques that fit this contract.
- This policy and those personal skills replace package defaults requiring serial interviews, section approvals, second spec approval, execution-mode selection, mandatory commits, micro-task reviews, five-round fix loops, full-suite completion gates, browser preflights, or automatic integration menus.
- Superpowers is pinned to v6.2.0. Its high-risk skill entry points are deterministically replaced from tracked override sources after dependency installation. An intentional package update must reassess those overrides before changing the pin.

## Context Compression

- Use DCP `compress` after a tool-heavy investigation, implementation phase, verification pass, or other coherent range is closed. Preserve exact decisions, paths, interfaces, constraints, evidence, unresolved work, report contracts, and user intent.
- Do not compress raw context needed for an imminent edit, active debugging hypothesis, unresolved error, or pending decision. Native compaction remains the final fallback.

## Disabled Automation

Do not reactivate OMO, background-agent plugins, Codegraph, native-todo syncing, automatic browser automation, or automatic review swarms.
