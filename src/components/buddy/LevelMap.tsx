import { Cloud, Lock, MapPin, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IslandView, SkillView } from "./progressView";

const ISLAND_SURFACE: Record<IslandView["level"], string> = {
  1: "bg-mode-calm",
  2: "bg-mode-play",
  3: "bg-mode-chat",
};

function SkillDot({ skill }: { skill: SkillView }) {
  if (skill.current) {
    return (
      <li className="animate-pip-pulse grid size-9 place-items-center rounded-full border-2 border-foreground bg-accent text-accent-foreground">
        <MapPin aria-hidden className="size-5" />
        <span className="sr-only">{skill.title}: next</span>
      </li>
    );
  }
  return (
    <li className="grid size-9 place-items-center">
      {skill.mastered ? (
        <Star aria-hidden className="size-8 fill-accent stroke-foreground stroke-[1.5]" />
      ) : (
        <span aria-hidden className="size-5 rounded-full border-2 border-foreground/40 bg-card" />
      )}
      <span className="sr-only">
        {skill.title}: {skill.mastered ? "done" : "not yet"}
      </span>
    </li>
  );
}

function Island({ island }: { island: IslandView }) {
  const done = island.skills.filter((s) => s.mastered).length;
  const status = island.locked ? "locked" : `${done} of ${island.skills.length} stars`;

  return (
    <section
      aria-label={`Level ${island.level}, ${island.title}, ${status}`}
      className={cn(
        "relative flex flex-1 items-center gap-4 overflow-hidden rounded-xl border-2 border-border p-4 shadow-sm",
        ISLAND_SURFACE[island.level],
      )}
    >
      <div className="grid size-16 shrink-0 place-items-center rounded-full bg-card text-5xl font-bold text-primary">
        {island.level}
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <h2 className="text-label font-bold">{island.title}</h2>
        <ul className="flex flex-wrap gap-1">
          {island.skills.map((skill) => (
            <SkillDot key={skill.id} skill={skill} />
          ))}
        </ul>
      </div>
      {island.locked && (
        <div className="absolute inset-0 grid place-items-center bg-card/75 backdrop-blur-sm">
          <Cloud aria-hidden className="absolute top-3 left-6 size-10 fill-card stroke-foreground/30" />
          <Cloud aria-hidden className="absolute right-8 bottom-3 size-12 fill-card stroke-foreground/30" />
          <div className="grid size-16 place-items-center rounded-full bg-card text-foreground shadow-sm">
            <Lock aria-hidden className="size-8" />
          </div>
        </div>
      )}
    </section>
  );
}

/** Three islands from level 1 (bottom) to level 3 (top). Locked islands sit in fog; the current skill pulses. */
export function LevelMap({ islands }: { islands: IslandView[] }) {
  return (
    <div className="flex flex-1 flex-col gap-3">
      {[...islands].reverse().map((island) => (
        <Island key={island.level} island={island} />
      ))}
    </div>
  );
}
