# Adaptive Workflow And Progress Tree Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the over-minimal lean workflow with adaptive discovery, worktree-first isolation, bounded delegation, a durable plan, and a dynamic milestone-focused terminal progress tree.

**Architecture:** Global policy files define the default agent behavior. The standalone `session-progress` server remains the canonical task store and gains reversible hierarchy/dependency updates plus hierarchy-aware summaries. The TUI derives a milestone/active-branch projection from the same records; the detailed plan and `/progress` remain separate recovery/detail surfaces.

**Tech Stack:** OpenCode 1.18.4 configuration, TypeScript 5.8, Zod, Bun test, OpenTUI Solid plugin API.

## Global Constraints

- Do not reactivate OMO, background-agent plugins, automatic browser automation, or Codegraph.
- Keep one main integration owner while allowing bounded subagents for context isolation.
- The detailed plan and dynamic progress tree must remain separate artifacts.
- Do not create a second writable task source by syncing back to native todos.
- Preserve existing task JSON records and accept records without newly optional fields.
- This global configuration directory is not a Git repository, so implementation occurs in place without commits; future repository work becomes worktree-first through policy.

---

### Task 1: Adaptive Workflow Policy

**Files:**
- Create: `SUPERPOWERS-WORKFLOW.md`
- Delete: `SUPERPOWERS-LEAN.md`
- Modify: `opencode.jsonc`
- Modify: `command/autofeature.md`
- Modify: `AI-WORKFLOW.md`

**Interfaces:**
- Consumes: OpenCode's global `instructions` array and command markdown loader.
- Produces: default adaptive discovery, worktree-first execution, bounded delegation, durable planning, dynamic progress updates, implementation-time escalation, proportional verification, and browser handoff behavior.

- [ ] **Step 1: Write the adaptive policy from the approved design**

Define explicit sections for discovery, worktrees, durable plans, execution trees, subagent delegation, unexpected decisions, verification, and browser handoff. State that normal feature prompts trigger the policy without `/autofeature`.

- [ ] **Step 2: Point OpenCode at the renamed instruction file**

Change `opencode.jsonc` from `./SUPERPOWERS-LEAN.md` to `./SUPERPOWERS-WORKFLOW.md` and preserve all unrelated settings.

- [ ] **Step 3: Align the feature command and user documentation**

Make `/autofeature` an optional explicit-autonomy shortcut over the same default policy rather than a separate lean workflow. Document the adaptive question phase, worktree default, subagent use, separate plan/tree roles, and browser handoff.

- [ ] **Step 4: Resolve and inspect effective configuration**

Run: `opencode debug config`

Expected: `instructions` contains `./SUPERPOWERS-WORKFLOW.md`; build/plan models, diagnostics isolation, disabled Codegraph, and plugin entries remain unchanged.

### Task 2: Reversible Dynamic Task Updates

**Files:**
- Modify: `plugins/session-progress/task-schema.ts`
- Modify: `plugins/session-progress/task-store.ts`
- Modify: `plugins/session-progress/task-store.test.ts`
- Modify: `plugins/session-progress/server.ts`

**Interfaces:**
- Consumes: existing `TaskRecord`, `TaskStore.update`, and four `task_*` tools.
- Produces: `task_update` inputs `parentID`, `setBlocks`, `setBlockedBy`, nullable optional text fields, and hierarchy-aware compact `task_list` summaries.

- [ ] **Step 1: Add failing update tests**

Add tests proving an existing task can be reparented, detached with `parentID: null`, replace blockers with `setBlockedBy: []`, replace dependents with `setBlocks`, and clear `owner` or `activeForm` with `null`.

- [ ] **Step 2: Run the focused tests and confirm the intended failures**

Run: `bun test ./plugins/session-progress/task-store.test.ts`

Expected: schema or behavior failures because replacement/reparenting fields do not yet exist.

- [ ] **Step 3: Implement reversible updates**

Extend the update schema with nullable `parentID`, nullable `owner`, nullable `activeForm`, exact replacement arrays `setBlocks` and `setBlockedBy`, while preserving `addBlocks` and `addBlockedBy`. Convert `null` optional values into omitted persisted fields.

- [ ] **Step 4: Add failing hierarchy-summary tests**

