import { getClient } from "../api/graphqlClient";
import { GET_FRIENDS } from "../graphql/queries/friendQueries";

export const fetchFriends = async (userId) => {
    // console.log("fetchFriends called:", userId);

    try {
        const data = await getClient().request(GET_FRIENDS, { userId });

        // console.log("GraphQL response:", data);
        // console.log("Friends:", data.getAllFriends);

        const friends = data.getAllFriends
            .filter(f => f.status === "ACCEPTED")
            .map(f => {
                const isCurrentUser =
                    String(f.user.id) === String(userId);

                const friendData = isCurrentUser
                    ? f.friend
                    : f.user;

                return {
                    ...friendData,
                    profileImage: f.profileImage,
                };
            });

        // console.log("Mapped Friends:", friends);

        return friends;
    } catch (err) {
        console.error("GraphQL Error:", err);

        if (err.response) {
            console.error("Response:", err.response);
        }

        return [];
    }
};