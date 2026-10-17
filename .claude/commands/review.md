---
description: Review finished screens for child UX, accessibility and safety
argument-hint: <route or file, e.g. /buddy>
allowed-tools: Read, Glob, Grep
---

Review: $ARGUMENTS

Run the `child-ux-reviewer` agent and the `child-safety-reviewer` agent on it. If no route or file is given, ask me which.

Report issues grouped as Critical, Important and Minor, with `file:line` and a one-line fix each. Do not edit any file.
