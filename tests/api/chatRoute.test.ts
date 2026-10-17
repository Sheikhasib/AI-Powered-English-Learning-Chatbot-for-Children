import { beforeEach, describe, expect, it, vi } from "vitest";
import { DISCLOSURE_SCRIPT } from "@/safety/lists";
import type { TurnContext } from "@/server/repositories/context";
import { failingModel, parseChunks, textModel } from "./mockModel";

const PROFILE_ID = "cjld2cjxh0000qzrmn831i7rn";
const SESSION_ID = "cjld2cyuq0000t3rmniod1foy";
const FIRST_TOKEN_TIMEOUT_MS = 150;

const mocks = vi.hoisted(() => ({
  model: undefined as unknown,
  cookie: "6f1d3c1e-5b7a-4c1e-9a52-0d3b1b0c7a11" as string | undefined,
  allow: vi.fn(async () => true),
  loadTurnContext: vi.fn(),
  persistTurn: vi.fn<(db: unknown, turn: Record<string, unknown>) => Promise<string>>(async () => "turn-1"),
  setTurnMood: vi.fn(async () => undefined),
  setProfileSummary: vi.fn(async () => undefined),
  afterCallbacks: [] as Array<() => Promise<void> | void>,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (name === "pip_device" && mocks.cookie ? { value: mocks.cookie } : undefined) }),
}));
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (callback: () => Promise<void> | void) => void mocks.afterCallbacks.push(callback),
}));
vi.mock("@/lib/env", () => ({ env: { LLM_FIRST_TOKEN_TIMEOUT_MS: 150 } }));
vi.mock("@/server/db", () => ({ getDb: () => ({}) }));
vi.mock("@/server/ratelimit", () => ({ allowChatTurn: mocks.allow }));
vi.mock("@/server/repositories/context", () => ({ loadTurnContext: mocks.loadTurnContext }));
vi.mock("@/server/repositories/persist", () => ({
  persistTurn: mocks.persistTurn,
  setTurnMood: mocks.setTurnMood,
  setProfileSummary: mocks.setProfileSummary,
}));
vi.mock("@/llm/classifyMood", () => ({ classifyMood: async () => null }));
vi.mock("@/llm/summarize", () => ({ SUMMARY_EVERY_TURNS: 6, summarize: async () => null }));
vi.mock("@/llm/provider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/llm/provider")>()),
  getChatModel: () => mocks.model,
}));

const { POST } = await import("@/app/api/chat/route");

const context: TurnContext = {
  profile: { id: PROFILE_ID, nickname: "Mia", ageBand: "AGE_5_6", interests: ["animals"], level: 1, summary: "" },
  skills: [],
  session: { id: SESSION_ID, startedAt: new Date(), checkIn: "HAPPY" },
  turns: [],
  turnCount: 0,
};

function chatRequest(input: unknown, body?: string): Request {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    body: body ?? JSON.stringify({ profileId: PROFILE_ID, sessionId: SESSION_ID, input }),
  });
}

async function run(input: unknown) {
  const response = await POST(chatRequest(input));
  const chunks = parseChunks(await response.text());
  await Promise.all(mocks.afterCallbacks.map((callback) => callback()));
  return { response, chunks };
}

const textOf = (chunks: Array<Record<string, unknown>>) =>
  chunks.filter((c) => c.type === "text-delta").map((c) => String(c.delta)).join("");

beforeEach(() => {
  mocks.cookie = "6f1d3c1e-5b7a-4c1e-9a52-0d3b1b0c7a11";
  mocks.allow.mockResolvedValue(true);
  mocks.loadTurnContext.mockResolvedValue(context);
  mocks.persistTurn.mockClear();
  mocks.afterCallbacks.length = 0;
  mocks.model = textModel("Great try! Tap the cat!");
});

