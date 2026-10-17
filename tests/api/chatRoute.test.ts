import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSkill } from "@/engine/curriculum";
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
  mocks.allow.mockClear();
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

  it("replaces praise after a mood tap, where no card was answered", async () => {
    mocks.model = textModel("Great job tapping the card! Tap the dog!");
    const { chunks } = await run({ kind: "mood", mood: "HAPPY" });
    const turn = chunks.find((c) => c.type === "data-turn")?.data as { fallbackLine: string };
    expect(textOf(chunks)).toBe(turn.fallbackLine);
    expect(textOf(chunks)).not.toMatch(/great job|tapping the card/i);
  });

  it("keeps praise after a right card", async () => {
    const item = getSkill("l2.animals")?.items[0];
    mocks.loadTurnContext.mockResolvedValue({ ...context, profile: { ...context.profile, level: 2 } });
    mocks.model = textModel("Great job!");
    const { chunks } = await run({ kind: "card", activityId: `l2.animals:listen-tap:${item?.id}`, choiceId: item?.id ?? "", responseMs: 2000 });
    expect(textOf(chunks)).toContain("Great job!");
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

  it("ends a Support reply on the coping choice and drops the old praise and question", async () => {
    mocks.model = textModel("Great job! Which one starts with duh? Do you want to breathe, or play a slow game?");
    const { chunks } = await run({ kind: "mood", mood: "SAD" });
    const turn = chunks.find((c) => c.type === "data-turn")?.data as { mode: string; activity: { prompt: string } };
    expect(turn.mode).toBe("SUPPORT");
    expect(textOf(chunks)).not.toMatch(/great job|duh/i);
    expect(textOf(chunks).endsWith(turn.activity.prompt)).toBe(true);
  });

  it("keeps a comforting Support sentence but drops a copied quiz question", async () => {
    mocks.model = textModel("I am right here with you. Which one starts with duh?");
    const { chunks } = await run({ kind: "mood", mood: "SAD" });
    const turn = chunks.find((c) => c.type === "data-turn")?.data as { activity: { prompt: string } };
    expect(textOf(chunks)).toContain("I am right here with you.");
    expect(textOf(chunks)).not.toContain("duh");
    expect(textOf(chunks).endsWith(turn.activity.prompt)).toBe(true);
  });

  it("does not replay earlier quiz turns to the model in Support", async () => {
    const quiz = { childInput: "[card] dog", botReply: "Great job! Which one starts with duh?", mode: "LEARN" as const, mood: null, activityId: null, correct: true, responseMs: 900, createdAt: new Date() };
    mocks.loadTurnContext.mockResolvedValue({ ...context, turns: [quiz], turnCount: 1 });
    const model = textModel("I am here with you.");
    mocks.model = model;
    await run({ kind: "mood", mood: "SAD" });
    expect(JSON.stringify(model.doStreamCalls[0]?.prompt)).not.toContain("duh");
  });

  it("ends the reply after a right card on the next activity's prompt, not the old one", async () => {
    const item = getSkill("l2.animals")?.items[0];
    const activityId = `l2.animals:listen-tap:${item?.id}`;
    const previous = { childInput: "[card] x", botReply: "Which one starts with duh?", mode: "LEARN" as const, mood: null, activityId, correct: null, responseMs: null, createdAt: new Date() };
    mocks.loadTurnContext.mockResolvedValue({ ...context, profile: { ...context.profile, level: 2 }, turns: [previous], turnCount: 1 });
    mocks.model = textModel("Great job! Which one starts with duh?");
    const { chunks } = await run({ kind: "card", activityId, choiceId: item?.id ?? "", responseMs: 2000 });
    const turn = chunks.find((c) => c.type === "data-turn")?.data as { activity: { id: string; prompt: string; choices: { id: string }[] } };
    expect(turn.activity.id).not.toBe(activityId);
    expect(textOf(chunks)).not.toContain("duh");
    expect(textOf(chunks).endsWith(turn.activity.prompt)).toBe(true);
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

  it("rejects by Content-Length before reading a body that claims to be over 2 KB", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "content-length": "5000" },
      body: JSON.stringify({ profileId: PROFILE_ID, sessionId: SESSION_ID, input: { kind: "break" } }),
    });
    const textSpy = vi.spyOn(request, "text");
    expect((await POST(request)).status).toBe(413);
    expect(textSpy).not.toHaveBeenCalled();
  });

  it("counts real bytes, so a short multi-byte message over 2 KB is rejected", async () => {
    const text = "€".repeat(800);
    expect(text.length).toBeLessThan(2048);
    const body = JSON.stringify({ profileId: PROFILE_ID, sessionId: SESSION_ID, input: { kind: "text", text } });
    expect((await POST(chatRequest({}, body))).status).toBe(413);
  });

  it("accepts a body just under 2 KB", async () => {
    expect((await POST(chatRequest({ kind: "break" }))).status).toBe(200);
  });

  it("treats a device cookie that is not a UUID as no device", async () => {
    for (const value of ["not-a-uuid", "../../etc/passwd", "6f1d3c1e-5b7a-4c1e-9a52-0d3b1b0c7a1"]) {
      mocks.cookie = value;
      expect((await POST(chatRequest({ kind: "break" }))).status).toBe(401);
    }
    expect(mocks.allow).not.toHaveBeenCalled();
  });

  it("returns 404 when the profile or session is not this device's", async () => {
    mocks.loadTurnContext.mockResolvedValue(null);
    expect((await POST(chatRequest({ kind: "break" }))).status).toBe(404);
  });
});
