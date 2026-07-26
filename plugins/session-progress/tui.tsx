/** @jsxImportSource @opentui/solid */
import { readdir, readFile, stat } from "node:fs/promises"
import { join } from "node:path"

import type {
  TuiDialogSelectOption,
  TuiPluginApi,
  TuiPluginModule,
  TuiSlotPlugin,
} from "@opencode-ai/plugin/tui"

import { resolveTaskDirectory } from "./task-path.ts"

type TaskStatus = "pending" | "in_progress" | "completed" | "deleted"

type StoredTask = {
  id: string
  subject: string
  description?: string
  status: TaskStatus
  activeForm?: string
  blocks?: string[]
  blockedBy?: string[]
  owner?: string
  metadata?: Record<string, unknown>
  repoURL?: string
  parentID?: string
  threadID?: string
}

type ProgressTask = StoredTask & {
  createdAt: number
  updatedAt: number
}

type TaskStats = {
  total: number
  completed: number
  active: number
  blocked: number
}

type TaskRow = {
  task: ProgressTask
  depth: number
}

type TaskGraph = {
  byID: Map<string, ProgressTask>
  references: Map<string, ProgressTask>
  children: Map<string, ProgressTask[]>
  roots: ProgressTask[]
  rows: TaskRow[]
  blockers: Map<string, string[]>
  unresolvedBlockers: Map<string, string[]>
  dependents: Map<string, string[]>
  anomalies: Map<string, string>
  stats: Map<string, TaskStats>
}

type ProgressView = {
  rootSessionID: string
  tasks: ProgressTask[]
  graph: TaskGraph
  completed: number
  total: number
  percent: number
  active: ProgressTask[]
  blocked: ProgressTask[]
  activity: string | undefined
}

const POLL_INTERVAL_MS = 1000

function emptyGraph(): TaskGraph {
  return {
    byID: new Map(),
    references: new Map(),
    children: new Map(),
    roots: [],
    rows: [],
    blockers: new Map(),
    unresolvedBlockers: new Map(),
    dependents: new Map(),
    anomalies: new Map(),
    stats: new Map(),
  }
}

const EMPTY_VIEW: ProgressView = {
  rootSessionID: "",
  tasks: [],
  graph: emptyGraph(),
  completed: 0,
  total: 0,
  percent: 0,
  active: [],
  blocked: [],
  activity: undefined,
}

function rootSessionID(api: TuiPluginApi, sessionID: string): string {
  let current = api.state.session.get(sessionID)
  const visited = new Set<string>()
  while (current?.parentID && !visited.has(current.id)) {
    visited.add(current.id)
    current = api.state.session.get(current.parentID)
  }
  return current?.id ?? sessionID
}

export function belongsToSessionTree(api: TuiPluginApi, threadID: string | undefined, rootID: string): boolean {
  if (!threadID) return false
  if (threadID === rootID) return true
  return Boolean(api.state.session.get(threadID)) && rootSessionID(api, threadID) === rootID
}

async function readTaskFile(path: string): Promise<ProgressTask | undefined> {
  try {
    const [raw, info] = await Promise.all([readFile(path, "utf8"), stat(path)])
    const task = JSON.parse(raw) as StoredTask
    if (!task.id || !task.subject || !task.status) return undefined
    if (!(["pending", "in_progress", "completed", "deleted"] as string[]).includes(task.status)) return undefined
    return {
      ...task,
      blocks: task.blocks ?? [],
      blockedBy: task.blockedBy ?? [],
      createdAt: info.birthtimeMs || info.ctimeMs,
      updatedAt: info.mtimeMs,
    }
  } catch {
    return undefined
  }
}

function sortTasks(tasks: ProgressTask[]): ProgressTask[] {
  return tasks.sort((left, right) => left.createdAt - right.createdAt || left.id.localeCompare(right.id))
}

function isVisibleTask(task: ProgressTask): boolean {
  return task.status !== "deleted"
}

function parentCreatesCycle(task: ProgressTask, byID: Map<string, ProgressTask>): boolean {
  let current = task.parentID ? byID.get(task.parentID) : undefined
  const visited = new Set<string>([task.id])
  while (current) {
    if (visited.has(current.id)) return true
    visited.add(current.id)
    current = current.parentID ? byID.get(current.parentID) : undefined
  }
  return false
}

