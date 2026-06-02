import React, { useState } from "react";
import axios from "axios";

const LikeButton = ({
    postId,
    initialCount = 0,
    refreshFeed
}) => {

    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem("token");

    const handleLike = async () => {

        try {

            setLoading(true);

            await axios.post(
                `http://localhost:8080/api/posts/${postId}/like`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            refreshFeed();

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }
    };

    return (
        <button
            className="action-btn"
            disabled={loading}
            onClick={handleLike}
        >
            👍 {initialCount}
        </button>
    );
};

export default LikeButton;