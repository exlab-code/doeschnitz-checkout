import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'

import {
  getAreas,
  getArea,
  saveArea,
  saveAreas,
  deleteAreaFile,
  getCheckouts,
  addCheckout,
} from '@/lib/content'

const testAreas = [
  { id: 'kueche', name: 'Küche', emoji: '🍳', sortOrder: 1 },
  { id: 'bad', name: 'Bad', emoji: '🛁', sortOrder: 2 },
]

const testAreaFile = {
  id: 'kueche',
  name: 'Küche',
  emoji: '🍳',
  tasks: [
    {
      id: 'task-1',
      title: 'Herd reinigen',
      description: 'Den Herd gründlich reinigen',
      media: [],
    },
  ],
}

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'content-test-'))
  process.env.CONTENT_DIR = tmpDir
  process.env.DATA_DIR = tmpDir

  await fs.mkdir(path.join(tmpDir, 'areas'))
  await fs.writeFile(
    path.join(tmpDir, 'areas.json'),
    JSON.stringify(testAreas, null, 2)
  )
  await fs.writeFile(
    path.join(tmpDir, 'areas', 'kueche.json'),
    JSON.stringify(testAreaFile, null, 2)
  )
})

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
  delete process.env.CONTENT_DIR
  delete process.env.DATA_DIR
})

describe('getAreas()', () => {
  it('reads and parses areas.json', async () => {
    const areas = await getAreas()
    expect(areas).toEqual(testAreas)
  })
})

describe('getArea()', () => {
  it('reads a single area file with tasks', async () => {
    const area = await getArea('kueche')
    expect(area).toEqual(testAreaFile)
  })

  it('throws for nonexistent area', async () => {
    await expect(getArea('nope')).rejects.toThrow()
  })
})

describe('saveArea()', () => {
  it('writes area file to disk', async () => {
    const newArea = {
      id: 'wohnzimmer',
      name: 'Wohnzimmer',
      emoji: '🛋️',
      tasks: [],
    }
    await saveArea(newArea)
    const written = await fs.readFile(
      path.join(tmpDir, 'areas', 'wohnzimmer.json'),
      'utf-8'
    )
    expect(JSON.parse(written)).toEqual(newArea)
  })
})

describe('saveAreas()', () => {
  it('writes areas index to disk', async () => {
    const newAreas = [{ id: 'x', name: 'X', emoji: '❓', sortOrder: 99 }]
    await saveAreas(newAreas)
    const written = await fs.readFile(path.join(tmpDir, 'areas.json'), 'utf-8')
    expect(JSON.parse(written)).toEqual(newAreas)
  })
})

describe('deleteAreaFile()', () => {
  it('removes an area file', async () => {
    await deleteAreaFile('kueche')
    await expect(
      fs.access(path.join(tmpDir, 'areas', 'kueche.json'))
    ).rejects.toThrow()
  })
})

describe('getCheckouts()', () => {
  it('returns empty array when no file exists', async () => {
    const checkouts = await getCheckouts()
    expect(checkouts).toEqual([])
  })
})

describe('addCheckout()', () => {
  it('appends a checkout entry', async () => {
    const entry = {
      name: 'Julius',
      date: '2026-04-07',
      tasksCompleted: 3,
      tasksTotal: 5,
    }
    await addCheckout(entry)
    const written = await fs.readFile(
      path.join(tmpDir, 'checkouts.json'),
      'utf-8'
    )
    expect(JSON.parse(written)).toEqual([entry])

    const entry2 = {
      name: 'Anna',
      date: '2026-04-08',
      tasksCompleted: 5,
      tasksTotal: 5,
    }
    await addCheckout(entry2)
    const written2 = await fs.readFile(
      path.join(tmpDir, 'checkouts.json'),
      'utf-8'
    )
    expect(JSON.parse(written2)).toEqual([entry, entry2])
  })
})
