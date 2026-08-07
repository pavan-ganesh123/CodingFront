/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getClient } from "../api/graphqlClient";
import { gql } from "graphql-request";
import { FaCheck, FaSpinner, FaUserFriends } from "react-icons/fa";
import "./FriendRequests.css";
import { getUserFromToken } from "../utils/auth";
import { useToast } from "../notifications/ToastContext";

const AVATAR_ACCENTS = ["primary", "teal", "rose"];

function accentFor(name) {
  const code = (name || "?").charCodeAt(0) || 0;
  return AVATAR_ACCENTS[code % AVATAR_ACCENTS.length];
}

function FriendRequests() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);

  const user = getUserFromToken();
  const userId = user?.userId;

  const client = getClient();
  const { showToast } = useToast();

  // 🔹 Get all relations
  const GET_FRIENDS = gql`
    query($userId: ID!) {
      getPendingFriends(userId: $userId) {
        id
        status
        user { id userName }
        friend { id userName }
      }
    }
  `;

  // 🔹 Accept request
  const ACCEPT_REQUEST = gql`
    mutation($requestId: ID!) {
      acceptFriendRequest(requestId: $requestId) {
        id
        status
      }
    }
  `;

  useEffect(() => {
    if (userId) {
      fetchRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await client.request(GET_FRIENDS, { userId });

      const pendingRequests = data.getPendingFriends;

      setRequests(pendingRequests);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    setAcceptingId(requestId);
    try {
      await client.request(ACCEPT_REQUEST, {
        requestId: String(requestId),
      });
      showToast("Friend Request Accepted", "info");
      fetchRequests(); // refresh list
    } catch (err) {
      console.error(err);
    } finally {
      setAcceptingId(null);
    }
  };

  const showEmpty = !isLoading && requests.length === 0;

  return (
    <div className="frq-page">
      <div className="frq-header">
        <span className="frq-kicker">$ friends --pending</span>
        <h1 className="frq-title">Friend requests</h1>
      </div>

      <div className="frq-list">
        {isLoading && (
          <div className="frq-skeleton-list" aria-hidden="true">
            {[0, 1].map((i) => (
              <div className="frq-skeleton" key={i} style={{ animationDelay: `${i * 90}ms` }}>
                <div className="frq-skeleton-avatar" />
                <div className="frq-skeleton-bar" />
                <div className="frq-skeleton-btn" />
              </div>
            ))}
          </div>
        )}

        {showEmpty && (
          <div className="frq-state">
            <FaUserFriends className="frq-state-icon" />
            <p className="frq-state-title">No pending requests</p>
            <p className="frq-state-copy">You're all caught up — new requests will show up here.</p>
            <button className="frq-state-cta" onClick={() => navigate("/friends/find-friends")}>
              Find friends to add
            </button>
          </div>
        )}

        {!isLoading &&
          requests.map((req, i) => (
            <div className="frq-card" key={req.id} style={{ animationDelay: `${i * 45}ms` }}>
              <span className={`frq-avatar frq-avatar--${accentFor(req.user.userName)}`}>
                {(req.user.userName || "?").charAt(0).toUpperCase()}
              </span>
              <span className="frq-card-name">{req.user.userName}</span>
              <button
                className="frq-accept-btn"
                onClick={() => handleAccept(req.id)}
                disabled={acceptingId === req.id}
              >
                {acceptingId === req.id ? (
                  <FaSpinner className="frq-accept-spinner" />
                ) : (
                  <>
                    <FaCheck />
                    Accept
                  </>
                )}
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

export default FriendRequests;
