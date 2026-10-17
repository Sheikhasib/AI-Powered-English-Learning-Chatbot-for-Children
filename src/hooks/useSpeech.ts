"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  canSpeak,
  getRecognitionCtor,
  pickVoice,
  splitSentences,
  type Recognition,
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

const subscribeNothing = () => () => {};

export function useSpeech() {
  const speechSupported = useSyncExternalStore(subscribeNothing, canSpeak, () => false);
  const listenSupported = useSyncExternalStore(
    subscribeNothing,
    () => getRecognitionCtor() !== null,
    () => false,
  );
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const runRef = useRef(0);
  const recognitionRef = useRef<Recognition | null>(null);

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
    if (canSpeak()) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, { onWord, onEnd }: SpeakOptions = {}) => {
      cancel();
      if (!canSpeak() || mutedRef.current) {
        onEnd?.();
        return;
      }
      const run = runRef.current;
      const sentences = splitSentences(text);
      let offset = 0;
      let done = false;
      const finish = () => {
        if (done || run !== runRef.current) return;
        done = true;
        setSpeaking(false);
        onEnd?.();
      };
      // Some browsers never fire `end`; this keeps the cards from staying locked.
      setTimeout(finish, text.length * WATCHDOG_MS_PER_CHAR + WATCHDOG_BASE_MS);
      setSpeaking(true);
      sentences.forEach((sentence, index) => {
        const utterance = new SpeechSynthesisUtterance(sentence);
        const base = offset;
        utterance.rate = SPEECH_RATE;
        utterance.pitch = SPEECH_PITCH;
        utterance.lang = "en-US";
        if (voiceRef.current) utterance.voice = voiceRef.current;
        utterance.onboundary = (event) => {
          if (run !== runRef.current || event.name !== "word") return;
          const length = event.charLength || sentence.slice(event.charIndex).search(/\s|$/);
          onWord?.({ start: base + event.charIndex, end: base + event.charIndex + length });
        };
        const finished = () => {
          if (index === sentences.length - 1) finish();
        };
        utterance.onend = finished;
        utterance.onerror = finished;
        window.speechSynthesis.speak(utterance);
        offset += sentence.length;
      });
    },
    [cancel],
  );

  const stopListening = useCallback(() => recognitionRef.current?.stop(), []);

  /** Starts one listen; resolves through `onTranscript`. Pip stops talking first. */
  const listen = useCallback(
    (onTranscript: (text: string) => void) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) return;
      cancel();
      const recognition = new Ctor();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
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
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
    cancel();
  }, [cancel]);

  return {
    speechSupported,
    listenSupported,
    muted,
    speaking,
    listening,
    speak,
    cancel,
    listen,
    stopListening,
    toggleMute,
  };
}
