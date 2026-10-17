"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Pip } from "@/components/pip/Pip";
import { SpeechBubble } from "@/components/buddy/SpeechBubble";
import { Button } from "@/components/ui/button";
import { MAX_PROFILES_PER_DEVICE } from "@/hooks/profileSchema";
import { useProfiles } from "@/hooks/useProfiles";
import { useSpeech } from "@/hooks/useSpeech";
import { AVATAR_FACES } from "./avatars";
import { ParentGate } from "./ParentGate";

const HELLO = "Hi! I'm Pip. Who wants to play?";

/** First screen: Pip waves, friends tap their face, a grown-up adds a new friend behind the gate. */
export function WelcomeScreen() {
  const router = useRouter();
  const { profiles } = useProfiles();
  const { speak, speaking } = useSpeech();
  const [gateOpen, setGateOpen] = useState(false);

  const hasProfiles = (profiles?.length ?? 0) > 0;
  const canAdd = (profiles?.length ?? 0) < MAX_PROFILES_PER_DEVICE;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center gap-5 bg-mode-learn px-4 py-6 landscape:min-[700px]:max-w-4xl landscape:min-[700px]:flex-row landscape:min-[700px]:gap-10">
      <button
        type="button"
        onClick={() => speak(HELLO)}
        aria-label="Hear Pip say hello"
        className="h-[min(38dvh,18rem)] w-[min(60vw,16rem)] shrink-0 rounded-lg landscape:min-[700px]:h-[min(60dvh,24rem)]"
      >
        <Pip expression="bouncy" waving speaking={speaking} />
      </button>

      <div className="flex w-full flex-col items-center gap-5">
        <SpeechBubble text={HELLO} word={null} className="w-full" />

        {profiles === null ? null : hasProfiles ? (
          <ul className="flex flex-wrap justify-center gap-4">
            {profiles.map((profile) => (
              <li key={profile.id}>
                <Link
                  href={`/buddy?p=${profile.id}`}
                  className="flex min-w-24 flex-col items-center gap-1 rounded-lg border-2 border-border bg-card p-3 text-label font-bold active:scale-[0.96] motion-reduce:active:scale-100"
                >
                  <span aria-hidden className="text-6xl leading-none">
                    {AVATAR_FACES[profile.avatar]}
                  </span>
                  {profile.nickname}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {profiles !== null && (hasProfiles ? canAdd : true) && (
          <Button variant="accent" onClick={() => setGateOpen(true)}>
            {hasProfiles ? <Plus aria-hidden /> : null}
            {hasProfiles ? "Add a friend" : "Let's meet Pip!"}
          </Button>
        )}
      </div>

      {gateOpen && (
        <ParentGate onClose={() => setGateOpen(false)} onPass={() => router.push("/new")} />
      )}
    </main>
  );
}
