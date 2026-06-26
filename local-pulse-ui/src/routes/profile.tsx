import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { authService } from "@/services/auth.service";
import { Award, FileText, ArrowUp, MapPin, LogOut, Settings } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — LocalPulse" }] }),
  component: ProfilePage,
});

import { useRouteGuard } from "@/hooks/useRouteGuard";
import { Loader2 } from "lucide-react";

function ProfilePage() {
  const { isLoading: guardLoading, user } = useRouteGuard(["citizen", "provider", "authority", "admin"]);
  const { logout } = useApp();
  const navigate = useNavigate();

  if (guardLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    { label: "Reports", value: user.reportsCount, icon: FileText },
    { label: "Upvotes Given", value: user.upvotesGiven, icon: ArrowUp },
    { label: "Score", value: user.contributionScore, icon: Award },
  ];

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore errors — log out client-side regardless
    } finally {
      logout();
      navigate({ to: "/" });
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-primary to-[color:var(--civic-orange)] text-primary-foreground rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-4">
            {user.avatarUrl && (
              <img src={user.avatarUrl} alt={user.name} className="h-20 w-20 rounded-2xl border-4 border-primary-foreground/30 object-cover" />
            )}
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold truncate">{user.name}</h1>
              <p className="text-sm opacity-90 inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {user.city}</p>
              <p className="text-xs opacity-80 mt-1">{user.email}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-card border rounded-2xl p-4 text-center">
              <s.icon className="h-5 w-5 mx-auto text-primary" />
              <div className="mt-2 text-xl font-extrabold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="bg-card border rounded-2xl divide-y">
          <Link to="/my-reports" className="flex items-center justify-between p-4 hover:bg-muted/50">
            <span className="font-medium">My reports</span><FileText className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link to="/settings" className="flex items-center justify-between p-4 hover:bg-muted/50">
            <span className="font-medium">Settings</span><Settings className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
        <Button
          variant="outline"
          className="w-full h-11 gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" /> Log out
        </Button>
      </div>
    </AppShell>
  );
}
