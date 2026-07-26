# Adaptive Workflow And Progress Tree Design

## Goal

Make normal OpenCode feature work follow an adaptive Superpowers workflow: clarify missing requirements, isolate work in a Git worktree when possible, retain a durable detailed plan, delegate bounded work to subagents to protect main-session context, maintain a separate dynamic progress tree, verify proportionally, and hand user-facing work to the user for browser review.

## Current-State Correction

The workflow restructuring retained hierarchical task storage but changed both policy and presentation in ways that no longer match the intended workflow.

- `plugins/session-progress` still stores `parentID`, `blockedBy`, owners, active descriptions, and metadata.
- The replacement TUI renders those records in a custom sidebar and `/progress` dialog, but the sidebar limits itself to nine selected rows and does not present milestone collapse as a first-class concept.
- The replacement task API lists flat active summaries without `parentID`, so the main agent cannot cheaply recover the visible hierarchy from `task_list`.
- `task_update` can append dependencies but cannot replace dependencies, reparent a task, or detach it from a parent.
- The previous OMO task implementation mirrored task subjects into OpenCode's native Todo API through `todo-sync.ts`. Removing OMO also removed that native todo presentation. The standalone replacement intentionally stopped duplicating task state into native todos.
- `SUPERPOWERS-LEAN.md` then made one-owner implementation, rare subagent use, and no worktree the default. That policy is the main behavioral mismatch; hierarchy support itself was not deleted.

## Workflow

### 1. Adaptive Discovery

For any execution request, including research, analysis, reports, documents, and other artifacts, inspect relevant instructions, workspace context, inputs, and sources before planning. Identify foreseeable material questions early and ask independent questions in one concise batch; use a later follow-up only when an answer genuinely reveals a new dependent question. Offer outcome or design approaches when there is a real user-facing choice, but choose tools, APIs, sources, search strategy, decomposition, plan structure, verification, and delegation internally. Do not force an interview or seek approval for work methods when the user's request already determines the result.

When a material design choice exists, present one cohesive design for one approval. A clear request with no unresolved material choice is already sufficient authorization. After acceptance, write and self-review any useful design record, create the detailed implementation plan, choose inline work or delegation internally, and begin implementation in the same session. Do not add section-by-section approvals, written-spec or plan review gates, an execution-mode question, routine task approval, or a permission-to-continue prompt.

### 2. Workspace Isolation

Use a Git worktree by default for substantive feature work in a Git repository. Skip it when the current directory is not a repository, the change is configuration outside a repository, the user explicitly asks to work in place, or isolation would break a required local environment. Report the exception rather than pretending isolation exists.

### 3. Durable Detailed Plan

After discovery settles the design, write a detailed plan under `docs/superpowers/plans/`. The plan is primarily for execution recovery, compaction recovery, task briefing, exact file/test references, and preventing scope drift. The user is not expected to monitor it continuously.

The plan remains stable unless scope or architecture materially changes. Small discoveries update the execution tree, not the plan. Material changes update both.

### 4. Dynamic Execution Tree

Create a root task for the feature and a small set of milestone children, normally discovery/design, implementation workstreams, verification, and browser handoff. Add fine-grained children only for current or near-term work where they improve observability or delegation.

The execution tree is not a one-to-one copy of plan steps. It is a live operational projection of:

- what is complete;
- what is active now;
- what is ready next;
- what is blocked and why;
- which agent owns scoped work;
- what new work was discovered.

Use two or three useful hierarchy levels in normal work. The main agent may create, reparent, complete, delete, split, or replace dependencies as reality changes. Keep active descriptions current and complete stale tasks promptly.

The feature root stores the detailed plan path in metadata so the model can recover the durable source of truth after compression.

### 5. Delegation And Context Control

The main build agent owns architecture, integration, the plan, and the progress tree. It should delegate bounded research, isolated implementation, and focused verification when that keeps detailed context out of the main session or shortens wall-clock time.

