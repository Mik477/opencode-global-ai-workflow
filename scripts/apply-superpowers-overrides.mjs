import { readFile, writeFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const SUPERPOWERS_VERSION = "6.2.0"
const SKILLS = [
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

function parseArguments(arguments_) {
  let root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
  let check = false
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index]
    if (argument === "--check") check = true
    else if (argument === "--root") {
      const value = arguments_[index + 1]
      if (!value) throw new Error("--root requires a directory")
      root = resolve(value)
      index += 1
    } else throw new Error(`Unknown argument: ${argument}`)
  }
  return { check, root }
}

async function main() {
  const { check, root } = parseArguments(process.argv.slice(2))
  const packagePath = join(root, "node_modules", "superpowers", "package.json")
  const packageMetadata = JSON.parse(await readFile(packagePath, "utf8"))
  if (packageMetadata.version !== SUPERPOWERS_VERSION) {
    throw new Error(
      `Focused workflow requires Superpowers ${SUPERPOWERS_VERSION}; found ${packageMetadata.version ?? "unknown"}`,
    )
  }

  const files = await Promise.all(
    SKILLS.map(async (skill) => {
      const sourcePath = join(
        root,
        "overrides",
        `superpowers-v${SUPERPOWERS_VERSION}`,
        "skills",
        skill,
        "SKILL.md",
      )
      const targetPath = join(root, "node_modules", "superpowers", "skills", skill, "SKILL.md")
      const [source, target] = await Promise.all([readFile(sourcePath), readFile(targetPath)])
      return { skill, source, target, targetPath }
    }),
  )

  const drifted = files.filter(({ source, target }) => !source.equals(target))
  if (check && drifted.length > 0) {
    throw new Error(
      drifted.map(({ skill }) => `${skill} does not match its focused override`).join("\n"),
    )
  }
  if (!check) {
    await Promise.all(
      drifted.map(({ source, targetPath }) => writeFile(targetPath, source)),
    )
  }

  console.log(
    check
      ? `Verified ${files.length} focused Superpowers overrides.`
      : `Applied ${drifted.length} of ${files.length} focused Superpowers overrides.`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
