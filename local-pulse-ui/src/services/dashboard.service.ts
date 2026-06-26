import api from "./api";
import type { APIResponse, AdminStats, Issue, Event, Provider } from "@/types";

export const dashboardService = {
  overview: (params?: { radiusKm?: number }) =>
    api.get<APIResponse<{
      stats: AdminStats;
      nearbyIssues: Issue[];
      nearbyEvents: Event[];
      nearbyProviders: Provider[];
    }>>("/dashboard", { params }),
  adminStats: () => api.get<APIResponse<AdminStats>>("/admin/stats"),
};
