"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Activity } from "@/engine/curriculum/types";
import type { LevelId } from "@/engine/curriculum/types";
import { readyCheck } from "@/engine/sel/support";
import { createMockTurnSource, type ChatInput, type TurnData } from "@/lib/mockTurn";
import type { Mode, Mood } from "@/types/domain";
import { unlockedLevel } from "./levelUp";

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

/**
 * Drives the buddy screen from a turn source. Today that is the mock; the real
 * API swaps in by changing the `createMockTurnSource` call below.
 */
export function useBuddyChat() {
  const [state, setState] = useState<BuddyState>(INITIAL);
  const [source] = useState(createMockTurnSource);
  const shownAt = useRef(0);
  const busy = useRef(false);
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
          pipLine: turn.fallbackLine,
          lineId: s.lineId + 1,
          mode: turn.mode,
          breathed: false,
          status: "ready",
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
            levelUp: unlockedLevel(turn.reason) ?? s.levelUp,
          }));
        }, CELEBRATE_HOLD_MS);
      } else {
        shownAt.current = performance.now();
        later(() => setState((s) => ({ ...s, feedback: null })), TRY_AGAIN_HOLD_MS);
      }
    },
    [later],
  );

  const request = useCallback(
    async (input: ChatInput): Promise<boolean> => {
      setState((s) => ({ ...s, status: "thinking" }));
      try {
        applyTurn(await source(input));
        return true;
      } catch {
        setState((s) => ({
          ...s,
          pipLine: RESTING_LINE,
          lineId: s.lineId + 1,
          status: "resting",
          feedback: null,
        }));
        return false;
      }
    },
    [source, applyTurn],
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
