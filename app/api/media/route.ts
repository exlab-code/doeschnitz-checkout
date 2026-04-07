import fs from 'fs/promises'
import path from 'path'

import { NextResponse } from 'next/server'

export function mediaDir(): string {
  return process.env.MEDIA_DIR || path.join(process.cwd(), 'public', 'media')
}

export async function POST(request: Request): Promise<NextResponse> {
  const formData = await request.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_')
  const filename = `${Date.now()}_${sanitizedName}`

  const dir = mediaDir()
  await fs.mkdir(dir, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(path.join(dir, filename), buffer)

  const url = `/media/${filename}`
  return NextResponse.json({ url, filename }, { status: 201 })
}
