import { NextResponse } from 'next/server'

import { getArea, saveArea, validateId } from '@/lib/content'
import { appendChange } from '@/lib/changelog'

type Params = { params: Promise<{ id: string; taskId: string }> }

export async function PUT(request: Request, { params }: Params): Promise<NextResponse> {
  const { id, taskId } = await params
  try {
    validateId(id)
    validateId(taskId)
  } catch {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }
  try {
    const area = await getArea(id)
    const task = area.tasks.find((t) => t.id === taskId)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const body = await request.json() as {
      title?: string
      description?: string
      media?: Array<{ type: 'video' | 'image'; url: string; label: string }>
      author?: string
    }

    const updatedTask = {
      ...task,
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.media !== undefined ? { media: body.media } : {}),
    }

    const updated = {
      ...area,
      tasks: area.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
    }

    await saveArea(updated)

    if (body.author) {
      const changes: Record<string, unknown> = {}
      if (body.title !== undefined) changes.title = { old: task.title, new: body.title }
      if (body.description !== undefined) changes.description = { old: task.description, new: body.description }
      if (body.media !== undefined) changes.media = { old: task.media, new: body.media }

      await appendChange({
        author: body.author,
        area: id,
        action: 'update_task',
        taskId,
        changes,
      })
    }

    return NextResponse.json(updatedTask)
  } catch {
    return NextResponse.json({ error: 'Area not found' }, { status: 404 })
  }
}

export async function DELETE(_request: Request, { params }: Params): Promise<NextResponse> {
  const { id, taskId } = await params
  try {
    validateId(id)
    validateId(taskId)
  } catch {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }
  try {
    const area = await getArea(id)
    const task = area.tasks.find((t) => t.id === taskId)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const updated = {
      ...area,
      tasks: area.tasks.filter((t) => t.id !== taskId),
    }

    await saveArea(updated)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Area not found' }, { status: 404 })
  }
}
