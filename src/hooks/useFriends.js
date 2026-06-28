import { useQuery } from "@tanstack/react-query";
import { fetchFriends } from "../services/friendService";

export const useFriends = (userId) => {
    return useQuery({
        queryKey: ["friends", userId],
        queryFn: () => fetchFriends(userId),
        staleTime: 1000 * 60 * 30,
        enabled: !!userId
    });
};