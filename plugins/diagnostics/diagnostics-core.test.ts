import assert from "node:assert/strict"
import { describe, test } from "node:test"

import type {
  AssistantMessage,
  Part,
  ReasoningPart,
  Session,
  TextPart,
  ToolPart,
  UserMessage,
} from "@opencode-ai/sdk/client"

import {
  aggregateTokenUsage,
  capText,
  extractVisibleMessage,
  findSessionMatch,
  recentSessions,
  summarizeTail,
  unwrapResponse,
  type MessageEnvelope,
} from "./diagnostics-core.ts"

const SESSION_ID = "ses_fixture"

function userInfo(created: number): UserMessage {
  return {
    id: `msg_user_${created}`,
    sessionID: SESSION_ID,
    role: "user",
    time: { created },
    agent: "build",
    model: { providerID: "test", modelID: "fixture" },
  }
}

type AssistantFixture = {
  readonly created: number
  readonly input?: number
  readonly output?: number
  readonly reasoning?: number
  readonly cacheRead?: number
  readonly cacheWrite?: number
  readonly cost?: number
  readonly summary?: boolean
}

function assistantInfo(fixture: AssistantFixture): AssistantMessage {
  const summary = fixture.summary === undefined ? {} : { summary: fixture.summary }
  return {
    id: `msg_assistant_${fixture.created}`,
    sessionID: SESSION_ID,
    role: "assistant",
    time: { created: fixture.created },
    parentID: `msg_user_${fixture.created - 1}`,
    modelID: "fixture",
    providerID: "test",
    mode: "build",
    path: { cwd: "C:\\workspace", root: "C:\\workspace" },
    ...summary,
    cost: fixture.cost ?? 0,
    tokens: {
      input: fixture.input ?? 0,
      output: fixture.output ?? 0,
      reasoning: fixture.reasoning ?? 0,
      cache: { read: fixture.cacheRead ?? 0, write: fixture.cacheWrite ?? 0 },
    },
  }
}

function textPart(messageID: string, text: string, flags: { readonly synthetic?: boolean; readonly ignored?: boolean } = {}): TextPart {
  return {
    id: `part_${messageID}_${text.length}`,
    sessionID: SESSION_ID,
    messageID,
    type: "text",
    text,
    ...flags,
  }
}

function envelope(info: UserMessage | AssistantMessage, parts: readonly Part[]): MessageEnvelope {
  return { info, parts }
}

function session(id: string, updated: number, title = `Session ${id}`): Session {
  return {
    id,
    projectID: "project_fixture",
    directory: "C:\\workspace",
    title,
    version: "1.18.4",
    time: { created: updated - 1, updated },
  }
}

