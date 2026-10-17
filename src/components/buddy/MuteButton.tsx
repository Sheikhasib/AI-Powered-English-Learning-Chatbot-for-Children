"use client";

import { Volume2, VolumeX } from "lucide-react";
import { ROUND_BUTTON, ROUND_LABEL } from "./roundButton";

type Props = {
  muted: boolean;
  onToggle: () => void;
};

/** One fixed name, "Sound"; `aria-pressed` says whether it is on, and the icon says it too. */
export function MuteButton({ muted, onToggle }: Props) {
  const Icon = muted ? VolumeX : Volume2;
  return (
    <button type="button" onClick={onToggle} aria-label="Sound" aria-pressed={!muted} className={ROUND_BUTTON}>
      <Icon aria-hidden className="size-7" />
      <span aria-hidden className={ROUND_LABEL}>
        {muted ? "Off" : "On"}
      </span>
    </button>
  );
}
