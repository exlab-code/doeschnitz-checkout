import { NextResponse } from 'next/server'

import { getAreas, getArea, saveArea, saveAreas, deleteAreaFile, validateId } from '@/lib/content'
import { appendChange } from '@/lib/changelog'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params
  try {
    validateId(id)
  } catch {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }
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
    validateId(id)
  } catch {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }
  try {
    const area = await getArea(id)
    const body = await request.json() as {
      name?: string
      emoji?: string
      tasks?: typeof area.tasks
      author?: string
    }

    if (
      (body.name !== undefined && typeof body.name !== 'string') ||
      (body.emoji !== undefined && typeof body.emoji !== 'string') ||
      (body.author !== undefined && typeof body.author !== 'string')
    ) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
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
    validateId(id)
  } catch {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }
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
