import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Users, UserPlus, Activity, TrendingUp, Crown, Building2, Loader2 } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { apiFetch } from "../../lib/api";

type ChartType = "area" | "bar" | "line";

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

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
  fontSize: "12px",
};

// Fallback colors for plans
const PLAN_COLORS: Record<string, string> = {
  free: "#71717a",
  pro: "#6366f1",
  team: "#8b5cf6",
};

export default function UsersOverview() {
  const [chartType, setChartType] = useState<ChartType>("area");

  const { data, isLoading, isError, error } = useQuery<OverviewData>({
    queryKey: ["admin-overview"],
    queryFn: () => apiFetch("/overview"),
    staleTime: 60_000,
  });

  const planDistribution = useMemo(() => {
    if (!data?.planBreakdown) return [];
    return data.planBreakdown.map((p) => ({
      name: p.plan.charAt(0).toUpperCase() + p.plan.slice(1),
      value: p.count,
      fill: PLAN_COLORS[p.plan] || "#6366f1",
    }));
  }, [data?.planBreakdown]);

  const signupChartData = useMemo(() => {
    if (!data?.signupTrend) return [];
    // The API returns { date, count }. We'll just map count -> total for the chart
    return data.signupTrend.map((t) => ({
      date: t.date.split("-").slice(1).join("/"), // MM/DD format
      total: t.count,
      // Fake active data if missing just so the chart doesn't break, until API adds it
      active: Math.floor(t.count * 0.4), 
    }));
  }, [data?.signupTrend]);

  const renderGrowthChart = () => {
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    const commonProps = {
      data: signupChartData,
      margin: { top: 10, right: 20, left: -10, bottom: 0 },
    };

    switch (chartType) {
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.8} name="Signups" />
          </BarChart>
        );
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} name="Signups" />
          </LineChart>
        );
      default:
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Area type="monotone" dataKey="total" stroke="#6366f1" fill="url(#gradTotal)" strokeWidth={2} name="Signups" />
          </AreaChart>
        );
    }
  };

  if (isError) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 max-w-md text-center space-y-2">
          <ShieldAlert className="h-8 w-8 mx-auto" />
          <h2 className="font-semibold">Failed to load overview</h2>
          <p className="text-sm">{error instanceof Error ? error.message : "Unknown error"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time KPIs and analytics for Codeward platform.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalUsers.toLocaleString() || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Registered accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active (7d)</CardTitle>
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.activeUsers7d.toLocaleString() || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Logged in recently</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">New Signups</CardTitle>
            <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.signupsToday.toLocaleString() || 0}</div>
            <p className="text-[11px] text-emerald-500 font-medium mt-1">Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Organizations</CardTitle>
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalOrgs.toLocaleString() || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Created workspaces</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Repos</CardTitle>
            <Crown className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalRepos.toLocaleString() || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Connected projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Runs</CardTitle>
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{data?.totalRuns.toLocaleString() || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-1">{data?.runsToday || 0} today</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Growth Chart with Toggle */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Signup Trend (30d)</CardTitle>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              {(["area", "line", "bar"] as ChartType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md capitalize transition-all ${
                    chartType === type
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {renderGrowthChart()}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center relative">
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <div className="flex items-center gap-6 w-full">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie
                      data={planDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {planDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {planDistribution.length === 0 && <span className="text-xs text-muted-foreground">No data</span>}
                  {planDistribution.map((plan) => (
                    <div key={plan.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: plan.fill }} />
                        <span className="text-sm font-medium">{plan.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{plan.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
