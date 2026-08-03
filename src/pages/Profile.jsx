/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from "react";
import "./Profile.css";
import { getUserFromToken } from "../utils/auth";
import { useToast } from "../notifications/ToastContext";
import getCroppedImg from "../utils/cropImage";
import Cropper from "react-easy-crop";
import { DotLottie } from "@lottiefiles/dotlottie-web";

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
  const fireCanvasRef = useRef(null);
  const DiamondCanvasRef = useRef(null);
  const StreakCanvasRef = useRef(null);
  const authUser = getUserFromToken();
  const { showToast } = useToast();

  // ✅ All useEffects together at the top, before any early returns
  useEffect(() => {
    if (authUser) {
      fetchData();
    }
  }, []);

  useEffect(() => {
    if (!userStats) return;        // wait until stats are loaded
    if (!fireCanvasRef.current) return;

    const dotLottie = new DotLottie({
      autoplay: true,
      loop: true,
      canvas: fireCanvasRef.current,
      src: "/Fire.lottie",
    });

    return () => dotLottie.destroy();
  }, [userStats]); // re-runs when userStats loads and canvas becomes visible

    useEffect(() => {
      if (!userStats) return;        // wait until stats are loaded
      if (!DiamondCanvasRef.current) return;

      const dotLottie = new DotLottie({
        autoplay: true,
        loop: true,
        canvas: DiamondCanvasRef.current,
        src: "/Points.lottie",
      });

      return () => dotLottie.destroy();
    }, [userStats]); 
    
    useEffect(() => {
      if (!userStats) return;        // wait until stats are loaded
      if (!StreakCanvasRef.current) return;

      const dotLottie = new DotLottie({
        autoplay: true,
        loop: true,
        canvas: StreakCanvasRef.current,
        src: "/Streak.lottie",
      });

      return () => dotLottie.destroy();
    }, [userStats]); 
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

      const statsResponse = await fetch("http://localhost:8080/api/users/my-stats", {
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

      const submissionsResponse = await fetch(
        "http://localhost:8080/api/users/my-yearly-submissions",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

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
      const response = await fetch(
        "http://localhost:8080/api/users/my-profile-picture",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ profilePicture: base64Image }),
        }
      );

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

  const formatDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getContributionColumns = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    startDate.setHours(0, 0, 0, 0);

    const columns = [];
    let currentCol = null;
    let prevMonth = -1;
    const cur = new Date(startDate);

    while (cur <= today) {
      const dow = cur.getDay();
      const month = cur.getMonth();

      if (prevMonth !== -1 && month !== prevMonth) {
        if (currentCol) columns.push(currentCol);
        columns.push({ type: "spacer" });
        currentCol = {
          type: "week",
          days: Array(7).fill(null),
          newMonth: cur.toLocaleString("default", { month: "short" }),
        };
        currentCol.days[dow] = new Date(cur);
      } else if (!currentCol) {
        currentCol = {
          type: "week",
          days: Array(7).fill(null),
          newMonth: cur.toLocaleString("default", { month: "short" }),
        };
        currentCol.days[dow] = new Date(cur);
      } else if (dow === 0 && currentCol.days.some((d) => d !== null)) {
        columns.push(currentCol);
        currentCol = {
          type: "week",
          days: Array(7).fill(null),
          newMonth: null,
        };
        currentCol.days[dow] = new Date(cur);
      } else {
        currentCol.days[dow] = new Date(cur);
      }

      prevMonth = month;
      cur.setDate(cur.getDate() + 1);
    }

    if (currentCol) columns.push(currentCol);
    return columns;
  };

  // ✅ Early returns AFTER all hooks
  if (!authUser) return <p>Please login again</p>;
  if (!profile) return <p>Loading...</p>;

  const columns = getContributionColumns();

  return (
    <div className="profile-container">
      {/* LEFT SIDEBAR */}
      <div className="profile-sidebar">
        <div
          className="profile-picture-wrapper"
          onClick={() => fileInputRef.current.click()}
        >
          {profile.profilePicture ? (
            <img
              src={profile.profilePicture}
              alt="Profile"
              className="profile-picture"
            />
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

        <h2 className="profile-username">{profile.userName}</h2>

        <div className="profile-details">
          <p>
            <strong>Email</strong>
            <br />
            {profile.email}
          </p>

          <p>
            <strong>Friends</strong>
            <br />
            {friendCount}
          </p>
        </div>

        {userStats && (
          <div className="user-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <canvas ref={DiamondCanvasRef} width="65" height="65" />
              </div>
              <div className="stat-value">{userStats.totalPoints}</div>
              <div className="stat-label">Points</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <canvas ref={StreakCanvasRef} width="55" height="55" />
                <div className="stat-value">{userStats.longestStreak}</div>
              </div>
              <div className="stat-label">Longest Streak</div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SECTION */}
      <div className="profile-main">
        {userStats && (
          <div className="streak-card">
              {/* ✅ width/height as attributes, not just CSS */}
              <canvas ref={fireCanvasRef} width="50" height="50" />
            <div className="streak-number">{userStats.currentStreak}</div>
          </div>
        )}

        {/* GRID SCROLL WRAPPER */}
        <div className="grid-scroll-wrapper">
          <div style={{ display: "inline-block", minWidth: "max-content" }}>

            {/* MONTH LABELS ROW */}
            <div className="months-row">
              {columns.map((col, i) =>
                col.type === "spacer" ? (
                  <div key={i} className="month-label month-spacer" />
                ) : (
                  <div key={i} className="month-label month-week">
                    {col.newMonth || ""}
                  </div>
                )
              )}
            </div>

            {/* CONTRIBUTION GRID */}
            <div className="contribution-grid">
              {columns.map((col, i) =>
                col.type === "spacer" ? (
                  <div key={i} className="spacer-column" />
                ) : (
                  <div key={i} className="week-column">
                    {col.days.map((date, d) => {
                      if (!date) {
                        return <div key={d} className="empty-box" />;
                      }
                      const key = formatDateKey(date);
                      const count = yearlySubmissions[key] || 0;

                      let levelClass = "level0";
                      if (count >= 1) levelClass = "level1";
                      if (count >= 3) levelClass = "level2";
                      if (count >= 5) levelClass = "level3";
                      if (count >= 10) levelClass = "level4";

                      return (
                        <div
                          key={key}
                          className={`day-box ${levelClass}`}
                          title={`${key}: ${count} submissions`}
                        />
                      );
                    })}
                  </div>
                )
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && (
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

            <button className="save-crop-btn" onClick={handleCropSave}>
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
      )}
    </div>
  );
}

export default Profile;