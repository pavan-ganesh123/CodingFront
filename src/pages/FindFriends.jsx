/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react";
import { getClient } from "../api/graphqlClient";
import { gql } from "graphql-request";
import "./FindFriends.css";
import { getUserFromToken } from "../utils/auth";
import { ToastProvider, useToast } from "../notifications/ToastContext";


function FindFriends() {
  const [users, setUsers] = useState([]);


  const user = getUserFromToken();
  const userId = user?.userId;


  const client = getClient();
  const { showToast } = useToast();


  const GET_FRIENDS = gql`
    query($userId: ID!) {
      getAllFriends(userId: $userId) {
        id
        status
        user { id }
        friend { id }
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


  useEffect(() => {
    if (userId) {
      fetchUsers();
    }
  }, [userId]);


  const fetchUsers = async () => {
    try {
      // ✅ Use REST API for getting all users
      const token = localStorage.getItem("token");
      const usersRes = await fetch('http://localhost:8080/api/users/all',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!usersRes.ok) {
        throw new Error(`HTTP error! status: ${usersRes.status}`);
      }
      
      const allUsers = await usersRes.json();
      console.log('All users (from REST API):', allUsers);


      // ✅ Use GraphQL for getting friends
      const friendsData = await client.request(GET_FRIENDS, { userId });
      const allRelations = friendsData.getAllFriends;


      if (!allRelations) {
        console.log("Friends is null, showing all users except current");
        setUsers(
          allUsers.filter(u => String(u.id) !== String(userId))
        );
        return;
      }


      const excludedIds = allRelations
        .filter(f =>
          String(f.user.id) === String(userId) ||
          f.status === "ACCEPTED"
        )
        .map(f =>
          String(f.user.id) === String(userId)
            ? String(f.friend.id)
            : String(f.user.id)
        );


      const filteredUsers = allUsers.filter(
        u =>
          String(u.id) !== String(userId) &&
          !excludedIds.includes(String(u.id))
      );


      setUsers(filteredUsers);
      console.log('Filtered users:', filteredUsers);


    } catch (err) {
      console.error(err);
    }
  };


  const handleAddFriend = async (friendId) => {
    try {
      await client.request(SEND_REQUEST, {
        userId: String(userId),
        friendId: String(friendId)
      });


      console.log("Friend request sent!");
      showToast("Friend request Sent","info");
      fetchUsers(); // refresh list


    } catch (err) {
      console.error(err);
    }
  };


  return (
    <div className="friends-container">
      <h2>Find Friends</h2>


      {users.length === 0 ? (
        <p className="empty">No users available</p>
      ) : (
        users.map(u => (
          <div key={u.id} className="friend-card">
            <span>{u.userName}</span>
            <button onClick={() => handleAddFriend(u.id)}>
              Add Friend
            </button>
          </div>
        ))
      )}
    </div>
  );
}


export default FindFriends;