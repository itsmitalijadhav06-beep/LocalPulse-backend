import axios from "axios";

const baseURL = "https://localpulse-backend-b9lt.onrender.com/api/v1";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  // Token injection point — populated by auth flow later.
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("lp_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("lp_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
