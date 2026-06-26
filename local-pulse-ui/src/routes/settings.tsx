import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import api from "@/services/api";

const schema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  city: z.string().min(2, "City is too short"),
});

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — LocalPulse" }] }),
  component: SettingsPage,
});

import { useRouteGuard } from "@/hooks/useRouteGuard";

function SettingsPage() {
  const { isLoading: guardLoading, user } = useRouteGuard(["citizen", "provider", "authority", "admin"]);
  const { setUser } = useApp();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    values: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      city: user?.city ?? "",
    },
  });

  if (guardLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setApiError(null);
    setSaved(false);
    try {
      const res = await api.patch<{ success: boolean; data: typeof user }>("/auth/me", values);
      if (res.data.data) setUser(res.data.data as any);
      setSaved(true);
    } catch (err: any) {
      setApiError(err?.response?.data?.message ?? "Failed to save changes. Please try again.");
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your profile and preferences</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border rounded-2xl p-5 space-y-4">
            <h2 className="font-bold">Profile</h2>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" className="mt-1.5 h-11" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" className="mt-1.5 h-11" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" className="mt-1.5 h-11" {...register("city")} />
              {errors.city && <p className="text-xs text-destructive mt-1">{errors.city.message}</p>}
            </div>
          </div>

          <div className="bg-card border rounded-2xl p-5 space-y-4">
            <h2 className="font-bold">Notifications</h2>
            {[
              ["Status updates on my reports", true],
              ["New comments on my reports", true],
              ["New events nearby", false],
              ["Trending issues in my area", true],
            ].map(([label, def]) => (
              <div key={label as string} className="flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <Switch defaultChecked={def as boolean} />
              </div>
            ))}
          </div>

          {apiError && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{apiError}</p>}
          {saved && <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">Changes saved successfully.</p>}

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => navigate({ to: "/profile" })}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 h-11">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
