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
  const entry = ChangelogEntrySchema.parse({
    timestamp: new Date().toISOString(),
    author: input.author,
    area: input.area,
    action: input.action,
    taskId: input.taskId,
    changes: input.changes,
  })

  const existing = await getChangelog()

  await fs.writeFile(
    path.join(dataDir(), 'changelog.json'),
    JSON.stringify([...existing, entry], null, 2)
  )
}
