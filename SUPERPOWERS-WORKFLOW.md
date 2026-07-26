# Adaptive Superpowers Workflow

These are explicit user workflow instructions. They take precedence over conflicting Superpowers skill defaults.

## Default Trigger And Discovery

- Apply this policy whenever the user requests execution, including feature work, bug fixes, configuration, research, analysis, searches, reports, documents, and other artifact creation. `/autofeature` is optional and is not required to activate it. If the user explicitly requests only discussion, brainstorming, advice, or a plan, do not start implementation.
- First inspect project instructions, the relevant workspace, available inputs, and source context. Before the first interruption, identify all foreseeable material questions. Ask independent questions together in one concise batch; ask a later follow-up only when an earlier answer genuinely reveals a new dependent question.
- Resolve routine execution details from the accepted request, available evidence, domain or repository conventions, and safe reversible judgment. Ask about purpose, behavior, UX, constraints, output requirements, or success criteria only when the answer could materially change the result.
- Offer outcome or design approaches only when there is a meaningful choice requiring user preference. Choose work methods internally, including tools, APIs, sources, search strategy, decomposition, plan structure, file organization, verification steps, and delegation. Do not present these methods for approval.
- When a material outcome or design choice exists, present one cohesive proposal scaled to the work and request one approval. Do not ask for approval after each section. A clear request with no unresolved material choice is already sufficient authorization; do not manufacture a design gate.

## Approval And Handoff Contract

- Treat the accepted request or one material outcome/design approval as the only routine user-facing approval surface. Then write any useful design record, self-review it, create any required detailed plan, choose the execution method internally, and start the requested work automatically in the same session.
- Do not ask the user to approve how the work will be performed, review a written specification or implementation plan, choose between inline and subagent-driven execution, confirm routine task boundaries, approve reversible choices, or say whether work should continue. Stop only for a material decision or blocker defined below.
- Invoke relevant skills, but adapt their procedures to this contract. This section explicitly replaces conflicting package-skill steps that require a one-question-per-message interview when questions can be batched, every task to have a design gate, section-by-section design approvals, a second written-spec approval, an execution-mode question, compulsory commits, an unsolicited visual-companion offer, or automatic per-task and final reviewer dispatches.
- Keep useful skill methods such as discovery, self-review, planning, test discipline, debugging, worktree safety, and evidence-based verification. Never follow a skill's commit instruction because the no-commit rule below requires explicit user authorization.

## Workspace Isolation

- Use a Git worktree by default for substantive feature work in a Git repository.
- Work in place when the directory is not a Git repository, the change is configuration outside a repository, the user explicitly requests in-place work, or isolation would break a required local environment. State the applicable exception.
- Do not create commits, push, publish, deploy, open pull requests, or release unless the user explicitly requests that action.

## Durable Detailed Plan

- After discovery settles the design, write a durable detailed plan under `docs/superpowers/plans/` for substantive multi-step work.
- Include exact file and verification references useful for execution, delegation, scope control, and recovery after compaction. The user is not expected to monitor or approve the plan routinely.
- Keep the plan stable through small implementation discoveries. Update it when scope or architecture changes materially.

## Dynamic Execution Tree

- Use `task_create`, `task_get`, `task_list`, and `task_update` as the only writable progress source. Native `todowrite` is disabled for normal agents; ignore any package tool mapping that recommends it. Do not duplicate progress into native todos or another writable task source.
- Keep the execution tree separate from the detailed plan. Create a feature root with a small, reasonably scaled set of milestone children, normally discovery/design, implementation workstreams, verification, and browser handoff.
- Treat the tree as a live operational projection, not a one-to-one copy of plan steps. Add fine-grained tasks only for current or near-term work when they improve observability, dependency tracking, or delegation.
- Normally use two or three useful hierarchy levels. Keep statuses, active descriptions, owners, priorities, and real blockers current; split, reparent, add, or remove work as implementation reality changes.
- Store the detailed plan path in the feature root metadata when the task tools support it.

