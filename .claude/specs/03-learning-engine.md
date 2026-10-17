# 03: Learning engine (mastery, progression, activity choice)

Priority: P0 · Depends on: 02-curriculum

## Goal
Pure functions that grade answers, update mastery, decide level changes and pick the next activity, so progression is predictable, explainable and tested.

## Files
- `src/engine/config.ts`: all thresholds, each documented.
- `src/engine/grade.ts`: `gradeAnswer(activity, choiceId) -> { correct, attempt }`.
- `src/engine/mastery.ts`: `updateMastery(state, correct, now) -> SkillState`.
- `src/engine/progression.ts`: `evaluateLevel(profile, skills) -> { level, changed: 'up' | 'none', reason }`.
- `src/engine/picker.ts`: `pickNextActivity(ctx, rng, now) -> Activity`.
- `src/engine/scaffold.ts`: hint and easier-variant rules.

## Behavior
Config (starting values, tune later):
```ts
MASTERY_ALPHA = 0.35          // weight of the newest answer (exponential moving average)
MASTERED = 0.8                // a skill is mastered at or above this
LEVEL_UNLOCK_SHARE = 0.8      // share of a level's skills mastered to unlock the next
HINT_AFTER_MISSES = 2         // consecutive misses before a hint
EASIER_AFTER_MISSES = 3       // then 2 choices and the easiest item
REVIEW_INTERVALS_MIN = [10, 60, 24*60]  // spaced review after mastery
REVIEW_SHARE = 0.25           // about 1 in 4 activities is a review when any are due
MAX_TEACHING_STREAK = 4       // Learn turns in a row before a Chat or Play break
```
- Mastery: `m' = m + ALPHA * ((correct ? 1 : 0) - m)`. Correct on the first attempt after a hint counts as 0.6, not 1.
- Streak: positive for consecutive correct, negative for consecutive wrong; resets on change of sign.
- Level: unlocks when the share of mastered skills in the current level is at least `LEVEL_UNLOCK_SHARE`. Levels never go down; struggling is handled by scaffolding inside the level. A level-up returns a celebration flag for the UI.
- Picker order: (1) if the child is mid-activity and missed, re-offer with a hint or easier variant; (2) if a review is due and the rng hits `REVIEW_SHARE`, pick the most overdue mastered skill; (3) otherwise the lowest-order unmastered skill in the current level, with interests used to pick items when the skill allows (likes animals: count animals).
- Activity kind rotates so the same kind is not used three times in a row.
- Every function takes `now` and `rng` as arguments. No I/O.

## Tests
- Mastery rises toward 1 with correct answers and falls with misses; never leaves [0, 1].
- Level unlocks at exactly 80% and not below; never goes down.
- Hint after 2 misses, easier variant after 3.
- Review is picked when due and the rng allows; never picks a skill from a locked level.
- Kind rotation never repeats three times.

## Acceptance checklist
- [ ] 100% branch coverage on `mastery.ts`, `progression.ts`, `picker.ts`.
- [ ] Every decision returns a `reason` string the parent view can show ("Unlocked Level 2: 7 of 8 skills mastered").

## Out of scope
Any persistence (repositories do that in 06).
