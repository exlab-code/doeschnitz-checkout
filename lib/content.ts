import fs from 'fs/promises'
import path from 'path'

import {
  AreaIndexSchema,
  AreaFileSchema,
  CheckoutEntrySchema,
} from '@/lib/types'
import type { AreaFile, AreaIndex, CheckoutEntry } from '@/lib/types'

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
  const validated = AreaIndexSchema.parse(areas)
  await fs.writeFile(
    path.join(contentDir(), 'areas.json'),
    JSON.stringify(validated, null, 2)
  )
}

export async function getArea(id: string): Promise<AreaFile> {
  const raw = await fs.readFile(
    path.join(contentDir(), 'areas', `${id}.json`),
    'utf-8'
  )
  return AreaFileSchema.parse(JSON.parse(raw))
}

export async function saveArea(area: AreaFile): Promise<void> {
  const validated = AreaFileSchema.parse(area)
  const areasDir = path.join(contentDir(), 'areas')
  await fs.mkdir(areasDir, { recursive: true })
  await fs.writeFile(
    path.join(areasDir, `${validated.id}.json`),
    JSON.stringify(validated, null, 2)
  )
}

export async function deleteAreaFile(id: string): Promise<void> {
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
  const validated = CheckoutEntrySchema.parse(entry)
  const existing = await getCheckouts()
  await fs.writeFile(
    path.join(dataDir(), 'checkouts.json'),
    JSON.stringify([...existing, validated], null, 2)
  )
}
