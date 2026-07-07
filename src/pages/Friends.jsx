/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react";
import { getClient } from "../api/graphqlClient";
import { gql } from "graphql-request";
import "./Friends.css";
import { FaUserFriends } from "react-icons/fa";
import { IoNotifications } from "react-icons/io5";
import { MdPersonAdd } from "react-icons/md";
import { getUserFromToken } from "../utils/auth";
import { useToast } from "../notifications/ToastContext";
import { useFriends } from "../hooks/useFriends";

function Friends() {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("friends");

  const user = getUserFromToken();
  const userId = user?.userId;

  const { showToast } = useToast();

  const client = getClient();

  const {
    data: friends = [],
    isLoading: friendsLoading
  } = useFriends(userId);

  const GET_RELATIONS = gql`
    query($userId: ID!) {
      getAllFriends(userId: $userId) {
        id
        status
        user {
          id
          userName
        }
        friend {
          id
          userName
        }
      }
    }
  `;

  const GET_USERS = gql`
    query {
      getAllUsers {
        id
        userName
      }
    }
  `;

  const SEND_REQUEST = gql`
    mutation($userId: ID!, $friendId: ID!) {
      sendFriendRequest(userId: $userId, friendId: $friendId) {
        id
        status
      }
    }
  `;

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
      fetchData();
    }
  }, [userId]);

  const fetchData = async () => {
    try {

      const relationsData = await client.request(
        GET_RELATIONS,
        { userId }
      );

      const usersData =
        await client.request(GET_USERS);

      const allRelations =
        relationsData.getAllFriends;

      const pendingRequests =
        allRelations.filter(
          f =>
            f.status === "PENDING" &&
            String(f.friend.id) === String(userId)
        );

      setRequests(pendingRequests);

      const requestedIds = allRelations
        .filter(
          f =>
            String(f.user.id) === String(userId) ||
            f.status === "ACCEPTED"
        )
        .map(f =>
          String(f.user.id) === String(userId)
            ? String(f.friend.id)
            : String(f.user.id)
        );

      const filteredUsers =
        usersData.getAllUsers.filter(
          u =>
            String(u.id) !== String(userId) &&
            !requestedIds.includes(String(u.id))
        );

      setUsers(filteredUsers);

    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFriend = async (friendId) => {
    try {

      await client.request(
        SEND_REQUEST,
        {
          userId: String(userId),
          friendId: String(friendId)
        }
      );

      showToast(
        "Friend Request sent!!",
        "info"
      );

      fetchData();

    } catch (err) {
      console.error(err);
    }
  };

  const handleAccept = async (requestId) => {
    try {

      await client.request(
        ACCEPT_REQUEST,
        {
          requestId: String(requestId)
        }
      );

      showToast(
        "Friend Request Accepted",
        "info"
      );

      fetchData();

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="friends-container">

      <div className="tabs">

        <button
          className={
            activeTab === "friends"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("friends")
          }
        >
          <FaUserFriends className="icon" />
        </button>

        <button
          className={
            activeTab === "requests"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("requests")
          }
        >
          <IoNotifications className="icon" />
            {requests.length > 0 && (
              <span className="badge">{requests.length}</span>
            )}
        </button>

        <button
          className={
            activeTab === "add"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("add")
          }
        >
          <MdPersonAdd className="icon" />
        </button>

      </div>

      <div className="tab-content">

        {activeTab === "friends" && (
          <>
            <h2>Your Friends</h2>

            {friendsLoading ? (
              <p>Loading...</p>
            ) : friends.length === 0 ? (
                  <p className="empty">No friends yet</p>
                ) : (
                  <div className="friends-list">
                    {friends.map(friend => (
                      <div key={friend.id} className="friend-card clickable" onClick={() => console.log("Open chat with", friend)}>
                        {friend.userName}
                      </div>
                    ))}
                  </div>
                )}
          </>
        )}

        {activeTab === "requests" && (
          <>
            <h2>Friend Requests</h2>

            {requests.length === 0 ? (
              <p className="empty">
                No pending requests
              </p>
            ) : (
              requests.map(req => (
                <div
                  key={req.id}
                  className="friend-card"
                >
                  <span>
                    {req.user.userName}
                  </span>

                  <button
                    onClick={() =>
                      handleAccept(req.id)
                    }
                  >
                    Accept
                  </button>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === "add" && (
          <>
            <h2>Add Friends</h2>

            {users.length === 0 ? (
              <p className="empty">
                No users available
              </p>
            ) : (
              users.map(u => (
                <div
                  key={u.id}
                  className="friend-card"
                >
                  <span>{u.userName}</span>

                  <button
                    onClick={() =>
                      handleAddFriend(u.id)
                    }
                  >
                    Add Friend
                  </button>
                </div>
              ))
            )}
          </>
        )}

      </div>
    </div>
  );
}

export default Friends;