Create a completed feature root, completed milestone ancestor, active child, unrelated completed task, and blocked sibling. Assert that `list()` includes active records plus required completed ancestors, includes `parentID` and `activeForm`, reports unresolved blockers, exposes a string `metadata.planPath` as `planPath`, and excludes unrelated completed history.

- [ ] **Step 5: Implement compact hierarchy summaries**

Build the included-record set from nonterminal records plus their ancestor chain. Return concise summaries containing status, parent, owner, active form, unresolved blockers, and optional plan path. Update tool descriptions to explain dynamic hierarchy behavior.

- [ ] **Step 6: Run focused task backend tests**

Run: `bun test ./plugins/session-progress/task-store.test.ts ./plugins/session-progress/server-paths.test.ts`

Expected: all tests pass with zero failures.

### Task 3: Milestone And Active-Branch Sidebar

**Files:**
- Modify: `plugins/session-progress/tui.tsx`
- Modify: `plugins/session-progress/tui.test.ts`

**Interfaces:**
- Consumes: `TaskGraph.roots`, `TaskGraph.children`, active tasks, blocked tasks, subtree statistics, and existing `taskLine` rendering.
- Produces: a pure exported sidebar-row selector that shows all roots and milestones while recursively expanding focused branches.

- [ ] **Step 1: Add failing sidebar-selection tests**

Build a feature root with Discovery, Implementation, and Verification milestones. Give Discovery completed children, Implementation completed/active/blocked children with a nested active child, and Verification pending children. Assert that roots and all milestones are visible, inactive milestone descendants are hidden, the active Implementation branch is expanded recursively, and no nine-row truncation removes focused work.

- [ ] **Step 2: Run the TUI tests and confirm the intended failure**

Run: `bun test ./plugins/session-progress/tui.test.ts`

Expected: failure because current `sidebarRows` uses priority selection and `SIDEBAR_TASK_LIMIT = 9`.

- [ ] **Step 3: Implement milestone-focused selection**

Replace the arbitrary limit algorithm with a deterministic traversal. Always include roots and their direct milestone children. Mark focused tasks from active and unresolved-blocked records, include their ancestors, and recurse through children only for roots and focused ancestors. Preserve graph ordering and cycle handling.

- [ ] **Step 4: Update the sidebar header and footer**

When exactly one root exists, display its subject as the feature heading. Keep overall completion, active/blocked/ready counts, latest activity, nested markers, owner/priority cues, and `/progress` hint. Avoid claiming ETA.

- [ ] **Step 5: Run focused TUI tests**

Run: `bun test ./plugins/session-progress/tui.test.ts`

Expected: all graph and sidebar selection tests pass.

### Task 4: Integrated Verification And Handoff

**Files:**
- Modify only if verification exposes a defect in files owned by Tasks 1-3.

**Interfaces:**
- Consumes: effective OpenCode config, task plugin scripts, and the real command surface.
- Produces: fresh evidence that policy loading, task persistence, hierarchy mutation, sidebar projection, and diagnostics isolation remain valid.

- [ ] **Step 1: Run the complete task plugin gate**

Run: `npm run test:tasks`

Expected: all task backend, tool, and TUI tests pass with zero failures.

- [ ] **Step 2: Run strict task TypeScript validation**

Run: `npm run typecheck:tasks`

Expected: exit code 0 with no TypeScript diagnostics.

- [ ] **Step 3: Validate effective OpenCode configuration**

Run: `opencode debug config`

Expected: adaptive instruction path resolves; normal agents retain intended task tools; diagnostics remains hidden and restricted; Codegraph remains disabled; OMO is not reactivated.

- [ ] **Step 4: Exercise task mutations through the public tool surface**

Run the existing server-path tests and a fixture-driven store exercise that creates a feature root, milestones, an active nested task, then reparents and unblocks it. Inspect the returned summaries for correct hierarchy and plan path.

- [ ] **Step 5: Perform a fresh CLI/TUI smoke**

Start a fresh OpenCode CLI session after restart, create the representative feature tree through task tools, toggle the sidebar, and confirm all milestones plus only the active branch descendants are shown. Open `/progress` and confirm details remain available.

- [ ] **Step 6: Report the browser-review handoff behavior**

Summarize the new default workflow, exact progress controls, verification evidence, CLI-only sidebar limitation, and restart requirement. Do not merge, push, deploy, or claim Desktop sidebar parity.
