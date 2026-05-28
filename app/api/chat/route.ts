import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { chatWithInbox } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  const sessionId = request.headers.get('x-session-id')
  const geminiKey = request.headers.get('x-gemini-key') || process.env.GEMINI_API_KEY

  if (!sessionId) return NextResponse.json({ error: 'Missing session' }, { status: 400 })
  if (!geminiKey) return NextResponse.json({ error: 'Missing Gemini API key' }, { status: 400 })

  const { question } = await request.json() as { question: string }
  if (!question?.trim()) return NextResponse.json({ error: 'Empty question' }, { status: 400 })

  const emails = store.getEmails(sessionId)
  const history = store.getChatHistory(sessionId)

  store.appendChat(sessionId, {
    role: 'user',
    content: question,
    timestamp: new Date().toISOString(),
  })

  const answer = await chatWithInbox(question, emails, history, geminiKey)

  store.appendChat(sessionId, {
    role: 'assistant',
    content: answer,
    timestamp: new Date().toISOString(),
  })

  return NextResponse.json({ answer, history: store.getChatHistory(sessionId) })
}

export async function DELETE(request: NextRequest) {
  const sessionId = request.headers.get('x-session-id')
  if (!sessionId) return NextResponse.json({ error: 'Missing session' }, { status: 400 })
  store.clearChatHistory(sessionId)
  return NextResponse.json({ success: true })
}
