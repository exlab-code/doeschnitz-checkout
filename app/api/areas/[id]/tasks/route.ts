import { NextResponse } from 'next/server'

import { getArea, saveArea } from '@/lib/content'
import { appendChange } from '@/lib/changelog'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params
  try {
    const area = await getArea(id)
    const body = await request.json() as {
      title?: string
      description?: string
      media?: unknown[]
      author?: string
    }

    const taskId = crypto.randomUUID().slice(0, 8)
    const newTask = {
      id: taskId,
      title: body.title ?? '',
      description: body.description ?? '',
      media: (body.media ?? []) as Array<{ type: 'video' | 'image'; url: string; label: string }>,
    }

    const updated = {
      ...area,
      tasks: [...area.tasks, newTask],
    }

    await saveArea(updated)

    if (body.author) {
      await appendChange({
        author: body.author,
        area: id,
        action: 'add_task',
        taskId,
        changes: { title: newTask.title, description: newTask.description },
      })
    }

    return NextResponse.json(newTask, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Area not found' }, { status: 404 })
  }
}