describe("diagnostics core", () => {
  test("extractVisibleMessage excludes hidden reasoning, tool payloads, and synthetic text", () => {
    const info = assistantInfo({ created: 20 })
    const reasoning = {
      id: "part_reasoning",
      sessionID: SESSION_ID,
      messageID: info.id,
      type: "reasoning",
      text: "private chain of thought",
      time: { start: 20 },
    } satisfies ReasoningPart
    const toolPayload = {
      id: "part_tool",
      sessionID: SESSION_ID,
      messageID: info.id,
      type: "tool",
      callID: "call_fixture",
      tool: "read",
      state: {
        status: "completed",
        input: { path: "secret.txt" },
        output: "secret tool output",
        title: "Read secret",
        metadata: { credential: "hidden" },
        time: { start: 20, end: 21 },
      },
    } satisfies ToolPart
    const message = envelope(info, [
      textPart(info.id, "visible answer"),
      textPart(info.id, "synthetic internal text", { synthetic: true }),
      textPart(info.id, "ignored internal text", { ignored: true }),
      reasoning,
      toolPayload,
    ])

    const visible = extractVisibleMessage(message)

    assert.deepEqual(visible, { role: "assistant", timestamp: 20, text: "visible answer" })
  })

  test("findSessionMatch searches titles and visible message text case-insensitively", () => {
    const titleMatch = findSessionMatch(session("ses_title", 30, "Authentication Refactor"), [], "AUTHENTICATION")
    const info = userInfo(31)
    const bodyMatch = findSessionMatch(
      session("ses_body", 31),
      [envelope(info, [textPart(info.id, `${"prefix ".repeat(50)}Needle in a haystack`)])],
      "NEEDLE",
    )

    assert.equal(titleMatch?.session_id, "ses_title")
    assert.equal(bodyMatch?.session_id, "ses_body")
    assert.match(bodyMatch?.snippet ?? "", /Needle/)
    assert.ok((bodyMatch?.snippet.length ?? 241) <= 240)
  })

  test("findSessionMatch returns no result when visible content does not match", () => {
    const info = assistantInfo({ created: 32 })
    const messages = [envelope(info, [textPart(info.id, "ordinary visible answer")])]

    const match = findSessionMatch(session("ses_none", 32), messages, "absent")

    assert.equal(match, undefined)
  })

  test("recentSessions sorts deterministically and caps the scan at fifty", () => {
    const sessions = Array.from({ length: 55 }, (_, index) => session(`ses_${index.toString().padStart(2, "0")}`, index))

    const recent = recentSessions(sessions)

    assert.equal(recent.length, 50)
    assert.equal(recent[0]?.id, "ses_54")
    assert.equal(recent[49]?.id, "ses_05")
  })

  test("summarizeTail returns the exact visible tail and caps each message at twelve hundred characters", () => {
    const first = userInfo(1)
    const second = assistantInfo({ created: 2 })
    const summary = assistantInfo({ created: 3, summary: true })
    const fourth = userInfo(4)
    const fifth = assistantInfo({ created: 5 })
    const messages = [
      envelope(first, [textPart(first.id, "first")]),
      envelope(second, [textPart(second.id, "second")]),
      envelope(summary, [textPart(summary.id, "internal summary")]),
      envelope(fourth, [textPart(fourth.id, "x".repeat(1_300))]),
      envelope(fifth, [textPart(fifth.id, "fifth")]),
    ]

    const tail = summarizeTail(messages, 2)

    assert.deepEqual(
      tail.map((message) => [message.role, message.timestamp]),
      [
        ["user", 4],
        ["assistant", 5],
      ],
    )
    assert.equal(tail[0]?.text.length, 1_200)
    assert.equal(tail[1]?.text, "fifth")
  })

  test("aggregateTokenUsage reports latest and cumulative native telemetry", () => {
    const first = assistantInfo({
      created: 10,
      input: 100,
      output: 20,
      reasoning: 5,
      cacheRead: 30,
      cacheWrite: 4,
      cost: 0.25,
    })
    const second = assistantInfo({
      created: 20,
      input: 200,
      output: 40,
      reasoning: 10,
      cacheRead: 60,
      cacheWrite: 8,
      cost: 0.5,
    })
    const messages = [envelope(first, []), envelope(userInfo(15), []), envelope(second, [])]

    const usage = aggregateTokenUsage(messages)

    assert.deepEqual(usage.latest, {
      message_id: second.id,
      timestamp: 20,
      input: 200,
      output: 40,
      reasoning: 10,
      cache_read: 60,
      cache_write: 8,
      total_tokens: 318,
      cost: 0.5,
    })
    assert.deepEqual(usage.cumulative, {
      input: 300,
      output: 60,
      reasoning: 15,
      cache_read: 90,
      cache_write: 12,
      total_tokens: 477,
      total_cost: 0.75,
      message_count: 2,
    })
  })

  test("aggregateTokenUsage selects meaningful latest telemetry over a newer zero wrapper", () => {
    const meaningful = assistantInfo({ created: 30, cost: 0.125 })
    const wrapper = assistantInfo({ created: 40 })
    const messages = [envelope(meaningful, []), envelope(wrapper, [])]

    const usage = aggregateTokenUsage(messages)

    assert.equal(usage.latest?.message_id, meaningful.id)
    assert.equal(usage.latest?.cost, 0.125)
    assert.deepEqual(usage.cumulative, {
      input: 0,
      output: 0,
      reasoning: 0,
      cache_read: 0,
      cache_write: 0,
      total_tokens: 0,
      total_cost: 0.125,
      message_count: 2,
    })
  })

  test("capText and unwrapResponse preserve hard limits and absent data", () => {
    const capped = capText("z".repeat(300), 240)

    assert.equal(capped.length, 240)
    assert.equal(capped.endsWith("..."), true)
    assert.deepEqual(unwrapResponse({ data: ["value"] }), ["value"])
    assert.equal(unwrapResponse<string>({ data: undefined }), undefined)
  })
})
