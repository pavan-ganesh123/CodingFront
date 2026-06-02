/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react";
import "./Profile.css";
import { getUserFromToken } from "../utils/auth";
import { useToast } from "../notifications/ToastContext";

function Profile() {

  const [profile, setProfile] = useState(null);
  const [friendCount, setFriendCount] = useState(0);

  const authUser = getUserFromToken();
  const { showToast } = useToast();

  useEffect(() => {
    if (authUser) {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    try {

      const token = localStorage.getItem("token");

      const profileResponse = await fetch(
        "http://localhost:8080/api/users/profile",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!profileResponse.ok) {
        throw new Error("Failed to load profile");
      }

      const profileData = await profileResponse.json();

      const friendResponse = await fetch(
        "http://localhost:8080/api/users/countFriends",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!friendResponse.ok) {
        throw new Error("Failed to load friend count");
      }

      const count = await friendResponse.json();

      setProfile(profileData);
      setFriendCount(count);

    } catch (err) {
      console.error("Profile Error:", err);
      showToast("Please login again!", "error");
    }
  };

  if (!authUser) {
    return <p>Please login again</p>;
  }

  if (!profile) {
    return <p>Loading...</p>;
  }

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