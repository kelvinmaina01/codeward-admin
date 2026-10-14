import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Copy, Check, ToggleLeft, ToggleRight, Loader2, X } from "lucide-react";
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

export default function BetaCodes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCodeData, setNewCodeData] = useState({ code: "", plan: "pro", maxUses: 100, durationDays: 30 });
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ codes: BetaCode[] }>({
    queryKey: ["admin-beta-codes"],
    queryFn: () => apiFetch("/beta/codes"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => 
      apiFetch(`/beta/codes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ active }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-beta-codes"] }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => 
      apiFetch("/beta/codes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-beta-codes"] });
      setShowCreateModal(false);
      setNewCodeData({ code: "", plan: "pro", maxUses: 100, durationDays: 30 });
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
    createMutation.mutate(newCodeData);
  };

  const handleAutoGenerate = () => {
    const randomHex = Math.floor(Math.random() * 0xffffffff).toString(16).toUpperCase().padStart(8, '0');
    const autoCode = `CW-BETA-${randomHex}`;
    createMutation.mutate({
      code: autoCode,
      plan: "pro",
      maxUses: 100,
      durationDays: 30
    });
  };

  const filtered = codes.filter((c) =>
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.createdByEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5 flex flex-col h-full relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Beta Codes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage founder-issued beta access codes that grant Pro plans without payment.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 shadow-sm" onClick={handleAutoGenerate} disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Auto-Generate Code
          </Button>
          <Button className="gap-2 shadow-sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            Custom Code
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Codes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <div className="text-2xl font-bold">{codes.length}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Codes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <div className="text-2xl font-bold text-emerald-500">{codes.filter((c) => c.active).length}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Redemptions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <div className="text-2xl font-bold">{codes.reduce((s, c) => s + c.usedCount, 0)}</div>}
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search codes..."
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Codes Table */}
      <div className="rounded-lg border bg-card flex-1 overflow-auto relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <table className="w-full text-sm">
          <thead className="text-[11px] text-muted-foreground uppercase tracking-wider bg-muted/40 sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Code</th>
              <th className="px-3 py-3 text-left font-medium">Plan</th>
              <th className="px-3 py-3 text-left font-medium">Duration</th>
              <th className="px-3 py-3 text-center font-medium">Usage</th>
              <th className="px-3 py-3 text-left font-medium">Batch Expires</th>
              <th className="px-3 py-3 text-center font-medium">Status</th>
              <th className="px-3 py-3 text-left font-medium">Created By</th>
              <th className="px-3 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.map((code) => (
              <tr
                key={code.id}
                className="hover:bg-muted/30 transition-colors group"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs bg-muted px-2 py-1 rounded border border-border font-semibold">{code.code}</code>
                    <button
                      onClick={(e) => { e.stopPropagation(); copyCode(code.id, code.code); }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy code"
                    >
                      {copiedId === code.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20 capitalize">{code.plan}</span>
                </td>
                <td className="px-3 py-3 text-xs">{code.durationDays} days</td>
                <td className="px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(100, (code.usedCount / code.maxUses) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{code.usedCount}/{code.maxUses}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-xs text-muted-foreground">
                  {code.batchExpiresAt ? new Date(code.batchExpiresAt).toLocaleDateString() : "Never"}
                </td>
                <td className="px-3 py-3 text-center">
                  {code.active ? (
                    <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Active</span>
                  ) : (
                    <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-500/10 px-2 py-0.5 rounded-full border border-zinc-500/20">Expired</span>
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-muted-foreground">{code.createdByEmail}</td>
                <td className="px-3 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={toggleMutation.isPending}
                    onClick={() => toggleMutation.mutate({ id: code.id, active: !code.active })}
                    title={code.active ? "Deactivate" : "Activate"}
                  >
                    {code.active ? (
                      <ToggleRight className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No beta codes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-[400px] shadow-lg animate-in fade-in zoom-in-95">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Create Beta Code</CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2" onClick={() => setShowCreateModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Code (e.g., FOUNDER_2026)</label>
                  <input 
                    required 
                    type="text" 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={newCodeData.code} 
                    onChange={e => setNewCodeData({...newCodeData, code: e.target.value.toUpperCase()})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Plan</label>
                  <select 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={newCodeData.plan} 
                    onChange={e => setNewCodeData({...newCodeData, plan: e.target.value})}
                  >
                    <option value="pro">Pro</option>
                    <option value="team">Team</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Max Uses</label>
                  <input 
                    required 
                    type="number" 
                    min="1" 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={newCodeData.maxUses} 
                    onChange={e => setNewCodeData({...newCodeData, maxUses: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Duration (Days)</label>
                  <input 
                    required 
                    type="number" 
                    min="1" 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={newCodeData.durationDays} 
                    onChange={e => setNewCodeData({...newCodeData, durationDays: parseInt(e.target.value)})}
                  />
                </div>
                <div className="pt-2 flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
