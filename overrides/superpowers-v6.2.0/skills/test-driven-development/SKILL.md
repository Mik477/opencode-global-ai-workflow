---
name: test-driven-development
description: Use when meaningful behavior or a reproduced defect has a practical automated regression boundary before implementation.
---

# Focused Test-Driven Development

For meaningful behavior and reproduced defects, write the smallest test that expresses the acceptance criterion, observe it fail for the expected reason, implement the minimal fix, and observe it pass. Refactor only when it improves the approved slice.

Test public behavior and realistic boundaries. Do not require one test per function, mock implementation details, expand unrelated coverage, or add speculative edge cases outside supported assumptions.

Static configuration, prose, trivial wiring, generated code, visual appearance, and behavior assigned to user browser testing do not require a new automated test. Validate them with the narrowest meaningful parse, schema, build, inspection, or handoff evidence. This is a standing policy, not an exception requiring user approval.

Run focused affected tests during implementation. Broaden only when shared dependencies or concrete risk justify it. A failing unrelated baseline is evidence to report, not automatic scope expansion.
