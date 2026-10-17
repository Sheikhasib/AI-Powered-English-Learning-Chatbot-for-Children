import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { textModel } from "./mockModel";

const SECRET = "gate-secret-for-tests";

const mocks = vi.hoisted(() => ({ model: undefined as unknown }));

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => undefined,
}));
vi.mock("@/lib/env", () => ({ env: { PARENT_GATE_SECRET: "gate-secret-for-tests", LLM_MODEL: "test-model" } }));
vi.mock("@/llm/provider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/llm/provider")>()),
  getChatModel: () => mocks.model,
}));

const { GET } = await import("@/app/api/health/llm/route");

const call = (url: string, headers: Record<string, string> = {}) => GET(new Request(url, { headers }));

beforeEach(() => {
  mocks.model = textModel("Hello little friend, how are you today?");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/health/llm", () => {
  it("is open outside production", async () => {
    vi.stubEnv("NODE_ENV", "test");
    expect((await call("http://localhost/api/health/llm")).status).toBe(200);
  });

  it("is hidden in production without the key", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await call("http://localhost/api/health/llm")).status).toBe(404);
  });

  it("ignores a key in the URL, so the secret never lands in logs or referrers", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await call(`http://localhost/api/health/llm?key=${SECRET}`)).status).toBe(404);
  });

  it("rejects a wrong x-health-key header", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await call("http://localhost/api/health/llm", { "x-health-key": "nope" })).status).toBe(404);
  });

  it("answers in production when x-health-key matches", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await call("http://localhost/api/health/llm", { "x-health-key": SECRET });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ model: "test-model" });
  });
});
