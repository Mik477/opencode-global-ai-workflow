import { createHash } from "node:crypto"
import { homedir } from "node:os"
import { join, posix, win32 } from "node:path"

import { z } from "zod"

const taskEnvironmentSchema = z.object({
  ULTRAWORK_TASK_LIST_ID: z.string().optional(),
  CLAUDE_CODE_TASK_LIST_ID: z.string().optional(),
})

type TaskPathEnvironment = {
  readonly ULTRAWORK_TASK_LIST_ID?: string | undefined
  readonly CLAUDE_CODE_TASK_LIST_ID?: string | undefined
}

type TaskPathInput = {
  readonly worktree: string
  readonly directory: string
  readonly tasksRoot?: string
  readonly environment?: TaskPathEnvironment
}

export function sanitizeTaskListID(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, "-") || "default"
}

function defaultTaskListID(workspace: string): string {
  const isWindowsPath = /^[A-Za-z]:[\\/]/.test(workspace) || /^(?:\\\\|\/\/)/.test(workspace)
  const path = isWindowsPath ? win32 : posix
  let normalized = path.normalize(workspace)
  const rootLength = path.parse(normalized).root.length
  while (normalized.length > rootLength && /[\\/]$/.test(normalized)) normalized = normalized.slice(0, -1)
  const identity = isWindowsPath ? normalized.replace(/\\/g, "/").toLowerCase() : normalized
  const name = sanitizeTaskListID(
    path.basename(identity) || "default",
  )
  const digest = createHash("sha256").update(identity).digest("hex").slice(0, 12)
  return `${name}-${digest}`
}

export function resolveTaskDirectory(input: TaskPathInput): string {
  const environment = taskEnvironmentSchema.parse(input.environment ?? process.env)
  const configuredID =
    environment.ULTRAWORK_TASK_LIST_ID?.trim() ||
    environment.CLAUDE_CODE_TASK_LIST_ID?.trim()
  const defaultID = defaultTaskListID(input.worktree || input.directory)
  const tasksRoot = input.tasksRoot ?? join(homedir(), ".config", "opencode", "tasks")
  return join(tasksRoot, sanitizeTaskListID(configuredID || defaultID))
}
