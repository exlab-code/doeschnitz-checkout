import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'

import { GET as getAreas } from '@/app/api/areas/route'
import { GET as getArea, PUT as putArea } from '@/app/api/areas/[id]/route'
import { PUT as putTask } from '@/app/api/areas/[id]/tasks/[taskId]/route'

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
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'areas-api-test-'))
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

describe('GET /api/areas', () => {
  it('returns areas list', async () => {
    const request = new Request('http://localhost/api/areas')
    const response = await getAreas(request)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual(testAreas)
  })
})

describe('GET /api/areas/[id]', () => {
  it('returns area with tasks', async () => {
    const request = new Request('http://localhost/api/areas/kueche')
    const response = await getArea(request, { params: Promise.resolve({ id: 'kueche' }) })
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual(testAreaFile)
  })

  it('returns 404 for unknown area', async () => {
    const request = new Request('http://localhost/api/areas/nope')
    const response = await getArea(request, { params: Promise.resolve({ id: 'nope' }) })
    expect(response.status).toBe(404)
  })
})

describe('PUT /api/areas/[id]/tasks/[taskId]', () => {
  it('updates task and logs change when author is provided', async () => {
    const body = {
      title: 'Herd extra sauber reinigen',
      description: 'Gründlich mit Entfetter',
      author: 'Julius',
    }
    const request = new Request(
      'http://localhost/api/areas/kueche/tasks/task-1',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )
    const response = await putTask(request, {
      params: Promise.resolve({ id: 'kueche', taskId: 'task-1' }),
    })
    expect(response.status).toBe(200)

    // Verify the task was updated
    const updated = JSON.parse(
      await fs.readFile(path.join(tmpDir, 'areas', 'kueche.json'), 'utf-8')
    )
    const task = updated.tasks.find((t: { id: string }) => t.id === 'task-1')
    expect(task.title).toBe('Herd extra sauber reinigen')
    expect(task.description).toBe('Gründlich mit Entfetter')

    // Verify the changelog was written
    const changelog = JSON.parse(
      await fs.readFile(path.join(tmpDir, 'changelog.json'), 'utf-8')
    )
    expect(changelog).toHaveLength(1)
    expect(changelog[0].author).toBe('Julius')
    expect(changelog[0].action).toBe('update_task')
    expect(changelog[0].taskId).toBe('task-1')
  })
})
