import React, { useState } from "react";
import axios from "axios";
import { FaRegThumbsUp } from "react-icons/fa6";

const LikeButton = ({ postId, initialCount = 0, initiallyLiked = false, onToggle }) => {
    const [liked, setLiked] = useState(initiallyLiked);
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem("token");

    const handleToggle = async () => {
        if (loading) return;
        const nextLiked = !liked;
        setLoading(true);
        try {
            if (nextLiked) {
                await axios.post(
                    `http://localhost:8080/api/posts/${postId}/like`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                await axios.delete(
                    `http://localhost:8080/api/posts/${postId}/like`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            setLiked(nextLiked);
            onToggle(nextLiked); // tell parent to inc/dec count
        } catch (error) {
            console.error(error);
            // optionally surface "already liked" / "not liked yet" state sync issues here
        } finally {
            setLoading(false);
        }
    };

    return (
        <button className="like-btn" disabled={loading} onClick={handleToggle}>
            <FaRegThumbsUp className={liked ? "liked" : ""} size={18} />
            <span>{initialCount}</span>
        </button>
    );
};

export default LikeButton;
