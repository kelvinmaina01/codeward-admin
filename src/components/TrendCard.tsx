import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ArrowUp01Icon, ArrowDown01Icon } from "hugeicons-react";
import { AreaChart as AreaIcon, LineChart as LineIcon, BarChart2 as BarIcon, PieChart as PieIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import RangeFilter from "./RangeFilter";
import {
  buildBuckets,
  normalize,
  summarize,
  fmtPct,
  deltaTone,
  shortDate,
  type TrendMetric,
  type RangeSel,
  type TrendsResponse,
  type BucketRow,
  type DimRow,
} from "../lib/trends";
import { cn } from "../lib/utils";

interface Props {
  metric: TrendMetric;
  range: RangeSel;
  onRangeChange: (r: RangeSel) => void;
  data?: TrendsResponse;
  isLoading: boolean;
  isError: boolean;
  onOpen: () => void;
}

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4", "#ec4899", "#d946ef"];

export default function TrendCard({
  metric,
  range,
  onRangeChange,
  data,
  isLoading,
  isError,
  onOpen,
}: Props) {
  const Icon = metric.icon;
  const [chartType, setChartType] = useState<"area" | "line" | "bar" | "pie">(metric.kind || "area");

  const { buckets, cur, summary, dimData } = useMemo(() => {
    if (!data) return { buckets: [] as string[], cur: [] as number[], summary: null, dimData: [] };
    const all = buildBuckets(data.prevStart, data.end, data.bucket);
    const startDay = data.start.slice(0, 10);
    const prevB = all.filter((b) => b < startDay);
    const curB = all.filter((b) => b >= startDay);
    const rows = (data.series[metric.seriesKey] ?? []) as BucketRow[];
    const prev = normalize(rows, prevB);
    const c = normalize(rows, curB);

    // Dimension breakdown if dimKey is present
    let dimDistribution: { name: string; value: number }[] = [];
    if (metric.dimKey && data.series[metric.dimKey]) {
      const dimRows = (data.series[metric.dimKey] as DimRow[]).filter((r) => r.t >= startDay);
      const map = new Map<string, number>();
      dimRows.forEach((r) => {
        const dimName = r.dim || "other";
        map.set(dimName, (map.get(dimName) || 0) + (Number(r.c) || 0));
      });
      dimDistribution = Array.from(map.entries())
        .map(([name, value]) => ({ name, value }))
        .filter((d) => d.value > 0);
    }

    return {
      buckets: curB,
      cur: c,
      summary: summarize(c, prev, curB),
      dimData: dimDistribution,
    };
  }, [data, metric.seriesKey, metric.dimKey]);

  const spark = useMemo(
    () => buckets.map((t, i) => ({ t: shortDate(t), fullDate: t, v: cur[i] ?? 0 })),
    [buckets, cur]
  );

  const hasPie = dimData.length > 0;

  return (
    <Card
      onClick={onOpen}
      className="group cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-border/70 bg-card"
    >
      <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
        {/* Header: Title, Metric details, Delta badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", metric.chip)}>
              <Icon className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground leading-tight">{metric.title}</p>
              {summary ? (
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-bold text-foreground">
                    {summary.total.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-muted-foreground">total</span>
                  <span className="text-muted-foreground/30 text-xs">•</span>
                  {summary.todayCount > 0 ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                        metric.invertDelta
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      )}
                    >
                      +{summary.todayCount} today
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium border",
                        metric.invertDelta
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border/40"
                      )}
                    >
                      0 today
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">—</p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {summary && (
              <span
                className={cn(
                  "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                  deltaTone(summary.deltaPct, metric.invertDelta)
                )}
                title={`Previous window: ${summary.prevTotal.toLocaleString()}`}
              >
                {summary.deltaPct !== null && Math.abs(summary.deltaPct) >= 0.05 &&
                  (summary.deltaPct > 0 ? (
                    <ArrowUp01Icon className="h-3 w-3" />
                  ) : (
                    <ArrowDown01Icon className="h-3 w-3" />
                  ))}
                {fmtPct(summary.deltaPct)}
              </span>
            )}

            {/* Quick Chart Type Switcher */}
            <div
              className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-muted/40 p-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setChartType("area")}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md text-xs transition-all cursor-pointer",
                  chartType === "area"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Area Chart"
              >
                <AreaIcon className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setChartType("line")}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md text-xs transition-all cursor-pointer",
                  chartType === "line"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Line Chart"
              >
                <LineIcon className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setChartType("bar")}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md text-xs transition-all cursor-pointer",
                  chartType === "bar"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Bar Chart"
              >
                <BarIcon className="h-3 w-3" />
              </button>
              {hasPie && (
                <button
                  type="button"
                  onClick={() => setChartType("pie")}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-md text-xs transition-all cursor-pointer",
                    chartType === "pie"
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Distribution Breakdown"
                >
                  <PieIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Chart View (spacious h-44 with interactive hover tooltip) */}
        <div className="mt-4 h-44 w-full" onClick={(e) => e.stopPropagation()}>
          {isLoading ? (
            <div className="flex h-full items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
              <span>Loading trend...</span>
            </div>
          ) : isError ? (
            <div className="flex h-full items-center justify-center text-xs text-destructive">
              Failed to load trend
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "area" ? (
                <AreaChart data={spark} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`g-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={metric.color} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={metric.color} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-border/80 bg-popover/95 p-2 shadow-md backdrop-blur-xs text-xs pointer-events-none">
                          <p className="text-[11px] font-medium text-muted-foreground">{d.fullDate || d.t}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: metric.color }} />
                            <span className="font-bold text-foreground">{d.v.toLocaleString()}</span>
                            <span className="text-muted-foreground text-[11px]">{metric.title}</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={metric.color}
                    strokeWidth={2}
                    fill={`url(#g-${metric.key})`}
                    isAnimationActive={false}
                  />
                </AreaChart>
              ) : chartType === "line" ? (
                <LineChart data={spark} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-border/80 bg-popover/95 p-2 shadow-md backdrop-blur-xs text-xs pointer-events-none">
                          <p className="text-[11px] font-medium text-muted-foreground">{d.fullDate || d.t}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: metric.color }} />
                            <span className="font-bold text-foreground">{d.v.toLocaleString()}</span>
                            <span className="text-muted-foreground text-[11px]">{metric.title}</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={metric.color}
                    strokeWidth={2.5}
                    dot={{ r: 2, fill: metric.color }}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                    isAnimationActive={false}
                  />
                </LineChart>
              ) : chartType === "bar" ? (
                <BarChart data={spark} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-border/80 bg-popover/95 p-2 shadow-md backdrop-blur-xs text-xs pointer-events-none">
                          <p className="text-[11px] font-medium text-muted-foreground">{d.fullDate || d.t}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: metric.color }} />
                            <span className="font-bold text-foreground">{d.v.toLocaleString()}</span>
                            <span className="text-muted-foreground text-[11px]">{metric.title}</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="v"
                    fill={metric.color}
                    radius={[3, 3, 0, 0]}
                    isAnimationActive={false}
                    opacity={0.85}
                  />
                </BarChart>
              ) : (
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0];
                      return (
                        <div className="rounded-lg border border-border/80 bg-popover/95 p-2 shadow-md backdrop-blur-xs text-xs pointer-events-none">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.payload.fill }} />
                            <span className="font-semibold text-foreground capitalize">{d.name}:</span>
                            <span className="font-bold text-foreground">{Number(d.value).toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Pie
                    data={dimData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={48}
                    paddingAngle={3}
                  >
                    {dimData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Footer: Details link + Range selector */}
        <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
            <span>View details & insights</span>
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
          <RangeFilter value={range} onChange={onRangeChange} compact />
        </div>
      </CardContent>
    </Card>
  );
}
