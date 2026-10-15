import {
  SidebarRightIcon,
  SidebarLeftIcon,
  ArrowLeft01Icon,
  Wallet01Icon,
  Money01Icon,
  Clock01Icon,
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
} from "hugeicons-react";
import { Loader2 } from "lucide-react";
import { useOrgRevenue, fmtMoney } from "../lib/revenue";
import { cn } from "../lib/utils";

function statusTone(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "past_due":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "canceled":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function eventIcon(kind: string) {
  if (kind === "order.created") return <Money01Icon className="h-4 w-4" />;
  if (kind === "subscription.created") return <CheckmarkCircle02Icon className="h-4 w-4" />;
  if (kind === "subscription.canceled" || kind === "subscription.revoked") return <Cancel01Icon className="h-4 w-4" />;
  if (kind === "subscription.updated") return <Clock01Icon className="h-4 w-4" />;
  return <Wallet01Icon className="h-4 w-4" />;
}

interface Props {
  orgId: number;
  currency: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onBack: () => void;
}

export default function OrgRevenueDrawer({ orgId, currency, collapsed, onToggleCollapse, onBack }: Props) {
  const { data, isLoading, isError } = useOrgRevenue(orgId);

  if (collapsed) {
    return (
      <aside className="flex w-[52px] shrink-0 flex-col items-center gap-2 border-l border-border/60 bg-card/50 py-3">
        <button onClick={onToggleCollapse} title="Expand panel" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer">
          <SidebarLeftIcon className="h-5 w-5" />
        </button>
        <button onClick={onBack} title="Back to list" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer">
          <ArrowLeft01Icon className="h-5 w-5" />
        </button>
      </aside>
    );
  }

  const org = data?.org;
  const name = (org?.githubLogin as string) ?? `Org #${orgId}`;

  return (
    <aside className="flex w-full max-w-[440px] min-w-[340px] shrink-0 flex-col border-l border-border/60 bg-card/50">
      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-border/60 px-2">
        <button onClick={onBack} title="Back to list" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer">
          <ArrowLeft01Icon className="h-5 w-5" />
        </button>
        <span className="ml-1 truncate text-[13px] font-semibold">{name}</span>
        <button onClick={onToggleCollapse} title="Collapse panel" className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer">
          <SidebarRightIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {isLoading && (
          <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading billing detail…
          </div>
        )}
        {isError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-[13px] text-destructive">
            Failed to load billing detail. It may need the latest API deploy.
          </div>
        )}

        {data && (
          <>
            {/* Snapshot */}
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Wallet01Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold leading-tight">{name}</p>
                <p className="text-xs text-muted-foreground">
                  {data.owner ? `${data.owner.name} · ${data.owner.email}` : "No owner on file"} · {data.members.length} member(s)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Lifetime value", value: fmtMoney(data.totals.lifetimeCents, currency) },
                { label: "Charges", value: `${data.totals.paidCount} paid` },
                { label: "Failed", value: `${data.totals.failedCount}` },
                { label: "Refunded", value: `${data.totals.refundedCount}` },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border bg-background p-2.5">
                  <p className="text-[11px] text-muted-foreground">{m.label}</p>
                  <p className="text-[15px] font-bold tabular-nums">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Live subscription */}
            <div className="rounded-xl border bg-background p-3">
              <p className="mb-1 text-[13px] font-semibold">Live subscription</p>
              {!data.liveSubscription ? (
                <p className="text-xs text-muted-foreground">No active subscription in Polar (free, canceled, or stale id).</p>
              ) : (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-semibold capitalize">{data.liveSubscription.status}</span>
                  <span className="text-muted-foreground">Seats</span>
                  <span className="font-semibold tabular-nums">{data.liveSubscription.seats ?? "—"}</span>
                  <span className="text-muted-foreground">Period</span>
                  <span className="font-semibold text-xs">
                    {data.liveSubscription.currentPeriodStart ? new Date(data.liveSubscription.currentPeriodStart).toLocaleDateString() : "—"}
                    {" → "}
                    {data.liveSubscription.currentPeriodEnd ? new Date(data.liveSubscription.currentPeriodEnd).toLocaleDateString() : "—"}
                  </span>
                  <span className="text-muted-foreground">Renews</span>
                  <span className="font-semibold">{data.liveSubscription.cancelAtPeriodEnd ? "No — ends at period close" : "Yes"}</span>
                </div>
              )}
            </div>

            {/* Payment history */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold">
                <Money01Icon className="h-4 w-4" />
                Payment history
                <span className="text-[11px] font-normal text-muted-foreground">({data.payments.length})</span>
              </p>
              {data.payments.length === 0 ? (
                <p className="text-xs text-muted-foreground">No charges recorded yet — history starts with the webhook ledger + backfill.</p>
              ) : (
                <div className="space-y-1.5">
                  {data.payments.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 rounded-lg border bg-background px-2.5 py-2 text-[13px]">
                      <span className={cn(
                        "font-bold tabular-nums",
                        p.status === "refunded" ? "text-amber-600 dark:text-amber-400" : ""
                      )}>
                        {fmtMoney(p.amountCents, p.currency)}
                      </span>
                      <span className="text-xs capitalize text-muted-foreground">{p.plan ?? ""}</span>
                      <span className={cn(
                        "ml-auto rounded px-1.5 py-0.5 text-[11px] font-semibold",
                        p.status === "refunded" ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      )}>
                        {p.status}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(p.occurredAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold">
                <Clock01Icon className="h-4 w-4" />
                Timeline
                <span className="text-[11px] font-normal text-muted-foreground">({data.timeline.length})</span>
              </p>
              {data.timeline.length === 0 ? (
                <p className="text-xs text-muted-foreground">No billing events yet.</p>
              ) : (
                <div>
                  {data.timeline.map((t, i) => (
                    <div key={i} className="relative flex gap-3 pb-3 last:pb-0">
                      {i < data.timeline.length - 1 && (
                        <span className="absolute left-[15px] top-8 h-[calc(100%-32px)] w-px bg-border" />
                      )}
                      <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
                        {eventIcon(t.kind)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium leading-snug">{t.label}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(t.at).toLocaleString()}
                          {t.status === "failed" || t.status === "past_due" ? (
                            <span className="ml-1 font-semibold text-rose-500">· skipped ({t.status.replace("_", " ")})</span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(data.totals.failedCount > 0) && (
              <p className="flex items-start gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs text-amber-700 dark:text-amber-400">
                <AlertCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {data.totals.failedCount} failed charge(s) on record — worth a dunning check.
              </p>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

// Re-export for callers that key tones off org status
export { statusTone };
