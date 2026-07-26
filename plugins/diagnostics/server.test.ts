import assert from "node:assert/strict"
import { describe, test } from "node:test"

import { tool, type ToolContext } from "@opencode-ai/plugin"
import type { Session } from "@opencode-ai/sdk/client"

import type { MessageEnvelope } from "./diagnostics-core.ts"
import { createDiagnosticsTools, type DiagnosticsClient } from "./server.ts"

function sdkSuccess<T>(data: T) {
  return { data, error: undefined, response: { status: 200 } }
}

function sdkFailure(status: number) {
  return {
    data: undefined,
    error: { details: "raw sdk payload" },
    response: { status },
  }
}

function diagnosticsClient(overrides: Partial<DiagnosticsClient["session"]>): DiagnosticsClient {
  return {
    session: {
      list: async () => sdkSuccess([]),
      get: async () => sdkFailure(500),
      messages: async () => sdkSuccess([]),
      ...overrides,
    },
  }
}

function context(sessionID = "ses_diagnostics"): ToolContext {
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

function session(id: string, projectID: string): Session {
  return {
    id,
    projectID,
    directory: "C:\\workspace",
    title: `Session ${id}`,
    version: "1.18.4",
    time: { created: 1, updated: 2 },
  }
}

function isDiagnosticFailure(error: unknown, operation: string, status: number): boolean {
  if (!(error instanceof Error)) return false
  if (!("status" in error) || !("operation" in error)) return false
  return (
    error.name === "DiagnosticRequestError" &&
    error.status === status &&
    error.operation === operation &&
    !error.message.includes("raw sdk payload")
  )
}

describe("diagnostics SDK boundaries", () => {
  test("session_read denies a target outside the invoking diagnostics project without reading messages", async () => {
    let messagesRequested = false
    const client = diagnosticsClient({
      get: async (options) =>
        sdkSuccess(
          options.path.id === "ses_diagnostics"
            ? session("ses_diagnostics", "project_current")
            : session("ses_target", "project_other"),
        ),
      messages: async () => {
        messagesRequested = true
        return sdkSuccess([])
      },
    })
    const tools = createDiagnosticsTools(client)

    const output = await tools.session_read.execute(
      { session_id: "ses_target", message_limit: 20 },
      context(),
    )
    const text = typeof output === "string" ? output : output.output
    const parsed = tool.schema
      .strictObject({
        found: tool.schema.literal(false),
        session_id: tool.schema.literal("ses_target"),
        reason: tool.schema.literal("outside_current_project"),
      })
      .parse(JSON.parse(text))

    assert.equal(parsed.reason, "outside_current_project")
    assert.equal(messagesRequested, false)
  })

  test("session_read continues for a target in the invoking diagnostics project", async () => {
    const gets: string[] = []
    const messageRequests: string[] = []
    const visible = {
      info: {
        id: "msg_visible",
        sessionID: "ses_target",
        role: "user",
        time: { created: 10 },
        agent: "build",
        model: { providerID: "test", modelID: "fixture" },
      },
      parts: [
        {
          id: "part_visible",
          sessionID: "ses_target",
          messageID: "msg_visible",
          type: "text",
          text: "visible target message",
        },
      ],
    } satisfies MessageEnvelope
    const client = diagnosticsClient({
      get: async (options) => {
        gets.push(options.path.id)
        return sdkSuccess(session(options.path.id, "project_current"))
      },
      messages: async (options) => {
        messageRequests.push(options.path.id)
        return sdkSuccess([visible])
      },
    })
    const tools = createDiagnosticsTools(client)

    const output = await tools.session_read.execute(
      { session_id: "ses_target", message_limit: 20 },
      context(),
    )
    const text = typeof output === "string" ? output : output.output
    const parsed = tool.schema
      .object({
        found: tool.schema.literal(true),
        messages: tool.schema.array(tool.schema.object({ text: tool.schema.string() })),
      })
      .parse(JSON.parse(text))

    assert.equal(parsed.found, true)
    assert.equal(parsed.messages[0]?.text, "visible target message")
    assert.deepEqual(gets, ["ses_diagnostics", "ses_target"])
    assert.deepEqual(messageRequests, ["ses_target"])
  })

  test("session_read reports not_found only when the exact target get returns 404", async () => {
    const client = diagnosticsClient({
      get: async (options) =>
        options.path.id === "ses_diagnostics"
          ? sdkSuccess(session("ses_diagnostics", "project_current"))
          : sdkFailure(404),
    })
    const tools = createDiagnosticsTools(client)

    const output = await tools.session_read.execute(
      { session_id: "ses_missing", message_limit: 20 },
      context(),
    )
    const text = typeof output === "string" ? output : output.output
    const parsed = tool.schema
      .strictObject({
        found: tool.schema.literal(false),
        session_id: tool.schema.literal("ses_missing"),
        reason: tool.schema.literal("not_found"),
      })
      .parse(JSON.parse(text))

    assert.equal(parsed.reason, "not_found")
  })

  test("session_read throws a typed failure when the invoking session get returns 404", async () => {
    const tools = createDiagnosticsTools(diagnosticsClient({ get: async () => sdkFailure(404) }))

    const operation = () =>
      tools.session_read.execute({ session_id: "ses_target", message_limit: 20 }, context())

    await assert.rejects(operation, (error: unknown) =>
      isDiagnosticFailure(error, "session_read.current", 404),
    )
  })

  test("session_read throws a typed failure when the target get returns a non-404 error", async () => {
    const client = diagnosticsClient({
      get: async (options) =>
        options.path.id === "ses_diagnostics"
          ? sdkSuccess(session("ses_diagnostics", "project_current"))
          : sdkFailure(500),
    })
    const tools = createDiagnosticsTools(client)

    const operation = () =>
      tools.session_read.execute({ session_id: "ses_target", message_limit: 20 }, context())

    await assert.rejects(operation, (error: unknown) =>
      isDiagnosticFailure(error, "session_read.target", 500),
    )
  })

  test("session_search throws a typed failure instead of returning zero results when list fails", async () => {
    const tools = createDiagnosticsTools(diagnosticsClient({ list: async () => sdkFailure(500) }))

    const operation = () => tools.session_search.execute({ query: "needle", limit: 10 }, context())

    await assert.rejects(operation, (error: unknown) =>
      isDiagnosticFailure(error, "session_search.list", 500),
    )
  })

  test("session_search rejects with its messages operation and status when message loading fails", async () => {
    const client = diagnosticsClient({
      list: async () => sdkSuccess([session("ses_target", "project_current")]),
      messages: async () => sdkFailure(500),
    })
    const tools = createDiagnosticsTools(client)

    const operation = () => tools.session_search.execute({ query: "needle", limit: 10 }, context())

    await assert.rejects(operation, (error: unknown) =>
      isDiagnosticFailure(error, "session_search.messages", 500),
    )
  })

  test("session_read rejects with its messages operation and status when message loading fails", async () => {
    const client = diagnosticsClient({
      get: async (options) => sdkSuccess(session(options.path.id, "project_current")),
      messages: async () => sdkFailure(500),
    })
    const tools = createDiagnosticsTools(client)

    const operation = () =>
      tools.session_read.execute({ session_id: "ses_target", message_limit: 20 }, context())

    await assert.rejects(operation, (error: unknown) =>
      isDiagnosticFailure(error, "session_read.messages", 500),
    )
  })

  test("context_usage rejects with its current operation and status when session loading fails", async () => {
    const tools = createDiagnosticsTools(diagnosticsClient({ get: async () => sdkFailure(500) }))

    const operation = () => tools.context_usage.execute({}, context())

    await assert.rejects(operation, (error: unknown) =>
      isDiagnosticFailure(error, "context_usage.current", 500),
    )
  })

  test("context_usage throws a typed failure instead of returning zero telemetry when messages fail", async () => {
    const client = diagnosticsClient({
      get: async () => sdkSuccess(session("ses_diagnostics", "project_current")),
      messages: async () => sdkFailure(500),
    })
    const tools = createDiagnosticsTools(client)

    const operation = () => tools.context_usage.execute({}, context())

    await assert.rejects(operation, (error: unknown) =>
      isDiagnosticFailure(error, "context_usage.messages", 500),
    )
  })
})
