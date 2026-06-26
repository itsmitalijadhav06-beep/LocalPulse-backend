import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Newspaper, Calendar, Wrench, UserIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/feed", label: "Feed", icon: Newspaper },
  { to: "/report", label: "", icon: Plus, action: true },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/providers", label: "Services", icon: Wrench, mobileAlt: UserIcon },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background border-t pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-5 h-16">
        {items.map((it) => {
          if (it.action) {
            return (
              <li key="report" className="grid place-items-center">
                <Link
                  to={it.to}
                  className="-mt-7 h-14 w-14 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/30"
                  aria-label="Report Issue"
                >
                  <it.icon className="h-7 w-7" />
                </Link>
              </li>
            );
          }
          const active = pathname === it.to;
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                className={cn(
                  "h-full flex flex-col items-center justify-center gap-0.5 text-[11px]",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <it.icon className="h-5 w-5" />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
