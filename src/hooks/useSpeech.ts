"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { readMuted, subscribeMuted, writeMuted } from "./mutePreference";
import {
  canListenLocally,
  canSpeak,
  getRecognitionCtor,
  pickVoice,
  newSentences,
  type Recognition,
  type SentenceChunk,
} from "./speechSupport";

/** Child-friendly delivery from the design system: a little slower, a little brighter. */
const SPEECH_RATE = 0.9;
const SPEECH_PITCH = 1.1;

const WATCHDOG_MS_PER_CHAR = 110;
const WATCHDOG_BASE_MS = 2000;

export type SpokenWord = { start: number; end: number };

type SpeakOptions = {
  /** Called as each word starts, with its character range in the full line. */
  onWord?: (word: SpokenWord) => void;
  onEnd?: () => void;
};

export type SpokenLine = {
  add: (sentence: SentenceChunk) => void;
  close: () => void;
};

const subscribeNothing = () => () => {};

export function useSpeech() {
  const speechSupported = useSyncExternalStore(subscribeNothing, canSpeak, () => false);
  const listenSupported = useSyncExternalStore(
    subscribeNothing,
    () => getRecognitionCtor() !== null,
    () => false,
  );
  const muted = useSyncExternalStore(subscribeMuted, readMuted, () => false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const runRef = useRef(0);
  const recognitionRef = useRef<Recognition | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!speechSupported) return;
    const synth = window.speechSynthesis;
    const load = () => {
      voiceRef.current = pickVoice(synth.getVoices());
    };
    load();
    synth.addEventListener("voiceschanged", load);
    return () => {
      synth.removeEventListener("voiceschanged", load);
      synth.cancel();
    };
  }, [speechSupported]);

  const cancel = useCallback(() => {
    runRef.current += 1;
    clearTimeout(watchdogRef.current);
    if (canSpeak()) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  /**
   * Opens a line that can grow: each `add` queues one sentence as its own utterance, so speech
   * starts on the first sentence and never restarts. `close` says no more sentences are coming.
   */
  const beginLine = useCallback(
    ({ onWord, onEnd }: SpeakOptions = {}): SpokenLine => {
      cancel();
      const run = runRef.current;
      const live = canSpeak() && !readMuted();
      let queued = 0;
      let finished = 0;
      let chars = 0;
      let closed = !live;
      let done = false;
      const finish = () => {
        if (done || run !== runRef.current) return;
        done = true;
        clearTimeout(watchdogRef.current);
        setSpeaking(false);
        onEnd?.();
      };
      const settle = () => {
        if (closed && finished >= queued) finish();
      };
      // Some browsers never fire `end`; this keeps the cards from staying locked.
      const watchdog = () => {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = setTimeout(finish, chars * WATCHDOG_MS_PER_CHAR + WATCHDOG_BASE_MS);
      };
      if (live) setSpeaking(true);
      else queueMicrotask(finish);

      return {
        add: ({ text, offset }: SentenceChunk) => {
          if (!live || done || run !== runRef.current) return;
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = SPEECH_RATE;
          utterance.pitch = SPEECH_PITCH;
          utterance.lang = "en-US";
          if (voiceRef.current) utterance.voice = voiceRef.current;
          utterance.onboundary = (event) => {
            if (run !== runRef.current || event.name !== "word") return;
            const length = event.charLength || text.slice(event.charIndex).search(/\s|$/);
            onWord?.({ start: offset + event.charIndex, end: offset + event.charIndex + length });
          };
          const ended = () => {
            finished += 1;
            settle();
          };
          utterance.onend = ended;
          utterance.onerror = ended;
          queued += 1;
          chars += text.length;
          window.speechSynthesis.speak(utterance);
        },
        close: () => {
          closed = true;
          if (live) watchdog();
          settle();
        },
      };
    },
    [cancel],
  );

  const speak = useCallback(
    (text: string, options?: SpeakOptions) => {
      const line = beginLine(options);
      newSentences(text, 0).chunks.forEach(line.add);
      line.close();
    },
    [beginLine],
  );

  const stopListening = useCallback(() => recognitionRef.current?.stop(), []);

  /** Starts one listen; resolves through `onTranscript`. Pip stops talking first. */
  const listen = useCallback(
    async (onTranscript: (text: string) => void) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) return;
      cancel();
      const recognition = new Ctor();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      if (await canListenLocally(Ctor, recognition.lang)) recognition.processLocally = true;
      recognition.onresult = (event) => {
        const text = event.results[0]?.[0]?.transcript.trim();
        if (text) onTranscript(text);
      };
      recognition.onend = () => setListening(false);
      recognition.onerror = () => setListening(false);
      recognitionRef.current = recognition;
      setListening(true);
      recognition.start();
    },
    [cancel],
  );

  const toggleMute = useCallback(() => {
    writeMuted(!readMuted());
    cancel();
  }, [cancel]);

  return {
    speechSupported,
    listenSupported,
    muted,
    speaking,
    listening,
    speak,
    beginLine,
    cancel,
    listen,
    stopListening,
    toggleMute,
  };
}
