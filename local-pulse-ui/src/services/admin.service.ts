import api from "./api";
import type { APIResponse, AdminStats, Provider } from "@/types";

export const adminService = {
  getStats: () => api.get<APIResponse<AdminStats>>("/admin/stats"),
  getConfig: () => api.get<APIResponse<any>>("/admin/system-config"),
  updateConfig: (payload: any) => api.put<APIResponse<any>>("/admin/system-config", payload),
  deleteProvider: (id: string) => api.delete<APIResponse<any>>(`/providers/${id}`),
  registerProvider: (payload: any) => api.post<APIResponse<Provider>>("/providers/register", payload),
};
