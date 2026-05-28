'use client'

import { useState } from 'react'
import { Sparkles, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react'

interface DailyDigestProps {
  sessionId: string
  geminiKey: string
  emailCount: number
}

export function DailyDigest({ sessionId, geminiKey, emailCount }: DailyDigestProps) {
  const [digest, setDigest] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const fetchDigest = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/digest', {
        headers: {
          'x-session-id': sessionId,
          'x-gemini-key': geminiKey,
        },
      })
      const data = await res.json() as { digest?: string }
      if (data.digest) {
        setDigest(data.digest)
        setExpanded(true)
      }
    } catch {
      setDigest('Failed to generate digest. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClick = () => {
    if (!digest && !loading) fetchDigest()
    else setExpanded(!expanded)
  }

  return (
    <div className="rounded-xl border border-purple-500/30 bg-purple-500/5">
      <button className="flex w-full items-center justify-between px-4 py-3" onClick={handleClick}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-semibold text-purple-300">AI Digest</span>
          <span className="rounded-full bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-400">
            {emailCount} email{emailCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {digest && (
            <button
              onClick={(e) => { e.stopPropagation(); fetchDigest() }}
              className="rounded-md p-1 text-purple-400 transition hover:bg-purple-500/10"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
          ) : expanded ? (
            <ChevronUp className="h-4 w-4 text-purple-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-purple-400" />
          )}
        </div>
      </button>

      {expanded && digest && (
        <div className="border-t border-purple-500/20 px-4 pb-4 pt-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{digest}</p>
        </div>
      )}

      {!digest && !loading && (
        <div className="border-t border-purple-500/20 px-4 pb-3">
          <p className="text-xs text-slate-500">Click to generate an AI summary across all analyzed emails</p>
        </div>
      )}
    </div>
  )
}
