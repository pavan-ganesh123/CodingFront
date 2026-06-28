import { jwtDecode } from "jwt-decode";

export const getUserFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    return jwtDecode(token);
  // eslint-disable-next-line no-unused-vars
  } catch (e) {
    return null;
  }
};

// src/utils/auth.js
export function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (!payload.exp) return false;
        return Date.now() >= payload.exp * 1000;
    } catch {
        return true;
    }
}

export function hasValidToken() {
    const token = localStorage.getItem("token");
    return Boolean(token) && !isTokenExpired(token);
}