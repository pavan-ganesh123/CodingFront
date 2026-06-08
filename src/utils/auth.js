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