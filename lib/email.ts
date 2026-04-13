import type { CheckoutEntry } from './types'

interface EmailResult {
  ok: boolean
  error?: string
}

export async function sendCheckoutEmail(entry: CheckoutEntry): Promise<EmailResult> {
  const apiKey = process.env.BREVO_API_KEY
  const to = process.env.CHECKOUT_EMAIL_TO

  if (!apiKey || !to) {
    return { ok: false, error: 'BREVO_API_KEY or CHECKOUT_EMAIL_TO not configured' }
  }

  const date = new Date(entry.date).toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const notesBlock = entry.notes
    ? `\n\nNotizen:\n${entry.notes}`
    : ''

  const textContent = [
    `Abreise von ${entry.name}`,
    `Datum: ${date}`,
    `Aufgaben: ${entry.tasksCompleted} / ${entry.tasksTotal} erledigt`,
    notesBlock,
  ].join('\n')

  const htmlContent = [
    `<h2>Abreise von ${escapeHtml(entry.name)}</h2>`,
    `<p><strong>Datum:</strong> ${date}</p>`,
    `<p><strong>Aufgaben:</strong> ${entry.tasksCompleted} / ${entry.tasksTotal} erledigt</p>`,
    entry.notes
      ? `<p><strong>Notizen:</strong></p><pre style="white-space:pre-wrap;font-family:monospace;background:#f5f5f5;padding:12px;border-radius:4px">${escapeHtml(entry.notes)}</pre>`
      : '',
  ].join('\n')

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: 'Doeschnitz Checkout', email: process.env.BREVO_SENDER_EMAIL || to },
        to: [{ email: to }],
        subject: `Abreise: ${entry.name} — ${date}`,
        textContent,
        htmlContent,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      return { ok: false, error: `Brevo API ${res.status}: ${body}` }
    }

    return { ok: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, error: message }
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
