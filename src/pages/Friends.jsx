/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react";
import { getClient } from "../api/graphqlClient";
import { gql } from "graphql-request";
import "./Friends.css";
import { getUserFromToken } from "../utils/auth";

function Friends() {
  const [friends, setFriends] = useState([]);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]); 

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
      const friendsData = await client.request(GET_FRIENDS, { userId });
      const usersData = await client.request(GET_USERS);

      const allRelations = friendsData.getAllFriends;
      const friendList = allRelations
        .filter(f => f.status === "ACCEPTED")
        .map(f =>
            String(f.user.id) === String(userId) ? f.friend : f.user
        );

      setFriends(friendList);

      const pendingRequests = allRelations.filter(
        f => f.status === "PENDING" && String(f.friend.id) === String(userId)
      );

      setRequests(pendingRequests);
      const requestedIds = allRelations
        .filter(f =>
            // only outgoing OR accepted
            String(f.user.id) === String(userId) || f.status === "ACCEPTED"
        )
        .map(f =>
            String(f.user.id) === String(userId)
            ? String(f.friend.id)
            : String(f.user.id)
        );

      const filteredUsers = usersData.getAllUsers.filter(
        u =>
          u.id != userId &&
          !requestedIds.includes(String(u.id))
      );

      setUsers(filteredUsers);

    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFriend = async (friendId) => {
    try {
      await client.request(SEND_REQUEST, {
        userId: String(userId),   // safer
        friendId: String(friendId)
      });
      alert("Friend request sent!");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await client.request(ACCEPT_REQUEST, {
        requestId: String(requestId)
      });
      alert("Friend request accepted!");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="friends-container">

      <h2>Your Friends</h2>

      {friends.length === 0 ? (
        <p>No friends yet</p>
      ) : (
        friends.map(friend => (
          <div key={friend.id} className="friend-card">
            {friend.userName}
          </div>
        ))
      )}
      <h2>Friend Requests</h2>
      
      {requests.length === 0 ? ( 
        
        <p>No pending requests</p>
        
      ) : (
        requests.map(req => (
          <div key={req.id} className="friend-card">
            {req.user.userName}
            <button onClick={() => handleAccept(req.id)}>
              Accept
            </button>
          </div>
        ))
      )}

      <h2>Add Friends</h2>

      {users.length === 0 ? (
        <p>No users available</p>
      ) : (
        users.map(u => (
          <div key={u.id} className="friend-card">
            {u.userName}
            <button onClick={() => handleAddFriend(u.id)}>
              Add Friend
            </button>
          </div>
        ))
      )}

    </div>
  );
}

export default Friends;