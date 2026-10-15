import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Activity, Zap, Building2, TrendingUp, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import RangeFilter from "@/components/RangeFilter";
import TrendCard from "@/components/TrendCard";
import TrendDrawer from "@/components/TrendDrawer";
import DebtLeaders from "@/components/DebtLeaders";
import PlanMix from "@/components/PlanMix";
import {
  TREND_METRICS,
  DEBT_METRIC,
  useTrends,
  type RangeSel,
  type TrendMetric,
} from "@/lib/trends";

type OverviewData = {
  totalUsers: number;
  activeUsers7d: number;
  activeUsers30d: number;
  signupsToday: number;
  totalRepos: number;
  totalRuns: number;
  runsToday: number;
  totalOrgs: number;
  planBreakdown: { plan: string; count: number }[];
  signupTrend: { date: string; count: number }[];
  runStatusBreakdown: { status: string; count: number }[];
};

function StatCard({ title, value, sub, icon: Icon, highlight }: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${highlight ? "text-emerald-500" : ""}`}>{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function TrendCardHost({
  metric,
  range,
  onRangeChange,
  onOpen,
}: {
  metric: TrendMetric;
  range: RangeSel;
  onRangeChange: (r: RangeSel) => void;
  onOpen: () => void;
}) {
  const { data, isLoading, isError } = useTrends(range);
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

export default function OverviewDashboard() {
  const { data, isLoading, isError } = useQuery<OverviewData>({
    queryKey: ["admin-platform-overview"],
    queryFn: () => apiFetch("/overview"),
    staleTime: 60_000,
  });

  // ── Trend ranges: one global default, each card can override ──
  const [globalRange, setGlobalRange] = useState<RangeSel>({ key: "30d" });
  const [overrides, setOverrides] = useState<Record<string, RangeSel>>({});
  const rangeFor = (key: string): RangeSel => overrides[key] ?? globalRange;
  const setRangeFor = (key: string, r: RangeSel) =>
    setOverrides((p) => ({ ...p, [key]: r }));
  const applyGlobal = (r: RangeSel) => {
    setGlobalRange(r);
    setOverrides({});
  };

  // ── Detail drawer ──
  const [openKey, setOpenKey] = useState<string | null>(null);
  const openMetric: TrendMetric | null = useMemo(() => {
    if (!openKey) return null;
    if (openKey === "__debt") return { ...DEBT_METRIC, dimKey: "findingsBySeverity" };
    return TREND_METRICS.find((m) => m.key === openKey) ?? null;
  }, [openKey]);
  const drawerRange = openKey === "__debt" ? globalRange : openKey ? rangeFor(openKey) : globalRange;
  const drawerQuery = useTrends(drawerRange);

  // Shared data for the wide panels (global range)
  const panelsQuery = useTrends(globalRange);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading platform data...</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 text-sm max-w-md text-center">
          Failed to load overview. Make sure the API is running at{" "}
          <code className="font-mono text-xs">{import.meta.env.VITE_API_URL || "http://localhost:3000/api/admin"}</code>
        </div>
      </div>
    );
  }

  const activeRatio =
    data.totalUsers > 0 ? Math.round((data.activeUsers7d / data.totalUsers) * 100) : 0;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Platform Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">Live KPIs across the entire Codeward platform.</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Users" value={data.totalUsers.toLocaleString()} sub={`+${data.signupsToday} today`} icon={Users} />
        <StatCard title="Active (7d)" value={data.activeUsers7d.toLocaleString()} sub={`${activeRatio}% of total`} icon={Activity} />
        <StatCard title="Active (30d)" value={data.activeUsers30d.toLocaleString()} sub="Unique sessions" icon={TrendingUp} />
        <StatCard title="Organizations" value={data.totalOrgs.toLocaleString()} sub="Team accounts" icon={Building2} />
        <StatCard title="Repos Connected" value={data.totalRepos.toLocaleString()} sub="All time" icon={BookOpen} />
        <StatCard title="Runs Today" value={data.runsToday.toLocaleString()} sub={`${data.totalRuns.toLocaleString()} total`} icon={Zap} highlight />
      </div>

      {/* ── Trend tracking ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold tracking-tight">Trend Tracking</h3>
          <p className="text-xs text-muted-foreground">
            Every card filters independently — click any card for full detail, snapshots & insights.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Apply to all:</span>
          <RangeFilter value={globalRange} onChange={applyGlobal} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TREND_METRICS.map((m) => (
          <TrendCardHost
            key={m.key}
            metric={m}
            range={rangeFor(m.key)}
            onRangeChange={(r) => setRangeFor(m.key, r)}
            onOpen={() => setOpenKey(m.key)}
          />
        ))}
      </div>

      {/* ── Debt leaders + plan mix ── */}
      <div className="grid gap-4 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <DebtLeaders
            leaders={panelsQuery.data?.debtLeaders}
            isLoading={panelsQuery.isLoading}
            onOpen={() => setOpenKey("__debt")}
          />
        </div>
        <div className="lg:col-span-3">
          <PlanMix
            range={globalRange}
            onRangeChange={applyGlobal}
            data={panelsQuery.data}
            snapshot={data.planBreakdown}
            isLoading={panelsQuery.isLoading}
          />
        </div>
      </div>

      {/* ── Detail drawer ── */}
      <TrendDrawer
        metric={openMetric}
        data={drawerQuery.data}
        isLoading={drawerQuery.isLoading}
        onClose={() => setOpenKey(null)}
      />
    </div>
  );
}
