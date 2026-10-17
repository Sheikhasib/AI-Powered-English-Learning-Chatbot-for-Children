import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { DEVICE_COOKIE } from "@/server/device";
import { getLatencyStats } from "@/server/repositories/metrics";

/** Latency percentiles and fallback rate for this device; src/proxy.ts keeps it behind the parental gate. */
export async function GET(request: Request) {
  const deviceId = (await cookies()).get(DEVICE_COOKIE)?.value;
  if (!deviceId) {
    return NextResponse.json({ error: { code: "no_device", message: "No data on this device yet." } }, { status: 404 });
  }
  const profileId = new URL(request.url).searchParams.get("profileId") ?? undefined;
  return NextResponse.json(await getLatencyStats(getDb(), deviceId, profileId), {
    headers: { "Cache-Control": "no-store" },
  });
}
