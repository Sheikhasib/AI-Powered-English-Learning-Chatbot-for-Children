import { describe, expect, it } from "vitest";
import { buildIslands, earnedStickers, highestOpenLevel, stickerPicture } from "@/components/buddy/progressView";
import { curriculum } from "@/engine/curriculum";
import { newSkillState } from "@/engine/mastery";
import type { SkillState } from "@/types/engine";

function masteredFirst(level: number, count: number): SkillState[] {
  const skills = curriculum[level - 1].skills;
  return skills.slice(0, count).map((s) => ({ ...newSkillState(s.id), mastery: 0.9 }));
}

describe("highestOpenLevel", () => {
  it("starts at level 1 with no progress", () => {
    expect(highestOpenLevel([])).toBe(1);
  });

  it("opens level 2 when 80% of level 1 is mastered", () => {
    expect(highestOpenLevel(masteredFirst(1, 8))).toBe(2);
    expect(highestOpenLevel(masteredFirst(1, 7))).toBe(1);
  });

  it("opens level 3 once level 2 is also 80% mastered", () => {
    const states = [...masteredFirst(1, 10), ...masteredFirst(2, 7)];
    expect(highestOpenLevel(states)).toBe(3);
  });
});

describe("buildIslands", () => {
  it("makes three islands and fogs the locked ones", () => {
    const islands = buildIslands(masteredFirst(1, 8));
    expect(islands.map((i) => i.locked)).toEqual([false, false, true]);
  });

  it("marks the first unmastered skill of the open level as current", () => {
    const islands = buildIslands(masteredFirst(1, 3));
    const current = islands.flatMap((i) => i.skills).filter((s) => s.current);
    expect(current).toHaveLength(1);
    expect(current[0].id).toBe(curriculum[0].skills[3].id);
  });

  it("has no current skill when everything open is mastered at the last level", () => {
    const all = curriculum.flatMap((l) => l.skills).map((s) => ({ ...newSkillState(s.id), mastery: 1 }));
    expect(buildIslands(all).flatMap((i) => i.skills).some((s) => s.current)).toBe(false);
  });
});

describe("earnedStickers", () => {
  it("gives one sticker per mastered skill, in teaching order", () => {
    const stickers = earnedStickers(masteredFirst(1, 3));
    expect(stickers.map((s) => s.skillId)).toEqual(curriculum[0].skills.slice(0, 3).map((s) => s.id));
  });

  it("gives none before anything is mastered", () => {
    expect(earnedStickers([])).toEqual([]);
  });
});

describe("stickerPicture", () => {
  it("keeps one picture when a skill pictures several", () => {
    expect(stickerPicture("⭐⭐⭐")).toBe("⭐");
  });

  it("keeps multi-part emoji whole", () => {
    expect(stickerPicture("👩‍👧")).toBe("👩‍👧");
  });

  it("leaves image paths alone", () => {
    expect(stickerPicture("/cards/dog.svg")).toBe("/cards/dog.svg");
  });
});
