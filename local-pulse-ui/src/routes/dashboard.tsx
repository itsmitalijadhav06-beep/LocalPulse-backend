import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { RadiusSelector } from "@/components/RadiusSelector";
import { IssueCard } from "@/components/IssueCard";
import { EventCard } from "@/components/EventCard";
import { ProviderCard } from "@/components/ProviderCard";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { SkeletonCard } from "@/components/SkeletonCard";
import { dashboardService } from "@/services/dashboard.service";
import { useApp } from "@/contexts/AppContext";
import { ArrowRight, FileText, CheckCircle2, AlertTriangle, Users, MapPin, Navigation } from "lucide-react";
import { LocationPicker } from "@/components/LocationPicker";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LocalPulse" }] }),
  component: Dashboard,
});

import { useRouteGuard } from "@/hooks/useRouteGuard";
import { Loader2 } from "lucide-react";

function Dashboard() {
  const { isLoading: guardLoading, user } = useRouteGuard(["citizen", "admin"]);
  const { radiusKm, userLocation, setUserLocation, detectLocation, isDetectingLocation } = useApp();
  const [showPicker, setShowPicker] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard", radiusKm, userLocation.latitude, userLocation.longitude],
    queryFn: () =>
      dashboardService
        .overview({
          radiusKm,
          ...(userLocation.isSet
            ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
            : {}),
        })
        .then((res) => res.data.data),
    enabled: !guardLoading,
  });

  if (guardLoading || isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  const stats = data?.stats;
  const nearbyIssues = data?.nearbyIssues ?? [];
  const nearbyEvents = data?.nearbyEvents ?? [];
  const nearbyProviders = data?.nearbyProviders ?? [];

  const statCards = stats
    ? [
        { label: "Total Reports", value: stats.totalReports ?? 0, icon: FileText, color: "text-secondary bg-secondary/10" },
        { label: "Open", value: stats.openIssues ?? 0, icon: AlertTriangle, color: "text-[color:var(--status-open)] bg-[color:var(--status-open)]/10" },
        { label: "Resolved", value: stats.resolvedIssues ?? 0, icon: CheckCircle2, color: "text-[color:var(--status-resolved)] bg-[color:var(--status-resolved)]/10" },
        { label: "Citizens", value: stats.users ?? 0, icon: Users, color: "text-primary bg-primary/10" },
      ]
    : [];

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-primary to-[color:var(--civic-orange)] text-primary-foreground p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-sm opacity-90">Namaste{user?.name ? `, ${user.name}` : ""} 👋</p>
              <h1 className="text-2xl md:text-3xl font-extrabold mt-1">Your neighborhood, in one view</h1>
              <p className="text-sm opacity-90 mt-2 max-w-lg">
                {stats
                  ? `${stats.openIssues ?? 0} issues need attention near you.`
                  : "Loading your neighborhood updates..."}
              </p>
              {/* Location display */}
              <button
                onClick={() => setShowPicker(true)}
                className="mt-3 inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
              >
                <MapPin className="h-3.5 w-3.5" />
                {userLocation.isSet ? userLocation.city : "Set your location"}
              </button>
            </div>
            <Link
              to="/report"
              className="self-start md:self-end inline-flex items-center gap-2 rounded-xl bg-background text-foreground px-4 py-2.5 font-semibold shadow hover:bg-background/90"
            >
              Report Issue <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Location prompt banner if not set */}
        {!userLocation.isSet && (
          <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
            <Navigation className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Location not set
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Set your location to see nearby issues, events and providers
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-amber-300"
                onClick={async () => {
                  await detectLocation();
                }}
                disabled={isDetectingLocation}
              >
                {isDetectingLocation ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Navigation className="h-3.5 w-3.5 mr-1" />
                    Auto-detect
                  </>
                )}
              </Button>
              <Button size="sm" className="h-8 text-xs" onClick={() => setShowPicker(true)}>
                <MapPin className="h-3.5 w-3.5 mr-1" />
                Pick on map
              </Button>
            </div>
          </div>
        )}

        {/* Stats */}
        {isError ? (
          <p className="text-sm text-destructive">Couldn't load dashboard data. Please try again.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((s) => (
              <div key={s.label} className="bg-card border rounded-2xl p-4 shadow-sm">
                <div className={"h-10 w-10 rounded-xl grid place-items-center " + s.color}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="mt-3 text-2xl font-extrabold">{(s.value ?? 0).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-xl font-bold">Nearby</h2>
          <RadiusSelector />
        </div>

        <section>
          <SectionHeader title="Nearby Issues" to="/feed" />
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              : nearbyIssues.map((i) => <IssueCard key={i.id} issue={i} />)}
          </div>
        </section>

        <section>
          <SectionHeader title="Nearby Events" to="/events" />
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              : nearbyEvents.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </section>

        <section>
          <SectionHeader title="Trusted Service Providers" to="/providers" />
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              : nearbyProviders.map((p) => <ProviderCard key={p.id} provider={p} />)}
          </div>
        </section>
      </div>

      <FloatingActionButton />

      {showPicker && (
        <LocationPicker
          value={userLocation.isSet ? userLocation : null}
          onChange={(loc) => {
            setUserLocation({ ...loc, isSet: true });
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </AppShell>
  );
}

function SectionHeader({ title, to }: { title: string; to: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-bold text-lg">{title}</h3>
      <Link to={to} className="text-sm font-semibold text-primary inline-flex items-center gap-1 hover:underline">
        View all <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
