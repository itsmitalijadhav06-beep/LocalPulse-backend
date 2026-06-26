import api from "./api";
import type { APIResponse, Event } from "@/types";

export const mapBackendEventToFrontend = (backendEvent: any): Event => {
  if (!backendEvent) return null as any;
  const dateObj = new Date(backendEvent.event_date);
  const timeStr = dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const dateStr = dateObj.toISOString().split("T")[0];

  return {
    id: String(backendEvent.id),
    title: backendEvent.title || "Community Event",
    posterUrl: backendEvent.posterUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=600",
    date: dateStr,
    time: timeStr,
    organizer: backendEvent.organizer_name || "Organizer",
    location: {
      latitude: backendEvent.latitude,
      longitude: backendEvent.longitude,
    },
    address: backendEvent.location_address || "Indore",
    distanceKm: backendEvent.distanceKm ?? 0.5,
    interestedCount: backendEvent.attendees ? backendEvent.attendees.length : 0,
    category: backendEvent.category || "General",
  };
};

export const eventService = {
  list: (params?: { radiusKm?: number; q?: string }) =>
    api.get<APIResponse<any[]>>("/events", { params }).then((res) => {
      const mapped = (res.data.data || []).map(mapBackendEventToFrontend);
      return {
        ...res,
        data: {
          ...res.data,
          data: mapped,
        },
      };
    }),
  get: (id: string) =>
    api.get<APIResponse<any>>(`/events/${id}`).then((res) => {
      const mapped = mapBackendEventToFrontend(res.data.data);
      return {
        ...res,
        data: {
          ...res.data,
          data: mapped,
        },
      };
    }),
  markInterested: (id: string) =>
    api.post<APIResponse<any>>(`/events/${id}/rsvp`).then((res) => {
      const mapped = mapBackendEventToFrontend(res.data.data);
      return {
        ...res,
        data: {
          ...res.data,
          data: {
            interestedCount: mapped.interestedCount,
          },
        },
      };
    }),
};