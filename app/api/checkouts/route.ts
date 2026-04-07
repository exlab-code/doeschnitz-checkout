import { NextResponse } from 'next/server'

import { getCheckouts, addCheckout } from '@/lib/content'

export async function GET(_request: Request): Promise<NextResponse> {
  const checkouts = await getCheckouts()
  return NextResponse.json(checkouts)
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json()
  const entry = {
    name: body.name,
    tasksCompleted: body.tasksCompleted,
    tasksTotal: body.tasksTotal,
    date: new Date().toISOString(),
  }
  await addCheckout(entry)
  return NextResponse.json(entry, { status: 201 })
}
