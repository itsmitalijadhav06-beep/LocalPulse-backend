import api from "./api";
import type { APIResponse, Issue, Comment, IssueStatus } from "@/types";

export const mapBackendCommentToFrontend = (backendComment: any): Comment => {
  return {
    id: String(backendComment.id),
    issueId: String(backendComment.issue_id || ""),
    author: {
      id: String(backendComment.author_id || ""),
      name: backendComment.author_name || "Anonymous Citizen",
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${backendComment.author_id || "anon"}`,
    },
    text: backendComment.text,
    createdAt: backendComment.created_at || new Date().toISOString(),
    isOwn: backendComment.is_own ?? false,
  };
};

export const mapBackendIssueToFrontend = (backendIssue: any): Issue => {
  if (!backendIssue) return null as any;
  return {
    id: String(backendIssue.id),
    title: backendIssue.title,
    description: backendIssue.description,
    category: (backendIssue.category || "other").toLowerCase() as any,
    status: (backendIssue.status || "open").toLowerCase() as any,
    imageUrl: backendIssue.image_url || undefined,
    location: {
      latitude: backendIssue.latitude ?? 22.7196,
      longitude: backendIssue.longitude ?? 75.8577,
    },
    address: backendIssue.address || "Indore",
    distanceKm: backendIssue.distanceKm ?? 0.8,
    createdAt: backendIssue.created_at || new Date().toISOString(),
    upvotes: backendIssue.upvotes ?? 0,
    commentsCount: backendIssue.comments_count ?? 0,
    reporter: backendIssue.reported_by
      ? {
          id: String(backendIssue.reported_by),
          name: backendIssue.reporter_name || "Citizen",
          avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${backendIssue.reported_by}`,
        }
      : null,
    anonymous: backendIssue.anonymous ?? false,
    aiCategory: backendIssue.ai_category,
    aiSeverity: backendIssue.ai_severity,
    aiDescription: backendIssue.ai_description,
    duplicateOf: backendIssue.duplicate_of ?? null,
  };
};

export const issueService = {
  list: (params?: {
    radiusKm?: number;
    category?: string;
    status?: string;
    q?: string;
    limit?: number;
    skip?: number;
  }) =>
    api.get<APIResponse<any[]>>("/issues", { params }).then((res) => {
      const mapped = (res.data.data || []).map(mapBackendIssueToFrontend);
      return { ...res, data: { ...res.data, data: mapped } };
    }),

  get: (id: string) =>
    api.get<APIResponse<any>>(`/issues/${id}`).then((res) => {
      const mapped = mapBackendIssueToFrontend(res.data.data);
      return { ...res, data: { ...res.data, data: mapped } };
    }),

  create: (payload: {
    title: string;
    description: string;
    category: string;
    latitude: number;
    longitude: number;
    anonymous?: boolean;
    image_url?: string;
  }) =>
    api.post<APIResponse<any>>("/issues", payload).then((res) => {
      const mapped = mapBackendIssueToFrontend(res.data.data);
      return { ...res, data: { ...res.data, data: mapped } };
    }),

  updateStatus: (id: string, status: IssueStatus) =>
    api.patch<APIResponse<any>>(`/issues/${id}`, { status }).then((res) => {
      const mapped = mapBackendIssueToFrontend(res.data.data);
      return { ...res, data: { ...res.data, data: mapped } };
    }),

  comment: (issueId: string, text: string) =>
    api.post<APIResponse<any>>(`/comments/${issueId}`, { content: text }).then((res) => {
      const mapped = mapBackendCommentToFrontend(res.data.data);
      return { ...res, data: { ...res.data, data: mapped } };
    }),


  comments: (issueId: string) =>
    api.get<APIResponse<any[]>>(`/comments/${issueId}`).then((res) => {
      const mapped = (res.data.data || []).map(mapBackendCommentToFrontend);
      return { ...res, data: { ...res.data, data: mapped } };
    }),

  upvote: (issueId: string) =>
    api.post<APIResponse<any>>(`/issues/${issueId}/upvote`).then((res) => {
      const mapped = mapBackendIssueToFrontend(res.data.data);
      return {
        ...res,
        data: {
          ...res.data,
          data: { upvotes: mapped?.upvotes ?? 0 },
        },
      };
    }),

  myReports: () =>
    api.get<APIResponse<any[]>>("/issues").then(async (res) => {
      // Fetch current user ID from /auth/me to filter
      let userId: string | null = null;
      try {
        const meRes = await api.get<APIResponse<any>>("/auth/me");
        userId = String(meRes.data.data?.id || "");
      } catch {
        // If /me fails token is invalid — return empty
        return { ...res, data: { ...res.data, data: [] } };
      }
      const all = (res.data.data || []).map(mapBackendIssueToFrontend);
      const mine = userId
        ? all.filter((i) => i.reporter?.id === userId)
        : all;
      return { ...res, data: { ...res.data, data: mine } };
    }),

  delete: (id: string) => api.delete<APIResponse<null>>(`/issues/${id}`),

  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api
      .post<APIResponse<{ image_url: string }>>("/issues/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => res.data.data.image_url);
  },
};