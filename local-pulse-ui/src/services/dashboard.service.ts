import api from "./api";
import type { APIResponse, AdminStats, Issue, Event, Provider } from "@/types";

import { issueService } from "./issue.service";
import { eventService } from "./event.service";
import { providerService } from "./provider.service";

export const dashboardService = {
  overview: async (params?: { radiusKm?: number; latitude?: number; longitude?: number }): Promise<{
    data: APIResponse<{
      stats: AdminStats | null;
      nearbyIssues: Issue[];
      nearbyEvents: Event[];
      nearbyProviders: Provider[];
    }>;
  }> => {
    // Fetch nearby data in parallel
    const [issuesRes, eventsRes, providersRes] = await Promise.all([
      issueService.list(params),
      eventService.list(params),
      providerService.list(params),
    ]);

    const nearbyIssues = issuesRes.data.data || [];
    const nearbyEvents = eventsRes.data.data || [];
    const nearbyProviders = providersRes.data.data || [];

    // Fetch system statistics conditionally
    let stats: AdminStats | null = null;
    try {
      const statsRes = await api.get<APIResponse<any>>("/admin/stats");
      const backendStats = statsRes.data.data;
      if (backendStats) {
        stats = {
          totalReports: backendStats.total_issues ?? 0,
          openIssues: backendStats.open_issues ?? 0,
          resolvedIssues: backendStats.resolved_issues ?? 0,
          events: backendStats.total_events ?? 0,
          users: backendStats.total_users ?? 0,
        };
      }
    } catch {
      // Default / fallback stats for citizens/providers (to prevent 403 crashes)
      stats = {
        totalReports: nearbyIssues.length,
        openIssues: nearbyIssues.filter((i) => i.status === "open").length,
        resolvedIssues: nearbyIssues.filter((i) => i.status === "resolved").length,
        events: nearbyEvents.length,
        users: 1,
      };
    }

    return {
      data: {
        success: true,
        data: {
          stats,
          nearbyIssues,
          nearbyEvents,
          nearbyProviders,
        },
      },
    } as any;
  },
  adminStats: () =>
    api.get<APIResponse<any>>("/admin/stats").then((res) => {
      const backendStats = res.data.data;
      const stats: AdminStats = {
        totalReports: backendStats.total_issues ?? 0,
        openIssues: backendStats.open_issues ?? 0,
        resolvedIssues: backendStats.resolved_issues ?? 0,
        events: backendStats.total_events ?? 0,
        users: backendStats.total_users ?? 0,
      };
      return {
        ...res,
        data: {
          ...res.data,
          data: stats,
        },
      };
    }),
};
