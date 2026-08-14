# Focused Delivery Workflow

OpenCode CLI and Desktop share the global configuration in this directory. Fully restart both after configuration or skill changes.

## Daily Use

Describe the result directly. No command is required. For substantive work the primary agent automatically loads `focused-delivery`, inspects the project, asks foreseeable independent material questions in one batch, and presents a compact goal contract, cohesive design, and comprehensive plan together. You approve that package once by replying `Approved` or provide feedback.

After approval, the agent executes autonomously in independently useful, browser-testable or releasable vertical slices. It chooses tools, file structure, worktree use, delegation, and verification internally. It does not ask for section approvals, written-spec approval, plan approval, execution mode, routine task approval, commits, or permission to continue.

`/autofeature` remains an optional way to state the same intent explicitly:

```text
/autofeature Add organization-scoped API keys with create, revoke, and audit-log support. Preserve existing auth behavior. I will test the browser flow manually.
```

Trivial questions, read-only lookups, and small reversible edits remain lightweight. Discussion-only or plan-only requests do not trigger implementation.

## Goal Contract

The substantive-work contract is at most ten labeled lines covering the current goal, user-visible outcome, `AC-N` acceptance criteria, non-goals, supported operating assumptions, verification boundary, review boundary, and browser handoff condition. It is the stopping rule: work not required by an acceptance criterion or established invariant is not allowed to become a blocker silently.

## Reviews

Each independently releasable or browser-testable vertical slice gets one review. The reviewer subagent is explicitly told to load `scope-bounded-review` in its own context. Blocking findings must cite `AC-N` or `INV-N`, evidence, a realistic supported failure, and the minimal resolution.

The agent performs one consolidated fix wave and one scoped re-review. A third round, a residual load-bearing finding, or expansion of supported assumptions comes back to you as an explicit decision. Unsupported future scale, speculative hardening, optional polish, and excluded threat models are deferred rather than converted into requirements.

## Verification And Browser Testing

Automated verification is proportional to the changed dependency surface. Meaningful behavior and reproduced defects receive regression coverage; prose, static configuration, trivial wiring, visual appearance, and user-owned browser behavior do not require new tests.

For runnable changes, the agent verifies deployment provenance early: expected worktree/revision, relevant running UI/server/backend identity, migration/schema state, health or API evidence, and representative project data. This prevents a healthy but stale mixed deployment from being handed off.

You own visual and browser testing by default. The agent does not launch a browser or browser automation merely because you said testing will be manual. The handoff includes the launch command, URL, required state, concise checklist, changed files, automated evidence, known gaps, and deferred risks.

## Execution And Progress

Substantive Git feature work uses a worktree by default; global configuration and non-repositories are edited in place. Commits, pushes, merges, PRs, deployments, releases, discards, and cleanup require your explicit request.

The persistent task tools hold a small dynamic execution tree. Detailed multi-step plans live under `docs/superpowers/plans/`. The main model owns architecture and integration; focused subagents handle bounded research, isolated implementation, or verification without overlapping edits or automatic review swarms.

## Maintenance

Personal skills live under `~/.config/opencode/skills` and are registered through `skills.paths`. Superpowers v6.2.0 is pinned, and nine high-risk package skill entry points are deterministically narrowed from tracked overrides during `npm install`/`npm ci`. After an intentional package update, reassess the override set, fully restart OpenCode, and verify `opencode debug config`, `opencode debug skill`, and a fresh behavioral session.

Selective DCP compression remains enabled for closed tool-heavy phases. Codegraph, OMO/background agents, native-todo syncing, automatic browser automation, and automatic review swarms remain disabled.
