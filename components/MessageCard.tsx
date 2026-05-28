'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
  Shield,
  ShieldAlert,
  Trash2,
} from 'lucide-react'
import { PhishingBadge } from './PhishingBadge'
import type { AnalyzedEmail } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

interface MessageCardProps {
  email: AnalyzedEmail
  onQuarantine: (id: string) => void
  onUnquarantine: (id: string) => void
  onDelete: (id: string) => void
}

export function MessageCard({ email, onQuarantine, onUnquarantine, onDelete }: MessageCardProps) {
  const [expanded, setExpanded] = useState(false)

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(email.analyzedAt), { addSuffix: true })
    } catch {
      return ''
    }
  })()

  const borderColor =
    email.phishingScore >= 8 ? 'border-red-500/50 hover:border-red-500/70' :
    email.phishingScore >= 6 ? 'border-orange-500/40 hover:border-orange-500/60' :
    email.isActionable   ? 'border-cyan-500/40 hover:border-cyan-500/60' :
                           'border-slate-700/60 hover:border-slate-600'

  const bgColor =
    email.phishingScore >= 8 ? 'bg-red-950/20' :
    email.phishingScore >= 6 ? 'bg-orange-950/10' :
    email.isActionable   ? 'bg-cyan-950/10' :
                           'bg-slate-800/20'

  return (
    <div className={`rounded-xl border transition-all duration-200 ${borderColor} ${bgColor}`}>
      <div className="cursor-pointer p-4" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-semibold text-slate-200">
                {email.from}
              </span>
              {email.isActionable && !email.isQuarantined && (
                <span className="flex items-center gap-1 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
                  <Zap className="h-2.5 w-2.5" /> ACTION NEEDED
                </span>
              )}
              {email.isQuarantined && (
                <span className="flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400">
                  <ShieldAlert className="h-2.5 w-2.5" /> QUARANTINED
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-sm text-slate-300">{email.subject}</p>
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-400">
              {email.summary}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <PhishingBadge score={email.phishingScore} size="sm" showLabel={false} />
            <span className="text-xs text-slate-500">{timeAgo}</span>
            {expanded
              ? <ChevronUp className="h-4 w-4 text-slate-500" />
              : <ChevronDown className="h-4 w-4 text-slate-500" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-700/50 px-4 pb-4 pt-3 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            {/* Phishing analysis */}
            <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
                <span className="text-xs font-semibold text-slate-300">Phishing Analysis</span>
                <PhishingBadge score={email.phishingScore} size="sm" />
              </div>
              <p className="text-xs leading-relaxed text-slate-400">{email.phishingReason}</p>
            </div>

            {/* Action required */}
            {email.isActionable ? (
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-900/10 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-xs font-semibold text-cyan-300">Action Required</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-300">{email.actionableReason}</p>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-500">No Action Needed</span>
                </div>
                <p className="text-xs text-slate-500">This email does not require a response or action.</p>
              </div>
            )}
          </div>

          {/* Email body */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-3">
            <p className="mb-2 text-xs font-semibold text-slate-500">Original Email</p>
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-400 line-clamp-6">
              {email.body}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(email.id) }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700/50 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-slate-600 hover:text-slate-300"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
            {!email.isQuarantined ? (
              <button
                onClick={(e) => { e.stopPropagation(); onQuarantine(email.id) }}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
              >
                <ShieldAlert className="h-3.5 w-3.5" /> Move to Quarantine
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onUnquarantine(email.id) }}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
              >
                <Shield className="h-3.5 w-3.5" /> Restore
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
