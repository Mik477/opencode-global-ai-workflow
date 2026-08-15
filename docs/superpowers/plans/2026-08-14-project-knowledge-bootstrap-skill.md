# Project Knowledge Bootstrap Skill Implementation Plan

**Goal:** Deliver the approved cross-platform knowledge-system bootstrap Skill and evidence package without changing MOT or publishing repository changes.

## Slice 1: Evidence And RED Baseline

- [x] Audit the MOT playbook against implementation and tests.
- [x] Research official OpenAI GPT-5.6 and Anthropic Claude 5 guidance.
- [x] Inspect existing knowledge/memory Skills and practitioner systems.
- [x] Review current retrieval, memory, provenance, and security research.
- [x] Run four clean no-Skill pressure scenarios and capture behavioral gaps.

## Slice 2: Portable Skill Package

- [x] Add a failing structural package test.
- [x] Implement compact `SKILL.md` with adaptive tier gate.
- [x] Add one-level references for tiers, authority, retrieval/evals, research/security, and adapters.
- [x] Add routing, policy, record, and evaluation templates.
- [x] Add versioned behavior cases.
- [x] Wire isolated OpenCode validation and README discovery.
- [x] Observe structural GREEN.

## Slice 3: Behavior GREEN And Refactor

- [x] Re-run all four pressure scenarios with the Skill in fresh contexts.
- [x] Identify invented fixed context/result budgets as a new loophole.
- [x] Require provisional labels and locally measured acceptance budgets.
- [x] Re-run the affected scenario and structural test.

## Slice 4: Durable Synthesis And Review

- [x] Write German research dossier with sources, limitations, and design implications.
- [x] Record design, invariants, baseline, and evaluation contract.
- [x] Run focused format/discovery validation.
- [x] Dispatch one `scope-bounded-review` reviewer against AC-1 through AC-4 and INV-1 through INV-7.
- [x] Apply one consolidated fix wave and one re-review: corpus size no longer selects Tier 2; re-review approved.

## Slice 5: Final Verification And Handoff

- [x] Run relevant script tests and isolated validator.
- [x] Inspect diff and machine-path/secret boundaries; keep the pre-existing dirty MOT worktree read-only.
- [x] Record exact evidence and model/harness testing gaps below.
- [x] Do not commit or push without explicit user authorization.

## Final Evidence

- `node --test .\scripts\project-knowledge-skill.test.mjs`: 2 passed, 0 failed after the review fix.
- `npm test`: 34 task, 25 diagnostics, 3 title, and 9 script tests passed before the wording-only review fix; the affected 2-test package boundary was then rerun.
- `npm run typecheck`: all three TypeScript projects passed.
- `scripts\validate.ps1 -ConfigRoot . -SkipTests`: isolated skill discovery and workflow validation passed after the review fix; this command also reran typechecks.
- `opencode debug config`: repository `./skills` discovery resolved.
- `git diff --check`: passed with only Git's existing LF-to-CRLF working-copy warning for `scripts/validate.ps1`.
- Scope-bounded review: one INV-2 blocker fixed; one allowed re-review returned `APPROVE`.
- No native paid/browser evaluations were run for Claude Fable 5, Claude Opus 5, or other client/model combinations. The versioned scenarios and current OpenCode-agent results remain the reproducible evidence boundary.
