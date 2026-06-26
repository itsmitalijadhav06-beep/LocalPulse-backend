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

    // Fetch citizen statistics conditionally based on location
    let stats: AdminStats | null = null;
    try {
      const statsRes = await api.get<APIResponse<any>>("/dashboard/citizen-summary", {
        params: {
          latitude: params?.latitude ?? 0.0,
          longitude: params?.longitude ?? 0.0,
          radius_km: params?.radiusKm ?? 5.0,
        },
      });
      const backendStats = statsRes.data.data;
      if (backendStats) {
        stats = {
          totalReports: backendStats.recent_issues_count ?? 0,
          openIssues: Math.max(0, (backendStats.recent_issues_count ?? 0) - (backendStats.resolved_issues_count ?? 0)),
          resolvedIssues: backendStats.resolved_issues_count ?? 0,
          events: backendStats.upcoming_events_count ?? 0,
          users: 0,
          providers: backendStats.nearby_providers_count ?? 0,
        };
      }
    } catch {
      // Default / fallback stats for citizens/providers
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
