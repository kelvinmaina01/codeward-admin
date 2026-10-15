import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RangeFilter from "@/components/RangeFilter";
import { useRevenueOrgs, fmtMoney, type RevenueOrg } from "@/lib/revenue";
import type { RangeSel } from "@/lib/trends";

function rangeStart(r: RangeSel): Date {
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (r.key === "custom") return r.from ? new Date(`${r.from}T00:00:00.000Z`) : new Date(today);
  const days = { "7d": 7, "14d": 14, "30d": 30, "90d": 90, "180d": 180 }[r.key];
  return new Date(today - (days - 1) * 86400000);
}

function MiniTable({ rows, empty, value }: {
  rows: RevenueOrg[];
  empty: string;
  value: (o: RevenueOrg) => string;
}) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="space-y-1.5">
      {rows.map((o, i) => (
        <div key={o.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-muted/50">
          <span className="w-5 text-center text-xs font-bold text-muted-foreground">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{o.githubLogin}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {o.owner ? o.owner.email : `${o.memberCount} member(s)`} · <span className="capitalize">{o.planType}</span>
            </p>
          </div>
          <span className="shrink-0 font-bold tabular-nums">{value(o)}</span>
        </div>
      ))}
    </div>
  );
}

export default function Subscribers() {
  const [range, setRange] = useState<RangeSel>({ key: "30d" });
  const { data, isLoading, isError } = useRevenueOrgs({ limit: 200, page: 1 });
  const currency = data?.currency ?? "USD";

  const { fresh, returning, bestLifetime, bestMrr } = useMemo(() => {
    const orgs = data?.orgs ?? [];
    const start = rangeStart(range);
    const fresh = orgs
      .filter((o) => o.currentPeriodStart && new Date(o.currentPeriodStart) >= start && o.polarSubscriptionId)
      .sort((a, b) => +new Date(b.currentPeriodStart!) - +new Date(a.currentPeriodStart!));
    const returning = orgs.filter((o) => o.isReturning);
    const bestLifetime = [...orgs].sort((a, b) => b.lifetimeCents - a.lifetimeCents).slice(0, 10);
    const bestMrr = [...orgs].filter((o) => o.mrrCents > 0).sort((a, b) => b.mrrCents - a.mrrCents).slice(0, 10);
    return { fresh, returning, bestLifetime, bestMrr };
  }, [data, range]);

  return (
    <div className="flex-1 space-y-5 overflow-auto p-8 pt-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Subscribers</h2>
          <p className="mt-1 text-sm text-muted-foreground">New, returning and best customers for the selected window.</p>
        </div>
        <RangeFilter value={range} onChange={setRange} />
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load subscribers. This page needs the latest API deploy (revenue endpoints).
        </div>
      )}
      {isLoading && (
        <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading subscribers…
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">New Subscribers ({fresh.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <MiniTable
                rows={fresh}
                empty="No new subscriptions in this window."
                value={(o) => (o.currentPeriodStart ? new Date(o.currentPeriodStart).toLocaleDateString() : "—")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Returning Subscribers ({returning.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <MiniTable
                rows={returning}
                empty="No reactivations on record — history builds as webhooks record."
                value={(o) => fmtMoney(o.lifetimeCents, currency)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Best by Lifetime Value</CardTitle>
            </CardHeader>
            <CardContent>
              <MiniTable
                rows={bestLifetime.filter((o) => o.lifetimeCents > 0)}
                empty="No payment history yet — run the backfill script."
                value={(o) => fmtMoney(o.lifetimeCents, currency)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Best by MRR</CardTitle>
            </CardHeader>
            <CardContent>
              <MiniTable
                rows={bestMrr}
                empty="No active MRR."
                value={(o) => `${fmtMoney(o.mrrCents, currency)}/mo`}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
