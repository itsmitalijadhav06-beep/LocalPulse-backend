import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { ProviderCard } from "@/components/ProviderCard";
import { SearchBar } from "@/components/SearchBar";
import { CategoryChips } from "@/components/CategoryChips";
import { RadiusSelector } from "@/components/RadiusSelector";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard } from "@/components/SkeletonCard";
import { providerService } from "@/services/provider.service";
import { useApp } from "@/contexts/AppContext";
import { PROVIDER_CATEGORIES } from "@/constants";
import { Wrench } from "lucide-react";

export const Route = createFileRoute("/providers")({
  head: () => ({ meta: [{ title: "Service Providers — LocalPulse" }] }),
  component: ProvidersPage,
});

import { useRouteGuard } from "@/hooks/useRouteGuard";
import { Loader2 } from "lucide-react";

function ProvidersPage() {
  const { isLoading: guardLoading } = useRouteGuard(["citizen", "provider", "admin"]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const { radiusKm } = useApp();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["providers", { radiusKm, cat, q }],
    queryFn: () =>
      providerService
        .list({ radiusKm, category: cat ?? undefined, q: q || undefined })
        .then((res) => res.data.data),
    enabled: !guardLoading,
  });

  if (guardLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const list = data ?? [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">Service Providers</h1>
            <p className="text-muted-foreground text-sm mt-1">Trusted local help, rated by your neighbors</p>
          </div>
          <RadiusSelector />
        </div>
        <SearchBar value={q} onChange={setQ} placeholder="Search providers..." />
        <CategoryChips chips={PROVIDER_CATEGORIES} value={cat} onChange={setCat} />
        {isError ? (
          <EmptyState icon={Wrench} title="Couldn't load providers" description="Please check your connection and try again." />
        ) : isLoading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : list.length === 0 ? (
          <EmptyState icon={Wrench} title="No providers found" description="Try a different category or radius." />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {list.map((p) => <ProviderCard key={p.id} provider={p} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}