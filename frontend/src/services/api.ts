import axios from "axios";

// ─── Centralized Axios instance ─────────────────────────────────────────────
const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
const api = axios.create({
  baseURL: `${apiBase}/api`,
  headers: { "Content-Type": "application/json" },
});

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