export function buildTaskGraph(tasks: ProgressTask[], referenceTasks = tasks): TaskGraph {
  const visibleTasks = tasks.filter(isVisibleTask)
  const byID = new Map(visibleTasks.map((task) => [task.id, task]))
  const references = new Map(referenceTasks.map((task) => [task.id, task]))
  const children = new Map<string, ProgressTask[]>()
  const anomalies = new Map<string, string>()
  const childIDs = new Set<string>()

  for (const task of visibleTasks) {
    if (!task.parentID) continue
    if (!byID.has(task.parentID)) {
      anomalies.set(task.id, `Parent ${task.parentID} is not available in this session tree.`)
      continue
    }
    if (parentCreatesCycle(task, byID)) {
      anomalies.set(task.id, "Parent relationship forms a cycle and is shown at the root.")
      continue
    }
    const siblings = children.get(task.parentID) ?? []
    siblings.push(task)
    children.set(task.parentID, siblings)
    childIDs.add(task.id)
  }
  for (const siblings of children.values()) sortTasks(siblings)

  const roots = sortTasks(visibleTasks.filter((task) => !childIDs.has(task.id)))
  const resolvedIDs = new Set(
    referenceTasks.filter((task) => task.status === "completed" || task.status === "deleted").map((task) => task.id),
  )
  const blockers = new Map<string, string[]>()
  const unresolvedBlockers = new Map<string, string[]>()
  const dependents = new Map<string, string[]>()

  for (const task of referenceTasks) {
    blockers.set(task.id, [...new Set(task.blockedBy ?? [])])
  }
  for (const blocker of referenceTasks) {
    for (const dependentID of blocker.blocks ?? []) {
      const values = blockers.get(dependentID) ?? []
      if (!values.includes(blocker.id)) values.push(blocker.id)
      blockers.set(dependentID, values)
    }
  }
  for (const [dependentID, blockerIDs] of blockers) {
    for (const blockerID of blockerIDs) {
      const values = dependents.get(blockerID) ?? []
      if (!values.includes(dependentID)) values.push(dependentID)
      dependents.set(blockerID, values)
    }
  }
  for (const task of referenceTasks) {
    const unresolved = (blockers.get(task.id) ?? []).filter((id) => !resolvedIDs.has(id))
    if (unresolved.length > 0 && task.status !== "completed" && isVisibleTask(task)) {
      unresolvedBlockers.set(task.id, unresolved)
    }
  }

  const rows: TaskRow[] = []
  const visit = (task: ProgressTask, depth: number): void => {
    rows.push({ task, depth })
    for (const child of children.get(task.id) ?? []) visit(child, depth + 1)
  }
  for (const root of roots) visit(root, 0)

  const stats = new Map<string, TaskStats>()
  const calculate = (task: ProgressTask): TaskStats => {
    const existing = stats.get(task.id)
    if (existing) return existing
    const result: TaskStats = {
      total: 1,
      completed: task.status === "completed" ? 1 : 0,
      active: task.status === "in_progress" ? 1 : 0,
      blocked: unresolvedBlockers.has(task.id) ? 1 : 0,
    }
    for (const child of children.get(task.id) ?? []) {
      const childStats = calculate(child)
      result.total += childStats.total
      result.completed += childStats.completed
      result.active += childStats.active
      result.blocked += childStats.blocked
    }
    stats.set(task.id, result)
    return result
  }
  for (const root of roots) calculate(root)

  return { byID, references, children, roots, rows, blockers, unresolvedBlockers, dependents, anomalies, stats }
}

