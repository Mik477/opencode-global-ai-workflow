import assert from "node:assert/strict"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

const helper = fileURLToPath(new URL("./terminal-settings.mjs", import.meta.url))
const profile = fileURLToPath(new URL("../windows/terminal/OpenCode.profile.json", import.meta.url))

test("merges JSONC settings without discarding formatting and is idempotent", async () => {
  const directory = await mkdtemp(join(tmpdir(), "terminal-settings-"))
  const input = join(directory, "settings.json")
  const firstOutput = join(directory, "first.json")
  const secondOutput = join(directory, "second.json")
  try {
    await writeFile(
      input,
      Buffer.from(
        `\uFEFF{\r\n  // Keep this user comment.\r\n  "profiles": {\r\n    "list": [\r\n      { "guid": "{11111111-1111-1111-1111-111111111111}", "name": "PowerShell" },\r\n    ],\r\n  },\r\n}\r\n`,
        "utf8",
      ),
    )

    const first = spawnSync(process.execPath, [helper, input, profile, firstOutput], {
      encoding: "utf8",
    })
    assert.equal(first.status, 0, first.stderr)
    const firstBytes = await readFile(firstOutput)
    const firstText = firstBytes.toString("utf8")
    assert.equal(firstBytes.subarray(0, 3).toString("hex"), "efbbbf")
    assert.match(firstText, /\/\/ Keep this user comment\./)
    assert.match(firstText, /\r\n/)
    assert.equal(firstText.match(/"name": "OpenCode"/g)?.length, 1)

    const inspected = spawnSync(process.execPath, [helper, "--inspect", firstOutput], {
      encoding: "utf8",
    })
    assert.equal(inspected.status, 0, inspected.stderr)
    const settings = JSON.parse(inspected.stdout)
    assert.equal(settings.profiles.list.filter((item) => item.name === "OpenCode").length, 1)

    const second = spawnSync(
      process.execPath,
      [helper, firstOutput, profile, secondOutput],
      { encoding: "utf8" },
    )
    assert.equal(second.status, 0, second.stderr)
    assert.deepEqual(await readFile(secondOutput), firstBytes)
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})

test("rejects conflicting OpenCode profiles without producing output", async () => {
  const directory = await mkdtemp(join(tmpdir(), "terminal-settings-conflict-"))
  const input = join(directory, "settings.json")
  const output = join(directory, "output.json")
  try {
    await writeFile(
      input,
      JSON.stringify({
        profiles: {
          list: [
            { guid: "{11111111-1111-1111-1111-111111111111}", name: "OpenCode" },
            { guid: "{01aed5ce-8fe2-4c58-a48c-7a62e5de2668}", name: "Other" },
          ],
        },
      }),
      "utf8",
    )

    const result = spawnSync(process.execPath, [helper, input, profile, output], {
      encoding: "utf8",
    })

    assert.notEqual(result.status, 0)
    await assert.rejects(readFile(output), { code: "ENOENT" })
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})