Do not delegate overlapping edits in parallel. Give each subagent a narrow brief, expected output, owned files where applicable, and verification responsibility. Subagent work appears as owned tasks or subtasks in the same root-session tree. The main agent independently inspects integrated changes and verification evidence.

### 6. Questions During Implementation

Continue autonomously while implementation follows the accepted design. The main agent answers routine subagent questions from accepted decisions, repository evidence, the plan, and safe reversible judgment. Ask the user only when an unexpected discovery creates a material product, security, compatibility, data-loss, cost, or scope decision that cannot be inferred safely. Batch independent material decisions into one concise interruption and update the progress tree before or immediately after it so the blocker is visible.

Routine, reversible, and evidence-backed engineering choices do not require approval, even when a skill, plan, or subagent phrases them as questions. Replan only when the accepted design or dependency structure materially changes.

### 7. Verification And Browser Handoff

Use the narrowest meaningful tests, type checks, lint checks, and builds that cover the changed dependency surface. Add regression tests for meaningful behavior and reproduced defects. Broaden checks when risk or shared dependencies justify it.

Do not launch browser automation by default. For user-facing work, stop after automated verification with the exact launch command, URL, required test state, a concise browser checklist, changed-file summary, and known gaps. Keep the worktree available until the user gives feedback or approves integration.

## Task API Changes

`task_list` should return compact summaries with `parentID`, `activeForm`, owner, unresolved blockers, and the root plan path when present. It should include completed ancestors required to understand active descendants, without returning every completed historical task.

`task_update` should support:

- setting or clearing `parentID`;
- replacing `blockedBy` and `blocks` with an exact list;
- retaining append operations for convenient incremental updates;
- clearing optional active/owner fields where useful.

The persisted task record remains the canonical progress state. Native OpenCode todos must not become a second writable source of truth.

## Sidebar Design

The CLI sidebar uses the approved adaptive plan-linked tree:

- Show the feature root and overall completion.
- Show every top-level milestone.
- Collapse inactive milestone descendants.
- Expand the milestone containing active or blocked work.
- Recursively expand the active branch.
- Show completed, active, pending, and blocked markers; subtree counts; owners; and current activity.
- Remove the arbitrary nine-row selection behavior.
- Keep `/progress` as the searchable detail surface for descriptions, dependencies, metadata, and plan references.

The sidebar is keyboard-driven rather than mouse-driven. A later enhancement may add commands to cycle active-only, milestone, and full-tree density, but the default milestone/active-branch view must work without user interaction.

The custom sidebar remains CLI-only because OpenCode Desktop does not expose the TUI slot API. Desktop still shares task records and tools.

## Acceptance Criteria

- A normal feature prompt triggers adaptive discovery when material requirements are missing.
- Research, analysis, report, document, and other artifact requests use the same batching and autonomy contract without requiring `/autofeature`.
- A clear request proceeds without a manufactured design gate; otherwise one cohesive design approval transitions automatically through planning into implementation.
- Tools, APIs, sources, search strategy, decomposition, plan structure, verification, and delegation are internal choices rather than approval surfaces.
- Written specifications, detailed plans, execution modes, routine tasks, and permission to continue do not create additional approval gates.
- Substantive Git-repository work uses a worktree by default and explains valid exceptions.
- Feature work writes a separate detailed plan without requiring routine user plan review.
- The main agent delegates bounded tasks when useful for context isolation and retains integration ownership.
- The progress tree remains dynamic, reasonably hierarchical, and distinct from the plan.
- Normal agents cannot write the separate native Todo store; progress uses only the persistent `task_*` tools.
- `task_list` exposes enough hierarchy for model recovery without dumping completed history.
- `task_update` can reparent tasks and replace obsolete dependency relationships.
- The terminal sidebar shows all milestones and expands only focused branches by default.
- Focused task-system tests, strict TypeScript checks, effective config validation, and a real OpenCode smoke test pass before completion is claimed.
- User-facing feature work ends with a manual browser-QA handoff by default.
