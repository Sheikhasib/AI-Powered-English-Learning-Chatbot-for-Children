/**
 * Runs 30 child turns against a base URL and prints p50 and p95 for the first token and the full reply.
 * Usage: npx tsx scripts/latency-check.ts http://localhost:3000
 */
import { randomInt } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";

const TURNS = 30;
const TURN_INTERVAL_MS = 3200; // keeps us under the 20 turns per minute rate limit
const RETRY_AFTER_429_MS = 10_000;
const NUMBER_WORDS: Record<string, number> = { five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
const TEXTS = ["I like dogs", "I feel sad", "I like my cat", "I am happy"];
const MOODS = ["HAPPY", "SAD", "TIRED", "EXCITED"];

type Choice = { id: string };
type Turn = { activity: { id: string; choices: Choice[] } | null };
type Sample = { firstTokenMs: number; totalMs: number; fallback: boolean };

class RateLimitedError extends Error {}
type Input =
  | { kind: "text"; text: string }
  | { kind: "card"; activityId: string; choiceId: string; responseMs: number }
  | { kind: "mood"; mood: string };

const baseUrl = (process.argv[2] ?? "").replace(/\/$/, "");
if (!baseUrl) {
  process.stderr.write("Usage: npx tsx scripts/latency-check.ts <base-url>\n");
  process.exit(1);
}

const jar = new Map<string, string>();

function remember(response: Response): void {
  for (const line of response.headers.getSetCookie()) {
    const [pair = ""] = line.split(";");
    const at = pair.indexOf("=");
    if (at > 0) jar.set(pair.slice(0, at), pair.slice(at + 1));
  }
}

async function call(path: string, init: { method?: string; body?: unknown } = {}): Promise<Response> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: init.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Cookie: [...jar].map(([name, value]) => `${name}=${value}`).join("; "),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  remember(response);
  return response;
}

async function json<T>(response: Response, what: string): Promise<T> {
  if (!response.ok) throw new Error(`${what} failed with ${response.status}`);
  return (await response.json()) as T;
}

/** Reads one chat stream, timing the first text delta and the end, and keeping the last turn and timing parts. */
async function runTurn(body: unknown): Promise<{ sample: Sample; turn: Turn | null }> {
  const started = performance.now();
  const response = await call("/api/chat", { method: "POST", body });
  if (response.status === 429) throw new RateLimitedError("chat failed with 429");
  if (!response.ok || !response.body) throw new Error(`chat failed with ${response.status}`);

  const decoder = new TextDecoder();
  let buffer = "";
  let firstTokenMs: number | null = null;
  let turn: Turn | null = null;
  let fallback = false;

  const handle = (line: string) => {
    if (!line.startsWith("data: ") || line === "data: [DONE]") return;
    const part = JSON.parse(line.slice(6)) as { type: string; delta?: string; data?: unknown };
    if (part.type === "text-delta" && firstTokenMs === null) firstTokenMs = performance.now() - started;
    if (part.type === "data-turn") turn = part.data as Turn;
    if (part.type === "data-timing") fallback = Boolean((part.data as { fallback: boolean }).fallback);
  };

  const reader = response.body.getReader();
  for (let read = await reader.read(); !read.done; read = await reader.read()) {
    buffer += decoder.decode(read.value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    lines.forEach(handle);
  }
  handle(buffer);

  const totalMs = performance.now() - started;
  return { sample: { firstTokenMs: firstTokenMs ?? totalMs, totalMs, fallback }, turn };
}

function inputFor(index: number, turn: Turn | null): Input {
  const slot = index % 4;
  if (slot === 3) return { kind: "mood", mood: MOODS[index % MOODS.length] ?? "HAPPY" };
  if (slot === 1 || !turn?.activity) return { kind: "text", text: TEXTS[index % TEXTS.length] ?? "I like dogs" };
  const choices = turn.activity.choices;
  const pick = choices[randomInt(choices.length)] ?? choices[0];
  return { kind: "card", activityId: turn.activity.id, choiceId: pick?.id ?? "", responseMs: 1500 };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.min(Math.max(rank, 0), sorted.length - 1)] ?? 0;
}

