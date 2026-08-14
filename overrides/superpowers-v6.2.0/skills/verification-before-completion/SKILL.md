---
name: verification-before-completion
description: Use before claiming a substantive slice is complete, fixed, passing, deployed, or ready for user browser testing.
---

# Proportionate Verification Before Completion

## Core Principle

Evidence must prove the exact claim inside the approved verification boundary. More checks are not automatically better evidence.

Before a claim:

1. Name the claim and the narrowest command or inspection that proves it.
2. Run it freshly when the changed state could invalidate earlier evidence.
3. Inspect exit status, failures, and relevant output.
4. Report exactly what passed, what was not run, and what remains for the user.

Use focused tests, type checks, lint checks, and builds covering the changed dependency surface. Do not run a full suite, unrelated checks, or repeated verification merely because they exist. Never trust a subagent's success statement without inspecting its diff and relevant evidence.

For `ready for user browser testing`, browser behavior may remain unverified by design. When runnable artifacts changed, verify relevant provenance: expected revision/worktree, running UI/server/backend identity, migration/schema state, relevant health or API result, and representative data prerequisites. Do not verify components outside the approved slice.

Do not launch a browser, browser automation, or visual review unless the user explicitly asks the agent to perform it. A prior check can support a report when its revision and artifacts remain unchanged; label it as prior evidence rather than rerunning it.
