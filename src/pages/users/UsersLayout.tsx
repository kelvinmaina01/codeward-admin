import { Outlet, NavLink } from "react-router-dom";
import { BarChart3, Users, Building2, Clock, Ticket, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const navItems = [
  { name: "Overview", href: "/users", icon: BarChart3, end: true },
  { name: "All Users", href: "/users/all", icon: Users },
  { name: "Organizations", href: "/users/organizations", icon: Building2 },
  { name: "Activity Log", href: "/users/activity", icon: Clock },
  { name: "Beta Codes", href: "/users/beta-codes", icon: Ticket },
];

export default function UsersLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-[calc(100vh-60px)] w-full overflow-hidden">
      {/* Secondary Sidebar */}
      <aside
        className={`relative flex flex-col border-r border-border/60 bg-card/50 backdrop-blur-sm shrink-0 transition-all duration-300 ease-in-out ${
          collapsed ? "w-[52px]" : "w-[220px]"
        }`}
      >
        {/* Header */}
        {!collapsed && (
          <div className="px-4 pt-5 pb-3 border-b border-border/40">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Users & Access</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">Manage users, orgs & activity</p>
          </div>
        )}

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto py-2 ${collapsed ? "px-1.5" : "px-2"} space-y-0.5`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.end}
                className={({ isActive }) =>
                  `group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150 ${
                    collapsed ? "justify-center px-0 mx-auto w-9 h-9" : ""
                  } ${
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm shadow-primary/5"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`
                }
                title={collapsed ? item.name : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-10 border-t border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title={collapsed ? "Expand panel" : "Collapse panel"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
