# 06: Chat API, prompt composer, safety and fallback

Priority: P0 · Depends on: 03, 04, 05

## Goal
`POST /api/chat` turns one child input into Pip's streamed reply plus the next activity cards, under 2 s end to end, safely.

## Files
- `src/app/api/chat/route.ts`: the handler (Node runtime, region pinned).
- `src/server/repositories/context.ts`: `loadTurnContext(profileId)`: one Prisma query returning profile, skill states, current session and last 6 turns.
- `src/server/repositories/persist.ts`: `persistTurn(...)`: writes turn, skill states, profile level and stars in one transaction. Called inside `after()`.
- `src/safety/inputGuard.ts`, `src/safety/outputGuard.ts`, `src/safety/lists.ts`.
- `src/llm/systemPrompt.ts`: the fixed persona.
- `src/llm/composePrompt.ts`: `composePrompt(ctx, decision) -> { system, messages }`.
- `src/llm/fallback.ts`: scripted lines per mode and activity.
- `src/llm/summarize.ts`: after-response rolling summary update every 6 turns (off the clock).
- `src/llm/classifyMood.ts`: see 04.

## Types and schemas
```ts
const ChatRequest = z.object({
  profileId: z.string().cuid(),
  sessionId: z.string().cuid(),
  input: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('text'), text: z.string().max(300) }),
    z.object({ kind: z.literal('voice'), text: z.string().max(300) }),
    z.object({ kind: z.literal('card'), activityId: z.string(), choiceId: z.string(), responseMs: z.number().int().nonnegative() }),
    z.object({ kind: z.literal('mood'), mood: MoodEnum }),
    z.object({ kind: z.literal('break') }),
  ]),
})
```
Response: an AI SDK UI message stream. The first part is a custom data part `data-turn` with `{ mode, mood, reason, activity, fallbackLine, celebrate, stars }`; then the text deltas of Pip's line. Check the installed AI SDK version for `createUIMessageStream` and data parts.

## Behavior
Pipeline, with a timer mark after each step:
1. Rate limit (Upstash) by device and IP. Over limit: 429.
2. Validate with Zod. Check the profile belongs to the device cookie.
3. `inputGuard`: redact personal info, or redirect with a scripted reply (no LLM call).
4. `loadTurnContext` (one query).
5. Engine: grade if a card answer, update mastery in memory, `extractSignals`, `detectMode`, `evaluateLevel`, `pickNextActivity` (only in Learn, or a light activity in Play), SEL lines.
6. Write the `data-turn` part immediately.
7. `composePrompt`: system persona + mode policy + the decision ("Child answered correctly. Praise effort in one sentence, then ask: 'Tap the dog!'") + a context block under 400 tokens (nickname, age band, interests, level, 3 weakest skills, mood, summary, last 6 turns). Never paste child text into the system prompt.
8. `streamText` with `maxOutputTokens` about 80, an `AbortSignal` on `LLM_FIRST_TOKEN_TIMEOUT_MS`. Pipe deltas through a streaming `outputGuard` (buffer per sentence). On timeout, error or guard failure: stream the fallback line instead.
9. `after()`: `persistTurn`, `classifyMood`, maybe `summarize`, timings.
10. `Server-Timing` header with all marks.

System prompt rules: Pip is a kind owl friend for a child aged 3 to 6; speak in at most 2 short sentences, under 25 words total; simple words; never ask for personal information; never mention being an AI model unless asked, then say "I'm Pip, a computer friend"; always end with the given question or activity line when one is given; in Support, comfort first, no teaching.

## Tests
- `inputGuard`: phone numbers, emails, addresses, "my name is X Y", school names redacted; unsafe topics redirected; disclosure script triggered.
- `outputGuard`: rejects URLs, long replies, blocklisted words, personal questions.
- `composePrompt`: context block under 400 tokens for a long history; child text only in user messages.
- Route test with a mocked model: fallback streams when the first token is late; the `data-turn` part is always first.

## Acceptance checklist
- [ ] p95 under 2 s and median first token under 1 s on the deployed URL (`/latency-check`).
- [ ] No blocking write before the response.
- [ ] A killed LLM (bad key) still gives the child a scripted reply.
