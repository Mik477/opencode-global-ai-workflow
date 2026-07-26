import { z } from "zod"

const TASK_STATUSES = ["pending", "in_progress", "completed", "deleted"] as const

export const taskIdSchema = z.string().regex(/^T-[A-Za-z0-9-]+$/).brand<"TaskID">()
export const taskStatusSchema = z.enum(TASK_STATUSES)
const dependencyListSchema = z.array(taskIdSchema).readonly()
const metadataSchema = z.record(z.string(), z.unknown()).readonly()

export const taskRecordSchema = z
  .object({
    id: taskIdSchema,
    subject: z.string(),
    description: z.string(),
    status: taskStatusSchema,
    activeForm: z.string().optional(),
    blocks: dependencyListSchema.default([]),
    blockedBy: dependencyListSchema.default([]),
    owner: z.string().optional(),
    metadata: metadataSchema.optional(),
    repoURL: z.string().optional(),
    parentID: taskIdSchema.optional(),
    threadID: z.string(),
  })
  .strict()

export const createTaskArgs = {
  subject: z.string(),
  description: z.string().optional(),
  activeForm: z.string().optional(),
  blocks: dependencyListSchema.optional(),
  blockedBy: dependencyListSchema.optional(),
  owner: z.string().optional(),
  metadata: metadataSchema.optional(),
  repoURL: z.string().optional(),
  parentID: taskIdSchema.optional(),
} satisfies z.ZodRawShape

export const getTaskArgs = {
  id: taskIdSchema,
} satisfies z.ZodRawShape

export const updateTaskArgs = {
  id: taskIdSchema,
  subject: z.string().optional(),
  description: z.string().optional(),
  status: taskStatusSchema.optional(),
  activeForm: z.string().nullable().optional(),
  owner: z.string().nullable().optional(),
  parentID: taskIdSchema.nullable().optional(),
  setBlocks: dependencyListSchema.optional(),
  setBlockedBy: dependencyListSchema.optional(),
  addBlocks: dependencyListSchema.optional(),
  addBlockedBy: dependencyListSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).readonly().optional(),
} satisfies z.ZodRawShape

export const createTaskInputSchema = z.object(createTaskArgs).strict()
export const taskUpdateInputSchema = z.object(updateTaskArgs).strict()

export type TaskID = z.infer<typeof taskIdSchema>
export type TaskStatus = z.infer<typeof taskStatusSchema>
export type TaskRecord = Readonly<z.infer<typeof taskRecordSchema>>
export type CreateTaskInput = Readonly<z.infer<typeof createTaskInputSchema>>
export type TaskUpdateInput = Readonly<z.infer<typeof taskUpdateInputSchema>>
