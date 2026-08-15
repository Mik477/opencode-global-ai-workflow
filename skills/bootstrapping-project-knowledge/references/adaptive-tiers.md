# Adaptive Knowledge Tiers

## Purpose

Choose infrastructure from observed project failures, not model capability or fashion. Start at the lowest tier that makes recurring decisions reliably findable, inspectable, current, and maintainable.

## Diagnostic Inventory

Collect evidence from representative tasks:

| Signal | Question |
|---|---|
| Findability | Do agents repeatedly miss existing decisions, commands, or constraints? |
| Authority | Can they distinguish current executable reality, approved intent, proposal, and history? |
| Provenance | Do material claims need exact sources and locators? |
| Lifecycle | Are contradictory, scoped, historical, revoked, or superseded facts being conflated? |
| Maintenance | Do code/source changes leave guidance stale? |
| Scale | Does scoped exact search return too many or too few useful candidates? |
| Concurrency | Do parallel agents duplicate identities, overwrite findings, or canonize inconsistent claims? |
| Security | Can external or low-trust content enter retrieval or influence tools? |

Use several real tasks. A single poor session may be a prompt, tool, or repository-layout failure rather than evidence for a knowledge platform.

## Tier 0: Route

Use when existing documentation is mostly correct and the main problem is orientation or instruction bloat.

Minimum result:

- one short root map describing where to look and how to verify;
- scoped instructions only where subtrees genuinely differ;
- maintained architecture/decision/runbook links;
- exact file, text, symbol, and Git search;
- deterministic CI/lint enforcement for rules that can be mechanical;
- separation of stable project knowledge from active plans and task state.

Do not create record IDs, a graph, a database, or generated summaries merely for completeness.

Exit criterion: agents can answer representative orientation and change questions with correct source paths while loading materially less irrelevant context.

## Tier 1: Govern

Use when stable identity, provenance, lifecycle, ownership, contradiction, or repository-wide integrity is repeatedly needed.

Add:

- a small project-specific type vocabulary;
- canonical plain-text or structured-text records;
- immutable IDs and unique aliases across records;
- bounded summaries, lifecycle, ownership, evidence, and source/path links;
- strict local schema validation with unknown fields rejected;
- cross-record validation for identity, links, source types, path containment, and dates;
- actionable aggregate errors;
- explicit update and supersession transactions.

Do not turn every paragraph, file, ticket, or symbol into a record. A record exists only when its independent identity, lifecycle, provenance, or relationships affect decisions.

Exit criterion: invalid and conflicting knowledge fails visibly, current guidance is distinguishable from history, and sampled evidence locators support their bounded claims.

## Tier 2: Retrieve

Use when the validated corpus is large enough that exact navigation is insufficient, or when multi-agent research and change routing are material workflows.

Add in order:

1. Deterministic compact catalog and public schema.
2. Hash-based freshness manifest.
3. Disposable lexical full-text cache with type/status/tag filters.
4. Bounded related-record traversal.
5. Direct changed-path matching and inbound dependency propagation.
6. Isolated candidate research and controlled promotion.
7. Labeled retrieval, impact, grounding, and adversarial benchmarks.

Only after measured failures consider fuzzy search, curated query expansion, dense retrieval, reranking, broader graphs, MCP/services, or standards exports.

Exit criterion: the added component improves held-out task success or materially reduces context/cost without regressing provenance, freshness, security, or offline recoverability.

## Upgrade Gate

For each proposed component record:

- failure observed;
- affected query/task class;
- baseline and target metric;
- operational and privacy cost;
- authoritative inputs and rebuild procedure;
- rollback path;
- supported platforms;
- owner.

Reject upgrades justified only by future possibility, vendor benchmarks, context-window size, or a desire to use the latest model feature.

## Downgrade And Removal

Remove or simplify components whose maintenance cost exceeds measured value. Preserve canonical content and migration mappings; discard rebuildable caches. A healthy knowledge system can become simpler as repository structure, model navigation, or deterministic tooling improves.
