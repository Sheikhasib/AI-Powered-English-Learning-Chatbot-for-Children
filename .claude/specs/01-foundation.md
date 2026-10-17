# 01: Foundation and live skeleton

Priority: P0 · Build first · Depends on: none

## Goal
A Next.js 16 app deployed on Vercel with the database, Redis, LLM adapter, env validation, tooling and CI checks in place. A hidden `/api/health/llm` route measures the LLM's time to first token so we can confirm the model choice before building on it.

## Tech used
`next@16`, `react@19`, `typescript`, `tailwindcss@4`, shadcn/ui, `motion`, `lucide-react`, `zod@4`, `ai`, `@ai-sdk/openai-compatible`, `@ai-sdk/react`, `prisma`, `@prisma/client`, `@upstash/redis`, `@upstash/ratelimit`, `vitest`, `@playwright/test`. Check the installed major version's docs before using any API; do not code from memory if unsure.

## Files
- `src/lib/env.ts`: Zod schema for every variable in CLAUDE.md; throws on boot if a required server var is missing.
- `src/server/db.ts`: Prisma client singleton (global cache in dev).
- `src/server/ratelimit.ts`: `chatLimiter` (sliding window 20 per 60 s), keyed by device id, plus IP.
- `src/server/device.ts`: reads or sets the anonymous `pip_device` cookie (httpOnly, SameSite=Lax, Secure in prod, 1 year, random UUID).
- `src/server/timing.ts`: `createTimer()` with `mark(name)` and `toServerTimingHeader()`.
- `src/server/logger.ts`: silent in production except `error`.
- `src/llm/provider.ts`: `createOpenAICompatible({ name: 'opencode', baseURL: env.LLM_BASE_URL, apiKey: env.OPENCODE_API_KEY })` and `chatModel = provider(env.LLM_MODEL)`.
- `src/app/api/health/llm/route.ts`: streams a 10-word reply to "Say hello to a child", returns `{ model, firstTokenMs, totalMs }`. Disabled in production unless `?key=` matches `PARENT_GATE_SECRET`.
- `prisma/schema.prisma`: models below.
- `next.config.ts`: security headers from `rules/security.md`, `removeConsole` in production.
- `.env.example`, `.gitignore` (includes `.env*` except example), `eslint.config.mjs` with `no-console: error`, `vitest.config.ts`, `playwright.config.ts`.
- `package.json` scripts listed in CLAUDE.md.
- `src/app/page.tsx`: temporary "Pip is coming" page so the deploy shows something.

## Types and schemas
```prisma
model Device {
  id        String    @id            // cookie uuid
  createdAt DateTime  @default(now())
  profiles  Profile[]
}

model Profile {
  id          String    @id @default(cuid())
  deviceId    String
  device      Device    @relation(fields: [deviceId], references: [id], onDelete: Cascade)
  nickname    String    @db.VarChar(12)
  ageBand     AgeBand
  avatar      String
  interests   String[]
  level       Int       @default(1)
  stars       Int       @default(0)
  summary     String    @default("")   // rolling conversation summary, under 400 chars
  createdAt   DateTime  @default(now())
  skills      SkillState[]
  turns       Turn[]
  sessions    Session[]
  @@index([deviceId])
}

model SkillState {
  profileId  String
  profile    Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  skillId    String
  mastery    Float    @default(0)
  attempts   Int      @default(0)
  streak     Int      @default(0)      // +n correct in a row, -n wrong in a row
  lastSeenAt DateTime?
  dueAt      DateTime?                 // spaced review
  @@id([profileId, skillId])
}

model Session {
  id        String   @id @default(cuid())
  profileId String
  profile   Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  startedAt DateTime @default(now())
  checkIn   Mood?
  endedAt   DateTime?
  turns     Turn[]
}

model Turn {
  id          String   @id @default(cuid())
  profileId   String
  profile     Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  sessionId   String
  session     Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  childInput  String   @db.VarChar(300)   // already redacted by inputGuard
  inputKind   String                      // text | voice | card | mood | break
  botReply    String   @db.VarChar(400)
  mode        Mode
  modeReason  String
  mood        Mood?
  activityId  String?
  correct     Boolean?
  fallback    Boolean  @default(false)
  safetyFlag  String?
  tGuard      Int
  tContext    Int
  tEngine     Int
  tFirstToken Int
  tTotal      Int
  @@index([profileId, createdAt])
}

enum AgeBand { AGE_3_4 AGE_5_6 }
enum Mode { LEARN CHAT PLAY SUPPORT CALM }
enum Mood { HAPPY OKAY SAD ANGRY TIRED SCARED EXCITED }
```

## Behavior
- Use Prisma Postgres from the Vercel Marketplace; `DATABASE_URL` is pulled with `vercel env pull .env.local`. Follow the Prisma version's current docs for the client generator and any `prisma.config.ts`.
- Use Upstash Redis from the Vercel Marketplace.
- Deploy to Vercel on the first day; set the function region to match the database region.

## Acceptance checklist
- [ ] `typecheck`, `lint`, `test`, `build` pass; ESLint fails on `console.log`.
- [ ] Missing env var fails fast with a clear message.
- [ ] `prisma db push` creates all tables on Prisma Postgres.
- [ ] Deployed URL shows the placeholder page.
- [ ] `/api/health/llm` on the deployed URL reports `firstTokenMs`; we record 5 runs in `docs/latency.md`. If the median is over 700 ms, stop and tell the owner before continuing.
- [ ] Security headers present (check with `curl -I`).

## Out of scope
Any feature UI.
