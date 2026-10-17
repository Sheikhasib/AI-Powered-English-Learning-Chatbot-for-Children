import type { PrismaClient } from "@/generated/prisma/client";
import {
  MAX_PROFILES_PER_DEVICE,
  profileSchema,
  type Profile,
  type ProfileInput,
} from "@/hooks/profileSchema";

const profileSelect = { id: true, nickname: true, ageBand: true, avatar: true, interests: true } as const;

/** Every profile on this device, oldest first, reduced to the four allowed fields. */
export async function listProfiles(db: PrismaClient, deviceId: string): Promise<Profile[]> {
  const rows = await db.profile.findMany({
    where: { deviceId },
    select: profileSelect,
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => profileSchema.parse(row));
}

/** Creates a profile for the device, or returns null once it already has four. */
export async function createProfile(
  db: PrismaClient,
  deviceId: string,
  input: ProfileInput,
): Promise<Profile | null> {
  await db.device.upsert({ where: { id: deviceId }, create: { id: deviceId }, update: {} });
  const count = await db.profile.count({ where: { deviceId } });
  if (count >= MAX_PROFILES_PER_DEVICE) return null;

  const row = await db.profile.create({ data: { ...input, deviceId }, select: profileSelect });
  return profileSchema.parse(row);
}

/**
 * Removes the profile and every row that belongs to it, in one transaction.
 * The schema also cascades; deleting the children explicitly keeps the guarantee visible and testable.
 * Returns false when the profile does not belong to this device.
 */
export async function deleteProfile(
  db: PrismaClient,
  deviceId: string,
  profileId: string,
): Promise<boolean> {
  const owned = await db.profile.findFirst({ where: { id: profileId, deviceId }, select: { id: true } });
  if (!owned) return false;

  await db.$transaction([
    db.turn.deleteMany({ where: { profileId } }),
    db.session.deleteMany({ where: { profileId } }),
    db.skillState.deleteMany({ where: { profileId } }),
    db.profile.delete({ where: { id: profileId } }),
  ]);
  return true;
}
