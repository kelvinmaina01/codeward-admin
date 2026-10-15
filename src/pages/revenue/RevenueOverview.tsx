import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dollar01Icon, Wallet01Icon, UserAdd01Icon, ChartUpIcon } from "hugeicons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RangeFilter from "@/components/RangeFilter";
import TrendCard from "@/components/TrendCard";
import TrendDrawer from "@/components/TrendDrawer";
import {
  useRevenueOverview,
  useRevenueSeries,
  useRevenueOrgs,
  fmtMoney,
  REVENUE_TREND_METRICS,
} from "@/lib/revenue";
import { deltaTone, fmtPct, type RangeSel, type TrendMetric } from "@/lib/trends";
import { cn } from "@/lib/utils";

function pctChange(cur: number, prev: number): number | null {
  if (prev === 0) return cur > 0 ? 100 : null;
  return ((cur - prev) / prev) * 100;
}

function StatTile({
  label, value, sub, delta, invert, onClick,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number | null;
  invert?: boolean;
  onClick?: () => void;
}) {
  return (
    <Card onClick={onClick} className={cn(onClick && "cursor-pointer hover:shadow-md transition-shadow")}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <div className="mt-1 flex items-center gap-2">
          {delta !== undefined && (
            <span className={cn("rounded-full px-1.5 py-0.5 text-[11px] font-semibold", deltaTone(delta, invert))}>
              {fmtPct(delta)}
            </span>
          )}
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function RevenueTrendHost({
  metric, range, onRangeChange, onOpen,
}: {
  metric: TrendMetric;
  range: RangeSel;
  onRangeChange: (r: RangeSel) => void;
  onOpen: () => void;
}) {
  const { data, isLoading, isError } = useRevenueSeries(range);
  return (
    <TrendCard
      metric={metric}
      range={range}
      onRangeChange={onRangeChange}
      data={data}
      isLoading={isLoading}
      isError={isError}
      onOpen={onOpen}
    />
  );
}

export default function RevenueOverview() {
  const [globalRange, setGlobalRange] = useState<RangeSel>({ key: "30d" });
  const [overrides, setOverrides] = useState<Record<string, RangeSel>>({});
  const rangeFor = (k: string): RangeSel => overrides[k] ?? globalRange;
  const setRangeFor = (k: string, r: RangeSel) => setOverrides((p) => ({ ...p, [k]: r }));
  const applyGlobal = (r: RangeSel) => {
    setGlobalRange(r);
    setOverrides({});
  };

  const { data, isLoading, isError } = useRevenueOverview(globalRange);
  const distQuery = useRevenueOrgs({ limit: 100, page: 1 });

  const [openKey, setOpenKey] = useState<string | null>(null);
  const openMetric = useMemo(
    () => REVENUE_TREND_METRICS.find((m) => m.key === openKey) ?? null,
    [openKey]
  );
  const drawerQuery = useRevenueSeries(openKey ? rangeFor(openKey) : globalRange);

  const dist = useMemo(() => {
    const orgs = distQuery.data?.orgs ?? [];
    const paid = orgs.filter((o) => o.lifetimeCents > 0);
    const buckets = [
      { label: "< $50", test: (v: number) => v < 5000 },
      { label: "$50–200", test: (v: number) => v >= 5000 && v < 20000 },
      { label: "$200–1k", test: (v: number) => v >= 20000 && v < 100000 },
      { label: "$1k+", test: (v: number) => v >= 100000 },
    ].map((b) => ({ ...b, count: 0, cents: 0 }));
    paid.forEach((o) => {
      const b = buckets.find((x) => x.test(o.lifetimeCents));
      if (b) {
        b.count += 1;
        b.cents += o.lifetimeCents;
      }
    });
    const sorted = [...orgs].sort((a, b) => b.lifetimeCents - a.lifetimeCents);
    const top = sorted.slice(0, 10);
    const totalLifetime = orgs.reduce((s, o) => s + o.lifetimeCents, 0) || 1;
    const topDecile = sorted.slice(0, Math.max(1, Math.ceil(sorted.length * 0.1)));
    const decileShare = topDecile.reduce((s, o) => s + o.lifetimeCents, 0) / totalLifetime;
    return { buckets, top, decileShare, count: orgs.length };
  }, [distQuery.data]);

  const maxBucket = Math.max(1, ...dist.buckets.map((b) => b.count));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading revenue data…</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 text-sm max-w-md text-center">
          Failed to load revenue. This section needs the latest API deploy (revenue endpoints).
        </div>
      </div>
    );
  }

  const plans = Object.entries(data.byPlan);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Revenue Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            MRR, payers and subscriptions — {data.pricesLive ? "live Polar prices" : "prices unavailable, counts only"}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Apply to all:</span>
          <RangeFilter value={globalRange} onChange={applyGlobal} />
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile label="MRR" value={fmtMoney(data.mrrCents, data.currency)} sub={`${data.payingOrgs} paying orgs`} />
        <StatTile label="ARR" value={fmtMoney(data.arrCents, data.currency)} sub="MRR × 12" />
        <StatTile
          label="New Subscribers"
          value={data.newSubs.toLocaleString()}
          delta={pctChange(data.newSubs, data.prevNewSubs)}
          sub="in window"
          onClick={() => setOpenKey("newSubs")}
        />
        <StatTile
          label="Returning"
          value={data.returningSubs.toLocaleString()}
          delta={pctChange(data.returningSubs, data.prevReturningSubs)}
          sub="reactivated"
        />
        <StatTile
          label="Failed Payments"
          value={data.failedPayments.toLocaleString()}
          delta={pctChange(data.failedPayments, data.prevFailedPayments)}
          invert
          sub="skipped / past-due"
          onClick={() => setOpenKey("failed")}
        />
        <StatTile label="Churned (ever)" value={data.churnedOrgs.toLocaleString()} sub="canceled, no live sub" />
      </div>

      {/* Trend cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REVENUE_TREND_METRICS.map((m) => (
          <RevenueTrendHost
            key={m.key}
            metric={m}
            range={rangeFor(m.key)}
            onRangeChange={(r) => setRangeFor(m.key, r)}
            onOpen={() => setOpenKey(m.key)}
          />
        ))}
      </div>

      {/* Distribution + plan split */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Wallet01Icon className="h-4 w-4" />
              </span>
              <div>
                <CardTitle className="text-sm">Revenue per Customer</CardTitle>
                <p className="text-[11px] text-muted-foreground">
                  Lifetime value spread · top 10% hold {(dist.decileShare * 100).toFixed(0)}% of tracked revenue
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dist.buckets.map((b) => (
                <div key={b.label} className="flex items-center gap-2 text-[13px]">
                  <span className="w-20 shrink-0 font-medium">{b.label}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${Math.max(3, (b.count / maxBucket) * 100)}%` }} />
                  </div>
                  <span className="w-16 shrink-0 text-right tabular-nums text-muted-foreground">{b.count} orgs</span>
                  <span className="w-20 shrink-0 text-right tabular-nums">{fmtMoney(b.cents, data.currency)}</span>
                </div>
              ))}
            </div>
            {dist.top.length > 0 && (
              <div className="mt-4 border-t border-border/60 pt-3">
                <p className="mb-2 text-[13px] font-semibold">Top payers</p>
                <div className="space-y-1.5">
                  {dist.top.slice(0, 5).map((o, i) => (
                    <div key={o.id} className="flex items-center gap-2 text-[13px]">
                      <span className="w-5 text-center text-xs font-bold text-muted-foreground">{i + 1}</span>
                      <span className="flex-1 truncate font-medium">{o.githubLogin}</span>
                      <span className="text-xs capitalize text-muted-foreground">{o.planType}</span>
                      <span className="w-24 text-right font-bold tabular-nums">{fmtMoney(o.lifetimeCents, data.currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {dist.count === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No payment history yet — run the backfill script, then new charges stream in automatically.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <ChartUpIcon className="h-4 w-4" />
              </span>
              <div>
                <CardTitle className="text-sm">Revenue by Plan</CardTitle>
                <p className="text-[11px] text-muted-foreground">Live MRR split · collected {fmtMoney(data.collectedCents, data.currency)} in window</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {plans.length === 0 && <p className="text-sm text-muted-foreground">No paying orgs.</p>}
            {plans.map(([plan, v]) => {
              const share = data.mrrCents ? (v.mrrCents / data.mrrCents) * 100 : 0;
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-semibold capitalize">{plan} <span className="font-normal text-muted-foreground">· {v.orgs} orgs</span></span>
                    <span className="font-bold tabular-nums">{fmtMoney(v.mrrCents, data.currency)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${share}%` }} />
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{share.toFixed(0)}% of MRR</p>
                </div>
              );
            })}
            <div className="rounded-lg border bg-background p-3 text-[13px]">
              <p className="flex items-center gap-1.5 font-semibold"><Dollar01Icon className="h-4 w-4" /> Collected in window</p>
              <p className="mt-0.5 text-xl font-bold tabular-nums">{fmtMoney(data.collectedCents, data.currency)}</p>
              {data.refundedCents > 0 && (
                <p className="text-xs text-muted-foreground">Refunded: {fmtMoney(data.refundedCents, data.currency)}</p>
              )}
            </div>
            {data.unpricedOrgs > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <UserAdd01Icon className="h-3.5 w-3.5" />
                {data.unpricedOrgs} paying org(s) on unknown plans — excluded from MRR.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <TrendDrawer
        metric={openMetric}
        data={drawerQuery.data}
        isLoading={drawerQuery.isLoading}
        onClose={() => setOpenKey(null)}
      />
    </div>
  );
}
