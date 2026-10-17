---
description: Implement one approved spec in small, verified steps
argument-hint: <spec number or name, e.g. 03-learning-engine>
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

Implement the spec: $ARGUMENTS

1. Read `CLAUDE.md`, every file in `.claude/rules/`, `.claude/specs/01-foundation.md` (skip if this is 01), `.claude/specs/10-design-system.md` for any UI work, and the matching spec. Skim the specs named in its "Depends on". If the spec is missing or unclear, stop and ask me.
2. Never guess a library API. If unsure about Next.js 16, AI SDK, Prisma or Upstash APIs, read the installed package's docs or types in `node_modules` first.
3. Show a short plan and the list of files you will create or change. Wait for my OK.
4. For logic in `src/engine/`, `src/safety/` or `src/llm/composePrompt.ts`, write the Vitest tests first, then the code.
5. Implement in small changes and follow the spec's acceptance checklist.
6. Run `npm run typecheck`, `npm run lint`, `npm run test` and `npm run build`. Fix every error. If a check cannot run, say so. Never claim success if a check fails.
7. Report what changed, which checklist items pass and which could not be verified. Propose commit messages (`type: summary`), one per logical change. Commit only when I say so.
