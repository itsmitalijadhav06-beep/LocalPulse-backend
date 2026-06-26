import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { EventCard } from "@/components/EventCard";
import { SearchBar } from "@/components/SearchBar";
import { RadiusSelector } from "@/components/RadiusSelector";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard } from "@/components/SkeletonCard";
import { eventService } from "@/services/event.service";
import { useApp } from "@/contexts/AppContext";
import { CalendarX } from "lucide-react";

export const Route = createFileRoute("/events")({
  head: () => ({ meta: [{ title: "Local Events — LocalPulse" }] }),
  component: EventsPage,
});

import { useRouteGuard } from "@/hooks/useRouteGuard";
import { Loader2 } from "lucide-react";

function EventsPage() {
  const { isLoading: guardLoading } = useRouteGuard(["citizen", "admin"]);
  const [q, setQ] = useState("");
  const { radiusKm } = useApp();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["events", { radiusKm, q }],
    queryFn: () => eventService.list({ radiusKm, q: q || undefined }).then((res) => res.data.data),
    enabled: !guardLoading,
  });

  const interestedMutation = useMutation({
    mutationFn: (id: string) => eventService.markInterested(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  if (guardLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const events = data ?? [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">Local Events</h1>
            <p className="text-muted-foreground text-sm mt-1">What's happening in your neighborhood</p>
          </div>
          <RadiusSelector />
        </div>
        <SearchBar value={q} onChange={setQ} placeholder="Search events..." />
        {isError ? (
          <EmptyState icon={CalendarX} title="Couldn't load events" description="Please check your connection and try again." />
        ) : isLoading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : events.length === 0 ? (
          <EmptyState icon={CalendarX} title="No events found" description="Try a different radius or search term." />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {events.map((e) => (
              <EventCard key={e.id} event={e} onInterested={(id) => interestedMutation.mutate(id)} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}