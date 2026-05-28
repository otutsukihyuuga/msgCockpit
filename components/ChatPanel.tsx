'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, Trash2, Loader2, Bot, User } from 'lucide-react'
import type { ChatMessage } from '@/lib/types'

interface ChatPanelProps {
  sessionId: string
  geminiKey: string
  hasMessages: boolean
}

const SUGGESTED = [
  'What needs my attention today?',
  'Any phishing threats I should know about?',
  'Summarize emails from this week',
  'Who emailed me most recently?',
  'What are the top action items?',
]

export function ChatPanel({ sessionId, geminiKey, hasMessages }: ChatPanelProps) {
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const send = async (question?: string) => {
    const q = (question ?? input).trim()
    if (!q || loading) return

    setInput('')
    setLoading(true)

    const userMsg: ChatMessage = { role: 'user', content: q, timestamp: new Date().toISOString() }
    setHistory((h) => [...h, userMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
          'x-gemini-key': geminiKey,
        },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json() as { answer?: string; error?: string }
      const answer = data.answer ?? data.error ?? 'No response'
      const assistantMsg: ChatMessage = { role: 'assistant', content: answer, timestamp: new Date().toISOString() }
      setHistory((h) => [...h, assistantMsg])
    } catch {
      const errMsg: ChatMessage = { role: 'assistant', content: 'Error communicating with AI. Check your Gemini key.', timestamp: new Date().toISOString() }
      setHistory((h) => [...h, errMsg])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const clearHistory = async () => {
    await fetch('/api/chat', {
      method: 'DELETE',
      headers: { 'x-session-id': sessionId, 'x-gemini-key': geminiKey },
    })
    setHistory([])
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-700/60 bg-slate-900/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-semibold text-slate-200">Inbox Assistant</span>
        </div>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-700/50 hover:text-slate-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10">
                <Bot className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
            <p className="text-center text-sm text-slate-400">
              {hasMessages
                ? "Ask me anything about your inbox"
                : "Connect a mailbox and load messages to start chatting"}
            </p>
            {hasMessages && (
              <div className="space-y-2">
                {SUGGESTED.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="w-full rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-300"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {history.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
              msg.role === 'user' ? 'bg-cyan-600' : 'border border-slate-600 bg-slate-800'
            }`}>
              {msg.role === 'user' ? (
                <User className="h-3.5 w-3.5 text-white" />
              ) : (
                <Bot className="h-3.5 w-3.5 text-cyan-400" />
              )}
            </div>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-cyan-600/20 text-slate-200'
                : 'border border-slate-700/50 bg-slate-800/60 text-slate-300'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-600 bg-slate-800">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
            </div>
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 px-3 py-2">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-700/50 p-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={hasMessages ? "Ask about your inbox..." : "Load messages first..."}
            disabled={!hasMessages || loading}
            className="flex-1 rounded-lg border border-slate-600 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 disabled:opacity-50"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading || !hasMessages}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-600 text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