async function loadProgress(api: TuiPluginApi, sessionID: string): Promise<ProgressView> {
  const rootID = rootSessionID(api, sessionID)
  const taskByID = new Map<string, ProgressTask>()
  const referenceByID = new Map<string, ProgressTask>()

  const directory = resolveTaskDirectory({
    directory: api.state.path.directory,
    worktree: api.state.path.worktree || api.state.path.directory,
  })
  let files: string[]
  try {
    files = (await readdir(directory)).filter((file) => file.endsWith(".json"))
  } catch {
    files = []
  }
  const records = await Promise.all(files.map((file) => readTaskFile(join(directory, file))))
  for (const task of records) {
    if (!task) continue
    referenceByID.set(task.id, task)
    if (!isVisibleTask(task)) continue
    if (!belongsToSessionTree(api, task.threadID, rootID)) continue
    taskByID.set(task.id, task)
  }

  const tasks = sortTasks([...taskByID.values()])
  const graph = buildTaskGraph(tasks, [...referenceByID.values()])
  const completed = tasks.filter((task) => task.status === "completed").length
  const active = tasks.filter((task) => task.status === "in_progress")
  const blocked = tasks.filter((task) => graph.unresolvedBlockers.has(task.id))
  const total = tasks.length

  return {
    rootSessionID: rootID,
    tasks,
    graph,
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    active,
    blocked,
    activity: latestActivity(api, rootID),
  }
}

function compactText(value: string, limit = 96): string {
  const text = value.replace(/\s+/g, " ").trim()
  return text.length > limit ? `${text.slice(0, limit - 3)}...` : text
}

function latestActivity(api: TuiPluginApi, sessionID: string): string | undefined {
  const messages = api.state.session.messages(sessionID)
  let fallback: string | undefined

  for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
    const message = messages[messageIndex]
    if (!message) continue
    const parts = api.state.part(message.id)
    for (let partIndex = parts.length - 1; partIndex >= 0; partIndex -= 1) {
      const part = parts[partIndex]
      if (!part) continue
      if (part.type === "tool") {
        const label = part.state.status === "running" && part.state.title ? part.state.title : part.tool
        const activity = `${part.state.status === "running" ? "Running" : "Last tool"}: ${compactText(label)}`
        if (part.state.status === "running" || part.state.status === "pending") return activity
        fallback ??= activity
      } else if (part.type === "reasoning" && part.text.trim()) {
        fallback ??= `Thinking: ${compactText(part.text)}`
      } else if (part.type === "text" && !part.synthetic && part.text.trim()) {
        fallback ??= `Last update: ${compactText(part.text)}`
      }
    }
    if (fallback) return fallback
  }
  return fallback
}

function formatAge(timestamp: number): string {
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000))
  if (minutes < 1) return "now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function isBlocked(task: ProgressTask, graph: TaskGraph): boolean {
  return graph.unresolvedBlockers.has(task.id)
}

function taskMarker(task: ProgressTask, graph: TaskGraph): string {
  if (task.status === "completed") return "x"
  if (isBlocked(task, graph)) return "!"
  if (task.status === "in_progress") return ">"
  if ((graph.stats.get(task.id)?.active ?? 0) > 0) return "+"
  return " "
}

export function taskLine(row: TaskRow, graph: TaskGraph): string {
  const stats = graph.stats.get(row.task.id)
  const progress = stats && stats.total > 1 ? ` ${stats.completed}/${stats.total}` : ""
  const priority = row.task.metadata?.["priority"]
  const priorityBadge = priority === "high" ? "[H] " : priority === "low" ? "[L] " : ""
  const label = row.task.status === "in_progress" ? row.task.activeForm || row.task.subject : row.task.subject
  const owner = row.task.owner ? ` @${row.task.owner}` : ""
  return `${"  ".repeat(row.depth)}[${taskMarker(row.task, graph)}] ${priorityBadge}${label}${progress}${owner}`
}

function ancestorIDs(task: ProgressTask, graph: TaskGraph): string[] {
  const result: string[] = []
  const visited = new Set<string>()
  let current = task
  while (current.parentID && !visited.has(current.parentID)) {
    visited.add(current.parentID)
    const parent = graph.byID.get(current.parentID)
    if (!parent) break
    result.push(parent.id)
    current = parent
  }
  return result
}

export function sidebarRows(view: ProgressView): TaskRow[] {
  const focused = new Set<string>()
  for (const task of [...view.active, ...view.blocked]) {
    focused.add(task.id)
    for (const id of ancestorIDs(task, view.graph)) focused.add(id)
  }

  const rows: TaskRow[] = []
  const visit = (task: ProgressTask, depth: number): void => {
    rows.push({ task, depth })
    if (depth !== 0 && !focused.has(task.id)) return
    for (const child of view.graph.children.get(task.id) ?? []) visit(child, depth + 1)
  }
  for (const root of view.graph.roots) visit(root, 0)
  return rows
}

