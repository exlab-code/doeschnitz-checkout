import { NextResponse } from 'next/server'

import { getChangelog } from '@/lib/changelog'

export async function GET(_request: Request): Promise<NextResponse> {
  const changelog = await getChangelog()
  return NextResponse.json(changelog)
}
