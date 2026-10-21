import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Filter,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  UserPlus,
  Shield,
  Crown,
  Mail,
  Trash2,
  Clock,
  ShieldBan,
  RotateCcw,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { apiFetch } from "../../lib/api";
import MessageDrawer from "../../components/MessageDrawer";
import AdminModal from "../../components/AdminModal";
import UserActionDialog from "../../components/UserActionDialog";

type FilterState = {
  plan: string;
  status: string;
};

type UserResponse = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  isDeleted: boolean;
  suspendedAt?: string | null;
  suspendedBy?: string | null;
  emailVerified: boolean;
  role?: string;
  createdAt: string;
  repoCount: number;
  plan: string;
  // Deletion request info (if any)
  deletionRequest?: { status: string; requestedAt: string } | null;
  // Fallbacks for UI if missing in API response
  authProvider?: string;
  orgName?: string;
  orgRole?: string;
  betaCode?: string;
  betaExpiry?: string;
  totalDebtCleared?: number;
  leaderboardPosition?: number;
  leaderboardScore?: number;
  leaderboardOptIn?: boolean;
  lastActiveAt?: string;
};

type PaginatedUsers = {
  users: UserResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};


export default function UsersList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ plan: "all", status: "all" });
  const [page, setPage] = useState(1);

  // Promote admin state
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);

  // Messaging state
  const [messagingUser, setMessagingUser] = useState<{ id: string; name: string; email: string } | null>(null);

  // Account action state (suspend / restore / permanent delete)
  const [actionTarget, setActionTarget] = useState<
    { user: { id: string; email: string; name: string }; mode: "suspend" | "restore" | "purge" } | null
  >(null);

  // Debounced search for API
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Update debounced search
  useMemo(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: "25",
  });
  
  if (debouncedSearch) queryParams.append("search", debouncedSearch);
  if (filters.status !== "all") queryParams.append("status", filters.status);

  const { data, isLoading, isError, error } = useQuery<PaginatedUsers>({
    queryKey: ["admin-users", page, debouncedSearch, filters.status],
    queryFn: () => apiFetch(`/users?${queryParams.toString()}`),
  });

  // Client-side filtering for Plan since API doesn't support plan filter out of the box yet
  const filteredUsers = useMemo(() => {
    if (!data?.users) return [];
    return data.users.filter((u) => {
      if (filters.plan !== "all" && u.plan !== filters.plan) return false;
      return true;
    });
  }, [data?.users, filters.plan]);

  const activeFilters = Object.values(filters).filter((v) => v !== "all").length;

  return (
    <div className="p-6 space-y-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.pagination.total || 0} total users · Click a row to view their full profile & timeline.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm shrink-0"
          onClick={() => setIsPromoteModalOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
          Add / Promote Admin
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 relative"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {activeFilters > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
              {activeFilters}
            </span>
          )}
        </Button>
        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setFilters({ plan: "all", status: "all" })}>
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="flex items-center gap-4 px-4 py-3 rounded-lg border bg-card/50 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground">Plan:</label>
            <select
              value={filters.plan}
              onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
              className="h-7 rounded-md border border-input bg-transparent px-2 text-xs focus:ring-1 focus:ring-ring"
            >
              <option value="all">All</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="team">Team</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground">Status:</label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setPage(1);
              }}
              className="h-7 rounded-md border border-input bg-transparent px-2 text-xs focus:ring-1 focus:ring-ring"
            >
              <option value="all">All</option>
              <option value="active">Active (Not deleted)</option>
              <option value="deleted">Deleted</option>
              <option value="deletion_requested">Deletion Requested</option>
            </select>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
          Error loading users: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-lg border bg-card flex-1 overflow-auto relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        <table className="w-full text-sm">
          <thead className="text-[11px] text-muted-foreground uppercase tracking-wider bg-muted/40 sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-3 py-3 text-left font-medium">Role</th>
              <th className="px-3 py-3 text-left font-medium">Auth</th>
              <th className="px-3 py-3 text-left font-medium">Plan</th>
              <th className="px-3 py-3 text-left font-medium">Org</th>
              <th className="px-3 py-3 text-right font-medium">Repos</th>
              <th className="px-3 py-3 text-right font-medium">Joined</th>
              <th className="px-3 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                onClick={() => navigate(`/users/profile/${user.id}`)}
                className="hover:bg-muted/30 transition-colors cursor-pointer group"
              >
                {/* User */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      user.isDeleted
                        ? "bg-destructive/10 text-destructive"
                        : user.deletionRequest?.status === "pending"
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-primary/10 text-primary"
                    }`}>
                      {user.image ? (
                        <img src={user.image} alt={user.name} className="h-8 w-8 rounded-full" />
                      ) : (
                        user.name?.charAt(0) || user.email?.charAt(0) || "?"
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-sm truncate">{user.name || "Unknown User"}</span>
                        {user.isDeleted && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-semibold">
                            <Trash2 className="h-2.5 w-2.5" /> DELETED
                          </span>
                        )}
                        {!user.isDeleted && user.deletionRequest?.status === "pending" && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                            <Clock className="h-2.5 w-2.5" /> DEL REQUEST
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground truncate block">{user.email}</span>
                    </div>
                  </div>
                </td>
                {/* Role */}
                <td className="px-3 py-3">
                  {user.role === "super_admin" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <Crown className="h-3 w-3" /> Super Admin
                    </span>
                  ) : user.role === "admin" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-500 border border-purple-500/20">
                      <Shield className="h-3 w-3" /> Admin
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">User</span>
                  )}
                </td>
                {/* Auth Provider */}
                <td className="px-3 py-3">
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded capitalize">
                    {user.authProvider || "OAuth"}
                  </span>
                </td>
                {/* Plan */}
                <td className="px-3 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${
                    user.plan === "pro" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" :
                    user.plan === "team" ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" :
                    "bg-muted text-muted-foreground border-border"
                  }`}>
                    {user.plan || "free"}
                  </span>
                </td>
                {/* Org */}
                <td className="px-3 py-3">
                  {user.orgName ? (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{user.orgName}</span>
                      <span className="text-[10px] text-muted-foreground capitalize">{user.orgRole || "member"}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                {/* Repos */}
                <td className="px-3 py-3 text-right font-mono text-xs">{user.repoCount || 0}</td>
                {/* Joined */}
                <td className="px-3 py-3 text-right text-xs text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                {/* Actions */}
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground"
                      title={`Message ${user.name}`}
                      onClick={() => setMessagingUser({ id: user.id, name: user.name || user.email, email: user.email })}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Message
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-amber-500"
                      title={user.isDeleted ? `Restore ${user.name}` : `Suspend ${user.name}`}
                      onClick={() =>
                        setActionTarget({
                          user: { id: user.id, email: user.email, name: user.name },
                          mode: user.isDeleted ? "restore" : "suspend",
                        })
                      }
                    >
                      {user.isDeleted ? <RotateCcw className="h-3.5 w-3.5" /> : <ShieldBan className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title={`Permanently delete ${user.name}`}
                      onClick={() =>
                        setActionTarget({
                          user: { id: user.id, email: user.email, name: user.name },
                          mode: "purge",
                        })
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="View profile">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && filteredUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">
                  No users found matching your search or filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <span>Showing {filteredUsers.length} users on this page (Total: {data?.pagination.total || 0})</span>
        <div className="flex items-center gap-1">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7" 
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="px-2 font-medium">Page {data?.pagination.page || 1} of {data?.pagination.totalPages || 1}</span>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7" 
            disabled={!data || page >= data.pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Promote / Add Admin Modal ── */}
      <AdminModal
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["users"] });
          queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        }}
      />

      {/* ── Message Drawer ── */}
      <MessageDrawer user={messagingUser} onClose={() => setMessagingUser(null)} />

      {/* ── Account Action Dialog ── */}
      {actionTarget && (
        <UserActionDialog
          mode={actionTarget.mode}
          user={actionTarget.user}
          onClose={() => setActionTarget(null)}
          onDone={() => {
            setActionTarget(null);
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
          }}
        />
      )}
    </div>
  );
}
