import api from "./api";
import type { APIResponse, User } from "@/types";

export const authService = {
  register: (payload: { name: string; email: string; password: string; city: string }) =>
    api.post<APIResponse<any>>("/auth/register", {
      email: payload.email,
      password: payload.password,
      full_name: payload.name,
      role: "citizen",
    }),
  login: (payload: { email: string; password: string }) =>
    api.post<APIResponse<{ access_token: string; token_type: string }>>("/auth/login", payload),
  me: () => api.get<APIResponse<any>>("/auth/me"),
  logout: () => api.post<APIResponse<null>>("/auth/logout"),
};