import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Activity, Zap, Building2, TrendingUp, Loader2 } from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
} from 'recharts';
import { apiFetch } from '@/lib/api';

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
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--foreground))',
  fontSize: '12px',
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
        <div className={`text-2xl font-bold ${highlight ? 'text-emerald-500' : ''}`}>{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function OverviewDashboard() {
  const { data, isLoading, isError } = useQuery<OverviewData>({
    queryKey: ['admin-platform-overview'],
    queryFn: () => apiFetch('/overview'),
    staleTime: 60_000, // re-fetch every 60s max
  });

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
          Failed to load overview. Make sure the API is running at{' '}
          <code className="font-mono text-xs">{import.meta.env.VITE_API_URL || 'http://localhost:3000/api/admin'}</code>
        </div>
      </div>
    );
  }

  const signupChartData = data.signupTrend.map((t) => ({
    date: t.date.split('-').slice(1).join('/'),
    signups: t.count,
  }));

  const activeRatio = data.totalUsers > 0
    ? Math.round((data.activeUsers7d / data.totalUsers) * 100)
    : 0;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
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

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Signup Trend */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-sm">Signup Trend (30d)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signupChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="signups" stroke="#6366f1" fill="url(#gradSignups)" strokeWidth={2} name="Signups" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Run Status Breakdown */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-sm">Run Status (30d)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.runStatusBreakdown.map(r => ({ status: r.status, count: r.count }))}
                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="status" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} opacity={0.85} name="Runs" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Plan Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Plan Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8 flex-wrap">
            {data.planBreakdown.length === 0 && (
              <span className="text-sm text-muted-foreground">No plan data available.</span>
            )}
            {data.planBreakdown.map((p) => {
              const total = data.planBreakdown.reduce((s, x) => s + x.count, 0);
              const pct = total > 0 ? Math.round((p.count / total) * 100) : 0;
              return (
                <div key={p.plan} className="flex flex-col items-center gap-1 min-w-[80px]">
                  <div className="text-2xl font-bold">{p.count.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground capitalize">{p.plan}</div>
                  <div className="text-[11px] text-primary font-medium">{pct}%</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
