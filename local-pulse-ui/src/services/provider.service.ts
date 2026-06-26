import api from "./api";
import type { APIResponse, Provider } from "@/types";

export const mapBackendProviderToFrontend = (backendProvider: any): Provider => {
  return {
    id: String(backendProvider.id),
    name: backendProvider.name,
    category: backendProvider.category,
    rating: backendProvider.rating ?? 5.0,
    reviewsCount: backendProvider.reviewsCount ?? 0,
    phone: backendProvider.contact_phone || backendProvider.phone || "",
    address: backendProvider.address || "Indore",
    distanceKm: backendProvider.distanceKm ?? 1.2,
    verified: backendProvider.verified ?? true,
    contact_email: backendProvider.contact_email,
    contact_phone: backendProvider.contact_phone,
    service_radius_km: backendProvider.service_radius_km,
  };
};

export const providerService = {
  list: (params?: { category?: string; radiusKm?: number; q?: string }) =>
    api.get<APIResponse<any[]>>("/providers", { params }).then((res) => {
      const mapped = (res.data.data || []).map(mapBackendProviderToFrontend);
      return {
        ...res,
        data: {
          ...res.data,
          data: mapped,
        },
      };
    }),
  get: (id: string) =>
    api.get<APIResponse<any>>(`/providers/${id}`).then((res) => {
      const mapped = mapBackendProviderToFrontend(res.data.data);
      return {
        ...res,
        data: {
          ...res.data,
          data: mapped,
        },
      };
    }),
};
