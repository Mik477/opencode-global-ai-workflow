import assert from "node:assert/strict"
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, join } from "node:path"
import { test } from "node:test"

import type { ToolContext } from "@opencode-ai/plugin"

import plugin, { createTaskTools } from "./server.ts"
import { resolveTaskDirectory } from "./task-path.ts"
import { taskIdSchema, taskRecordSchema } from "./task-schema.ts"
import { TaskStore } from "./task-store.ts"

function toolContext(directory: string): ToolContext {
  return {
    sessionID: "ses-tool-context",
    messageID: "msg-tool-context",
    agent: "test",
    directory,
    worktree: directory,
    abort: new AbortController().signal,
    metadata: () => undefined,
    ask: async () => undefined,
  }
}

test("registers the four task tools and creates through ToolContext", async () => {
  const directory = await mkdtemp(join(tmpdir(), "session-progress-tools-"))
  try {
    const tools = createTaskTools(new TaskStore(directory))

    const output = await tools.task_create.execute(
      { subject: "Created through tool" },
      toolContext(directory),
    )

    assert.equal(plugin.id, "session-progress")
    assert.deepEqual(Object.keys(tools).sort(), ["task_create", "task_get", "task_list", "task_update"])
    assert.equal(typeof output, "string")
    if (typeof output !== "string") assert.fail("task_create returned a structured tool result")
    const summary: unknown = JSON.parse(output)
    assert.deepEqual(Object.keys(taskRecordSchema.pick({ id: true, subject: true }).parse(summary)).sort(), [
      "id",
      "subject",
    ])
    const files = (await readdir(directory)).filter((file) => file.endsWith(".json"))
    assert.equal(files.length, 1)
    const record: unknown = JSON.parse(await readFile(join(directory, files[0] ?? ""), "utf8"))
    assert.equal(taskRecordSchema.parse(record).threadID, "ses-tool-context")
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})

test("returns literal null through task_get when the record is missing", async () => {
  const directory = await mkdtemp(join(tmpdir(), "session-progress-tools-"))
  try {
    const tools = createTaskTools(new TaskStore(directory))

    const output = await tools.task_get.execute(
      { id: taskIdSchema.parse("T-missing") },
      toolContext(directory),
    )

    assert.equal(output, "null")
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})

test("clears a two-sided blocker relation through task_update and task_list", async () => {
  const directory = await mkdtemp(join(tmpdir(), "session-progress-tools-"))
  try {
    const tools = createTaskTools(new TaskStore(directory))
    const context = toolContext(directory)
    const blockerOutput = await tools.task_create.execute({ subject: "Blocker" }, context)
    assert.equal(typeof blockerOutput, "string")
    if (typeof blockerOutput !== "string") assert.fail("task_create returned a structured tool result")
    const blocker = JSON.parse(blockerOutput) as { id: unknown }
    const blockerID = taskIdSchema.parse(blocker.id)
    const dependentOutput = await tools.task_create.execute(
      { subject: "Dependent", blockedBy: [blockerID] },
      context,
    )
    assert.equal(typeof dependentOutput, "string")
    if (typeof dependentOutput !== "string") assert.fail("task_create returned a structured tool result")
    const dependent = JSON.parse(dependentOutput) as { id: unknown }
    const dependentID = taskIdSchema.parse(dependent.id)
    await tools.task_update.execute({ id: blockerID, addBlocks: [dependentID] }, context)

    await tools.task_update.execute({ id: dependentID, setBlockedBy: [] }, context)
    const listOutput = await tools.task_list.execute({}, context)
    assert.equal(typeof listOutput, "string")
    if (typeof listOutput !== "string") assert.fail("task_list returned a structured tool result")
    const listed = JSON.parse(listOutput) as readonly { id: string; blockedBy: readonly string[] }[]

    assert.deepEqual(listed.find((task) => task.id === dependentID)?.blockedBy, [])
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
})

test("prefers and sanitizes the ULTRAWORK task-list override", () => {
  const tasksRoot = join(tmpdir(), "session-progress-paths")

  const resolved = resolveTaskDirectory({
    worktree: "C:\\work\\Project",
    directory: "C:\\work\\Project",
    tasksRoot,
    environment: {
      ULTRAWORK_TASK_LIST_ID: "team/list:primary",
      CLAUDE_CODE_TASK_LIST_ID: "ignored-list",
    },
  })

  assert.equal(resolved, join(tasksRoot, "team-list-primary"))
})

test("uses a path-scoped worktree identity without an environment override", () => {
  const tasksRoot = join(tmpdir(), "session-progress-paths")
  const worktree = "C:\\work\\Project Name!"

  const resolved = resolveTaskDirectory({
    worktree,
    directory: join(worktree, "nested"),
    tasksRoot,
    environment: {
      ULTRAWORK_TASK_LIST_ID: "  ",
      CLAUDE_CODE_TASK_LIST_ID: "",
    },
  })

  assert.match(basename(resolved), /^project-name--[0-9a-f]{12}$/)
})

test("keeps same-named projects in separate task directories", () => {
  const tasksRoot = join(tmpdir(), "session-progress-paths")
  const environment = {
    ULTRAWORK_TASK_LIST_ID: "",
    CLAUDE_CODE_TASK_LIST_ID: "",
  }

  const first = resolveTaskDirectory({
    worktree: "C:\\clients\\alpha\\App",
    directory: "C:\\clients\\alpha\\App",
    tasksRoot,
    environment,
  })
  const second = resolveTaskDirectory({
    worktree: "C:\\clients\\beta\\App",
    directory: "C:\\clients\\beta\\App",
    tasksRoot,
    environment,
  })

  assert.notEqual(first, second)
  assert.match(basename(first), /^app-[0-9a-f]{12}$/)
  assert.match(basename(second), /^app-[0-9a-f]{12}$/)
})

test("canonicalizes equivalent Windows drive paths", () => {
  const tasksRoot = join(tmpdir(), "session-progress-paths")
  const environment = { ULTRAWORK_TASK_LIST_ID: "", CLAUDE_CODE_TASK_LIST_ID: "" }
  const worktrees = [
    "C:\\Clients\\Alpha\\Project",
    "c:/clients/alpha/project/",
    "C:\\Clients\\Alpha\\.\\Project\\\\",
    "C:\\Clients\\Alpha\\scratch\\..\\Project\\",
  ]

  const resolved = worktrees.map((worktree) =>
    resolveTaskDirectory({ worktree, directory: worktree, tasksRoot, environment }),
  )

  assert.equal(new Set(resolved).size, 1)
  assert.match(basename(resolved[0]!), /^project-[0-9a-f]{12}$/)
})

test("canonicalizes equivalent UNC paths case-insensitively", () => {
  const tasksRoot = join(tmpdir(), "session-progress-paths")
  const environment = { ULTRAWORK_TASK_LIST_ID: "", CLAUDE_CODE_TASK_LIST_ID: "" }
  const worktrees = [
    "\\\\Server\\Share\\Teams\\Project",
    "//server/share/teams/project/",
    "\\\\SERVER\\SHARE\\Teams\\.\\Project\\\\",
    "\\\\server\\share\\Teams\\scratch\\..\\Project\\",
  ]

  const resolved = worktrees.map((worktree) =>
    resolveTaskDirectory({ worktree, directory: worktree, tasksRoot, environment }),
  )

  assert.equal(new Set(resolved).size, 1)
  assert.match(basename(resolved[0]!), /^project-[0-9a-f]{12}$/)
})
