import { z } from "zod";

export const levelIdSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export type LevelId = z.infer<typeof levelIdSchema>;

export const ACTIVITY_KINDS = [
  "listen-tap",
  "say-it",
  "picture-match",
  "odd-one-out",
  "first-sound",
  "finish-sentence",
  "build-story",
] as const;
export const activityKindSchema = z.enum(ACTIVITY_KINDS);
export type ActivityKind = z.infer<typeof activityKindSchema>;

/** Marks the blank in a finish-sentence template. */
export const BLANK = "___";

export const itemSchema = z.object({
  id: z.string().min(1),
  word: z.string().min(1),
  /** Emoji or a /cards/x.svg path. */
  picture: z.string().min(1),
  /** Phonics hint, e.g. "buh". */
  sound: z.string().min(1).optional(),
  /** L3 template containing the blank, e.g. "I like ___." */
  sentence: z.string().optional(),
  /** Odd-one-out category, or the story an ordered step belongs to. */
  group: z.string().min(1).optional(),
  /** Correct reply for yes/no questions. */
  answer: z.enum(["yes", "no"]).optional(),
});
export type Item = z.infer<typeof itemSchema>;

export const skillSchema = z
  .object({
    id: z.string().min(1),
    level: levelIdSchema,
    title: z.string().min(1),
    unit: z.string().min(1),
    order: z.number().int().nonnegative(),
    items: z.array(itemSchema).min(4).max(10),
    activityKinds: z.array(activityKindSchema).min(1),
  })
  .superRefine((skill, ctx) => {
    const fail = (message: string) =>
      ctx.addIssue({ code: "custom", message: `${skill.id}: ${message}` });
    const items = skill.items;
    for (const kind of skill.activityKinds) {
      if (kind === "first-sound") {
        const sounds = new Set(items.map((i) => i.sound));
        if (items.some((i) => !i.sound) || sounds.size < 2) {
          fail("first-sound needs a sound on every item and 2+ different sounds");
        }
      }
      if (kind === "finish-sentence" && items.some((i) => !i.sentence?.includes(BLANK))) {
        fail(`finish-sentence needs a sentence containing ${BLANK} on every item`);
      }
      if (kind === "odd-one-out" && !hasOddOneOutGroups(items)) {
        fail("odd-one-out needs one group with 2+ items and an item from another group");
      }
      if (kind === "build-story" && !hasStoryGroups(items)) {
        fail("build-story needs every item in a group of 3 steps with a sentence");
      }
      if (kind === "picture-match" && items.some((i) => i.answer) && items.some((i) => !i.answer)) {
        fail("yes/no items cannot be mixed with plain items");
      }
    }
  });
export type Skill = z.infer<typeof skillSchema>;

function hasOddOneOutGroups(items: Item[]): boolean {
  const sizes = new Map<string, number>();
  for (const item of items) {
    if (!item.group) return false;
    sizes.set(item.group, (sizes.get(item.group) ?? 0) + 1);
  }
  return sizes.size >= 2 && [...sizes.values()].some((n) => n >= 2);
}

function hasStoryGroups(items: Item[]): boolean {
  const sizes = new Map<string, number>();
  for (const item of items) {
    if (!item.group || !item.sentence) return false;
    sizes.set(item.group, (sizes.get(item.group) ?? 0) + 1);
  }
  return [...sizes.values()].every((n) => n === 3);
}

export const choiceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  picture: z.string().min(1),
});
export type Choice = z.infer<typeof choiceSchema>;

export const activitySchema = z.object({
  id: z.string().min(1),
  skillId: z.string().min(1),
  kind: activityKindSchema,
  /** The scripted line Pip says; also the fallback when the LLM is slow. */
  prompt: z.string().min(1),
  choices: z.array(choiceSchema).min(2).max(4),
  /** Null for open activities (say-it, build-story). */
  answerId: z.string().nullable(),
  hint: z.string().min(1),
});
export type Activity = z.infer<typeof activitySchema>;
