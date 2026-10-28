import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Mail, Plus, Search } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  STATUS_META,
  useMessageThreads,
  type EmailThread,
  type ThreadFilter,
} from "../../lib/messages";

function formatTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const sameYear = d.getFullYear() === now.getFullYear();
  if (sameYear) return d.toLocaleDateString([], { month: "short", day: "numeric" });
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function participantsLabel(t: EmailThread) {
  if (t.lastMessageFrom?.email) {
    const name = t.lastMessageFrom.name || t.lastMessageFrom.email.split("@")[0];
    const others = Math.max(0, t.participants.length - 1);
    if (others === 0) return name;
    return `${name} +${others}`;
  }
  if (t.participants.length === 0) return "Unknown";
  const first = t.participants[0].name || t.participants[0].email;
  const others = t.participants.length - 1;
  if (others === 0) return first;
  return `${first} +${others}`;
}

export default function ThreadsList({ activeThreadId }: { activeThreadId?: string }) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filter = (params.get("filter") as ThreadFilter) || "all";
  const status = params.get("status") === "failed" ? "failed" : undefined;
  const [q, setQ] = useState(params.get("q") || "");
  const [debounced, setDebounced] = useState(params.get("q") || "");

  const onSearch = (v: string) => {
    setQ(v);
    window.clearTimeout((onSearch as any)._t);
    (onSearch as any)._t = window.setTimeout(() => {
      setDebounced(v);
      const next = new URLSearchParams(params);
      if (v) next.set("q", v);
      else next.delete("q");
      setParams(next, { replace: true });
    }, 350);
  };

  const setFilter = (f: ThreadFilter) => {
    const next = new URLSearchParams(params);
    if (f === "all") next.delete("filter");
    else next.set("filter", f);
    setParams(next, { replace: true });
  };

  const setStatus = (s: "failed" | undefined) => {
    const next = new URLSearchParams(params);
    if (s) next.set("status", s);
    else next.delete("status");
    setParams(next, { replace: true });
  };

  const { data, isLoading, isError } = useMessageThreads({
    filter,
    status,
    q: debounced || undefined,
    limit: 50,
  });
  const threads = data?.threads ?? [];

  const counts = useMemo(() => {
    let t = 0,
      p = 0;
    for (const th of threads) {
      if (th.category === "transactional") t++;
      else if (th.category === "personal") p++;
    }
    return { all: threads.length, transactional: t, personal: p };
  }, [threads]);

  // The API only exposes per-thread delivery aggregates once delivery status
  // tracking is deployed. Until then the "failed" filter cannot be answered.
  const aggregatesAvailable = threads.some(
    (t) => typeof t.bouncedCount === "number" || typeof t.lastMessageStatus === "string"
  );

  return (
    <div className="flex h-full w-[420px] flex-shrink-0 flex-col border-r bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Messages</h1>
          <p className="text-xs text-muted-foreground">All emails sent & received via Resend</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => navigate("/messages/compose")}
            className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 cursor-pointer"
            title="Compose New Email"
          >
            <Plus className="h-3.5 w-3.5" />
            Compose
          </button>
        </div>
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search sender, subject, or content..."
            className="h-8 w-full rounded-lg border bg-background pl-8 pr-2 text-[12px] outline-none placeholder:text-muted-foreground/70 focus:border-primary/40"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 px-3 pb-2">
        {(["all", "transactional", "personal"] as ThreadFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-medium capitalize transition-all cursor-pointer",
              filter === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f === "personal" ? "Personal / Direct" : f}
            {f === "all" ? ` (${counts.all})` : f === "transactional" ? ` (${counts.transactional})` : ` (${counts.personal})`}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 px-3 pb-2">
        <button
          onClick={() => setStatus(undefined)}
          className={cn(
            "rounded-md px-2 py-1 text-[11px] font-medium transition-all cursor-pointer",
            !status ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Any delivery status
        </button>
        <button
          onClick={() => setStatus("failed")}
          className={cn(
            "rounded-md px-2 py-1 text-[11px] font-medium transition-all cursor-pointer",
            status === "failed"
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Failed & bounced
        </button>
      </div>

        {status === "failed" && !aggregatesAvailable && (
          <p className="px-3 pb-2 text-[10px] text-amber-600 dark:text-amber-400">
            Delivery aggregates are not available from the API yet — this filter is inactive.
          </p>
        )}

        <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
        {isError && (
          <div className="px-4 py-6 text-center text-xs text-destructive">
            Failed to load messages. Ensure the API has <code className="font-mono">/api/admin/messages/*</code> routes.
          </div>
        )}
        {!isLoading && !isError && threads.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No emails found.
          </div>
        )}
        {threads.map((t) => {
          const active = activeThreadId === t.id;
          const statusMeta = t.lastMessageStatus
            ? STATUS_META[t.lastMessageStatus] ?? STATUS_META.unknown
            : null;
          const failed = (t.bouncedCount ?? 0) + (t.failedCount ?? 0);
          return (
            <button
              key={t.id}
              onClick={() => navigate(`/messages/${t.id}`)}
              className={cn(
                "flex w-full flex-col gap-1 border-b px-4 py-2.5 text-left transition-colors",
                active ? "bg-primary/5" : "hover:bg-muted/40"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={cn("truncate text-[13px]", t.isUnread ? "font-semibold" : "font-medium")}>
                  {participantsLabel(t)}
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {t.lastMessageDirection && (
                    <span
                      className={cn(
                        "rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                        t.lastMessageDirection === "outbound"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      )}
                      title={t.lastMessageDirection === "outbound" ? "Outgoing" : "Incoming"}
                    >
                      {t.lastMessageDirection === "outbound" ? "Out" : "In"}
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground">{formatTime(t.lastMessageAt)}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="truncate text-[12px] font-medium">{t.subject || "(no subject)"}</span>
                <span
                  className={cn(
                    "shrink-0 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                    t.category === "transactional"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : t.category === "personal"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {t.category === "personal" ? "Direct" : t.category}
                </span>
                {t.hasReplyFromAdmin && (
                  <span className="shrink-0 rounded bg-blue-500/10 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Replied
                  </span>
                )}
                {failed > 0 ? (
                  <span className="shrink-0 rounded bg-rose-500/10 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    {failed} failed
                  </span>
                ) : statusMeta ? (
                  <span
                    className={cn(
                      "shrink-0 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                      statusMeta.className
                    )}
                  >
                    {statusMeta.label}
                  </span>
                ) : null}
              </div>
              {t.snippet && <p className="truncate text-[11px] text-muted-foreground">{t.snippet}</p>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
