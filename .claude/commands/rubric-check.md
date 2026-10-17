---
description: Check the project against the assessment brief, pass or fail
allowed-tools: Read, Glob, Grep, Bash
---

Check the project against the list below. For each item give PASS, FAIL or MANUAL with file paths as evidence. Do not edit files. End with the FAIL items sorted by importance.

Brief requirements:
1. Progressive levels L1, L2, L3 with step-by-step progression based on the child's progress (`src/engine/progression.ts`, tests).
2. Mode detection: switches between learning, conversation, engagement (play) and support; does not teach on every turn (`MAX_TEACHING_STREAK`, detector tests).
3. SEL: emotional awareness, confidence, curiosity, positive learning behavior (check-in, effort praise, coping tools, curiosity prompts).
4. Context-aware replies: uses history, level and conversation context (`composePrompt`, context block test).
5. Latency under 2 s: timings recorded, fallback on slow first token, `docs/latency.md` has real numbers from the live URL.
6. Deliverables: live URL in README, source code, architecture diagram, system design doc, README with setup and deployment, video script.
7. MANUAL: collaborators farzana@sharif.com and masrur@sharif.com invited; video recorded and under 2 minutes; email sent.

Quality bar:
8. Strict TypeScript, no `any`; `typecheck`, `lint`, `test`, `build` pass.
9. Engine and safety are pure and covered by tests.
10. No `console.*`; env validated; no secrets in the repo (`git grep` for key patterns).
11. Child safety rules in `.claude/rules/child-safety.md` all hold.
12. Child UX rules hold: picture cards on every question, 64 px targets, reduced motion, works without speech input.
13. Commit history: count with `git rev-list --count HEAD`; conventional messages.
