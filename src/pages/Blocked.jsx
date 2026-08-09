/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gql } from "graphql-request";
import { getClient } from "../api/graphqlClient";
import { getUserFromToken } from "../utils/auth";
import { useToast } from "../notifications/ToastContext";
import { useQueryClient } from "@tanstack/react-query";
import { FaArrowLeft, FaUserSlash, FaSpinner } from "react-icons/fa";

import "./Blocked.css";

const AVATAR_ACCENTS = ["primary", "teal", "rose"];

function accentFor(name) {
  const code = (name || "?").charCodeAt(0) || 0;
  return AVATAR_ACCENTS[code % AVATAR_ACCENTS.length];
}

function Blocked() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState(null);

  const client = getClient();

  const user = getUserFromToken();

  const userId = user?.userId;
  const { showToast } = useToast();
  const GET_RELATIONS = gql`
    query($userId: ID!) {
      getBlockedFriends(userId: $userId) {
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
    mutation($userId: ID!, $targetUserId: ID!) {
      unblockUser(userId: $userId, targetUserId: $targetUserId) {
        id
        status
      }
    }
  `;

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    setIsLoading(true);
    try {
      const data = await client.request(GET_RELATIONS, { userId });

      const blocked = data.getBlockedFriends;
      setBlockedUsers(blocked);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblock = async (targetId) => {
    setUnblockingId(targetId);
    try {
      await client.request(UNBLOCK_USER, {
        userId,
        targetUserId: targetId,
      });

      // Remove from blocked page UI
      setBlockedUsers((prev) =>
        prev.filter((relation) => {
          const blockedPerson =
            String(relation.user.id) === String(userId) ? relation.friend : relation.user;

          return String(blockedPerson.id) !== String(targetId);
        })
      );

      // UNBLOCK_USER (and GET_RELATIONS above) don't select profileImage,
      // so manually splicing a "friend" object back into the cache would
      // cache one with no picture until the next natural refetch.
      // Invalidating instead means anything reading ["friends", userId]
      // (chat sidebar, share-post modal) pulls the real, complete data.
      queryClient.invalidateQueries({ queryKey: ["friends", userId] });

      showToast("User unblocked", "info");
    } catch (err) {
      console.error(err);

      showToast("Failed to unblock", "error");
    } finally {
      setUnblockingId(null);
    }
  };

  const showEmpty = !isLoading && blockedUsers.length === 0;

  return (
    <div className="bl-page">
      <div className="page-mesh" aria-hidden="true" />
      <div className="page-grain" aria-hidden="true" />

      <div className="bl-shell">
        <button className="bl-back" onClick={() => navigate("/chat")}>
          <FaArrowLeft />
          Back
        </button>

        <div className="bl-card">
          <div className="bl-card-glow" aria-hidden="true" />

          <span className="bl-kicker">$ users --blocked</span>
          <h1 className="bl-title">Blocked users</h1>

          <div className="bl-list">
            {isLoading && (
              <div className="bl-skeleton-list" aria-hidden="true">
                {[0, 1].map((i) => (
                  <div className="bl-skeleton" key={i} style={{ animationDelay: `${i * 90}ms` }}>
                    <div className="bl-skeleton-avatar" />
                    <div className="bl-skeleton-lines">
                      <div className="bl-skeleton-bar bl-skeleton-bar--name" />
                      <div className="bl-skeleton-bar bl-skeleton-bar--email" />
                    </div>
                    <div className="bl-skeleton-btn" />
                  </div>
                ))}
              </div>
            )}

            {showEmpty && (
              <div className="bl-state">
                <FaUserSlash className="bl-state-icon" />
                <p className="bl-state-title">No blocked users</p>
                <p className="bl-state-copy">Anyone you block will show up here.</p>
              </div>
            )}

            {!isLoading &&
              blockedUsers.map((relation, i) => {
                const blockedPerson =
                  String(relation.user.id) === String(userId) ? relation.friend : relation.user;

                return (
                  <div className="bl-user-card" key={relation.id} style={{ animationDelay: `${i * 45}ms` }}>
                    <span className={`bl-avatar bl-avatar--${accentFor(blockedPerson.userName)}`}>
                      {(blockedPerson.userName || "?").charAt(0).toUpperCase()}
                    </span>

                    <div className="bl-user-info">
                      <span className="bl-user-name">{blockedPerson.userName}</span>
                      <span className="bl-user-email">{blockedPerson.email}</span>
                    </div>

                    <button
                      className="bl-unblock-btn"
                      onClick={() => handleUnblock(blockedPerson.id)}
                      disabled={unblockingId === blockedPerson.id}
                    >
                      {unblockingId === blockedPerson.id ? (
                        <FaSpinner className="bl-unblock-spinner" />
                      ) : (
                        "Unblock"
                      )}
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Blocked;
