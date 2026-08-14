---
name: writing-plans
description: Use when substantive work needs a durable multi-step implementation plan before implementation.
---

# Focused Implementation Plans

**REQUIRED GOVERNING SKILL:** Use `focused-delivery` for approval, execution, review, and handoff boundaries.

Save substantive plans to `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md` unless project instructions say otherwise. The plan belongs in the single combined contract/design/plan approval, not a later approval gate.

Map files and responsibilities, then organize work into independently useful, browser-testable or releasable vertical slices. For each slice include:

- acceptance criteria and non-goals it serves;
- exact files and important interfaces;
- implementation sequence and meaningful error cases;
- targeted automated verification and relevant provenance evidence;
- one review boundary and the user's browser handoff;
- dependencies, risks, and explicit deferrals.

Use enough detail for autonomous execution and compaction recovery. Do not create two-to-five-minute micro-steps, tasks whose purpose is review, mandatory commits, a per-task reviewer, a final review swarm, or an execution-mode menu. Self-review once for coverage, contradictions, placeholders, and interface consistency, then proceed after the one approval.
