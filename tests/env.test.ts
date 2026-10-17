import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

const valid = {
  DATABASE_URL: "postgres://user:pass@host:5432/db",
  OPENCODE_API_KEY: "test-key",
  KV_REST_API_URL: "https://example.upstash.io",
  KV_REST_API_TOKEN: "test-token",
  PARENT_GATE_SECRET: "0123456789abcdef",
};

describe("parseEnv", () => {
  it("fills defaults for the optional LLM settings", () => {
    const env = parseEnv(valid);
    expect(env.LLM_BASE_URL).toBe("https://opencode.ai/zen/v1");
    expect(env.LLM_MODEL).toBe("big-pickle");
    expect(env.LLM_FIRST_TOKEN_TIMEOUT_MS).toBe(1200);
  });

  it("reads overrides and coerces the timeout to a number", () => {
    const env = parseEnv({ ...valid, LLM_MODEL: "other", LLM_FIRST_TOKEN_TIMEOUT_MS: "900" });
    expect(env.LLM_MODEL).toBe("other");
    expect(env.LLM_FIRST_TOKEN_TIMEOUT_MS).toBe(900);
  });

  it("names every missing variable in the error", () => {
    expect(() => parseEnv({})).toThrowError(/DATABASE_URL/);
    expect(() => parseEnv({})).toThrowError(/OPENCODE_API_KEY/);
    expect(() => parseEnv({})).toThrowError(/PARENT_GATE_SECRET/);
  });

  it("treats empty strings like missing values", () => {
    expect(() => parseEnv({ ...valid, OPENCODE_API_KEY: "" })).toThrowError(/OPENCODE_API_KEY/);
  });

  it("rejects a parent gate secret that is too short to sign with", () => {
    expect(() => parseEnv({ ...valid, PARENT_GATE_SECRET: "short" })).toThrowError(/PARENT_GATE_SECRET/);
  });

  it("never puts a secret value in the error message", () => {
    expect(() => parseEnv({ ...valid, PARENT_GATE_SECRET: "short", KV_REST_API_URL: "nope" })).toThrowError(
      expect.objectContaining({ message: expect.not.stringContaining("short") }),
    );
  });
});
