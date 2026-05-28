'use client'

import { useState } from 'react'
import { ClipboardPaste, Loader2, Scan, X, ChevronDown, ChevronUp } from 'lucide-react'

interface EmailPasteFormProps {
  sessionId: string
  geminiKey: string
  onAnalyzed: () => void
}

const EXAMPLE_PHISHING = `From: security-alert@paypa1.com
Subject: Urgent: Your account has been limited

Dear Customer,

We have detected unusual activity on your PayPal account. Your account has been temporarily limited.

To restore your account, please verify your information immediately:
http://paypal-secure-login.suspicious-domain.xyz/verify

You must complete this within 24 hours or your account will be permanently suspended.

PayPal Security Team`

const EXAMPLE_LEGIT = `From: sarah.johnson@company.com
Subject: Q3 Budget Review - Need your input by Friday

Hi team,

Hope everyone's doing well! I'm putting together the Q3 budget review and need input from each department by Friday EOD.

Please fill out the attached spreadsheet with your team's projected expenses for Q4. Nothing too detailed needed — just rough estimates by category.

Let me know if you have any questions!

Best,
Sarah`

export function EmailPasteForm({ sessionId, geminiKey, onAnalyzed }: EmailPasteFormProps) {
  const [from, setFrom] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showFields, setShowFields] = useState(false)

  const loadExample = (type: 'phishing' | 'legit') => {
    const example = type === 'phishing' ? EXAMPLE_PHISHING : EXAMPLE_LEGIT
    const lines = example.split('\n')
    const fromLine = lines.find((l) => l.startsWith('From:'))
    const subjectLine = lines.find((l) => l.startsWith('Subject:'))
    const bodyStart = lines.findIndex((l) => l === '') + 1
    setFrom(fromLine?.replace('From:', '').trim() ?? '')
    setSubject(subjectLine?.replace('Subject:', '').trim() ?? '')
    setBody(lines.slice(bodyStart).join('\n').trim())
    setShowFields(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) { setError('Paste the email body to analyze'); return }
    if (!geminiKey) { setError('Add your Gemini API key first'); return }

    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
          'x-gemini-key': geminiKey,
        },
        body: JSON.stringify({ from, subject, body }),
      })
      const data = await res.json() as { email?: unknown; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Analysis failed')
      } else {
        setFrom('')
        setSubject('')
        setBody('')
        onAnalyzed()
      }
    } catch {
      setError('Network error — check your connection')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Optional header fields toggle */}
      <button
        type="button"
        onClick={() => setShowFields(!showFields)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2 text-xs text-slate-400 transition hover:border-slate-600 hover:text-slate-300"
      >
        <span>From / Subject (optional)</span>
        {showFields ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {showFields && (
        <div className="space-y-2">
          <input
            type="text"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="From: sender@example.com"
            className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
          />
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject: ..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
          />
        </div>
      )}

      {/* Main body textarea */}
      <div className="relative">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Paste the full email content here…

You can paste the raw email body, or the entire email including headers — Gemini will figure it out."
          rows={10}
          className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm leading-relaxed text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
        />
        {body && (
          <button
            type="button"
            onClick={() => setBody('')}
            className="absolute right-3 top-3 rounded-md p-1 text-slate-500 transition hover:text-slate-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !body.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing with Gemini…
          </>
        ) : (
          <>
            <Scan className="h-4 w-4" />
            Analyze Email
          </>
        )}
      </button>

      {/* Example loaders */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-xs text-slate-600">Try an example:</span>
        <button
          type="button"
          onClick={() => loadExample('phishing')}
          className="flex items-center gap-1 rounded-md border border-red-500/20 bg-red-500/5 px-2 py-1 text-[11px] text-red-400 transition hover:bg-red-500/10"
        >
          <ClipboardPaste className="h-3 w-3" /> Phishing
        </button>
        <button
          type="button"
          onClick={() => loadExample('legit')}
          className="flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 text-[11px] text-emerald-400 transition hover:bg-emerald-500/10"
        >
          <ClipboardPaste className="h-3 w-3" /> Legitimate
        </button>
      </div>
    </form>
  )
}
