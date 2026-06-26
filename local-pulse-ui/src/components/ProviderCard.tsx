import { Phone, Star, MapPin, BadgeCheck } from "lucide-react";
import type { Provider } from "@/types";
import { km } from "@/utils/format";
import { Button } from "./ui/button";
import { PROVIDER_CATEGORIES } from "@/constants";

export function ProviderCard({ provider }: { provider: Provider }) {
  const cat = PROVIDER_CATEGORIES.find((c) => c.value === provider.category);
  return (
    <article className="bg-card border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        <img src={provider.photoUrl} alt={provider.name} className="h-16 w-16 rounded-xl object-cover shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold truncate">{provider.name}</h3>
            {provider.verified && <BadgeCheck className="h-4 w-4 text-secondary shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground">{cat?.emoji} {cat?.label}</p>
          <div className="flex items-center gap-1 mt-1 text-sm">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{provider.rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({provider.reviewsCount})</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        <span className="truncate">{provider.address}</span>
        <span>•</span>
        <span className="shrink-0">{km(provider.distanceKm)}</span>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" className="flex-1 gap-1.5">
          <Phone className="h-4 w-4" /> Call
        </Button>
        <Button size="sm" variant="outline" className="flex-1">View Profile</Button>
      </div>
    </article>
  );
}
