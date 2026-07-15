import React, { useState } from "react";
import axios from "axios";
import { FaRegThumbsUp } from "react-icons/fa6";

const LikeButton = ({ postId, initialCount = 0, onLiked }) => {
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem("token");

    const handleLike = async () => {
        try {
            setLoading(true);
            await axios.post(
                `http://localhost:8080/api/posts/${postId}/like`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onLiked();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button className="like-btn" disabled={loading} onClick={handleLike}>
            <FaRegThumbsUp className="like-icon" size={18} />
            <span>{initialCount}</span>
        </button>
    );
};

export default LikeButton;