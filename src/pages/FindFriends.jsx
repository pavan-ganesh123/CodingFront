/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react";
import { getClient } from "../api/graphqlClient";
import { gql } from "graphql-request";
import "./FindFriends.css";
import { getUserFromToken } from "../utils/auth";
import { ToastProvider, useToast } from "../notifications/ToastContext";

function FindFriends() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const user = getUserFromToken();
  const userId = user?.userId;
  const client = getClient();
  const { showToast } = useToast();

  const SEND_REQUEST = gql`
    mutation($userId: ID!, $friendId: ID!) {
      sendFriendRequest(userId: $userId, friendId: $friendId) {
        id
        status
      }
    }
  `;

  // Only fetch when search query changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchUsers(searchQuery.trim());
      } else {
        setUsers([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUsers = async (query) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      const url = `http://localhost:8080/api/users/search?query=${query}`;
      
      const usersRes = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!usersRes.ok) {
        throw new Error(`HTTP error! status: ${usersRes.status}`);
      }
      
      const allUsers = await usersRes.json();
      setUsers(allUsers); // Backend already filters out friends/pending
      
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch users", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFriend = async (friendId) => {
    try {
      await client.request(SEND_REQUEST, {
        userId: String(userId),
        friendId: String(friendId)
      });

      console.log("Friend request sent!");
      showToast("Friend request sent", "info");
      
      // Optional: Clear search or remove user from list
      setUsers(users.filter(u => u.id !== friendId));
      
    } catch (err) {
      console.error(err);
      showToast("Failed to send friend request", "error");
    }
  };

  return (
    <div className="friends-container">
      <h2>Find Friends</h2>
      
      {/* Search Bar Only - No "All Users" */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Enter username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          autoFocus
        />
      </div>
      {searchQuery && isLoading && (
        <p className="loading">Searching...</p>  
      )}
      {searchQuery && !isLoading && users.length === 0 ? (
        <p className="empty">No users match "{searchQuery}"</p>
      ) : !searchQuery && users.length === 0 ? (
        <p className="empty">
          Start typing a username to find friends.<br />
        </p>
      ) : (
        <div className="user-list">
          {users.map(u => (
            <div key={u.id} className="friend-card">
              <span>{u.userName}</span>
              <button onClick={() => handleAddFriend(u.id)}>
                Add Friend
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FindFriends;