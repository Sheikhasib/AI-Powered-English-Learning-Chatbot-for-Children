import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const GATE_COOKIE = "pip_parent";
export const GATE_COOKIE_MAX_AGE_SECONDS = 15 * 60;
export const CHALLENGE_TTL_MS = 2 * 60 * 1000;

const payloadSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("gate"), exp: z.number() }),
  z.object({ kind: z.literal("challenge"), exp: z.number(), answer: z.number().int() }),
]);
type Payload = z.infer<typeof payloadSchema>;

function mac(body: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(body).digest();
}

function sign(payload: Payload, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${mac(body, secret).toString("base64url")}`;
}

/** Returns the payload only when the signature matches and it has not expired. */
function verify(token: string | undefined, secret: string, now: number): Payload | null {
  const [body, signature, ...extra] = (token ?? "").split(".");
  if (!body || !signature || extra.length > 0) return null;

  const given = Buffer.from(signature, "base64url");
  const expected = mac(body, secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  try {
    const parsed = payloadSchema.safeParse(JSON.parse(Buffer.from(body, "base64url").toString()));
    return parsed.success && parsed.data.exp > now ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Value of the cookie that opens the grown-up area for 15 minutes. */
export function createGateToken(secret: string, now: number): string {
  return sign({ kind: "gate", exp: now + GATE_COOKIE_MAX_AGE_SECONDS * 1000 }, secret);
}

/** True for an untampered, unexpired gate cookie value. */
export function isGateTokenValid(token: string | undefined, secret: string, now: number): boolean {
  return verify(token, secret, now)?.kind === "gate";
}

/** Seals the sum's answer so the browser can hold the challenge without being able to read it. */
export function createChallengeToken(answer: number, secret: string, now: number): string {
  return sign({ kind: "challenge", exp: now + CHALLENGE_TTL_MS, answer }, secret);
}

/** True when the token is a live challenge and the given answer matches the sealed one. */
export function isChallengeAnswerRight(
  token: string,
  answer: number,
  secret: string,
  now: number,
): boolean {
  const payload = verify(token, secret, now);
  return payload?.kind === "challenge" && payload.answer === answer;
}
