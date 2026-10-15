import { useQuery } from "@tanstack/react-query";
import {
  UserAdd01Icon,
  Activity01Icon,
  GitPullRequestIcon,
  Flag01Icon,
  GitBranchIcon,
  Layers01Icon,
  Building01Icon,
  PieChartIcon,
  AlertCircleIcon,
  Shield01Icon,
  CubeIcon,
  FileScriptIcon,
  Ticket01Icon,
  InboxIcon,
  Alert01Icon,
  UserMinus01Icon,
  ChartColumnIcon,
} from "hugeicons-react";
import { apiFetch } from "./api";

// ─── Ranges ───────────────────────────────────────────────────────────────────

export type RangeKey = "7d" | "14d" | "30d" | "90d" | "180d" | "custom";

export interface RangeSel {
  key: RangeKey;
  from?: string; // YYYY-MM-DD (custom only)
  to?: string;   // YYYY-MM-DD (custom only)
}

export const RANGES: { key: RangeKey; label: string; hint: string }[] = [
  { key: "7d", label: "7D", hint: "Last 7 days" },
  { key: "14d", label: "14D", hint: "Last 14 days" },
  { key: "30d", label: "30D", hint: "Last 30 days" },
  { key: "90d", label: "3M", hint: "Last 3 months" },
  { key: "180d", label: "6M", hint: "Last 6 months" },
  { key: "custom", label: "Custom", hint: "Pick a date range" },
];

export function rangeToParams(r: RangeSel): string {
  if (r.key === "custom" && r.from && r.to) {
    return `range=custom&from=${r.from}&to=${r.to}`;
  }
  return `range=${r.key}`;
}

export function rangeCacheKey(r: RangeSel): string {
  return r.key === "custom" ? `custom:${r.from ?? ""}:${r.to ?? ""}` : r.key;
}

// ─── API shapes ───────────────────────────────────────────────────────────────

export interface BucketRow {
  t: string; // YYYY-MM-DD bucket start
  c: number;
}

export interface DimRow extends BucketRow {
  dim: string | null;
}

export interface DebtLeader {
  repoId: number;
  repo: string;
  score: number | null;
  openFindings: number;
  debtPenalty: number;
}

export interface TrendsResponse {
  range: string;
  bucket: "day" | "week";
  start: string;
  end: string;
  prevStart: string;
  series: Record<string, BucketRow[] | DimRow[]>;
  debtLeaders: DebtLeader[];
}

export function useTrends(range: RangeSel) {
  const params = rangeToParams(range);
  return useQuery<TrendsResponse>({
    queryKey: ["admin-trends", rangeCacheKey(range)],
    queryFn: () => apiFetch<TrendsResponse>(`/overview/trends?${params}`),
    staleTime: 60_000,
  });
}

// ─── Bucket math (mirrors backend: day ≤62d span, else Monday-start weeks) ────

function toDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function buildBuckets(startIso: string, endIso: string, bucket: "day" | "week"): string[] {
  const out: string[] = [];
  if (bucket === "day") {
    for (let d = toDay(new Date(startIso)); d < new Date(endIso); d = new Date(d.getTime() + 86400000)) {
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }
  // Monday-start weeks (matches Postgres date_trunc('week'))
  const start = toDay(new Date(startIso));
  const dow = (start.getUTCDay() + 6) % 7; // 0 = Monday
  let cur = new Date(start.getTime() - dow * 86400000);
  const end = new Date(endIso);
  while (cur < end) {
    out.push(cur.toISOString().slice(0, 10));
    cur = new Date(cur.getTime() + 7 * 86400000);
  }
  return out;
}

/** Map sparse rows onto a full bucket list, filling gaps with 0. */
export function normalize(rows: BucketRow[] | undefined, buckets: string[]): number[] {
  const map = new Map((rows ?? []).map((r) => [r.t, Number(r.c) || 0]));
  return buckets.map((b) => map.get(b) ?? 0);
}

/** Sum rows whose bucket falls in [from, to). */
export function sumIn(rows: BucketRow[] | undefined, from: string, to: string): number {
  return (rows ?? []).reduce((s, r) => (r.t >= from && r.t < to ? s + (Number(r.c) || 0) : s), 0);
}

// ─── Summaries + auto insights ────────────────────────────────────────────────

export interface TrendSummary {
  total: number;
  prevTotal: number;
  deltaPct: number | null; // null when prevTotal === 0
  avg: number;
  peak: number;
  peakDay: string | null;
  activeDays: number;
}

export function summarize(cur: number[], prev: number[], buckets: string[]): TrendSummary {
  const total = cur.reduce((a, b) => a + b, 0);
  const prevTotal = prev.reduce((a, b) => a + b, 0);
  let peak = 0;
  let peakDay: string | null = null;
  let activeDays = 0;
  cur.forEach((v, i) => {
    if (v > 0) activeDays += 1;
    if (v > peak) {
      peak = v;
      peakDay = buckets[i] ?? null;
    }
  });
  return {
    total,
    prevTotal,
    deltaPct: prevTotal === 0 ? (total > 0 ? 100 : null) : ((total - prevTotal) / prevTotal) * 100,
    avg: cur.length ? total / cur.length : 0,
    peak,
    peakDay,
    activeDays,
  };
}

export function shortDate(iso: string | null): string {
  if (!iso) return "—";
  const [, m, d] = iso.split("-");
  return `${m}/${d}`;
}

export function fmtPct(v: number | null): string {
  if (v === null || !Number.isFinite(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

// ─── Metric registry ──────────────────────────────────────────────────────────

export type ChartKind = "area" | "bar";

export interface TrendMetric {
  key: string;
  title: string;
  description: string;
  whatItMeans: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Chart stroke / primary color */
  color: string;
  /** Soft badge classes for icon chip + delta pills */
  chip: string;
  seriesKey: string;
  dimKey?: string;
  kind: ChartKind;
  /** When true, a DOWN delta is good (e.g. churn) and colors flip. */
  invertDelta?: boolean;
}

export const TREND_METRICS: TrendMetric[] = [
  {
    key: "signups",
    title: "User Signups",
    description: "New user accounts created in the selected window.",
    whatItMeans: "Top-of-funnel growth. Spikes usually follow launches, posts or onboarding fixes; flat stretches point at acquisition.",
    icon: UserAdd01Icon,
    color: "#10b981",
    chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    seriesKey: "signups",
    kind: "area",
  },
  {
    key: "runs",
    title: "Audit Runs",
    description: "Codeward analysis runs executed across all repos.",
    whatItMeans: "Core product usage. Healthy when it tracks or outpaces repo growth — a drop with steady repos means engagement slipping.",
    icon: Activity01Icon,
    color: "#6366f1",
    chip: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    seriesKey: "runs",
    dimKey: "runStatus",
    kind: "area",
  },
  {
    key: "prScans",
    title: "Pull Request Scans",
    description: "Runs triggered by pull requests (pr_number set).",
    whatItMeans: "CI integration depth — PR scans are the habit loop. Compare against total runs to see scheduled vs PR-driven usage.",
    icon: GitPullRequestIcon,
    color: "#8b5cf6",
    chip: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    seriesKey: "prScans",
    kind: "bar",
  },
  {
    key: "approvals",
    title: "Merge Approvals",
    description: "Guardian merge decisions requested on pull requests.",
    whatItMeans: "Trust signal — teams letting Codeward gate merges. Watch the approved vs pending split for review latency.",
    icon: Flag01Icon,
    color: "#f59e0b",
    chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    seriesKey: "approvals",
    dimKey: "approvalsByStatus",
    kind: "bar",
  },
  {
    key: "repos",
    title: "Repos Connected",
    description: "New repositories connected to Codeward.",
    whatItMeans: "Footprint expansion inside orgs. A leading indicator for future run and finding volume.",
    icon: GitBranchIcon,
    color: "#0ea5e9",
    chip: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    seriesKey: "repos",
    kind: "area",
  },
  {
    key: "baselines",
    title: "Baseline Scans",
    description: "Full baseline sweeps completed per repository.",
    whatItMeans: "Deep-audit adoption — the highest-value (and highest-cost) scan. Growth here means teams onboarding seriously.",
    icon: Layers01Icon,
    color: "#06b6d4",
    chip: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    seriesKey: "baselines",
    kind: "bar",
  },
  {
    key: "findingsOpened",
    title: "Findings Opened",
    description: "New technical-debt findings detected by agents.",
    whatItMeans: "Detection throughput. Rising with runs is normal; rising faster than runs means noisier code or sharper agents.",
    icon: AlertCircleIcon,
    color: "#f43f5e",
    chip: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    seriesKey: "findingsOpened",
    dimKey: "findingsBySeverity",
    kind: "area",
  },
  {
    key: "findingsResolved",
    title: "Debt Resolved",
    description: "Findings verified fixed (RESOLVED / FIX_VERIFIED).",
    whatItMeans: "The payoff metric — debt actually cleared. Compare against opened: resolved ≥ opened means the backlog is shrinking.",
    icon: Shield01Icon,
    color: "#10b981",
    chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    seriesKey: "findingsResolved",
    kind: "bar",
  },
  {
    key: "sandboxes",
    title: "Sandboxes",
    description: "E2B sandbox snapshots created for isolated runs.",
    whatItMeans: "Infra intensity — verification and reproduction work. Spikes track with baseline scans and deep audits.",
    icon: CubeIcon,
    color: "#d97706",
    chip: "bg-amber-600/10 text-amber-700 dark:text-amber-500",
    seriesKey: "sandboxes",
    dimKey: "sandboxesByStatus",
    kind: "bar",
  },
  {
    key: "logs",
    title: "Log Volume",
    description: "Run log events emitted by agents and system.",
    whatItMeans: "Observability exhaust. Useful for cost forensics and spotting error storms (filter level=err in the drawer).",
    icon: FileScriptIcon,
    color: "#64748b",
    chip: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    seriesKey: "logs",
    dimKey: "logsByLevel",
    kind: "area",
  },
  {
    key: "redemptions",
    title: "Beta Redemptions",
    description: "Founder beta codes redeemed by organizations.",
    whatItMeans: "Trial pipeline — redemptions today are paying conversions in 30 days. Watch expiry vs conversion.",
    icon: Ticket01Icon,
    color: "#d946ef",
    chip: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
    seriesKey: "redemptions",
    kind: "bar",
  },
  {
    key: "leads",
    title: "Demo Leads",
    description: "Demo request submissions captured.",
    whatItMeans: "Sales pipeline entry. Correlate spikes with marketing pushes; a dry spell here shows up in signups weeks later.",
    icon: InboxIcon,
    color: "#3b82f6",
    chip: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    seriesKey: "leads",
    kind: "bar",
  },
  {
    key: "alerts",
    title: "Alerts",
    description: "Platform alerts raised (by severity).",
    whatItMeans: "Operational health. Rising criticals deserve a drill-down; resolved-vs-raised shows on-call throughput.",
    icon: Alert01Icon,
    color: "#ef4444",
    chip: "bg-red-500/10 text-red-600 dark:text-red-400",
    seriesKey: "alerts",
    dimKey: "alertsBySeverity",
    kind: "bar",
    invertDelta: true,
  },
  {
    key: "orgs",
    title: "Organizations",
    description: "New organizations (workspaces) created.",
    whatItMeans: "Account growth — each org is a billing relationship. Track alongside plan mix for revenue quality.",
    icon: Building01Icon,
    color: "#f97316",
    chip: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    seriesKey: "orgs",
    dimKey: "orgsByPlan",
    kind: "area",
  },
  {
    key: "churn",
    title: "Account Deletions",
    description: "Users who requested account deletion.",
    whatItMeans: "Churn smoke alarm — small numbers, high signal. Any spike is worth reading the reasons behind.",
    icon: UserMinus01Icon,
    color: "#78716c",
    chip: "bg-stone-500/10 text-stone-500 dark:text-stone-400",
    seriesKey: "churn",
    kind: "bar",
    invertDelta: true,
  },
];

export const PLAN_MIX_METRIC: TrendMetric = {
  key: "planMix",
  title: "Plan Distribution",
  description: "Organization plan mix — current snapshot plus new orgs by plan in range.",
  whatItMeans: "Revenue quality at a glance. A healthy funnel converts free trials into pro and team plans over time.",
  icon: PieChartIcon,
  color: "#6366f1",
  chip: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  seriesKey: "orgsByPlan",
  kind: "bar",
};

export const DEBT_METRIC: TrendMetric = {
  key: "debt",
  title: "Debt Leaders",
  description: "Repositories carrying the most open technical debt, penalty-weighted.",
  whatItMeans: "Where the debt lives. Penalty weights severity, reachability and recurrence — the top rows are your highest-leverage fix targets.",
  icon: ChartColumnIcon,
  color: "#f43f5e",
  chip: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  seriesKey: "findingsOpened",
  kind: "bar",
};

/** Delta pill styling: green when good, red when bad, muted when flat. */
export function deltaTone(deltaPct: number | null, invert?: boolean): string {
  if (deltaPct === null || Math.abs(deltaPct) < 0.05)
    return "bg-muted text-muted-foreground";
  const good = invert ? deltaPct < 0 : deltaPct > 0;
  return good
    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : "bg-rose-500/10 text-rose-600 dark:text-rose-400";
}
