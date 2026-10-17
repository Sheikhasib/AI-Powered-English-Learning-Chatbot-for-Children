# Latency

Target: first spoken word under 1 s and the full reply under 2 s (p95), measured on the live URL.

## Method

`/latency-check` sends 30 child turns (a mix of card answers, short text and mood taps) to `https://pip-english-buddy.vercel.app/api/chat` and reads the `Server-Timing` header and the stream timings. Vercel function region: sin1. Database region: _to fill_. LLM: Groq `openai/gpt-oss-20b`, reasoning effort low.

## LLM probe (`/api/health/llm`)

| Where | Runs | firstTokenMs | Median |
|---|---|---|---|
| Local (Dhaka) | 4 | 585, 475, 149, 477 | about 480 |
| Live (sin1) | 5 | 300, 96, 116, 71, 154 (totalMs 510, 200, 132, 90, 175) | 116 |

## Chat turns (`/api/chat`, live)

| Metric | p50 | p95 |
|---|---|---|
| t_first_token | _to fill_ | _to fill_ |
| t_total | _to fill_ | _to fill_ |
| Fallback rate | _to fill_ | |
