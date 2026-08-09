// Notification REST client — talks to NotificationController.
import { apiRequest } from "./apiClient";

const BASE_URL = "/api/notifications";
const request = (path, options) => apiRequest(BASE_URL, path, options);

export function fetchNotifications(page = 0, size = 15) {
  return request(`?page=${page}&size=${size}`);
}

export function fetchUnreadCount() {
  return request("/unread-count");
}

export function markAsRead(id) {
  return request(`/${id}/read`, { method: "PATCH" });
}

export function markAllAsRead() {
  return request("/read-all", { method: "PATCH" });
}

export function deleteNotification(id) {
  return request(`/${id}`, { method: "DELETE" });
}

export function deleteAllNotifications() {
  return request("", { method: "DELETE" });
}