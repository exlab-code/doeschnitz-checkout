import fs from 'fs/promises'
import path from 'path'

import { ChangelogEntrySchema } from '@/lib/types'
import type { ChangelogEntry } from '@/lib/types'

interface ChangeInput {
  author: string
  area: string
  action: string
  taskId?: string
  changes: Record<string, unknown>
}

const locks = new Map<string, Promise<void>>()

async function withFileLock<T>(filePath: string, fn: () => Promise<T>): Promise<T> {
  const existing = locks.get(filePath) ?? Promise.resolve()
  let resolve!: () => void
  const next = new Promise<void>((r) => { resolve = r })
  locks.set(filePath, next)
  await existing
  try {
    return await fn()
  } finally {
    resolve()
    if (locks.get(filePath) === next) locks.delete(filePath)
  }
}

export function dataDir(): string {
  return process.env.DATA_DIR || process.cwd()
}

export async function getChangelog(): Promise<ChangelogEntry[]> {
  try {
    const raw = await fs.readFile(
      path.join(dataDir(), 'changelog.json'),
      'utf-8'
    )
    return JSON.parse(raw) as ChangelogEntry[]
  } catch {
    return []
  }
}

export async function appendChange(input: ChangeInput): Promise<void> {
  const filePath = path.join(dataDir(), 'changelog.json')
  return withFileLock(filePath, async () => {
    const entry = ChangelogEntrySchema.parse({
      timestamp: new Date().toISOString(),
      author: input.author,
      area: input.area,
      action: input.action,
      taskId: input.taskId,
      changes: input.changes,
    })

    const existing = await getChangelog()

    await fs.writeFile(filePath, JSON.stringify([...existing, entry], null, 2))
  })
}
