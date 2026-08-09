// Shared fetch helper — reads the JWT from localStorage (same key
// App.jsx uses for route guarding) and attaches it as a Bearer token,
// so every API module authenticates the same way.
//
// API_ORIGIN points straight at Spring Boot, bypassing Vite's dev
// proxy. Your SecurityConfig's corsConfigurationSource already allows
// this exact origin (http://localhost:5173) with credentials, so no
// backend change is needed. Update this if your backend runs on a
// different port, or when you deploy and it's no longer localhost.
const API_ORIGIN = "https://codecache-13ic.onrender.com";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest(baseUrl, path = "", options = {}) {
  const res = await fetch(`${API_ORIGIN}${baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${baseUrl}${path} failed (${res.status})${detail ? `: ${detail}` : ""}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}