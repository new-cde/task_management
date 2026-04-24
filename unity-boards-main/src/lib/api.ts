import axios from "axios";

export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000/api";

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // Network error (backend not running / unreachable) — give a clear message
    if (!err?.response) {
      err.friendlyMessage = `Cannot reach the API at ${API_URL}. Make sure the backend is running (docker compose up) and that VITE_API_URL points to it.`;
    }
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      if (!location.pathname.startsWith("/login") && !location.pathname.startsWith("/register")) {
        location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

