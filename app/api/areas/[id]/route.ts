import { NextResponse } from 'next/server'

import { getAreas, getArea, saveArea, saveAreas, deleteAreaFile } from '@/lib/content'
import { appendChange } from '@/lib/changelog'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params
  try {
    const area = await getArea(id)
    return NextResponse.json(area)
  } catch {
    return NextResponse.json({ error: 'Area not found' }, { status: 404 })
  }
}

export async function PUT(request: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params
  try {
    const area = await getArea(id)
    const body = await request.json() as {
      name?: string
      emoji?: string
      tasks?: typeof area.tasks
      author?: string
    }

    const updated = {
      ...area,
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.emoji !== undefined ? { emoji: body.emoji } : {}),
      ...(body.tasks !== undefined ? { tasks: body.tasks } : {}),
    }

    await saveArea(updated)

    // Also update areas index
    const areas = await getAreas()
    const updatedAreas = areas.map((a) =>
      a.id === id
        ? { ...a, name: updated.name, emoji: updated.emoji }
        : a
    )
    await saveAreas(updatedAreas)

    if (body.author) {
      const changes: Record<string, unknown> = {}
      if (body.name !== undefined) changes.name = { old: area.name, new: body.name }
      if (body.emoji !== undefined) changes.emoji = { old: area.emoji, new: body.emoji }

      await appendChange({
        author: body.author,
        area: id,
        action: 'update_area',
        changes,
      })
    }

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Area not found' }, { status: 404 })
  }
}

export async function DELETE(_request: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params
  try {
    await deleteAreaFile(id)
    const areas = await getAreas()
    const updatedAreas = areas.filter((a) => a.id !== id)
    await saveAreas(updatedAreas)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Area not found' }, { status: 404 })
  }
}
