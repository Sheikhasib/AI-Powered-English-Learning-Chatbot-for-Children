# Latency

Target: a child's turn gets Pip's first spoken word in under 1 second and the full reply in under 2 seconds (p95), measured on the deployed URL.

- `/api/chat` is the only hot path. It does at most one database read (one Prisma query with `include`/`select`, no N+1), zero blocking writes, and exactly one LLM call.
- Writes (turn log, mastery update, mode log, timings) run after the response with `after()` from `next/server`.
- The engine, detector and guards are synchronous pure functions. No network calls inside `src/engine/` or `src/safety/`.
- The picture cards and the scripted fallback line come from the engine and are sent in the first chunk of the stream, before any LLM token, so the UI shows them instantly.
- Cap the LLM: `maxOutputTokens` around 80, temperature 0.7, a prompt under 1,200 tokens total. The context block stays under 400 tokens.
- If no LLM token arrives within `LLM_FIRST_TOKEN_TIMEOUT_MS` (default 1200), abort the call and stream the fallback line. Log `fallback: true`.
- Record server timings per turn: `t_guard`, `t_context`, `t_engine`, `t_first_token`, `t_total`. Send them as a `Server-Timing` header and store them after the response.
- Region: the Vercel function region must match the database region. Note both in the README.
- Speech output starts on the first sentence, not after the whole reply.
- Avoid cold-start weight: no heavy imports in the chat route, keep the Prisma client a singleton.
- Measure, don't guess: `/latency-check` runs 30 turns against a URL and reports p50 and p95.
