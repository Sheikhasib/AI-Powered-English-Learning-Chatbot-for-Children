import { describe, expect, it } from "vitest";
import { curriculum, getSkill } from "@/engine/curriculum";
import { buildActivity } from "@/engine/curriculum/buildActivity";
import { activitySchema } from "@/engine/curriculum/types";
import { createRng } from "@/engine/rng";
import type { AgeBand } from "@/types/domain";

const animals = getSkill("l2.animals")!; // test data: id exists in the curriculum
const bands: AgeBand[] = ["AGE_3_4", "AGE_5_6"];

describe("buildActivity", () => {
  it("is deterministic for a fixed seed", () => {
    const a = buildActivity(animals, "listen-tap", createRng(5), "AGE_5_6");
    const b = buildActivity(animals, "listen-tap", createRng(5), "AGE_5_6");
    expect(a).toEqual(b);
  });

  it("always includes the answer among the choices", () => {
    for (let seed = 0; seed < 50; seed++) {
      const activity = buildActivity(animals, "listen-tap", createRng(seed), "AGE_3_4");
      expect(activity.choices.map((c) => c.id)).toContain(activity.answerId);
    }
  });

  it("never repeats a choice id or a picture", () => {
    for (let seed = 0; seed < 50; seed++) {
      const { choices } = buildActivity(animals, "picture-match", createRng(seed), "AGE_5_6");
      expect(new Set(choices.map((c) => c.id)).size).toBe(choices.length);
      expect(new Set(choices.map((c) => c.picture)).size).toBe(choices.length);
    }
  });

  it("gives 2 choices to 3-4 year olds on a first attempt", () => {
    const activity = buildActivity(animals, "listen-tap", createRng(1), "AGE_3_4");
    expect(activity.choices).toHaveLength(2);
  });

  it("gives 3 choices to 5-6 year olds", () => {
    const activity = buildActivity(animals, "listen-tap", createRng(1), "AGE_5_6");
    expect(activity.choices).toHaveLength(3);
  });

  it("honours an explicit choice count and clamps it to 2 to 4", () => {
    const four = buildActivity(animals, "listen-tap", createRng(1), "AGE_3_4", { choiceCount: 4 });
    const nine = buildActivity(animals, "listen-tap", createRng(1), "AGE_3_4", { choiceCount: 9 });
    const one = buildActivity(animals, "listen-tap", createRng(1), "AGE_5_6", { choiceCount: 1 });
    expect(four.choices).toHaveLength(4);
    expect(nine.choices).toHaveLength(4);
    expect(one.choices).toHaveLength(2);
  });

  it("teaches the requested target item", () => {
    const cow = animals.items.find((i) => i.word === "cow")!; // test data
    const activity = buildActivity(animals, "listen-tap", createRng(2), "AGE_5_6", { target: cow });
    expect(activity.answerId).toBe(cow.id);
    expect(activity.prompt).toBe("Tap the cow!");
  });

  it("leaves say-it open but still shows the target card", () => {
    const activity = buildActivity(animals, "say-it", createRng(2), "AGE_5_6");
    expect(activity.answerId).toBeNull();
    expect(activity.prompt.startsWith("Say ")).toBe(true);
    expect(activity.choices.length).toBeGreaterThanOrEqual(2);
  });

  it("asks first-sound questions with distractors that start differently", () => {
    const letters = getSkill("l1.letters.a-e")!; // test data
    for (let seed = 0; seed < 30; seed++) {
      const activity = buildActivity(letters, "first-sound", createRng(seed), "AGE_5_6");
      const target = letters.items.find((i) => i.id === activity.answerId)!;
      const sounds = activity.choices.map((c) => letters.items.find((i) => i.id === c.id)!.sound);
      expect(sounds.filter((s) => s === target.sound)).toHaveLength(1);
      expect(activity.prompt).toContain(target.sound);
    }
  });

  it("finds the odd one out with 3 cards even for 3-4 year olds", () => {
    for (let seed = 0; seed < 30; seed++) {
      const activity = buildActivity(animals, "odd-one-out", createRng(seed), "AGE_3_4");
      const byId = (id: string) => animals.items.find((i) => i.id === id)!;
      const groups = activity.choices.map((c) => byId(c.id).group);
      expect(activity.choices).toHaveLength(3);
      expect(groups.filter((g) => g === byId(activity.answerId!).group)).toHaveLength(1);
      expect(new Set(groups).size).toBe(2);
    }
  });

  it("answers yes/no questions with a thumbs up or down card", () => {
    const yesNo = getSkill("l3.yes-no")!; // test data
    const activity = buildActivity(yesNo, "picture-match", createRng(4), "AGE_5_6");
    const item = yesNo.items.find((i) => activity.prompt === i.sentence)!;
    expect(activity.choices.map((c) => c.id)).toEqual(["yes", "no"]);
    expect(activity.answerId).toBe(item.answer);
  });

  it("builds a story ordering task from one story's three steps", () => {
    const stories = getSkill("l3.stories")!; // test data
    const activity = buildActivity(stories, "build-story", createRng(4), "AGE_3_4");
    const groups = activity.choices.map((c) => stories.items.find((i) => i.id === c.id)!.group);
    expect(activity.answerId).toBeNull();
    expect(activity.choices).toHaveLength(3);
    expect(new Set(groups).size).toBe(1);
  });

  it("finishes a sentence by naming the card to tap", () => {
    const iLike = getSkill("l3.i-like")!; // test data
    const activity = buildActivity(iLike, "finish-sentence", createRng(3), "AGE_5_6");
    const target = iLike.items.find((i) => i.id === activity.answerId)!;
    expect(activity.prompt).toContain(`Tap the ${target.word}`);
    expect(activity.hint).toContain(target.word);
  });

  it("rejects a kind the skill does not use", () => {
    expect(() => buildActivity(animals, "build-story", createRng(1), "AGE_5_6")).toThrow();
  });

  it("builds a valid activity for every skill, kind, age band and seed", () => {
    for (const skill of curriculum.flatMap((l) => l.skills)) {
      for (const kind of skill.activityKinds) {
        for (const band of bands) {
          for (let seed = 0; seed < 10; seed++) {
            const activity = buildActivity(skill, kind, createRng(seed), band);
            expect(activitySchema.safeParse(activity).success, `${skill.id} ${kind}`).toBe(true);
            if (activity.answerId) {
              expect(activity.choices.map((c) => c.id)).toContain(activity.answerId);
            }
          }
        }
      }
    }
  });
});
