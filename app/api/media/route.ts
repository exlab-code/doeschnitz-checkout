import fs from 'fs/promises'
import path from 'path'

import { NextResponse } from 'next/server'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

export function mediaDir(): string {
  return process.env.MEDIA_DIR || path.join(process.cwd(), 'public', 'media')
}

export async function POST(request: Request): Promise<NextResponse> {
  const formData = await request.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    return NextResponse.json({ error: 'Only image and video files are allowed' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File exceeds 50 MB limit' }, { status: 400 })
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
