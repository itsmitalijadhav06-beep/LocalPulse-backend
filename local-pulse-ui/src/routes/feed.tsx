import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { IssueCard } from "@/components/IssueCard";
import { SearchBar } from "@/components/SearchBar";
import { CategoryChips } from "@/components/CategoryChips";
import { RadiusSelector } from "@/components/RadiusSelector";
import { EmptyState } from "@/components/EmptyState";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { SkeletonCard } from "@/components/SkeletonCard";
import { issueService } from "@/services/issue.service";
import { useApp } from "@/contexts/AppContext";
import { ISSUE_CATEGORIES } from "@/constants";
import { Newspaper } from "lucide-react";

export const Route = createFileRoute("/feed")({
  head: () => ({ meta: [{ title: "Issue Feed — LocalPulse" }] }),
  component: FeedPage,
});

import { useRouteGuard } from "@/hooks/useRouteGuard";
import { Loader2 } from "lucide-react";

function FeedPage() {
  const { isLoading: guardLoading } = useRouteGuard(["citizen", "admin"]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const { radiusKm } = useApp();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["issues", { radiusKm, cat, q }],
    queryFn: () =>
      issueService
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

  const issues = data ?? [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">Community Issue Feed</h1>
            <p className="text-muted-foreground text-sm mt-1">See what your neighbors are reporting</p>
          </div>
          <RadiusSelector />
        </div>
        <SearchBar value={q} onChange={setQ} placeholder="Search issues by title or area..." />
        <CategoryChips chips={ISSUE_CATEGORIES} value={cat} onChange={setCat} />
        {isError ? (
          <EmptyState icon={Newspaper} title="Couldn't load issues" description="Please check your connection and try again." />
        ) : isLoading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : issues.length === 0 ? (
          <EmptyState icon={Newspaper} title="No issues found" description="Try a different category or radius." />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {issues.map((i) => <IssueCard key={i.id} issue={i} />)}
          </div>
        )}
      </div>
      <FloatingActionButton />
    </AppShell>
  );
}