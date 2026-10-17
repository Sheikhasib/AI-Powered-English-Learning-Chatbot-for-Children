import { z } from "zod";

const MIN_SECRET_LENGTH = 16;

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  OPENCODE_API_KEY: z.string().min(1),
  LLM_BASE_URL: z.url().default("https://opencode.ai/zen/v1"),
  LLM_MODEL: z.string().min(1).default("big-pickle"),
  LLM_FIRST_TOKEN_TIMEOUT_MS: z.coerce.number().int().positive().default(1200),
  UPSTASH_REDIS_REST_URL: z.url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  PARENT_GATE_SECRET: z.string().min(MIN_SECRET_LENGTH),
});

export type Env = z.infer<typeof envSchema>;

/** Validates a variable source; the error names each bad variable but never echoes a value. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const present = Object.fromEntries(Object.entries(source).filter(([, value]) => value !== undefined && value !== ""));
  const result = envSchema.safeParse(present);
  if (result.success) return result.data;

  const problems = result.error.issues.map((issue) => {
    const name = String(issue.path[0]);
    return name in present ? `${name} (${issue.message})` : `${name} (missing)`;
  });
  throw new Error(`Missing or invalid environment variables: ${problems.join(", ")}. See .env.example.`);
}

let cached: Env | undefined;

/** Validates process.env once and returns it; call it to fail fast with a clear message. */
export function checkEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}

/** Validated env, parsed on first property read so builds without credentials still pass. */
export const env: Env = new Proxy({} as Env, {
  // The empty target is never read: every trap forwards to the validated copy.
  get: (_target, key) => checkEnv()[key as keyof Env],
});
