# Project Knowledge Policy

## Scope And Purpose

- Repeated failures addressed: `[list observed failures]`
- Selected tier: `0 | 1 | 2`
- Non-goals: `[explicitly excluded systems and content]`

## Artifact Classes

| Class | Path or source | Authority | Writer/reviewer | Retention |
|---|---|---|---|---|
| Canonical | `[path]` | Reviewed project knowledge | `[owner]` | Versioned |
| Original authority | `[code/schema/CI/docs]` | Native source of truth | `[owner]` | Native policy |
| Candidate | `[path]` | Provisional | `[researchers]` / `[promoter]` | Until reconciled |
| Derived | `[path]` | Non-authoritative, rebuildable | Automation | Disposable/committed by policy |
| Episodic | `[path/system]` | Personal/session only | Individual agent/user | TTL/local policy |

## Identity And Lifecycle

- Stable ID rule: `[rule]`
- Alias uniqueness: `[rule]`
- Lifecycle states and transitions: `[states]`
- Supersession/revocation linkage: `[rule]`

## Evidence And Provenance

- Source inspection states: `[states]`
- Required locator format: `[format]`
- Evidence quality labels: `[labels]`
- Conflict treatment: `[rule]`

## Retrieval

- Default current statuses: `[statuses]`
- Compact search/list: `[command]`
- Full record: `[command]`
- Related/impact: `[commands]`
- Context/result budget: `[limits]`

## Writes And Promotion

- Candidate isolation: `[rule]`
- Canonical promoter: `[role/workflow]`
- Review requirement: `[rule]`
- Policy-violation disposition: `block | documented exception | trust downgrade`

## Security And Privacy

- Approved roots: `[paths]`
- Excluded secrets/personal content: `[patterns]`
- Network/external storage policy: `[policy]`
- Technical enforcement: `[permissions/CI/CODEOWNERS]`

## Verification And Incidents

- Validation/rebuild commands: `[commands]`
- Freshness triggers: `[triggers]`
- Retrieval/impact/adversarial benchmark: `[path]`
- Revocation and poisoning response: `[procedure]`
