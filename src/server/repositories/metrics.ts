import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { DEMO_DEVICE_ID } from "./demo/ids";

export const LATENCY_WINDOW_TURNS = 100;

const nullableNumber = z.number().nullable();
const statsSchema = z.object({
  turns: z.number().int(),
  p50FirstToken: nullableNumber,
  p95FirstToken: nullableNumber,
  p50Total: nullableNumber,
  p95Total: nullableNumber,
  fallbackRate: nullableNumber,
});
export type LatencyStats = z.infer<typeof statsSchema>;

/**
 * Percentiles of the stored timings over the device's latest 100 turns, optionally for one profile.
 * The window is taken first so a busy profile cannot hide a slow patch behind older fast turns.
 * The demo device is left out unless `includeSample` is set, because its timings are made up.
 */
export async function getLatencyStats(
  db: PrismaClient,
  deviceId: string,
  profileId?: string,
  { includeSample = false }: { includeSample?: boolean } = {},
): Promise<LatencyStats> {
  const rows = await db.$queryRaw<unknown[]>`
    WITH recent AS (
      SELECT t."tFirstToken", t."tTotal", t."fallback"
      FROM "Turn" t
      JOIN "Profile" p ON p."id" = t."profileId"
      WHERE p."deviceId" = ${deviceId}
        AND (${includeSample}::boolean OR p."deviceId" <> ${DEMO_DEVICE_ID})
        AND (${profileId ?? null}::text IS NULL OR p."id" = ${profileId ?? null}::text)
      ORDER BY t."createdAt" DESC
      LIMIT ${LATENCY_WINDOW_TURNS}
    )
    SELECT
      count(*)::int AS "turns",
      percentile_cont(0.5) WITHIN GROUP (ORDER BY "tFirstToken") AS "p50FirstToken",
      percentile_cont(0.95) WITHIN GROUP (ORDER BY "tFirstToken") AS "p95FirstToken",
      percentile_cont(0.5) WITHIN GROUP (ORDER BY "tTotal") AS "p50Total",
      percentile_cont(0.95) WITHIN GROUP (ORDER BY "tTotal") AS "p95Total",
      avg(CASE WHEN "fallback" THEN 1.0 ELSE 0.0 END)::float8 AS "fallbackRate"
    FROM recent`;
  return statsSchema.parse(rows[0]);
}
