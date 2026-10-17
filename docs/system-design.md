# System design

## 1. The brief, and how Pip meets it

| Requirement | How Pip meets it | Where |
|---|---|---|
| Progressive learning L1 to L3 | Typed curriculum (sounds and letters, words, sentences). Mastery per skill with a moving average; a level unlocks when 80% of its skills are mastered and never goes down. | `src/engine/curriculum/`, `mastery.ts`, `progression.ts` |
| Mode and mood detection | Rule-based detector over signals from words, taps, timing and history, in priority order with hysteresis. Five modes: Learn, Chat, Play, Support, Calm. | `src/engine/signals.ts`, `detectMode.ts` |
| Social and emotional learning | Feelings check-in each session, effort praise, brave-try stars, scripted coping (breathing, naming feelings), kindness and curiosity prompts. Based on CASEL. | `src/engine/sel/` |
| Context-aware replies | One query loads profile, skill states, session and last 6 turns; a rolling summary; the prompt carries a context block under 400 tokens. | `src/server/repositories/context.ts`, `src/llm/composePrompt.ts` |
| Latency under 2 s | One DB read, zero blocking writes, one LLM call, cards sent before the first token, 1.2 s first-token fallback. | `src/app/api/chat/route.ts` |
| Child safety | Input and output guards, fixed disclosure script, no personal data, parental gate, hard delete. | `src/safety/`, grown-up corner |

## 2. Core principle: the engine teaches, the LLM talks

A small LLM is good at sounding warm and bad at being consistent. So every decision a teacher or a parent would want to explain (what to teach, when to level up, when to stop and comfort) is made by pure, tested TypeScript. The LLM gets the decision ("child answered correctly; praise effort in one sentence, then ask 'Tap the dog!'") and writes only that line.

What this buys:
- **Predictable progression.** The same answers always produce the same mastery, level and next activity. Every decision returns a plain-English `reason` the grown-up corner shows.
- **Safety by construction.** The LLM never chooses content. If it fails, times out or says something the output guard rejects, the engine's scripted line is used and the child notices nothing.
- **Speed.** The engine runs in well under 5 ms, so the cards appear immediately.
- **Testability.** Engine and safety modules have no I/O, take `now` and a seeded `rng` as arguments, and are covered by Vitest.

## 3. Components

**Curriculum** (`src/engine/curriculum/`). Skills per level, each with 4 to 10 picture items and allowed activity kinds (listen and tap, say it, picture match, odd one out, first sound, finish the sentence, build a story). `buildActivity` picks a target and distractors from the same skill with the seeded rng; 3 to 4 year olds get 2 choices on first attempts.

