import api from "./api";
import type { APIResponse, Provider } from "@/types";

export const providerService = {
  list: (params?: { category?: string; radiusKm?: number; q?: string }) =>
    api.get<APIResponse<Provider[]>>("/providers", { params }),
  get: (id: string) => api.get<APIResponse<Provider>>(`/providers/${id}`),
};
