# Code quality

- TypeScript strict, no `any`, no `@ts-ignore`, no non-null assertions without a comment saying why.
- `src/engine/` and `src/safety/` are pure: input in, output out, no I/O, no `Date.now()` or `Math.random()` inside (pass time and a seeded random in). This keeps them deterministic and testable.
- Every engine and safety module has a Vitest file in `tests/` with the main cases and edge cases. Test names read as behavior ("levels up when 80% of skills are mastered").
- Zod schemas validate every request body and every LLM structured output. Derive types from schemas with `z.infer`.
- Server Components by default. `"use client"` only where interaction needs it, and as deep in the tree as possible.
- Keep files small and single-purpose (under about 200 lines). Name by what it does: `pickNextActivity`, `detectMode`, `updateMastery`.
- No dead code, no commented-out code, no `console.*` (ESLint `no-console: error`). Use a tiny `logger` in `src/server/` that is silent in production except errors.
- Comments explain why, not what. Every exported engine function has a one-line JSDoc stating its rule.
- Constants (thresholds such as mastery 0.8, level unlock 80%, max teaching streak 4) live in `src/engine/config.ts`, named and documented, never as magic numbers.
- Errors: API routes return `{ error: { code, message } }` with the right status. The child UI never shows an error message; Pip says a friendly line and retries.
- Conventional commits, one logical change each.
