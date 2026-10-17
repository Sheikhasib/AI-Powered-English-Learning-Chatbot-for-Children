import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { GATE_COOKIE, isGateTokenValid } from "@/server/repositories/gateToken";

/** Keeps the grown-up area closed until the parental gate has set a valid cookie. */
export function proxy(request: NextRequest) {
  const token = request.cookies.get(GATE_COOKIE)?.value;
  if (isGateTokenValid(token, env.PARENT_GATE_SECRET, Date.now())) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: { code: "gate_closed", message: "Grown-ups only." } }, { status: 401 });
  }
  const gate = new URL("/parent-gate", request.url);
  gate.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(gate);
}

export const config = { matcher: ["/parent/:path*", "/api/metrics", "/api/demo"] };
