import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { buildDemoSessions, buildDemoSkills, DEMO_PROFILE } from "../src/server/repositories/demo/build";
import { DEMO_DEVICE_ID } from "../src/server/repositories/demo/ids";

config({ path: [".env.local", ".env"], quiet: true });

const DEMO_PROFILE_ID = "demo-mina";

/** Recreates the sample device "Mina" from scratch; safe to run again because the old rows go first. */
async function seed(db: PrismaClient): Promise<number> {
  const now = new Date();
  const sessions = buildDemoSessions(now);

  await db.device.deleteMany({ where: { id: DEMO_DEVICE_ID } });
  await db.device.create({ data: { id: DEMO_DEVICE_ID } });
  await db.profile.create({
    data: {
      ...DEMO_PROFILE,
      interests: [...DEMO_PROFILE.interests],
      id: DEMO_PROFILE_ID,
      deviceId: DEMO_DEVICE_ID,
      skills: { create: buildDemoSkills(now) },
    },
  });

  for (const session of sessions) {
    const { turns, ...row } = session;
    const created = await db.session.create({ data: { ...row, profileId: DEMO_PROFILE_ID } });
    await db.turn.createMany({
      data: turns.map((turn) => ({ ...turn, profileId: DEMO_PROFILE_ID, sessionId: created.id })),
    });
  }
  return sessions.reduce((sum, s) => sum + s.turns.length, 0);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is missing. Add it to .env.local first.");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    const turnCount = await seed(db);
    process.stdout.write(`Seeded demo profile Mina with ${turnCount} turns.\nDemo device id: ${DEMO_DEVICE_ID}\n`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`Seed failed: ${error instanceof Error ? error.message : "unknown error"}\n`);
  process.exitCode = 1;
});
