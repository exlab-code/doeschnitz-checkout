import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'

import { GET as getCheckouts, POST as postCheckout } from '@/app/api/checkouts/route'
import { GET as getChangelog } from '@/app/api/changelog/route'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'checkouts-api-test-'))
  process.env.DATA_DIR = tmpDir
})

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
  delete process.env.DATA_DIR
})

describe('POST /api/checkouts', () => {
  it('records a sign-off and GET returns it', async () => {
    const body = {
      name: 'Julius',
      tasksCompleted: 5,
      tasksTotal: 7,
    }

    const postRequest = new Request('http://localhost/api/checkouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const postResponse = await postCheckout(postRequest)
    expect(postResponse.status).toBe(201)

    const getRequest = new Request('http://localhost/api/checkouts')
    const getResponse = await getCheckouts(getRequest)
    expect(getResponse.status).toBe(200)

    const entries = await getResponse.json()
    expect(entries).toHaveLength(1)
    expect(entries[0].name).toBe('Julius')
    expect(entries[0].tasksCompleted).toBe(5)
    expect(entries[0].tasksTotal).toBe(7)
    expect(typeof entries[0].date).toBe('string')
  })
})

describe('GET /api/changelog', () => {
  it('returns empty array when no changelog exists', async () => {
    const request = new Request('http://localhost/api/changelog')
    const response = await getChangelog(request)
    expect(response.status).toBe(200)
    const entries = await response.json()
    expect(entries).toEqual([])
  })
})
