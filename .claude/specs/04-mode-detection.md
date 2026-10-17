# 04: Child mode and mood detection

Priority: P0 · Depends on: 03-learning-engine

## Goal
Decide on every turn whether Pip should Learn, Chat, Play, Support or Calm, from signals in the child's input and behavior, in under 5 ms, with a reason the parent can read.

## Files
- `src/engine/signals.ts`: `extractSignals(input, history, now) -> Signals`.
- `src/engine/lexicon.ts`: small word lists for feelings, refusal, boredom, questions, story cues, greetings (English, child phrasing, common misspellings and speech-to-text variants).
- `src/engine/detectMode.ts`: `detectMode(signals, prev) -> { mode, mood, confidence, reason }`.

## Types
```ts
type Signals = {
  feeling: Mood | null            // from words or a tapped mood face
  wantsBreak: boolean             // break button, 'stop', 'no more', 'tired'
  refusal: boolean                // 'no', 'don't want', 'boring'
  isQuestion: boolean             // 'why', 'what', '?'
  isStory: boolean                // 'my dog', 'today I', long free speech
  correctStreak: number           // from SkillState.streak
  wrongStreak: number
  fastGuess: boolean              // card answered under 700 ms
  silenceMs: number               // since Pip's last line
  teachingStreak: number          // Learn turns in a row
  sessionMinutes: number
  lastMood: Mood | null           // from the previous turn's after-response classifier
}
```

## Behavior
Rules in priority order (first match wins), each with a reason code:
1. `feeling` is SAD, SCARED or ANGRY, or a safety disclosure: **Support** ("child said they feel sad").
2. `wantsBreak`, or `sessionMinutes >= 15`, or `lastMood` TIRED: **Calm** (breathing, slow game, permission to stop).
3. `wrongStreak >= 3` or (`refusal` and `wrongStreak >= 1`): **Support** (encourage, easier task next).
4. `refusal`, or `fastGuess` twice in a row, or `silenceMs > 20000`: **Play** (song, riddle, I-spy with current words).
5. `isQuestion` or `isStory` or a greeting: **Chat** (answer, then weave in one target word).
6. `teachingStreak >= MAX_TEACHING_STREAK`: **Chat** or **Play**, alternating.
7. Otherwise: **Learn**.

Hysteresis: once in Support or Calm, stay at least 2 turns unless the child taps a happy face or says they are ready. Leaving Support goes to Play or Chat first, never straight to Learn.

Mood: `feeling` if present, else `lastMood`, else inferred (correct streak 3+: HAPPY; refusal: OKAY).

After the response (off the clock), `src/llm/classifyMood.ts` asks the LLM for a structured `{ mood, confidence }` on the child's message (Zod schema). It is stored on the turn and becomes `lastMood` for the next turn. If it fails, nothing happens.

## Tests
One test per rule, plus: priority order, hysteresis holds 2 turns, leaving Support never goes straight to Learn, teaching streak forces a break, misspellings ('sadd', 'im sad', 'i am scared') are caught.

## Acceptance checklist
- [ ] `detectMode` runs under 1 ms in a benchmark test of 1,000 calls.
- [ ] Every result has a human-readable `reason`.

## Out of scope
Voice tone analysis.
