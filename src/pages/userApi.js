// Public user-profile client — resolves a notification's senderId
// into a display name + avatar via GET /api/users/{userId}.
import { apiRequest } from "./apiClient";

const BASE_URL = "/api/users";
const request = (path, options) => apiRequest(BASE_URL, path, options);

export function fetchPublicProfile(userId) {
  return request(`/${userId}`);
}

// Resolves many ids at once, deduplicated and in parallel. One user
// lookup failing (e.g. a deleted account) doesn't fail the whole
// batch — that id just resolves to null and the row falls back to
// "User #<id>".
export async function fetchPublicProfiles(userIds) {
  const uniqueIds = [...new Set(userIds)].filter((id) => id != null);

  const entries = await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const profile = await fetchPublicProfile(id);
        return [id, profile];
      } catch (err) {
        console.error(`Failed to load profile for user ${id}:`, err);
        return [id, null];
      }
    })
  );

  return new Map(entries);
}