## Delegation And Integration

- The main model owns architecture, integration, the durable plan, and the execution tree.
- Delegate bounded research, isolated implementation, or focused verification when it usefully protects main-session context or reduces wall-clock time. Do not delegate merely to create process.
- Choose inline work or delegation internally for each task. Never ask the user to select an execution mode.
- Give each subagent a narrow brief, expected output, owned files where applicable, and verification responsibility. Do not assign overlapping edits in parallel.
- Represent delegated work in the same execution tree. The main model must inspect integrated changes and verification evidence independently.
- Do not dispatch automatic specification, quality, security, final-review, or other review swarms.

## Unexpected Decisions

- Continue autonomously while execution follows the accepted request or design. Routine engineering, research, and work-method choices do not require approval.
- The main model answers routine subagent questions from the accepted design, repository evidence, plan, and safe reversible judgment. Subagents do not interview the user through the main model.
- Ask the user only when an unexpected discovery creates a material objective, output, product, security, compatibility, data-loss, cost, or scope decision that cannot be inferred safely. If multiple independent material decisions are known, batch them into one concise interruption.
- Do not escalate a question merely because a skill, plan, or subagent asks it. If the choice is routine, reversible, or recoverable from existing evidence, decide and continue.
- Make the interruption and blocker visible in the execution tree. Replan only when the accepted design or dependency structure changes materially.

## Verification

- Verify proportionally with the narrowest meaningful existing tests, type checks, lint checks, and builds that cover the changed dependency surface. Broaden checks when risk or shared dependencies justify it.
- Add regression tests for meaningful behavior and reproduced defects. Do not add tests for prose, static configuration, trivial wiring, visual appearance, or unrelated coverage expansion. These exclusions are standing authorization to omit new tests; do not ask the user for a TDD exception.
- Never claim a check passed unless it was actually run and its result inspected.

## Context Compression

- DCP is enabled in primary and subagent sessions. Use its `compress` tool proactively after an investigation, implementation phase, verification pass, or other conversation range is genuinely closed. Do not wait for the context limit when stale tool output or completed reasoning is already safe to summarize.
- Treat every tool-heavy phase boundary as a compression checkpoint. Before starting the next phase, explicitly assess whether the closed range can become summary-only; call `compress` when it can instead of merely noting that compression would help.
- Prefer compressing a coherent closed range containing long tool results and the conclusions derived from them. Preserve exact decisions, file paths, signatures, constraints, verification evidence, unresolved work, report contracts, and user intent in the summary.
- Do not compress raw content that is still needed for an imminent edit, an active debugging hypothesis, an unresolved error, or a decision still in progress. Re-evaluate it as soon as that phase closes.
- Long-running subagents manage their own context and compress closed internal phases when needed. Short, tightly scoped subagents need not manufacture a compression call. Subagents still return concise reports, and the main model separately decides when integrated subagent results and surrounding orchestration traffic can be compressed.
- A successful model-invoked compression produces DCP's persistent detailed chat notification. Do not imitate that notification with ordinary prose; visibility must come from the actual `compress` call.
- Native OpenCode compaction remains the final context-limit fallback, not a substitute for selective phase-based DCP compression.

## Browser Handoff

- Do not launch browser automation, browsers, development servers, Playwright, Cypress, or visual-review agents by default.
- Do not offer a visual companion or browser mode unless the user asks for one or a material visual decision genuinely cannot be resolved through repository evidence and text.
- For user-facing work, complete automated verification and hand browser review to the user with the exact launch command, URL, required test state, a concise checklist, changed-file summary, and known gaps.
- Keep an isolated worktree available for feedback when one was used; integration remains an explicit later decision.

## Disabled Automation

- Do not reactivate OMO, background-agent plugins, Codegraph, native-todo syncing, automatic browser automation, or automatic review swarms.
