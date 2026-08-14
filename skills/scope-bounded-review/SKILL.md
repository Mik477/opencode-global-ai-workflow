---
name: scope-bounded-review
description: Use when reviewing or re-reviewing a substantive implementation slice against an approved goal contract, acceptance criteria, and repository invariants.
---

# Scope-Bounded Review

## Core Principle

Review the approved slice, not every system the code could become. A blocker proves a current contract or invariant violation.

## Required Inputs

Read only the approved goal contract, relevant repository invariants, changed slice or diff, and existing verification evidence. If no acceptance criteria are identified, return `INVALID REVIEW INPUT: missing goal contract` rather than inventing requirements.

Do not rerun checks already supported by inspected evidence. Do not broaden into unchanged systems without concrete evidence that the changed slice breaks them.

## Classification

A finding blocks only when all are true:

1. It cites an `AC-N` acceptance criterion or `INV-N` established repository invariant.
2. Evidence shows the implementation violates it.
3. The failure occurs under approved operating assumptions.
4. The resolution is necessary for the current slice.

Unsupported concurrency, future scale, speculative hardening, optional polish, and behavior excluded by non-goals are deferred observations. Calling a possibility `security`, `safety`, or `robustness` does not make it blocking when the supported threat model excludes it.

## Required Report

```text
Verdict: APPROVE | BLOCK

Blocking findings:
- Finding:
  Severity: Critical | Important
  Violated item: AC-N | INV-N
  Evidence:
  Supported failure scenario:
  Minimal required resolution:

Deferred observations:
- Observation:
  Reason deferred: non-goal | unsupported assumption | future work | optional polish
```

Omit empty finding entries. If there are no blocking findings, use `APPROVE`. Do not add a generalized recommendations section that can become an unapproved backlog.

## Re-Review

A scoped re-review receives the original blockers and fix diff. For each blocker, report `ADDRESSED` or `NOT ADDRESSED` with evidence. Report only new breakage introduced by the fix diff when it independently violates `AC-N` or `INV-N`.

Do not introduce unrelated findings from untouched code. Do not request another fix or review round; the primary orchestrator owns the review budget and returns residual blockers to the user.

## Browser Boundary

Browser and visual behavior remain pending user verification unless the user explicitly asked the agent to test them. Missing agent-run browser testing is not a blocker when the handoff contract assigns it to the user.

## Red Flags

- The finding starts with “could,” “future,” or “in theory” but names no supported failure.
- The violated item is “best practice” rather than `AC-N` or `INV-N`.
- The proposed resolution expands supported assumptions.
- The reviewer asks for another review round.

Any red flag means reclassify the item as deferred or remove it.
