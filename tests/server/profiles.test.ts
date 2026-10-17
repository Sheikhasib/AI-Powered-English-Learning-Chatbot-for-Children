import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import type { ProfileInput } from "@/hooks/profileSchema";
import { createProfile, deleteProfile } from "@/server/repositories/profiles";

type Row = { id?: string; profileId?: string; deviceId?: string };
type Tables = Record<"profile" | "turn" | "session" | "skillState", Row[]>;

/** A tiny in-memory stand-in that supports exactly the calls the repository makes. */
function fakeDb(tables: Tables): PrismaClient {
  const matches = (row: Row, where: Row) =>
    Object.entries(where).every(([key, value]) => row[key as keyof Row] === value);
  const deleteMany = (name: keyof Tables) => ({
    deleteMany: async ({ where }: { where: Row }) => {
      tables[name] = tables[name].filter((row) => !matches(row, where));
    },
  });
  const db = {
    device: { upsert: async () => ({}) },
    profile: {
      findFirst: async ({ where }: { where: Row }) => tables.profile.find((row) => matches(row, where)) ?? null,
      count: async ({ where }: { where: Row }) => tables.profile.filter((row) => matches(row, where)).length,
      create: async ({ data }: { data: Row }) => {
        const row = { id: `p${tables.profile.length + 1}`, nickname: "Mia", ageBand: "AGE_3_4", avatar: "cat", interests: [], ...data };
        tables.profile.push(row);
        return row;
      },
      delete: async ({ where }: { where: Row }) => {
        tables.profile = tables.profile.filter((row) => !matches(row, where));
      },
    },
    turn: deleteMany("turn"),
    session: deleteMany("session"),
    skillState: deleteMany("skillState"),
    $transaction: async (operations: Promise<unknown>[]) => Promise.all(operations),
  };
  return db as unknown as PrismaClient;
}

function seed(): Tables {
  return {
    profile: [
      { id: "mia", deviceId: "device-1" },
      { id: "leo", deviceId: "device-1" },
    ],
    turn: [{ profileId: "mia" }, { profileId: "mia" }, { profileId: "leo" }],
    session: [{ profileId: "mia" }, { profileId: "leo" }],
    skillState: [{ profileId: "mia" }, { profileId: "leo" }],
  };
}

describe("deleteProfile", () => {
  it("removes the profile and all of its turns, sessions and skills", async () => {
    const tables = seed();
    expect(await deleteProfile(fakeDb(tables), "device-1", "mia")).toBe(true);

    expect(tables.profile.map((row) => row.id)).toEqual(["leo"]);
    for (const name of ["turn", "session", "skillState"] as const) {
      expect(tables[name].every((row) => row.profileId !== "mia")).toBe(true);
    }
  });

  it("leaves a sibling profile's rows untouched", async () => {
    const tables = seed();
    await deleteProfile(fakeDb(tables), "device-1", "mia");

    expect(tables.turn).toHaveLength(1);
    expect(tables.session).toHaveLength(1);
    expect(tables.skillState).toHaveLength(1);
  });

  it("deletes nothing for a profile that belongs to another device", async () => {
    const tables = seed();
    expect(await deleteProfile(fakeDb(tables), "device-2", "mia")).toBe(false);

    expect(tables.profile).toHaveLength(2);
    expect(tables.turn).toHaveLength(3);
  });
});

describe("createProfile", () => {
  const input: ProfileInput = { nickname: "Mia", ageBand: "AGE_3_4", avatar: "cat", interests: [] };

  it("creates a profile for a device with room", async () => {
    const created = await createProfile(fakeDb(seed()), "device-1", input);
    expect(created?.nickname).toBe("Mia");
  });

  it("refuses a fifth profile on the same device", async () => {
    const tables = seed();
    tables.profile.push({ id: "a", deviceId: "device-1" }, { id: "b", deviceId: "device-1" });
    expect(await createProfile(fakeDb(tables), "device-1", input)).toBeNull();
    expect(tables.profile).toHaveLength(4);
  });
});
