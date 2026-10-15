import { useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Cancel01Icon, SparklesIcon, EyeIcon } from "hugeicons-react";
import {
  buildBuckets,
  normalize,
  summarize,
  fmtPct,
  deltaTone,
  shortDate,
  type TrendMetric,
  type TrendsResponse,
  type BucketRow,
  type DimRow,
} from "../lib/trends";
import { cn } from "../lib/utils";

interface Props {
  metric: TrendMetric | null;
  data?: TrendsResponse;
  isLoading: boolean;
  onClose: () => void;
}

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
} as const;

const DIM_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#0ea5e9", "#8b5cf6", "#64748b"];

export default function TrendDrawer({ metric, data, isLoading, onClose }: Props) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const model = useMemo(() => {
    if (!metric || !data) return null;
    const all = buildBuckets(data.prevStart, data.end, data.bucket);
    const startDay = data.start.slice(0, 10);
    const prevB = all.filter((b) => b < startDay);
    const curB = all.filter((b) => b >= startDay);
    const rows = (data.series[metric.seriesKey] ?? []) as BucketRow[];
    const cur = normalize(rows, curB);
    const prev = normalize(rows, prevB);
    const summary = summarize(cur, prev, curB);

    // Dimension breakdown over the current window
    let dims: { dim: string; total: number; share: number }[] = [];
    let stacked: Record<string, string | number>[] = [];
    if (metric.dimKey) {
      const drows = (data.series[metric.dimKey] ?? []) as DimRow[];
      const byDim = new Map<string, number>();
      drows.forEach((r) => {
        if (r.t >= data.start && r.t < data.end) {
          const k = r.dim ?? "unknown";
          byDim.set(k, (byDim.get(k) ?? 0) + (Number(r.c) || 0));
        }
      });
      const grand = [...byDim.values()].reduce((a, b) => a + b, 0) || 1;
      dims = [...byDim.entries()]
        .map(([dim, total]) => ({ dim, total, share: (total / grand) * 100 }))
        .sort((a, b) => b.total - a.total);
      const top = dims.slice(0, 4).map((d) => d.dim);
      const perBucket = new Map<string, Map<string, number>>();
      drows.forEach((r) => {
        if (r.t >= data.start && r.t < data.end) {
          if (!perBucket.has(r.t)) perBucket.set(r.t, new Map());
          const k = top.includes(r.dim ?? "") ? (r.dim as string) : "other";
          const m = perBucket.get(r.t)!;
          m.set(k, (m.get(k) ?? 0) + (Number(r.c) || 0));
        }
      });
      stacked = curB.map((b, i) => {
        const m = perBucket.get(b) ?? new Map();
        const row: Record<string, string | number> = { t: shortDate(b), total: cur[i] };
        [...top, "other"].forEach((k) => {
          row[k] = m.get(k) ?? 0;
        });
        return row;
      });
    }

    const chart = curB.map((b, i) => ({ t: shortDate(b), full: b, v: cur[i] }));

    // Auto insights
    const insights: string[] = [];
    if (summary.deltaPct !== null) {
      const dir = summary.deltaPct > 0.5 ? "up" : summary.deltaPct < -0.5 ? "down" : "flat";
      insights.push(
        dir === "flat"
          ? `Volume is flat vs the previous window (${summary.prevTotal.toLocaleString()} → ${summary.total.toLocaleString()}).`
          : `Volume is ${dir} ${fmtPct(summary.deltaPct)} vs the previous window (${summary.prevTotal.toLocaleString()} → ${summary.total.toLocaleString()}).`
      );
    }
    if (summary.peakDay) {
      insights.push(`Peak ${data.bucket === "week" ? "week" : "day"} was ${shortDate(summary.peakDay)} with ${summary.peak.toLocaleString()} events.`);
    }
    const coverage = curB.length ? Math.round((summary.activeDays / curB.length) * 100) : 0;
    insights.push(
      coverage >= 80
        ? `Consistent activity on ${summary.activeDays}/${curB.length} ${data.bucket === "week" ? "weeks" : "days"} (${coverage}%) — a healthy always-on signal.`
        : `Sporadic activity on only ${summary.activeDays}/${curB.length} ${data.bucket === "week" ? "weeks" : "days"} (${coverage}%) — growth is event-driven, not habitual.`
    );
    // trailing streak
    let streak = 0;
    for (let i = cur.length - 1; i >= 0 && cur[i] > 0; i--) streak += 1;
    if (streak >= 3) insights.push(`Active streak: ${streak} consecutive ${data.bucket === "week" ? "weeks" : "days"} and counting.`);
    else if (cur.length > 0 && cur[cur.length - 1] === 0)
      insights.push(`No activity in the most recent ${data.bucket === "week" ? "week" : "day"} — worth a check, not yet a trend.`);
    if (dims.length > 0) {
      insights.push(`Top segment: "${dims[0].dim}" drives ${dims[0].share.toFixed(0)}% of volume in this window.`);
    }

    return { curB, cur, prev, summary, dims, stacked, chart, insights };
  }, [metric, data]);

  return (
    <div className={cn("fixed inset-0 z-50", !metric && "pointer-events-none")}>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity",
          metric ? "opacity-100" : "opacity-0"
        )}
      />
      {/* Panel */}
      <aside
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col bg-card shadow-2xl transition-transform duration-300",
          metric ? "translate-x-0" : "translate-x-full"
        )}
      >
        {metric && (
          <>
            <div className="flex items-start gap-3 border-b border-border/60 p-5">
              <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", metric.chip)}>
                <metric.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold tracking-tight">{metric.title}</h2>
                <p className="text-[13px] text-muted-foreground">{metric.description}</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted cursor-pointer"
                title="Close"
              >
                <Cancel01Icon className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {isLoading || !model ? (
                <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
                  Loading detail…
                </div>
              ) : (
                <>
                  {/* KPI tiles */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Total in window", value: model.summary.total.toLocaleString() },
                      { label: `Avg / ${data?.bucket ?? "day"}`, value: model.summary.avg.toFixed(1) },
                      { label: `Peak (${shortDate(model.summary.peakDay)})`, value: model.summary.peak.toLocaleString() },
                      { label: "Prev window", value: model.summary.prevTotal.toLocaleString() },
                    ].map((k) => (
                      <div key={k.label} className="rounded-xl border bg-background p-3">
                        <p className="text-[11px] text-muted-foreground">{k.label}</p>
                        <p className="text-xl font-bold">{k.value}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", deltaTone(model.summary.deltaPct, metric.invertDelta))}>
                      {fmtPct(model.summary.deltaPct)} vs previous window
                    </span>
                  </div>

                  {/* Main chart */}
                  <div>
                    <p className="mb-2 text-[13px] font-semibold">Flow & comparison</p>
                    <div className="h-56 rounded-xl border bg-background p-2">
                      <ResponsiveContainer width="100%" height="100%">
                        {model.dims.length > 0 ? (
                          <BarChart data={model.stacked} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="t" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            {[...new Set(model.stacked.flatMap((r) => Object.keys(r)).filter((k) => k !== "t" && k !== "total"))].map((k, i) => (
                              <Bar key={k} dataKey={k} stackId="a" fill={DIM_COLORS[i % DIM_COLORS.length]} radius={i === 0 ? [0, 0, 0, 0] : [0, 0, 0, 0]} opacity={0.9} />
                            ))}
                          </BarChart>
                        ) : (
                          <AreaChart data={model.chart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                            <defs>
                              <linearGradient id={`d-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={metric.color} stopOpacity={0.35} />
                                <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="t" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                            <Area type="monotone" dataKey="v" stroke={metric.color} strokeWidth={2} fill={`url(#d-${metric.key})`} />
                          </AreaChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Segment breakdown */}
                  {model.dims.length > 0 && (
                    <div>
                      <p className="mb-2 text-[13px] font-semibold">Segment snapshot</p>
                      <div className="space-y-1.5">
                        {model.dims.slice(0, 6).map((d) => (
                          <div key={d.dim} className="flex items-center gap-2 text-[13px]">
                            <span className="w-28 shrink-0 truncate font-medium">{d.dim}</span>
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full" style={{ width: `${d.share}%`, background: metric.color }} />
                            </div>
                            <span className="w-14 shrink-0 text-right tabular-nums text-muted-foreground">
                              {d.total.toLocaleString()}
                            </span>
                            <span className="w-11 shrink-0 text-right tabular-nums text-muted-foreground">
                              {d.share.toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Insights */}
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold">
                      <SparklesIcon className="h-4 w-4" />
                      Detailed insights
                    </p>
                    <ul className="space-y-1.5 text-[13px] leading-snug text-muted-foreground">
                      {model.insights.map((ins, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" />
                          <span className="text-foreground/90">{ins}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* What it means */}
                  <div className="rounded-xl border bg-background p-4">
                    <p className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold">
                      <EyeIcon className="h-4 w-4" />
                      How to read this
                    </p>
                    <p className="text-[13px] leading-snug text-muted-foreground">{metric.whatItMeans}</p>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
