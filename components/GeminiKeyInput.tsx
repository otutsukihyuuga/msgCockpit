'use client'

import { useState } from 'react'
import { Key, Eye, EyeOff, CheckCircle, Server } from 'lucide-react'

interface GeminiKeyInputProps {
  value: string
  onChange: (key: string) => void
  envKeyConfigured?: boolean
}

export function GeminiKeyInput({ value, onChange, envKeyConfigured = false }: GeminiKeyInputProps) {
  const [visible, setVisible] = useState(false)
  const [input, setInput] = useState(value)

  const handleSave = () => onChange(input.trim())
  const isActive = envKeyConfigured || !!value

  return (
    <div className={`rounded-xl border p-4 ${isActive ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-cyan-500/30 bg-cyan-500/5'}`}>
      <div className="mb-2 flex items-center gap-2">
        <Key className="h-4 w-4 text-cyan-400" />
        <span className="text-sm font-semibold text-cyan-300">Gemini API Key</span>
        {envKeyConfigured && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <Server className="h-3 w-3" /> From .env
          </span>
        )}
        {!envKeyConfigured && value && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <CheckCircle className="h-3 w-3" /> Active
          </span>
        )}
      </div>

      {envKeyConfigured ? (
        <p className="text-xs text-slate-400">
          Key loaded from <code className="rounded bg-slate-800 px-1 py-0.5 text-emerald-400">.env</code> — ready to analyze.
          You can override it below if needed.
        </p>
      ) : (
        <p className="mb-3 text-xs text-slate-400">
          Get your free key at{' '}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
            className="text-cyan-400 underline hover:text-cyan-300">
            aistudio.google.com
          </a>
        </p>
      )}

      {!envKeyConfigured && (
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <input
              type={visible ? 'text' : 'password'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="AIzaSy..."
              className="w-full rounded-lg border border-slate-600 bg-slate-800/60 px-3 py-2 pr-10 font-mono text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
            />
            <button onClick={() => setVisible(!visible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button onClick={handleSave} disabled={!input.trim()}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40">
            Save
          </button>
        </div>
      )}
    </div>
  )
}
