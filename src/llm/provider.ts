import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { env } from "@/lib/env";

/** Builds the chat model on first use so a missing key fails at call time, not at build time. */
export function getChatModel() {
  const provider = createOpenAICompatible({
    name: "groq",
    baseURL: env.LLM_BASE_URL,
    apiKey: env.LLM_API_KEY,
  });
  return provider(env.LLM_MODEL);
}

/** Reasoning tokens count against the output cap, so 80 is too low for this model; measured at about 300. */
export const CHAT_MAX_OUTPUT_TOKENS = 300;

export const CHAT_TEMPERATURE = 0.7;

/** Reasoning models otherwise spend the whole token cap thinking and return no text. */
export const LLM_PROVIDER_OPTIONS = { groq: { reasoningEffort: "low" } } as const;

/** Enough for a one-line JSON reading or a short note once reasoning tokens are counted. */
export const CLASSIFY_MAX_OUTPUT_TOKENS = 200;
