"use client";

import { useEffect } from "react";
import { useSpeech } from "@/hooks/useSpeech";

/** Says a line once when the screen opens, honouring the sound switch; renders nothing. */
export function SpeakLine({ text }: { text: string }) {
  const { speak } = useSpeech();
  useEffect(() => {
    speak(text);
  }, [speak, text]);
  return null;
}
