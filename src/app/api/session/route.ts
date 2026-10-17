import { NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { DEVICE_COOKIE } from "@/server/device";
import { cookies } from "next/headers";
import { sessionRequestSchema } from "@/types/chat";

function failure(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** Starts a play session for one of this device's profiles, remembering the mood from the check-in. */
export async function POST(request: Request) {
  const deviceId = (await cookies()).get(DEVICE_COOKIE)?.value;
  if (!deviceId) return failure(401, "no_device", "Pip does not know this device yet.");

  const body = sessionRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return failure(400, "invalid_request", "Pip could not read that.");

  const db = getDb();
  const owned = await db.profile.findFirst({
    where: { id: body.data.profileId, deviceId },
    select: { id: true },
  });
  if (!owned) return failure(404, "not_found", "No such profile on this device.");

  const session = await db.session.create({
    data: { profileId: owned.id, checkIn: body.data.checkIn },
    select: { id: true },
  });
  return NextResponse.json({ sessionId: session.id }, { status: 201 });
}
