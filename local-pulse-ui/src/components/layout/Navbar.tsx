import { Link } from "@tanstack/react-router";
import { Bell, Search, MapPin } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { Input } from "@/components/ui/input";

export function Navbar() {
  const { user } = useApp();
  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b">
      <div className="h-16 px-4 md:px-6 flex items-center gap-3">
        <Link to="/dashboard" className="lg:hidden flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary grid place-items-center text-primary-foreground">
            <MapPin className="h-4 w-4" />
          </div>
          <span className="font-bold">LocalPulse</span>
        </Link>
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search issues, events, providers..." className="pl-9 h-10 rounded-xl" />
          </div>
        </div>
        <div className="flex-1 md:hidden" />
        <Link
          to="/notifications"
          className="relative h-10 w-10 rounded-full grid place-items-center hover:bg-muted"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-primary" />
        </Link>
        <Link to="/profile" className="flex items-center gap-2">
          <img
            src={user?.avatarUrl}
            alt={user?.name}
            className="h-9 w-9 rounded-full object-cover border"
          />
          <div className="hidden md:block leading-tight">
            <div className="text-sm font-semibold">{user?.name}</div>
            <div className="text-xs text-muted-foreground">{user?.city}</div>
          </div>
        </Link>
      </div>
    </header>
  );
}
