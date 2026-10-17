import { describe, expect, it } from "vitest";
import { backHref, childHref, profileIdFrom } from "@/components/buddy/links";

describe("child links", () => {
  it("keeps the friend in the link", () => {
    expect(childHref("/map", "abc-123")).toBe("/map?p=abc-123");
    expect(backHref("abc-123")).toBe("/buddy?p=abc-123");
  });

  it("escapes anything unusual in the id", () => {
    expect(childHref("/stickers", "a&b=c")).toBe("/stickers?p=a%26b%3Dc");
  });

  it("falls back to the welcome screen without an id", () => {
    expect(backHref(undefined)).toBe("/");
  });

  it("accepts only a single non-empty search param", () => {
    expect(profileIdFrom("x")).toBe("x");
    expect(profileIdFrom(["x", "y"])).toBeUndefined();
    expect(profileIdFrom("")).toBeUndefined();
    expect(profileIdFrom(undefined)).toBeUndefined();
  });
});
