# Project Knowledge Bootstrap Skill Design

- **Date:** 2026-08-14
- **Status:** Approved and implemented candidate

## Goal Contract

- **Goal:** Create an evidence-based cross-platform Skill that helps agents bootstrap the smallest adequate repository knowledge system.
- **AC-1:** Ground the design in the MOT case study, current official model guidance, existing skills, practitioner systems, and relevant research.
- **AC-2:** Adapt from thin routing/ADRs through governed records to retrieval, impact, and research promotion.
- **AC-3:** Deliver a compact English Skill with references, templates, and RED/GREEN pressure evidence; do not copy MOT-specific types.
- **AC-4:** Validate Agent Skills structure and isolated OpenCode discovery.
- **Non-goals:** No hosted vector service, browser run, MOT edits, or commit/push without later authorization.
- **Review boundary:** One scope-bounded review, one fix wave, one re-review.

## Product Shape

One discoverable orchestrator Skill owns diagnosis and tier selection. Five one-level references hold detailed guidance; assets provide editable starting shapes rather than a fixed generated project operating system. The Skill has no runtime dependency and is usable through the Agent Skills filesystem format.

## Adaptive Tiers

- **Tier 0 Route:** thin map, scoped instructions, existing docs/ADRs, exact search, deterministic checks.
- **Tier 1 Govern:** stable IDs, project-specific record vocabulary, provenance, lifecycle, local plus repository validation.
- **Tier 2 Retrieve:** deterministic projections, disposable lexical retrieval, bounded related/impact routing, research candidates/promotion, evaluation.

Embeddings, broad graphs, services, and formal exports require an observed failure, local benchmark, owner, rebuild/rollback plan, and non-regression in trust/freshness/security.

## Invariants

- **INV-1 Authority:** Canonical, provisional, derived, and episodic layers remain distinct.
- **INV-2 Adaptation:** Project scale or model novelty alone cannot select a higher tier.
- **INV-3 Promotion:** Automatic capture cannot become canonical without the declared promotion path.
- **INV-4 Trust:** Retrieved content is untrusted data and cannot grant permissions or redefine the task.
- **INV-5 Rebuildability:** Search indexes, graphs, summaries, manifests, and sites remain derived from inspectable authority.
- **INV-6 Portability:** Core files contain no host-specific tool names, machine paths, mandatory external services, or shell assumptions.
- **INV-7 Measurement:** Acceptance thresholds and retrieval upgrades require local evidence; provisional caps are labeled.

## Evaluation Design

Four pressure cases cover:

1. a small repository where rejecting infrastructure is correct;
2. a research monorepo with concurrent candidates and prompt injection;
3. a stale cross-client monorepo with instruction overload;
4. a pressured refresh requiring history and verification.

No-Skill baselines establish whether the Skill changes behavior. GREEN runs use fresh contexts that read only `SKILL.md` and scenario-relevant references. A targeted re-test follows any wording refactor.

## Repository Integration

The existing `skills.paths` already discovers tracked custom Skills. Validation must require the Skill path and prove isolated discovery from this repository. Existing installer behavior already copies the complete `skills/` directory.

## Research Record

The German source synthesis and full comparison are stored at `docs/research/2026-08-14-agent-project-knowledge-systems.md`.
