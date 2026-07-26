import { tool, type PluginModule } from "@opencode-ai/plugin"

import { resolveTaskDirectory } from "./task-path.ts"
import { createTaskArgs, getTaskArgs, updateTaskArgs } from "./task-schema.ts"
import { TaskStore } from "./task-store.ts"

export function createTaskTools(store: TaskStore) {
  return {
    task_create: tool({
      description: "Create a persistent task in the current task list.",
      args: createTaskArgs,
      async execute(args, context) {
        const task = await store.create(args, context.sessionID)
        return `${JSON.stringify({ id: task.id, subject: task.subject })}`
      },
    }),
    task_get: tool({
      description: "Get a task from the current task list by ID.",
      args: getTaskArgs,
      async execute(args) {
        const task = await store.get(args.id)
        return task === null ? "null" : `${JSON.stringify(task, null, 2)}`
      },
    }),
    task_list: tool({
      description: "List active tasks, required completed ancestors, hierarchy fields, and unresolved blockers.",
      args: {},
      async execute() {
        return `${JSON.stringify(await store.list(), null, 2)}`
      },
    }),
    task_update: tool({
      description: "Update, clear, or reparent mutable fields and replace or append task dependencies.",
      args: updateTaskArgs,
      async execute(args) {
        return `${JSON.stringify(await store.update(args), null, 2)}`
      },
    }),
  }
}

const plugin = {
  id: "session-progress",
  server: async ({ directory, worktree }) => ({
    tool: createTaskTools(
      new TaskStore(
        resolveTaskDirectory({
          directory,
          worktree,
        }),
      ),
    ),
  }),
} satisfies PluginModule & { id: string }

export default plugin
