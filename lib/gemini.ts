import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AnalyzedEmail, ChatMessage } from './types'

function getModel(apiKey: string) {
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: 'gemini-3.5-flash' })
}

export interface AnalysisResult {
  phishingScore: number
  phishingReason: string
  isActionable: boolean
  actionableReason: string
  summary: string
}

export async function analyzeEmail(
  from: string,
  subject: string,
  body: string,
  apiKey: string
): Promise<AnalysisResult> {
  const model = getModel(apiKey)

  const prompt = `Analyze this email for phishing risk and actionability. Return ONLY valid JSON, no markdown fences.

From: ${from || 'Unknown'}
Subject: ${subject || 'No Subject'}
Body:
${body.substring(0, 4000)}

Return exactly this JSON structure:
{
  "phishingScore": <integer 1-10, where 1=definitely safe, 10=definite phishing>,
  "phishingReason": "<detailed explanation of specific signals — sender domain, urgency language, suspicious links, grammar, impersonation attempts, mismatched branding, etc. Be specific and educational.>",
  "isActionable": <true if this email requires the recipient to do something like reply/approve/click/schedule>,
  "actionableReason": "<what specific action is required, or empty string>",
  "summary": "<2-3 sentence conversational summary of what this email is about and what the sender wants>"
}`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()
  const clean = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim()
  const parsed = JSON.parse(clean) as Record<string, unknown>

  return {
    phishingScore: Math.max(1, Math.min(10, Number(parsed.phishingScore))),
    phishingReason: String(parsed.phishingReason ?? ''),
    isActionable: Boolean(parsed.isActionable),
    actionableReason: String(parsed.actionableReason ?? ''),
    summary: String(parsed.summary ?? ''),
  }
}

export async function generateDailyDigest(
  emails: AnalyzedEmail[],
  apiKey: string
): Promise<string> {
  if (emails.length === 0) return 'No emails analyzed yet.'

  const model = getModel(apiKey)

  const safe = emails.filter((e) => !e.isQuarantined)
  const quarantined = emails.filter((e) => e.isQuarantined)
  const actionable = safe.filter((e) => e.isActionable)

  const lines = emails
    .slice(0, 20)
    .map(
      (e) =>
        `- From: ${e.from} | Subject: ${e.subject} | Risk: ${e.phishingScore}/10 | Actionable: ${e.isActionable}`
    )
    .join('\n')

  const prompt = `Write a concise, friendly email digest for a busy professional.

Stats:
- Total analyzed: ${emails.length}
- Safe: ${safe.length}
- Quarantined (phishing risk): ${quarantined.length}
- Need action: ${actionable.length}

Emails:
${lines}

Write a 150-200 word conversational digest: quick overview, key action items, threats caught, closing note.`

  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}

export async function chatWithInbox(
  question: string,
  emails: AnalyzedEmail[],
  history: ChatMessage[],
  apiKey: string
): Promise<string> {
  const model = getModel(apiKey)

  const context = emails
    .slice(0, 30)
    .map(
      (e) =>
        `[${e.analyzedAt.slice(0, 10)}] From: ${e.from} | Subject: ${e.subject} | Risk: ${e.phishingScore}/10 | Actionable: ${e.isActionable} | Quarantined: ${e.isQuarantined}\nSummary: ${e.summary}`
    )
    .join('\n\n')

  const historyText = history
    .slice(-6)
    .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
    .join('\n')

  const prompt = `You are an inbox security assistant. The user has analyzed ${emails.length} email(s) for phishing risk.

ANALYZED EMAILS:
${context || 'No emails analyzed yet.'}

${historyText ? `CONVERSATION HISTORY:\n${historyText}\n` : ''}
User: ${question}

Be helpful, concise, and security-focused. You can explain why emails were flagged, identify patterns, suggest actions, or summarize findings.`

  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}
