# 08: Welcome, profiles, level map and sticker book

Priority: P0 (map and stickers P1) · Depends on: 07-buddy-ui

## Goal
A grown-up sets up a child profile in under 30 seconds; the child picks their avatar and starts. A level map and sticker book show progress in pictures.

## Files
- `src/app/(child)/page.tsx`: welcome. Pip waves; list of profile avatars on this device plus "Add a friend" (opens a parental gate first).
- `src/app/(child)/new/page.tsx`: profile form: nickname (max 12 letters, letters only), age band (two big buttons), avatar (8 animal avatars), interests (pick up to 3 of: animals, space, cars, dinosaurs, music, food, sports, nature).
- `src/app/api/profile/route.ts`: POST create (Zod), bound to the device cookie, max 4 profiles per device.
- `src/app/(child)/map/page.tsx` (P1): three islands L1, L2, L3; locked islands are foggy; current skill pulses.
- `src/app/(child)/stickers/page.tsx` (P1): stickers earned per mastered skill.

## Behavior
- No profile yet: welcome shows only "Let's meet Pip!" which opens the gate, then the form.
- The form is for a grown-up, so it may use short text labels, but stays big and friendly.
- Starting a session creates a `Session` row and goes to the check-in, then the buddy screen.

## Acceptance checklist
- [ ] Profile creation validates on client and server with the same Zod schema.
- [ ] No field asks for anything beyond the nickname, age band, avatar and interests.
