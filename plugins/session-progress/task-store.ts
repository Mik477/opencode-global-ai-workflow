import {
  copyFile,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  stat,
  unlink,
  writeFile,
  type FileHandle,
} from "node:fs/promises"
import { dirname, join } from "node:path"
import { randomUUID } from "node:crypto"
import { constants } from "node:fs"

import { ZodError } from "zod"

import {
  taskIdSchema,
  taskRecordSchema,
  type CreateTaskInput,
  type TaskID,
  type TaskRecord,
  type TaskStatus,
  type TaskUpdateInput,
} from "./task-schema.ts"

const STALE_LOCK_MS = 30_000
const LOCK_POLL_MS = 20

export type TaskSummary = {
  readonly id: TaskID
  readonly subject: string
  readonly status: TaskStatus
  readonly parentID?: TaskID
  readonly activeForm?: string
  readonly owner?: string
  readonly blockedBy: readonly TaskID[]
  readonly planPath?: string
}

export class TaskNotFoundError extends Error {
  readonly name = "TaskNotFoundError"

  constructor(readonly taskID: TaskID) {
    super(`task ${taskID} not found`)
  }
}

export class InvalidTaskRecordError extends Error {
  readonly name = "InvalidTaskRecordError"

  constructor(readonly path: string, cause: SyntaxError | ZodError) {
    super(`invalid task record at ${path}`, { cause })
  }
}

export type TaskFileOperations = {
  readonly copyFile: typeof copyFile
  readonly rename: typeof rename
  readonly unlink: typeof unlink
  readonly writeFile: typeof writeFile
}

const defaultTaskFileOperations: TaskFileOperations = { copyFile, rename, unlink, writeFile }

function hasErrorCode(error: unknown, code: string): boolean {
  return error instanceof Error && "code" in error && error.code === code
}

async function readTaskFile(path: string): Promise<TaskRecord | null> {
  let raw: string
  try {
    raw = await readFile(path, "utf8")
  } catch (error) {
    if (hasErrorCode(error, "ENOENT")) return null
    throw error
  }

  try {
    const value: unknown = JSON.parse(raw)
    return taskRecordSchema.parse(value)
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof ZodError) {
      throw new InvalidTaskRecordError(path, error)
    }
    throw error
  }
}

async function acquireTaskLock(lockPath: string): Promise<FileHandle> {
  while (true) {
    try {
      return await open(lockPath, "wx")
    } catch (error) {
      if (!hasErrorCode(error, "EEXIST")) throw error
    }

    let modifiedAt: number
    try {
      modifiedAt = (await stat(lockPath)).mtimeMs
    } catch (error) {
      if (hasErrorCode(error, "ENOENT")) continue
      throw error
    }

    if (Date.now() - modifiedAt >= STALE_LOCK_MS) {
      try {
        await unlink(lockPath)
      } catch (error) {
        if (!hasErrorCode(error, "ENOENT")) throw error
      }
      continue
    }

    await new Promise<void>((resolve) => setTimeout(resolve, LOCK_POLL_MS))
  }
}

async function withTaskLock<T>(taskPath: string, operation: () => Promise<T>): Promise<T> {
  await mkdir(dirname(taskPath), { recursive: true })
  const lockPath = `${taskPath}.lock`
  const lock = await acquireTaskLock(lockPath)
  try {
    return await operation()
  } finally {
    try {
      await lock.close()
    } finally {
      await unlink(lockPath)
    }
  }
}

