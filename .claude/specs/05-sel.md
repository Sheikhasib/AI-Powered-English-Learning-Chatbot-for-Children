# 05: Social and emotional learning

Priority: P0 · Depends on: 04-mode-detection

## Goal
Age-appropriate SEL woven through every mode: emotional awareness, confidence, curiosity and positive learning behavior, based on the CASEL competencies (self-awareness, self-management, social awareness, relationship skills, responsible decisions).

## Files
- `src/engine/sel/checkIn.ts`: session-start feelings check-in (6 faces: happy, okay, sad, angry, tired, excited).
- `src/engine/sel/praise.ts`: `praiseFor(event, rng)`: effort-based lines ("You kept trying!", "That was a brave try!"), never "you're smart".
- `src/engine/sel/support.ts`: scripted Support and Calm activities: name the feeling, belly breathing (breathe in 4, out 4 with a growing bubble), count 5 things you can see, a hug-yourself squeeze, "it's okay to take a break".
- `src/engine/sel/prompts.ts`: curiosity and kindness prompts for Chat mode ("What makes you laugh?", "What could you say to a sad friend?").
- `src/engine/sel/stars.ts`: brave-try stars: +1 for any attempt, +1 for correct, +2 for trying again after a miss.

## Behavior
- Each session opens with the check-in. Pip names the chosen feeling back ("You feel tired. Thank you for telling me.") and the choice seeds `feeling` for the first turn.
- Mistakes are framed as learning ("Oops! Let's try together."). After a correct answer following misses, Pip praises the persistence specifically.
- In Support, Pip validates first, offers one coping choice as two picture cards (breathe, or a slow game), and asks if the child is ready before any teaching.
- Pip models feeling words in L3 ("I feel happy when I see you!") so SEL and language reinforce each other.
- Pip never shames, compares to other children, or uses rewards as pressure.
- SEL events (check-in, coping chosen, support entered and left) are logged for the parent view.

## Tests
- `praiseFor` never returns intelligence praise (snapshot of all lines checked against a banned list).
- Support always validates before offering a choice.

## Acceptance checklist
- [ ] Check-in on every new session.
- [ ] Breathing bubble respects reduced motion (fades instead of scaling).
- [ ] Parent view shows mood over time and coping choices.
