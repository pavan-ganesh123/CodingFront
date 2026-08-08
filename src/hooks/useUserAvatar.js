import { useEffect, useState } from "react";

// Shared by every component that needs someone's profile picture by
// userId (post headers, comment avatars, ...), so the same person's
// photo is fetched at most once per page session — even if they show
// up in multiple places on the same screen (e.g. a post's author who
// also commented on their own post).
const avatarCache = new Map();

export function useUserAvatar(userId) {
    const [picture, setPicture] = useState(() => {
        const cached = avatarCache.get(userId);
        return typeof cached === "string" || cached === null ? cached : undefined;
    });

    useEffect(() => {
        if (!userId) return;

        const cached = avatarCache.get(userId);
        if (typeof cached === "string" || cached === null) {
            setPicture(cached);
            return;
        }

        let cancelled = false;

        const request =
            cached ||
            (async () => {
                try {
                    const token = localStorage.getItem("token");
                    const res = await fetch(`http://localhost:8080/api/users/${userId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!res.ok) return null;
                    const data = await res.json();
                    return data.profilePicture || null;
                } catch {
                    return null;
                }
            })();

        avatarCache.set(userId, request);

        request.then((result) => {
            avatarCache.set(userId, result);
            if (!cancelled) setPicture(result);
        });

        return () => {
            cancelled = true;
        };
    }, [userId]);

    return picture;
}
