/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react";
import { getClient } from "../api/graphqlClient";
import { gql } from "graphql-request";
import { FaSearch, FaUserPlus, FaSpinner, FaUsers } from "react-icons/fa";
import "./FindFriends.css";
import { getUserFromToken } from "../utils/auth";
import { useToast } from "../notifications/ToastContext";

const AVATAR_ACCENTS = ["primary", "teal", "rose"];

function accentFor(name) {
  const code = (name || "?").charCodeAt(0) || 0;
  return AVATAR_ACCENTS[code % AVATAR_ACCENTS.length];
}

function FindFriends() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);

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

      const url = `https://codecache-13ic.onrender.com/api/users/search?query=${query}`;

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
    setAddingId(friendId);
    try {
      await client.request(SEND_REQUEST, {
        userId: String(userId),
        friendId: String(friendId),
      });

      showToast("Friend request sent", "info");

      // Optional: Clear search or remove user from list
      setUsers(users.filter((u) => u.id !== friendId));
    } catch (err) {
      console.error(err);
      showToast("Failed to send friend request", "error");
    } finally {
      setAddingId(null);
    }
  };

  const showIdle = !searchQuery && users.length === 0;
  const showEmpty = searchQuery && !isLoading && users.length === 0;
  const showResults = !isLoading && users.length > 0;

  return (
    <div className="ff-page">
      <div className="ff-header">
        <span className="ff-kicker">$ find --friends</span>
        <h1 className="ff-title">Find friends</h1>
        <p className="ff-subtitle">Search by username and send a request.</p>
      </div>

      <div className="ff-search-wrap">
        <FaSearch className="ff-search-icon" aria-hidden="true" />
        <input
          type="text"
          placeholder="Enter username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ff-search-input"
          autoFocus
        />
      </div>

      <div className="ff-results">
        {searchQuery && isLoading && (
          <div className="ff-skeleton-list" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div className="ff-skeleton" key={i} style={{ animationDelay: `${i * 90}ms` }}>
                <div className="ff-skeleton-avatar" />
                <div className="ff-skeleton-bar" />
                <div className="ff-skeleton-btn" />
              </div>
            ))}
          </div>
        )}

        {showIdle && !isLoading && (
          <div className="ff-state">
            <FaSearch className="ff-state-icon" />
            <p className="ff-state-title">Start typing a username</p>
            <p className="ff-state-copy">Find people you know and send them a friend request.</p>
          </div>
        )}

        {showEmpty && (
          <div className="ff-state">
            <FaUsers className="ff-state-icon" />
            <p className="ff-state-title">No users match "{searchQuery}"</p>
            <p className="ff-state-copy">Try a different username, or check the spelling.</p>
          </div>
        )}

        {showResults &&
          users.map((u, i) => (
            <div className="ff-card" key={u.id} style={{ animationDelay: `${i * 45}ms` }}>
              <span className={`ff-avatar ff-avatar--${accentFor(u.userName)}`}>
                {(u.userName || "?").charAt(0).toUpperCase()}
              </span>
              <span className="ff-card-name">{u.userName}</span>
              <button
                className="ff-add-btn"
                onClick={() => handleAddFriend(u.id)}
                disabled={addingId === u.id}
              >
                {addingId === u.id ? (
                  <FaSpinner className="ff-add-spinner" />
                ) : (
                  <>
                    <FaUserPlus />
                    Add
                  </>
                )}
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

export default FindFriends;