function summarise(samples: Sample[], limitedTurns: number): string {
  const first = samples.map((s) => s.firstTokenMs).sort((a, b) => a - b);
  const total = samples.map((s) => s.totalMs).sort((a, b) => a - b);
  const fallbackRate = (samples.filter((s) => s.fallback).length / samples.length) * 100;
  const ms = (value: number) => `${Math.round(value)} ms`;
  return [
    `Latency against ${baseUrl}, ${samples.length} turns`,
    "",
    "| Metric | p50 | p95 | Target (p95) |",
    "|---|---|---|---|",
    `| First token | ${ms(percentile(first, 50))} | ${ms(percentile(first, 95))} | 1000 ms |`,
    `| Full reply | ${ms(percentile(total, 50))} | ${ms(percentile(total, 95))} | 2000 ms |`,
    "",
    "| Fallback rate | Turns that got a 429 |",
    "|---|---|",
    `| ${fallbackRate.toFixed(1)}% | ${limitedTurns} |`,
  ].join("\n");
}

/** Retries a rate-limited turn once after a pause; reports whether it was limited. */
async function runTurnWithRetry(body: unknown): Promise<{ sample: Sample; turn: Turn | null; limited: boolean }> {
  try {
    return { ...(await runTurn(body)), limited: false };
  } catch (error) {
    if (!(error instanceof RateLimitedError)) throw error;
    await sleep(RETRY_AFTER_429_MS);
    return { ...(await runTurn(body)), limited: true };
  }
}

/** Solves the gate's sum in words ("seven plus nine") the way a grown-up would. */
function solve(question: string): number {
  return question.split(" plus ").reduce((sum, word) => sum + (NUMBER_WORDS[word.trim()] ?? 0), 0);
}

async function deleteProfile(profileId: string): Promise<void> {
  const challenge = await json<{ question: string; token: string }>(await call("/parent-gate/challenge"), "gate challenge");
  const verified = await call("/parent-gate/verify", {
    method: "POST",
    body: { token: challenge.token, answer: solve(challenge.question) },
  });
  if (!verified.ok) throw new Error(`gate failed with ${verified.status}`);
  const deleted = await call(`/api/profile?id=${encodeURIComponent(profileId)}`, { method: "DELETE" });
  if (deleted.status !== 204) throw new Error(`profile delete failed with ${deleted.status}`);
}

async function main(): Promise<void> {
  const created = await json<{ profile: { id: string } }>(
    await call("/api/profile", {
      method: "POST",
      body: { nickname: "Latency", ageBand: "AGE_5_6", avatar: "fox", interests: ["animals"] },
    }),
    "profile create",
  );
  const profileId = created.profile.id;

  const samples: Sample[] = [];
  let limitedTurns = 0;
  try {
    const session = await json<{ sessionId: string }>(
      await call("/api/session", { method: "POST", body: { profileId, checkIn: "HAPPY" } }),
      "session start",
    );
    let turn: Turn | null = null;
    for (let i = 0; i < TURNS; i++) {
      const turnStarted = performance.now();
      const result = await runTurnWithRetry({ profileId, sessionId: session.sessionId, input: inputFor(i, turn) });
      samples.push(result.sample);
      if (result.limited) limitedTurns += 1;
      turn = result.turn;
      await sleep(Math.max(0, TURN_INTERVAL_MS - (performance.now() - turnStarted)));
    }
  } finally {
    try {
      await deleteProfile(profileId);
    } catch (error) {
      process.stderr.write(`Could not delete test profile ${profileId}: ${String(error)}\n`);
      process.exitCode = 1;
    }
  }
  if (samples.length > 0) process.stdout.write(`${summarise(samples, limitedTurns)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
