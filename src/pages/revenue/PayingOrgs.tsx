import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { SidebarRightIcon } from "hugeicons-react";
import { Button } from "../../components/ui/button";
import OrgRevenueDrawer, { statusTone } from "../../components/OrgRevenueDrawer";
import { useRevenueOrgs, fmtMoney } from "../../lib/revenue";
import { cn } from "../../lib/utils";

export default function PayingOrgs() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);

  const onSearch = (v: string) => {
    setSearch(v);
    window.clearTimeout((onSearch as unknown as { t?: number }).t);
    (onSearch as unknown as { t?: number }).t = window.setTimeout(() => {
      setDebounced(v);
      setPage(1);
    }, 400);
  };

  const { data, isLoading, isError } = useRevenueOrgs({
    search: debounced || undefined,
    plan,
    status,
    page,
    limit: 25,
  });

  const currency = data?.currency ?? "USD";

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex h-full min-w-0 flex-1 flex-col space-y-4 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Paying Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every org that has ever paid — what they pay, and when they skipped. Click a row for full history.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search org or owner…"
              className="h-9 w-56 rounded-lg border bg-card pl-8 pr-2 text-[13px] outline-none placeholder:text-muted-foreground/70 focus:border-primary/40"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
            {["all", "pro", "team"].map((p) => (
              <button
                key={p}
                onClick={() => { setPlan(p); setPage(1); }}
                className={cn("rounded-md px-2.5 py-1.5 text-[11px] font-medium capitalize transition-all cursor-pointer", plan === p ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
            {["all", "active", "past_due", "canceled"].map((s) => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1); }}
                className={cn("rounded-md px-2.5 py-1.5 text-[11px] font-medium capitalize transition-all cursor-pointer", status === s ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {isError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load paying customers. This page needs the latest API deploy (revenue endpoints).
          </div>
        )}

        {/* Table */}
        <div className="relative min-h-0 flex-1 overflow-auto rounded-xl border">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          <table className="w-full min-w-[900px] text-left text-[13px]">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur">
              <tr className="text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">Customer</th>
                <th className="px-3 py-2 font-medium">Plan</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">MRR</th>
                <th className="px-3 py-2 text-right font-medium">Lifetime</th>
                <th className="px-3 py-2 font-medium">Last payment</th>
                <th className="px-3 py-2 font-medium">Last skipped</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {data?.orgs.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => { setSelectedId(o.id); setDrawerCollapsed(false); }}
                  title="Click to open billing detail"
                  className={cn(
                    "group cursor-pointer border-t border-border/50 transition-colors",
                    selectedId === o.id ? "bg-primary/5" : "hover:bg-muted/40"
                  )}
                >
                  <td className="px-3 py-2.5">
                    <p className="font-semibold">{o.githubLogin}</p>
                    <p className="truncate text-xs text-muted-foreground max-w-[220px]">
                      {o.owner ? `${o.owner.name} · ${o.owner.email}` : `${o.memberCount} member(s)`}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-semibold capitalize">
                      {o.planType}
                    </span>
                    <span className="ml-1 text-[11px] text-muted-foreground">×{o.seatCount}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-semibold capitalize", statusTone(o.status))}>
                      {o.status.replace("_", " ")}
                    </span>
                    {o.isReturning && (
                      <span className="ml-1 rounded bg-blue-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400" title="Canceled before, came back">
                        returning
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold tabular-nums">{fmtMoney(o.mrrCents, currency)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{fmtMoney(o.lifetimeCents, currency)}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    {o.lastPaymentAt ? new Date(o.lastPaymentAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    {o.lastSkippedAt ? (
                      <span className="font-semibold text-rose-500">{new Date(o.lastSkippedAt).toLocaleDateString()}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <SidebarRightIcon className="h-4 w-4 text-muted-foreground/0 transition-all group-hover:text-muted-foreground" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && data?.orgs.length === 0 && (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              No paying customers match these filters.
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Total: {data?.pagination.total ?? 0} paying orgs</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 font-medium">Page {data?.pagination.page ?? 1} of {data?.pagination.totalPages ?? 1}</span>
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={!data || page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {selectedId !== null && (
        <OrgRevenueDrawer
          orgId={selectedId}
          currency={currency}
          collapsed={drawerCollapsed}
          onToggleCollapse={() => setDrawerCollapsed((v) => !v)}
          onBack={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
