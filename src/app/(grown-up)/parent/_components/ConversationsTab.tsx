import { TriangleAlert } from "lucide-react";
import { RECENT_TURNS, type ParentReport } from "@/server/repositories/report";
import { MODE_STYLES, flagLabel, formatTime } from "./display";

/** The latest turns, already redacted when stored; flagged turns get a border, an icon and a label. */
export function ConversationsTab({ report }: { report: ParentReport }) {
  if (report.turns.length === 0) return <p className="text-body text-muted-foreground">No chats yet.</p>;

  return (
    <div className="space-y-3">
      <p className="text-meta text-muted-foreground">
        The last {RECENT_TURNS} turns, newest first. Personal details are removed before they are saved.
      </p>
      <ul className="space-y-3">
        {report.turns.map((turn) => (
          <li
            key={turn.id}
            className={`rounded-lg border-2 bg-card p-4 ${turn.safetyFlag ? "border-destructive" : "border-border"}`}
          >
            <p className="mb-2 text-meta text-muted-foreground">
              {formatTime(turn.createdAt)} · {MODE_STYLES[turn.mode].label}
            </p>
            {turn.safetyFlag && (
              <p className="mb-2 flex items-center gap-2 text-body font-bold text-destructive">
                <TriangleAlert className="size-5" aria-hidden />
                Safety flag: {flagLabel(turn.safetyFlag)}. Please check in with {report.nickname}.
              </p>
            )}
            <p className="text-body">
              <strong>{report.nickname}:</strong> {turn.childInput}
            </p>
            <p className="text-body">
              <strong>Pip:</strong> {turn.botReply}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
