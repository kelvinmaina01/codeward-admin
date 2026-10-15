import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GitPullRequest, GitCommit, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { SidebarRightIcon } from "hugeicons-react";
import { apiFetch } from "../../lib/api";
import { Button } from "../../components/ui/button";
import RunDrawer from "../../components/RunDrawer";

type Run = {
  id: number;
  repoId: number;
  commitSha: string | null;
  status: string;
  score: number | null;
  prNumber: number | null;
  createdAt: string;
  repoFullName: string | null;
};

type PaginatedRuns = {
  runs: Run[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export default function ActivityLog() {
  const [filterType, setFilterType] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: "50",
  });

  if (filterType !== "all") {
    queryParams.append("status", filterType);
  }

  const { data, isLoading, isError, error } = useQuery<PaginatedRuns>({
    queryKey: ["admin-runs", page, filterType],
    queryFn: () => apiFetch(`/runs?${queryParams.toString()}`),
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return { color: "text-emerald-500", bg: "bg-emerald-500/10" };
      case 'failed': return { color: "text-red-500", bg: "bg-red-500/10" };
      case 'in_progress': return { color: "text-blue-500", bg: "bg-blue-500/10" };
      default: return { color: "text-foreground", bg: "bg-muted" };
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Feed column — shrinks side-by-side when the drawer is open (push, not overlay) */}
      <div className="p-6 space-y-5 flex flex-col h-full min-w-0 flex-1 relative">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agent Activity Log (Runs)</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time feed of all agent runs and PR scans across the Codeward platform.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 flex-wrap">
          {["all", "queued", "in_progress", "completed", "failed"].map((type) => (
            <button
              key={type}
              onClick={() => { setFilterType(type); setPage(1); }}
              className={`px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-all capitalize ${
                filterType === type
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {isError && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
          Error loading activity: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      )}

      {/* Activity Feed */}
      <div className="flex-1 overflow-auto space-y-2 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {data?.runs.map((run) => {
          const { color, bg } = getStatusColor(run.status);
          const isPR = !!run.prNumber;

          return (
            <div
              key={run.id}
              onClick={() => { setSelectedId(run.id); setDrawerCollapsed(false); }}
              title="Click to open run detail"
              className={`flex items-start gap-4 p-4 rounded-lg border bg-card transition-colors group cursor-pointer ${
                selectedId === run.id
                  ? "border-primary/50 ring-1 ring-primary/30"
                  : "hover:bg-muted/30 hover:border-foreground/20"
              }`}
            >
              {/* Icon */}
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${bg} ${color}`}>
                {isPR ? <GitPullRequest className="h-4 w-4" /> : <GitCommit className="h-4 w-4" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{run.repoFullName || `Repo #${run.repoId}`}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${bg} ${color}`}>
                    {run.status}
                  </span>
                  {run.score !== null && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">
                      Score: {run.score}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 truncate">
                  {isPR ? `Pull Request #${run.prNumber} scanned.` : `Commit ${run.commitSha?.slice(0,7) || ''} scanned.`}
                </p>
              </div>

              {/* Time + hover affordance */}
              <span className="flex shrink-0 items-center gap-1.5 pt-0.5">
                <span className="text-xs text-muted-foreground">
                  {new Date(run.createdAt).toLocaleString()}
                </span>
                <SidebarRightIcon className="h-4 w-4 text-muted-foreground/0 transition-all group-hover:text-muted-foreground group-hover:opacity-100" />
              </span>
            </div>
          );
        })}

        {!isLoading && data?.runs.length === 0 && (
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
            No activity found matching your filters.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <span>Total runs: {data?.pagination.total || 0}</span>
        <div className="flex items-center gap-1">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7" 
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="px-2 font-medium">Page {data?.pagination.page || 1} of {data?.pagination.totalPages || 1}</span>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7" 
            disabled={!data || page >= data.pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      </div>

      {/* Docked detail panel — pushes the feed, sits side-by-side */}
      {selectedId !== null && (
        <RunDrawer
          runId={selectedId}
          collapsed={drawerCollapsed}
          onToggleCollapse={() => setDrawerCollapsed((v) => !v)}
          onBack={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
