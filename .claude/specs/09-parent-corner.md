# 09: Grown-up corner

Priority: P0 · Depends on: 06-chat-api

## Goal
A gated dashboard where a parent (and the assessor) can see learning progress, mood and mode history with reasons, safety flags and latency, and delete data.

## Files
- `src/components/shared/ParentGate.tsx`: press and hold 2 s, then a sum with numbers 5 to 12 shown as words ("seven plus five"). Success sets a signed cookie for 15 minutes (`PARENT_GATE_SECRET`).
- `src/proxy.ts`: protects `/parent` with that cookie.
- `src/app/(grown-up)/parent/page.tsx`: profile switcher and tabs.
- Sections:
  - **Progress:** current level, skills per level as a mastery bar list, level-up history with reasons.
  - **Feelings and modes:** mood check-ins over time, a mode timeline for the last session with each switch's `reason`.
  - **Conversations:** last 20 turns (already redacted), with safety flags highlighted.
  - **Performance:** p50 and p95 of `tFirstToken` and `tTotal` over the last 100 turns, fallback rate, a small chart (Recharts via `next/dynamic`).
  - **Privacy:** "Delete all of <nickname>'s data" with a confirm dialog; hard delete via cascade.
- `src/app/api/metrics/route.ts`: aggregates with SQL percentiles (`percentile_cont`).

## Acceptance checklist
- [ ] Gate cannot be passed by a child tapping randomly (hold + sum).
- [ ] Mode timeline shows reasons in plain English.
- [ ] Latency numbers come from real stored timings.
- [ ] Delete removes the profile and all rows; verified by a test.
