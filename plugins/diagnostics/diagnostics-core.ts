import type { AssistantMessage, Message, Part, Session } from "@opencode-ai/sdk/client"

export type MessageEnvelope = {
  readonly info: Message
  readonly parts: readonly Part[]
}

export type VisibleMessage = {
  readonly role: "user" | "assistant"
  readonly timestamp: number
  readonly text: string
}

export type SessionMatch = {
  readonly session_id: string
  readonly title: string
  readonly updated_at: string
  readonly snippet: string
}

export type UsageSummary = {
  readonly latest: {
    readonly message_id: string
    readonly timestamp: number
    readonly input: number
    readonly output: number
    readonly reasoning: number
    readonly cache_read: number
    readonly cache_write: number
    readonly total_tokens: number
    readonly cost: number
  } | null
  readonly cumulative: {
    readonly input: number
    readonly output: number
    readonly reasoning: number
    readonly cache_read: number
    readonly cache_write: number
    readonly total_tokens: number
    readonly total_cost: number
    readonly message_count: number
  }
}

class UnexpectedMessagePartError extends Error {
  override readonly name = "UnexpectedMessagePartError"

  constructor() {
    super("Unexpected message part variant")
  }
}

function assertNever(_value: never): never {
  throw new UnexpectedMessagePartError()
}

export function unwrapResponse<T>(response: { readonly data: T | undefined }): T | undefined {
  return response.data
}

export function capText(text: string, limit: number): string {
  if (text.length <= limit) return text
  return `${text.slice(0, limit - 3)}...`
}

export function extractVisibleMessage(message: MessageEnvelope): VisibleMessage | undefined {
  switch (message.info.role) {
    case "user":
      break
    case "assistant":
      if (message.info.summary === true) return undefined
      break
    default:
      return assertNever(message.info)
  }

  const text = normalizeText(message.parts.map(visiblePartText).filter((part) => part.length > 0).join(" "))
  if (text.length === 0) return undefined
  return { role: message.info.role, timestamp: message.info.time.created, text }
}

export function findSessionMatch(
  session: Session,
  messages: readonly MessageEnvelope[],
  query: string,
): SessionMatch | undefined {
  const title = normalizeText(session.title)
  const normalizedQuery = normalizeText(query).toLowerCase()
  const titleMatches = title.toLowerCase().includes(normalizedQuery)
  const message = messages
    .map(extractVisibleMessage)
    .filter((item): item is VisibleMessage => item !== undefined)
    .find((item) => item.text.toLowerCase().includes(normalizedQuery))
  if (!titleMatches && message === undefined) return undefined
  const source = titleMatches ? title : message?.text
  if (source === undefined) return undefined
  return {
    session_id: session.id,
    title: capText(title, 160),
    updated_at: new Date(session.time.updated).toISOString(),
    snippet: snippetAroundMatch(source, normalizedQuery, 240),
  }
}

export function recentSessions(sessions: readonly Session[]): readonly Session[] {
  return Array.from(sessions)
    .sort((left, right) => {
      const updated = right.time.updated - left.time.updated
      if (updated !== 0) return updated
      if (left.id < right.id) return -1
      return Number(left.id > right.id)
    })
    .slice(0, 50)
}

export function summarizeTail(messages: readonly MessageEnvelope[], limit: number): readonly VisibleMessage[] {
  return messages
    .map(extractVisibleMessage)
    .filter((message): message is VisibleMessage => message !== undefined)
    .slice(-limit)
    .map((message) => ({ ...message, text: capText(message.text, 1_200) }))
}

export function aggregateTokenUsage(messages: readonly MessageEnvelope[]): UsageSummary {
  const assistantMessages = messages.filter(
    (message): message is MessageEnvelope & { readonly info: AssistantMessage } => message.info.role === "assistant",
  )
  const usage = assistantMessages.map((message) => ({
    message_id: message.info.id,
    timestamp: message.info.time.created,
    input: message.info.tokens.input,
    output: message.info.tokens.output,
    reasoning: message.info.tokens.reasoning,
    cache_read: message.info.tokens.cache.read,
    cache_write: message.info.tokens.cache.write,
    total_tokens:
      message.info.tokens.input +
      message.info.tokens.output +
      message.info.tokens.reasoning +
      message.info.tokens.cache.read +
      message.info.tokens.cache.write,
    cost: message.info.cost,
  }))
  const meaningfulUsage = usage.filter((item) => item.total_tokens > 0 || item.cost > 0)
  const latestCandidates = meaningfulUsage.length > 0 ? meaningfulUsage : usage
  const latest = latestCandidates.reduce<(typeof usage)[number] | null>(
    (current, item) => (current === null || item.timestamp >= current.timestamp ? item : current),
    null,
  )
  const cumulative = usage.reduce<UsageSummary["cumulative"]>(
    (total, item) => ({
      input: total.input + item.input,
      output: total.output + item.output,
      reasoning: total.reasoning + item.reasoning,
      cache_read: total.cache_read + item.cache_read,
      cache_write: total.cache_write + item.cache_write,
      total_tokens: total.total_tokens + item.total_tokens,
      total_cost: total.total_cost + item.cost,
      message_count: total.message_count + 1,
    }),
    {
      input: 0,
      output: 0,
      reasoning: 0,
      cache_read: 0,
      cache_write: 0,
      total_tokens: 0,
      total_cost: 0,
      message_count: 0,
    },
  )
  return {
    latest,
    cumulative,
  }
}

function normalizeText(text: string): string {
  return text.replace(/\s+/gu, " ").trim()
}

function visiblePartText(part: Part): string {
  switch (part.type) {
    case "text":
      return part.synthetic === true || part.ignored === true ? "" : part.text
    case "subtask":
    case "reasoning":
    case "file":
    case "tool":
    case "step-start":
    case "step-finish":
    case "snapshot":
    case "patch":
    case "agent":
    case "retry":
    case "compaction":
      return ""
    default:
      return assertNever(part)
  }
}

function snippetAroundMatch(text: string, query: string, limit: number): string {
  if (text.length <= limit) return text
  const index = text.toLowerCase().indexOf(query)
  const contentLimit = limit - 6
  const start = Math.max(0, Math.min(index - Math.floor(contentLimit / 2), text.length - contentLimit))
  const end = start + contentLimit
  return `${start > 0 ? "..." : ""}${text.slice(start, end)}${end < text.length ? "..." : ""}`
}
