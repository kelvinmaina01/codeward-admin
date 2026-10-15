import { useQuery } from "@tanstack/react-query";
import {
  Dollar01Icon,
  Money01Icon,
  Alert01Icon,
  UserAdd01Icon,
  Wallet01Icon,
  ChartUpIcon,
} from "hugeicons-react";
import { apiFetch } from "./api";
import { rangeToParams, rangeCacheKey, type RangeSel, type TrendMetric, type TrendsResponse } from "./trends";

// ─── Money ────────────────────────────────────────────────────────────────────

export function fmtMoney(cents: number | null | undefined, currency = "USD"): string {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) return "—";
  const dollars = cents / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: dollars >= 1000 ? 0 : 2,
    }).format(dollars);
  } catch {
    return `$${dollars.toFixed(2)}`;
  }
}

export function fmtMoneyShort(cents: number, currency = "USD"): string {
  const dollars = cents / 100;
  const symbol = currency === "USD" ? "$" : `${currency} `;
  if (Math.abs(dollars) >= 1000) return `${symbol}${(dollars / 1000).toFixed(1)}k`;
  return `${symbol}${dollars.toFixed(0)}`;
}

// ─── API shapes ───────────────────────────────────────────────────────────────

export interface RevenueOverview {
  range: string;
  start: string;
  end: string;
  currency: string;
  pricesLive: boolean;
  mrrCents: number;
  arrCents: number;
  payingOrgs: number;
  unpricedOrgs: number;
  byPlan: Record<string, { orgs: number; mrrCents: number }>;
  newSubs: number;
  prevNewSubs: number;
  returningSubs: number;
  prevReturningSubs: number;
  churnedOrgs: number;
  failedPayments: number;
  prevFailedPayments: number;
  refundedCents: number;
  collectedCents: number;
  prevCollectedCents: number;
}

export type OrgRevenueStatus = "active" | "past_due" | "canceled" | "inactive";

export interface RevenueOrg {
  id: number;
  githubLogin: string;
  planType: string;
  seatCount: number;
  polarSubscriptionId: string | null;
  polarCustomerId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  createdAt: string | null;
  owner: { email: string; name: string } | null;
  memberCount: number;
  status: OrgRevenueStatus;
  mrrCents: number;
  lifetimeCents: number;
  firstPaymentAt: string | null;
  lastPaymentAt: string | null;
  lastSkippedAt: string | null;
  subscriptionStarts: number;
  hadCancel: boolean;
  isReturning: boolean;
}

export interface RevenueOrgsResponse {
  orgs: RevenueOrg[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  currency: string;
  pricesLive: boolean;
}

export interface BillingPayment {
  id: number;
  eventType: string;
  status: string | null;
  amountCents: number | null;
  currency: string;
  plan: string | null;
  occurredAt: string;
}

export interface OrgRevenueDetail {
  org: Record<string, unknown> & { id: number; githubLogin: string; planType: string };
  members: { role: string; email: string; name: string; createdAt: string }[];
  owner: { role: string; email: string; name: string } | null;
  liveSubscription: {
    id: string;
    status: string;
    productId: string;
    seats: number | null;
    cancelAtPeriodEnd: boolean;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    amount: number | null;
    currency: string | null;
  } | null;
  payments: BillingPayment[];
  timeline: {
    at: string;
    kind: string;
    label: string;
    amountCents: number | null;
    currency: string;
    status: string | null;
    plan: string | null;
  }[];
  totals: {
    lifetimeCents: number;
    paidCount: number;
    failedCount: number;
    refundedCount: number;
    eventCount: number;
  };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useRevenueOverview(range: RangeSel) {
  return useQuery<RevenueOverview>({
    queryKey: ["admin-revenue-overview", rangeCacheKey(range)],
    queryFn: () => apiFetch<RevenueOverview>(`/revenue/overview?${rangeToParams(range)}`),
    staleTime: 60_000,
  });
}

export function useRevenueSeries(range: RangeSel) {
  const params = rangeToParams(range);
  return useQuery<TrendsResponse>({
    queryKey: ["admin-revenue-series", rangeCacheKey(range)],
    queryFn: () => apiFetch<TrendsResponse>(`/revenue/series?${params}`),
    staleTime: 60_000,
  });
}

export function useRevenueOrgs(args: {
  search?: string;
  plan?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (args.search) q.set("search", args.search);
  if (args.plan && args.plan !== "all") q.set("plan", args.plan);
  if (args.status && args.status !== "all") q.set("status", args.status);
  q.set("page", String(args.page ?? 1));
  q.set("limit", String(args.limit ?? 25));
  return useQuery<RevenueOrgsResponse>({
    queryKey: ["admin-revenue-orgs", args.search ?? "", args.plan ?? "all", args.status ?? "all", args.page ?? 1, args.limit ?? 25],
    queryFn: () => apiFetch<RevenueOrgsResponse>(`/revenue/orgs?${q.toString()}`),
    staleTime: 60_000,
  });
}

export function useOrgRevenue(orgId: number | null) {
  return useQuery<OrgRevenueDetail>({
    queryKey: ["admin-revenue-org", orgId],
    queryFn: () => apiFetch<OrgRevenueDetail>(`/revenue/orgs/${orgId}`),
    enabled: orgId !== null,
    staleTime: 30_000,
  });
}

// ─── Trend metrics backed by /revenue/series (TrendCard-compatible) ──────────

export const REVENUE_TREND_METRICS: TrendMetric[] = [
  {
    key: "newSubs",
    title: "New Subscribers",
    description: "First-time subscriptions started in the selected window.",
    whatItMeans: "Acquisition into paid plans. A consistently positive flow here is what compounds MRR over quarters.",
    icon: UserAdd01Icon,
    color: "#10b981",
    chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    seriesKey: "newSubs",
    kind: "bar",
  },
  {
    key: "revenue",
    title: "Revenue Collected",
    description: "Successfully charged order volume in the selected window.",
    whatItMeans: "Cash actually collected — the ground truth under MRR. Dips here precede churn showing up in subscriber counts.",
    icon: Dollar01Icon,
    color: "#10b981",
    chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    seriesKey: "revenue",
    kind: "area",
  },
  {
    key: "failed",
    title: "Failed Payments",
    description: "Failed and past-due billing events in the selected window.",
    whatItMeans: "Involuntary churn risk — every failed charge is a customer about to be lost without dunning. Down is good.",
    icon: Alert01Icon,
    color: "#ef4444",
    chip: "bg-red-500/10 text-red-600 dark:text-red-400",
    seriesKey: "failed",
    kind: "bar",
    invertDelta: true,
  },
];

export const REVENUE_DRAWER_ICONS = { Dollar01Icon, Money01Icon, Wallet01Icon, ChartUpIcon };
