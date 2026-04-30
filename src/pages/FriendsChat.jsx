/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react";
import { getClient } from "../api/graphqlClient";
import { gql } from "graphql-request";
import "./Friends.css"; // adjust path if needed
import { getUserFromToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";

function FriendsChat() {
  const [friends, setFriends] = useState([]);

  const user = getUserFromToken();
  const userId = user?.userId;

  const client = getClient();

  const GET_FRIENDS = gql`
    query($userId: ID!) {
      getAllFriends(userId: $userId) {
        id
        status
        user { id userName }
        friend { id userName }
      }
    }
  `;

  useEffect(() => {
    if (userId) {
      fetchFriends();
    }
  }, [userId]);

  const fetchFriends = async () => {
    try {
      const data = await client.request(GET_FRIENDS, { userId });

      const allRelations = data.getAllFriends;

      const friendList = allRelations
        .filter(f => f.status === "ACCEPTED")
        .map(f =>
          String(f.user.id) === String(userId)
            ? f.friend
            : f.user
        );

      setFriends(friendList);

    } catch (err) {
      console.error(err);
    }
  };

    const navigate = useNavigate();

    const openChat = (friend) => {
    navigate(`/friends/chat/${friend.id}`, {
        state: { friend } // optional (passes data without refetch)
    });
    };

  return (
    <div className="friends-container">
      <h2>Your Friends</h2>

      {friends.length === 0 ? (
        <p className="empty">No friends yet</p>
      ) : (
        friends.map(friend => (
          <div
            key={friend.id}
            className="friend-card clickable"
            onClick={() => openChat(friend)}
          >
            {friend.userName}
          </div>
        ))
      )}
    </div>
  );
}

export default FriendsChat;