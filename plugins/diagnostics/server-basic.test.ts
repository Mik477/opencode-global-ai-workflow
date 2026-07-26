import assert from "node:assert/strict"
import { describe, test } from "node:test"

import { tool, type ToolContext } from "@opencode-ai/plugin"
import type { Session } from "@opencode-ai/sdk/client"

import {
  contextUsageInputSchema,
  createDiagnosticsTools,
  diagnosticsPlugin,
  sessionReadInputSchema,
  sessionSearchInputSchema,
  type DiagnosticsClient,
} from "./server.ts"

function sdkSuccess<T>(data: T) {
  return { data, error: undefined, response: { status: 200 } }
}

function sdkFailure(status: number) {
  return { data: undefined, error: { name: "fixture_error" }, response: { status } }
}

const emptyClient = {
  session: {
    list: async () => sdkSuccess([]),
    get: async (options) =>
      options.path.id === "ses_current" ? sdkSuccess(session("ses_current", 1)) : sdkFailure(404),
    messages: async () => sdkSuccess([]),
  },
} satisfies DiagnosticsClient

function context(sessionID = "ses_current"): ToolContext {
  return {
    sessionID,
    messageID: "msg_current",
    agent: "diagnostics",
    directory: "C:\\workspace",
    worktree: "C:\\workspace",
    abort: new AbortController().signal,
    metadata: () => undefined,
    ask: async () => undefined,
  }
}

function session(id: string, updated: number): Session {
  return {
    id,
    projectID: "project_fixture",
    directory: "C:\\workspace",
    title: `Session ${id}`,
    version: "1.18.4",
    time: { created: updated - 1, updated },
  }
}

describe("diagnostics server basics", () => {
  test("plugin registers exactly the three diagnostics tools", () => {
    const tools = createDiagnosticsTools(emptyClient)

    const names = Object.keys(tools)

    assert.equal(diagnosticsPlugin.id, "diagnostics")
    assert.deepEqual(names, ["session_search", "session_read", "context_usage"])
  })

  test("tool input schemas apply defaults, hard limits, and strict empty arguments", () => {
    const search = sessionSearchInputSchema.parse({ query: "needle" })
    const read = sessionReadInputSchema.parse({ session_id: "ses_exact" })
    const usage = contextUsageInputSchema.parse({})

    assert.equal(search.limit, 10)
    assert.equal(read.message_limit, 20)
    assert.deepEqual(usage, {})
    assert.throws(() => sessionSearchInputSchema.parse({ query: "needle", limit: 0 }))
    assert.throws(() => sessionSearchInputSchema.parse({ query: "needle", limit: 21 }))
    assert.throws(() => sessionSearchInputSchema.parse({ query: "   " }))
    assert.throws(() => sessionReadInputSchema.parse({ session_id: "ses_exact", message_limit: 51 }))
    assert.throws(() => contextUsageInputSchema.parse({ extra: true }))
  })

  test("session_search returns a concise deterministic no-result summary", async () => {
    const outputSchema = tool.schema.strictObject({
      query: tool.schema.string(),
      count: tool.schema.number().int(),
      results: tool.schema.array(tool.schema.unknown()),
    })
    const tools = createDiagnosticsTools(emptyClient)

    const output = await tools.session_search.execute({ query: "missing", limit: 10 }, context())
    const parsed = outputSchema.parse(JSON.parse(typeof output === "string" ? output : output.output))

    assert.deepEqual(parsed, { query: "missing", count: 0, results: [] })
  })

  test("session_read reports an exact missing ID without exposing an SDK error", async () => {
    const outputSchema = tool.schema.strictObject({
      found: tool.schema.literal(false),
      session_id: tool.schema.string(),
      reason: tool.schema.literal("not_found"),
    })
    const tools = createDiagnosticsTools(emptyClient)

    const output = await tools.session_read.execute(
      { session_id: "ses_does_not_exist", message_limit: 20 },
      context(),
    )
    const parsed = outputSchema.parse(JSON.parse(typeof output === "string" ? output : output.output))

    assert.deepEqual(parsed, { found: false, session_id: "ses_does_not_exist", reason: "not_found" })
  })

  test("session_search scopes SDK calls and scans no more than fifty sessions or forty messages each", async () => {
    const requests: Array<{ readonly id: string; readonly directory: string; readonly limit: number | undefined }> = []
    const sessions = Array.from({ length: 55 }, (_, index) => session(`ses_${index.toString().padStart(2, "0")}`, index))
    const client = {
      session: {
        list: async (options) => {
          assert.equal(options.query.directory, "C:\\workspace")
          return sdkSuccess(sessions)
        },
        get: async () => sdkFailure(404),
        messages: async (options) => {
          requests.push({
            id: options.path.id,
            directory: options.query.directory,
            limit: options.query.limit,
          })
          return sdkSuccess([])
        },
      },
    } satisfies DiagnosticsClient
    const tools = createDiagnosticsTools(client)

    const output = await tools.session_search.execute({ query: "session", limit: 3 }, context())
    const text = typeof output === "string" ? output : output.output
    const parsed = tool.schema
      .object({ count: tool.schema.literal(3), results: tool.schema.array(tool.schema.unknown()) })
      .parse(JSON.parse(text))

    assert.equal(parsed.results.length, 3)
    assert.equal(requests.length, 50)
    assert.deepEqual(requests[0], { id: "ses_54", directory: "C:\\workspace", limit: 40 })
    assert.deepEqual(requests[49], { id: "ses_05", directory: "C:\\workspace", limit: 40 })
  })

  test("context_usage reads all telemetry for the current tool session without a text tokenization limit", async () => {
    const client = {
      session: {
        list: async () => sdkSuccess([]),
        get: async (options) => {
          assert.equal(options.path.id, "ses_context")
          return sdkSuccess(session("ses_context", 1))
        },
        messages: async (options) => {
          assert.equal(options.path.id, "ses_context")
          assert.equal(options.query.directory, "C:\\workspace")
          assert.equal(options.query.limit, undefined)
          return sdkSuccess([])
        },
      },
    } satisfies DiagnosticsClient
    const tools = createDiagnosticsTools(client)

    const output = await tools.context_usage.execute({}, context("ses_context"))
    const text = typeof output === "string" ? output : output.output
    const parsed = tool.schema
      .object({
        session_id: tool.schema.literal("ses_context"),
        latest: tool.schema.null(),
        cumulative: tool.schema.object({ message_count: tool.schema.literal(0) }),
      })
      .parse(JSON.parse(text))

    assert.equal(parsed.session_id, "ses_context")
    assert.equal(parsed.cumulative.message_count, 0)
  })

  test("context_usage aggregates the parent of a diagnostics child session", async () => {
    const child = { ...session("ses_child", 2), parentID: "ses_parent" } satisfies Session
    const client = {
      session: {
        list: async () => sdkSuccess([]),
        get: async (options) => {
          assert.equal(options.path.id, "ses_child")
          assert.equal(options.query.directory, "C:\\workspace")
          return sdkSuccess(child)
        },
        messages: async (options) => {
          assert.equal(options.path.id, "ses_parent")
          assert.equal(options.query.directory, "C:\\workspace")
          return sdkSuccess([])
        },
      },
    } satisfies DiagnosticsClient
    const tools = createDiagnosticsTools(client)

    const output = await tools.context_usage.execute({}, context("ses_child"))
    const text = typeof output === "string" ? output : output.output
    const parsed = tool.schema
      .object({ session_id: tool.schema.literal("ses_parent") })
      .parse(JSON.parse(text))

    assert.equal(parsed.session_id, "ses_parent")
  })
})
