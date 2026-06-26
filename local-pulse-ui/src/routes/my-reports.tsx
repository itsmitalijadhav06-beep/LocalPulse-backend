import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { IssueCard } from "@/components/IssueCard";
import { issueService } from "@/services/issue.service";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard } from "@/components/SkeletonCard";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/my-reports")({
  head: () => ({ meta: [{ title: "My Reports — LocalPulse" }] }),
  component: MyReportsPage,
});

import { useRouteGuard } from "@/hooks/useRouteGuard";
import { Loader2 } from "lucide-react";

function MyReportsPage() {
  const { isLoading: guardLoading } = useRouteGuard(["citizen", "admin"]);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["issues", "mine"],
    queryFn: () => issueService.myReports().then((res) => res.data.data),
    enabled: !guardLoading,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => issueService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["issues", "mine"] }),
  });

  if (guardLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const mine = data ?? [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">My Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Track issues you've reported</p>
        </div>
        {isError ? (
          <EmptyState icon={FileText} title="Couldn't load your reports" description="Please check your connection and try again." />
        ) : isLoading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : mine.length === 0 ? (
          <EmptyState icon={FileText} title="No reports yet" description="Your reported issues will appear here." actionLabel="Report your first issue" />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {mine.map((i) => (
              <div key={i.id} className="space-y-2">
                <IssueCard issue={i} />
                <button
                  onClick={() => {
                    if (confirm("Delete this report? This can't be undone.")) {
                      deleteMutation.mutate(i.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="w-full text-xs font-semibold text-destructive hover:underline py-1 disabled:opacity-50"
                >
                  Delete report
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}