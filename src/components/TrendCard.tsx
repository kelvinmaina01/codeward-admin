import { useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";
import { ArrowUp01Icon, ArrowDown01Icon } from "hugeicons-react";
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

export default function TrendCard({ metric, range, onRangeChange, data, isLoading, isError, onOpen }: Props) {
  const Icon = metric.icon;

  const { buckets, cur, summary } = useMemo(() => {
    if (!data) return { buckets: [] as string[], cur: [] as number[], summary: null };
    const all = buildBuckets(data.prevStart, data.end, data.bucket);
    const startDay = data.start.slice(0, 10);
    const prevB = all.filter((b) => b < startDay);
    const curB = all.filter((b) => b >= startDay);
    const rows = (data.series[metric.seriesKey] ?? []) as BucketRow[];
    const prev = normalize(rows, prevB);
    const c = normalize(rows, curB);
    return { buckets: curB, cur: c, summary: summarize(c, prev, curB) };
  }, [data, metric.seriesKey]);

  const spark = useMemo(
    () => buckets.map((t, i) => ({ t: shortDate(t), v: cur[i] ?? 0 })),
    [buckets, cur]
  );

  return (
    <Card
      onClick={onOpen}
      className="group cursor-pointer overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", metric.chip)}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold leading-tight">{metric.title}</p>
              <p className="text-[11px] text-muted-foreground">
                {summary ? `${summary.total.toLocaleString()} total` : "—"}
              </p>
            </div>
          </div>
          {summary && (
            <span
              className={cn(
                "flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
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
        </div>

        <div className="mt-2 h-16" onClick={(e) => e.stopPropagation()}>
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
            </div>
          ) : isError ? (
            <div className="flex h-full items-center justify-center text-[11px] text-destructive">
              Failed to load
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {metric.kind === "area" ? (
                <AreaChart data={spark} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`g-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={metric.color} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={metric.color}
                    strokeWidth={2}
                    fill={`url(#g-${metric.key})`}
                    isAnimationActive={false}
                  />
                </AreaChart>
              ) : (
                <BarChart data={spark} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <Bar dataKey="v" fill={metric.color} radius={[2, 2, 0, 0]} isAnimationActive={false} opacity={0.85} />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
          <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
            View details →
          </span>
          <RangeFilter value={range} onChange={onRangeChange} compact />
        </div>
      </CardContent>
    </Card>
  );
}
