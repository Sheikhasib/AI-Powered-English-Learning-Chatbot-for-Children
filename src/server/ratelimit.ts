import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";
import { logger } from "./logger";

const CHAT_TURNS_PER_WINDOW = 20;
const GROWN_UP_ACTIONS_PER_WINDOW = 10;
const WINDOW = "60 s";

const limiters = new Map<string, Ratelimit>();

function getLimiter(prefix: string, max: number): Ratelimit {
  let limiter = limiters.get(prefix);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: new Redis({ url: env.KV_REST_API_URL, token: env.KV_REST_API_TOKEN }),
      limiter: Ratelimit.slidingWindow(max, WINDOW),
      prefix,
    });
    limiters.set(prefix, limiter);
  }
  return limiter;
}

/** Allows a chat turn only if both the device and the IP are under 20 turns per minute. */
export async function allowChatTurn(deviceId: string, ip: string): Promise<boolean> {
  const chatLimiter = getLimiter("pip:chat", CHAT_TURNS_PER_WINDOW);
  const [device, address] = await Promise.all([
    chatLimiter.limit(`device:${deviceId}`),
    chatLimiter.limit(`ip:${ip}`),
  ]);
  return device.success && address.success;
}

/** Fails open on a Redis outage so a grown-up is never locked out; the error is logged. */
async function underGrownUpLimit(prefix: string, deviceId: string): Promise<boolean> {
  try {
    const result = await getLimiter(prefix, GROWN_UP_ACTIONS_PER_WINDOW).limit(`device:${deviceId}`);
    return result.success;
  } catch (error) {
    logger.error("Rate limiter unavailable", error instanceof Error ? error.message : "unknown");
    return true;
  }
}

/** Allows at most 10 parent-gate answers per minute per device, which blunts guessing the sum. */
export function allowGateAttempt(deviceId: string): Promise<boolean> {
  return underGrownUpLimit("pip:gate", deviceId);
}

/** Allows at most 10 profile creates or deletes per minute per device. */
export function allowProfileChange(deviceId: string): Promise<boolean> {
  return underGrownUpLimit("pip:profile", deviceId);
}
