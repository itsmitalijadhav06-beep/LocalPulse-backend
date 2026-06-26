import api from "./api";
import type { APIResponse, Issue, Comment, IssueStatus } from "@/types";

export const mapBackendCommentToFrontend = (backendComment: any): Comment => {
  return {
    id: String(backendComment.id),
    issueId: String(backendComment.issue_id),
    author: {
      id: String(backendComment.author_id),
      name: backendComment.author_name || "Anonymous Citizen",
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${backendComment.author_id}`,
    },
    text: backendComment.text,
    createdAt: backendComment.created_at || new Date().toISOString(),
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
      latitude: backendIssue.latitude,
      longitude: backendIssue.longitude,
    },
    address: backendIssue.address || "Indore",
    distanceKm: backendIssue.distanceKm ?? 0.8,
    createdAt: backendIssue.created_at || new Date().toISOString(),
    upvotes: backendIssue.upvotes ?? 0,
    commentsCount: backendIssue.comments_count ?? 0,
    reporter: backendIssue.reported_by ? {
      id: String(backendIssue.reported_by),
      name: "Citizen",
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${backendIssue.reported_by}`,
    } : null,
    anonymous: backendIssue.anonymous ?? false,
  };
};

export const issueService = {
  list: (params?: { radiusKm?: number; category?: string; status?: string; q?: string }) =>
    api.get<APIResponse<any[]>>("/issues", { params }).then((res) => {
      const mapped = (res.data.data || []).map(mapBackendIssueToFrontend);
      return {
        ...res,
        data: {
          ...res.data,
          data: mapped,
        },
      };
    }),
  get: (id: string) =>
    api.get<APIResponse<any>>(`/issues/${id}`).then((res) => {
      const mapped = mapBackendIssueToFrontend(res.data.data);
      return {
        ...res,
        data: {
          ...res.data,
          data: mapped,
        },
      };
    }),
  create: (formData: FormData) => {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const latitude = parseFloat(formData.get("latitude") as string);
    const longitude = parseFloat(formData.get("longitude") as string);
    const hasImage = formData.has("image");
    const image_url = hasImage
      ? `https://images.unsplash.com/photo-1594913785162-e6785b423cb1?auto=format&fit=crop&q=80&w=600`
      : undefined;

    const payload = {
      title,
      description,
      category,
      latitude,
      longitude,
      image_url,
    };

    return api.post<APIResponse<any>>("/issues", payload).then((res) => {
      const mapped = mapBackendIssueToFrontend(res.data.data);
      return {
        ...res,
        data: {
          ...res.data,
          data: mapped,
        },
      };
    });
  },
  updateStatus: (id: string, status: IssueStatus) =>
    api.patch<APIResponse<any>>(`/issues/${id}`, { status }).then((res) => {
      const mapped = mapBackendIssueToFrontend(res.data.data);
      return {
        ...res,
        data: {
          ...res.data,
          data: mapped,
        },
      };
    }),
  comment: (issueId: string, text: string) =>
    api.post<APIResponse<any>>(`/comments/${issueId}`, { text }).then((res) => {
      const mapped = mapBackendCommentToFrontend(res.data.data);
      return {
        ...res,
        data: {
          ...res.data,
          data: mapped,
        },
      };
    }),
  comments: (issueId: string) =>
    api.get<APIResponse<any[]>>(`/comments/${issueId}`).then((res) => {
      const mapped = (res.data.data || []).map(mapBackendCommentToFrontend);
      return {
        ...res,
        data: {
          ...res.data,
          data: mapped,
        },
      };
    }),
  upvote: (issueId: string) =>
    api.post<APIResponse<any>>(`/issues/${issueId}/upvote`).then((res) => {
      const mapped = mapBackendIssueToFrontend(res.data.data);
      return {
        ...res,
        data: {
          ...res.data,
          data: {
            upvotes: mapped.upvotes,
          },
        },
      };
    }),
  myReports: async () => {
    const meRes = await api.get<APIResponse<any>>("/auth/me");
    const userId = meRes.data.data.id;
    const issuesRes = await api.get<APIResponse<any[]>>("/issues");
    const mapped = (issuesRes.data.data || []).map(mapBackendIssueToFrontend);
    const filtered = mapped.filter((i) => i.reporter?.id === String(userId));
    return {
      ...issuesRes,
      data: {
        ...issuesRes.data,
        data: filtered,
      },
    };
  },
  delete: (id: string) => api.delete<APIResponse<null>>(`/issues/${id}`),
};