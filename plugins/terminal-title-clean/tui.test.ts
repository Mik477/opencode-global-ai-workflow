import assert from "node:assert/strict"
import { test } from "node:test"
import type { TuiDispose, TuiPluginApi } from "@opencode-ai/plugin/tui"

import plugin, { cleanTerminalTitle } from "./tui.ts"

test("cleans every terminal title update", () => {
  assert.equal(cleanTerminalTitle("OC | Current project"), "Current project")
  assert.equal(cleanTerminalTitle("New session - 2026-07-26T10:20:30.000Z"), "OpenCode")
  assert.equal(cleanTerminalTitle("Child session - 2026-07-26T10:20:30.000Z"), "OpenCode")
  assert.equal(cleanTerminalTitle(""), "OpenCode")
  assert.equal(cleanTerminalTitle("A".repeat(50)), `${"A".repeat(37)}...`)
})

test("counts Unicode code points when limiting titles", () => {
  const character = "\u{1F600}"
  assert.equal(cleanTerminalTitle(character.repeat(40)), character.repeat(40))
  assert.equal(cleanTerminalTitle(character.repeat(41)), `${character.repeat(37)}...`)
})

test("intercepts title updates and restores a prototype renderer method", async () => {
  class RendererStub {
    readonly calls: string[] = []

    setTerminalTitle(title: string): void {
      this.calls.push(title)
    }
  }

  const renderer = new RendererStub()
  const original = renderer.setTerminalTitle
  const disposals: TuiDispose[] = []
  const api = {
    renderer,
    route: { current: { name: "home" } },
    lifecycle: {
      signal: new AbortController().signal,
      onDispose(dispose: TuiDispose) {
        disposals.push(dispose)
        return () => {}
      },
    },
  } as unknown as TuiPluginApi

  assert.equal(Object.hasOwn(renderer, "setTerminalTitle"), false)
  await plugin.tui(api)
  const intercepted = renderer.setTerminalTitle
  renderer.setTerminalTitle("OC | Current project")

  const dispose = disposals[0]
  assert.ok(dispose)
  await dispose()
  renderer.setTerminalTitle("OC | After dispose")

  assert.notEqual(intercepted, original)
  assert.equal(renderer.setTerminalTitle, original)
  assert.equal(Object.hasOwn(renderer, "setTerminalTitle"), false)
  assert.deepEqual(renderer.calls, ["OpenCode", "Current project", "OC | After dispose"])
})
