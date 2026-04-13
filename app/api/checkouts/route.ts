import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCheckouts, addCheckout } from '@/lib/content'
import { sendCheckoutEmail } from '@/lib/email'

const CheckoutBodySchema = z.object({
  name: z.string().min(1),
  tasksCompleted: z.number().int().min(0),
  tasksTotal: z.number().int().min(0),
  notes: z.string().optional(),
})

export async function GET(_request: Request): Promise<NextResponse> {
  const checkouts = await getCheckouts()
  return NextResponse.json(checkouts)
}

export async function POST(request: Request): Promise<NextResponse> {
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = CheckoutBodySchema.safeParse(rawBody)
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid request body', details: result.error.flatten() }, { status: 400 })
  }

  const { name, tasksCompleted, tasksTotal, notes } = result.data
  const entry = {
    name,
    tasksCompleted,
    tasksTotal,
    date: new Date().toISOString(),
    ...(notes ? { notes } : {}),
  }
  await addCheckout(entry)

  const emailResult = await sendCheckoutEmail(entry)
  return NextResponse.json({ ...entry, emailSent: emailResult.ok }, { status: 201 })
}
