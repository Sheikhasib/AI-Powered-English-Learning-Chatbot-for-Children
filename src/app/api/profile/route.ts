import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { profileInputSchema } from "@/hooks/profileSchema";
import { env } from "@/lib/env";
import { getDb } from "@/server/db";
import { DEVICE_COOKIE, getOrCreateDeviceId } from "@/server/device";
import { allowProfileChange } from "@/server/ratelimit";
import { GATE_COOKIE, isGateTokenValid } from "@/server/repositories/gateToken";
import { createProfile, deleteProfile, listProfiles } from "@/server/repositories/profiles";

function failure(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** Lists the profiles on this device. */
export async function GET() {
  const deviceId = await getOrCreateDeviceId();
  return NextResponse.json({ profiles: await listProfiles(getDb(), deviceId) });
}

/** Creates a profile on this device; the body holds only nickname, age band, avatar and interests. */
export async function POST(request: Request) {
  const deviceId = await getOrCreateDeviceId();
  if (!(await allowProfileChange(deviceId))) return failure(429, "rate_limited", "Too many tries.");

  const body = profileInputSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return failure(400, "invalid_profile", "Check the nickname, age, avatar and interests.");

  const profile = await createProfile(getDb(), deviceId, body.data);
  if (!profile) return failure(409, "too_many_profiles", "This device already has four profiles.");
  return NextResponse.json({ profile }, { status: 201 });
}

const deleteQuerySchema = z.object({ id: z.string().min(1).max(64) });

/** Deletes one profile and all of its data; only a grown-up who passed the gate may do this. */
export async function DELETE(request: Request) {
  const store = await cookies();
  if (!(await allowProfileChange(await getOrCreateDeviceId()))) return failure(429, "rate_limited", "Too many tries.");
  if (!isGateTokenValid(store.get(GATE_COOKIE)?.value, env.PARENT_GATE_SECRET, Date.now())) {
    return failure(401, "gate_closed", "Grown-ups only.");
  }
  const query = deleteQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return failure(400, "invalid_request", "A profile id is needed.");

  const deviceId = store.get(DEVICE_COOKIE)?.value;
  const deleted = deviceId ? await deleteProfile(getDb(), deviceId, query.data.id) : false;
  if (!deleted) return failure(404, "not_found", "No such profile on this device.");
  return new NextResponse(null, { status: 204 });
}
