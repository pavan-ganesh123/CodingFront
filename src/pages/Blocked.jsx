/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react";
import { gql } from "graphql-request";
import { getClient } from "../api/graphqlClient";
import { getUserFromToken } from "../utils/auth";

import "./Blocked.css";

function Blocked() {

  const [blockedUsers, setBlockedUsers] = useState([]);

  const client = getClient();

  const user = getUserFromToken();

  const userId = user?.userId;

  const GET_RELATIONS = gql`
    query($userId: ID!) {
      getAllFriends(userId: $userId) {
        id
        status

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

  const UNBLOCK_USER = gql`
    mutation(
      $userId: ID!,
      $targetUserId: ID!
    ) {
      unblockUser(
        userId: $userId,
        targetUserId: $targetUserId
      ) {
        id
        status
      }
    }
  `;

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {

    try {

      const data = await client.request(
        GET_RELATIONS,
        { userId }
      );

      const blocked = data.getAllFriends
        .filter(f => f.status === "BLOCKED")
        .map(f =>
          String(f.user.id) === String(userId)
            ? f.friend
            : f.user
        );

      setBlockedUsers(blocked);

    } catch (err) {
      console.error(err);
    }
  };

  const handleUnblock = async (targetId) => {

    try {

      await client.request(
        UNBLOCK_USER,
        {
          userId,
          targetUserId: targetId
        }
      );

      setBlockedUsers(prev =>
        prev.filter(
          u => String(u.id) !== String(targetId)
        )
      );

      alert("User unblocked");

    } catch (err) {
      console.error(err);
      alert("Failed to unblock");
    }
  };

  return (

    <div className="blocked-page">

      <div className="blocked-header">

        <h2>Blocked Users</h2>

        <button
          className="back-btn"
          onClick={() => {
            window.location.href = "/chat";
          }}
        >
          Back
        </button>

      </div>

      <div className="blocked-list">

        {blockedUsers.length === 0 ? (

          <div className="empty-blocked">
            No blocked users
          </div>

        ) : (

          blockedUsers.map(user => (

            <div
              key={user.id}
              className="blocked-user-card"
            >

              <div>

                <div className="blocked-name">
                  {user.userName}
                </div>

                <div className="blocked-email">
                  {user.email}
                </div>

              </div>

              <button
                className="unblock-btn"
                onClick={() =>
                  handleUnblock(user.id)
                }
              >
                Unblock
              </button>

            </div>

          ))

        )}

      </div>

    </div>
  );
}

export default Blocked;