import assert from "node:assert/strict"
import { mkdtemp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"

import {
  createTaskInputSchema,
  taskIdSchema,
  taskRecordSchema,
  taskUpdateInputSchema,
  type TaskRecord,
  type TaskStatus,
} from "./task-schema.ts"
import { TaskStore } from "./task-store.ts"

type TestWorkspace = {
  readonly directory: string
  readonly store: TaskStore
}

type FixtureOptions = {
  readonly id: string
  readonly status?: TaskStatus
  readonly subject?: string
  readonly activeForm?: string
  readonly blocks?: readonly string[]
  readonly blockedBy?: readonly string[]
  readonly owner?: string
  readonly parentID?: string
  readonly metadata?: Readonly<Record<string, unknown>>
}

async function createWorkspace(): Promise<TestWorkspace> {
  const directory = await mkdtemp(join(tmpdir(), "session-progress-"))
  return { directory, store: new TaskStore(directory) }
}

async function removeWorkspace(workspace: TestWorkspace): Promise<void> {
  await rm(workspace.directory, { force: true, recursive: true })
}

function taskFixture(options: FixtureOptions): TaskRecord {
  return taskRecordSchema.parse({
    id: options.id,
    subject: options.subject ?? options.id,
    description: "fixture",
    status: options.status ?? "pending",
    ...(options.activeForm === undefined ? {} : { activeForm: options.activeForm }),
    blocks: options.blocks ?? [],
    blockedBy: options.blockedBy ?? [],
    ...(options.owner === undefined ? {} : { owner: options.owner }),
    ...(options.parentID === undefined ? {} : { parentID: options.parentID }),
    ...(options.metadata === undefined ? {} : { metadata: options.metadata }),
    threadID: "ses-fixture",
  })
}

async function writeTask(directory: string, task: TaskRecord): Promise<void> {
  await writeFile(join(directory, `${task.id}.json`), JSON.stringify(task, null, 2), "utf8")
}

test("creates an OMO-compatible record when given only a subject", async () => {
  const workspace = await createWorkspace()
  try {
    const input = createTaskInputSchema.parse({ subject: "Create backend" })

    const created = await workspace.store.create(input, "ses-create")

    assert.match(created.id, /^T-[0-9a-f-]{36}$/)
    assert.equal(created.subject, "Create backend")
    assert.equal(created.description, "")
    assert.equal(created.status, "pending")
    assert.deepEqual(created.blocks, [])
    assert.deepEqual(created.blockedBy, [])
    assert.equal(created.threadID, "ses-create")
    const persisted: unknown = JSON.parse(
      await readFile(join(workspace.directory, `${created.id}.json`), "utf8"),
    )
    assert.deepEqual(taskRecordSchema.parse(persisted), created)
  } finally {
    await removeWorkspace(workspace)
  }
})

test("parses an existing full OMO JSON record", async () => {
  const workspace = await createWorkspace()
  try {
    const existing = taskRecordSchema.parse({
      id: "T-existing",
      subject: "Existing task",
      description: "Already on disk",
      status: "in_progress",
      activeForm: "Reading existing task",
      blocks: ["T-dependent"],
      blockedBy: ["T-blocker"],
      owner: "worker",
      metadata: { nested: { compatible: true }, priority: "high" },
      repoURL: "https://example.invalid/repository",
      parentID: "T-parent",
      threadID: "ses-existing",
    })
    await writeTask(workspace.directory, existing)

    const loaded = await workspace.store.get(existing.id)

    assert.deepEqual(loaded, existing)
  } finally {
    await removeWorkspace(workspace)
  }
})

test("returns null when a task record is missing", async () => {
  const workspace = await createWorkspace()
  try {
    const missingID = taskIdSchema.parse("T-missing")

    const loaded = await workspace.store.get(missingID)

    assert.equal(loaded, null)
  } finally {
    await removeWorkspace(workspace)
  }
})

test("lists only pending and in-progress records", async () => {
  const workspace = await createWorkspace()
  try {
    await Promise.all([
      writeTask(workspace.directory, taskFixture({ id: "T-pending" })),
      writeTask(workspace.directory, taskFixture({ id: "T-active", status: "in_progress" })),
      writeTask(workspace.directory, taskFixture({ id: "T-complete", status: "completed" })),
      writeTask(workspace.directory, taskFixture({ id: "T-deleted", status: "deleted" })),
    ])

    const listed = await workspace.store.list()

    assert.deepEqual(
      listed.map((task) => task.id).sort(),
      ["T-active", "T-pending"],
    )
  } finally {
    await removeWorkspace(workspace)
  }
})

test("keeps only missing or incomplete blockers in active summaries", async () => {
  const workspace = await createWorkspace()
  try {
    await Promise.all([
      writeTask(
        workspace.directory,
        taskFixture({
          id: "T-work",
          blockedBy: ["T-complete", "T-open", "T-missing", "T-open"],
        }),
      ),
      writeTask(workspace.directory, taskFixture({ id: "T-complete", status: "completed" })),
      writeTask(workspace.directory, taskFixture({ id: "T-open" })),
    ])

    const listed = await workspace.store.list()
    const work = listed.find((task) => task.id === "T-work")

    assert.deepEqual(work?.blockedBy, ["T-open", "T-missing"])
  } finally {
    await removeWorkspace(workspace)
  }
})

test("includes inverse blocks edges until the blocker completes", async () => {
  const workspace = await createWorkspace()
  try {
    const blocker = taskFixture({
      id: "T-blocker",
      blocks: ["T-work"],
    })
    const work = taskFixture({
      id: "T-work",
    })

    await Promise.all([writeTask(workspace.directory, blocker), writeTask(workspace.directory, work)])

    const listed = await workspace.store.list()
    const blockedWork = listed.find((task) => task.id === "T-work")

    assert.deepEqual(blockedWork?.blockedBy, ["T-blocker"])

    await workspace.store.update(
      taskUpdateInputSchema.parse({
        id: blocker.id,
        status: "completed",
      }),
    )

    const afterCompletion = await workspace.store.list()
    const unblockedWork = afterCompletion.find((task) => task.id === "T-work")

    assert.deepEqual(unblockedWork?.blockedBy, [])
  } finally {
    await removeWorkspace(workspace)
  }
})

test("lists active work with completed ancestors and compact hierarchy fields", async () => {
  const workspace = await createWorkspace()
  try {
    await Promise.all([
      writeTask(
        workspace.directory,
        taskFixture({
          id: "T-feature",
          status: "completed",
          subject: "Feature",
          metadata: { planPath: "docs/plans/feature.md", privateDetail: "omit" },
        }),
      ),
      writeTask(
        workspace.directory,
        taskFixture({
          id: "T-milestone",
          status: "completed",
          subject: "Implementation",
          parentID: "T-feature",
        }),
      ),
      writeTask(
        workspace.directory,
        taskFixture({
          id: "T-active-child",
          status: "in_progress",
          subject: "Active child",
          activeForm: "Implementing child",
          owner: "worker-a",
          parentID: "T-milestone",
          metadata: { planPath: 42, privateDetail: "omit" },
        }),
      ),
      writeTask(
        workspace.directory,
        taskFixture({
          id: "T-blocked-sibling",
          subject: "Blocked sibling",
          blockedBy: ["T-active-child", "T-completed-blocker"],
          parentID: "T-milestone",
        }),
      ),
      writeTask(
        workspace.directory,
        taskFixture({ id: "T-completed-blocker", status: "completed" }),
      ),
      writeTask(
        workspace.directory,
        taskFixture({ id: "T-unrelated-history", status: "completed" }),
      ),
    ])

    const listed = await workspace.store.list()
    const byID = new Map(listed.map((task) => [task.id, task]))

    assert.deepEqual(
      listed.map((task) => task.id).sort(),
      ["T-active-child", "T-blocked-sibling", "T-feature", "T-milestone"],
    )
    assert.deepEqual(byID.get(taskIdSchema.parse("T-feature")), {
      id: "T-feature",
      subject: "Feature",
      status: "completed",
      blockedBy: [],
      planPath: "docs/plans/feature.md",
    })
    assert.deepEqual(byID.get(taskIdSchema.parse("T-active-child")), {
      id: "T-active-child",
      subject: "Active child",
      status: "in_progress",
      parentID: "T-milestone",
      activeForm: "Implementing child",
      owner: "worker-a",
      blockedBy: [],
    })
    assert.deepEqual(byID.get(taskIdSchema.parse("T-blocked-sibling"))?.blockedBy, [
      "T-active-child",
    ])
  } finally {
    await removeWorkspace(workspace)
  }
})

test("appends and deduplicates dependencies during update", async () => {
  const workspace = await createWorkspace()
  try {
    const existing = taskFixture({
      id: "T-update-dependencies",
      blocks: ["T-old-dependent"],
      blockedBy: ["T-old-blocker"],
    })
    await writeTask(workspace.directory, existing)
    const update = taskUpdateInputSchema.parse({
      id: existing.id,
      addBlocks: ["T-old-dependent", "T-new-dependent", "T-new-dependent"],
      addBlockedBy: ["T-old-blocker", "T-new-blocker", "T-new-blocker"],
    })

    const updated = await workspace.store.update(update)

    assert.deepEqual(updated.blocks, ["T-old-dependent", "T-new-dependent"])
    assert.deepEqual(updated.blockedBy, ["T-old-blocker", "T-new-blocker"])
  } finally {
    await removeWorkspace(workspace)
  }
})

test("reparents a task and removes its parent when detached", async () => {
  const workspace = await createWorkspace()
  try {
    const existing = taskFixture({ id: "T-reparent", parentID: "T-old-parent" })
    await writeTask(workspace.directory, existing)

    const reparented = await workspace.store.update(
      taskUpdateInputSchema.parse({ id: existing.id, parentID: "T-new-parent" }),
    )
    assert.equal(reparented.parentID, "T-new-parent")

    const detached = await workspace.store.update(
      taskUpdateInputSchema.parse({ id: existing.id, parentID: null }),
    )
    assert.equal("parentID" in detached, false)
  } finally {
    await removeWorkspace(workspace)
  }
})

test("clears owner and active form without persisting null fields", async () => {
  const workspace = await createWorkspace()
  try {
    const existing = taskFixture({
      id: "T-clear-optionals",
      activeForm: "Working",
      owner: "worker",
    })
    await writeTask(workspace.directory, existing)

    const updated = await workspace.store.update(
      taskUpdateInputSchema.parse({ id: existing.id, activeForm: null, owner: null }),
    )
    const persisted = JSON.parse(
      await readFile(join(workspace.directory, `${existing.id}.json`), "utf8"),
    ) as Record<string, unknown>

    assert.equal("activeForm" in updated, false)
    assert.equal("owner" in updated, false)
    assert.equal("activeForm" in persisted, false)
    assert.equal("owner" in persisted, false)
  } finally {
    await removeWorkspace(workspace)
  }
})

test("replaces dependency arrays before applying deduplicated additions", async () => {
  const workspace = await createWorkspace()
  try {
    const existing = taskFixture({
      id: "T-replace-dependencies",
      blocks: ["T-obsolete-dependent"],
      blockedBy: ["T-obsolete-blocker"],
    })
    await writeTask(workspace.directory, existing)

    const updated = await workspace.store.update(
      taskUpdateInputSchema.parse({
        id: existing.id,
        setBlocks: ["T-kept-dependent", "T-kept-dependent"],
        addBlocks: ["T-kept-dependent", "T-new-dependent"],
        setBlockedBy: [],
        addBlockedBy: ["T-new-blocker", "T-new-blocker"],
      }),
    )

    assert.deepEqual(updated.blocks, ["T-kept-dependent", "T-new-dependent"])
    assert.deepEqual(updated.blockedBy, ["T-new-blocker"])
  } finally {
    await removeWorkspace(workspace)
  }
})

test("setBlockedBy reconciles existing blockers and preserves missing direct blockers", async () => {
  const workspace = await createWorkspace()
  try {
    const work = taskFixture({
      id: "T-reconcile-blockers",
      blockedBy: ["T-old-blocker"],
    })
    await Promise.all([
      writeTask(workspace.directory, work),
      writeTask(
        workspace.directory,
        taskFixture({ id: "T-old-blocker", blocks: [work.id] }),
      ),
      writeTask(
        workspace.directory,
        taskFixture({ id: "T-inverse-only-blocker", blocks: [work.id] }),
      ),
      writeTask(workspace.directory, taskFixture({ id: "T-new-blocker" })),
      writeTask(workspace.directory, taskFixture({ id: "T-added-blocker" })),
    ])

    const updated = await workspace.store.update(
      taskUpdateInputSchema.parse({
        id: work.id,
        setBlockedBy: ["T-new-blocker", "T-new-blocker"],
        addBlockedBy: ["T-added-blocker", "T-missing-blocker", "T-new-blocker"],
      }),
    )

    assert.deepEqual(updated.blockedBy, [
      "T-new-blocker",
      "T-added-blocker",
      "T-missing-blocker",
    ])
    assert.deepEqual((await workspace.store.get(taskIdSchema.parse("T-old-blocker")))?.blocks, [])
    assert.deepEqual(
      (await workspace.store.get(taskIdSchema.parse("T-inverse-only-blocker")))?.blocks,
      [],
    )
    assert.deepEqual((await workspace.store.get(taskIdSchema.parse("T-new-blocker")))?.blocks, [
      work.id,
    ])
    assert.deepEqual((await workspace.store.get(taskIdSchema.parse("T-added-blocker")))?.blocks, [
      work.id,
    ])
    assert.equal(await workspace.store.get(taskIdSchema.parse("T-missing-blocker")), null)
  } finally {
    await removeWorkspace(workspace)
  }
})

test("setBlocks reconciles existing dependents and preserves missing direct dependents", async () => {
  const workspace = await createWorkspace()
  try {
    const blocker = taskFixture({
      id: "T-reconcile-dependents",
      blocks: ["T-old-dependent"],
    })
    await Promise.all([
      writeTask(workspace.directory, blocker),
      writeTask(
        workspace.directory,
        taskFixture({ id: "T-old-dependent", blockedBy: [blocker.id] }),
      ),
      writeTask(
        workspace.directory,
        taskFixture({ id: "T-inverse-only-dependent", blockedBy: [blocker.id] }),
      ),
      writeTask(workspace.directory, taskFixture({ id: "T-new-dependent" })),
      writeTask(workspace.directory, taskFixture({ id: "T-added-dependent" })),
    ])

    const updated = await workspace.store.update(
      taskUpdateInputSchema.parse({
        id: blocker.id,
        setBlocks: ["T-new-dependent", "T-new-dependent"],
        addBlocks: ["T-added-dependent", "T-missing-dependent", "T-new-dependent"],
      }),
    )

    assert.deepEqual(updated.blocks, [
      "T-new-dependent",
      "T-added-dependent",
      "T-missing-dependent",
    ])
    assert.deepEqual(
      (await workspace.store.get(taskIdSchema.parse("T-old-dependent")))?.blockedBy,
      [],
    )
    assert.deepEqual(
      (await workspace.store.get(taskIdSchema.parse("T-inverse-only-dependent")))?.blockedBy,
      [],
    )
    assert.deepEqual(
      (await workspace.store.get(taskIdSchema.parse("T-new-dependent")))?.blockedBy,
      [blocker.id],
    )
    assert.deepEqual(
      (await workspace.store.get(taskIdSchema.parse("T-added-dependent")))?.blockedBy,
      [blocker.id],
    )
    assert.equal(await workspace.store.get(taskIdSchema.parse("T-missing-dependent")), null)
  } finally {
    await removeWorkspace(workspace)
  }
})

test("restores every relationship record when a replacement fails", async () => {
  const workspace = await createWorkspace()
  const sentinel = new Error("injected replacement failure")
  const oldBlocker = taskFixture({ id: "T-a-old-blocker", blocks: ["T-m-work"] })
  const work = taskFixture({ id: "T-m-work", blockedBy: [oldBlocker.id] })
  const newBlocker = taskFixture({ id: "T-z-new-blocker" })
  try {
    await Promise.all([
      writeTask(workspace.directory, oldBlocker),
      writeTask(workspace.directory, work),
      writeTask(workspace.directory, newBlocker),
    ])
    const store = new TaskStore(workspace.directory, {
      rename: async (from, to) => {
        if (String(from).includes(".stage.") && String(to).endsWith(`${newBlocker.id}.json`)) {
          throw sentinel
        }
        await rename(from, to)
      },
    })

    await assert.rejects(
      store.update(
        taskUpdateInputSchema.parse({ id: work.id, setBlockedBy: [newBlocker.id] }),
      ),
      (error: unknown) => error === sentinel,
    )
    assert.deepEqual(await store.get(oldBlocker.id), oldBlocker)
    assert.deepEqual(await store.get(work.id), work)
    assert.deepEqual(await store.get(newBlocker.id), newBlocker)
    assert.deepEqual(
      (await readdir(workspace.directory)).sort(),
      [`${oldBlocker.id}.json`, `${work.id}.json`, `${newBlocker.id}.json`].sort(),
    )
  } finally {
    await removeWorkspace(workspace)
  }
})

test("preserves recovery files and reports rollback cleanup failures", async () => {
  const workspace = await createWorkspace()
  const primaryError = new Error("injected replacement failure")
  const rollbackError = new Error("injected rollback failure")
  const cleanupError = new Error("injected cleanup failure")
  const oldBlocker = taskFixture({ id: "T-a-old-blocker", blocks: ["T-m-work"] })
  const work = taskFixture({ id: "T-m-work", blockedBy: [oldBlocker.id] })
  const newBlocker = taskFixture({ id: "T-z-new-blocker" })
  try {
    await Promise.all([
      writeTask(workspace.directory, oldBlocker),
      writeTask(workspace.directory, work),
      writeTask(workspace.directory, newBlocker),
    ])
    const store = new TaskStore(workspace.directory, {
      rename: async (from, to) => {
        const source = String(from)
        const target = String(to)
        if (source.includes(".stage.") && target.endsWith(`${newBlocker.id}.json`)) {
          throw primaryError
        }
        if (source.includes(`${oldBlocker.id}.json.backup.`)) throw rollbackError
        await rename(from, to)
      },
      unlink: async (path) => {
        if (String(path).includes(`${newBlocker.id}.json.stage.`)) throw cleanupError
        await rm(path)
      },
    })

    const error = await store
      .update(taskUpdateInputSchema.parse({ id: work.id, setBlockedBy: [newBlocker.id] }))
      .then(
        () => null,
        (reason: unknown) => reason,
      )

    assert.ok(error instanceof AggregateError)
    assert.deepEqual(error.errors, [primaryError, rollbackError, cleanupError])
    const files = await readdir(workspace.directory)
    const backupName = files.find((file) => file.startsWith(`${oldBlocker.id}.json.backup.`))
    assert.ok(backupName)
    const backup = taskRecordSchema.parse(
      JSON.parse(await readFile(join(workspace.directory, backupName), "utf8")),
    )
    assert.deepEqual(backup, oldBlocker)
  } finally {
    await removeWorkspace(workspace)
  }
})

test("append-only dependency updates preserve one-sided legacy edges", async () => {
  const workspace = await createWorkspace()
  try {
    const work = taskFixture({ id: "T-append-one-sided" })
    const blocker = taskFixture({ id: "T-existing-one-sided-blocker" })
    await Promise.all([
      writeTask(workspace.directory, work),
      writeTask(workspace.directory, blocker),
    ])

    await workspace.store.update(
      taskUpdateInputSchema.parse({ id: work.id, addBlockedBy: [blocker.id] }),
    )

    assert.deepEqual((await workspace.store.get(work.id))?.blockedBy, [blocker.id])
    assert.deepEqual((await workspace.store.get(blocker.id))?.blocks, [])
  } finally {
    await removeWorkspace(workspace)
  }
})

test("shallow-merges metadata and deletes keys updated to null", async () => {
  const workspace = await createWorkspace()
  try {
    const existing = taskFixture({
      id: "T-update-metadata",
      metadata: { keep: "original", nested: { value: 1 }, remove: true },
    })
    await writeTask(workspace.directory, existing)
    const update = taskUpdateInputSchema.parse({
      id: existing.id,
      metadata: { added: 2, keep: "changed", remove: null },
    })

    const updated = await workspace.store.update(update)

    assert.deepEqual(updated.metadata, {
      added: 2,
      keep: "changed",
      nested: { value: 1 },
    })
  } finally {
    await removeWorkspace(workspace)
  }
})

test("persists mutable task fields after update", async () => {
  const workspace = await createWorkspace()
  try {
    const existing = taskFixture({ id: "T-persist-update" })
    await writeTask(workspace.directory, existing)
    const update = taskUpdateInputSchema.parse({
      id: existing.id,
      subject: "Updated subject",
      description: "Updated description",
      status: "in_progress",
      activeForm: "Updating persistence",
      owner: "new-owner",
    })

    await workspace.store.update(update)

    const persisted: unknown = JSON.parse(
      await readFile(join(workspace.directory, `${existing.id}.json`), "utf8"),
    )
    const task = taskRecordSchema.parse(persisted)
    assert.equal(task.subject, "Updated subject")
    assert.equal(task.description, "Updated description")
    assert.equal(task.status, "in_progress")
    assert.equal(task.activeForm, "Updating persistence")
    assert.equal(task.owner, "new-owner")
  } finally {
    await removeWorkspace(workspace)
  }
})
