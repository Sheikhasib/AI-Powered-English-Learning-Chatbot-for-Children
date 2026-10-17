import { describe, expect, it } from "vitest";
import { inputGuard } from "@/safety/inputGuard";

describe("inputGuard", () => {
  it("lets harmless child talk through", () => {
    expect(inputGuard("I like my dog and the red ball")).toEqual({ action: "ok" });
  });

  it("lets an empty message through", () => {
    expect(inputGuard("")).toEqual({ action: "ok" });
  });

  it("redacts a phone number", () => {
    const result = inputGuard("call me on 555 123 4567 ok");
    expect(result).toMatchObject({ action: "redact", reason: "phone" });
    if (result.action === "redact") expect(result.text).not.toMatch(/\d/);
  });

  it("redacts an email address", () => {
    const result = inputGuard("mail me at sam.k@example.com please");
    expect(result).toMatchObject({ action: "redact", reason: "email" });
    if (result.action === "redact") expect(result.text).not.toContain("@");
  });

  it("redacts a street address", () => {
    const result = inputGuard("I live at 42 Oak Street");
    expect(result).toMatchObject({ action: "redact", reason: "address" });
    if (result.action === "redact") expect(result.text).not.toMatch(/oak/i);
  });

  it("redacts a school name", () => {
    const result = inputGuard("I go to Maple Hill school");
    expect(result).toMatchObject({ action: "redact", reason: "school" });
    if (result.action === "redact") expect(result.text).not.toMatch(/maple/i);
  });

  it("does not redact plain talk about school", () => {
    expect(inputGuard("I go to school on the bus")).toEqual({ action: "ok" });
    expect(inputGuard("I like the school")).toEqual({ action: "ok" });
  });

  it("keeps the first name and redacts the surname after 'my name is'", () => {
    const result = inputGuard("my name is Sam Smith");
    expect(result).toMatchObject({ action: "redact", reason: "surname" });
    if (result.action === "redact") {
      expect(result.text).toContain("Sam");
      expect(result.text).not.toContain("Smith");
    }
  });

  it("keeps a single first name after 'my name is'", () => {
    expect(inputGuard("my name is Sam")).toEqual({ action: "ok" });
    expect(inputGuard("my name is Sam and I like cats")).toEqual({ action: "ok" });
  });

  it("redirects an unsafe topic with a scripted line and no LLM", () => {
    const result = inputGuard("I have a gun");
    expect(result).toMatchObject({ action: "redirect", reason: "unsafe_topic", flagForParent: false });
    if (result.action === "redirect") expect(result.script.length).toBeGreaterThan(0);
  });

  it("matches whole words only for unsafe topics", () => {
    expect(inputGuard("I like to play with my gummy bears")).toEqual({ action: "ok" });
  });

  it.each([
    "someone hurt me",
    "my uncle hits me",
    "he touched me and said keep it secret",
    "I am not safe at home",
    "I'm scared to go home",
  ])("redirects the disclosure %j and flags the parent", (text) => {
    const result = inputGuard(text);
    expect(result).toMatchObject({ action: "redirect", reason: "disclosure", flagForParent: true });
    if (result.action === "redirect") expect(result.script).toMatch(/grown-up/i);
  });

  it("prefers the disclosure script over other findings", () => {
    const result = inputGuard("someone hurt me call 555 123 4567");
    expect(result).toMatchObject({ action: "redirect", reason: "disclosure" });
  });

  it("is case and apostrophe insensitive", () => {
    expect(inputGuard("SOMEONE HURT ME")).toMatchObject({ reason: "disclosure" });
    expect(inputGuard("I’m scared to go home")).toMatchObject({ reason: "disclosure" });
  });
});
