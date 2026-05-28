import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Message Cockpit',
  description: 'Unified inbox with AI-powered phishing detection and conversational summaries',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080d1a] text-slate-200 antialiased">{children}</body>
    </html>
  )
}
