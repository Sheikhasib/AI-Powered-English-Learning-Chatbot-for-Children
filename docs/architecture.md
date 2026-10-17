# Architecture

Pip is one Next.js 16 app on Vercel. A deterministic TypeScript engine decides what to teach and how Pip should behave; the LLM only turns that decision into one short, warm spoken line.

## 1. System context

```mermaid
flowchart LR
  child([Child 3 to 6<br/>tablet or phone]) -->|taps cards, talks| browser
  parent([Grown-up]) -->|hold + sum gate| browser

  subgraph browser[Browser]
    ui[Child UI<br/>React 19 + Motion]
    speech[Web Speech API<br/>speech in and out, on device]
  end

  subgraph vercel[Vercel, region sin1]
    chat["/api/chat<br/>(the one hot path)"]
    profile["/api/profile"]
    metrics["/api/metrics"]
    engine[Engine + safety<br/>pure TypeScript]
  end

  db[(Prisma Postgres)]
  redis[(Upstash Redis<br/>rate limit)]
  llm[Groq<br/>openai/gpt-oss-20b]

  ui <--> speech
  ui -->|stream| chat
  ui --> profile
  ui --> metrics
  chat --> engine
  chat -->|1 read| db
  chat -->|after response: writes| db
  chat --> redis
  chat -->|1 call, streamed| llm
  profile --> db
  metrics --> db
```

Audio never leaves the device: the browser transcribes speech and speaks Pip's lines. Only text reaches the server.

## 2. One child turn (`POST /api/chat`)

```mermaid
sequenceDiagram
  autonumber
  participant UI as Child UI
  participant API as /api/chat
  participant RL as Upstash
  participant G as inputGuard
  participant DB as Postgres
  participant E as Engine
  participant L as LLM (Groq)
  participant OG as outputGuard

  UI->>API: card tap / words / mood / break
  API->>RL: sliding window, device + IP
  API->>G: redact PII, redirect unsafe, disclosure script
  Note over API,G: t_guard
  API->>DB: loadTurnContext (one query)
  Note over API,DB: t_context
  API->>E: grade, mastery, signals, detectMode, level, next activity, SEL
  Note over API,E: t_engine (under 5 ms)
  API-->>UI: data-turn part first: mode, mood, cards, fallback line
  API->>L: streamText (fixed system prompt, decision, context under 400 tokens)
  L-->>OG: tokens, checked sentence by sentence
  OG-->>UI: Pip's line streams, speech starts on first sentence
  Note over API,L: t_first_token. No token within 1200 ms: abort, stream fallback line
  API-)DB: after(): persist turn, mastery, timings, mood classification
```

The picture cards and the scripted line are on screen before the LLM answers, so even a slow or failed LLM call never leaves the child waiting.

## 3. Mode state machine

```mermaid
stateDiagram-v2
  [*] --> Learn: check-in happy / okay
  [*] --> Support: check-in sad / angry / scared
  [*] --> Calm: check-in tired

  Learn --> Support: sad words or 3 misses in a row
  Learn --> Calm: break button, 15 min, tired
  Learn --> Play: refusal, fast guessing, long silence
  Learn --> Chat: question, story, greeting
  Learn --> Chat: 4 Learn turns in a row

  Chat --> Learn: next turn, no signal
  Play --> Learn: next turn, no signal

  Support --> Play: after at least 2 turns, child ready
  Support --> Chat: after at least 2 turns, child ready
  Calm --> Play: child ready
  Calm --> Chat: child ready
```

Rules run in priority order (feelings first, teaching last). Support and Calm hold for at least two turns, and leaving Support never goes straight back to teaching.

## 4. Data model

```mermaid
erDiagram
  Device ||--o{ Profile : has
  Profile ||--o{ SkillState : tracks
  Profile ||--o{ Session : has
  Session ||--o{ Turn : contains
  Profile ||--o{ Turn : has

  Device { string id "anonymous cookie uuid" }
  Profile { string nickname "max 12" enum ageBand string avatar strings interests int level int stars string summary }
  SkillState { string skillId float mastery int attempts int streak datetime dueAt }
  Session { datetime startedAt enum checkIn datetime endedAt }
  Turn { string childInput "redacted" string botReply enum mode string modeReason enum mood bool fallback string safetyFlag int tFirstToken int tTotal }
```

Every child relation cascades, so "Delete all data" in the grown-up corner removes every row for that profile.
