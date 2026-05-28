import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { generateDailyDigest } from '@/lib/gemini'

export async function GET(request: NextRequest) {
  const sessionId = request.headers.get('x-session-id')
  const geminiKey = request.headers.get('x-gemini-key') || process.env.GEMINI_API_KEY

  if (!sessionId) return NextResponse.json({ error: 'Missing session' }, { status: 400 })
  if (!geminiKey) return NextResponse.json({ error: 'Missing Gemini API key' }, { status: 400 })

  const emails = store.getEmails(sessionId)
  const digest = await generateDailyDigest(emails, geminiKey)
  return NextResponse.json({ digest })
}
