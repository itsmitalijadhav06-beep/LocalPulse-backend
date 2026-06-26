import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Search, MapPin, ChevronDown, LogOut, Settings, User as UserIcon, ShieldCheck } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { LocationPicker } from "@/components/LocationPicker";
import { notificationService } from "@/services/notification.service";
import { authService } from "@/services/auth.service";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, userLocation, setUserLocation, logout } = useApp();
  const navigate = useNavigate();
  const [showPicker, setShowPicker] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const locationLabel = userLocation.isSet ? userLocation.city : "Set location";

  // Real unread notification count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: !!user,
    refetchInterval: 60_000, // poll every 60s
    staleTime: 30_000,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({ to: "/feed", search: { q: searchQuery } as any });
    }
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    try {
      await authService.logout();
    } catch {
      // ignore — log out client-side regardless
    } finally {
      logout();
      navigate({ to: "/" });
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <>
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b">
        <div className="h-16 px-4 md:px-6 flex items-center gap-3">
          {/* Logo — mobile */}
          <Link to={isAdmin ? "/admin" : "/dashboard"} className="lg:hidden flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary grid place-items-center text-primary-foreground">
              <MapPin className="h-4 w-4" />
            </div>
            <span className="font-bold">LocalPulse</span>
          </Link>

          {/* Search bar — citizens only */}
          {!isAdmin && (
            <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 flex-1 max-w-xl">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search issues, events, providers..."
                  className="w-full pl-9 h-10 rounded-xl border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 px-3"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          )}

          {/* Admin label */}
          {isAdmin && (
            <div className="hidden md:flex items-center gap-2 flex-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <ShieldCheck className="h-3.5 w-3.5" /> Admin Panel
              </span>
            </div>
          )}

          <div className="flex-1 md:hidden" />

          {/* Location button — citizens only */}
          {!isAdmin && (
            <button
              onClick={() => setShowPicker(true)}
              className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border rounded-lg px-2.5 py-1.5 hover:bg-muted transition-colors max-w-[160px]"
            >
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate font-medium" suppressHydrationWarning>{locationLabel}</span>
              <ChevronDown className="h-3 w-3 shrink-0" />
            </button>
          )}

          {/* Notification bell */}
          <Link
            to="/notifications"
            className="relative h-10 w-10 rounded-full grid place-items-center hover:bg-muted"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold grid place-items-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Avatar dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown((v) => !v)}
              className="flex items-center gap-2 rounded-full focus:outline-none"
              aria-label="User menu"
            >
              <img
                src={user?.avatarUrl}
                alt={user?.name}
                className="h-9 w-9 rounded-full object-cover border"
              />
              <div className="hidden md:block leading-tight text-left">
                <div className="text-sm font-semibold">{user?.name}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {user?.role || "citizen"}
                </div>
              </div>
              <ChevronDown className="hidden md:block h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-popover border rounded-xl shadow-lg py-1 z-50">
                <div className="px-4 py-2.5 border-b">
                  <div className="text-sm font-semibold truncate">{user?.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                >
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Settings
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    search={{ tab: "summary" } as any}
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    Admin Panel
                  </Link>
                )}
                <div className="border-t mt-1" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showPicker && (
        <LocationPicker
          value={userLocation.isSet ? userLocation : null}
          onChange={(loc) => setUserLocation({ ...loc, isSet: true })}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
