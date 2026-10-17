import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

const CHAT_TURNS_PER_WINDOW = 20;
const CHAT_WINDOW = "60 s";

let limiter: Ratelimit | undefined;

function getChatLimiter(): Ratelimit {
  limiter ??= new Ratelimit({
    redis: new Redis({ url: env.KV_REST_API_URL, token: env.KV_REST_API_TOKEN }),
    limiter: Ratelimit.slidingWindow(CHAT_TURNS_PER_WINDOW, CHAT_WINDOW),
    prefix: "pip:chat",
  });
  return limiter;
}

/** Allows a chat turn only if both the device and the IP are under 20 turns per minute. */
export async function allowChatTurn(deviceId: string, ip: string): Promise<boolean> {
  const chatLimiter = getChatLimiter();
  const [device, address] = await Promise.all([
    chatLimiter.limit(`device:${deviceId}`),
    chatLimiter.limit(`ip:${ip}`),
  ]);
  return device.success && address.success;
}
