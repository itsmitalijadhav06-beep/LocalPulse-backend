import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { NotificationCard } from "@/components/NotificationCard";
import { notificationService } from "@/services/notification.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/SkeletonCard";
import { Bell } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — LocalPulse" }] }),
  component: NotificationsPage,
});

import { useRouteGuard } from "@/hooks/useRouteGuard";
import { Loader2 } from "lucide-react";

function NotificationsPage() {
  const { isLoading: guardLoading } = useRouteGuard(["citizen", "admin"]);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.list().then((res) => res.data.data),
    enabled: !guardLoading,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (guardLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const notifications = data ?? [];
  const unread = notifications.filter((n) => !n.read);

  const markAllRead = async () => {
    await Promise.all(unread.map((n) => markReadMutation.mutateAsync(n.id)));
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">Notifications</h1>
            <p className="text-muted-foreground text-sm mt-1">Stay updated on your reports and your neighborhood</p>
          </div>
          {unread.length > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} disabled={markReadMutation.isPending}>
              Mark all read
            </Button>
          )}
        </div>
        {isError ? (
          <EmptyState icon={Bell} title="Couldn't load notifications" description="Please check your connection and try again." />
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications yet" description="You'll see updates on your reports and neighborhood activity here." />
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} onClick={() => !n.read && markReadMutation.mutate(n.id)} className="cursor-pointer">
                <NotificationCard notif={n} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
