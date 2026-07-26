import { readFile, writeFile } from "node:fs/promises"
import { applyEdits, modify, parse, printParseErrorCode } from "jsonc-parser"

const OPEN_CODE_GUID = "{01aed5ce-8fe2-4c58-a48c-7a62e5de2668}"

function parseJsonc(text, path) {
  const errors = []
  const value = parse(text, errors, { allowTrailingComma: true, disallowComments: false })
  if (errors.length > 0) {
    const details = errors
      .map((error) => `${printParseErrorCode(error.error)} at offset ${error.offset}`)
      .join(", ")
    throw new Error(`Invalid JSONC in ${path}: ${details}`)
  }
  return value
}

async function main() {
  if (process.argv[2] === "--inspect") {
    const inputPath = process.argv[3]
    if (!inputPath) throw new Error("Usage: terminal-settings.mjs --inspect <settings>")
    const inputBytes = await readFile(inputPath)
    const hasBom = inputBytes.subarray(0, 3).toString("hex") === "efbbbf"
    const inputText = inputBytes.subarray(hasBom ? 3 : 0).toString("utf8")
    process.stdout.write(JSON.stringify(parseJsonc(inputText, inputPath)))
    return
  }

  const [inputPath, profilePath, outputPath] = process.argv.slice(2)
  if (!inputPath || !profilePath || !outputPath) {
    throw new Error("Usage: terminal-settings.mjs <settings> <profile> <output>")
  }

  const inputBytes = await readFile(inputPath)
  const hasBom = inputBytes.subarray(0, 3).toString("hex") === "efbbbf"
  const inputText = inputBytes.subarray(hasBom ? 3 : 0).toString("utf8")
  const settings = parseJsonc(inputText, inputPath)
  const profile = JSON.parse(await readFile(profilePath, "utf8"))
  const profiles = settings?.profiles?.list
  if (!Array.isArray(profiles)) throw new Error("Windows Terminal settings are missing profiles.list")

  const matches = profiles
    .map((candidate, index) => ({ candidate, index }))
    .filter(({ candidate }) => candidate?.name === "OpenCode" || candidate?.guid === OPEN_CODE_GUID)
  if (matches.length > 1) {
    throw new Error("Conflicting Windows Terminal profiles use the OpenCode name or GUID")
  }

  let outputText = inputText
  if (matches.length === 0) {
    outputText = applyEdits(
      inputText,
      modify(inputText, ["profiles", "list", -1], profile, {
        formattingOptions: {
          insertSpaces: true,
          tabSize: 4,
          eol: inputText.includes("\r\n") ? "\r\n" : "\n",
        },
      }),
    )
  } else if (JSON.stringify(matches[0].candidate) !== JSON.stringify(profile)) {
    outputText = applyEdits(
      inputText,
      modify(inputText, ["profiles", "list", matches[0].index], profile, {
        formattingOptions: {
          insertSpaces: true,
          tabSize: 4,
          eol: inputText.includes("\r\n") ? "\r\n" : "\n",
        },
      }),
    )
  }

  parseJsonc(outputText, outputPath)
  const outputBytes = Buffer.from(`${hasBom ? "\uFEFF" : ""}${outputText}`, "utf8")
  await writeFile(outputPath, outputBytes, { flag: "wx" })
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
