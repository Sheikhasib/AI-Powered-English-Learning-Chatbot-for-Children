import type { Mode, Mood } from "@/types/domain";

export const MOOD_FACES: Record<Mood, { face: string; word: string }> = {
  HAPPY: { face: "😊", word: "happy" },
  OKAY: { face: "😐", word: "okay" },
  SAD: { face: "😢", word: "sad" },
  ANGRY: { face: "😠", word: "angry" },
  TIRED: { face: "😴", word: "tired" },
  SCARED: { face: "😨", word: "scared" },
  EXCITED: { face: "🤩", word: "excited" },
};

/** Static class names so Tailwind can see them; colors come from the mode tokens. */
export const MODE_STYLES: Record<Mode, { label: string; className: string }> = {
  LEARN: { label: "Learn", className: "bg-mode-learn" },
  CHAT: { label: "Chat", className: "bg-mode-chat" },
  PLAY: { label: "Play", className: "bg-mode-play" },
  SUPPORT: { label: "Support", className: "bg-mode-support" },
  CALM: { label: "Calm", className: "bg-mode-calm" },
};

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

/** The server renders in UTC, so the label says so rather than guessing the viewer's zone. */
export function formatTime(date: Date): string {
  return `${timeFormat.format(date)} UTC`;
}

const FLAG_LABELS: Record<string, string> = {
  "redacted:phone": "Phone number removed",
  "redacted:email": "Email removed",
  "redacted:address": "Address removed",
  "redacted:school": "School name removed",
  "redacted:surname": "Last name removed",
  disclosure: "Something worrying was shared",
  unsafe_topic: "An unsafe topic came up",
};

/** Plain-English label for a stored safety flag; unknown codes fall back to readable words. */
export function flagLabel(flag: string): string {
  return FLAG_LABELS[flag] ?? flag.replace(/[_:]/g, " ");
}