async function atomicWriteTask(path: string, task: TaskRecord): Promise<void> {
  const temporaryPath = `${path}.tmp.${randomUUID()}`
  try {
    await writeFile(temporaryPath, `${JSON.stringify(task, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
    })
    await rename(temporaryPath, path)
  } catch (error) {
    try {
      await unlink(temporaryPath)
    } catch (cleanupError) {
      if (!hasErrorCode(cleanupError, "ENOENT")) throw cleanupError
    }
    throw error
  }
}

export class TaskStore {
  private readonly fileOperations: TaskFileOperations

  constructor(
    readonly directory: string,
    fileOperations: Partial<TaskFileOperations> = {},
  ) {
    this.fileOperations = { ...defaultTaskFileOperations, ...fileOperations }
  }

  async create(input: CreateTaskInput, threadID: string): Promise<TaskRecord> {
    const id = taskIdSchema.parse(`T-${randomUUID()}`)
    const task = taskRecordSchema.parse({
      id,
      subject: input.subject,
      description: input.description ?? "",
      status: "pending",
      ...(input.activeForm === undefined ? {} : { activeForm: input.activeForm }),
      blocks: input.blocks ?? [],
      blockedBy: input.blockedBy ?? [],
      ...(input.owner === undefined ? {} : { owner: input.owner }),
      ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
      ...(input.repoURL === undefined ? {} : { repoURL: input.repoURL }),
      ...(input.parentID === undefined ? {} : { parentID: input.parentID }),
      threadID,
    })
    const path = this.taskPath(id)
    await this.withMutationLock(async () => atomicWriteTask(path, task))
    return task
  }

  async get(id: TaskID): Promise<TaskRecord | null> {
    return readTaskFile(this.taskPath(id))
  }

  async list(): Promise<readonly TaskSummary[]> {
    const records = await this.readAll()
    const byID = new Map(records.map((task) => [task.id, task]))
    const blockersByTask = new Map<TaskID, Set<TaskID>>()

    for (const task of records) {
      for (const blockedID of task.blocks) {
        const blockers = blockersByTask.get(blockedID)
        if (blockers === undefined) blockersByTask.set(blockedID, new Set([task.id]))
        else blockers.add(task.id)
      }
    }

    const includedIDs = new Set(
      records
        .filter((task) => task.status !== "completed" && task.status !== "deleted")
        .map((task) => task.id),
    )
    for (const taskID of includedIDs) {
      let parentID = byID.get(taskID)?.parentID
      const visited = new Set<TaskID>()
      while (parentID !== undefined && !visited.has(parentID)) {
        visited.add(parentID)
        const parent = byID.get(parentID)
        if (parent === undefined || parent.status === "deleted") break
        includedIDs.add(parent.id)
        parentID = parent.parentID
      }
    }

    return records
      .filter((task) => includedIDs.has(task.id))
      .map((task) => ({
        id: task.id,
        subject: task.subject,
        status: task.status,
        ...(task.parentID === undefined ? {} : { parentID: task.parentID }),
        ...(task.activeForm === undefined ? {} : { activeForm: task.activeForm }),
        ...(task.owner === undefined ? {} : { owner: task.owner }),
        blockedBy: [...new Set([...task.blockedBy, ...(blockersByTask.get(task.id) ?? [])])].filter(
          (id) => {
            const blocker = byID.get(id)
            return blocker === undefined || (blocker.status !== "completed" && blocker.status !== "deleted")
          },
        ),
        ...(typeof task.metadata?.["planPath"] === "string"
          ? { planPath: task.metadata["planPath"] }
          : {}),
      }))
  }

  async update(input: TaskUpdateInput): Promise<TaskRecord> {
    return this.withMutationLock(async () => {
      const records = await this.readAll()
      const current = records.find((task) => task.id === input.id)
      if (current === undefined) throw new TaskNotFoundError(input.id)

      let metadataUpdate: Readonly<Record<string, unknown>> | undefined
      if (input.metadata !== undefined) {
        const metadata: Record<string, unknown> = { ...current.metadata }
        for (const [key, value] of Object.entries(input.metadata)) {
          if (value === null) delete metadata[key]
          else metadata[key] = value
        }
        metadataUpdate = metadata
      }

      const {
        activeForm: currentActiveForm,
        owner: currentOwner,
        parentID: currentParentID,
        ...currentRequiredFields
      } = current

      const updated = taskRecordSchema.parse({
        ...currentRequiredFields,
        ...(input.subject === undefined ? {} : { subject: input.subject }),
        ...(input.description === undefined ? {} : { description: input.description }),
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(input.activeForm === undefined
          ? currentActiveForm === undefined
            ? {}
            : { activeForm: currentActiveForm }
          : input.activeForm === null
            ? {}
            : { activeForm: input.activeForm }),
        ...(input.owner === undefined
          ? currentOwner === undefined
            ? {}
            : { owner: currentOwner }
          : input.owner === null
            ? {}
            : { owner: input.owner }),
        ...(input.parentID === undefined
          ? currentParentID === undefined
            ? {}
            : { parentID: currentParentID }
          : input.parentID === null
            ? {}
            : { parentID: input.parentID }),
        blocks: [...new Set([...(input.setBlocks ?? current.blocks), ...(input.addBlocks ?? [])])],
        blockedBy: [
          ...new Set([...(input.setBlockedBy ?? current.blockedBy), ...(input.addBlockedBy ?? [])]),
        ],
        ...(metadataUpdate === undefined ? {} : { metadata: metadataUpdate }),
      })

      const changed = new Map<TaskID, TaskRecord>([[updated.id, updated]])
      if (input.setBlockedBy !== undefined) {
        const blockerIDs = new Set(updated.blockedBy)
        for (const record of records) {
          if (record.id === updated.id) continue
          const task = changed.get(record.id) ?? record
          const shouldBlock = blockerIDs.has(task.id)
          const blocksTask = task.blocks.includes(updated.id)
          if (shouldBlock === blocksTask) continue
          changed.set(
            task.id,
            taskRecordSchema.parse({
              ...task,
              blocks: shouldBlock
                ? [...new Set([...task.blocks, updated.id])]
                : task.blocks.filter((id) => id !== updated.id),
            }),
          )
        }
      }

      if (input.setBlocks !== undefined) {
        const dependentIDs = new Set(updated.blocks)
        for (const record of records) {
          if (record.id === updated.id) continue
          const task = changed.get(record.id) ?? record
          const shouldBeBlocked = dependentIDs.has(task.id)
          const blockedByTask = task.blockedBy.includes(updated.id)
          if (shouldBeBlocked === blockedByTask) continue
          changed.set(
            task.id,
            taskRecordSchema.parse({
              ...task,
              blockedBy: shouldBeBlocked
                ? [...new Set([...task.blockedBy, updated.id])]
                : task.blockedBy.filter((id) => id !== updated.id),
            }),
          )
        }
      }

      const changedTasks = [...changed.values()].sort((left, right) => left.id.localeCompare(right.id))
      await this.writeTaskBatch(changedTasks)
      return updated
    })
  }

  private async withMutationLock<T>(operation: () => Promise<T>): Promise<T> {
    return withTaskLock(join(this.directory, ".store"), operation)
  }

  private taskPath(id: TaskID): string {
    return join(this.directory, `${id}.json`)
  }

  private async writeTaskBatch(tasks: readonly TaskRecord[]): Promise<void> {
    const transactionID = randomUUID()
    const entries = tasks.map((task) => {
      const path = this.taskPath(task.id)
      return {
        path,
        stagePath: `${path}.stage.${transactionID}`,
        backupPath: `${path}.backup.${transactionID}`,
        task,
      }
    })
    const replaced: typeof entries[number][] = []
    const cleanup = async (preserved = new Set<string>()): Promise<unknown[]> => {
      const cleanupErrors: unknown[] = []
      for (const path of entries.flatMap((entry) => [entry.stagePath, entry.backupPath])) {
        if (preserved.has(path)) continue
        try {
          await this.fileOperations.unlink(path)
        } catch (error) {
          if (!hasErrorCode(error, "ENOENT")) cleanupErrors.push(error)
        }
      }
      return cleanupErrors
    }

    try {
      for (const entry of entries) {
        await this.fileOperations.writeFile(
          entry.stagePath,
          `${JSON.stringify(entry.task, null, 2)}\n`,
          { encoding: "utf8", flag: "wx" },
        )
      }
      for (const entry of entries) {
        await this.fileOperations.copyFile(entry.path, entry.backupPath, constants.COPYFILE_EXCL)
      }
      for (const entry of entries) {
        await this.fileOperations.rename(entry.stagePath, entry.path)
        replaced.push(entry)
      }
    } catch (error) {
      const rollbackErrors: unknown[] = []
      const preserved = new Set<string>()
      for (const entry of [...replaced].reverse()) {
        try {
          await this.fileOperations.rename(entry.backupPath, entry.path)
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError)
          preserved.add(entry.backupPath)
        }
      }
      const cleanupErrors = await cleanup(preserved)
      if (rollbackErrors.length > 0 || cleanupErrors.length > 0) {
        throw new AggregateError(
          [error, ...rollbackErrors, ...cleanupErrors],
          "task update, rollback, or cleanup failed",
        )
      }
      throw error
    }

    const cleanupErrors = await cleanup()
    if (cleanupErrors.length > 0) {
      throw new AggregateError(cleanupErrors, "task update cleanup failed")
    }
  }

  private async readAll(): Promise<readonly TaskRecord[]> {
    let fileNames: readonly string[]
    try {
      const entries = await readdir(this.directory, { withFileTypes: true })
      fileNames = entries
        .filter((entry) => entry.isFile() && entry.name.startsWith("T-") && entry.name.endsWith(".json"))
        .map((entry) => entry.name)
    } catch (error) {
      if (hasErrorCode(error, "ENOENT")) return []
      throw error
    }

    const records = await Promise.all(fileNames.map((fileName) => readTaskFile(join(this.directory, fileName))))
    return records.filter((task): task is TaskRecord => task !== null)
  }
}
