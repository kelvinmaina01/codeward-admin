import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import RangeFilter from "./RangeFilter";
import { PLAN_MIX_METRIC, buildBuckets, shortDate, type RangeSel, type TrendsResponse, type DimRow } from "../lib/trends";

const PLAN_COLORS: Record<string, string> = {
  pro: "#6366f1",
  team: "#8b5cf6",
  free: "#94a3b8",
};

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
} as const;

export default function PlanMix({
  range,
  onRangeChange,
  data,
  snapshot,
  isLoading,
}: {
  range: RangeSel;
  onRangeChange: (r: RangeSel) => void;
  data?: TrendsResponse;
  snapshot: { plan: string; count: number }[];
  isLoading: boolean;
}) {
  const { chart, plans, totals } = useMemo(() => {
    if (!data) return { chart: [], plans: [] as string[], totals: {} as Record<string, number> };
    const all = buildBuckets(data.prevStart, data.end, data.bucket);
    const startDay = data.start.slice(0, 10);
    const curB = all.filter((b) => b >= startDay);
    const rows = (data.series["orgsByPlan"] ?? []) as DimRow[];
    const planSet = new Set<string>();
    const perBucket = new Map<string, Map<string, number>>();
    const totalsMap: Record<string, number> = {};
    rows.forEach((r) => {
      if (r.t >= data.start && r.t < data.end) {
        const k = (r.dim ?? "unknown").toLowerCase();
        planSet.add(k);
        if (!perBucket.has(r.t)) perBucket.set(r.t, new Map());
        const m = perBucket.get(r.t)!;
        m.set(k, (m.get(k) ?? 0) + (Number(r.c) || 0));
        totalsMap[k] = (totalsMap[k] ?? 0) + (Number(r.c) || 0);
      }
    });
    const planList = [...planSet].sort();
    return {
      plans: planList,
      totals: totalsMap,
      chart: curB.map((b) => {
        const m = perBucket.get(b) ?? new Map();
        const row: Record<string, string | number> = { t: shortDate(b) };
        planList.forEach((p) => {
          row[p] = m.get(p) ?? 0;
        });
        return row;
      }),
    };
  }, [data]);

  const grand = snapshot.reduce((s, p) => s + p.count, 0) || 1;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <PLAN_MIX_METRIC.icon className="h-4 w-4" />
          </span>
          <div>
            <CardTitle className="text-sm">Plan Distribution</CardTitle>
            <p className="text-[11px] text-muted-foreground">Snapshot + new orgs by plan in range</p>
          </div>
        </div>
        <RangeFilter value={range} onChange={onRangeChange} compact />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-6 flex-wrap">
              {snapshot.length === 0 && <span className="text-sm text-muted-foreground">No plan data.</span>}
              {snapshot.map((p) => {
                const pct = Math.round((p.count / grand) * 100);
                const inRange = totals[p.plan.toLowerCase()] ?? 0;
                return (
                  <div key={p.plan} className="flex flex-col gap-0.5">
                    <div className="text-2xl font-bold tabular-nums">{p.count.toLocaleString()}</div>
                    <div className="text-xs capitalize text-muted-foreground">{p.plan}</div>
                    <div className="text-[11px] font-medium text-primary">{pct}% · +{inRange} in range</div>
                  </div>
                );
              })}
            </div>
            {chart.length > 0 && plans.length > 0 && (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="t" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {plans.map((p) => (
                      <Bar key={p} dataKey={p} stackId="a" fill={PLAN_COLORS[p] ?? "#64748b"} opacity={0.9} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
