import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { DEVICE_COOKIE } from "@/server/device";
import { DEMO_DEVICE_ID } from "@/server/repositories/demo/ids";

const PREVIOUS_DEVICE_COOKIE = "pip_device_prev";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const formSchema = z.object({ action: z.enum(["enter", "leave"]) });

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: ONE_YEAR_SECONDS,
  path: "/",
} as const;

/**
 * Switches the browser to the sample device, or back to the real one.
 * POST only, so a link on another site cannot flip it (Lax cookies are not sent on cross-site posts);
 * src/proxy.ts keeps it behind the parental gate.
 */
export async function POST(request: NextRequest) {
  const form = formSchema.safeParse(Object.fromEntries(await request.formData()));
  if (!form.success) {
    return NextResponse.json({ error: { code: "invalid_request", message: "Unknown action." } }, { status: 400 });
  }

  const response = NextResponse.redirect(new URL("/parent", request.url), 303);
  const current = request.cookies.get(DEVICE_COOKIE)?.value;

  if (form.data.action === "enter") {
    if (current && current !== DEMO_DEVICE_ID) response.cookies.set(PREVIOUS_DEVICE_COOKIE, current, cookieOptions);
    response.cookies.set(DEVICE_COOKIE, DEMO_DEVICE_ID, cookieOptions);
    return response;
  }

  const previous = request.cookies.get(PREVIOUS_DEVICE_COOKIE)?.value;
  if (previous) response.cookies.set(DEVICE_COOKIE, previous, cookieOptions);
  else response.cookies.delete(DEVICE_COOKIE);
  response.cookies.delete(PREVIOUS_DEVICE_COOKIE);
  return response;
}
