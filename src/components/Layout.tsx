import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  Search01Icon,
  FavouriteIcon,
  TimeScheduleIcon,
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  FolderManagementIcon,
  PanelRightIcon,
} from "hugeicons-react";
import { LogOut } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { useAuth } from "../lib/auth-context";
import { primaryNav } from "./app-navigation";
import { cn } from "../lib/utils";

function getActivePrimary(pathname: string) {
  if (pathname === "/") return primaryNav[0];
  const match = [...primaryNav]
    .sort((a, b) => b.href.length - a.href.length)
    .find((p) => (p.end ? pathname === p.href : pathname.startsWith(p.href)));
  return match ?? primaryNav[0];
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [secondaryCollapsed, setSecondaryCollapsed] = useState(false);
  const [query, setQuery] = useState("");

  const activePrimary = useMemo(
    () => getActivePrimary(location.pathname),
    [location.pathname]
  );

  const toggleGroup = (id: string) =>
    setCollapsedGroups((p) => ({ ...p, [id]: !p[id] }));

  const isGroupOpen = (id: string, defaultOpen = true) =>
    collapsedGroups[id] ?? defaultOpen;

  const q = query.trim().toLowerCase();
  const visibleGroups = useMemo(
    () =>
      activePrimary.groups
        .map((g) => ({
          ...g,
          links: g.links.filter((l) => !q || l.label.toLowerCase().includes(q)),
        }))
        .filter((g) => g.links.length > 0),
    [activePrimary, q]
  );

  const initial =
    user?.name?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    "A";

  const secondaryPanel = (
    <div className="flex h-full flex-col">
      {/* Search — like "Try searching insights" */}
      <div className="relative mb-3">
        <Search01Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Try searching "insights"'
          className="h-10 w-full rounded-full border border-transparent bg-card pl-9 pr-3 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary/40 focus:bg-background"
        />
      </div>

      {/* Quick links */}
      <div className="space-y-0.5 px-1 text-[13px]">
        <NavLink
          to="/"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <FavouriteIcon className="h-4 w-4" />
          Starred
        </NavLink>
        <NavLink
          to="/users/activity"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <TimeScheduleIcon className="h-4 w-4" />
          Recent
        </NavLink>
      </div>

      {/* Tree groups */}
      <div className="mt-3 flex-1 space-y-4 overflow-y-auto px-1 pb-2">
        {/* Panel title block — e.g. Codeward Users */}
        <div className="px-2">
          <p className="text-[15px] font-bold leading-tight tracking-tight">
            {activePrimary.panelTitle}
          </p>
          <p className="text-xs text-muted-foreground">
            {activePrimary.panelSubtitle}
          </p>
        </div>

        {visibleGroups.map((group) => {
          const open = group.collapsible
            ? isGroupOpen(group.id, group.defaultOpen)
            : true;
          return (
            <div key={group.id}>
              <div className="flex items-center justify-between px-2">
                <button
                  onClick={() =>
                    group.collapsible && toggleGroup(group.id)
                  }
                  className={cn(
                    "flex items-center gap-1 text-[13px] font-semibold",
                    group.collapsible && "cursor-pointer"
                  )}
                >
                  {group.label}
                  {group.collapsible &&
                    (open ? (
                      <ArrowUp01Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ArrowDown01Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    ))}
                </button>
                <button
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground border border-border/40 cursor-pointer"
                  title={`Add ${group.label}`}
                >
                  <Add01Icon className="h-3.5 w-3.5" />
                </button>
              </div>

              {open && (
                <div className="ml-3 mt-1 space-y-0.5 border-l border-border/70 pl-1">
                  {group.links.map((link) => (
                    <NavLink
                      key={link.label + link.href}
                      to={link.href}
                      end={link.end}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "relative flex items-center gap-2 rounded-r-lg rounded-l-none px-3 py-1.5 text-[13px] transition-colors",
                          "before:absolute before:-left-[5px] before:top-1/2 before:h-px before:w-2 before:-translate-y-1/2 before:bg-border",
                          isActive
                            ? "font-semibold text-rose-600 dark:text-rose-400 before:bg-rose-500"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )
                      }
                    >
                      {link.icon && (
                        <link.icon className="h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate">{link.label}</span>
                      {typeof link.badge === "number" && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-md bg-rose-500 px-1.5 text-[11px] font-bold text-white">
                          {link.badge}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="space-y-2 border-t border-border/60 pt-3">
        <button className="flex items-center gap-2 px-2 text-[13px] text-muted-foreground hover:text-foreground">
          <FolderManagementIcon className="h-4 w-4" />
          Manage folders
        </button>
        <div className="flex items-center gap-2 rounded-xl bg-card border border-border/50 p-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">
              {user?.name ?? "Admin"}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {user?.email ?? ""}
            </p>
          </div>
          <ModeToggle />
          <button
            onClick={logout}
            className="flex h-7 w-7 items-center justify-center rounded-full text-destructive hover:bg-destructive/10 cursor-pointer"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[var(--shell-bg)] p-2 md:p-3 transition-colors duration-200">
      <div className="mx-auto flex h-[calc(100vh-16px)] w-full max-w-[1600px] gap-2 md:h-[calc(100vh-24px)] md:gap-3">
        {/* ── Primary rail (major panel) ── */}
        <aside className="flex w-[60px] shrink-0 flex-col items-center rounded-2xl bg-[var(--shell-sidebar)] border border-[var(--shell-border)] py-3 shadow-xs md:w-[68px] transition-colors duration-200">
          <button
            onClick={() => navigate("/")}
            className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-base font-black text-background cursor-pointer"
            title="Codeward"
          >
            C
          </button>

          <nav className="flex flex-1 flex-col items-center gap-2">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activePrimary.id;
              return (
                <NavLink
                  key={item.id}
                  to={item.href}
                  title={item.label}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full transition-all",
                    isActive
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                      : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </NavLink>
              );
            })}
          </nav>

          <button
            onClick={() => setSecondaryCollapsed((v) => !v)}
            className="mt-3 hidden h-9 w-9 items-center justify-center rounded-full bg-card border border-border text-foreground hover:bg-muted md:flex transition-all cursor-pointer"
            title={secondaryCollapsed ? "Expand sidebar panel" : "Collapse sidebar panel"}
          >
            <PanelRightIcon className={cn("h-4 w-4 transition-transform", secondaryCollapsed && "rotate-180")} />
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="mt-3 flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border text-foreground md:hidden"
          >
            <Search01Icon className="h-4 w-4" />
          </button>
        </aside>

        {/* ── Secondary panel (breakdown of major) ── */}
        {!secondaryCollapsed && (
          <aside className="hidden w-[280px] shrink-0 rounded-2xl bg-[var(--shell-sidebar)] border border-[var(--shell-border)] p-4 shadow-xs lg:block transition-colors duration-200">
            {secondaryPanel}
          </aside>
        )}

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative z-10 w-[300px] rounded-r-2xl bg-[var(--shell-sidebar)] border-r border-[var(--shell-border)] p-4">
              {secondaryPanel}
            </div>
          </div>
        )}

        {/* ── Main content card (100% flexible width) ── */}
        <main className="min-w-0 flex-1 w-full overflow-hidden rounded-2xl bg-[var(--shell-main)] border border-[var(--shell-border)] shadow-xs flex flex-col transition-colors duration-200">
          {/* Slim topbar: collapse trigger + breadcrumb + search + theme toggle */}
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/60 px-4">
            {/* Desktop panel toggle - first component */}
            <button
              onClick={() => setSecondaryCollapsed((v) => !v)}
              className="hidden h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-muted shadow-xs transition-all cursor-pointer lg:flex shrink-0"
              title={secondaryCollapsed ? "Expand sidebar panel" : "Collapse sidebar panel"}
            >
              <PanelRightIcon className={cn("h-4 w-4 transition-transform", secondaryCollapsed && "rotate-180")} />
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground lg:hidden shrink-0"
              title="Open menu"
            >
              <FolderManagementIcon className="h-4 w-4" />
            </button>

            <div className="hidden items-center gap-2 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background shrink-0">
                {initial}
              </span>
              <span className="text-[13px] text-muted-foreground">
                {activePrimary.panelTitle}
              </span>
              <span className="text-[13px] text-muted-foreground">/</span>
              <span className="text-[13px] font-semibold text-foreground">
                {location.pathname.split("/").filter(Boolean).pop() ?? "overview"}
              </span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="relative hidden md:block">
                <Search01Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder="Search users, orgs…"
                  onFocus={() => {
                    if (activePrimary.id !== "users") navigate("/users/all");
                  }}
                  className="h-9 w-52 lg:w-60 rounded-full bg-muted/60 border border-transparent pl-9 pr-3 text-[13px] outline-none placeholder:text-muted-foreground/70 focus:border-border focus:bg-muted"
                />
              </div>

              {/* 3-Theme Mode Selector in Topbar */}
              <ModeToggle variant="outline" />
            </div>
          </header>

          <div className="h-[calc(100%-56px)] w-full overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
