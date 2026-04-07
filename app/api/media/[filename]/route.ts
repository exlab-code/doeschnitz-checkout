import fs from 'fs/promises'
import path from 'path'

import { NextResponse } from 'next/server'

import { mediaDir } from '@/app/api/media/route'

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
}

type Params = { params: Promise<{ filename: string }> }

export async function GET(
  _request: Request,
  { params }: Params
): Promise<NextResponse> {
  const { filename } = await params
  const safeFilename = path.basename(filename)
  const filePath = path.join(mediaDir(), safeFilename)

  try {
    const buffer = await fs.readFile(filePath)
    const ext = path.extname(safeFilename).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: Params
): Promise<NextResponse> {
  const { filename } = await params
  const safeFilename = path.basename(filename)
  const filepath = path.join(mediaDir(), safeFilename)

  try {
    await fs.unlink(filepath)
    return NextResponse.json({ deleted: safeFilename })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
