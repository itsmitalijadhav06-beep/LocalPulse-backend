import api from "./api";
import type { APIResponse, Event } from "@/types";

export const eventService = {
  list: (params?: { radiusKm?: number; q?: string }) =>
    api.get<APIResponse<Event[]>>("/events", { params }),
  get: (id: string) => api.get<APIResponse<Event>>(`/events/${id}`),
  markInterested: (id: string) =>
    api.post<APIResponse<{ interestedCount: number }>>(`/events/${id}/interested`),
};