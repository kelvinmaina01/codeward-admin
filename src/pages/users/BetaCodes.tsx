import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Copy,
  Check,
  ToggleLeft,
  ToggleRight,
  Loader2,
  X,
  Edit2,
  Trash2,
  BarChart3,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Ticket
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { apiFetch } from "../../lib/api";

type BetaCode = {
  id: number;
  code: string;
  plan: string;
  durationDays: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
  batchExpiresAt: string | null;
  createdByEmail: string;
  createdAt: string;
};

type Redemption = {
  id: number;
  orgId: number;
  codeId: number;
  redeemedAt: string;
  expiresAt: string;
  warningSentAt: string | null;
  endedSentAt: string | null;
  orgLogin: string | null;
  planType: string | null;
  isActive: boolean;
};

type BetaAnalytics = {
  totalCodes: number;
  activeCodes: number;
  totalRedemptions: number;
  activeTrials: number;
  recentRedemptions: {
    id: number;
    codeId: number;
    code: string;
    plan: string;
    orgId: number;
    orgLogin: string | null;
    redeemedAt: string;
    expiresAt: string;
    isActive: boolean;
  }[];
};

export default function BetaCodes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCode, setEditingCode] = useState<BetaCode | null>(null);
  const [inspectingCode, setInspectingCode] = useState<BetaCode | null>(null);
  const [codeToDelete, setCodeToDelete] = useState<BetaCode | null>(null);

  const [newCodeData, setNewCodeData] = useState({
    code: "",
    plan: "pro",
    maxUses: 100,
    durationDays: 30,
    batchExpiresAt: "",
  });

  const queryClient = useQueryClient();

  // Queries
  const { data, isLoading } = useQuery<{ codes: BetaCode[] }>({
    queryKey: ["admin-beta-codes"],
    queryFn: () => apiFetch("/beta/codes"),
  });

  const { data: analyticsData } = useQuery<BetaAnalytics>({
    queryKey: ["admin-beta-analytics"],
    queryFn: () => apiFetch("/beta/analytics"),
  });

  const { data: redemptionsData, isLoading: isLoadingRedemptions } = useQuery<{
    code: BetaCode;
    redemptions: Redemption[];
  }>({
    queryKey: ["admin-beta-redemptions", inspectingCode?.id],
    queryFn: () => apiFetch(`/beta/codes/${inspectingCode?.id}/redemptions`),
    enabled: !!inspectingCode,
  });

  // Mutations
  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      apiFetch(`/beta/codes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ active }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-beta-codes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-beta-analytics"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: any) =>
      apiFetch("/beta/codes", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-beta-codes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-beta-analytics"] });
      setShowCreateModal(false);
      setNewCodeData({ code: "", plan: "pro", maxUses: 100, durationDays: 30, batchExpiresAt: "" });
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) =>
      apiFetch(`/beta/codes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-beta-codes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-beta-analytics"] });
      setEditingCode(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/beta/codes/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-beta-codes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-beta-analytics"] });
      setCodeToDelete(null);
    },
  });

  const codes = data?.codes || [];

  const copyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...newCodeData,
      code: newCodeData.code.trim().toUpperCase(),
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCode) return;
    editMutation.mutate({
      id: editingCode.id,
      updates: {
        code: editingCode.code.trim().toUpperCase(),
        plan: editingCode.plan,
        maxUses: Number(editingCode.maxUses),
        durationDays: Number(editingCode.durationDays),
        active: editingCode.active,
        batchExpiresAt: editingCode.batchExpiresAt || null,
      },
    });
  };

  const handleAutoGenerate = () => {
    const randomHex = Math.floor(Math.random() * 0xffffffff)
      .toString(16)
      .toUpperCase()
      .padStart(8, "0");
    const autoCode = `CW-BETA-${randomHex}`;
    createMutation.mutate({
      code: autoCode,
      plan: "pro",
      maxUses: 50,
      durationDays: 30,
    });
  };

  const filtered = codes.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.createdByEmail && c.createdByEmail.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-5 flex flex-col h-full relative">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Beta Access Codes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, edit, discontinue, and monitor founder-issued codes that unlock plans without payment.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 shadow-sm font-medium"
            onClick={handleAutoGenerate}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-amber-500" />
            )}
            Auto-Generate Code
          </Button>
          <Button
            className="gap-2 shadow-sm bg-primary hover:bg-primary/90 font-medium"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4" />
            Create Code
          </Button>
        </div>
      </div>

      {/* ── Analytics KPI Cards ── */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="bg-card/70 border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>Total Codes</span>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{analyticsData?.totalCodes ?? codes.length}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>Active Codes</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <div className="text-2xl font-bold text-emerald-500">
                {analyticsData?.activeCodes ?? codes.filter((c) => c.active).length}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>Total Redemptions</span>
              <Users className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <div className="text-2xl font-bold text-blue-500">
                {analyticsData?.totalRedemptions ?? codes.reduce((s, c) => s + c.usedCount, 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>Active Trials Running</span>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <div className="text-2xl font-bold text-purple-500">
                {analyticsData?.activeTrials ?? "—"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by code name..."
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ── Codes Table ── */}
      <div className="rounded-xl border bg-card flex-1 overflow-auto relative shadow-sm">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <table className="w-full text-sm">
          <thead className="text-[11px] text-muted-foreground uppercase tracking-wider bg-muted/40 sticky top-0 z-10 backdrop-blur-sm border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Code</th>
              <th className="px-3 py-3 text-left font-medium">Plan</th>
              <th className="px-3 py-3 text-left font-medium">Duration</th>
              <th className="px-3 py-3 text-center font-medium">Usage & Progress</th>
              <th className="px-3 py-3 text-left font-medium">Batch Expiration</th>
              <th className="px-3 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Manage & Analytics</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.map((code) => {
              const usagePercent = Math.min(100, Math.round((code.usedCount / (code.maxUses || 1)) * 100));
              const isExhausted = code.usedCount >= code.maxUses;

              return (
                <tr key={code.id} className="hover:bg-muted/30 transition-colors group">
                  {/* Code */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs bg-muted/80 px-2.5 py-1 rounded-md border border-border font-bold tracking-wide">
                        {code.code}
                      </code>
                      <button
                        onClick={() => copyCode(code.id, code.code)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1"
                        title="Copy code"
                      >
                        {copiedId === code.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Plan */}
                  <td className="px-3 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${
                        code.plan === "team"
                          ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                          : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      }`}
                    >
                      {code.plan}
                    </span>
                  </td>

                  {/* Duration */}
                  <td className="px-3 py-3 text-xs font-medium">{code.durationDays} days</td>

                  {/* Usage Progress */}
                  <td className="px-3 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isExhausted ? "bg-amber-500" : "bg-primary"
                            }`}
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                          {code.usedCount}/{code.maxUses}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {usagePercent}% utilized
                      </span>
                    </div>
                  </td>

                  {/* Batch Expires */}
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {code.batchExpiresAt
                      ? new Date(code.batchExpiresAt).toLocaleDateString()
                      : "No expiry"}
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3 text-center">
                    {code.active ? (
                      <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Active
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-500/10 px-2 py-0.5 rounded-full border border-zinc-500/20">
                        Discontinued
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Monitor Redemptions */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                        title="View Usage & Redemptions"
                        onClick={() => setInspectingCode(code)}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>

                      {/* Edit */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Edit Code"
                        onClick={() => setEditingCode({ ...code })}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>

                      {/* Toggle Discontinue / Activate */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={toggleMutation.isPending}
                        onClick={() => toggleMutation.mutate({ id: code.id, active: !code.active })}
                        title={code.active ? "Discontinue Code" : "Activate Code"}
                      >
                        {code.active ? (
                          <ToggleRight className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        title="Remove Code"
                        onClick={() => setCodeToDelete(code)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No beta codes found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Create Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <Card className="w-full max-w-md shadow-2xl border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <CardTitle className="text-base font-semibold">Create New Beta Code</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-2"
                onClick={() => setShowCreateModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Code (e.g. VIP_FOUNDER_2026)</label>
                  <input
                    required
                    type="text"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm font-mono uppercase"
                    value={newCodeData.code}
                    onChange={(e) =>
                      setNewCodeData({ ...newCodeData, code: e.target.value.toUpperCase() })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Plan Granted</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    value={newCodeData.plan}
                    onChange={(e) => setNewCodeData({ ...newCodeData, plan: e.target.value })}
                  >
                    <option value="pro">Pro Plan</option>
                    <option value="team">Team Plan</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Max Uses</label>
                    <input
                      required
                      type="number"
                      min="1"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm font-mono"
                      value={newCodeData.maxUses}
                      onChange={(e) =>
                        setNewCodeData({ ...newCodeData, maxUses: parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Duration (Days)</label>
                    <input
                      required
                      type="number"
                      min="1"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm font-mono"
                      value={newCodeData.durationDays}
                      onChange={(e) =>
                        setNewCodeData({
                          ...newCodeData,
                          durationDays: parseInt(e.target.value) || 30,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Batch Expiration (Optional)</label>
                  <input
                    type="date"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    value={newCodeData.batchExpiresAt}
                    onChange={(e) =>
                      setNewCodeData({ ...newCodeData, batchExpiresAt: e.target.value })
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Code cannot be redeemed after this date even if uses remain.
                  </p>
                </div>
                <div className="pt-2 flex gap-2 justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={createMutation.isPending} className="font-semibold">
                    {createMutation.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    Create Code
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editingCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <Card className="w-full max-w-md shadow-2xl border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <CardTitle className="text-base font-semibold">Edit Beta Code</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-2"
                onClick={() => setEditingCode(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Code Identifier</label>
                  <input
                    required
                    type="text"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm font-mono uppercase"
                    value={editingCode.code}
                    onChange={(e) =>
                      setEditingCode({ ...editingCode, code: e.target.value.toUpperCase() })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Plan Granted</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    value={editingCode.plan}
                    onChange={(e) => setEditingCode({ ...editingCode, plan: e.target.value })}
                  >
                    <option value="pro">Pro Plan</option>
                    <option value="team">Team Plan</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Max Uses Limit</label>
                    <input
                      required
                      type="number"
                      min={editingCode.usedCount}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm font-mono"
                      value={editingCode.maxUses}
                      onChange={(e) =>
                        setEditingCode({
                          ...editingCode,
                          maxUses: parseInt(e.target.value) || editingCode.usedCount,
                        })
                      }
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Already used: {editingCode.usedCount}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Duration (Days)</label>
                    <input
                      required
                      type="number"
                      min="1"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm font-mono"
                      value={editingCode.durationDays}
                      onChange={(e) =>
                        setEditingCode({
                          ...editingCode,
                          durationDays: parseInt(e.target.value) || 30,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Status</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    value={editingCode.active ? "active" : "discontinued"}
                    onChange={(e) =>
                      setEditingCode({ ...editingCode, active: e.target.value === "active" })
                    }
                  >
                    <option value="active">Active (Can be redeemed)</option>
                    <option value="discontinued">Discontinued / Inactive (Disabled)</option>
                  </select>
                </div>
                <div className="pt-2 flex gap-2 justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingCode(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={editMutation.isPending} className="font-semibold">
                    {editMutation.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Redemptions & Usage Monitoring Modal ── */}
      {inspectingCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Usage & Redemption Analytics</CardTitle>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    Code: <span className="font-bold text-foreground">{inspectingCode.code}</span> · {inspectingCode.usedCount} of {inspectingCode.maxUses} used
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-2"
                onClick={() => setInspectingCode(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="pt-4 flex-1 overflow-auto space-y-4">
              {isLoadingRedemptions ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Summary Bar */}
                  <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/40 border text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Plan Unlocked</span>
                      <span className="font-semibold capitalize text-foreground">{inspectingCode.plan}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Trial Length</span>
                      <span className="font-semibold text-foreground">{inspectingCode.durationDays} Days</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Remaining Uses</span>
                      <span className="font-semibold text-foreground">
                        {Math.max(0, inspectingCode.maxUses - inspectingCode.usedCount)}
                      </span>
                    </div>
                  </div>

                  {/* Redemptions Table */}
                  <div>
                    <h4 className="text-xs font-semibold text-foreground mb-2">
                      Redeeming Organizations ({redemptionsData?.redemptions.length || 0})
                    </h4>
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50 border-b text-[10px] uppercase text-muted-foreground font-medium">
                          <tr>
                            <th className="px-3 py-2 text-left">Organization</th>
                            <th className="px-3 py-2 text-left">Redeemed At</th>
                            <th className="px-3 py-2 text-left">Expires At</th>
                            <th className="px-3 py-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {redemptionsData?.redemptions.map((redemption) => (
                            <tr key={redemption.id} className="hover:bg-muted/20">
                              <td className="px-3 py-2.5 font-medium text-foreground">
                                {redemption.orgLogin || `Org #${redemption.orgId}`}
                              </td>
                              <td className="px-3 py-2.5 text-muted-foreground">
                                {new Date(redemption.redeemedAt).toLocaleString()}
                              </td>
                              <td className="px-3 py-2.5 text-muted-foreground">
                                {new Date(redemption.expiresAt).toLocaleDateString()}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                {redemption.isActive ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    Active Trial
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                                    Trial Ended
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {(!redemptionsData?.redemptions || redemptionsData.redemptions.length === 0) && (
                            <tr>
                              <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground text-xs">
                                This code has not been redeemed by any organization yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {codeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <Card className="w-full max-w-sm shadow-2xl border-destructive/30">
            <CardHeader className="flex flex-row items-center gap-3 pb-3 border-b">
              <div className="h-9 w-9 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Delete Beta Code</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">This action cannot be undone.</p>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to delete <code className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">{codeToDelete.code}</code>?
                Any redemption history associated with this code will be permanently removed.
              </p>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setCodeToDelete(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(codeToDelete.id)}
                  className="font-semibold"
                >
                  {deleteMutation.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Delete Code
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
