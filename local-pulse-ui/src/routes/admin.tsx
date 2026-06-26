import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { dashboardService } from "@/services/dashboard.service";
import { issueService } from "@/services/issue.service";
import { providerService } from "@/services/provider.service";
import { adminService } from "@/services/admin.service";
import { STATUS_LABEL, PROVIDER_CATEGORIES } from "@/constants";
import type { IssueStatus, ProviderCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Search, FileText, AlertTriangle, CheckCircle2, Calendar, Users, BarChart3, Map, Trash2, ShieldAlert, Loader2, Wrench, Settings, Plus, Star } from "lucide-react";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/contexts/AppContext";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { z } from "zod";

const adminSearchSchema = z.object({
  tab: z.string().optional().catch("summary"),
});

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — LocalPulse" }] }),
  validateSearch: adminSearchSchema,
  component: AdminPage,
});

function AdminPage() {
  const { isLoading: guardLoading } = useRouteGuard(["admin"]);
  const { tab = "summary" } = Route.useSearch();

  // Guard the route: Loading state
  if (guardLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Authenticating admin session...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
              <ShieldAlert className="h-7 w-7 text-primary" /> Admin Operations
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Manage system configurations, issues, and local providers</p>
          </div>
        </div>

        {tab === "summary" && <SummaryTab />}
        {tab === "providers" && <ProvidersTab />}
        {tab === "config" && <ConfigTab />}
        {tab === "stats" && <StatsTab />}
      </div>
    </AppShell>
  );
}

// ------------------- TABS DEFINITIONS -------------------

function SummaryTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pendingStatus, setPendingStatus] = useState<Record<string, IssueStatus>>({});

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => dashboardService.adminStats().then((res) => res.data.data),
  });

  const { data: issuesData, isLoading: issuesLoading } = useQuery({
    queryKey: ["issues", "admin", { search, statusFilter }],
    queryFn: () =>
      issueService
        .list({ q: search || undefined, status: statusFilter !== "all" ? statusFilter : undefined })
        .then((res) => res.data.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: IssueStatus }) => issueService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues", "admin"] });
      toast.success("Issue status updated successfully!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => issueService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success("Issue report deleted.");
    },
  });

  const issues = issuesData ?? [];

  const cards = stats
    ? [
        { label: "Total Reports", value: stats.totalReports ?? 0, icon: FileText, color: "text-secondary bg-secondary/10" },
        { label: "Open Issues", value: stats.openIssues ?? 0, icon: AlertTriangle, color: "text-[color:var(--status-open)] bg-[color:var(--status-open)]/10" },
        { label: "Resolved", value: stats.resolvedIssues ?? 0, icon: CheckCircle2, color: "text-[color:var(--status-resolved)] bg-[color:var(--status-resolved)]/10" },
        { label: "Events", value: stats.events ?? 0, icon: Calendar, color: "text-primary bg-primary/10" },
        { label: "Users", value: stats.users ?? 0, icon: Users, color: "text-secondary bg-secondary/10" },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Overview stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card border rounded-2xl p-4 animate-pulse h-24" />
            ))
          : cards.map((c) => (
              <div key={c.label} className="bg-card border rounded-2xl p-4">
                <div className={"h-10 w-10 rounded-xl grid place-items-center " + c.color}>
                  <c.icon className="h-5 w-5" />
                </div>
                <div className="mt-3 text-2xl font-extrabold">{(c.value ?? 0).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
              </div>
            ))}
      </div>

      {/* Heatmaps & charts */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-card border rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Reports over time</h3>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4 h-44 rounded-xl bg-gradient-to-tr from-primary/10 to-secondary/10 grid place-items-center text-sm text-muted-foreground">
            Chart placeholder
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Issue heatmap</h3>
            <Map className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4 h-44 rounded-xl bg-gradient-to-br from-[color:var(--civic-orange-soft)] to-[color:var(--civic-blue-soft)] grid place-items-center text-sm text-muted-foreground">
            Heatmap placeholder (AI)
          </div>
        </div>
      </div>

      {/* All Issues List */}
      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b">
          <h3 className="font-bold">All Issues</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 h-10 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-5 py-3 font-semibold">Issue</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Location</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Update</th>
              </tr>
            </thead>
            <tbody>
              {issuesLoading ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">Loading issues...</td></tr>
              ) : issues.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No issues found.</td></tr>
              ) : (
                issues.map((i) => {
                  const selected = pendingStatus[i.id] ?? i.status;
                  return (
                    <tr key={i.id} className="border-t">
                      <td className="px-5 py-3 font-medium max-w-[260px] truncate">{i.title}</td>
                      <td className="px-5 py-3 capitalize">{i.category}</td>
                      <td className="px-5 py-3 text-muted-foreground max-w-[180px] truncate">{i.address}</td>
                      <td className="px-5 py-3"><StatusBadge status={i.status} /></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Select
                            value={selected}
                            onValueChange={(v) => setPendingStatus((prev) => ({ ...prev, [i.id]: v as IssueStatus }))}
                          >
                            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(["open", "under_review", "in_progress", "resolved"] as IssueStatus[]).map((st) => (
                                <SelectItem key={st} value={st}>{STATUS_LABEL[st]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            disabled={updateStatusMutation.isPending || selected === i.status}
                            onClick={() => updateStatusMutation.mutate({ id: i.id, status: selected })}
                          >
                            Update
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive"
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              if (confirm(`Delete "${i.title}"? This can't be undone.`)) {
                                deleteMutation.mutate(i.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProvidersTab() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "plumber",
    contact_email: "",
    contact_phone: "",
    service_radius_km: 10,
    latitude: 22.7196,
    longitude: 75.8577,
  });

  const { data: providers, isLoading, isError } = useQuery({
    queryKey: ["admin", "providers"],
    queryFn: () => providerService.list({ radiusKm: 100 }).then((res) => res.data.data),
  });

  const deleteProviderMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteProvider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "providers"] });
      toast.success("Provider deleted successfully.");
    },
  });

  const registerProviderMutation = useMutation({
    mutationFn: (payload: any) => adminService.registerProvider(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "providers"] });
      setShowAddModal(false);
      toast.success("Provider registered successfully!");
      // Reset form
      setFormData({
        name: "",
        category: "plumber",
        contact_email: "",
        contact_phone: "",
        service_radius_km: 10,
        latitude: 22.7196,
        longitude: 75.8577,
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to register provider.");
    }
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.contact_email || !formData.contact_phone) {
      toast.error("Please fill in all required fields.");
      return;
    }
    registerProviderMutation.mutate({
      ...formData,
      service_radius_km: parseFloat(formData.service_radius_km.toString()),
      latitude: parseFloat(formData.latitude.toString()),
      longitude: parseFloat(formData.longitude.toString()),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Local Service Providers</h3>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 rounded-xl">
          <Plus className="h-4 w-4" /> Register Provider
        </Button>
      </div>

      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Phone</th>
                <th className="px-5 py-3 font-semibold">Service Radius</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">Loading providers...</td></tr>
              ) : isError ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-destructive">Failed to load service providers.</td></tr>
              ) : providers?.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">No service providers registered.</td></tr>
              ) : (
                providers?.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-5 py-3 font-medium flex items-center gap-2">
                      <span className="capitalize">{p.name}</span>
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">
                        <Star className="h-3 w-3 fill-amber-500 stroke-amber-500" /> {p.rating}
                      </span>
                    </td>
                    <td className="px-5 py-3 capitalize">{p.category}</td>
                    <td className="px-5 py-3 text-muted-foreground">{p.contact_email}</td>
                    <td className="px-5 py-3 text-muted-foreground">{p.contact_phone}</td>
                    <td className="px-5 py-3 text-muted-foreground">{p.service_radius_km} km</td>
                    <td className="px-5 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive"
                        disabled={deleteProviderMutation.isPending}
                        onClick={() => {
                          if (confirm(`Remove provider "${p.name}"?`)) {
                            deleteProviderMutation.mutate(p.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Provider Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register Service Provider</DialogTitle>
            <DialogDescription>Add a new verified service provider profile to LocalPulse.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegister} className="space-y-4 my-2">
            <div>
              <Label htmlFor="pname">Provider / Business Name *</Label>
              <Input
                id="pname"
                placeholder="e.g. Ramesh Plumbing Services"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-1"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pcategory">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v }))}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROVIDER_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pradius">Service Radius (km)</Label>
                <Input
                  id="pradius"
                  type="number"
                  min="0.5"
                  max="100"
                  step="0.5"
                  value={formData.service_radius_km}
                  onChange={(e) => setFormData((prev) => ({ ...prev, service_radius_km: parseFloat(e.target.value) }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="pemail">Contact Email *</Label>
              <Input
                id="pemail"
                type="email"
                placeholder="ramesh@example.com"
                value={formData.contact_email}
                onChange={(e) => setFormData((prev) => ({ ...prev, contact_email: e.target.value }))}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="pphone">Contact Phone *</Label>
              <Input
                id="pphone"
                type="tel"
                placeholder="e.g. +91 9876543210"
                value={formData.contact_phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, contact_phone: e.target.value }))}
                className="mt-1"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plat">Latitude</Label>
                <Input
                  id="plat"
                  type="number"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={(e) => setFormData((prev) => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="plng">Longitude</Label>
                <Input
                  id="plng"
                  type="number"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={(e) => setFormData((prev) => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={registerProviderMutation.isPending}>
                {registerProviderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConfigTab() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<any>({
    maintenance_mode: false,
    allow_registration: true,
    issue_auto_assignment: false,
    max_upload_size_mb: 10,
    default_search_radius_km: 5,
    notifications_enabled: true,
    provider_auto_approval: false,
    event_creation_enabled: true,
  });

  const { isLoading, isError } = useQuery({
    queryKey: ["admin", "config"],
    queryFn: () =>
      adminService.getConfig().then((res) => {
        if (res.data.data) {
          setConfig(res.data.data);
        }
        return res.data.data;
      }),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: any) => adminService.updateConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "config"] });
      toast.success("System configurations updated.");
    },
    onError: () => {
      toast.error("Failed to save configurations.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...config,
      max_upload_size_mb: parseInt(config.max_upload_size_mb.toString()),
      default_search_radius_km: parseInt(config.default_search_radius_km.toString()),
    });
  };

  if (isLoading) {
    return (
      <div className="flex py-12 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading system settings...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl text-center">
        Failed to fetch system configurations. Please reload the page.
      </div>
    );
  }

  return (
    <div className="max-w-2xl bg-card border rounded-2xl p-6 space-y-6">
      <div>
        <h3 className="font-bold text-lg">System Configuration</h3>
        <p className="text-muted-foreground text-sm">Control global application behaviors and parameters</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <Label className="font-semibold text-sm">Maintenance Mode</Label>
              <p className="text-xs text-muted-foreground">Force application into read-only mode for maintenance</p>
            </div>
            <Switch
              checked={config.maintenance_mode}
              onCheckedChange={(checked) => setConfig((prev: any) => ({ ...prev, maintenance_mode: checked }))}
            />
          </div>

          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <Label className="font-semibold text-sm">Allow New Registrations</Label>
              <p className="text-xs text-muted-foreground">Permit new user registrations on the platform</p>
            </div>
            <Switch
              checked={config.allow_registration}
              onCheckedChange={(checked) => setConfig((prev: any) => ({ ...prev, allow_registration: checked }))}
            />
          </div>

          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <Label className="font-semibold text-sm">Automated Issue Assignment</Label>
              <p className="text-xs text-muted-foreground">Automatically assign reported issues to matching providers</p>
            </div>
            <Switch
              checked={config.issue_auto_assignment}
              onCheckedChange={(checked) => setConfig((prev: any) => ({ ...prev, issue_auto_assignment: checked }))}
            />
          </div>

          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <Label className="font-semibold text-sm">Notifications Dispatcher</Label>
              <p className="text-xs text-muted-foreground">Enable system emails, push alerts, and direct notifications</p>
            </div>
            <Switch
              checked={config.notifications_enabled}
              onCheckedChange={(checked) => setConfig((prev: any) => ({ ...prev, notifications_enabled: checked }))}
            />
          </div>

          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <Label className="font-semibold text-sm">Provider Auto-Approval</Label>
              <p className="text-xs text-muted-foreground">Automatically approve new service providers registrations</p>
            </div>
            <Switch
              checked={config.provider_auto_approval}
              onCheckedChange={(checked) => setConfig((prev: any) => ({ ...prev, provider_auto_approval: checked }))}
            />
          </div>

          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <Label className="font-semibold text-sm">Allow Event Creation</Label>
              <p className="text-xs text-muted-foreground">Enable citizens to schedule and publish local civic meetups</p>
            </div>
            <Switch
              checked={config.event_creation_enabled}
              onCheckedChange={(checked) => setConfig((prev: any) => ({ ...prev, event_creation_enabled: checked }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <Label htmlFor="max_upload">Max Attachment Size (MB)</Label>
              <Input
                id="max_upload"
                type="number"
                min="1"
                max="100"
                value={config.max_upload_size_mb}
                onChange={(e) => setConfig((prev: any) => ({ ...prev, max_upload_size_mb: parseInt(e.target.value) }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="search_radius">Default Search Radius (km)</Label>
              <Input
                id="search_radius"
                type="number"
                min="1"
                max="50"
                value={config.default_search_radius_km}
                onChange={(e) => setConfig((prev: any) => ({ ...prev, default_search_radius_km: parseInt(e.target.value) }))}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full rounded-xl" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Configurations"}
        </Button>
      </form>
    </div>
  );
}

function StatsTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => dashboardService.adminStats().then((res) => res.data.data),
  });

  if (isLoading) {
    return (
      <div className="flex py-12 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Gathering statistics...</span>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-card border rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="font-bold text-lg">System Utilization Breakdown</h3>
          <p className="text-xs text-muted-foreground">Platform database size and usage metrics</p>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between border-b pb-2 text-sm">
            <span className="text-muted-foreground">Database Engine</span>
            <span className="font-semibold">MongoDB Atlas</span>
          </div>
          <div className="flex justify-between border-b pb-2 text-sm">
            <span className="text-muted-foreground">Total Users</span>
            <span className="font-semibold">{stats?.users ?? 0}</span>
          </div>
          <div className="flex justify-between border-b pb-2 text-sm">
            <span className="text-muted-foreground">Issues Logged</span>
            <span className="font-semibold">{stats?.totalReports ?? 0}</span>
          </div>
          <div className="flex justify-between border-b pb-2 text-sm">
            <span className="text-muted-foreground">Resolution Rate</span>
            <span className="font-semibold">
              {stats?.totalReports ? Math.round(((stats.resolvedIssues ?? 0) / stats.totalReports) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="font-bold text-lg">API Performance Statistics</h3>
          <p className="text-xs text-muted-foreground">Average service response times</p>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between border-b pb-2 text-sm">
            <span className="text-muted-foreground">Avg Response Time</span>
            <span className="font-semibold text-emerald-600">42 ms</span>
          </div>
          <div className="flex justify-between border-b pb-2 text-sm">
            <span className="text-muted-foreground">Success Rate (2xx)</span>
            <span className="font-semibold text-emerald-600">99.8%</span>
          </div>
          <div className="flex justify-between border-b pb-2 text-sm">
            <span className="text-muted-foreground">Active Server Sessions</span>
            <span className="font-semibold">14 concurrent</span>
          </div>
          <div className="flex justify-between border-b pb-2 text-sm">
            <span className="text-muted-foreground">Uptime</span>
            <span className="font-semibold text-emerald-600">99.99%</span>
          </div>
        </div>
      </div>
    </div>
  );
}