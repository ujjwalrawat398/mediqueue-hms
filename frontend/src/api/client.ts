import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});

// Attach JWT (patient or doctor) automatically on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hms_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function saveSession(token: string, role: string) {
  localStorage.setItem("hms_token", token);
  localStorage.setItem("hms_role", role);
}

export function clearSession() {
  localStorage.removeItem("hms_token");
  localStorage.removeItem("hms_role");
}

export function getRole() {
  return localStorage.getItem("hms_role");
}
