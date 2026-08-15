import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { test } from "node:test"

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const skillRoot = join(repositoryRoot, "skills", "bootstrapping-project-knowledge")

const requiredFiles = [
  "SKILL.md",
  "references/adaptive-tiers.md",
  "references/authority-and-records.md",
  "references/retrieval-and-evaluation.md",
  "references/research-and-security.md",
  "references/platform-adapters.md",
  "assets/routing-map-template.md",
  "assets/knowledge-policy-template.md",
  "assets/record-template.md",
  "assets/evaluation-cases-template.yaml",
  "evals/evals.json",
]

test("project knowledge skill has a portable progressively disclosed package", async () => {
  const contents = new Map()
  for (const relativePath of requiredFiles) {
    contents.set(relativePath, await readFile(join(skillRoot, relativePath), "utf8"))
  }

  const skill = contents.get("SKILL.md")
  assert.match(skill, /^---\r?\nname: bootstrapping-project-knowledge\r?\n/)
  assert.match(skill, /description: Use when /)
  assert.ok(skill.split(/\r?\n/).length <= 220, "SKILL.md must remain compact")
  assert.match(skill, /repository-first/i)
  assert.match(skill, /Tier 0/)
  assert.match(skill, /Do not add embeddings, a vector database, or a knowledge graph/i)
  assert.match(skill, /Corpus size alone does not select Tier 2/i)
  assert.match(skill, /untrusted data/i)
  assert.match(
    contents.get("references/retrieval-and-evaluation.md"),
    /Record count informs implementation, not tier selection/i,
  )
  assert.doesNotMatch(
    [...contents.values()].join("\n"),
    /[A-Za-z]:\\Users\\|C:\\Projects\\|\/Users\/[^/]+\//,
  )

  for (const relativePath of requiredFiles.slice(1, 6)) {
    assert.match(skill, new RegExp(relativePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  }
})

test("project knowledge skill evals cover adaptive, adversarial, and maintenance behavior", async () => {
  const evals = JSON.parse(await readFile(join(skillRoot, "evals", "evals.json"), "utf8"))
  assert.equal(evals.skill, "bootstrapping-project-knowledge")
  assert.ok(evals.cases.length >= 4)

  const ids = new Set(evals.cases.map((entry) => entry.id))
  assert.deepEqual(ids, new Set(["small-repo", "research-monorepo", "stale-monorepo", "knowledge-refresh"]))
  for (const entry of evals.cases) {
    assert.ok(entry.pressures.length >= 3)
    assert.ok(entry.assertions.length >= 4)
  }
})
