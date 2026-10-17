import { NextResponse } from "next/server";
import { makeSum } from "@/components/shared/gateSum";
import { env } from "@/lib/env";
import { createChallengeToken } from "@/server/repositories/gateToken";

/** Hands out a sum in words plus a sealed copy of its answer; the answer itself never leaves the server. */
export function GET() {
  const { question, answer, options } = makeSum(Math.random);
  const token = createChallengeToken(answer, env.PARENT_GATE_SECRET, Date.now());
  return NextResponse.json({ question, options, token }, { headers: { "Cache-Control": "no-store" } });
}
