/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from "react";
import "./Profile.css";
import { getUserFromToken } from "../utils/auth";
import { useToast } from "../notifications/ToastContext";
import getCroppedImg from "../utils/cropImage";
import Cropper from "react-easy-crop";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [friendCount, setFriendCount] = useState(0);
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

      setProfile(profileData);
      setFriendCount(count);
    } catch (err) {
      console.error("Profile Error:", err);
      showToast("Please login again!", "error");
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file", "error");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image must be under 2MB", "error");
      return;
    }

    // Convert to Base64
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

      // Update profile locally so UI reflects new picture instantly
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
      const croppedImage = await getCroppedImg(
        selectedImage,
        croppedAreaPixels
      );

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

  if (!authUser) return <p>Please login again</p>;
  if (!profile) return <p>Loading...</p>;

  return (
    <div className="profile-container">
      <h2>Profile</h2>
      <div className="profile-card">

        {/* Profile Picture */}
        <div className="profile-picture-wrapper" onClick={() => fileInputRef.current.click()}>
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

        <p><strong>Name:</strong> {profile.userName}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Friends:</strong> {friendCount}</p>
      </div>
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
    </div>
  );
}

export default Profile;