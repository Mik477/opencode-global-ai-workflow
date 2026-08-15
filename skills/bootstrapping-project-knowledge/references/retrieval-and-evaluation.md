# Retrieval And Evaluation

## Retrieval Sequence

Start with the cheapest authoritative route:

```text
scope/trust filters
  -> exact ID, path, symbol, and identifier lookup
  -> lexical search
  -> neighboring source context
  -> lifecycle and temporal filtering
  -> optional dense retrieval/reranking
  -> optional bounded typed graph traversal
  -> evidence bundle
  -> cited answer or abstention
```

Use one primary disclosure level before deeper hierarchies. Agents can often navigate paths directly; extra summary layers can add stale context and routing errors.

## Lexical Baseline

When representative local tasks show that exact navigation is insufficient, establish a lexical baseline. For hundreds or low thousands of curated records, a local index such as SQLite FTS5/BM25 may then be the smallest adequate implementation. Record count informs implementation, not tier selection. Weight stable metadata and bounded summaries above bodies. Provide filters for type, lifecycle, owner, tag, project scope, branch, and source revision.

Support:

- compact result list;
- full single-record display;
- explicit exact-ID lookup;
- bounded related traversal;
- structured output;
- query retries with fewer terms and aliases;
- deterministic tie-breaking;
- source locators.

Record zero-result and retry behavior. Lexical `AND` search can miss paraphrases, synonyms, misspellings, and one over-constrained token.

Bound result counts and evidence size operationally, but do not present invented numbers as best practice. Measure baseline task success and context use, then record project-specific budgets and their rationale. A provisional safety cap must be labeled provisional and remain distinct from an acceptance threshold.

## Embedding Gate

Add dense retrieval only when a labeled query set shows material semantic or vocabulary-mismatch misses after aliases and query refinement.

Record:

- embedding model and version;
- chunking and contextualization method;
- corpus/source revision;
- privacy/data location;
- index rebuild and deletion behavior;
- score threshold and result cap;
- hybrid/fusion method;
- measured benefit and rollback.

Dense similarity does not establish authority, freshness, or source correctness.

## Graph Gate

Use typed graphs for demonstrated relationship questions such as imports, calls, tests, ownership, requirements, dependencies, derivation, supersession, and change impact.

Every edge should be typed, versioned, and evidence-backed. Do not treat LLM-extracted semantic edges as canonical without review. Bound traversal depth and expose why each node was included.

## Benchmark

Create a versioned set from real tasks:

- exact ID/path/symbol;
- aliases and paraphrases;
- cross-document synthesis;
- current versus historical;
- contradictory evidence;
- missing evidence and abstention;
- changed-path impact;
- adversarial high-ranking content;
- project-specific security boundaries.

Hold constant the model/version, reasoning setting, harness, tools, corpus snapshot, prompt, context budget, and retrieval opportunities.

Report:

- Recall@k, MRR, nDCG, zero-result rate, retry success;
- provenance recall and citation precision/completeness;
- end-to-end task success and unsupported-claim rate;
- stale-answer, conflict, and abstention quality;
- impact precision/recall and unlinked-change rate;
- injection/poisoning attack success;
- records/source bytes loaded, tokens, latency, and cost;
- build, refresh, and maintenance cost.

Retrieval metrics do not replace end-to-end grounding. A retriever can improve recall while the agent still makes a worse decision.

## Frontier Model Guidance

Million-token windows in GPT-5.6 and Claude 5-class models increase capacity, not guaranteed attention. Official OpenAI and Anthropic guidance still favors lean instructions, progressive disclosure, just-in-time tool retrieval, structured outputs, note-taking/compaction for long work, and representative evals.

Do not copy vendor benchmark gains into a project acceptance threshold. Test every intended model/harness because tool behavior, safeguards, context use, and tokenization differ.

## Adoption Rule

Adopt added retrieval complexity only when it yields a credible task-success gain or material context/cost reduction under non-inferiority constraints for provenance, freshness, access control, and injection resistance.
