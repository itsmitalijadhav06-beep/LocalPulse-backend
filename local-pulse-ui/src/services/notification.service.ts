import api from "./api";
import type { APIResponse, Notification } from "@/types";

export const notificationService = {
  list: () => api.get<APIResponse<Notification[]>>("/notifications"),
  markRead: (id: string) => api.patch<APIResponse<Notification>>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<APIResponse<null>>(`/notifications/read-all`),
};