import type { PrismaClient } from "@/generated/prisma/client";
import { DEMO_DEVICE_ID } from "./ids";

/** True once `npm run db:seed` has created the sample device, so the page only offers it when it exists. */
export async function demoDataExists(db: PrismaClient): Promise<boolean> {
  return (await db.device.count({ where: { id: DEMO_DEVICE_ID } })) > 0;
}
