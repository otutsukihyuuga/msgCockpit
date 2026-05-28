'use client'

interface PhishingBadgeProps {
  score: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function PhishingBadge({ score, showLabel = true, size = 'md' }: PhishingBadgeProps) {
  const level =
    score >= 8 ? 'critical' :
    score >= 6 ? 'high' :
    score >= 4 ? 'medium' :
    score >= 2 ? 'low' : 'safe'

  const config = {
    critical: { bg: 'bg-red-500/20', border: 'border-red-500/60', text: 'text-red-400', dot: 'bg-red-500', label: 'CRITICAL' },
    high:     { bg: 'bg-orange-500/20', border: 'border-orange-500/60', text: 'text-orange-400', dot: 'bg-orange-500', label: 'HIGH' },
    medium:   { bg: 'bg-yellow-500/20', border: 'border-yellow-500/60', text: 'text-yellow-400', dot: 'bg-yellow-500', label: 'MEDIUM' },
    low:      { bg: 'bg-blue-500/20', border: 'border-blue-500/60', text: 'text-blue-400', dot: 'bg-blue-400', label: 'LOW' },
    safe:     { bg: 'bg-emerald-500/20', border: 'border-emerald-500/60', text: 'text-emerald-400', dot: 'bg-emerald-500', label: 'SAFE' },
  }[level]

  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-mono font-semibold ${config.bg} ${config.border} ${config.text} ${sizeClass}`}>
      <span className={`inline-block rounded-full ${config.dot} ${size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2'}`} />
      <span>{score}/10</span>
      {showLabel && <span className="opacity-70">{config.label}</span>}
    </span>
  )
}
