# Latency

Target: first spoken word under 1 s and the full reply under 2 s (p95), measured on the live URL.

## Method

`/latency-check` sends 30 child turns (a mix of card answers, short text and mood taps) to `https://pip-english-buddy.vercel.app/api/chat` and reads the `Server-Timing` header and the stream timings. Vercel function region: sin1. Database region: ap-southeast-1 (Singapore), the same region. LLM: Groq `openai/gpt-oss-20b`, reasoning effort low.

## LLM probe (`/api/health/llm`)

| Where | Runs | firstTokenMs | Median |
|---|---|---|---|
| Local (Dhaka) | 4 | 585, 475, 149, 477 | about 480 |
| Live (sin1) | 5 | 300, 96, 116, 71, 154 (totalMs 510, 200, 132, 90, 175) | 116 |

## Chat turns (`/api/chat`, live)

| Metric | p50 | p95 |
|---|---|---|
| First token (client) | 701 ms | 1556 ms |
| Full reply (client) | 742 ms | 1595 ms |
| Fallback rate | 23.3% (7 of 30) | |

Measured on 2026-10-17 with `npx tsx scripts/latency-check.ts https://pip-english-buddy.vercel.app`, 30 turns paced under the 20-per-minute rate limit, from a client in Dhaka (so the numbers include the Dhaka to Singapore network hop).

The full reply meets the 2 s p95 target. First token p95 is above the 1 s goal. The picture cards and the scripted line arrive in the first stream part, so the child sees and hears something before the model's first token either way. Fallbacks include both first-token timeouts and replies the output and praise guards rejected; each fallback still gives the child the engine's scripted line.
