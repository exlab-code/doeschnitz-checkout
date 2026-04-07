import fs from 'fs/promises'
import path from 'path'

import { NextResponse } from 'next/server'

import { mediaDir } from '@/app/api/media/route'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
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
