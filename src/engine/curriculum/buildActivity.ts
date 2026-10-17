import {
  CHOICES_AGE_3_4_FIRST,
  CHOICES_DEFAULT,
  MAX_CHOICES,
  MIN_CHOICES,
} from "../config";
import { pickOne, shuffle } from "../rng";
import type { AgeBand, Rng } from "@/types/domain";
import {
  BLANK,
  type Activity,
  type ActivityKind,
  type Choice,
  type Item,
  type Skill,
} from "./types";

export type BuildOptions = {
  /** Item to teach; random when omitted. */
  target?: Item;
  /** Overrides the age-based number of cards (used for easier retries). */
  choiceCount?: number;
};

const YES_NO_CHOICES: Choice[] = [
  { id: "yes", label: "Yes", picture: "👍" },
  { id: "no", label: "No", picture: "👎" },
];

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const toChoice = (item: Item): Choice => ({ id: item.id, label: item.word, picture: item.picture });

function choiceCountFor(ageBand: AgeBand, override?: number): number {
  const count = override ?? (ageBand === "AGE_3_4" ? CHOICES_AGE_3_4_FIRST : CHOICES_DEFAULT);
  return Math.min(MAX_CHOICES, Math.max(MIN_CHOICES, count));
}

/** Distractors share the skill but never the target's id, picture or (when asked) first sound. */
function distractorsFor(skill: Skill, target: Item, count: number, rng: Rng, differentSound: boolean): Item[] {
  const pool = skill.items.filter(
    (item) =>
      item.id !== target.id &&
      item.picture !== target.picture &&
      (!differentSound || item.sound !== target.sound),
  );
  return shuffle(pool, rng).slice(0, count);
}

function hintFor(target: Item): string {
  return target.sound
    ? `${capitalize(target.word)} starts with ${target.sound}.`
    : `Look for the ${target.word}.`;
}

function base(skill: Skill, kind: ActivityKind, idSuffix: string) {
  return { id: `${skill.id}:${kind}:${idSuffix}`, skillId: skill.id, kind };
}

function buildYesNo(skill: Skill, target: Item): Activity {
  return {
    ...base(skill, "picture-match", target.id),
    prompt: target.sentence ?? "",
    choices: YES_NO_CHOICES,
    answerId: target.answer ?? null,
    hint: `Think about the ${target.word}.`,
  };
}

function buildOddOneOut(skill: Skill, rng: Rng): Activity {
  const groups = Map.groupBy(skill.items, (item) => item.group);
  const pairable = [...groups.entries()].filter(([, items]) => items.length >= 2);
  const [sameGroup, sameItems] = pickOne(pairable, rng);
  const odd = pickOne(skill.items.filter((item) => item.group !== sameGroup), rng);
  const pair = shuffle(sameItems, rng).slice(0, 2);
  return {
    ...base(skill, "odd-one-out", odd.id),
    prompt: "Which one is different?",
    choices: shuffle([...pair, odd], rng).map(toChoice),
    answerId: odd.id,
    hint: `Look at the ${odd.word}.`,
  };
}

function buildStory(skill: Skill, rng: Rng): Activity {
  const stories = [...Map.groupBy(skill.items, (item) => item.group).entries()];
  const [story, steps] = pickOne(stories, rng);
  return {
    ...base(skill, "build-story", String(story)),
    prompt: "Put the pictures in order!",
    choices: shuffle(steps, rng).map(toChoice),
    answerId: null,
    hint: steps[0].sentence ?? "Which comes first?",
  };
}

/**
 * Builds one scripted activity: a target, same-skill distractors with no repeated picture,
 * all shuffled by the seeded rng. 3-4 year olds get 2 cards unless `choiceCount` says otherwise.
 */
export function buildActivity(
  skill: Skill,
  kind: ActivityKind,
  rng: Rng,
  ageBand: AgeBand,
  options: BuildOptions = {},
): Activity {
  if (!skill.activityKinds.includes(kind)) {
    throw new Error(`${skill.id} does not support ${kind}`);
  }
  const target = options.target ?? pickOne(skill.items, rng);

  if (kind === "odd-one-out") return buildOddOneOut(skill, rng);
  if (kind === "build-story") return buildStory(skill, rng);
  if (target.answer) return buildYesNo(skill, target);

  const count = choiceCountFor(ageBand, options.choiceCount);
  const others = distractorsFor(skill, target, count - 1, rng, kind === "first-sound");
  const choices = shuffle([target, ...others], rng).map(toChoice);
  const common = { ...base(skill, kind, target.id), choices };

  switch (kind) {
    case "say-it":
      return { ...common, prompt: `Say ${target.word}!`, answerId: null, hint: hintFor(target) };
    case "first-sound":
      return { ...common, prompt: `Which one starts with ${target.sound}?`, answerId: target.id, hint: `Say it slowly: ${target.word}.` };
    case "finish-sentence": {
      const template = target.sentence ?? "";
      return {
        ...common,
        prompt: `${template.replace(BLANK, "...")} Tap the ${target.word}!`,
        answerId: target.id,
        hint: `Say: ${template.replace(BLANK, target.word)}`,
      };
    }
    case "picture-match":
      return { ...common, prompt: `Find the ${target.word}!`, answerId: target.id, hint: hintFor(target) };
    default:
      return { ...common, prompt: `Tap the ${target.word}!`, answerId: target.id, hint: hintFor(target) };
  }
}
