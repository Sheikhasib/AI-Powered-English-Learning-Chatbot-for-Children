---
description: Write a spec for one feature, then stop for review
argument-hint: <feature>
allowed-tools: Read, Write, Glob, Grep
---

Create a spec for: $ARGUMENTS

1. Read `CLAUDE.md`, `.claude/rules/` and `.claude/specs/_template.md`.
2. Read the existing specs to avoid duplication and keep names consistent.
3. Number it: count existing `NN-*.md` files (ignore `_template.md`), add 1, two digits.
4. Write `.claude/specs/NN-<slug>.md` from the template. Specs only, no application code, no git branches.
5. Stop and wait for my review.
