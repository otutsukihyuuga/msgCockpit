export interface AnalyzedEmail {
  id: string
  from: string
  subject: string
  body: string
  analyzedAt: string
  // Gemini analysis
  phishingScore: number
  phishingReason: string
  isActionable: boolean
  actionableReason: string
  summary: string
  isQuarantined: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}
