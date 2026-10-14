import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Activity, Users, Settings, LogOut, Database, AlertTriangle, Moon, Sun, X } from "lucide-react";
import { SidebarLeftIcon } from "hugeicons-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { useTheme } from "./theme-provider";
import { useAuth } from "../lib/auth-context";

const mainNavItems = [
  { name: "Overview", href: "/", icon: Activity, end: true },
  { name: "Users", href: "/users", icon: Users },
  { name: "Alerts", href: "/alerts", icon: AlertTriangle },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const initial = user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'A';

  const ProfileButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div className="relative" ref={menuRef}>
        {isOpen && (
          <div className="absolute bottom-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2 w-52 rounded-xl border bg-card text-card-foreground shadow-xl overflow-hidden z-50">
            <div className="p-3 border-b border-border/50">
              <p className="text-sm font-medium truncate">{user?.name ?? 'Admin User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email ?? ''}</p>
              {user?.role && (
                <span className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {user.role.replace('_', ' ')}
                </span>
              )}
            </div>
            <div className="p-2 space-y-2">
              <div className="px-2 pt-1 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Settings className="h-3 w-3" />
                Theme
              </div>
              <div className="grid grid-cols-2 gap-1 px-1">
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex items-center justify-center gap-2 rounded-md py-1.5 text-xs font-medium transition-colors ${theme === "dark" ? "bg-primary/20 text-primary border border-primary/30" : "hover:bg-muted text-muted-foreground"}`}
                >
                  <Moon className="h-3 w-3" />
                  Dark
                </button>
                <button
                  onClick={() => setTheme("light")}
                  className={`flex items-center justify-center gap-2 rounded-md py-1.5 text-xs font-medium transition-colors ${theme === "light" ? "bg-primary/20 text-primary border border-primary/30" : "hover:bg-muted text-muted-foreground"}`}
                >
                  <Sun className="h-3 w-3" />
                  Light
                </button>
              </div>
            </div>
            <div className="p-2 border-t border-border/50">
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 hover:border-primary/60 transition-colors"
          title="Profile & Settings"
        >
          <span className="text-xs font-bold text-primary">{initial}</span>
        </button>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen w-full bg-background relative">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="relative z-50 flex w-64 flex-col border-r bg-background shadow-lg">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <div className="flex items-center gap-2 font-semibold">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Database className="h-4 w-4" />
                </span>
                <span>Codeward Admin</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto py-2">
              <nav className="grid items-start px-2 text-sm font-medium gap-1">
                {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      end={item.end}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive ? "bg-muted text-primary" : "text-muted-foreground hover:text-primary hover:bg-muted/50"}`
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Primary Sidebar — Icon-only strip */}
      <div className="hidden md:flex md:flex-col w-[56px] border-r bg-muted/30 sticky top-0 h-screen shrink-0 z-20">
        {/* Logo */}
        <div className="flex items-center justify-center h-[60px] border-b shrink-0">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/20">
            <Database className="h-4 w-4" />
          </span>
        </div>

        {/* Nav Icons */}
        <nav className="flex-1 flex flex-col items-center gap-1 py-3 px-1.5">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            // Check if this route is active (for /users, match any /users/* path)
            const isActive = item.end
              ? location.pathname === item.href
              : location.pathname.startsWith(item.href);

            return (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.end}
                className={`flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-150 group relative ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                title={item.name}
              >
                <Icon className="h-[18px] w-[18px]" />
                {/* Tooltip on hover */}
                <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-popover text-popover-foreground text-xs font-medium shadow-md border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Profile at bottom */}
        <div className="flex items-center justify-center pb-3 shrink-0">
          <ProfileButton />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile-only top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 md:hidden shrink-0">
          <Button variant="outline" size="icon" className="shrink-0" onClick={() => setIsMobileMenuOpen(true)}>
            <SidebarLeftIcon className="h-5 w-5" />
            <span className="sr-only">Toggle navigation</span>
          </Button>
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Database className="h-4 w-4" />
            </span>
            <span>Codeward Admin</span>
          </div>
        </header>

        {/* Page content — Outlet renders UsersLayout (with its own secondary sidebar) or other pages */}
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
