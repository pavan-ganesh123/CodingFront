import { gql } from "graphql-request";

export const GET_FRIENDS = gql`
    query($userId: ID!) {
        getAllFriends(userId: $userId) {
            id
            status
            profileImage
            user {
                id
                userName
                email
            }
            friend {
                id
                userName
                email
            }
        }
    }
`;