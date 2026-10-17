import { z } from "zod";
import { AGE_BANDS } from "@/types/domain";

/**
 * A profile holds only these four fields (child-safety rule). The same schema
 * will validate the form on the client and POST /api/profile on the server.
 */
export const AVATAR_IDS = ["bear", "cat", "dog", "rabbit", "fox", "panda", "lion", "frog"] as const;
export const INTEREST_IDS = [
  "animals",
  "space",
  "cars",
  "dinosaurs",
  "music",
  "food",
  "sports",
  "nature",
] as const;

export const MAX_NICKNAME_LENGTH = 12;
export const MAX_INTERESTS = 3;
export const MAX_PROFILES_PER_DEVICE = 4;

export const profileInputSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(1, "Type a nickname")
    .max(MAX_NICKNAME_LENGTH, "Up to 12 letters")
    .regex(/^[A-Za-z]+$/, "Letters only"),
  ageBand: z.enum(AGE_BANDS),
  avatar: z.enum(AVATAR_IDS),
  interests: z.array(z.enum(INTEREST_IDS)).max(MAX_INTERESTS),
});
export type ProfileInput = z.infer<typeof profileInputSchema>;

export const profileSchema = profileInputSchema.extend({ id: z.string().min(1) });
export type Profile = z.infer<typeof profileSchema>;
