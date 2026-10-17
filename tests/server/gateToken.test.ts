import { describe, expect, it } from "vitest";
import {
  CHALLENGE_TTL_MS,
  GATE_COOKIE_MAX_AGE_SECONDS,
  createChallengeToken,
  createGateToken,
  isChallengeAnswerRight,
  isGateTokenValid,
} from "@/server/repositories/gateToken";

const SECRET = "a-test-secret-of-16+chars";
const NOW = 1_700_000_000_000;

describe("gate cookie", () => {
  it("accepts a fresh token signed with the same secret", () => {
    expect(isGateTokenValid(createGateToken(SECRET, NOW), SECRET, NOW + 1000)).toBe(true);
  });

  it("expires after 15 minutes", () => {
    const token = createGateToken(SECRET, NOW);
    const justBefore = NOW + GATE_COOKIE_MAX_AGE_SECONDS * 1000 - 1;
    expect(isGateTokenValid(token, SECRET, justBefore)).toBe(true);
    expect(isGateTokenValid(token, SECRET, justBefore + 1)).toBe(false);
  });

  it("rejects a token signed with another secret", () => {
    expect(isGateTokenValid(createGateToken("another-secret-16-chars", NOW), SECRET, NOW)).toBe(false);
  });

  it("rejects a token whose payload was edited", () => {
    const [, signature] = createGateToken(SECRET, NOW).split(".");
    const forgedBody = Buffer.from(JSON.stringify({ kind: "gate", exp: NOW * 2 })).toString("base64url");
    expect(isGateTokenValid(`${forgedBody}.${signature}`, SECRET, NOW)).toBe(false);
  });

  it.each([undefined, "", "abc", "a.b.c", "."])("rejects malformed value %j", (value) => {
    expect(isGateTokenValid(value, SECRET, NOW)).toBe(false);
  });

  it("does not accept a challenge token as a gate cookie", () => {
    expect(isGateTokenValid(createChallengeToken(17, SECRET, NOW), SECRET, NOW)).toBe(false);
  });
});

describe("gate challenge", () => {
  it("accepts only the sealed answer", () => {
    const token = createChallengeToken(17, SECRET, NOW);
    expect(isChallengeAnswerRight(token, 17, SECRET, NOW)).toBe(true);
    expect(isChallengeAnswerRight(token, 15, SECRET, NOW)).toBe(false);
  });

  it("expires after two minutes", () => {
    const token = createChallengeToken(17, SECRET, NOW);
    expect(isChallengeAnswerRight(token, 17, SECRET, NOW + CHALLENGE_TTL_MS)).toBe(false);
  });

  it("does not accept a gate cookie as a challenge", () => {
    expect(isChallengeAnswerRight(createGateToken(SECRET, NOW), 17, SECRET, NOW)).toBe(false);
  });
});
