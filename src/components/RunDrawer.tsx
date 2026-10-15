import { useQuery } from "@tanstack/react-query";
import {
  SidebarRightIcon,
  SidebarLeftIcon,
  ArrowLeft01Icon,
  CpuIcon,
  FileScriptIcon,
  Clock01Icon,
  GitPullRequestIcon,
  GitCommitIcon,
  AlertCircleIcon,
} from "hugeicons-react";
import { Loader2 } from "lucide-react";
import { apiFetch } from "../lib/api";
import { cn } from "../lib/utils";

export interface RunTask {
  id: number;
  agentId: string;
  status: string;
  provider: string | null;
  model: string | null;
  score: number | null;
  findingsCount: number;
  tokenUsage: unknown;
  duration: number | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface RunLog {
  id: number;
  agent: string;
  level: string;
  message: string;
  tsMs: number;
}

export interface RunDetail {
  run: {
    id: number;
    repoId: number;
    commitSha: string | null;
    status: string;
    score: number | null;
    prNumber: number | null;
    scope: unknown;
    createdAt: string;
    repoFullName: string | null;
    repoOwner: string | null;
  };
  tasks: RunTask[];
  logs: RunLog[];
}

function statusTone(status: string): string {
  switch (status) {
    case "completed":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "failed":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
    case "in_progress":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "queued":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function levelColor(level: string): string {
  switch (level) {
    case "err":
      return "text-rose-500";
    case "warn":
      return "text-amber-500";
    case "ok":
      return "text-emerald-500";
    case "inf":
      return "text-sky-500";
    default:
      return "text-muted-foreground";
  }
}

function fmtTime(tsMs: number): string {
  return new Date(tsMs).toLocaleTimeString([], { hour12: false });
}

interface Props {
  runId: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onBack: () => void;
}

export default function RunDrawer({ runId, collapsed, onToggleCollapse, onBack }: Props) {
  const { data, isLoading, isError } = useQuery<RunDetail>({
    queryKey: ["admin-run-detail", runId],
    queryFn: () => apiFetch<RunDetail>(`/runs/${runId}`),
    staleTime: 30_000,
  });

  // Collapsed → slim icon rail (click to re-expand)
  if (collapsed) {
    return (
      <aside className="flex w-[52px] shrink-0 flex-col items-center gap-2 border-l border-border/60 bg-card/50 py-3">
        <button
          onClick={onToggleCollapse}
          title="Expand panel"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
        >
          <SidebarLeftIcon className="h-5 w-5" />
        </button>
        <button
          onClick={onBack}
          title="Back to list"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
        >
          <ArrowLeft01Icon className="h-5 w-5" />
        </button>
      </aside>
    );
  }

  const run = data?.run;
  const isPR = !!run?.prNumber;

  return (
    <aside className="flex w-full max-w-[440px] shrink-0 flex-col border-l border-border/60 bg-card/50 min-w-[340px]">
      {/* Icon-only controls */}
      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-border/60 px-2">
        <button
          onClick={onBack}
          title="Back to list"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
        >
          <ArrowLeft01Icon className="h-5 w-5" />
        </button>
        <span className="ml-1 text-[13px] font-semibold truncate">
          {run ? `#${run.id} · ${run.repoFullName ?? `Repo #${run.repoId}`}` : `Run #${runId}`}
        </span>
        <button
          onClick={onToggleCollapse}
          title="Collapse panel"
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
        >
          <SidebarRightIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {isLoading && (
          <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading run detail…
          </div>
        )}
        {isError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-[13px] text-destructive">
            Failed to load run detail. It may need the latest API deploy.
          </div>
        )}

        {run && (
          <>
            {/* Status header */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", statusTone(run.status))}>
                {isPR ? <GitPullRequestIcon className="h-5 w-5" /> : <GitCommitIcon className="h-5 w-5" />}
              </span>
              <div>
                <p className="text-sm font-bold leading-tight">{run.repoFullName ?? `Repo #${run.repoId}`}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-semibold capitalize", statusTone(run.status))}>
                    {run.status.replace("_", " ")}
                  </span>
                  {run.score !== null && (
                    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      Score {run.score}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Meta snapshot */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Run ID", value: `#${run.id}` },
                { label: isPR ? "Pull Request" : "Commit", value: isPR ? `#${run.prNumber}` : (run.commitSha?.slice(0, 12) ?? "—") },
                { label: "Owner", value: run.repoOwner ?? "—" },
                {
                  label: "Started",
                  value: new Date(run.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
                },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border bg-background p-2.5">
                  <p className="text-[11px] text-muted-foreground">{m.label}</p>
                  <p className="truncate text-[13px] font-semibold" title={m.value}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* Agent tasks flow */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold">
                <CpuIcon className="h-4 w-4" />
                Agent flow
                <span className="text-[11px] font-normal text-muted-foreground">({data?.tasks.length ?? 0})</span>
              </p>
              {!data?.tasks.length ? (
                <p className="text-xs text-muted-foreground">No agent tasks recorded for this run.</p>
              ) : (
                <div className="relative space-y-0">
                  {data.tasks.map((t, i) => (
                    <div key={t.id} className="relative flex gap-3 pb-3 last:pb-0">
                      {i < data.tasks.length - 1 && (
                        <span className="absolute left-[15px] top-8 h-[calc(100%-32px)] w-px bg-border" />
                      )}
                      <span className={cn("z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border", statusTone(t.status))}>
                        <CpuIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1 rounded-lg border bg-background p-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[13px] font-semibold">{t.agentId}</p>
                          <span className={cn("rounded px-1 py-px text-[10px] font-semibold capitalize", statusTone(t.status))}>
                            {t.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {[t.provider, t.model].filter(Boolean).join(" · ") || "—"}
                          {typeof t.duration === "number" ? ` · ${t.duration}s` : ""}
                          {typeof t.score === "number" ? ` · score ${t.score}` : ""}
                          {` · ${t.findingsCount} findings`}
                        </p>
                        {t.error && (
                          <p className="mt-1 flex items-start gap-1 text-[11px] text-rose-500">
                            <AlertCircleIcon className="mt-0.5 h-3 w-3 shrink-0" />
                            <span className="line-clamp-2">{t.error}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Logs snapshot */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold">
                <FileScriptIcon className="h-4 w-4" />
                Logs snapshot
                <span className="text-[11px] font-normal text-muted-foreground">({data?.logs.length ?? 0}{data && data.logs.length >= 200 ? "+" : ""})</span>
              </p>
              {!data?.logs.length ? (
                <p className="text-xs text-muted-foreground">No logs captured for this run.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto rounded-lg border bg-black/90 p-2 font-mono text-[11px] leading-relaxed dark:bg-black">
                  {data.logs.map((l) => (
                    <div key={l.id} className="flex gap-2 whitespace-pre-wrap break-all">
                      <span className="shrink-0 text-white/30">{fmtTime(l.tsMs)}</span>
                      <span className={cn("shrink-0 font-bold uppercase", levelColor(l.level))}>
                        {l.level}
                      </span>
                      <span className="text-white/80">
                        <span className="text-white/40">[{l.agent}]</span> {l.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Timing footer */}
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock01Icon className="h-3.5 w-3.5" />
              Recorded {new Date(run.createdAt).toLocaleString()}
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
