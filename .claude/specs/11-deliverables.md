# 11: Deliverables (docs, diagram, README, video)

Priority: P0 · Last · Depends on: everything

## Goal
Everything the assessors asked for, in the repo, accurate to the code as built.

## Files
- `README.md`: what Pip is, the live URL, a screenshot or GIF, features mapped to the brief's six requirements, tech stack, quick start (`git clone`, `npm i`, `vercel env pull`, `npm run db:push`, `npm run dev`), env var table, deploy steps on Vercel (Prisma Postgres and Upstash from the Marketplace, region pinning), test commands, measured latency (p50, p95, fallback rate), project structure, trade-offs, and next steps.
- `docs/architecture.md`: Mermaid diagrams: system context, the `/api/chat` sequence with timings, the mode state machine, the data model (ER). Also export `docs/architecture.png` for the email.
- `docs/system-design.md`: requirements and how each is met; component design (engine, detector, SEL, guards, prompt composer); data model; API contract; latency budget and measurements; safety and privacy; scalability (stateless functions, pooled DB, Redis); failure modes and fallbacks; testing strategy; trade-offs (rule-based detection vs a classifier, Web Speech vs cloud speech, LLM for voice only); future work.
- `docs/latency.md`: method and the numbers from `/latency-check` on the live URL.
- `docs/video-script.md`: a 2-minute English script with timings: 0:00 problem and the core principle, 0:20 live demo (check-in, L1 activity, a sad message switching to Support, Play break), 1:10 architecture and latency, 1:35 tools and trade-offs, 1:55 close.

## Acceptance checklist
- [ ] Every claim in the docs matches the code (names, thresholds, numbers).
- [ ] The README's latency numbers come from a real run on the live URL.
- [ ] Collaborators farzana@sharif.com and masrur@sharif.com have been invited to the repo.