describe("POST /api/chat", () => {
  it("sends the data-turn part before any text", async () => {
    const { chunks } = await run({ kind: "mood", mood: "HAPPY" });
    const types = chunks.map((c) => c.type);
    expect(types.indexOf("data-turn")).toBeGreaterThanOrEqual(0);
    expect(types.indexOf("data-turn")).toBeLessThan(types.indexOf("text-start"));
    const turn = chunks.find((c) => c.type === "data-turn")?.data as { activity: { choices: unknown[] } | null; fallbackLine: string };
    expect(turn.fallbackLine.length).toBeGreaterThan(0);
    expect(turn.activity?.choices.length).toBeGreaterThanOrEqual(2);
  });

  it("streams the model's safe sentences after the data-turn part", async () => {
    mocks.model = textModel("You feel happy! Tap the dog!");
    const { chunks } = await run({ kind: "mood", mood: "HAPPY" });
    expect(textOf(chunks)).toContain("You feel happy!");
  });

  it("replaces a reply that praises a wrong answer with the scripted line", async () => {
    const answered = { ...context, profile: { ...context.profile, level: 2 } };
    mocks.loadTurnContext.mockResolvedValue(answered);
    mocks.model = textModel("Great job! Tap the cat!");
    const { chunks } = await run({ kind: "card", activityId: "l2.animals:listen-tap:x", choiceId: "nope", responseMs: 2000 });
    const turn = chunks.find((c) => c.type === "data-turn")?.data as { fallbackLine: string };
    expect(textOf(chunks)).toBe(turn.fallbackLine);
    expect(textOf(chunks)).not.toMatch(/great job/i);
    expect(mocks.persistTurn.mock.calls[0]?.[1]).toMatchObject({ fallback: true, correct: false, responseMs: 2000 });
  });

  it("streams the scripted line when the first token is late", async () => {
    mocks.model = textModel("Too late to matter.", { initialDelayMs: FIRST_TOKEN_TIMEOUT_MS * 4 });
    const { chunks } = await run({ kind: "mood", mood: "HAPPY" });
    const turn = chunks.find((c) => c.type === "data-turn")?.data as { fallbackLine: string };
    const types = chunks.map((c) => c.type);
    expect(types.indexOf("data-turn")).toBeLessThan(types.indexOf("text-start"));
    expect(textOf(chunks)).toBe(turn.fallbackLine);
    expect(textOf(chunks)).not.toContain("Too late");
    expect(mocks.persistTurn.mock.calls[0]?.[1]).toMatchObject({ fallback: true });
  });

  it("still gives the child a scripted reply when the model is down", async () => {
    mocks.model = failingModel("401 invalid api key");
    const { response, chunks } = await run({ kind: "mood", mood: "SAD" });
    expect(response.status).toBe(200);
    expect(textOf(chunks)).toContain("It's okay to feel sad.");
  });

  it("replaces a reply that fails the output guard with the scripted line", async () => {
    mocks.model = textModel("Go to www.example.com now.");
    const { chunks } = await run({ kind: "mood", mood: "HAPPY" });
    const turn = chunks.find((c) => c.type === "data-turn")?.data as { fallbackLine: string };
    expect(textOf(chunks)).toBe(turn.fallbackLine);
  });

  it("answers a disclosure with the fixed script and never calls the model", async () => {
    const model = textModel("This must not be said.");
    mocks.model = model;
    const { chunks } = await run({ kind: "text", text: "someone hurt me" });
    expect(textOf(chunks)).toBe(DISCLOSURE_SCRIPT);
    expect(model.doStreamCalls).toHaveLength(0);
    expect(mocks.persistTurn.mock.calls[0]?.[1]).toMatchObject({ safetyFlag: "disclosure", childInput: "[not saved]" });
  });

  it("adds the Server-Timing header with the marks known before the stream", async () => {
    const { response } = await run({ kind: "break" });
    const header = response.headers.get("Server-Timing") ?? "";
    expect(header).toMatch(/t_guard;dur=\d+/);
    expect(header).toMatch(/t_context;dur=\d+/);
    expect(header).toMatch(/t_engine;dur=\d+/);
  });

  it("saves the turn after the response, not before it", async () => {
    const response = await POST(chatRequest({ kind: "break" }));
    await response.text();
    expect(mocks.persistTurn).not.toHaveBeenCalled();
    await Promise.all(mocks.afterCallbacks.map((callback) => callback()));
    expect(mocks.persistTurn).toHaveBeenCalledTimes(1);
  });

  it("returns a friendly 429 when the device is over the limit", async () => {
    mocks.allow.mockResolvedValue(false);
    const response = await POST(chatRequest({ kind: "break" }));
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: { code: "rate_limited", message: "Pip needs a little rest." } });
  });

  it("rejects a body over 2 KB, an invalid body and a missing device", async () => {
    expect((await POST(chatRequest({ kind: "break" }, "x".repeat(3000)))).status).toBe(413);
    expect((await POST(chatRequest({ kind: "text", text: "hi" }, "{not json"))).status).toBe(400);
    expect((await POST(chatRequest({ kind: "text", text: "a".repeat(301) }))).status).toBe(400);
    mocks.cookie = undefined;
    expect((await POST(chatRequest({ kind: "break" }))).status).toBe(401);
  });

  it("returns 404 when the profile or session is not this device's", async () => {
    mocks.loadTurnContext.mockResolvedValue(null);
    expect((await POST(chatRequest({ kind: "break" }))).status).toBe(404);
  });
});
