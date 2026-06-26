import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Search, MapPin, ChevronDown } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { Input } from "@/components/ui/input";
import { LocationPicker } from "@/components/LocationPicker";

export function Navbar() {
  const { user, userLocation, setUserLocation } = useApp();
  const [showPicker, setShowPicker] = useState(false);

  const locationLabel = userLocation.isSet ? userLocation.city : "Set location";

  return (
    <>
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

          {/* Location button */}
          <button
            onClick={() => setShowPicker(true)}
            className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border rounded-lg px-2.5 py-1.5 hover:bg-muted transition-colors max-w-[160px]"
          >
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate font-medium">{locationLabel}</span>
            <ChevronDown className="h-3 w-3 shrink-0" />
          </button>

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
              <div className="text-xs text-muted-foreground">
                {userLocation.isSet ? userLocation.city : user?.city || "Set location"}
              </div>
            </div>
          </Link>
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
