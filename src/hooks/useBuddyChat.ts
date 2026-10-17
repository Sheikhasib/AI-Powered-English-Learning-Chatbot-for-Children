"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import { curriculum } from "@/engine/curriculum";
import type { Activity, LevelId } from "@/engine/curriculum/types";
import { readyCheck } from "@/engine/sel/support";
import type { ChatInput, ChatRequest, PipUIMessage, TurnData } from "@/types/chat";
import type { Mode, Mood } from "@/types/domain";
import { startSession } from "./startSession";

/** How long a right answer stays on screen before the next cards appear. */
const CELEBRATE_HOLD_MS = 1100;
/** How long a wiggle stays on the card before the child may try again. */
const TRY_AGAIN_HOLD_MS = 1100;
/** Spec 07: one retry after a short rest when Pip can't be reached. */
const RETRY_DELAY_MS = 3000;
const RESTING_LINE = "Let me catch my breath!";
/** Child-safety rule: suggest a break after 15 minutes, gently and without a countdown. */
const BREAK_AFTER_MS = 15 * 60 * 1000;
const REST_LINE = "We played a lot! Want a rest?";
const BREATH_DONE_LINE = `Lovely breathing! ${readyCheck().line}`;

export type BuddyStatus = "idle" | "thinking" | "ready" | "resting";
/** `chosen` shows at once on tap, before the reply says right or try again. */
export type CardFeedback = { choiceId: string; kind: "chosen" | "correct" | "tryAgain" };

type BuddyState = {
  pipLine: string;
  /** Changes on every new line, so speech restarts even when the words repeat. */
  lineId: number;
  mode: Mode;
  activity: Activity | null;
  feedback: CardFeedback | null;
  stars: number;
  /** Counts right answers; each increment plays one star burst. */
  bursts: number;
  status: BuddyStatus;
  /** Set after 15 minutes; the break button glows until the child takes it. */
  restSuggested: boolean;
  /** True once the child has finished the breathing bubble for the current turn. */
  breathed: boolean;
  /** The level just unlocked; the overlay shows until the child dismisses it. */
  levelUp: LevelId | null;
};

const INITIAL: BuddyState = {
  pipLine: "",
  lineId: 0,
  mode: "LEARN",
  activity: null,
  feedback: null,
  stars: 0,
  bursts: 0,
  status: "idle",
  restSuggested: false,
  breathed: false,
  levelUp: null,
};

/** The request body is built per send, so the transport only forwards it. */
const transport = new DefaultChatTransport<PipUIMessage>({
  api: "/api/chat",
  prepareSendMessagesRequest: ({ body }) => ({ body: body ?? {} }),
});

const levelFrom = (id: number): LevelId | null => curriculum.find((level) => level.id === id)?.id ?? null;

