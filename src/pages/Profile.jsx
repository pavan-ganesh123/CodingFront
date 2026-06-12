/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from "react";
import "./Profile.css";
import { getUserFromToken } from "../utils/auth";
import { useToast } from "../notifications/ToastContext";
import getCroppedImg from "../utils/cropImage";
import Cropper from "react-easy-crop";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Profile() {
  const [profile, setProfile] = useState(null);
  const [friendCount, setFriendCount] = useState(0);
  const [userStats, setUserStats] = useState(null);
  const [yearlySubmissions, setYearlySubmissions] = useState({});
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const fileInputRef = useRef(null);
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

      const profileResponse = await fetch("http://localhost:8080/api/users/profile", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!profileResponse.ok) throw new Error("Failed to load profile");
      const profileData = await profileResponse.json();

      const friendResponse = await fetch("http://localhost:8080/api/users/countFriends", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!friendResponse.ok) throw new Error("Failed to load friend count");
      const count = await friendResponse.json();

      const statsResponse = await fetch(`http://localhost:8080/api/users/my-stats`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      let stats = null;
      if (statsResponse.ok) {
        const statsText = await statsResponse.text();
        if (statsText.trim()) {
          stats = JSON.parse(statsText);
        }
      }

      const submissionsResponse = await fetch(`http://localhost:8080/api/users/my-yearly-submissions`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      let submissions = {};
      if (submissionsResponse.ok) {
        const submissionsText = await submissionsResponse.text();
        if (submissionsText.trim()) {
          submissions = JSON.parse(submissionsText);
        }
      }
      setProfile(profileData);
      setFriendCount(count);
      setUserStats(stats);
      setYearlySubmissions(submissions);
    } catch (err) {
      console.error("Profile Error:", err);
      showToast("Please login again!", "error");
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("Image must be under 2MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const uploadProfilePicture = async (base64Image) => {
    try {
      setUploading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8080/api/users/my-profile-picture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profilePicture: base64Image }),
      });

      if (!response.ok) throw new Error("Upload failed");

      setProfile((prev) => ({ ...prev, profilePicture: base64Image }));
      showToast("Profile picture updated!", "success");
    } catch (err) {
      console.error("Upload Error:", err);
      showToast("Failed to upload picture", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleCropSave = async () => {
    try {
      const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels);
      await uploadProfilePicture(croppedImage);
      setShowCropModal(false);
      setSelectedImage(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    } catch (err) {
      console.error(err);
      showToast("Failed to crop image", "error");
    }
  };

  // Prepare chart data
  const chartData = {
    labels: Object.keys(yearlySubmissions),
    datasets: [
      {
        label: "Question Submissions",
        data: Object.values(yearlySubmissions),
        backgroundColor: Object.keys(yearlySubmissions).map((date) => {
          // Check if consecutive (previous day exists)
          const prevDate = new Date(date);
          prevDate.setDate(prevDate.getDate() - 1);
          const prevDateStr = prevDate.toISOString().split("T")[0];
          return yearlySubmissions[prevDateStr] ? "#4CAF50" : "#2196F3";
        }),
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Yearly Question Submissions",
        font: { size: 16 },
      },
      tooltip: {
        callbacks: {
          title: (context) => `Date: ${context[0].label}`,
          label: (context) => `Submissions: ${context[0].parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Date",
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: { size: 10 },
        },
      },
      y: {
        title: {
          display: true,
          text: "Number of Submissions",
        },
        beginAtZero: true,
      },
    },
  };

  if (!authUser) return <p>Please login again</p>;
  if (!profile) return <p>Loading...</p>;

  return (
    <div className="profile-container">
      <h2>Profile</h2>
      <div className="profile-card">
        {/* Profile Picture */}
        <div className="profile-picture-wrapper" onClick={() => fileInputRef.current.click()}>
          {profile.profilePicture ? (
            <img src={profile.profilePicture} alt="Profile" className="profile-picture" />
          ) : (
            <div className="profile-picture-placeholder">
              {profile.userName?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="profile-picture-overlay">
            {uploading ? "Uploading..." : "Change"}
          </div>
        </div>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleImageChange}
        />

        <p><strong>Name:</strong> {profile.userName}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Friends:</strong> {friendCount}</p>
        {
        showCropModal && (
          <div className="crop-modal">

            <div className="crop-container">

              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(croppedArea, croppedAreaPixels) =>
                  setCroppedAreaPixels(croppedAreaPixels)
                }
              />

            </div>

            <div className="crop-controls">

              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />

              <button
                className="save-crop-btn"
                onClick={handleCropSave}
              >
                Save
              </button>

              <button
                className="cancel-crop-btn"
                onClick={() => {
                  setShowCropModal(false);
                  setSelectedImage(null);
                }}
              >
                Cancel
              </button>

            </div>

          </div>
        )
      }
        {/* NEW: Stats Section */}
        {userStats && (
          <div className="user-stats">
            <h3>📊 Your Stats</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-value">{userStats.totalPoints}</div>
                <div className="stat-label">Points</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔥</div>
                <div className="stat-value">{userStats.currentStreak}</div>
                <div className="stat-label">Current Streak</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏆</div>
                <div className="stat-value">{userStats.longestStreak}</div>
                <div className="stat-label">Longest Streak</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NEW: Yearly Submissions Chart */}
      {userStats && yearlySubmissions && Object.keys(yearlySubmissions).length > 0 && (
        <div className="submissions-chart">
          <h3>📅 Yearly Question Submissions</h3>
          <div className="chart-container">
            <Bar data={chartData} options={chartOptions} height={300} />
          </div>
          <div className="chart-legend">
            <span className="legend-item">
              <span className="legend-color green"></span> Consecutive Days
            </span>
            <span className="legend-item">
              <span className="legend-color blue"></span> Non-Consecutive
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;