import { ChartColumnIcon } from "hugeicons-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { DebtLeader } from "../lib/trends";
import { cn } from "../lib/utils";

function scoreTone(score: number | null): string {
  if (score === null || score === undefined) return "bg-muted text-muted-foreground";
  if (score >= 80) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
}

export default function DebtLeaders({
  leaders,
  isLoading,
  onOpen,
}: {
  leaders?: DebtLeader[];
  isLoading: boolean;
  onOpen: () => void;
}) {
  const max = Math.max(1, ...(leaders ?? []).map((l) => l.debtPenalty));
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <ChartColumnIcon className="h-4 w-4" />
          </span>
          <div>
            <CardTitle className="text-sm">Leading Repos in Technical Debt</CardTitle>
            <p className="text-[11px] text-muted-foreground">Penalty-weighted open findings · live snapshot</p>
          </div>
        </div>
        <button onClick={onOpen} className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer">
          Details →
        </button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
          </div>
        ) : !leaders || leaders.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No open debt — every tracked repo is clean.
          </p>
        ) : (
          <div className="space-y-2">
            {leaders.map((l, i) => (
              <button
                key={l.repoId}
                onClick={onOpen}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-muted/60 transition-colors cursor-pointer"
              >
                <span className="w-5 shrink-0 text-center text-xs font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-semibold">{l.repo}</p>
                    {typeof l.score === "number" && (
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[11px] font-bold", scoreTone(l.score))}>
                        {l.score}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
                      style={{ width: `${Math.max(4, (l.debtPenalty / max) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-bold tabular-nums">{l.openFindings}</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    {l.debtPenalty.toLocaleString()} pts
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
