import assert from "node:assert/strict"
import { test } from "node:test"

import { buildTaskGraph, collapsedTaskLabel, sidebarHeading, sidebarRows, taskLine } from "./tui.tsx"

test("canonicalizes a one-sided legacy blocks edge", () => {
  // Given
  const blocker = {
    id: "T-blocker",
    subject: "Blocker",
    status: "pending" as const,
    blocks: ["T-dependent"],
    blockedBy: [],
    createdAt: 1,
    updatedAt: 1,
  }
  const dependent = {
    id: "T-dependent",
    subject: "Dependent",
    status: "pending" as const,
    blocks: [],
    blockedBy: [],
    createdAt: 2,
    updatedAt: 2,
  }

  // When
  const graph = buildTaskGraph([blocker, dependent])

  // Then
  assert.deepEqual(graph.blockers.get(dependent.id), [blocker.id])
  assert.deepEqual(graph.unresolvedBlockers.get(dependent.id), [blocker.id])
  assert.deepEqual(graph.dependents.get(blocker.id), [dependent.id])
  assert.deepEqual(dependent.blockedBy, [])
})

test("keeps a missing direct blocker unresolved", () => {
  // Given
  const task = {
    id: "T-dependent",
    subject: "Dependent",
    status: "pending" as const,
    blocks: [],
    blockedBy: ["T-missing"],
    createdAt: 1,
    updatedAt: 1,
  }

  // When
  const graph = buildTaskGraph([task])

  // Then
  assert.deepEqual(graph.unresolvedBlockers.get(task.id), ["T-missing"])
  assert.deepEqual(graph.dependents.get("T-missing"), [task.id])
})

test("keeps deleted blockers as hidden resolved references while missing blockers remain unresolved", () => {
  // Given
  const deletedBlocker = {
    id: "T-deleted",
    subject: "Deleted blocker",
    status: "deleted" as const,
    createdAt: 1,
    updatedAt: 1,
  }
  const dependent = {
    id: "T-dependent",
    subject: "Dependent",
    status: "pending" as const,
    blockedBy: [deletedBlocker.id, "T-missing"],
    createdAt: 2,
    updatedAt: 2,
  }

  // When
  const graph = buildTaskGraph([deletedBlocker, dependent])

  // Then
  assert.deepEqual(graph.unresolvedBlockers.get(dependent.id), ["T-missing"])
  assert.equal(graph.references.has(deletedBlocker.id), true)
  assert.equal(graph.byID.has(deletedBlocker.id), false)
  assert.deepEqual(graph.roots.map((task) => task.id), [dependent.id])
  assert.deepEqual(graph.rows.map((row) => row.task.id), [dependent.id])
})

test("shows all milestones and recursively expanded focused branches without a row cap", () => {
  // Given
  const tasks = [
    { id: "root", subject: "Feature", status: "in_progress" as const, createdAt: 1, updatedAt: 1 },
    { id: "discovery", subject: "Discovery", status: "completed" as const, parentID: "root", createdAt: 2, updatedAt: 2 },
    { id: "discovery-notes", subject: "Research notes", status: "completed" as const, parentID: "discovery", createdAt: 3, updatedAt: 3 },
    { id: "discovery-review", subject: "Review findings", status: "completed" as const, parentID: "discovery", createdAt: 4, updatedAt: 4 },
    { id: "implementation", subject: "Implementation", status: "pending" as const, parentID: "root", createdAt: 5, updatedAt: 5 },
    { id: "implementation-done", subject: "Completed setup", status: "completed" as const, parentID: "implementation", createdAt: 6, updatedAt: 6 },
    { id: "active-branch", subject: "Active branch", status: "pending" as const, parentID: "implementation", createdAt: 7, updatedAt: 7 },
    { id: "nested-done", subject: "Nested completed work", status: "completed" as const, parentID: "active-branch", createdAt: 8, updatedAt: 8 },
    { id: "nested-active", subject: "Nested active work", status: "in_progress" as const, parentID: "active-branch", createdAt: 9, updatedAt: 9 },
    { id: "nested-ready", subject: "Nested ready work", status: "pending" as const, parentID: "active-branch", createdAt: 10, updatedAt: 10 },
    { id: "blocked-sibling", subject: "Blocked sibling", status: "pending" as const, parentID: "implementation", blockedBy: ["missing-blocker"], createdAt: 11, updatedAt: 11 },
    { id: "ready-sibling", subject: "Ready sibling", status: "pending" as const, parentID: "implementation", createdAt: 12, updatedAt: 12 },
    { id: "later-sibling", subject: "Later sibling", status: "pending" as const, parentID: "implementation", createdAt: 13, updatedAt: 13 },
    { id: "verification", subject: "Verification", status: "pending" as const, parentID: "root", createdAt: 14, updatedAt: 14 },
    { id: "verification-tests", subject: "Run tests", status: "pending" as const, parentID: "verification", createdAt: 15, updatedAt: 15 },
    { id: "verification-smoke", subject: "Smoke test", status: "pending" as const, parentID: "verification", createdAt: 16, updatedAt: 16 },
  ]
  const graph = buildTaskGraph(tasks)

  // When
  const rows = sidebarRows({
    rootSessionID: "session",
    tasks,
    graph,
    completed: 4,
    total: tasks.length,
    percent: 25,
    active: tasks.filter((task) => task.status === "in_progress"),
    blocked: tasks.filter((task) => graph.unresolvedBlockers.has(task.id)),
    activity: undefined,
  })

  // Then
  assert.deepEqual(
    rows.map((row) => row.task.id),
    [
      "root",
      "discovery",
      "implementation",
      "implementation-done",
      "active-branch",
      "nested-done",
      "nested-active",
      "nested-ready",
      "blocked-sibling",
      "ready-sibling",
      "later-sibling",
      "verification",
    ],
  )
})

