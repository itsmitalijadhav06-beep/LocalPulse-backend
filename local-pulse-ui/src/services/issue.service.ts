import api from "./api";
import type { APIResponse, Issue, Comment, IssueStatus } from "@/types";

export const issueService = {
  list: (params?: { radiusKm?: number; category?: string; status?: string; q?: string }) =>
    api.get<APIResponse<Issue[]>>("/issues", { params }),
  get: (id: string) => api.get<APIResponse<Issue>>(`/issues/${id}`),
  create: (payload: FormData) => api.post<APIResponse<Issue>>("/issues", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  updateStatus: (id: string, status: IssueStatus) =>
    api.patch<APIResponse<Issue>>(`/issues/${id}/status`, { status }),
  comment: (issueId: string, text: string) =>
    api.post<APIResponse<Comment>>("/comments", { issueId, text }),
  comments: (issueId: string) => api.get<APIResponse<Comment[]>>(`/issues/${issueId}/comments`),
  upvote: (issueId: string) => api.post<APIResponse<{ upvotes: number }>>("/upvotes", { issueId }),
  myReports: () => api.get<APIResponse<Issue[]>>("/issues/mine"),
  delete: (id: string) => api.delete<APIResponse<null>>(`/issues/${id}`),
};