export function sidebarHeading(graph: TaskGraph): string {
  return graph.roots.length === 1 ? graph.roots[0]?.subject ?? "Tasks" : "Tasks"
}

export function collapsedTaskLabel(total: number, visible: number): string | undefined {
  const collapsed = total - visible
  return collapsed > 0 ? `... ${collapsed} collapsed` : undefined
}

function progressBar(percent: number): string {
  const filled = Math.round(percent / 10)
  return `[${"#".repeat(filled)}${"-".repeat(10 - filled)}]`
}

function taskName(id: string, graph: TaskGraph): string {
  return graph.references.get(id)?.subject ?? `${id} (missing)`
}

function taskSummary(task: ProgressTask, graph: TaskGraph): string {
  const stats = graph.stats.get(task.id)
  const values = [task.status.replace("_", " ")]
  if (task.owner) values.push(task.owner)
  const priority = task.metadata?.["priority"]
  if (typeof priority === "string") values.push(`${priority} priority`)
  if (stats && stats.total > 1) values.push(`${stats.completed}/${stats.total} subtree complete`)
  const blockers = graph.unresolvedBlockers.get(task.id)
  if (blockers?.length) values.push(`blocked by ${blockers.map((id) => taskName(id, graph)).join(", ")}`)
  values.push(`updated ${formatAge(task.updatedAt)}`)
  return values.join(" | ")
}

function taskDetail(task: ProgressTask, graph: TaskGraph): string {
  const stats = graph.stats.get(task.id) ?? { total: 1, completed: 0, active: 0, blocked: 0 }
  const parent = task.parentID ? graph.byID.get(task.parentID) : undefined
  const children = graph.children.get(task.id) ?? []
  const blockers = graph.blockers.get(task.id) ?? []
  const dependents = graph.dependents.get(task.id) ?? []
  const lines = [
    `Status: ${task.status.replace("_", " ")}`,
    task.activeForm ? `Current work: ${task.activeForm}` : undefined,
    task.owner ? `Owner: ${task.owner}` : undefined,
    `Subtree: ${stats.completed}/${stats.total} complete | ${stats.active} active | ${stats.blocked} blocked`,
    `Created: ${formatAge(task.createdAt)} | Updated: ${formatAge(task.updatedAt)}`,
    parent ? `Parent: ${parent.subject}` : task.parentID ? `Parent: ${task.parentID} (missing)` : "Parent: none",
    graph.anomalies.get(task.id) ? `Hierarchy warning: ${graph.anomalies.get(task.id)}` : undefined,
    "",
    task.description ? `Description:\n${task.description}` : "Description: none",
    "",
    children.length ? `Children:\n${children.map((child) => `  [${taskMarker(child, graph)}] ${child.subject}`).join("\n")}` : "Children: none",
    blockers.length ? `Blocked by:\n${blockers.map((id) => `  ${taskName(id, graph)}`).join("\n")}` : "Blocked by: none",
    dependents.length ? `Blocking:\n${dependents.map((id) => `  ${taskName(id, graph)}`).join("\n")}` : "Blocking: none",
    task.metadata && Object.keys(task.metadata).length ? `Metadata:\n${JSON.stringify(task.metadata, null, 2)}` : undefined,
  ]
  return lines.filter((line): line is string => line !== undefined).join("\n")
}

function browserOptions(view: ProgressView): TuiDialogSelectOption<string>[] {
  return view.graph.rows.map((row) => ({
    title: taskLine(row, view.graph),
    value: row.task.id,
    description: taskSummary(row.task, view.graph),
  }))
}

