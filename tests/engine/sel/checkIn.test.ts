import { describe, expect, it } from "vitest";
import { CHECK_IN_FACES, CHECK_IN_PROMPT, checkInReply } from "@/engine/sel/checkIn";

describe("check-in", () => {
  it("offers exactly 6 faces: happy, okay, sad, angry, tired, excited", () => {
    expect(CHECK_IN_FACES.map((f) => f.mood)).toEqual(["HAPPY", "OKAY", "SAD", "ANGRY", "TIRED", "EXCITED"]);
  });

  it("gives every face an emoji and a label", () => {
    for (const face of CHECK_IN_FACES) {
      expect(face.emoji.length).toBeGreaterThan(0);
      expect(face.label.length).toBeGreaterThan(0);
    }
  });

  it("asks in words a 4-year-old knows", () => {
    expect(CHECK_IN_PROMPT).toBe("How do you feel today?");
  });

  it("names the feeling back and thanks the child", () => {
    expect(checkInReply("TIRED").line).toBe("You feel tired. Thank you for telling me.");
    expect(checkInReply("EXCITED").line).toBe("You feel excited. Thank you for telling me.");
  });

  it("seeds the first turn with the chosen feeling", () => {
    for (const face of CHECK_IN_FACES) expect(checkInReply(face.mood).feeling).toBe(face.mood);
  });
});
