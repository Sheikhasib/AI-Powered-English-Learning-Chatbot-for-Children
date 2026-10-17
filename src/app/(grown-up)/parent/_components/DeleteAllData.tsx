"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { profileId: string; nickname: string };

/** Hard delete behind a confirm step: the profile and all of its rows are removed for good. */
export function DeleteAllData({ profileId, nickname }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState(false);

  const remove = async () => {
    const response = await fetch(`/api/profile?id=${encodeURIComponent(profileId)}`, { method: "DELETE" });
    if (!response.ok) return setFailed(true);
    router.replace("/parent");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <p className="text-body">
        This removes {nickname}&apos;s profile, progress, check-ins and chats from our database. It cannot be undone.
      </p>
      {confirming ? (
        <div role="alertdialog" aria-label={`Delete all of ${nickname}'s data`} className="space-y-3 rounded-lg border-2 border-destructive p-4">
          <p className="text-body font-bold">Delete everything for {nickname}?</p>
          <div className="flex flex-wrap gap-4">
            <Button variant="destructive" onClick={remove}>
              <Trash2 aria-hidden /> Yes, delete it all
            </Button>
            <Button variant="outline" autoFocus onClick={() => setConfirming(false)}>
              Keep it
            </Button>
          </div>
          {failed && <p className="text-body text-destructive">Something went wrong. Nothing was deleted.</p>}
        </div>
      ) : (
        <Button variant="destructive" onClick={() => setConfirming(true)}>
          <Trash2 aria-hidden /> Delete all of {nickname}&apos;s data
        </Button>
      )}
    </div>
  );
}
