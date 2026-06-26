import { Calendar, MapPin, Users, Share2, Heart } from "lucide-react";
import type { Event } from "@/types";
import { km } from "@/utils/format";
import { Button } from "./ui/button";

export function EventCard({ event, onInterested }: { event: Event; onInterested?: (id: string) => void }) {
  return (
    <article className="bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {event.posterUrl && (
        <div className="aspect-[16/9] bg-muted overflow-hidden relative">
          <img src={event.posterUrl} alt={event.title} className="h-full w-full object-cover" />
          {event.category && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-background/90 text-xs font-semibold">
              {event.category}
            </span>
          )}
        </div>
      )}
      <div className="p-4 space-y-3 flex-1 flex flex-col">
        <h3 className="font-semibold text-base leading-snug line-clamp-2">{event.title}</h3>
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-primary" />
            <span>{new Date(event.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })} • {event.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{event.address} • {km(event.distanceKm)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0 text-primary" />
            <span>{event.interestedCount} interested • by {event.organizer}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-auto pt-2">
          <Button size="sm" className="flex-1 gap-1.5" onClick={() => onInterested?.(event.id)}>
            <Heart className="h-4 w-4" /> Interested
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Share2 className="h-4 w-4" /> Share
          </Button>
        </div>
      </div>
    </article>
  );
}