# Child UX

Before any UI work read `.claude/specs/10-design-system.md`.

- Assume the child cannot read. Every prompt is spoken by Pip; text on screen is a support, not the main channel. Every bot line is read aloud with the current word highlighted.
- Every question offers 2 to 4 picture cards to tap. Voice input is optional; typing is never required in the child area.
- Tap targets at least 64 x 64 px with 16 px gaps. No hover-only affordances. No small links, no menus, no scrolling on the buddy screen.
- One clear next action per screen, marked with the accent color. Back is always a big, labeled icon button.
- Feedback is immediate (under 100 ms visual response on tap) and kind. Wrong answers get a hint and a retry, never red crosses or "wrong". Effort earns brave-try stars.
- Pip's expression and color reflect the current mode (see 07-buddy-ui). The child should feel the mode change, not read it.
- Sound effects are short and soft, with a mute toggle. Speech rate 0.9, pitch 1.1 by default.
- Respect `prefers-reduced-motion`: replace movement with opacity fades. Motion durations 150 to 400 ms, springy but never flashing. Nothing flashes more than 3 times per second.
- Colors only from tokens in `src/app/globals.css`. Text contrast at least 4.5:1, large text 3:1. Never use color alone to carry meaning; pair it with an icon or Pip's expression.
- Layout is tablet and phone first: design for 360 px portrait, then 768 and 1024 landscape. No horizontal scroll.
- Accessibility: every icon-only button has an `aria-label`, visible `focus-visible` rings, a live region announces Pip's new line, and all interactions work with a keyboard.
- Copy uses words a 4-year-old knows. Sentences under 8 words in the child area. Sentence case. Emojis allowed only as mood faces and stickers.
