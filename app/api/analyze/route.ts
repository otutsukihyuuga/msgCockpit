import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { analyzeEmail } from '@/lib/gemini'
import type { AnalyzedEmail } from '@/lib/types'

export async function POST(request: NextRequest) {
  const sessionId = request.headers.get('x-session-id')
  const geminiKey = request.headers.get('x-gemini-key') || process.env.GEMINI_API_KEY

  if (!sessionId) return NextResponse.json({ error: 'Missing session ID' }, { status: 400 })
  if (!geminiKey) return NextResponse.json({ error: 'Missing Gemini API key' }, { status: 400 })

  const body = await request.json() as { from?: string; subject?: string; body?: string }
  const { from = '', subject = '', body: emailBody = '' } = body

  if (!emailBody.trim()) {
    return NextResponse.json({ error: 'Email body is required' }, { status: 400 })
  }

  try {
    const analysis = await analyzeEmail(from, subject, emailBody, geminiKey)

    const email: AnalyzedEmail = {
      id: crypto.randomUUID(),
      from: from || 'Unknown Sender',
      subject: subject || 'No Subject',
      body: emailBody,
      analyzedAt: new Date().toISOString(),
      isQuarantined: analysis.phishingScore >= 7,
      ...analysis,
    }

    store.addEmail(sessionId, email)

    return NextResponse.json({ email })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const sessionId = request.headers.get('x-session-id')
  if (!sessionId) return NextResponse.json({ error: 'Missing session ID' }, { status: 400 })

  const emails = store.getEmails(sessionId)
  return NextResponse.json({ emails })
}

export async function PATCH(request: NextRequest) {
  const sessionId = request.headers.get('x-session-id')
  if (!sessionId) return NextResponse.json({ error: 'Missing session ID' }, { status: 400 })

  const { emailId, action } = await request.json() as {
    emailId: string
    action: 'quarantine' | 'unquarantine' | 'delete'
  }

  if (action === 'quarantine') store.quarantineEmail(sessionId, emailId)
  else if (action === 'unquarantine') store.unquarantineEmail(sessionId, emailId)
  else if (action === 'delete') store.removeEmail(sessionId, emailId)

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const sessionId = request.headers.get('x-session-id')
  if (!sessionId) return NextResponse.json({ error: 'Missing session ID' }, { status: 400 })

  store.clearEmails(sessionId)
  return NextResponse.json({ success: true })
}
