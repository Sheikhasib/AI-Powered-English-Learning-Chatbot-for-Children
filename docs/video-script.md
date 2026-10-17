# Video script (2 minutes, English)

Record the live URL on a phone-sized browser window (360 x 740) with sound on. Speak slowly; each block is roughly the time shown.

## 0:00 to 0:20. The problem and the idea

> "Hi, I'm Hasib. This is Pip, an English buddy for children under seven. Young children can't read instructions, they get tired fast, and they need kindness more than corrections. So Pip talks, shows pictures, and notices how the child feels.
> The key design choice: the engine teaches, the LLM talks. Levels, progress and mode changes are decided by tested TypeScript. The language model only says the line."

## 0:20 to 1:10. Live demo

1. Open the welcome screen. "A grown-up adds a child: just a nickname, age, an avatar and interests. No personal data."
2. Check-in. Tap the happy face. "Every session starts with a feelings check-in."
3. Level 1 activity. Pip says "Tap the cat!". Tap a wrong card, then the right one. "Wrong answers get a hint and a retry, never a red cross. Trying again earns brave-try stars."
4. Type or say "I feel sad". "Watch Pip's face and colours: it switches to Support mode, comforts first, and offers a breathing bubble or a slow game. That switch is a rule, not a guess by the LLM."
5. Tap the pillow break button. "Calm mode. And after fifteen minutes Pip suggests a break on its own."

## 1:10 to 1:35. Architecture and latency

Show `docs/architecture.md` (the sequence diagram) and the grown-up corner's performance tab.

> "Each turn does one database read, one LLM call and no blocking writes. The picture cards and a scripted line are sent before the first token, so the child never waits. If the model is slow, Pip uses the scripted line. On the live site the median first token is ___ ms and p95 total is ___ ms, under two seconds."

## 1:35 to 1:55. Tools and trade-offs

> "Next.js 16 on Vercel, Prisma Postgres, Upstash Redis for rate limits, the browser's own speech so audio never leaves the device, and Groq for fast replies. Rule-based mode detection is explainable and instant; a small mood classifier runs after the reply as a second signal. The grown-up corner shows every mode switch with its reason, and deletes all data in one tap."

## 1:55 to 2:00. Close

> "Pip: kind, quick, and safe. Thanks for watching."
