import { describe, expect, it } from "vitest";
import { selEventForTransition } from "@/engine/sel/events";

describe("selEventForTransition", () => {
  it("logs when Support is entered", () => {
    expect(selEventForTransition("LEARN", "SUPPORT")).toBe("support-entered");
    expect(selEventForTransition("CHAT", "SUPPORT")).toBe("support-entered");
  });

  it("logs when Support is left", () => {
    expect(selEventForTransition("SUPPORT", "CHAT")).toBe("support-left");
    expect(selEventForTransition("SUPPORT", "PLAY")).toBe("support-left");
  });

  it("logs nothing when the mode does not change or Support is not involved", () => {
    expect(selEventForTransition("SUPPORT", "SUPPORT")).toBeNull();
    expect(selEventForTransition("LEARN", "PLAY")).toBeNull();
  });

  it("logs moving between Support and Calm as leaving or entering Support", () => {
    expect(selEventForTransition("SUPPORT", "CALM")).toBe("support-left");
    expect(selEventForTransition("CALM", "SUPPORT")).toBe("support-entered");
  });
});
