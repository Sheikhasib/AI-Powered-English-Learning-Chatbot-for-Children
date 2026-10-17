import { Check } from "lucide-react";
import { MASTERED } from "@/engine/config";
import type { ParentReport } from "@/server/repositories/report";
import { Bar } from "./Bar";

/** Current level plus a mastery bar for every skill in the curriculum. */
export function ProgressTab({ report }: { report: ParentReport }) {
  return (
    <div className="space-y-6">
      <p className="text-body">
        {report.nickname} is on <strong>level {report.level}</strong> and has earned{" "}
        <strong>{report.stars} stars</strong>. A skill counts as mastered at {Math.round(MASTERED * 100)}%.
      </p>
      {report.progress.map((level) => (
        <section key={level.level} aria-labelledby={`level-${level.level}`} className="space-y-3">
          <h3 id={`level-${level.level}`} className="text-body font-bold">
            Level {level.level}: {level.title}{" "}
            <span className="text-meta font-normal text-muted-foreground">
              ({level.masteredCount} of {level.skills.length} mastered)
            </span>
          </h3>
          <ul className="space-y-3">
            {level.skills.map((skill) => (
              <li key={skill.id} className="flex items-start gap-2">
                <span className="mt-0.5 size-5 shrink-0 text-success" aria-hidden={!skill.mastered}>
                  {skill.mastered && <Check className="size-5" aria-label="Mastered" />}
                </span>
                <div className="flex-1">
                  <Bar
                    label={skill.title}
                    value={skill.mastery}
                    valueText={`${Math.round(skill.mastery * 100)}%`}
                    marker={MASTERED}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
