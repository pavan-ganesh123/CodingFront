/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react";
import { getClient } from "../api/graphqlClient";
import { gql } from "graphql-request";
import "./Profile.css";
import { getUserFromToken } from "../utils/auth";

function Profile() {

  const [profile, setProfile] = useState(null);
  const [friendCount, setFriendCount] = useState(0);

  const authUser = getUserFromToken();   
  const userId = authUser?.userId;

  const client = getClient();

  const GET_USER = gql`
    query {
      getCurrentUser {
        id
        userName
        email
      }
    }
  `;


  const GET_FRIENDS = gql`
    query($userId: ID!) {
      getFriends(userId: $userId) {
        id
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
      const userData = await client.request(GET_USER);
      const friendsData = await client.request(GET_FRIENDS, { userId });
      setProfile(userData.getCurrentUser);
      setFriendCount(friendsData.getFriends.length);

    } catch (err) {
      console.error("Profile Error:", err);
    }
  };

  if (!userId) return <p>Please login again</p>;

  if (!profile) return <p>Loading...</p>;

  return (
    <div className="profile-container">

      <h2>Profile</h2>

      <div className="profile-card">
        <p><strong>Name:</strong> {profile.userName}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Friends:</strong> {friendCount}</p>
      </div>

    </div>
  );
}

export default Profile;