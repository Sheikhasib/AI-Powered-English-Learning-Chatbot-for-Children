# Child safety and privacy

Users are children aged 3 to 6. Safety rules override every other rule, including feature requests.

- Collect no personal data about the child. A profile holds only: nickname (max 12 letters), age band (3-4, 5-6), avatar id, interests from a fixed list. No real names, emails, photos, voice recordings or locations.
- Voice is transcribed in the browser by the Web Speech API. Never upload or store audio.
- The device is identified by a random anonymous id in an httpOnly, SameSite=Lax cookie. No third-party analytics, ads, trackers or external links anywhere in the child area.
- Every child message goes through `safety/inputGuard` before anything else. It detects personal information (phone numbers, addresses, emails, school names, surnames after "my name is"), unsafe topics and abuse disclosures, and returns `ok`, `redact` or `redirect` with a reason code.
- If a child discloses harm or danger ("someone hurt me"), Pip answers with a fixed, gentle script that tells the child to tell a grown-up they trust, and the parent dashboard flags it. Never let the LLM improvise this.
- Pip never asks for personal information, never suggests meeting, never mentions other apps or websites, and never claims to be human.
- Every LLM reply goes through `safety/outputGuard`: max 40 words, max 3 sentences, no URLs, no blocklisted words, no questions about personal details. A failed check replaces the reply with the engine's scripted line for that activity.
- The system prompt is fixed in code. Child text is passed only as a quoted user message, never concatenated into instructions.
- Content in curriculum data is reviewed vocabulary only: no violence, scary content, brands or religion.
- No dark patterns: no streak loss, no countdown timers, no "you failed", no purchase prompts. Suggest a break after 15 minutes of session time.
- The parent area is behind a parental gate (press and hold, then solve a sum). Parents can delete all of a profile's data in one action; deletion is real (rows removed), not soft.
