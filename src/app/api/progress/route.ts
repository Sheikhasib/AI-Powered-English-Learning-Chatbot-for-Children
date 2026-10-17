import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { progressSchema } from "@/lib/progress";
import { getDb } from "@/server/db";
import { DEVICE_COOKIE } from "@/server/device";

const querySchema = z.object({ p: z.string().min(1).max(64) });

function failure(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** One profile's level and skill states; the device cookie proves the profile is theirs. */
export async function GET(request: Request) {
  const deviceId = (await cookies()).get(DEVICE_COOKIE)?.value;
  if (!deviceId) return failure(401, "no_device", "Pip does not know this device yet.");

  const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return failure(400, "invalid_request", "A profile id is needed.");

  const row = await getDb().profile.findFirst({
    where: { id: query.data.p, deviceId },
    select: {
      level: true,
      skills: {
        select: { skillId: true, mastery: true, attempts: true, streak: true, lastSeenAt: true, dueAt: true },
      },
    },
  });
  if (!row) return failure(404, "not_found", "No such profile on this device.");

  return NextResponse.json(progressSchema.parse(row), { headers: { "Cache-Control": "no-store" } });
}
