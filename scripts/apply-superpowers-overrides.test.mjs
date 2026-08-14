import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

const script = fileURLToPath(new URL("./apply-superpowers-overrides.mjs", import.meta.url))
const skills = [
  "brainstorming",
  "writing-plans",
  "subagent-driven-development",
  "requesting-code-review",
  "verification-before-completion",
  "finishing-a-development-branch",
  "using-git-worktrees",
  "test-driven-development",
  "executing-plans",
]

async function createFixture(version = "6.2.0") {
  const root = await mkdtemp(join(tmpdir(), "superpowers-overrides-"))
  await mkdir(join(root, "node_modules", "superpowers"), { recursive: true })
  await writeFile(
    join(root, "node_modules", "superpowers", "package.json"),
    JSON.stringify({ name: "superpowers", version }),
  )
  for (const skill of skills) {
    const source = join(root, "overrides", "superpowers-v6.2.0", "skills", skill)
    const target = join(root, "node_modules", "superpowers", "skills", skill)
    await mkdir(source, { recursive: true })
    await mkdir(target, { recursive: true })
    await writeFile(join(source, "SKILL.md"), `focused ${skill}\n`)
    await writeFile(join(target, "SKILL.md"), `stock ${skill}\n`)
  }
  return root
}

function run(root, ...arguments_) {
  return spawnSync(process.execPath, [script, "--root", root, ...arguments_], {
    encoding: "utf8",
  })
}

test("applies every focused override idempotently and verifies it", async () => {
  const root = await createFixture()
  try {
    const applied = run(root)
    assert.equal(applied.status, 0, applied.stderr)
    for (const skill of skills) {
      assert.equal(
        await readFile(join(root, "node_modules", "superpowers", "skills", skill, "SKILL.md"), "utf8"),
        `focused ${skill}\n`,
      )
    }
    assert.equal(run(root).status, 0)
    assert.equal(run(root, "--check").status, 0)
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})

test("check reports drift without modifying the installed skill", async () => {
  const root = await createFixture()
  try {
    const target = join(root, "node_modules", "superpowers", "skills", skills[0], "SKILL.md")
    const result = run(root, "--check")
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /does not match its focused override/)
    assert.equal(await readFile(target, "utf8"), `stock ${skills[0]}\n`)
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})

test("rejects an unsupported Superpowers version before changing files", async () => {
  const root = await createFixture("6.3.0")
  try {
    const target = join(root, "node_modules", "superpowers", "skills", skills[0], "SKILL.md")
    const result = run(root)
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /requires Superpowers 6\.2\.0/)
    assert.equal(await readFile(target, "utf8"), `stock ${skills[0]}\n`)
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})
