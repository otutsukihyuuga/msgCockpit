# Message Cockpit

An AI-powered email security dashboard that analyzes pasted email content for phishing threats, scores risk on a 1–10 scale, flags actionable messages, and maintains a quarantine — all driven by Google's Gemini API.

---

## Features

| Feature | Details |
|---|---|
| **Phishing Risk Scoring** | Every email is scored 1–10 by Gemini, with a detailed explanation of specific red flags |
| **Auto Quarantine** | Emails scoring 7 or above are automatically quarantined (never deleted — always recoverable) |
| **Manual Quarantine** | Move or restore any email from quarantine with one click |
| **Actionable Bubbling** | Emails requiring a reply, approval, or action are always pinned to the top of the list |
| **Per-Email Summaries** | A 2–3 sentence conversational summary on every analyzed email |
| **AI Daily Digest** | One-click narrative summary across all analyzed emails |
| **Inbox Chat** | Ask natural language questions about your analyzed emails (e.g. "what needs my attention?") |
| **In-Memory Storage** | All data lives in server memory — nothing persisted to disk or a database |

---

## Tech Stack

- **Framework** — [Next.js 15](https://nextjs.org/) (App Router, API Routes)
- **AI** — [Google Gemini 2.0 Flash](https://ai.google.dev/) via `@google/generative-ai`
- **Styling** — [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons** — [Lucide React](https://lucide.dev/)
- **Language** — TypeScript throughout

---

## Project Structure

```
message-cockpit/
├── app/
│   ├── api/
│   │   ├── analyze/       # POST: analyze pasted email | GET: list emails | PATCH: quarantine/delete
│   │   ├── chat/          # POST: chat with inbox | DELETE: clear history
│   │   ├── config/        # GET: check if GEMINI_API_KEY is set in env
│   │   └── digest/        # GET: generate AI digest across all analyzed emails
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx           # Main cockpit dashboard
├── components/
│   ├── ChatPanel.tsx       # Conversational inbox assistant
│   ├── DailyDigest.tsx     # Collapsible AI digest panel
│   ├── EmailPasteForm.tsx  # Email input form with example presets
│   ├── GeminiKeyInput.tsx  # API key input (hidden when set via .env)
│   ├── MessageCard.tsx     # Expandable email card with risk details
│   └── PhishingBadge.tsx   # Color-coded risk score badge
└── lib/
    ├── gemini.ts           # All Gemini AI calls: analyze, digest, chat
    ├── store.ts            # Global in-memory store (emails + chat history)
    └── types.ts            # Shared TypeScript interfaces
```

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd message-cockpit
npm install
```

### 2. Set up environment variables

Copy the example file and fill in your Gemini key:

```bash
cp .env.local.example .env
```

Open `.env` and set:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get a free Gemini API key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How to Use

1. **Open the app** — the Gemini key input shows "From .env" if the key is already configured
2. **Paste an email** — use the form in the left sidebar. You can include the sender and subject, or just paste the raw body
3. **Try the examples** — click the **Phishing** or **Legitimate** buttons to load pre-filled demo emails
4. **Read the analysis** — click any message card to expand the full phishing breakdown and action details
5. **Switch tabs** — use **All**, **Action Needed**, and **Quarantine** tabs to filter your cockpit view
6. **Generate a digest** — click "AI Digest" in the sidebar for a narrative summary of everything analyzed
7. **Chat with your inbox** — ask the assistant in the right panel questions like "what's most urgent?" or "why was this flagged?"

---

## Phishing Risk Scale

| Score | Level | Meaning |
|---|---|---|
| 1–3 | Safe | No suspicious signals detected |
| 4–5 | Low Risk | Minor anomalies; proceed with normal caution |
| 6–7 | Suspicious | Notable red flags; verify before acting |
| 8–10 | Critical | High probability phishing — auto-quarantined |

---

## API Reference

### `POST /api/analyze`
Analyze a pasted email.

**Headers:** `x-session-id`, `x-gemini-key` (optional if `GEMINI_API_KEY` is in `.env`)

**Body:**
```json
{
  "from": "sender@example.com",
  "subject": "Your account has been limited",
  "body": "Full email text..."
}
```

**Response:**
```json
{
  "email": {
    "id": "uuid",
    "phishingScore": 9,
    "phishingReason": "Sender domain doesn't match PayPal...",
    "isActionable": true,
    "actionableReason": "User is asked to click a link to verify account",
    "summary": "Purports to be from PayPal asking you to verify...",
    "isQuarantined": true
  }
}
```

### `GET /api/analyze`
Retrieve all analyzed emails for the current session.

### `PATCH /api/analyze`
Quarantine, unquarantine, or delete an email.

**Body:** `{ "emailId": "uuid", "action": "quarantine" | "unquarantine" | "delete" }`

### `DELETE /api/analyze`
Clear all analyzed emails for the session.

### `POST /api/chat`
Ask a question about your analyzed emails.

**Body:** `{ "question": "What needs my attention?" }`

### `GET /api/digest`
Generate an AI narrative digest across all analyzed emails.

---

## Session Model

Each browser tab gets a UUID stored in `localStorage` (`cockpit-session-id`). This ID is sent with every API request as the `x-session-id` header. All emails and chat history are stored in server memory keyed by session ID. Data is lost on server restart — this is intentional for a zero-persistence demo.

---

## License

MIT