test("renders a compact owner cue in task rows", () => {
  // Given
  const task = {
    id: "owned",
    subject: "Ship sidebar",
    status: "pending" as const,
    owner: "mika",
    metadata: { priority: "high" },
    createdAt: 1,
    updatedAt: 1,
  }
  const graph = buildTaskGraph([task])

  // When / Then
  assert.equal(taskLine({ task, depth: 0 }, graph), "[ ] [H] Ship sidebar @mika")
})

test("expands multiple active and nested blocked branches across cycle-safe roots", () => {
  // Given
  const tasks: Parameters<typeof buildTaskGraph>[0] = [
    { id: "root-a", subject: "Feature A", status: "pending", createdAt: 1, updatedAt: 1 },
    { id: "milestone-a", subject: "Milestone A", status: "pending", parentID: "root-a", createdAt: 2, updatedAt: 2 },
    { id: "branch-a", subject: "Branch A", status: "pending", parentID: "milestone-a", createdAt: 3, updatedAt: 3 },
    { id: "active-a", subject: "Active A", status: "in_progress", parentID: "branch-a", createdAt: 4, updatedAt: 4 },
    { id: "context-a", subject: "Context A", status: "completed", parentID: "branch-a", createdAt: 5, updatedAt: 5 },
    { id: "milestone-b", subject: "Milestone B", status: "pending", parentID: "root-a", createdAt: 6, updatedAt: 6 },
    { id: "active-b", subject: "Active B", status: "in_progress", parentID: "milestone-b", createdAt: 7, updatedAt: 7 },
    { id: "root-b", subject: "Feature B", status: "pending", createdAt: 8, updatedAt: 8 },
    { id: "blocked-milestone", subject: "Blocked milestone", status: "pending", parentID: "root-b", createdAt: 9, updatedAt: 9 },
    { id: "blocked-branch", subject: "Blocked branch", status: "pending", parentID: "blocked-milestone", createdAt: 10, updatedAt: 10 },
    { id: "blocked-leaf", subject: "Blocked leaf", status: "pending", parentID: "blocked-branch", blockedBy: ["missing"], createdAt: 11, updatedAt: 11 },
    { id: "blocked-context", subject: "Blocked context", status: "completed", parentID: "blocked-branch", createdAt: 12, updatedAt: 12 },
    { id: "inactive-milestone", subject: "Inactive milestone", status: "pending", parentID: "root-b", createdAt: 13, updatedAt: 13 },
    { id: "hidden", subject: "Hidden descendant", status: "pending", parentID: "inactive-milestone", createdAt: 14, updatedAt: 14 },
    { id: "cycle-a", subject: "Cycle A", status: "pending", parentID: "cycle-b", createdAt: 15, updatedAt: 15 },
    { id: "cycle-b", subject: "Cycle B", status: "pending", parentID: "cycle-a", createdAt: 16, updatedAt: 16 },
  ]
  const graph = buildTaskGraph(tasks)

  // When
  const rows = sidebarRows({
    rootSessionID: "session",
    tasks,
    graph,
    completed: 2,
    total: tasks.length,
    percent: 13,
    active: tasks.filter((task) => task.status === "in_progress"),
    blocked: tasks.filter((task) => graph.unresolvedBlockers.has(task.id)),
    activity: undefined,
  })

  // Then
  assert.deepEqual(
    rows.map((row) => row.task.id),
    [
      "root-a",
      "milestone-a",
      "branch-a",
      "active-a",
      "context-a",
      "milestone-b",
      "active-b",
      "root-b",
      "blocked-milestone",
      "blocked-branch",
      "blocked-leaf",
      "blocked-context",
      "inactive-milestone",
      "cycle-a",
      "cycle-b",
    ],
  )
  assert.equal(graph.anomalies.get("cycle-a"), "Parent relationship forms a cycle and is shown at the root.")
  assert.equal(graph.anomalies.get("cycle-b"), "Parent relationship forms a cycle and is shown at the root.")
})

test("labels intentionally hidden descendants as collapsed", () => {
  assert.equal(collapsedTaskLabel(7, 5), "... 2 collapsed")
})

test("uses the root subject only when there is exactly one root", () => {
  // Given
  const singleRoot = buildTaskGraph([
    { id: "feature", subject: "Feature heading", status: "pending", createdAt: 1, updatedAt: 1 },
  ])
  const multipleRoots = buildTaskGraph([
    { id: "feature-a", subject: "Feature A", status: "pending", createdAt: 1, updatedAt: 1 },
    { id: "feature-b", subject: "Feature B", status: "pending", createdAt: 2, updatedAt: 2 },
  ])

  // When / Then
  assert.equal(sidebarHeading(singleRoot), "Feature heading")
  assert.equal(sidebarHeading(multipleRoots), "Tasks")
})
