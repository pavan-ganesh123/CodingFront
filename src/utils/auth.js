import { jwtDecode } from "jwt-decode";

export const getUserFromToken = () => {
  const token = localStorage.getItem("token");
  console.log(JSON.parse(atob(token.split(".")[1])));
  if (!token) return null;

  try {
    return jwtDecode(token);
  // eslint-disable-next-line no-unused-vars
  } catch (e) {
    return null;
  }
};