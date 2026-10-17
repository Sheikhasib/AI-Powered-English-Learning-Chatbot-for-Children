---
description: Measure /api/chat latency against a URL and report p50 and p95
argument-hint: <base URL, e.g. https://pip.vercel.app>
allowed-tools: Read, Write, Bash
---

Measure latency for: $ARGUMENTS

1. If `scripts/latency-check.ts` does not exist, write it: it creates a test profile and session through the API, then sends 30 mixed turns (card answers, short text, one mood) one after another, measuring time to first byte of Pip's text and time to stream end, and reads the `Server-Timing` header. It deletes the test profile at the end.
2. Run it with `npx tsx scripts/latency-check.ts <url>`.
3. Print a table: p50 and p95 for first token and total, the fallback rate, and the slowest server step.
4. Update `docs/latency.md` with the date, the URL, the region and the table. Do not touch the README unless I ask.
