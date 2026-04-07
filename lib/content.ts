import fs from 'fs/promises'
import path from 'path'

import {
  AreaIndexSchema,
  AreaFileSchema,
  CheckoutEntrySchema,
} from '@/lib/types'
import type { AreaFile, AreaIndex, CheckoutEntry } from '@/lib/types'

const ID_PATTERN = /^[a-z0-9-]+$/

export function validateId(id: string): void {
  if (!ID_PATTERN.test(id)) {
    throw new Error(`Invalid id: "${id}"`)
  }
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

export function contentDir(): string {
  return process.env.CONTENT_DIR || path.join(process.cwd(), 'content')
}

export function dataDir(): string {
  return process.env.DATA_DIR || process.cwd()
}

export async function getAreas(): Promise<AreaIndex> {
  const raw = await fs.readFile(path.join(contentDir(), 'areas.json'), 'utf-8')
  return AreaIndexSchema.parse(JSON.parse(raw))
}

export async function saveAreas(areas: AreaIndex): Promise<void> {
  const filePath = path.join(contentDir(), 'areas.json')
  return withFileLock(filePath, async () => {
    const validated = AreaIndexSchema.parse(areas)
    await fs.writeFile(filePath, JSON.stringify(validated, null, 2))
  })
}

export async function getArea(id: string): Promise<AreaFile> {
  validateId(id)
  const raw = await fs.readFile(
    path.join(contentDir(), 'areas', `${id}.json`),
    'utf-8'
  )
  return AreaFileSchema.parse(JSON.parse(raw))
}

export async function saveArea(area: AreaFile): Promise<void> {
  validateId(area.id)
  const areasDir = path.join(contentDir(), 'areas')
  const filePath = path.join(areasDir, `${area.id}.json`)
  return withFileLock(filePath, async () => {
    const validated = AreaFileSchema.parse(area)
    await fs.mkdir(areasDir, { recursive: true })
    await fs.writeFile(filePath, JSON.stringify(validated, null, 2))
  })
}

export async function deleteAreaFile(id: string): Promise<void> {
  validateId(id)
  await fs.unlink(path.join(contentDir(), 'areas', `${id}.json`))
}

export async function getCheckouts(): Promise<CheckoutEntry[]> {
  try {
    const raw = await fs.readFile(
      path.join(dataDir(), 'checkouts.json'),
      'utf-8'
    )
    return JSON.parse(raw) as CheckoutEntry[]
  } catch {
    return []
  }
}

export async function addCheckout(entry: CheckoutEntry): Promise<void> {
  const filePath = path.join(dataDir(), 'checkouts.json')
  return withFileLock(filePath, async () => {
    const validated = CheckoutEntrySchema.parse(entry)
    const existing = await getCheckouts()
    await fs.writeFile(filePath, JSON.stringify([...existing, validated], null, 2))
  })
}
