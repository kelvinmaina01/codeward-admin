import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, ShieldAlert, Trash2, ExternalLink, Crown, ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { apiFetch } from "../../lib/api";

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
  emailVerified: boolean;
  createdAt: string;
  repoCount: number;
  plan: string;
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function UsersList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ plan: "all", status: "all" });
  const [page, setPage] = useState(1);

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Users</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data?.pagination.total || 0} total users · Click a row to view their full profile & timeline.
        </p>
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
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${user.isDeleted ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                      {user.image ? (
                        <img src={user.image} alt={user.name} className="h-8 w-8 rounded-full" />
                      ) : (
                        user.name?.charAt(0) || user.email?.charAt(0) || "?"
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm truncate">{user.name || "Unknown User"}</span>
                        {user.isDeleted && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-semibold">DELETED</span>}
                      </div>
                      <span className="text-xs text-muted-foreground truncate block">{user.email}</span>
                    </div>
                  </div>
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
                    user.plan === "pro" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                    user.plan === "team" ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                    "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
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
    </div>
  );
}
