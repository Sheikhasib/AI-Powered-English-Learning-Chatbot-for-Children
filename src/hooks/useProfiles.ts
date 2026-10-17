"use client";

import { useCallback, useSyncExternalStore } from "react";
import { z } from "zod";
import {
  MAX_PROFILES_PER_DEVICE,
  profileSchema,
  type Profile,
  type ProfileInput,
} from "./profileSchema";

/**
 * Profiles live in this browser until the profile API exists. Only the four
 * allowed fields are stored, never anything about the child's voice or words.
 */
const STORAGE_KEY = "pip.profiles";
const listeners = new Set<() => void>();
let cached: { raw: string | null; profiles: Profile[] } = { raw: null, profiles: [] };

function readProfiles(): Profile[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cached.raw) return cached.profiles;
  let profiles: Profile[] = [];
  try {
    const parsed = z.array(profileSchema).safeParse(JSON.parse(raw ?? "[]"));
    if (parsed.success) profiles = parsed.data;
  } catch {
    profiles = [];
  }
  cached = { raw, profiles };
  return profiles;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** `profiles` is null on the server and during hydration, so screens can wait quietly. */
export function useProfiles() {
  const profiles = useSyncExternalStore(subscribe, readProfiles, () => null);

  const addProfile = useCallback((input: ProfileInput): Profile | null => {
    const current = readProfiles();
    if (current.length >= MAX_PROFILES_PER_DEVICE) return null;
    const profile: Profile = { ...input, id: crypto.randomUUID() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, profile]));
    listeners.forEach((notify) => notify());
    return profile;
  }, []);

  return { profiles, addProfile };
}
