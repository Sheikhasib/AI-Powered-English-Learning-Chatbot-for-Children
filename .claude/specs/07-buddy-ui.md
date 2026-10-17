# 07: Buddy screen (the core child experience)

Priority: P0 · Depends on: 06-chat-api, 10-design-system

## Goal
One screen where the child talks with Pip: Pip speaks, picture cards appear, the child taps or talks, and Pip's look follows the mode.

## Files
- `src/app/(child)/buddy/page.tsx`: Server Component shell; loads profile and session.
- `src/components/pip/Pip.tsx`: SVG owl with expressions `curious` (Learn), `chatty` (Chat), `bouncy` (Play), `soft` (Support), `sleepy` (Calm), plus `celebrate` and `thinking`. Built from shapes (eyes, brows, beak, wings) animated with Motion; no external image.
- `src/components/buddy/SpeechBubble.tsx`: shows Pip's line with the word being spoken highlighted.
- `src/components/buddy/PictureCards.tsx`: 2 to 4 large cards, keyboard and tap, a gentle wiggle hint after 8 s of no answer.
- `src/components/buddy/MicButton.tsx`: hold-to-talk or tap-to-toggle; hidden when `SpeechRecognition` is unavailable.
- `src/components/buddy/MoodBar.tsx`: small faces strip plus a "break" button (pillow icon), always visible.
- `src/components/buddy/StarBurst.tsx`: star reward animation; `LevelUp.tsx` celebration overlay.
- `src/hooks/useSpeech.ts`: `speak(text, { onWord })` using `speechSynthesis` boundary events, voice choice (prefer an English child-friendly voice), rate 0.9, pitch 1.1; `listen()` returning a transcript; cancels speech when the child starts talking.
- `src/hooks/useBuddyChat.ts`: wraps `useChat` from `@ai-sdk/react`, reads the `data-turn` part, exposes `{ pipLine, mode, activity, sendCard, sendText, sendMood, sendBreak, status }`.

## Behavior
- On load: Pip greets by nickname and runs the check-in (05).
- When `data-turn` arrives: cards render at once, Pip switches expression, the fallback line is held; when the first text delta arrives, the bubble and speech use it instead. Speech starts at the first full sentence.
- While waiting: Pip's `thinking` animation (blinking, head tilt), never a spinner.
- Mode is shown by Pip's expression, a soft background tint per mode and a tiny label for grown-ups (`aria-label` and visually small).
- Cards disable while Pip is speaking the question, then enable; a tap gives instant visual feedback before the network reply.
- 429 or network error: Pip says "Let me catch my breath!" and retries once after 3 s.
- A small top bar: home (big icon), star count, mute.

## UX notes
See `rules/child-ux.md`. Portrait phone: Pip on top half, bubble, cards in a 2 x 2 grid at the bottom within thumb reach. Landscape tablet: Pip left, cards right.

## Tests
- Playwright smoke: create a profile, do the check-in, answer a card, see Pip's reply and the next cards.

## Acceptance checklist
- [ ] Usable with no reading: every action is spoken or pictured.
- [ ] Works without SpeechRecognition (cards only) and without speech output (bubble only).
- [ ] Reduced-motion mode verified.
- [ ] Keyboard: Tab through cards, Enter selects; focus rings visible.
