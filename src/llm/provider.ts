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
