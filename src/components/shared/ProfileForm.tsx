"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AVATAR_IDS,
  INTEREST_IDS,
  MAX_INTERESTS,
  MAX_NICKNAME_LENGTH,
  profileInputSchema,
  type ProfileInput,
} from "@/hooks/profileSchema";
import { useProfiles } from "@/hooks/useProfiles";
import { AGE_BANDS } from "@/types/domain";
import { cn } from "@/lib/utils";
import { AGE_BAND_LABELS, AVATAR_FACES, AVATAR_LABELS, INTEREST_LABELS } from "./avatars";

const chip =
  "inline-flex h-16 items-center justify-center gap-2 rounded-full border-2 px-5 text-label font-bold transition-colors duration-(--duration-quick) active:scale-[0.96] motion-reduce:active:scale-100";
const chosen = "border-primary bg-primary text-primary-foreground";
const idle = "border-border bg-card text-card-foreground";

type Draft = Partial<Omit<ProfileInput, "interests">> & { nickname: string; interests: ProfileInput["interests"] };

/** A grown-up sets up a friend in under 30 seconds: nickname, age band, avatar, up to 3 interests. */
export function ProfileForm() {
  const router = useRouter();
  const { addProfile } = useProfiles();
  const [draft, setDraft] = useState<Draft>({ nickname: "", interests: [] });
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const parsed = profileInputSchema.safeParse(draft);
  const nicknameError =
    touched && !parsed.success
      ? parsed.error.issues.find((i) => i.path[0] === "nickname")?.message
      : undefined;

  const toggleInterest = (id: ProfileInput["interests"][number]) =>
    setDraft((d) => ({
      ...d,
      interests: d.interests.includes(id)
        ? d.interests.filter((x) => x !== id)
        : d.interests.length < MAX_INTERESTS
          ? [...d.interests, id]
          : d.interests,
    }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!parsed.success || saving) return;
    setSaving(true);
    setSaveFailed(false);
    const profile = await addProfile(parsed.data);
    if (!profile) {
      setSaveFailed(true);
      setSaving(false);
      return;
    }
    router.push(`/buddy?p=${profile.id}`);
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-xl bg-mode-chat px-4 py-6">
      <Button asChild variant="outline" className="mb-6">
        <Link href="/">
          <ArrowLeft aria-hidden />
          Back
        </Link>
      </Button>

      <form onSubmit={submit} className="flex flex-col gap-8" noValidate>
        <h1 className="text-heading font-bold">Meet your new friend</h1>

        <div className="flex flex-col gap-2">
          <label htmlFor="nickname" className="text-label font-bold">
            Nickname
          </label>
          <input
            id="nickname"
            value={draft.nickname}
            maxLength={MAX_NICKNAME_LENGTH}
            autoComplete="off"
            onChange={(e) => setDraft((d) => ({ ...d, nickname: e.target.value.replace(/[^A-Za-z]/g, "") }))}
            aria-invalid={Boolean(nicknameError)}
            aria-describedby="nickname-hint"
            className="h-16 rounded-full border-2 border-border bg-card px-6 text-label"
          />
          <p id="nickname-hint" className={cn("text-body", nicknameError ? "text-foreground" : "text-muted-foreground")}>
            {nicknameError ?? "Letters only. Please do not use a full name."}
          </p>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-label font-bold">Age</legend>
          <div className="flex gap-4">
            {AGE_BANDS.map((band) => (
              <button
                key={band}
                type="button"
                aria-pressed={draft.ageBand === band}
                onClick={() => setDraft((d) => ({ ...d, ageBand: band }))}
                className={cn(chip, "flex-1", draft.ageBand === band ? chosen : idle)}
              >
                {draft.ageBand === band && <Check aria-hidden className="size-6" />}
                {AGE_BAND_LABELS[band]}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-label font-bold">Pick a face</legend>
          <div className="grid grid-cols-4 justify-items-center gap-4">
            {AVATAR_IDS.map((id) => (
              <button
                key={id}
                type="button"
                aria-label={AVATAR_LABELS[id]}
                aria-pressed={draft.avatar === id}
                onClick={() => setDraft((d) => ({ ...d, avatar: id }))}
                className={cn(
                  "grid size-16 place-items-center rounded-full border-2 text-4xl active:scale-[0.96] motion-reduce:active:scale-100",
                  draft.avatar === id ? "border-primary bg-card ring-4 ring-primary" : "border-border bg-card",
                )}
              >
                <span aria-hidden>{AVATAR_FACES[id]}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-label font-bold">Likes (pick up to {MAX_INTERESTS})</legend>
          <div className="flex flex-wrap gap-4">
            {INTEREST_IDS.map((id) => {
              const on = draft.interests.includes(id);
              const full = !on && draft.interests.length >= MAX_INTERESTS;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  aria-disabled={full}
                  onClick={() => toggleInterest(id)}
                  className={cn(chip, on ? chosen : idle, full && "opacity-60")}
                >
                  {on ? <Check aria-hidden className="size-6" /> : <span aria-hidden>{INTEREST_LABELS[id].icon}</span>}
                  {INTEREST_LABELS[id].word}
                </button>
              );
            })}
          </div>
        </fieldset>

        <Button type="submit" variant="accent" className="self-stretch" disabled={saving}>
          {saveFailed ? "Try again" : "Start playing"}
        </Button>
        {saveFailed && (
          <p role="alert" className="-mt-4 text-center text-body">
            Pip could not save that. Please try again.
          </p>
        )}
        {touched && !parsed.success && (
          <p role="alert" className="-mt-4 text-center text-body">
            Please pick an age and a face first.
          </p>
        )}
      </form>
    </main>
  );
}
