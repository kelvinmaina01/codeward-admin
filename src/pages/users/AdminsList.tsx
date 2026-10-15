import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Crown,
  Search,
  UserPlus,
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
  UserMinus,
  KeyRound,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { apiFetch } from "../../lib/api";
import AdminModal from "../../components/AdminModal";
import MessageDrawer from "../../components/MessageDrawer";
import { cn } from "../../lib/utils";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "admin" | "super_admin";
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminsResponse {
  admins: AdminUser[];
}

export default function AdminsList() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Admin Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);

  // Demotion confirm state
  const [demotingAdmin, setDemotingAdmin] = useState<AdminUser | null>(null);
  const [isDemoting, setIsDemoting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Messaging state
  const [messagingUser, setMessagingUser] = useState<{ id: string; name: string; email: string } | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<AdminsResponse>({
    queryKey: ["admin-users"],
    queryFn: () => apiFetch<AdminsResponse>("/admins"),
    staleTime: 30000,
  });

  const admins = data?.admins || [];

  const filteredAdmins = useMemo(() => {
    return admins.filter((a) => {
      const matchSearch =
        searchTerm === "" ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === "all" || a.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [admins, searchTerm, roleFilter]);

  const stats = useMemo(() => {
    const total = admins.length;
    const superAdmins = admins.filter((a) => a.role === "super_admin").length;
    const standardAdmins = admins.filter((a) => a.role === "admin").length;
    return { total, superAdmins, standardAdmins };
  }, [admins]);

  const handleDemote = async () => {
    if (!demotingAdmin) return;
    setIsDemoting(true);
    setActionError("");
    setActionSuccess("");

    try {
      const res = await apiFetch<{ success: boolean; message: string }>(`/admins/${demotingAdmin.id}`, {
        method: "DELETE",
      });
      setActionSuccess(res.message || "Admin successfully demoted.");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDemotingAdmin(null);
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err: any) {
      setActionError(err.message || "Failed to demote admin.");
    } finally {
      setIsDemoting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Administrators
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage administrative privileges, add new platform admins, or set passwords for instant login.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button
            size="sm"
            className="gap-1.5 font-semibold shadow-sm"
            onClick={() => {
              setEditingAdmin(null);
              setIsModalOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4" />
            Add / Promote Admin
          </Button>
        </div>
      </div>

      {/* ── Status Alerts ── */}
      {actionSuccess && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs border border-emerald-500/20">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border/70 bg-card shadow-sm space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Total Administrators</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-[11px] text-muted-foreground">Active platform managers</p>
        </div>
        <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-purple-400">Super Admins</p>
            <Crown className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.superAdmins}</p>
          <p className="text-[11px] text-muted-foreground">Full platform & billing control</p>
        </div>
        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-blue-400">Standard Admins</p>
            <Shield className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.standardAdmins}</p>
          <p className="text-[11px] text-muted-foreground">User & scan management access</p>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search admins by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admins Only</option>
            <option value="admin">Standard Admins Only</option>
          </select>
        </div>
      </div>

      {/* ── Administrators Table ── */}
      <div className="border border-border/80 rounded-xl overflow-hidden bg-card shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading administrators...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-semibold text-foreground">Failed to load administrators</p>
            <p className="text-xs text-muted-foreground">{(error as any)?.message || "Internal error"}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3 text-center">
            <Shield className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">No administrators found</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              {searchTerm || roleFilter !== "all"
                ? "No admins match your current search or role filter criteria."
                : "No users have administrative privileges yet. Click Add / Promote Admin to create one."}
            </p>
            {(searchTerm || roleFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setRoleFilter("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Email Status</th>
                  <th className="py-3 px-4">Added On</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {filteredAdmins.map((admin) => {
                  const isSuper = admin.role === "super_admin";
                  const initial = admin.name ? admin.name[0].toUpperCase() : admin.email[0].toUpperCase();

                  return (
                    <tr
                      key={admin.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {admin.image ? (
                            <img
                              src={admin.image}
                              alt={admin.name}
                              className="h-8 w-8 rounded-full object-cover border border-border/80"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs border border-primary/20">
                              {initial}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate flex items-center gap-1.5">
                              {admin.name || "Unnamed Admin"}
                            </p>
                            <p className="text-muted-foreground text-[11px] font-mono truncate">
                              {admin.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {isSuper ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-xs">
                            <Crown className="h-3 w-3" />
                            Super Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-xs">
                            <Shield className="h-3 w-3" />
                            Admin
                          </span>
                        )}
                      </td>

                      {/* Email Status */}
                      <td className="py-3.5 px-4">
                        {admin.emailVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-500 font-medium">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Unverified
                          </span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                        {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }) : "—"}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Send Message */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                            onClick={() =>
                              setMessagingUser({
                                id: admin.id,
                                name: admin.name || admin.email,
                                email: admin.email,
                              })
                            }
                            title="Send email to this admin"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Message</span>
                          </Button>

                          {/* Edit / Set Password */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                            onClick={() => {
                              setEditingAdmin(admin);
                              setIsModalOpen(true);
                            }}
                            title="Update role or change password"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>

                          {/* Demote */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 gap-1"
                            onClick={() => setDemotingAdmin(admin)}
                            title="Remove admin privileges"
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Demote</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Demotion Confirmation Modal ── */}
      {demotingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-card border border-border/80 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-destructive">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <UserMinus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Demote Administrator?</h3>
                <p className="text-xs text-muted-foreground">Revoke administrative permissions</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to demote <span className="font-semibold text-foreground">{demotingAdmin.name || demotingAdmin.email}</span> ({demotingAdmin.email}) back to a standard user? They will lose access to this admin dashboard immediately.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDemotingAdmin(null)}
                disabled={isDemoting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 font-semibold"
                onClick={handleDemote}
                disabled={isDemoting}
              >
                {isDemoting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Demoting...
                  </>
                ) : (
                  <>
                    <UserMinus className="h-3.5 w-3.5" />
                    Confirm Demote
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Admin Modal ── */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAdmin(null);
        }}
        defaultEmail={editingAdmin ? editingAdmin.email : ""}
        defaultRole={editingAdmin ? editingAdmin.role : "admin"}
        mode={editingAdmin ? "edit" : "add"}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-users"] });
          queryClient.invalidateQueries({ queryKey: ["users"] });
        }}
      />

      {/* ── Message Drawer ── */}
      <MessageDrawer user={messagingUser} onClose={() => setMessagingUser(null)} />
    </div>
  );
}
