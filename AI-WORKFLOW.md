# Adaptive Superpowers Workflow

OpenCode CLI and Desktop share the global configuration in this directory. Fully restart both after configuration changes.

## Daily Use

Start OpenCode in the relevant workspace and describe the requested result directly. Normal execution prompts automatically use the adaptive workflow, including feature work, fixes, configuration, research, searches, reports, documents, and other artifacts; `/autofeature` is optional. The default `build` agent uses GPT-5.6 Sol at high reasoning and remains responsible for architecture and integration. Scoped `general` implementation subagents also use Sol at high reasoning; `explore`, isolated diagnostics, the small-model path, and hidden title, summary, and native-compaction agents use GPT-5.6 Terra at high reasoning.

The agent first inspects relevant instructions, workspace context, available inputs, and sources, then inventories foreseeable questions whose answers could materially change the result. Independent questions arrive in one concise batch; a later follow-up is reserved for a genuinely new dependency revealed by an earlier answer. Routine details are inferred from the request, available evidence, conventions, and safe reversible judgment. When a material outcome or design choice exists, the agent presents one cohesive proposal for one approval; it does not require section-by-section approval or manufacture a gate for an already-clear request.

After that approval, or immediately when the request is already determinate, the agent writes any useful internal record, self-reviews it, creates any required detailed plan, chooses its methods and inline work or delegation internally, and starts execution in the same session. Tools, APIs, sources, search strategy, decomposition, plan structure, file organization, verification, and delegation are not presented for approval. It does not ask you to review a written specification or plan, select an execution mode, approve routine task boundaries, confirm reversible choices, or say whether it should continue. Installed Superpowers skills still provide useful methods, but their conflicting one-question-at-a-time interview, extra approval, commit, browser-offer, and automatic-review gates are explicitly overridden by the active global policy.

Use `/autofeature` when you want to state explicit end-to-end autonomy over the same default workflow:

```text
/autofeature Add organization-scoped API keys with create, revoke, and audit-log support. Preserve existing auth behavior. I will review the browser flow manually.
```

Use the `plan` agent only when you explicitly want a deeper design pass; it uses GPT-5.6 Terra at high reasoning. Return to `build` for implementation.

## Isolation And Planning

Substantive feature work in a Git repository uses a worktree by default. Valid exceptions are a non-repository directory, configuration outside a repository, an explicit request to work in place, or a required local environment that isolation would break; the agent reports the exception. Commits, pushes, pull requests, releases, and deployment still require an explicit request.

After adaptive discovery settles the design, substantive multi-step work gets a durable detailed plan under `docs/superpowers/plans/`. The plan supports execution and compaction recovery, exact file/test references, delegation, and scope control. It is an internal execution artifact rather than another approval gate; the agent proceeds automatically unless planning uncovers a new material decision.

## Progress

The persistent `task_create`, `task_get`, `task_list`, and `task_update` tools hold a dynamic execution tree separate from the detailed plan. Native `todowrite` is disabled for normal agents because its flat inline Todo card is a separate, conflicting progress store. The tree is a reasonably scaled operational projection of milestones, current and near-term work, owners, priorities, and real blockers, not a one-to-one copy of plan steps. The main model keeps it current and may delegate bounded research, isolated implementation, or focused verification when that protects its integration context or shortens the work. It answers routine subagent questions itself from accepted decisions and repository evidence, and it does not dispatch overlapping edits or automatic review swarms.

In the CLI, toggle the sidebar with `Ctrl+X`, then `B`, and use `/progress` for the searchable detail view. A transcript card headed `Todo` is the disabled native system, not the custom tree. Existing cards in old sessions remain historical. The Desktop app shares the task tools and records but does not expose the custom CLI sidebar slot.

## Reviews And Verification

The agent runs proportional checks that cover the changed dependency surface and reports inspected evidence. It broadens tests, type checks, lint checks, or builds when risk and shared dependencies justify it. During implementation it interrupts you only for a material product, security, compatibility, data-loss, cost, or scope decision that cannot safely be inferred; known independent decisions are batched.

Browser review remains manual by default. For user-facing work, the final handoff includes the exact launch command, URL, required test state, a concise browser checklist, changed files, and known gaps. Browser automation, development servers, visual-review agents, automatic review swarms, commits, pushes, and deploys are not started unless explicitly requested.

## Compression

`@tarquinen/opencode-dcp` provides selective range compression in primary and subagent sessions. It protects user messages plus task/session state, removes repeated tool calls and stale errored-tool inputs during compression, and injects increasingly strong reminders between the configured 50% and 75% context thresholds. Every tool-heavy phase boundary is also an explicit compression checkpoint: the active agent should invoke `compress` before those thresholds whenever a completed investigation, implementation phase, verification pass, or other closed range contains long tool output or stale reasoning that is no longer needed verbatim.

Compression summaries retain exact decisions, paths, interfaces, constraints, evidence, unresolved work, report contracts, and user intent. Active edit context, unresolved errors, and in-progress decisions remain raw until their phase closes. Long-running subagents compress their own closed internal phases when useful; short scoped workers do not create compression calls merely for display. The main agent separately compresses integrated worker results and orchestration traffic when those ranges close.

Successful model-invoked compression is shown as a persistent detailed `▣ DCP` chat message, including the topic, item counts, token metrics, and generated summary. Reminder nudges are internal and remain invisible, and a call with no eligible range produces no notification. Native OpenCode compaction remains enabled as the final context-limit safety net, while host tool-output limits separately cap any single tool response.

## Optional Diagnostics

- `/context` reports native token, cache, reasoning, message-count, and cost telemetry for the current session.
- `/session-search <query>` searches capped visible text across recent sessions in the current project.
- `/session-read <session-id> [message-limit]` reads only a capped visible transcript tail.

These commands run directly through the hidden diagnostics agent. Their tools are disabled for normal build, plan, general, and explore agents.

Codegraph remains globally disabled, and OMO/background-agent plugins are not part of this workflow.

## Maintenance

Superpowers is pinned to v6.2.0 in `package.json`. Update it deliberately with npm, then restart OpenCode and verify `opencode debug config`, `opencode debug skill`, and a fresh implementation session.
