import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Newspaper, Calendar, Wrench, FileText,
  Bell, User as UserIcon, Settings, ShieldCheck, PlusCircle, MapPin,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useApp } from "@/contexts/AppContext";

interface SidebarItem {
  to: string;
  label: string;
  icon: any;
  search?: { tab: string };
  sub?: boolean;
}

const items: SidebarItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/feed", label: "Issue Feed", icon: Newspaper },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/providers", label: "Providers", icon: Wrench },
  { to: "/my-reports", label: "My Reports", icon: FileText },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: UserIcon },
  { to: "/settings", label: "Settings", icon: Settings },
];

const adminItems: SidebarItem[] = [
  { to: "/admin", search: { tab: "summary" }, label: "Admin", icon: ShieldCheck },
  { to: "/admin", search: { tab: "summary" }, label: "Dashboard Summary", icon: FileText, sub: true },
  { to: "/admin", search: { tab: "providers" }, label: "Provider Management", icon: Wrench, sub: true },
  { to: "/admin", search: { tab: "config" }, label: "System Configuration", icon: Settings, sub: true },
  { to: "/admin", search: { tab: "stats" }, label: "Admin Statistics", icon: BarChart3, sub: true },
];

export function Sidebar() {
  const { user } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search }) as any;

  const visibleItems = [
    ...items,
    ...(user?.role === "admin" ? adminItems : []),
  ].filter((it) => {
    if (user?.role === "admin") {
      return true;
    }
    if (user?.role === "provider") {
      return ["/providers", "/profile", "/settings"].includes(it.to);
    }
    if (user?.role === "authority") {
      return ["/profile", "/settings"].includes(it.to);
    }
    // Default: Citizen
    return it.to !== "/admin";
  });

  const isActive = (it: any) => {
    const routeActive = pathname === it.to || (it.to !== "/dashboard" && pathname.startsWith(it.to));
    if (!routeActive) return false;
    if (it.search && it.search.tab !== search.tab) return false;
    return true;
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r bg-sidebar h-screen sticky top-0">
      <div className="flex items-center gap-2 px-5 h-16 border-b">
        <div className="h-9 w-9 rounded-xl bg-primary grid place-items-center text-primary-foreground">
          <MapPin className="h-5 w-5" />
        </div>
        <div>
          <div className="font-bold text-base leading-tight">LocalPulse</div>
          <div className="text-[11px] text-muted-foreground">Your city, your voice</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {visibleItems.map((it) => {
          const Active = isActive(it);
          return (
            <Link
              key={`${it.to}-${it.label}`}
              to={it.to}
              search={it.search}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                it.sub && "pl-8 text-xs py-1.5 opacity-80",
                Active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <it.icon className={cn("h-4 w-4", it.sub && "h-3.5 w-3.5")} />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t">
        <Link
          to="/report"
          className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary text-primary-foreground px-3 py-2.5 text-sm font-semibold shadow-sm hover:bg-primary/90"
        >
          <PlusCircle className="h-4 w-4" /> Report Issue
        </Link>
      </div>
    </aside>
  );
}
