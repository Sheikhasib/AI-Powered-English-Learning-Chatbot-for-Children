import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import { DEMO_DEVICE_ID } from "@/server/repositories/demo/ids";
import { getLatencyStats } from "@/server/repositories/metrics";

const EMPTY_ROW = { turns: 0, p50FirstToken: null, p95FirstToken: null, p50Total: null, p95Total: null, fallbackRate: null };

function fakeDb() {
  const calls: unknown[][] = [];
  const db = {
    $queryRaw: async (_strings: TemplateStringsArray, ...values: unknown[]) => {
      calls.push(values);
      return [EMPTY_ROW];
    },
  } as unknown as PrismaClient;
  return { db, calls };
}

describe("getLatencyStats", () => {
  it("leaves the made-up demo device out by default", async () => {
    const { db, calls } = fakeDb();
    await getLatencyStats(db, "device-1");
    expect(calls[0]).toContain(DEMO_DEVICE_ID);
    expect(calls[0]).toContain(false);
  });

  it("counts the demo device only when sample data is asked for", async () => {
    const { db, calls } = fakeDb();
    await getLatencyStats(db, DEMO_DEVICE_ID, undefined, { includeSample: true });
    expect(calls[0]).toContain(true);
  });
});
