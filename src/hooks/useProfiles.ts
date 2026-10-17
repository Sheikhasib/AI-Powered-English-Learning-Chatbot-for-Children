"use client";

import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { profileSchema, type Profile, type ProfileInput } from "./profileSchema";

const profilesResponse = z.object({ profiles: z.array(profileSchema) });
const createdResponse = z.object({ profile: profileSchema });

/**
 * Profiles live on the server, tied to this device's cookie. `profiles` is null
 * until the first answer arrives, so screens can wait quietly; a failed read
 * counts as no profiles, because the child never sees an error.
 */
export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/profile", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("profile list failed"))))
      .then((json) => setProfiles(profilesResponse.parse(json).profiles))
      .catch(() => {
        if (!controller.signal.aborted) setProfiles([]);
      });
    return () => controller.abort();
  }, []);

  /** Returns the new profile, or null when the device is full or the server could not save it. */
  const addProfile = useCallback(async (input: ProfileInput): Promise<Profile | null> => {
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) return null;
      const { profile } = createdResponse.parse(await res.json());
      setProfiles((current) => [...(current ?? []), profile]);
      return profile;
    } catch {
      return null;
    }
  }, []);

  return { profiles, addProfile };
}
