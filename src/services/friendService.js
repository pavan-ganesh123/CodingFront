import { getClient } from "../api/graphqlClient";
import { GET_FRIENDS } from "../graphql/queries/friendQueries";

export const fetchFriends = async (userId) => {

    console.log("fetchFriends called", userId);

    const data = await getClient().request(
        GET_FRIENDS,
        { userId }
    );

    console.log("GraphQL response", data);

    return data.getAllFriends
        .filter(f => f.status === "ACCEPTED")
        .map(f => {
            const isCurrentUser =
                String(f.user.id) === String(userId);

            const friendData =
                isCurrentUser
                    ? f.friend
                    : f.user;

            return {
                ...friendData,
                profileImage: f.profileImage
            };
        });
};