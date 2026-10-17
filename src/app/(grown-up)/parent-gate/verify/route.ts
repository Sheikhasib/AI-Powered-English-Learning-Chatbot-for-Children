import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { getOrCreateDeviceId } from "@/server/device";
import { allowGateAttempt } from "@/server/ratelimit";
import {
  GATE_COOKIE,
  GATE_COOKIE_MAX_AGE_SECONDS,
  createGateToken,
  isChallengeAnswerRight,
} from "@/server/repositories/gateToken";

const bodySchema = z.object({ token: z.string().max(500), answer: z.number().int() });

/** Checks the answer against the sealed challenge, then sets the 15-minute grown-up cookie. */
export async function POST(request: Request) {
  if (!(await allowGateAttempt(await getOrCreateDeviceId()))) {
    return NextResponse.json({ error: { code: "rate_limited", message: "Too many tries." } }, { status: 429 });
  }
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: { code: "bad_request", message: "Invalid answer." } }, { status: 400 });
  }

  const now = Date.now();
  const { token, answer } = body.data;
  if (!isChallengeAnswerRight(token, answer, env.PARENT_GATE_SECRET, now)) {
    return NextResponse.json({ error: { code: "wrong_answer", message: "Not quite." } }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(GATE_COOKIE, createGateToken(env.PARENT_GATE_SECRET, now), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: GATE_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
  return response;
}
