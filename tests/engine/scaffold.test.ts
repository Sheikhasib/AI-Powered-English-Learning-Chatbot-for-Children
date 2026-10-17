import { describe, expect, it } from "vitest";
import { easiestItem, scaffoldFor } from "@/engine/scaffold";
import { getSkill } from "@/engine/curriculum";

describe("scaffoldFor", () => {
  it("offers nothing extra with no misses or one miss", () => {
    expect(scaffoldFor(0)).toEqual({ showHint: false, easier: false });
    expect(scaffoldFor(1)).toEqual({ showHint: false, easier: false });
  });

  it("offers a hint after 2 misses", () => {
    expect(scaffoldFor(2)).toEqual({ showHint: true, easier: false });
  });

  it("makes the task easier after 3 misses and keeps the hint", () => {
    expect(scaffoldFor(3)).toEqual({ showHint: true, easier: true });
    expect(scaffoldFor(7)).toEqual({ showHint: true, easier: true });
  });
});

describe("easiestItem", () => {
  it("is the first item taught in the skill", () => {
    const skill = getSkill("l2.animals")!; // test data: id exists in the curriculum
    expect(easiestItem(skill)).toBe(skill.items[0]);
  });
});
