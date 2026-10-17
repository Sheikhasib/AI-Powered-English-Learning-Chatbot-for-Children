import { z } from "zod";
import type { SessionRequest } from "@/types/chat";

const sessionResponse = z.object({ sessionId: z.string().min(1) });

/** Starts a play session on the server and returns its id; throws when Pip cannot be reached. */
export async function startSession(request: SessionRequest): Promise<string> {
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`session failed with ${res.status}`);
  return sessionResponse.parse(await res.json()).sessionId;
}
