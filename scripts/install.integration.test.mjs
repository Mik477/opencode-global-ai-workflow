import assert from "node:assert/strict"
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

const installer = fileURLToPath(new URL("./install.ps1", import.meta.url))

function install(destination, profile, terminal) {
  return spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      installer,
      "-Destination",
      destination,
      "-SkipTests",
      "-PowerShellProfilePath",
      profile,
      "-TerminalSettingsPath",
      terminal,
    ],
    { encoding: "utf8", timeout: 120_000 },
  )
}

test("installs shell integration into JSONC Terminal settings", async () => {
  const directory = await mkdtemp(join(tmpdir(), "workflow-install-jsonc-"))
  const destination = join(directory, "config")
  const profile = join(directory, "profile.ps1")
  const terminal = join(directory, "settings.json")
  try {
    await writeFile(profile, "# Existing profile\r\n", "utf8")
    await writeFile(
      terminal,
      `\uFEFF{\r\n  // Keep this comment.\r\n  "profiles": { "list": [ ], },\r\n}\r\n`,
      "utf8",
    )

    const result = install(destination, profile, terminal)

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
    assert.match(await readFile(profile, "utf8"), /# BEGIN opencode-global-ai-workflow/)
    const terminalText = await readFile(terminal, "utf8")
    assert.match(terminalText, /\/\/ Keep this comment\./)
    assert.equal(terminalText.match(/"name": "OpenCode"/g)?.length, 1)
    await access(join(destination, "opencode.jsonc"))
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})

test("rejects a malformed merged profile without changing user files", async () => {
  const directory = await mkdtemp(join(tmpdir(), "workflow-install-profile-"))
  const destination = join(directory, "config")
  const profile = join(directory, "profile.ps1")
  const terminal = join(directory, "settings.json")
  const originalProfile = "function Broken {\r\n"
  const originalTerminal = '{"profiles":{"list":[]}}\r\n'
  try {
    await writeFile(profile, originalProfile, "utf8")
    await writeFile(terminal, originalTerminal, "utf8")

    const result = install(destination, profile, terminal)

    assert.notEqual(result.status, 0)
    assert.equal(await readFile(profile, "utf8"), originalProfile)
    assert.equal(await readFile(terminal, "utf8"), originalTerminal)
    await assert.rejects(access(destination), { code: "ENOENT" })
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})
