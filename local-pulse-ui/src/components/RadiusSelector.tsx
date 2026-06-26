import { RADIUS_OPTIONS } from "@/constants";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

export function RadiusSelector({ className }: { className?: string }) {
  const { radiusKm, setRadiusKm } = useApp();
  return (
    <div className={cn("inline-flex items-center gap-1 p-1 rounded-xl bg-muted", className)}>
      <span className="px-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" /> Radius
      </span>
      {RADIUS_OPTIONS.map((r) => (
        <button
          key={r}
          onClick={() => setRadiusKm(r)}
          className={cn(
            "px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors",
            radiusKm === r ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {r} km
        </button>
      ))}
    </div>
  );
}
