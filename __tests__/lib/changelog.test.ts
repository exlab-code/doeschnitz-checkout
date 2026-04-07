import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { appendChange, getChangelog } from '@/lib/changelog'

let tempDir: string

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'changelog-test-'))
  process.env.DATA_DIR = tempDir
})

afterEach(async () => {
  delete process.env.DATA_DIR
  await fs.rm(tempDir, { recursive: true, force: true })
})

describe('getChangelog', () => {
  it('returns empty array when no file exists', async () => {
    const result = await getChangelog()
    expect(result).toEqual([])
  })
})

describe('appendChange', () => {
  it('appends a change entry with auto-generated timestamp', async () => {
    const before = new Date().toISOString()

    await appendChange({
      author: 'alice',
      area: 'kitchen',
      action: 'update',
      changes: { color: 'blue' },
    })

    const after = new Date().toISOString()
    const entries = await getChangelog()

    expect(entries).toHaveLength(1)
    const entry = entries[0]
    expect(entry.author).toBe('alice')
    expect(entry.area).toBe('kitchen')
    expect(entry.action).toBe('update')
    expect(entry.changes).toEqual({ color: 'blue' })
    expect(entry.taskId).toBeUndefined()
    expect(entry.timestamp >= before).toBe(true)
    expect(entry.timestamp <= after).toBe(true)
  })

  it('appends optional taskId when provided', async () => {
    await appendChange({
      author: 'bob',
      area: 'bathroom',
      action: 'create',
      taskId: 'task-42',
      changes: { tile: 'marble' },
    })

    const entries = await getChangelog()
    expect(entries[0].taskId).toBe('task-42')
  })

  it('multiple appendChange calls append correctly', async () => {
    await appendChange({
      author: 'alice',
      area: 'kitchen',
      action: 'update',
      changes: { color: 'blue' },
    })

    await appendChange({
      author: 'bob',
      area: 'bathroom',
      action: 'create',
      taskId: 'task-1',
      changes: { fixture: 'new' },
    })

    await appendChange({
      author: 'carol',
      area: 'bedroom',
      action: 'delete',
      changes: { item: 'lamp' },
    })

    const entries = await getChangelog()
    expect(entries).toHaveLength(3)
    expect(entries[0].author).toBe('alice')
    expect(entries[1].author).toBe('bob')
    expect(entries[2].author).toBe('carol')
  })
})
