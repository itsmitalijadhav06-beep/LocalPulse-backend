import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Newspaper,
  Calendar,
  Wrench,
  FileText,
  Bell,
  User as UserIcon,
  Settings,
  ShieldCheck,
  PlusCircle,
  MapPin,
  BarChart3,
  Users,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";

interface SidebarItem {
  to: string;
  label: string;
  icon: any;
  search?: Record<string, string>;
  adminOnly?: boolean;
  citizenOnly?: boolean;
}

// ── CITIZEN navigation
const citizenItems: SidebarItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/feed", label: "Issue Feed", icon: Newspaper },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/providers", label: "Providers", icon: Wrench },
  { to: "/my-reports", label: "My Reports", icon: FileText },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: UserIcon },
  { to: "/settings", label: "Settings", icon: Settings },
];

// ── ADMIN navigation
const adminItems: SidebarItem[] = [
  { to: "/admin", search: { tab: "summary" }, label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin", search: { tab: "reports" }, label: "Reports", icon: ClipboardList },
  { to: "/admin", search: { tab: "users" }, label: "Users", icon: Users },
  { to: "/admin", search: { tab: "providers" }, label: "Providers", icon: Wrench },
  { to: "/admin", search: { tab: "events" }, label: "Events", icon: Calendar },
  { to: "/admin", search: { tab: "config" }, label: "System Config", icon: Settings },
  { to: "/admin", search: { tab: "stats" }, label: "Analytics", icon: BarChart3 },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: UserIcon },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { user } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search }) as any;

  const isAdmin = user?.role === "admin";
  const visibleItems = isAdmin ? adminItems : citizenItems;

  const isActive = (it: SidebarItem) => {
    const routeActive =
      pathname === it.to ||
      (it.to !== "/dashboard" && it.to !== "/admin" && pathname.startsWith(it.to));
    if (!routeActive) return false;
    if (it.search && it.search.tab !== search.tab) return false;
    return true;
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r bg-sidebar h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-16 border-b">
        <img src="/logo.jpg" alt="LocalPulse" className="h-9 w-9 rounded-xl object-cover" />
        <div>
          <div className="font-bold text-base leading-tight">LocalPulse</div>
          <div className="text-[11px] text-muted-foreground">
            {isAdmin ? "Admin Panel" : "Your city, your voice"}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {isAdmin && (
          <div className="px-3 py-1.5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Administration
            </span>
          </div>
        )}
        {visibleItems.map((it) => {
          const active = isActive(it);
          return (
            <Link
              key={`${it.to}-${it.label}`}
              to={it.to}
              search={it.search as any}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <it.icon className="h-4 w-4 shrink-0" />
              {it.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom CTA — citizens only */}
      {!isAdmin && (
        <div className="p-3 border-t">
          <Link
            to="/report"
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary text-primary-foreground px-3 py-2.5 text-sm font-semibold shadow-sm hover:bg-primary/90"
          >
            <PlusCircle className="h-4 w-4" />
            Report Issue
          </Link>
        </div>
      )}
    </aside>
  );
}
