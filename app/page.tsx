'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import {
  Shield,
  ShieldAlert,
  Zap,
  Inbox,
  AlertTriangle,
  CheckCircle2,
  LayoutDashboard,
  Trash2,
} from 'lucide-react'
import { GeminiKeyInput } from '@/components/GeminiKeyInput'
import { EmailPasteForm } from '@/components/EmailPasteForm'
import { MessageCard } from '@/components/MessageCard'
import { ChatPanel } from '@/components/ChatPanel'
import { DailyDigest } from '@/components/DailyDigest'
import type { AnalyzedEmail } from '@/lib/types'

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('cockpit-session-id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('cockpit-session-id', id)
  }
  return id
}

type Tab = 'all' | 'actionable' | 'quarantine'

function CockpitPage() {
  const [sessionId, setSessionId] = useState('')
  const [geminiKey, setGeminiKey] = useState('')
  const [envKeyConfigured, setEnvKeyConfigured] = useState(false)
  const [emails, setEmails] = useState<AnalyzedEmail[]>([])
  const [tab, setTab] = useState<Tab>('all')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    const id = getOrCreateSessionId()
    setSessionId(id)
    setGeminiKey(localStorage.getItem('gemini-key') ?? '')
    fetch('/api/config')
      .then((r) => r.json())
      .then((d: { hasGeminiKey?: boolean }) => { if (d.hasGeminiKey) setEnvKeyConfigured(true) })
      .catch(() => {})
  }, [])

  const fetchEmails = useCallback(async (sid: string) => {
    if (!sid) return
    try {
      const res = await fetch('/api/analyze', { headers: { 'x-session-id': sid } })
      const data = await res.json() as { emails?: AnalyzedEmail[] }
      if (data.emails) setEmails(sortEmails(data.emails))
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    if (sessionId) fetchEmails(sessionId)
  }, [sessionId, fetchEmails])

  const handleGeminiKeyChange = (key: string) => {
    setGeminiKey(key)
    localStorage.setItem('gemini-key', key)
  }

  const handleAnalyzed = async () => {
    await fetchEmails(sessionId)
    showToast('success', 'Email analyzed!')
    setTab('all')
  }

  const handleQuarantine = async (id: string) => {
    await fetch('/api/analyze', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId },
      body: JSON.stringify({ emailId: id, action: 'quarantine' }),
    })
    setEmails((prev) => sortEmails(prev.map((e) => (e.id === id ? { ...e, isQuarantined: true } : e))))
    showToast('success', 'Moved to quarantine')
  }

  const handleUnquarantine = async (id: string) => {
    await fetch('/api/analyze', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId },
      body: JSON.stringify({ emailId: id, action: 'unquarantine' }),
    })
    setEmails((prev) => sortEmails(prev.map((e) => (e.id === id ? { ...e, isQuarantined: false } : e))))
    showToast('success', 'Restored from quarantine')
  }

  const handleDelete = async (id: string) => {
    await fetch('/api/analyze', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId },
      body: JSON.stringify({ emailId: id, action: 'delete' }),
    })
    setEmails((prev) => prev.filter((e) => e.id !== id))
  }

  const handleClearAll = async () => {
    await fetch('/api/analyze', { method: 'DELETE', headers: { 'x-session-id': sessionId } })
    setEmails([])
    showToast('success', 'All emails cleared')
  }

  // Derived
  const safeEmails = emails.filter((e) => !e.isQuarantined)
  const quarantinedEmails = emails.filter((e) => e.isQuarantined)
  const actionableEmails = safeEmails.filter((e) => e.isActionable)

  const displayEmails =
    tab === 'actionable' ? actionableEmails :
    tab === 'quarantine' ? quarantinedEmails :
    safeEmails

  const highRiskCount = emails.filter((e) => e.phishingScore >= 7).length

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-2xl transition-all ${
          toast.type === 'success'
            ? 'border-emerald-500/40 bg-emerald-950/90 text-emerald-300'
            : 'border-red-500/40 bg-red-950/90 text-red-300'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 className="h-4 w-4" />
            : <AlertTriangle className="h-4 w-4" />}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/70 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20">
            <LayoutDashboard className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">MESSAGE COCKPIT</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">
              AI Phishing Detection
            </p>
          </div>
        </div>

        {emails.length > 0 && (
          <div className="hidden items-center gap-6 md:flex">
            <StatPill icon={<Inbox className="h-3.5 w-3.5" />} label="Analyzed" value={emails.length} color="text-slate-300" />
            <StatPill icon={<Zap className="h-3.5 w-3.5" />} label="Action Items" value={actionableEmails.length} color="text-cyan-400" />
            <StatPill icon={<ShieldAlert className="h-3.5 w-3.5" />} label="High Risk" value={highRiskCount} color="text-red-400" />
            <StatPill icon={<Shield className="h-3.5 w-3.5" />} label="Quarantined" value={quarantinedEmails.length} color="text-orange-400" />
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — input + settings */}
        <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-r border-slate-800 bg-slate-900/30 p-4">
          <GeminiKeyInput value={geminiKey} onChange={handleGeminiKeyChange} envKeyConfigured={envKeyConfigured} />

          {(geminiKey || envKeyConfigured) ? (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Analyze an Email
              </h3>
              <EmailPasteForm
                sessionId={sessionId}
                geminiKey={geminiKey}
                onAnalyzed={handleAnalyzed}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-700 p-4 text-center">
              <Shield className="mx-auto mb-2 h-8 w-8 text-slate-700" />
              <p className="text-xs text-slate-500">Add your Gemini API key above to start analyzing emails</p>
            </div>
          )}

          {emails.length > 0 && (geminiKey || envKeyConfigured) && (
            <DailyDigest sessionId={sessionId} geminiKey={geminiKey} emailCount={emails.length} />
          )}

          {/* Risk legend */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600">Risk Scale</p>
            <div className="space-y-1.5">
              {[
                { range: '1–3', label: 'Safe', color: 'text-emerald-400', dot: 'bg-emerald-500' },
                { range: '4–5', label: 'Low risk', color: 'text-blue-400', dot: 'bg-blue-400' },
                { range: '6–7', label: 'Suspicious', color: 'text-yellow-400', dot: 'bg-yellow-500' },
                { range: '8–10', label: 'Phishing →Quarantine', color: 'text-red-400', dot: 'bg-red-500' },
              ].map((item) => (
                <div key={item.range} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${item.dot}`} />
                  <span className="text-xs text-slate-500">{item.range}</span>
                  <span className={`text-xs ${item.color}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main cockpit */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {emails.length === 0 ? (
            <EmptyState hasKey={!!geminiKey || envKeyConfigured} />
          ) : (
            <>
              {/* Tabs */}
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/20 px-4 py-2">
                <div className="flex items-center gap-1">
                  <TabBtn active={tab === 'all'} onClick={() => setTab('all')} count={safeEmails.length}>
                    <Inbox className="h-3.5 w-3.5" /> All
                  </TabBtn>
                  <TabBtn active={tab === 'actionable'} onClick={() => setTab('actionable')} count={actionableEmails.length} highlight>
                    <Zap className="h-3.5 w-3.5" /> Action Needed
                  </TabBtn>
                  <TabBtn active={tab === 'quarantine'} onClick={() => setTab('quarantine')} count={quarantinedEmails.length} danger>
                    <ShieldAlert className="h-3.5 w-3.5" /> Quarantine
                  </TabBtn>
                </div>
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700/50 px-3 py-1.5 text-xs text-slate-500 transition hover:border-red-500/30 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear All
                </button>
              </div>

              {/* Email list */}
              <div className="flex-1 overflow-y-auto p-4">
                {displayEmails.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
                    <Shield className="h-10 w-10 text-slate-700" />
                    <p className="text-sm text-slate-400">
                      {tab === 'quarantine' ? 'No quarantined emails — looks clean!' :
                       tab === 'actionable' ? 'No action items detected' :
                       'No emails here'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {tab === 'all' && actionableEmails.length > 0 && (
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
                        <Zap className="h-3.5 w-3.5" />
                        {actionableEmails.length} action item{actionableEmails.length > 1 ? 's' : ''} pinned to top
                      </p>
                    )}
                    {displayEmails.map((email) => (
                      <MessageCard
                        key={email.id}
                        email={email}
                        onQuarantine={handleQuarantine}
                        onUnquarantine={handleUnquarantine}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>

        {/* Right panel — Chat */}
        <aside className="hidden w-80 shrink-0 border-l border-slate-800 xl:flex xl:flex-col">
          <div className="flex-1 overflow-hidden p-3">
            <ChatPanel
              sessionId={sessionId}
              geminiKey={geminiKey}
              hasMessages={emails.length > 0}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}

function sortEmails(emails: AnalyzedEmail[]): AnalyzedEmail[] {
  const safe = emails.filter((e) => !e.isQuarantined)
  const quarantined = emails.filter((e) => e.isQuarantined)
  const actionable = safe.filter((e) => e.isActionable).sort(byDate)
  const regular = safe.filter((e) => !e.isActionable).sort(byDate)
  return [...actionable, ...regular, ...quarantined.sort((a, b) => b.phishingScore - a.phishingScore)]
}

function byDate(a: AnalyzedEmail, b: AnalyzedEmail) {
  return new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
}

function StatPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={color}>{icon}</span>
      <div>
        <p className={`text-sm font-bold leading-none ${color}`}>{value}</p>
        <p className="text-[10px] text-slate-500">{label}</p>
      </div>
    </div>
  )
}

function TabBtn({
  active, onClick, count, children, highlight, danger,
}: {
  active: boolean; onClick: () => void; count: number
  children: React.ReactNode; highlight?: boolean; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
        active
          ? danger ? 'border-red-500/40 bg-red-500/10 text-red-300'
          : highlight ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
          : 'border-slate-600 bg-slate-800/60 text-slate-200'
          : 'border-transparent text-slate-500 hover:text-slate-300'
      }`}
    >
      {children}
      <span className="rounded-full bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-bold">{count}</span>
    </button>
  )
}

function EmptyState({ hasKey }: { hasKey: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/5">
        <Shield className="h-10 w-10 text-cyan-400/50" />
      </div>
      <div className="max-w-sm">
        <h2 className="mb-2 text-xl font-bold text-slate-200">Message Cockpit</h2>
        <p className="text-sm leading-relaxed text-slate-400">
          Paste any suspicious email into the form on the left. Gemini AI will score its phishing risk
          from 1–10, explain the red flags, and tell you if any action is needed.
        </p>
      </div>
      {!hasKey && (
        <p className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-2 text-xs text-yellow-400">
          Add your Gemini API key in the sidebar to get started
        </p>
      )}
      {hasKey && (
        <p className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-2 text-xs text-cyan-400">
          Paste an email in the sidebar — or try one of the examples!
        </p>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <Suspense>
      <CockpitPage />
    </Suspense>
  )
}
