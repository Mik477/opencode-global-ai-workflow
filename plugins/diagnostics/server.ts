import { tool, type PluginModule } from "@opencode-ai/plugin"
import type { Session } from "@opencode-ai/sdk/client"

import {
  aggregateTokenUsage,
  capText,
  findSessionMatch,
  recentSessions,
  summarizeTail,
  type MessageEnvelope,
  type SessionMatch,
} from "./diagnostics-core.ts"

type SdkResponse<T> =
  | {
      readonly data: T
      readonly error: undefined
      readonly response: { readonly status: number }
    }
  | {
      readonly data: undefined
      readonly error: unknown
      readonly response: { readonly status: number }
    }

export class DiagnosticRequestError extends Error {
  override readonly name = "DiagnosticRequestError"

  constructor(
    readonly operation: string,
    readonly status: number,
  ) {
    super(`Diagnostic ${operation} request failed with status ${status}`)
  }
}

type ListOptions = {
  readonly query: { readonly directory: string }
  readonly signal: AbortSignal
}

type GetOptions = {
  readonly path: { readonly id: string }
  readonly query: { readonly directory: string }
  readonly signal: AbortSignal
}

type MessageOptions = {
  readonly path: { readonly id: string }
  readonly query: { readonly directory: string; readonly limit?: number }
  readonly signal: AbortSignal
}

export type DiagnosticsClient = {
  readonly session: {
    readonly list: (options: ListOptions) => Promise<SdkResponse<readonly Session[]>>
    readonly get: (options: GetOptions) => Promise<SdkResponse<Session>>
    readonly messages: (options: MessageOptions) => Promise<SdkResponse<readonly MessageEnvelope[]>>
  }
}

export const sessionSearchInputSchema = tool.schema.strictObject({
  query: tool.schema.string().trim().min(1),
  limit: tool.schema.number().int().min(1).max(20).default(10),
})

export const sessionReadInputSchema = tool.schema.strictObject({
  session_id: tool.schema.string().min(1),
  message_limit: tool.schema.number().int().min(1).max(50).default(20),
})

export const contextUsageInputSchema = tool.schema.strictObject({})

function requireSdkData<T>(response: SdkResponse<T>, operation: string): T {
  if (response.data !== undefined) return response.data
  throw new DiagnosticRequestError(operation, response.response.status)
}

export function createDiagnosticsTools(client: DiagnosticsClient) {
  return {
    session_search: tool({
      description: "Search visible user and assistant text in up to 50 recent sessions for the current directory.",
      args: sessionSearchInputSchema.shape,
      async execute(raw, context) {
        const input = sessionSearchInputSchema.parse(raw)
        const listed = requireSdkData(
          await client.session.list({
            query: { directory: context.directory },
            signal: context.abort,
          }),
          "session_search.list",
        )
        const sessions = recentSessions(listed)
        const matches = await Promise.all(
          sessions.map(async (session) => {
            const messages = requireSdkData(
              await client.session.messages({
                path: { id: session.id },
                query: { directory: context.directory, limit: 40 },
                signal: context.abort,
              }),
              "session_search.messages",
            )
            return findSessionMatch(session, messages, input.query)
          }),
        )
        const results = matches
          .filter((match): match is SessionMatch => match !== undefined)
          .slice(0, input.limit)
        return `${JSON.stringify(
          { query: capText(input.query, 240), count: results.length, results },
          null,
          2,
        )}`
      },
    }),
    session_read: tool({
      description: "Read the capped visible tail of one exact session in the current project.",
      args: sessionReadInputSchema.shape,
      async execute(raw, context) {
        const input = sessionReadInputSchema.parse(raw)
        const current = requireSdkData(
          await client.session.get({
            path: { id: context.sessionID },
            query: { directory: context.directory },
            signal: context.abort,
          }),
          "session_read.current",
        )
        const targetResponse = await client.session.get({
          path: { id: input.session_id },
          query: { directory: context.directory },
          signal: context.abort,
        })
        if (targetResponse.data === undefined && targetResponse.response.status === 404) {
          return `${JSON.stringify(
            { found: false, session_id: input.session_id, reason: "not_found" },
            null,
            2,
          )}`
        }
        const session = requireSdkData(targetResponse, "session_read.target")
        if (session.projectID !== current.projectID) {
          return `${JSON.stringify(
            { found: false, session_id: input.session_id, reason: "outside_current_project" },
            null,
            2,
          )}`
        }
        const messages = requireSdkData(
          await client.session.messages({
            path: { id: input.session_id },
            query: { directory: context.directory, limit: 50 },
            signal: context.abort,
          }),
          "session_read.messages",
        )
        const tail = summarizeTail(messages, input.message_limit).map((message) => ({
          role: message.role,
          timestamp: new Date(message.timestamp).toISOString(),
          text: message.text,
        }))
        return `${JSON.stringify(
          {
            found: true,
            session: {
              id: session.id,
              title: capText(session.title, 160),
              updated_at: new Date(session.time.updated).toISOString(),
            },
            messages: tail,
          },
          null,
          2,
        )}`
      },
    }),
    context_usage: tool({
      description: "Summarize native assistant token and cost telemetry for the current session.",
      args: contextUsageInputSchema.shape,
      async execute(raw, context) {
        contextUsageInputSchema.parse(raw)
        const current = requireSdkData(
          await client.session.get({
            path: { id: context.sessionID },
            query: { directory: context.directory },
            signal: context.abort,
          }),
          "context_usage.current",
        )
        const sessionID = current.parentID ?? context.sessionID
        const messages = requireSdkData(
          await client.session.messages({
            path: { id: sessionID },
            query: { directory: context.directory },
            signal: context.abort,
          }),
          "context_usage.messages",
        )
        return `${JSON.stringify(
          { session_id: sessionID, ...aggregateTokenUsage(messages) },
          null,
          2,
        )}`
      },
    }),
  }
}

export const diagnosticsPlugin = {
  id: "diagnostics",
  server: async ({ client }) => ({ tool: createDiagnosticsTools(client) }),
} satisfies PluginModule & { readonly id: string }

export default diagnosticsPlugin
