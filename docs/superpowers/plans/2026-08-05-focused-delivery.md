# Focused Delivery Implementation Plan

> **For agentic workers:** `focused-delivery` is the governing execution skill. Do not use a per-task review workflow.

**Goal:** Install and validate a global focused-delivery workflow with one approval, bounded review recursion, proportionate verification, deployment provenance, and user-owned browser testing.

**Architecture:** Global workflow instructions define policy and precedence. Two personal skills provide the operational contracts for orchestration and review. Tracked Superpowers overrides are applied deterministically after dependency installation so package defaults cannot restore conflicting approval and review loops.

**Tech Stack:** OpenCode JSONC configuration, Markdown instructions and skills, Node.js override tooling, OpenCode debug commands, fresh subagent pressure scenarios.

## Global Constraints

- Apply the formal contract to substantive work, not trivial reversible edits.
- Ask foreseeable independent material questions in one batch.
- Present contract, design, and plan for exactly one approval.
- Review once per vertical slice, followed by at most one fix wave and one scoped re-review.
- Every blocker cites an `AC-N` acceptance criterion or `INV-N` invariant.
- Leave visual and browser testing to the user unless explicitly requested.
- Do not commit, push, deploy, or modify unrelated configuration without explicit authorization.
- Do not change model, provider, permission, plugin, or compaction behavior as part of this workflow slice.

---

### Slice 1: Establish Focused Delivery

**Files:**
- Create: `skills/focused-delivery/SKILL.md`
- Create: `skills/scope-bounded-review/SKILL.md`
- Modify: `SUPERPOWERS-WORKFLOW.md`

**Produces:** The ten-line contract, one-approval workflow, vertical-slice execution model, bounded review contract, verification boundary, provenance gate, and browser handoff contract.

- [x] Record baseline pressure-scenario behavior without the skills.
- [x] Write the minimal personal skills addressing observed failures.
- [x] Run fresh pressure scenarios with the skills explicitly loaded.
- [x] Tighten wording where agents retain extra gates, speculative blockers, or browser ownership.

### Slice 2: Preserve Focused Vendor Entry Points

**Files:**
- Create: `overrides/superpowers-v6.2.0/skills/*/SKILL.md`
- Create: `scripts/apply-superpowers-overrides.mjs`
- Create: `scripts/apply-superpowers-overrides.test.mjs`
- Modify: `package.json`

**Produces:** Nine narrowed package skill entry points reapplied after every dependency install, with version gating, idempotent application, and drift checking.

- [x] Preserve the validated live skill content as tracked override sources.
- [x] Apply overrides only to pinned Superpowers v6.2.0.
- [x] Add automated apply/idempotence/check/version regression coverage.
- [x] Make `npm install` and `npm ci` reapply overrides automatically.

### Slice 3: Register And Document The Workflow

**Files:**
- Modify: `opencode.jsonc`
- Modify: `AI-WORKFLOW.md`
- Modify: `command/autofeature.md`
- Modify: `README.md`
- Modify: `scripts/install.ps1`
- Modify: `scripts/validate.ps1`

**Produces:** Portable skill discovery, installation, validation, and user documentation matching normal prompts and `/autofeature`.

- [x] Register `./skills` in `skills.paths`.
- [x] Include tracked skills and overrides in external-destination installs.
- [x] Validate both personal skill provenance and all nine applied package overrides.
- [x] Keep `/autofeature` optional and preserve the same single approval.

### Slice 4: Validate The Integrated Setup

**Produces:** Evidence that configuration, skills, and portable override application load from the intended candidate root.

- [x] Run focused override tests and `--check`.
- [x] Run isolated `opencode debug config` and inspect the merged skill path.
- [x] Run isolated `opencode debug skill` and confirm both personal skills and narrowed package skills resolve from the candidate root.
- [x] Run relevant type checks and workflow validation.
- [ ] Fully restart OpenCode CLI and Desktop on the installed machine and run a fresh behavioral smoke session.
