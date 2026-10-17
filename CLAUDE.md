# Pip: English buddy for children under 7

A voice-first web app where Pip, a friendly owl, teaches English to children aged 3 to 6 across three levels (L1 sounds and letters, L2 words, L3 sentences). It detects the child's mood and switches between Learn, Chat, Play, Support and Calm modes, builds social and emotional skills, and adapts to each child's history. End-to-end response latency must stay under 2 seconds.

This is a job-assessment submission. Code quality, architecture and child-appropriate UX are judged. Every change must be clean, typed, tested where it holds logic, and explainable in the design doc.

## Core principle

**The engine teaches, the LLM talks.** Levels, mastery, activity choice, mode switching and safety are deterministic TypeScript in `src/engine/` and `src/safety/`, covered by Vitest. The LLM only turns the engine's decision into a short, warm spoken line. The LLM never decides progression, never chooses the level and never produces the picture cards.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript strict (no `any`) |
| UI | Tailwind CSS 4, shadcn/ui (restyled for children), Motion (`motion/react`), Lucide icons |
| Font | Andika via `next/font/google` (designed for early readers) |
| LLM | Vercel AI SDK (`ai`) + `@ai-sdk/openai-compatible` pointed at OpenCode Zen; model from env (`LLM_MODEL`, default `big-pickle`) |
| Database | Prisma Postgres + Prisma ORM |
| Rate limiting | Redis (Upstash) with `@upstash/ratelimit` |
| Voice | Browser Web Speech API (`speechSynthesis`, `SpeechRecognition`) behind a `useSpeech` hook |
| Validation | Zod 4 at every API boundary |
| Tests | Vitest (engine, safety, detector), Playwright (one smoke test) |
| Hosting | Vercel |
| Package manager | npm only |

## Folder structure

```
src/
  app/
    (child)/            welcome, check-in, buddy, map, stickers
    (grown-up)/parent/  gated parent dashboard
    api/chat/route.ts   the one hot path (streams)
    api/profile/        create/read/delete child profile
    api/progress/       answer events, mastery reads
    api/metrics/        latency stats for the parent view
  engine/               PURE functions only: curriculum, mastery, activity picker, mode detector, SEL
    curriculum/         L1, L2, L3 content as typed data
  safety/               input guard, output guard, blocklists (pure)
  llm/                  provider adapter, prompt composer, fallback lines
  server/               prisma client, repositories, ratelimit, timing
  components/
    ui/                 shadcn primitives
    pip/                mascot and its expressions
    buddy/              picture cards, mic button, speech bubble, mood faces
    shared/
  hooks/                useSpeech, useBuddyChat, useReducedMotion
  lib/                  constants, env (Zod-validated), utils
  types/
prisma/schema.prisma
tests/                  Vitest unit tests mirror src/engine and src/safety
docs/                   architecture.md, system-design.md, latency.md, video-script.md
```

## How we work

- Specs live in `.claude/specs/`. Build one spec at a time with `/build-feature NN`. Read `.claude/rules/` before writing code.
- Rules: `child-safety.md`, `child-ux.md`, `latency.md`, `code-quality.md`, `security.md`.
- Before claiming done: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` all pass. Never claim success when a check fails or could not run.
- Small commits with conventional messages (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`). Aim for many meaningful commits; commit only when the owner says so.
- When something is unclear, stop and ask. Never invent an API, model name or env var.

## Commands

```
npm run dev         # local dev
npm run typecheck   # tsc --noEmit
npm run lint
npm run test        # vitest run
npm run test:e2e    # playwright
npm run build
npm run db:push     # prisma db push
npm run db:seed
```

## Environment variables

All read through `src/lib/env.ts` (Zod-validated, server-only unless prefixed `NEXT_PUBLIC_`). Never commit `.env*` files except `.env.example`.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Prisma Postgres connection string |
| `OPENCODE_API_KEY` | LLM key (server only) |
| `LLM_BASE_URL` | OpenAI-compatible base URL, default `https://opencode.ai/zen/v1` |
| `LLM_MODEL` | Model id, default `big-pickle` |
| `LLM_FIRST_TOKEN_TIMEOUT_MS` | Fallback trigger, default `1200` |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Rate limiting |
| `PARENT_GATE_SECRET` | Signs the short-lived parent-area cookie |
