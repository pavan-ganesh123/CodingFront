/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import "./Profile.css";
import { getUserFromToken } from "../utils/auth";
import { useToast } from "../notifications/ToastContext";
import getCroppedImg from "../utils/cropImage";
import Cropper from "react-easy-crop";
import { DotLottie } from "@lottiefiles/dotlottie-web";
import { FaCamera, FaEnvelope, FaUserFriends, FaSpinner } from "react-icons/fa";

function Profile() {
  // Route param — /profile/:username views someone else's profile;
  // plain /profile (no param) is always "me".
  const { username } = useParams();

  const [profile, setProfile] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(!username);
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
  const gridScrollRef = useRef(null);
  const authUser = getUserFromToken();
  const { showToast } = useToast();

  // ✅ All useEffects together at the top, before any early returns
  useEffect(() => {
    if (authUser) {
      fetchData();
    }
    // Re-run when the route's :username changes, so navigating from
    // one profile straight to another (without unmounting) still loads
    // the new person's data.
  }, [username]);

  // Scroll the activity heatmap to its rightmost edge once the yearly
  // submissions load, since the grid is always built oldest→newest and
  // the current month is therefore the last column.
  useEffect(() => {
    if (!gridScrollRef.current) return;
    gridScrollRef.current.scrollLeft = gridScrollRef.current.scrollWidth;
  }, [yearlySubmissions]);

  useEffect(() => {
    if (!userStats) return; // wait until stats are loaded
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
    if (!userStats) return; // wait until stats are loaded
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
    if (!userStats) return; // wait until stats are loaded
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

      // Own profile → the existing self-scoped endpoint (has email).
      // Someone else's → the public endpoint (id, userName, picture only).
      const profileUrl = username
        ? `https://codecache-13ic.onrender.com/api/users/u/${username}`
        : "https://codecache-13ic.onrender.com/api/users/profile";

      const profileResponse = await fetch(profileUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!profileResponse.ok) throw new Error("Failed to load profile");
      const profileData = await profileResponse.json();

      const viewingSelf =
        !username || (authUser && String(profileData.id) === String(authUser.userId));

      setProfile(profileData);
      setIsOwnProfile(viewingSelf);

      // Own profile → the self-scoped endpoints (token tells the
      // server who "me" is). Someone else's → the same data, but
      // addressed by their id instead.
      const countFriendsUrl = viewingSelf
        ? "https://codecache-13ic.onrender.com/api/users/countFriends"
        : `https://codecache-13ic.onrender.com/api/users/${profileData.id}/countFriends`;

      const statsUrl = viewingSelf
        ? "https://codecache-13ic.onrender.com/api/users/my-stats"
        : `https://codecache-13ic.onrender.com/api/users/${profileData.id}/stats`;

      const submissionsUrl = viewingSelf
        ? "https://codecache-13ic.onrender.com/api/users/my-yearly-submissions"
        : `https://codecache-13ic.onrender.com/api/users/${profileData.id}/yearly-submissions`;

      const friendResponse = await fetch(countFriendsUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!friendResponse.ok) throw new Error("Failed to load friend count");
      const count = await friendResponse.json();

      const statsResponse = await fetch(statsUrl, {
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

      const submissionsResponse = await fetch(submissionsUrl, {
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
      const response = await fetch("https://codecache-13ic.onrender.com/api/users/my-profile-picture", {
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
  if (!authUser) {
    return (
      <div className="pf-status-page">
        <div className="page-mesh" aria-hidden="true" />
        <div className="page-grain" aria-hidden="true" />
        <p className="pf-status-text">Please login again</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="pf-status-page">
        <div className="page-mesh" aria-hidden="true" />
        <div className="page-grain" aria-hidden="true" />
        <p className="pf-status-text">Loading...</p>
      </div>
    );
  }

  const columns = getContributionColumns();

  return (
    <div className="pf-page">
      <div className="page-mesh" aria-hidden="true" />
      <div className="page-grain" aria-hidden="true" />

      <div className="pf-shell">
        {/* LEFT SIDEBAR */}
        <div className="pf-sidebar">
          <div className="pf-sidebar-glow" aria-hidden="true" />

          <div
            className={`pf-avatar-wrapper ${!isOwnProfile ? "pf-avatar-wrapper--static" : ""}`}
            onClick={() => isOwnProfile && fileInputRef.current.click()}
          >
            {profile.profilePicture ? (
              <img src={profile.profilePicture} alt="Profile" className="pf-avatar-img" />
            ) : (
              <div className="pf-avatar-placeholder">
                {profile.userName?.charAt(0).toUpperCase()}
              </div>
            )}

            {isOwnProfile && (
              <div className="pf-avatar-overlay">
                {uploading ? (
                  <FaSpinner className="pf-avatar-spinner" />
                ) : (
                  <>
                    <FaCamera />
                    <span>Change</span>
                  </>
                )}
              </div>
            )}
          </div>

          {isOwnProfile && (
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
          )}

          <h1 className="pf-username">{profile.userName}</h1>

          <div className="pf-details">
            {profile.email && (
              <div className="pf-detail-row">
                <FaEnvelope className="pf-detail-icon" />
                <span className="pf-detail-text">{profile.email}</span>
              </div>
            )}
            <div className="pf-detail-row">
              <FaUserFriends className="pf-detail-icon" />
              <span className="pf-detail-text">{friendCount} friends</span>
            </div>
          </div>

          {userStats && (
            <div className="pf-stats">
              <div className="pf-stat-card">
                <div className="pf-icon-box">
                  <canvas ref={DiamondCanvasRef} width="60" height="60" className="pf-stat-canvas" />
                </div>
                <div className="pf-stat-value">{userStats.totalPoints}</div>
                <div className="pf-stat-label">Points</div>
              </div>

              <div className="pf-stat-card">
                <div className="pf-icon-box">
                  <canvas ref={StreakCanvasRef} width="50" height="50" className="pf-stat-canvas" />
                </div>
                <div className="pf-stat-value">{userStats.longestStreak}</div>
                <div className="pf-stat-label">Longest streak</div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SECTION */}
        <div className="pf-main">
          <div className="pf-main-glow" aria-hidden="true" />

          {userStats && (
            <div className="pf-streak-banner">
              <div className="pf-icon-box pf-icon-box--lg">
                <canvas ref={fireCanvasRef} width="46" height="46" className="pf-streak-canvas" />
              </div>
              <div className="pf-streak-copy">
                <span className="pf-streak-number">{userStats.currentStreak}</span>
                <span className="pf-streak-label">day streak</span>
              </div>
            </div>
          )}

          <div className="pf-heatmap-head">
            <span className="pf-heatmap-title">Activity</span>
            <div className="pf-heatmap-legend">
              <span>Less</span>
              <span className="pf-legend-swatch pf-level0" />
              <span className="pf-legend-swatch pf-level1" />
              <span className="pf-legend-swatch pf-level2" />
              <span className="pf-legend-swatch pf-level3" />
              <span className="pf-legend-swatch pf-level4" />
              <span>More</span>
            </div>
          </div>

          {/* GRID SCROLL WRAPPER */}
          <div className="pf-grid-scroll" ref={gridScrollRef}>
            <div style={{ display: "inline-block", minWidth: "max-content" }}>
              {/* MONTH LABELS ROW */}
              <div className="pf-months-row">
                {columns.map((col, i) =>
                  col.type === "spacer" ? (
                    <div key={i} className="pf-month-label pf-month-spacer" />
                  ) : (
                    <div key={i} className="pf-month-label pf-month-week">
                      {col.newMonth || ""}
                    </div>
                  )
                )}
              </div>

              {/* CONTRIBUTION GRID */}
              <div className="pf-contribution-grid">
                {columns.map((col, i) =>
                  col.type === "spacer" ? (
                    <div key={i} className="pf-spacer-column" />
                  ) : (
                    <div key={i} className="pf-week-column">
                      {col.days.map((date, d) => {
                        if (!date) {
                          return <div key={d} className="pf-empty-box" />;
                        }
                        const key = formatDateKey(date);
                        const count = yearlySubmissions[key] || 0;

                        let levelClass = "pf-level0";
                        if (count >= 1) levelClass = "pf-level1";
                        if (count >= 3) levelClass = "pf-level2";
                        if (count >= 5) levelClass = "pf-level3";
                        if (count >= 10) levelClass = "pf-level4";

                        return (
                          <div
                            key={key}
                            className={`pf-day-box ${levelClass}`}
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
      </div>

      {/* Crop Modal */}
      {isOwnProfile && showCropModal && (
        <div className="pf-crop-modal">
          <div className="pf-crop-card">
            <div className="pf-crop-container">
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

            <div className="pf-crop-controls">
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="pf-crop-zoom"
              />

              <div className="pf-crop-actions">
                <button
                  className="pf-crop-cancel"
                  onClick={() => {
                    setShowCropModal(false);
                    setSelectedImage(null);
                  }}
                >
                  Cancel
                </button>

                <button className="pf-crop-save" onClick={handleCropSave} disabled={uploading}>
                  {uploading ? <FaSpinner className="pf-crop-save-spinner" /> : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
