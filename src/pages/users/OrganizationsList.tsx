import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronDown, ChevronRight, Users, Settings, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { apiFetch } from "../../lib/api";

type OrgResponse = {
  id: number;
  githubLogin: string | null;
  planType: string;
  trialPrsUsed: number;
  trialPrLimit: number;
  seatCount: number;
  createdAt: string;
  memberCount: number;
  repoCount: number;
};

type PaginatedOrgs = {
  orgs: OrgResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type OrgDetailsResponse = {
  org: OrgResponse;
  members: {
    userId: string;
    role: string;
    userName: string;
    userEmail: string;
    userImage: string | null;
  }[];
  repos: any[];
  betaRedemptions: any[];
};

export default function OrganizationsList() {
  const [expandedOrg, setExpandedOrg] = useState<number | null>(null);
  const page = 1;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: "25",
  });

  const { data, isLoading } = useQuery<PaginatedOrgs>({
    queryKey: ["admin-orgs", page],
    queryFn: () => apiFetch(`/orgs?${queryParams.toString()}`),
  });

  // Query details for expanded org
  const { data: orgDetails, isLoading: detailsLoading } = useQuery<OrgDetailsResponse>({
    queryKey: ["admin-org-details", expandedOrg],
    queryFn: () => apiFetch(`/orgs/${expandedOrg}`),
    enabled: expandedOrg !== null,
  });

  const toggleOrg = (id: number) => {
    setExpandedOrg(expandedOrg === id ? null : id);
  };

  return (
    <div className="p-6 space-y-6 flex flex-col h-full relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground text-sm">
            Manage team accounts, members, and organization settings.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search organizations..."
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-9"
            disabled
            title="Search filtering to be implemented on backend"
          />
        </div>
      </div>

      <div className="rounded-md border bg-card flex-1 overflow-auto relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <div className="grid grid-cols-[1fr_150px_150px_150px_100px] gap-4 p-4 border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider sticky top-0 z-10 backdrop-blur">
          <div>Organization</div>
          <div>Plan</div>
          <div>Members</div>
          <div>Repos</div>
          <div className="text-right">Actions</div>
        </div>
        
        <div className="divide-y divide-border">
          {data?.orgs.map((org) => (
            <div key={org.id} className="group">
              <div 
                className="grid grid-cols-[1fr_150px_150px_150px_100px] gap-4 p-4 items-center hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => toggleOrg(org.id)}
              >
                <div className="flex items-center gap-3">
                  {expandedOrg === org.id ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                    {(org.githubLogin || "?").charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold">{org.githubLogin || `Org #${org.id}`}</span>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border capitalize ${
                    org.planType === 'pro' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                    org.planType === 'team' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' :
                    'bg-muted text-muted-foreground border-border'
                  }`}>
                    {org.planType || 'free'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {org.memberCount} / {org.seatCount || '∞'}
                </div>
                <div className="text-sm font-mono text-muted-foreground">
                  {org.repoCount}
                </div>
                <div className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Expandable Member List */}
              {expandedOrg === org.id && (
                <div className="bg-muted/10 p-4 border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
                  <div className="ml-11 bg-background rounded-md border shadow-sm relative">
                    {detailsLoading && (
                      <div className="p-4 flex items-center justify-center text-muted-foreground text-sm">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading details...
                      </div>
                    )}
                    
                    {!detailsLoading && orgDetails && (
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground bg-muted/30 border-b">
                          <tr>
                            <th className="px-4 py-2 font-medium">Member</th>
                            <th className="px-4 py-2 font-medium">Email</th>
                            <th className="px-4 py-2 font-medium">Role</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {orgDetails.members.length === 0 && (
                            <tr>
                              <td colSpan={3} className="px-4 py-4 text-center text-muted-foreground text-xs">No members found</td>
                            </tr>
                          )}
                          {orgDetails.members.map(member => (
                            <tr key={member.userId} className="hover:bg-muted/30">
                              <td className="px-4 py-2 font-medium flex items-center gap-2">
                                {member.userImage && <img src={member.userImage} className="h-5 w-5 rounded-full" alt="" />}
                                {member.userName || "Unknown"}
                              </td>
                              <td className="px-4 py-2 text-muted-foreground text-xs">{member.userEmail}</td>
                              <td className="px-4 py-2">
                                <span className={`text-[11px] capitalize px-1.5 py-0.5 rounded ${
                                  member.role === 'owner' ? 'bg-blue-500/10 text-blue-500' : 'bg-muted text-muted-foreground'
                                }`}>
                                  {member.role}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {!isLoading && data?.orgs.length === 0 && (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No organizations found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
