# Pip: English buddy for children under 7

Pip is a friendly owl who teaches English to children aged 3 to 6. It talks and listens, shows big picture cards instead of text, notices how the child feels, and switches between learning, chatting, playing, comforting and calming down. Replies arrive in under 2 seconds.

**Live:** https://pip-english-buddy.vercel.app

<!-- screenshot: docs/screenshot.png -->

## The idea in one line

**The engine teaches, the LLM talks.** Levels, mastery, activity choice, mode switching and safety are deterministic TypeScript, covered by tests. The language model only turns the engine's decision into one short, warm spoken line. That makes progress explainable, output safe, and latency predictable.

## How it meets the brief

| Requirement | What Pip does |
|---|---|
| Progressive learning (L1 to L3) | L1 sounds and letters, L2 words, L3 sentences. Mastery is tracked per skill; a level unlocks when 80% of its skills are mastered. Hints after 2 misses, an easier version after 3, spaced reviews of mastered skills. |
| Mode and mood detection | Five modes (Learn, Chat, Play, Support, Calm) chosen each turn by priority rules over the child's words, taps, timing and history, with hysteresis so Pip doesn't flip-flop. Pip's face and colours change with the mode. |
| Social and emotional learning | A feelings check-in every session, effort-based praise, brave-try stars, breathing and naming-feelings activities, kindness and curiosity questions. No streak loss, no timers, no "wrong". |
| Context-aware replies | Each turn loads the profile, skill states, session and last 6 turns in one query, plus a rolling summary, and uses the child's nickname and interests. |
| Latency under 2 s | One DB read, no blocking writes, one LLM call. Picture cards and a scripted line are sent before the first token; if the model is slow, Pip uses the scripted line. |
| Child safety | No personal data, input and output guards, a fixed script for disclosures, a parental gate, and real deletion. |

## Measured latency

From the live URL (see [docs/latency.md](docs/latency.md)):

| Metric | p50 | p95 |
|---|---|---|
| First token | 701 ms | 1556 ms |
| Full reply | 742 ms | 1595 ms |
| Fallback rate | 23.3% | |

30 live turns from Dhaka against the Singapore deployment. Cards and a scripted line are on screen before the first token.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript strict |
| UI | Tailwind CSS 4, shadcn/ui restyled for children, Motion, Lucide, Andika font |
| LLM | Vercel AI SDK with `@ai-sdk/openai-compatible`, Groq `openai/gpt-oss-20b` |
| Voice | Browser Web Speech API (speech in and out on the device) |
| Database | Prisma Postgres with Prisma ORM 7 |
| Rate limiting | Upstash Redis with `@upstash/ratelimit` |
| Validation | Zod 4 |
| Tests | Vitest, Playwright |
| Hosting | Vercel, region sin1 |

## Docs

- [Architecture](docs/architecture.md): system context, the chat sequence, the mode state machine, the data model.
- [System design](docs/system-design.md): requirements, components, API, latency budget, safety, scaling, trade-offs.
- [Latency](docs/latency.md): method and measurements.

## Run it locally

```bash
git clone https://github.com/Sheikhasib/ai-powered-english-learning-chatbot-for-children.git
cd ai-powered-english-learning-chatbot-for-children
npm install
cp .env.example .env.local   # or: vercel link && vercel env pull .env.local
npm run db:push
npm run dev
```

Open http://localhost:3000. Use Chrome or Edge for speech recognition; everything also works by tapping.

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Prisma Postgres connection string |
| `LLM_API_KEY` | LLM key, server only (a free Groq key works) |
| `LLM_BASE_URL` | OpenAI-compatible base URL, default `https://api.groq.com/openai/v1` |
| `LLM_MODEL` | Model id, default `openai/gpt-oss-20b` |
| `LLM_FIRST_TOKEN_TIMEOUT_MS` | Fallback trigger, default `1200` |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Upstash Redis for rate limiting |
| `PARENT_GATE_SECRET` | Signs the grown-up corner cookie (16+ characters) |

## Deploy on Vercel

1. Import the repo into Vercel.
2. Add Upstash Redis from the Vercel Marketplace (prefix `KV`, region Singapore).
3. Create a Prisma Postgres database in the same region and add `DATABASE_URL`.
4. Add the LLM and gate variables, marking secrets as Sensitive.
5. `vercel.json` pins functions to `sin1` so they sit next to the database and Redis.
6. Deploy, then run `npm run db:push` once against the production database.
7. Optional: `npm run db:seed` adds a sample child ("Mina") so the grown-up corner has data to explore. Its timings are made up and are labelled "Sample data"; they are never counted in the latency numbers.

## Tests

453 Vitest tests cover the curriculum, learning engine, mode detector, SEL, safety guards, prompt composer, chat route (with a mocked model), grown-up corner and UI helpers. GitHub Actions runs every check on each push.

```bash
npm run typecheck
npm run lint
npm run test       # Vitest: engine, detector, SEL, safety, prompt
npm run test:e2e   # Playwright smoke test
npm run build
```

## Project structure

```
src/
  app/            child screens, grown-up corner, API routes
  engine/         curriculum, mastery, progression, picker, mode detector, SEL (pure)
  safety/         input and output guards (pure)
  llm/            provider, system prompt, prompt composer, fallback lines
  server/         Prisma client, repositories, rate limit, timing, logger
  components/     Pip, picture cards, speech bubble, mic, mood bar
  hooks/          useSpeech, useBuddyChat
tests/            Vitest suites mirroring engine and safety
docs/             architecture, system design, latency
```

## Trade-offs

- Rule-based mode detection is explainable, instant and testable, but misses subtle cues; an after-reply mood classification adds a second signal.
- Browser speech is free and private, but quality varies by browser, so every action also works by tap.
- Using the LLM only for wording gives up some open-ended conversation in exchange for consistent teaching, safe output and guaranteed speed.
- A free Groq key keeps the demo free; the provider is one adapter, so a paid model is a config change.

## Next steps

Parent-chosen word lists, pronunciation feedback from recognition confidence, an offline mode, and a teacher view.
