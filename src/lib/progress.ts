import { z } from "zod";

/** Shape of GET /api/progress; the route builds it and `useProgress` parses it, so both sides agree. */
export const progressSchema = z.object({
  level: z.number().int().min(1),
  skills: z.array(
    z.object({
      skillId: z.string(),
      mastery: z.number().min(0).max(1),
      attempts: z.number().int().nonnegative(),
      streak: z.number().int(),
      lastSeenAt: z.coerce.date().nullable(),
      dueAt: z.coerce.date().nullable(),
    }),
  ),
});
export type Progress = z.infer<typeof progressSchema>;
