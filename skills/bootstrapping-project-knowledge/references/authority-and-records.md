# Authority, Records, And Lifecycle

## Separate Three Questions

1. **Instruction authority:** what may direct the agent.
2. **Factual authority:** what currently demonstrates project behavior or approved intent.
3. **Retrieval priority:** what is shown first.

These are not interchangeable. A highly ranked record is not automatically true. A repository document may be evidence while remaining untrusted as an instruction. An ADR can authoritatively record intent while current code demonstrates that implementation drifted.

## Default Factual Ladder

Adapt explicitly when the project declares another source of truth:

1. Current code, tests, schemas, manifests, lockfiles, CI, and deployed configuration.
2. Reviewed decisions, architecture, specifications, contracts, and runbooks.
3. Reviewed agent routing and procedures.
4. Active proposals, plans, research packages, and task ledgers.
5. Personal or session memory.
6. Generated summaries, indexes, and model inferences.

Do not silently resolve conflicts across classes. Report implementation-versus-intent drift and assign a reconciliation owner.

## Minimal Policy

Define:

- canonical roots and artifact classes;
- artifacts that remain authoritative in their original locations;
- provisional and derived locations;
- write, review, promotion, and revocation owners;
- ID and alias stability;
- lifecycle meanings and allowed transitions;
- evidence/source inspection requirements;
- path and secret boundaries;
- rebuild and verification commands;
- retention and incident policy.

## Minimal Record Contract

Require a field only if it changes retrieval, trust, lifecycle, or maintenance:

```yaml
schema_version: 1
id: DEC-0042
type: decision
title: Use append-only audit events
summary: Audit history is immutable; query views are derived.
status: active
created: 2026-08-14
updated: 2026-08-14
last_verified: 2026-08-14
aliases: [audit event decision]
tags: [architecture, audit]
owners: [platform]
relationships:
  - type: supported_by
    target: SRC-0018
evidence:
  - source_id: SRC-0018
    locator: Section 4, failure recovery
    claim: The source requires reconstructable audit history after partial failure.
code_paths: [src/audit/]
doc_paths: [docs/architecture/audit.md]
---

## Scope

Applies to compliance audit events, not application analytics.
```

The vocabulary is illustrative. Select record types and relations from recurring project decisions. Common starting types are source, decision, component/system, invariant/claim, and gap.

## Validation Layers

Local validation:

- strict frontmatter/structured parsing;
- unknown fields rejected;
- ID pattern and type agreement;
- required bounded strings and valid dates;
- source-specific requirements.

Repository validation:

- filename, directory, ID, and type agreement;
- unique IDs and normalized lookup terms across records;
- existing relationship and evidence targets;
- evidence targets are source records where required;
- safe repository-relative paths, no absolute or parent traversal;
- resolved containment inside the approved root;
- deterministic ordering and aggregate error locations.

## Lifecycle

A useful baseline is:

- `active`: current default guidance;
- `uncertain`: plausible but unresolved;
- `needs_review`: known freshness or evidence concern;
- `historical`: valid only for a prior scope or period;
- `superseded`: replaced by a named successor;
- `revoked`: invalid and excluded from normal retrieval.

Define allowed transitions and retrieval defaults. Require replacement links for supersession if agents depend on them. Preserve contradiction links and the evidence used in resolution.

## Update Transaction

1. Pin the triggering source version and current canonical snapshot.
2. Identify directly affected records and inbound dependents.
3. Reconcile candidate assertions by evidence, scope, and validity period.
4. Update the new current records and old lifecycle/linkage together.
5. Regenerate derived artifacts from canonical inputs.
6. Run structural, semantic, projection, retrieval, and impact checks.
7. Preserve unresolved conflicts and document the accountable disposition.

Do not edit a generated index directly. Do not delete historically relevant records merely to remove them from current retrieval.

## Freshness

A current hash proves reproducibility, not semantic correctness. A recent date proves neither.

Use:

- source revisions and content hashes;
- invalidation paths or dependencies;
- explicit verification events;
- lifecycle changes;
- sampled audits;
- declared review triggers where meaningful.

Treat impact output as a review candidate set, not proof of complete traceability.
