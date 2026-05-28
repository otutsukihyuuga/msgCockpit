import type { AnalyzedEmail, ChatMessage } from './types'

declare global {
  // eslint-disable-next-line no-var
  var __cockpitStore: {
    emails: Map<string, AnalyzedEmail[]>
    chatHistory: Map<string, ChatMessage[]>
  } | undefined
}

function getStore() {
  if (!global.__cockpitStore) {
    global.__cockpitStore = {
      emails: new Map(),
      chatHistory: new Map(),
    }
  }
  return global.__cockpitStore
}

export const store = {
  getEmails(sessionId: string): AnalyzedEmail[] {
    return getStore().emails.get(sessionId) ?? []
  },

  addEmail(sessionId: string, email: AnalyzedEmail) {
    const s = getStore()
    const existing = s.emails.get(sessionId) ?? []
    s.emails.set(sessionId, [email, ...existing])
  },

  removeEmail(sessionId: string, emailId: string) {
    const s = getStore()
    const existing = s.emails.get(sessionId) ?? []
    s.emails.set(sessionId, existing.filter((e) => e.id !== emailId))
  },

  clearEmails(sessionId: string) {
    getStore().emails.delete(sessionId)
  },

  quarantineEmail(sessionId: string, emailId: string) {
    const s = getStore()
    s.emails.set(
      sessionId,
      (s.emails.get(sessionId) ?? []).map((e) =>
        e.id === emailId ? { ...e, isQuarantined: true } : e
      )
    )
  },

  unquarantineEmail(sessionId: string, emailId: string) {
    const s = getStore()
    s.emails.set(
      sessionId,
      (s.emails.get(sessionId) ?? []).map((e) =>
        e.id === emailId ? { ...e, isQuarantined: false } : e
      )
    )
  },

  getChatHistory(sessionId: string): ChatMessage[] {
    return getStore().chatHistory.get(sessionId) ?? []
  },

  appendChat(sessionId: string, message: ChatMessage) {
    const s = getStore()
    const history = s.chatHistory.get(sessionId) ?? []
    s.chatHistory.set(sessionId, [...history, message])
  },

  clearChatHistory(sessionId: string) {
    getStore().chatHistory.delete(sessionId)
  },
}
