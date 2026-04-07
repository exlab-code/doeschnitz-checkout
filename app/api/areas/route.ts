import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getAreas, saveAreas, saveArea } from '@/lib/content'

const CreateAreaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  emoji: z.string().min(1),
  sortOrder: z.number().int().min(0).optional(),
})

export async function GET(_request: Request): Promise<NextResponse> {
  try {
    const areas = await getAreas()
    return NextResponse.json(areas)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get areas'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const raw = await request.json()
    const parsed = CreateAreaSchema.safeParse(raw)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid area data', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { id, name, emoji } = parsed.data
    const areas = await getAreas()
    const sortOrder = parsed.data.sortOrder ?? areas.length + 1

    const newAreaIndex = { id, name, emoji, sortOrder }
    await saveAreas([...areas, newAreaIndex])
    await saveArea({ id, name, emoji, tasks: [] })

    return NextResponse.json({ id, name, emoji, tasks: [] }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create area'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
