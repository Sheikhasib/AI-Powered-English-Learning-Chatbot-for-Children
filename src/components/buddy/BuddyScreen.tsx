"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { Pip } from "@/components/pip/Pip";
import { EXPRESSION_FOR_MODE, type PipExpression } from "@/components/pip/expressions";
import { useBuddyChat } from "@/hooks/useBuddyChat";
import { useBuddySounds } from "@/hooks/useBuddySounds";
import type { Profile } from "@/hooks/profileSchema";
import { useProfiles } from "@/hooks/useProfiles";
import { useSpeech, type SpokenWord } from "@/hooks/useSpeech";
import type { Mode } from "@/types/domain";
import { cn } from "@/lib/utils";
import { ActivityArea } from "./ActivityArea";
import { LevelUp } from "./LevelUp";
import { MicButton } from "./MicButton";
import { MoodBar } from "./MoodBar";
import { SpeechBubble } from "./SpeechBubble";
import { StarCount } from "./StarCount";
import { StarBurst } from "./StarBurst";
import { TopBar } from "./TopBar";

const MODE_BACKGROUND: Record<Mode, string> = {
  LEARN: "bg-mode-learn",
  CHAT: "bg-mode-chat",
  PLAY: "bg-mode-play",
  SUPPORT: "bg-mode-support",
  CALM: "bg-mode-calm",
};

/** Finds the profile chosen on the welcome screen, then starts the session. */
export function BuddyScreen() {
  const router = useRouter();
  const profileId = useSearchParams().get("p");
  const { profiles } = useProfiles();
  const profile = profiles?.find((p) => p.id === profileId);

  useEffect(() => {
    if (profiles !== null && !profile) router.replace("/");
  }, [profiles, profile, router]);

  return profile ? <BuddySession profile={profile} /> : <div className="min-h-dvh bg-mode-learn" />;
}

function BuddySession({ profile }: { profile: Profile }) {
  const chat = useBuddyChat(profile.id);
  const speech = useSpeech();
  const play = useBuddySounds(speech.muted, chat);
  const [spoken, setSpoken] = useState<{ key: string; word: SpokenWord } | null>(null);

  const checkingIn = chat.lineId === 0;
  const line = checkingIn ? `Hi ${profile.nickname}! How do you feel?` : chat.pipLine;
  const lineKey = `line-${chat.lineId}`;
  const { speak } = speech;

  useEffect(() => {
    speak(line, {
      onWord: (word) => setSpoken({ key: lineKey, word }),
      onEnd: () => setSpoken(null),
    });
  }, [speak, line, lineKey]);

  const locked = speech.speaking || chat.status === "thinking";
  const celebrating = chat.feedback?.kind === "correct";
  const expression: PipExpression =
    chat.status === "thinking" ? "thinking" : celebrating ? "celebrate" : checkingIn ? "chatty" : EXPRESSION_FOR_MODE[chat.mode];
  const word = spoken?.key === lineKey ? spoken.word : null;

  /** Taps answer at once with a soft sound, before the reply arrives. */
  const tapped =
    <Args extends unknown[]>(action: (...args: Args) => void) =>
    (...args: Args) => {
      play("tap");
      action(...args);
    };

  const toggleListening = () =>
    speech.listening ? speech.stopListening() : speech.listen((text) => chat.sendText(text, "voice"));

  return (
    <main
      className={cn(
        "mx-auto flex h-dvh w-full max-w-5xl flex-col gap-3 overflow-y-auto px-4 py-3 transition-colors duration-(--duration-slow)",
        checkingIn ? "bg-mode-chat" : MODE_BACKGROUND[chat.mode],
      )}
    >
      <TopBar profileId={profile.id} muted={speech.muted} onToggleMute={speech.toggleMute} />

      <div className="grid min-h-0 flex-1 gap-3 landscape:min-[700px]:grid-cols-2 landscape:min-[700px]:items-center landscape:min-[700px]:gap-10">
        <section className="flex min-h-0 flex-col items-center gap-3 self-stretch">
          <div className="relative min-h-28 w-full max-w-72 flex-1 landscape:min-[700px]:max-h-[55dvh]">
            <Pip expression={expression} speaking={speech.speaking} />
            <StarBurst trigger={chat.bursts} />
            <div className="absolute top-0 left-0">
              <StarCount stars={chat.stars} mode={chat.mode} />
            </div>
            <div className="absolute right-0 bottom-0">
              <MicButton
                supported={speech.listenSupported}
                listening={speech.listening}
                onToggle={toggleListening}
              />
            </div>
          </div>
          <SpeechBubble text={line} word={word} className="w-full" />
        </section>

        <section className="flex flex-col gap-3">
          <ActivityArea
            checkingIn={checkingIn}
            activity={chat.activity}
            locked={locked}
            feedback={chat.feedback}
            breathed={chat.breathed}
            onMood={tapped(chat.sendMood)}
            onPick={tapped(chat.sendCard)}
            onBreathDone={chat.finishBreathing}
          />
          <MoodBar
            onMood={tapped(chat.sendMood)}
            onBreak={tapped(chat.sendBreak)}
            restSuggested={chat.restSuggested}
          />
        </section>
      </div>
      <AnimatePresence>
        {chat.levelUp && <LevelUp level={chat.levelUp} onClose={chat.dismissLevelUp} />}
      </AnimatePresence>
    </main>
  );
}
