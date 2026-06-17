/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react";
import { getClient } from "../api/graphqlClient";
import { gql } from "graphql-request";
import "./FriendRequests.css";
import { getUserFromToken } from "../utils/auth";
import { ToastProvider, useToast } from "../notifications/ToastContext";

function FriendRequests() {
  const [requests, setRequests] = useState([]);

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
  }, [userId]);

  const fetchRequests = async () => {
    try {
      const data = await client.request(GET_FRIENDS, { userId });

      const pendingRequests = data.getPendingFriends;

      setRequests(pendingRequests);

    } catch (err) {
      console.error(err);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await client.request(ACCEPT_REQUEST, {
        requestId: String(requestId)
      });
      showToast("Friend Request Accepted","info");
      fetchRequests(); // refresh list

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="friends-container">
      <h2>Friend Requests</h2>
      <button
          className="friendreq-back-btn"
          onClick={() => {
            window.location.href = "/home";
          }}
        >
          Back
      </button>
      {requests.length === 0 ? (
        <p className="empty">No pending requests</p>
      ) : (
        requests.map(req => (
          <div key={req.id} className="friend-card">
            <span>{req.user.userName}</span>

            <button onClick={() => handleAccept(req.id)}>
              Accept
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default FriendRequests;