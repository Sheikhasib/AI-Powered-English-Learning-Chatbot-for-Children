import type { AgeBand } from "@/types/domain";
import type { Profile } from "@/hooks/profileSchema";

type AvatarId = Profile["avatar"];
type InterestId = Profile["interests"][number];

/** Animal faces double as stickers, one of the two places emoji are allowed. */
export const AVATAR_FACES: Record<AvatarId, string> = {
  bear: "🐻",
  cat: "🐱",
  dog: "🐶",
  rabbit: "🐰",
  fox: "🦊",
  panda: "🐼",
  lion: "🦁",
  frog: "🐸",
};

/** Spoken names for screen readers; the emoji alone would read as "bear face". */
export const AVATAR_LABELS: Record<AvatarId, string> = {
  bear: "Bear",
  cat: "Cat",
  dog: "Dog",
  rabbit: "Rabbit",
  fox: "Fox",
  panda: "Panda",
  lion: "Lion",
  frog: "Frog",
};

export const INTEREST_LABELS: Record<InterestId, { icon: string; word: string }> = {
  animals: { icon: "🐾", word: "animals" },
  space: { icon: "🚀", word: "space" },
  cars: { icon: "🚗", word: "cars" },
  dinosaurs: { icon: "🦕", word: "dinosaurs" },
  music: { icon: "🎵", word: "music" },
  food: { icon: "🍎", word: "food" },
  sports: { icon: "⚽", word: "sports" },
  nature: { icon: "🌳", word: "nature" },
};

export const AGE_BAND_LABELS: Record<AgeBand, string> = {
  AGE_3_4: "3 to 4",
  AGE_5_6: "5 to 6",
};
