# 10: Design system

Priority: P0 · Build with 01 · Depends on: none

## Goal
One warm, calm, playful visual language that feels made for young children (in the spirit of Khan Academy Kids and Duolingo ABC) without being loud. All values live as tokens in `src/app/globals.css`.

## Tech used
Tailwind CSS 4 `@theme` tokens, shadcn/ui primitives restyled, Motion, Lucide, Andika via `next/font/google`.

## Tokens
| Token | Value | Use |
|---|---|---|
| `--background` | `#FFF8EE` | warm cream page |
| `--foreground` | `#2D2A4A` | ink text (contrast 13:1 on background) |
| `--card` | `#FFFFFF` | cards, bubble |
| `--muted` | `#F3EDE3` | quiet surfaces, skeletons |
| `--muted-foreground` | `#5E5A78` | secondary text (grown-up area) |
| `--border` | `#E8DFD1` | soft outlines |
| `--primary` | `#167570` | Pip teal: main buttons (white text, 5:1) |
| `--accent` | `#FFC93C` | sunshine: the one next action (ink text) |
| `--success` | `#2E9E6A` with ink text on `#E3F6EC` | correct feedback (paired with a star icon) |
| `--gentle` | `#F08A6B` with ink text on `#FFE9E1` | try-again feedback (never red) |
| `--destructive` | `#B42318` | grown-up area only (delete) |
| `--ring` | `#167570` | focus ring, 3 px |
| Mode tints | Learn `#E6F4FF`, Chat `#F1EBFF`, Play `#FFF4CC`, Support `#FFE9E1`, Calm `#E5F7EF` | buddy background per mode |
| Pip | body `#8F79D6`, belly `#F6E7D3`, beak and feet `#F5A623`, eyes `#2D2A4A` | the mascot |
| `--radius` | `1.5rem` | cards 24 px, buttons fully round |

Light theme only for the child area (a dark theme is out of scope); the grown-up area uses the same tokens.

## Type
Andika everywhere. Child area: Pip's bubble 26 px / 1.35, card labels 22 px bold, buttons 22 px. Grown-up area: 16 px body, 14 px meta, 24 px headings.

## Components and patterns
- **Picture card:** 160 x 160 min (phone 2 x 2 grid), white, 24 px radius, 2 px border, picture 64 to 96 px, label under it. States: rest, pressed (scale 0.96), correct (success tint + star pop), try-again (gentle tint + soft wiggle), disabled (60% opacity while Pip speaks).
- **Big button:** pill, 64 px tall, icon + word, primary or accent.
- **Speech bubble:** white card with a tail toward Pip, current spoken word on an accent highlight.
- **Mood face:** 56 px round button with an emoji face and an `aria-label` ("happy").
- **Top bar:** home, stars, mute; 56 px icons.
- **Grown-up area:** clean dashboard look (cards with 16 px radius, shadcn tables, small charts), visually separate from the child area.

## Motion
Motion (`motion/react`). Springs with low bounce (stiffness 300, damping 20). Durations 150 to 400 ms. Pip idles with a slow blink every 4 to 6 s and a gentle bob. Reduced motion: no bob, no scaling, opacity only.

## Acceptance checklist
- [ ] No raw hex or Tailwind palette colors in components; tokens only.
- [ ] All text pairs meet AA contrast.
- [ ] Every interactive element is at least 64 px in the child area.
