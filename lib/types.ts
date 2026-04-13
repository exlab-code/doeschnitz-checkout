import { z } from 'zod'

export const MediaItemSchema = z.object({
  type: z.enum(['video', 'image']),
  url: z.string(),
  label: z.string(),
})

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  media: z.array(MediaItemSchema).default([]),
})

export const AreaFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  emoji: z.string(),
  tasks: z.array(TaskSchema),
})

export const AreaIndexItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  emoji: z.string(),
  sortOrder: z.number(),
})

export const AreaIndexSchema = z.array(AreaIndexItemSchema)

export const CheckoutEntrySchema = z.object({
  name: z.string().min(1),
  date: z.string(),
  tasksCompleted: z.number(),
  tasksTotal: z.number(),
  notes: z.string().optional(),
})

export const ChangelogEntrySchema = z.object({
  timestamp: z.string(),
  author: z.string(),
  area: z.string(),
  action: z.string(),
  taskId: z.string().optional(),
  changes: z.record(z.string(), z.any()),
})

export type MediaItem = z.infer<typeof MediaItemSchema>
export type Task = z.infer<typeof TaskSchema>
export type AreaFile = z.infer<typeof AreaFileSchema>
export type AreaIndexItem = z.infer<typeof AreaIndexItemSchema>
export type AreaIndex = z.infer<typeof AreaIndexSchema>
export type CheckoutEntry = z.infer<typeof CheckoutEntrySchema>
export type ChangelogEntry = z.infer<typeof ChangelogEntrySchema>