/** Drives the buddy screen from POST /api/chat: the first stream part shows cards at once, the text follows. */
export function useBuddyChat(profileId: string) {
  const [state, setState] = useState<BuddyState>(INITIAL);
  const shownAt = useRef(0);
  const busy = useRef(false);
  const sessionId = useRef<string | null>(null);
  const turnSeen = useRef(false);
  const lastTurn = useRef<TurnData | null>(null);
  /** `useChat` reports request failures here instead of throwing. */
  const requestFailed = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    const pending = timers.current;
    const suggestRest = setTimeout(() => {
      setState((s) => ({
        ...s,
        pipLine: REST_LINE,
        lineId: s.lineId + 1,
        restSuggested: true,
      }));
    }, BREAK_AFTER_MS);
    return () => {
      clearTimeout(suggestRest);
      pending.forEach(clearTimeout);
    };
  }, []);

  const applyTurn = useCallback(
    (turn: TurnData) => {
      setState((s) => {
        const held = turn.celebrate && s.feedback !== null;
        return {
          ...s,
          mode: turn.mode,
          breathed: false,
          stars: s.stars + turn.stars,
          bursts: turn.celebrate ? s.bursts + 1 : s.bursts,
          activity: held ? s.activity : turn.activity,
          feedback: s.feedback ? { ...s.feedback, kind: turn.celebrate ? "correct" : "tryAgain" } : null,
        };
      });
      if (turn.celebrate) {
        later(() => {
          shownAt.current = performance.now();
          setState((s) => ({
            ...s,
            activity: turn.activity,
            feedback: null,
            levelUp: (turn.levelUp && levelFrom(turn.levelUp.to)) || s.levelUp,
          }));
        }, CELEBRATE_HOLD_MS);
      } else {
        shownAt.current = performance.now();
        later(() => setState((s) => ({ ...s, feedback: null })), TRY_AGAIN_HOLD_MS);
      }
    },
    [later],
  );

  /** Pip's words arrive sentence by sentence; the bubble shows them once the reply is whole. */
  const sayReply = useCallback((text: string) => {
    const turn = lastTurn.current;
    setState((s) => ({
      ...s,
      pipLine: text || turn?.fallbackLine || s.pipLine,
      lineId: s.lineId + 1,
      status: "ready",
    }));
  }, []);

  const { sendMessage, setMessages } = useChat<PipUIMessage>({
    transport,
    onData: (part) => {
      if (part.type !== "data-turn") return;
      turnSeen.current = true;
      lastTurn.current = part.data;
      applyTurn(part.data);
    },
    onError: () => {
      requestFailed.current = true;
    },
    onFinish: ({ message, isError }) => {
      if (isError) return;
      const text = message.parts.flatMap((part) => (part.type === "text" ? part.text : [])).join(" ");
      sayReply(text.trim());
    },
  });

  /** One attempt: make sure a session exists, then stream the turn. Returns false when Pip could not answer. */
  const request = useCallback(
    async (input: ChatInput): Promise<boolean> => {
      setState((s) => ({ ...s, status: "thinking" }));
      turnSeen.current = false;
      requestFailed.current = false;
      try {
        sessionId.current ??= await startSession({
          profileId,
          checkIn: input.kind === "mood" ? input.mood : null,
        });
        const body: ChatRequest = { profileId, sessionId: sessionId.current, input };
        setMessages([]);
        await sendMessage({ text: input.kind }, { body });
      } catch {
        requestFailed.current = true;
      }
      if (!requestFailed.current) return true;
      // A turn that already reached the screen must not be sent twice.
      if (turnSeen.current) {
        sayReply("");
        return true;
      }
      setState((s) => ({
        ...s,
        pipLine: RESTING_LINE,
        lineId: s.lineId + 1,
        status: "resting",
        feedback: null,
      }));
      return false;
    },
    [profileId, sendMessage, setMessages, sayReply],
  );

  const send = useCallback(
    async (input: ChatInput): Promise<void> => {
      if (busy.current) return;
      busy.current = true;
      if (!(await request(input))) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        await request(input);
      }
      busy.current = false;
    },
    [request],
  );

  const sendCard = useCallback(
    (choiceId: string) => {
      const { activity } = state;
      if (!activity || busy.current) return;
      const responseMs = Math.max(0, Math.round(performance.now() - shownAt.current));
      setState((s) => ({ ...s, feedback: { choiceId, kind: "chosen" } }));
      void send({ kind: "card", activityId: activity.id, choiceId, responseMs });
    },
    [state, send],
  );

  const sendText = useCallback(
    (text: string, kind: "text" | "voice" = "voice") => void send({ kind, text }),
    [send],
  );
  const sendMood = useCallback((mood: Mood) => void send({ kind: "mood", mood }), [send]);
  const sendBreak = useCallback(() => {
    setState((s) => ({ ...s, restSuggested: false }));
    void send({ kind: "break" });
  }, [send]);

  /** Breathing is local: Pip just asks if the child is ready, and the ready cards appear. */
  const finishBreathing = useCallback(
    () =>
      setState((s) =>
        s.breathed ? s : { ...s, breathed: true, pipLine: BREATH_DONE_LINE, lineId: s.lineId + 1 },
      ),
    [],
  );

  const dismissLevelUp = useCallback(() => setState((s) => ({ ...s, levelUp: null })), []);

  return { ...state, sendCard, sendText, sendMood, sendBreak, finishBreathing, dismissLevelUp };
}
