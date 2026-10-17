import { streamText, type UIMessageStreamWriter } from "ai";
import type { PromptMessage } from "@/llm/composePrompt";
import {
  CHAT_MAX_OUTPUT_TOKENS,
  CHAT_TEMPERATURE,
  LLM_PROVIDER_OPTIONS,
  getChatModel,
} from "@/llm/provider";
import { praisesAnswer } from "@/llm/praiseGuard";
import { outputGuard } from "@/safety/outputGuard";
import { logger } from "@/server/logger";
import type { PipUIMessage } from "@/types/chat";

type Writer = Pick<UIMessageStreamWriter<PipUIMessage>, "write">;

export type ReplyResult = {
  /** Everything Pip said, as the client received it. */
  text: string;
  /** True when the engine's line replaced all or part of the model's. */
  fallback: boolean;
};

export type StreamArgs = {
  writer: Writer;
  system: string;
  messages: PromptMessage[];
  /** The engine's line, used whole when the model fails before saying anything. */
  fallbackLine: string;
  /** The activity question Pip must end on; appended if the model left it out. */
  closingLine: string | null;
  /** True after a wrong card, or in Support and Calm: a sentence that praises counts as a failed check. */
  forbidPraise: boolean;
  firstTokenTimeoutMs: number;
  /** Called once, when the first token arrives or the fallback takes over. */
  onFirstToken: () => void;
};

const LINE_ID = "pip-line";
const SENTENCE_END = /[.!?]+["')]*\s+/;

/** Splits off every finished sentence; what is left may still be growing. */
function takeSentences(buffer: string): { sentences: string[]; rest: string } {
  const sentences: string[] = [];
  let rest = buffer;
  for (let match = SENTENCE_END.exec(rest); match; match = SENTENCE_END.exec(rest)) {
    const end = match.index + match[0].length;
    sentences.push(rest.slice(0, end).trim());
    rest = rest.slice(end);
  }
  return { sentences, rest };
}

/** A question that is not the next activity's prompt is an old one the model copied from history; it is dropped. */
function isStaleQuestion(sentence: string, closingLine: string | null): boolean {
  if (closingLine === null || !sentence.includes("?")) return false;
  const said = sentence.toLowerCase();
  const closing = closingLine.toLowerCase();
  return !closing.includes(said) && !said.includes(closing);
}

function createLine(writer: Writer) {
  let said = "";
  writer.write({ type: "text-start", id: LINE_ID });
  return {
    say(sentence: string) {
      const delta = said ? ` ${sentence}` : sentence;
      said += delta;
      writer.write({ type: "text-delta", id: LINE_ID, delta });
    },
    finish() {
      writer.write({ type: "text-end", id: LINE_ID });
    },
    text: () => said,
  };
}

/** Sends a fixed line with no model call: safety scripts and anything else the engine fully owns. */
export function writeScripted(writer: Writer, line: string): ReplyResult {
  const out = createLine(writer);
  out.say(line);
  out.finish();
  return { text: line, fallback: false };
}

/**
 * Streams Pip's line from the model one safe sentence at a time. Each sentence is checked together
 * with everything already sent, so the client never hears text that failed the guard. A late first token,
 * an error or a failed check hands over to the engine's own line.
 */
export async function streamReply(args: StreamArgs): Promise<ReplyResult> {
  const out = createLine(args.writer);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), args.firstTokenTimeoutMs);
  let firstTokenSeen = false;
  let failed = false;
  let streamError: unknown;

  const markFirstToken = () => {
    if (firstTokenSeen) return;
    firstTokenSeen = true;
    args.onFirstToken();
  };
  const accept = (sentence: string): boolean => {
    if (isStaleQuestion(sentence, args.closingLine)) return true;
    if (args.forbidPraise && praisesAnswer(sentence)) return false;
    if (!outputGuard(`${out.text()} ${sentence}`).ok) return false;
    out.say(sentence);
    return true;
  };

  try {
    const result = streamText({
      model: getChatModel(),
      system: args.system,
      messages: args.messages,
      maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS,
      temperature: CHAT_TEMPERATURE,
      providerOptions: LLM_PROVIDER_OPTIONS,
      abortSignal: controller.signal,
      onError: ({ error }) => {
        streamError = error;
      },
    });

    let pending = "";
    for await (const chunk of result.textStream) {
      if (chunk.length === 0) continue;
      if (!firstTokenSeen) clearTimeout(timeout);
      markFirstToken();
      pending += chunk;
      const { sentences, rest } = takeSentences(pending);
      pending = rest;
      if (!sentences.every(accept)) {
        failed = true;
        controller.abort();
        break;
      }
    }
    if (!failed && pending.trim() && !accept(pending.trim())) failed = true;
  } catch (error) {
    streamError ??= error;
    failed = true;
  } finally {
    clearTimeout(timeout);
  }

  if (streamError !== undefined) logger.error("Chat model failed", streamError instanceof Error ? streamError.message : "unknown");
  markFirstToken();

  const nothingSaid = out.text() === "";
  const needsClosing = args.closingLine !== null && !out.text().toLowerCase().includes(args.closingLine.toLowerCase());
  if (nothingSaid) out.say(args.fallbackLine);
  else if (needsClosing && args.closingLine) out.say(args.closingLine);
  out.finish();
  return { text: out.text(), fallback: nothingSaid || failed };
}
