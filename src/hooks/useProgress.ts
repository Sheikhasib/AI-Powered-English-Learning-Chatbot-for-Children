"use client";

import { useEffect, useState } from "react";
import { progressSchema, type Progress } from "@/lib/progress";

/**
 * Reads one profile's progress. `progress` is null while loading; a failed read
 * becomes an empty map (nothing mastered), because the child never sees an error.
 */
export function useProgress(profileId: string | undefined): Progress | null {
  const [loaded, setLoaded] = useState<{ profileId: string | undefined; progress: Progress } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const empty: Progress = { level: 1, skills: [] };
    const settle = (progress: Progress) => {
      if (!controller.signal.aborted) setLoaded({ profileId, progress });
    };
    if (!profileId) {
      settle(empty);
      return () => controller.abort();
    }
    fetch(`/api/progress?p=${encodeURIComponent(profileId)}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("progress failed"))))
      .then((json) => settle(progressSchema.parse(json)))
      .catch(() => settle(empty));
    return () => controller.abort();
  }, [profileId]);

  return loaded && loaded.profileId === profileId ? loaded.progress : null;
}