**Learning engine** (`src/engine/`). `gradeAnswer`, `updateMastery` (`m' = m + 0.35 * (score - m)`, a correct answer after a hint scores 0.6), `evaluateLevel`, `pickNextActivity` (retry with a hint after 2 misses and an easier variant after 3, a spaced review about 1 in 4 times when one is due, otherwise the next unmastered skill, using the child's interests to pick items). All thresholds live in `src/engine/config.ts`.

**Mode detector** (`src/engine/detectMode.ts`). First match wins:
1. Sad, scared or angry, or a safety disclosure: **Support**.
2. Break button, 15 minutes of play, or tired: **Calm**.
3. Three misses in a row, or refusal after a miss: **Support**.
4. Refusal, fast guessing twice, or 20 s of silence: **Play**.
5. A question, a story or a greeting: **Chat**.
6. Four Learn turns in a row: **Chat** or **Play**, alternating.
7. Otherwise: **Learn**.

Support and Calm hold for at least 2 turns unless the child taps a happy face, and leaving Support goes to Play or Chat first. After the response, an LLM mood classifier (Zod-validated structured output) stores a mood that feeds the next turn; it is off the clock and optional.

**SEL** (`src/engine/sel/`). Check-in with six faces, effort-only praise (a test bans intelligence praise), scripted coping activities, brave-try stars (+1 any try, +1 correct, +2 trying again after a miss). No streak loss, no timers, no shame.

**Safety** (`src/safety/`). `inputGuard` runs first on every child message and returns `ok`, `redact` or `redirect` with a reason: phone numbers, emails, addresses, school names and surnames are redacted; unsafe topics get a gentle redirect; a disclosure of harm gets a fixed script ("tell a grown-up you trust") and flags the turn for the parent. `outputGuard` checks every LLM sentence: at most 40 words and 3 sentences, no URLs, no blocklisted words, no questions about personal details.

**Prompt composer** (`src/llm/`). A fixed system prompt (Pip persona and rules), a per-mode policy, the engine's decision and a compact context block (nickname, age band, interests, level, 3 weakest skills, mood, summary, last 6 turns). Child text is only ever a quoted user message, never part of the instructions.

## 4. Data model

`Device` (anonymous cookie id) has up to 4 `Profile`s (nickname, age band, avatar, interests, level, stars, rolling summary). A profile has `SkillState` rows (mastery, attempts, streak, next review), `Session`s (check-in mood) and `Turn`s (redacted input, reply, mode and reason, mood, fallback flag, safety flag, timings). All relations cascade on delete. See the ER diagram in `architecture.md`.

## 5. API contract

`POST /api/chat`, body validated by Zod (max 2 KB; child text max 300 characters):

```ts
{ profileId, sessionId, input:
    | { kind: 'text' | 'voice', text }
    | { kind: 'card', activityId, choiceId, responseMs }
    | { kind: 'mood', mood }
    | { kind: 'break' } }
```

Response: an AI SDK UI message stream. The first part is `data-turn` with `{ mode, mood, reason, activity, fallbackLine, celebrate, stars }`, followed by the text of Pip's line. Errors use `{ error: { code, message } }`; a 429 becomes "Pip needs a little rest" in the UI.

Other routes: `/api/session` (start a session with the check-in mood), `/api/profile` (create, list, gated hard delete), `/api/progress` (level and skill states for the map and stickers), `/api/metrics` (p50 and p95 from stored timings, gated), `/api/demo` (switch the grown-up corner to the sample profile, gated) and `/api/health/llm` (latency probe, hidden in production without the key). The parental gate lives at `/parent-gate`; its sum is checked on the server and the answer never reaches the browser.

## 6. Latency budget

| Step | Budget | How |
|---|---|---|
| Rate limit + validation + input guard | 30 ms | Upstash REST in the same region, pure guard |
| Context load | 60 ms | one Prisma query with `include`, pooled connection, same region (sin1) |
| Engine + detector | 5 ms | pure synchronous functions |
| First LLM token | 600 ms | Groq, small model, low reasoning effort, short prompt |
| Rest of the line | 500 ms | about 25 words |
| **Total** | **under 2 s** | writes happen in `after()`, off the clock |

The cards and the fallback line are on screen before the LLM starts. If no token arrives within `LLM_FIRST_TOKEN_TIMEOUT_MS` (1200 ms), the call is aborted and the scripted line is streamed instead. The model is called with reasoning effort "low" and `maxOutputTokens` 300: `gpt-oss-20b` spends part of its budget on hidden reasoning, and a lower cap produced empty replies in testing.

Each turn records `t_guard`, `t_context`, `t_engine`, `t_first_token` and `t_total`. The first three go in the `Server-Timing` header; the last two are only known after the model answers, so they arrive in a final `data-timing` stream part. All five are stored with the turn. Measured numbers: see `latency.md`.

## 7. Safety and privacy

- No personal data: only nickname, age band, avatar and interests from a fixed list. No names, emails, photos, audio or location.
- Speech is transcribed in the browser (on device where supported); Pip never uploads or stores audio.
- Anonymous device id in an httpOnly, SameSite=Lax cookie. No analytics, ads, trackers or external links in the child area.
- Strict Content-Security-Policy and other security headers; the LLM key is server-only.
- The grown-up corner is behind a hold-then-sum gate and a signed 15-minute cookie. Deleting a profile removes every row.
- No dark patterns; Pip suggests a break after 15 minutes.

## 8. Scalability

Route handlers are stateless, so Vercel scales them horizontally. Postgres is reached through Prisma Postgres connection pooling; each turn costs one read and one batched write after the response. Rate limits live in Redis, shared across instances. Curriculum is static data bundled with the app. The LLM provider is behind one adapter (`src/llm/provider.ts`) and any OpenAI-compatible endpoint can be swapped in by env.

## 9. Failure modes

| Failure | What the child sees |
|---|---|
| LLM slow, down or bad key | The scripted line for the activity, same cards |
| Output guard rejects the reply | The scripted line |
| Rate limit hit | Pip: "Let me catch my breath!", retry after 3 s |
| Network error | Same as above |
| No speech recognition in the browser | Mic hidden; cards only |
| No speech output | The speech bubble with the text |
| Database write fails after the response | Turn not logged; the child is unaffected |

## 10. Testing

- Vitest for every engine and safety module: mastery bounds, level unlock at exactly 80%, picker rules, kind rotation, each detector rule, hysteresis, misspellings, guard cases, effort-only praise, prompt size.
- A route test with a mocked model: `data-turn` is always first and the fallback streams when the first token is late.
- One Playwright smoke test of the main flow.
- GitHub Actions runs typecheck, lint, test and build on every push.

## 11. Trade-offs

- **Rule-based detection over a classifier.** Explainable, instant, testable and works without the LLM. It misses subtle cues, so a cheap after-response mood classification adds a second signal for the next turn.
- **Web Speech over cloud speech.** Free and zero latency to start. Pip asks for on-device recognition where the browser supports it; some browsers (for example Chrome without on-device models) still send speech to their own service, so the mic is optional and every action also works by tapping. Pip itself never uploads or stores audio.
- **LLM for voice only.** Less "creative" conversation, but consistent teaching, safe output and a guaranteed answer under 2 s.
- **Free-tier LLM (Groq).** Fast and free for a demo, with a rate limit; the adapter makes a paid provider a config change.
- **Writes after the response.** Skill progress is saved in `after()` so the child never waits, which means two taps within about half a second can overwrite one mastery update. The UI's short card lock makes this rare; a fix would need a blocking write or an atomic increment.
- **The answer id travels with the cards.** It keeps grading simple; a curious grown-up could read it in the network tab. For 3 to 6 year olds this is an acceptable trade.
- **CSP allows inline scripts.** Next.js needs inline bootstrap scripts; nonces would make every page dynamic. No third-party scripts are allowed.
- **Rate limiter fails open.** If Redis is down, Pip keeps talking rather than going silent on a child.

## 12. Future work

Parent-reviewed custom word lists, more languages for the grown-up corner, a pronunciation score from recognition confidence, offline mode with a local model, and a classroom view for teachers.
