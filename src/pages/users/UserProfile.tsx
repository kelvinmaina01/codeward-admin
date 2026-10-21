import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Code2, GitPullRequest, ShieldBan, UserPlus, LogIn, Loader2, Trash2, RotateCcw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { apiFetch } from "../../lib/api";
import UserActionDialog, { type UserActionMode } from "../../components/UserActionDialog";

type ProfileResponse = {
  user: {
    id: string;
    email: string;
    name: string;
    image: string | null;
    isDeleted: boolean;
    suspendedAt: string | null;
    suspendedBy: string | null;
    role: string;
    emailVerified: boolean;
    createdAt: string;
    settings: any;
  };
  billing: any | null;
  repos: any[];
  recentSessions: any[];
  recentRuns: any[];
  authProviders: string[];
};

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [action, setAction] = useState<UserActionMode | null>(null);

  const { data, isLoading, isError } = useQuery<ProfileResponse>({
    queryKey: ["admin-user", id],
    queryFn: () => apiFetch(`/users/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data?.user) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
          Error loading user profile or user not found.
        </div>
      </div>
    );
  }

  const { user, billing, repos, recentSessions, recentRuns, authProviders } = data;
  
  // Create a combined timeline from the recent data
  const timeline = [
    { type: "signup", title: "User signed up", detail: user.email, date: new Date(user.createdAt).toLocaleString(), ts: new Date(user.createdAt).getTime(), icon: <UserPlus className="h-4 w-4" />, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    ...recentSessions.map(s => ({
      type: "login",
      title: `Session from ${s.ipAddress || "Unknown IP"}`,
      detail: s.userAgent || "Unknown browser",
      date: new Date(s.createdAt).toLocaleString(),
      ts: new Date(s.createdAt).getTime(),
      icon: <LogIn className="h-4 w-4" />, color: "text-foreground", bg: "bg-muted border-border"
    })),
    ...repos.map(r => ({
      type: "repo_connected",
      title: `Connected repo: ${r.fullName}`,
      detail: `${r.language || "Unknown language"} - ${r.isPrivate ? 'Private' : 'Public'}`,
      date: new Date(r.createdAt).toLocaleString(),
      ts: new Date(r.createdAt).getTime(),
      icon: <Code2 className="h-4 w-4" />, color: "text-green-500", bg: "bg-green-500/10 border-green-500/20"
    })),
    ...recentRuns.map(run => ({
      type: "pr_scanned",
      title: `PR Scanned - Score: ${run.score || 'N/A'}`,
      detail: `Status: ${run.status}`,
      date: new Date(run.createdAt).toLocaleString(),
      ts: new Date(run.createdAt).getTime(),
      icon: <GitPullRequest className="h-4 w-4" />, color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/20"
    }))
  ].sort((a, b) => b.ts - a.ts); // Sort descending

  const lastSession = recentSessions[0];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to users
      </button>

      {/* ── Profile Header ── */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold border-2 border-primary/20 shrink-0">
                {user.image ? (
                  <img src={user.image} alt={user.name} className="h-full w-full rounded-full object-cover" />
                ) : (
                  (user.name || user.email).charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold">{user.name || "Unknown User"}</h1>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                    billing?.planType === "pro" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" :
                    billing?.planType === "team" ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" :
                    "bg-muted text-muted-foreground border-border"
                  }`}>{billing?.planType || "free"} Plan</span>
                  {user.isDeleted && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-semibold">DELETED</span>}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1.5 flex-wrap">
                  <span>{user.email}</span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="capitalize">Auth: {authProviders.join(', ') || 'OAuth'}</span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {user.suspendedAt && (
                <span
                  className="rounded px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  title={user.suspendedBy ? `Suspended by ${user.suspendedBy}` : undefined}
                >
                  SUSPENDED
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-500 gap-1.5"
                onClick={() => setAction(user.isDeleted ? "restore" : "suspend")}
              >
                {user.isDeleted ? <RotateCcw className="h-3.5 w-3.5" /> : <ShieldBan className="h-3.5 w-3.5" />}
                {user.isDeleted ? "Restore" : "Suspend"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive gap-1.5"
                onClick={() => setAction("purge")}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats & Info Grid ── */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Codeward Stats */}
        <div className="bg-card rounded-xl border p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Codeward Stats</h3>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] text-muted-foreground mb-0.5">Connected Repos</p>
              <div className="text-lg font-bold">{repos.length}</div>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-0.5">Recent Runs (Last 10)</p>
              <div className="text-lg font-bold">{recentRuns.length}</div>
            </div>
            {/* Some stats like leaderboard/debt cleared are placeholders until backend implements them */}
            <div>
              <p className="text-[11px] text-muted-foreground mb-0.5">Global Leaderboard</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Stats unavailable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Organization & Plan */}
        <div className="bg-card rounded-xl border p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Organization & Plan</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Organization ID</span>
              <span className="font-medium">{billing?.orgId || "Personal"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium capitalize">{billing?.planType || "free"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trial PRs Used</span>
              <span className="font-medium">{billing?.trialPrsUsed || 0} / {billing?.trialPrLimit || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Baseline Scans</span>
              <span className="font-medium">{billing?.baselineScansUsed || 0} / {billing?.baselineScanLimit || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Global Feed</span>
              <span className="font-medium">{user.settings?.globalFeed === false ? "Opted out" : "Opted in"}</span>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-card rounded-xl border p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">System Info</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Active</span>
              <span className="font-medium">{lastSession ? new Date(lastSession.createdAt).toLocaleString() : "Never"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email Verified</span>
              <span className="font-medium">{user.emailVerified ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last IP</span>
              <span className="font-mono text-xs">{lastSession?.ipAddress || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Browser</span>
              <span className="text-xs truncate max-w-[150px]">{lastSession?.userAgent || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Full Timeline ── */}
      <div className="bg-card rounded-xl border p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-6">
          <h3 className="text-base font-semibold">Activity Timeline</h3>
          <span className="text-xs text-muted-foreground">{timeline.length} recent events</span>
        </div>

        <div className="relative pl-8">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-0 bottom-8 w-px bg-gradient-to-b from-border via-border to-transparent" />

          <div className="space-y-6">
            {timeline.length === 0 && (
              <p className="text-sm text-muted-foreground">No activity found.</p>
            )}
            {timeline.map((item, i) => (
              <div key={i} className="relative flex items-start group">
                {/* Dot */}
                <div className={`absolute -left-[17px] h-7 w-7 rounded-full border flex items-center justify-center bg-background z-10 transition-transform group-hover:scale-110 ${item.bg} ${item.color}`}>
                  {item.icon}
                </div>
                {/* Content */}
                <div className="flex-1 ml-4">
                  <div className="bg-muted/20 rounded-lg p-3 border border-border/40 hover:border-border/80 hover:bg-muted/30 transition-all">
                    <h4 className="text-sm font-medium">{item.title}</h4>
                    {item.detail && <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>}
                    <span className="text-[11px] text-muted-foreground mt-1.5 block">{item.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {action && (
        <UserActionDialog
          mode={action}
          user={{ id: user.id, email: user.email, name: user.name }}
          onClose={() => setAction(null)}
          onDone={() => {
            setAction(null);
            if (action === "purge") {
              navigate("/users/all", { replace: true });
              return;
            }
            queryClient.invalidateQueries({ queryKey: ["admin-user", id] });
            queryClient.invalidateQueries({ queryKey: ["users"] });
          }}
        />
      )}
    </div>
  );
}