const plugin = {
  id: "session-progress",
  tui: async (api) => {
    let current = EMPTY_VIEW
    let currentKey = ""
    let disposed = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const slot: TuiSlotPlugin = {
      order: 850,
      slots: {
        sidebar_content(ctx, value) {
          if (current.rootSessionID !== rootSessionID(api, value.session_id) || current.total === 0) return null
          const theme = ctx.theme.current
          const rows = sidebarRows(current)
          const collapsed = collapsedTaskLabel(current.graph.rows.length, rows.length)
          const active = current.active.filter((task) => !current.graph.unresolvedBlockers.has(task.id)).length
          const queued = current.tasks.filter(
            (task) => task.status === "pending" && !current.graph.unresolvedBlockers.has(task.id),
          ).length
          return (
            <box flexDirection="column" paddingTop={1} gap={0}>
              <text fg={theme.text}>
                <b>{sidebarHeading(current.graph)}</b>
              </text>
              <text fg={theme.textMuted}>
                {progressBar(current.percent)} {current.completed}/{current.total} done
              </text>
              <text fg={current.blocked.length ? theme.warning : theme.textMuted}>
                {active} active | {current.blocked.length} blocked | {queued} ready
              </text>
              {current.activity ? <text fg={theme.textMuted}>{current.activity}</text> : null}
              <box flexDirection="column" paddingTop={1}>
                {rows.map((row) => (
                  <text
                    fg={
                      row.task.status === "completed"
                        ? theme.success
                        : isBlocked(row.task, current.graph)
                          ? theme.warning
                          : row.task.status === "in_progress"
                            ? theme.info
                            : theme.textMuted
                    }
                  >
                    {taskLine(row, current.graph)}
                  </text>
                ))}
                {collapsed ? <text fg={theme.textMuted}>{collapsed}</text> : null}
              </box>
              <text fg={theme.textMuted}>/progress to browse tasks | no reliable ETA</text>
            </box>
          )
        },
      },
    }
    api.slots.register(slot)

    const openTaskBrowser = (selectedID?: string): void => {
      const DialogSelect = api.ui.DialogSelect
      api.ui.dialog.setSize("xlarge")
      api.ui.dialog.replace(() => (
        <DialogSelect
          title={`Session tasks - ${current.completed}/${current.total} complete`}
          placeholder="Filter by task, owner, status, or blocker"
          options={browserOptions(current)}
          {...(selectedID === undefined ? {} : { current: selectedID })}
          onSelect={(option: TuiDialogSelectOption<string>) => openTaskDetail(option.value)}
        />
      ))
    }

    const openTaskDetail = (taskID: string): void => {
      const task = current.graph.byID.get(taskID)
      if (!task) return openTaskBrowser()
      const DialogAlert = api.ui.DialogAlert
      api.ui.dialog.setSize("xlarge")
      api.ui.dialog.replace(() => (
        <DialogAlert
          title={task.subject}
          message={taskDetail(task, current.graph)}
          onConfirm={() => openTaskBrowser(task.id)}
        />
      ))
    }

    api.keymap.registerLayer({
      commands: [
        {
          name: "session_progress.show",
          title: "Browse session task tree",
          category: "Session",
          namespace: "palette",
          slashName: "progress",
          enabled: () => api.route.current.name === "session",
          run() {
            if (current.total === 0) {
              const DialogAlert = api.ui.DialogAlert
              api.ui.dialog.setSize("large")
              api.ui.dialog.replace(() => (
                <DialogAlert
                  title="Session tasks"
                  message="No task records are linked to this session tree."
                  onConfirm={() => api.ui.dialog.clear()}
                />
              ))
              return
            }
            openTaskBrowser(current.active[0]?.id ?? current.blocked[0]?.id)
          },
        },
      ],
      bindings: [],
    })

    const tick = async (): Promise<void> => {
      if (disposed) return
      const route = api.route.current
      const sessionID = route.name === "session" ? route.params?.sessionID : undefined
      if (typeof sessionID === "string") {
        const next = await loadProgress(api, sessionID)
        const references = [...next.graph.references.values()]
          .map((task) => [task.id, task.status, task.updatedAt])
          .sort((left, right) => String(left[0]).localeCompare(String(right[0])))
        const nextKey = JSON.stringify(next.tasks) + JSON.stringify(references) + next.activity + Math.floor(Date.now() / 60000)
        if (nextKey !== currentKey) {
          current = next
          currentKey = nextKey
          api.renderer.requestRender()
        }
      }
      timer = setTimeout(tick, POLL_INTERVAL_MS)
    }

    void tick()
    api.lifecycle.onDispose(() => {
      disposed = true
      if (timer) clearTimeout(timer)
    })
  },
} satisfies TuiPluginModule & { id: string }

export default plugin
