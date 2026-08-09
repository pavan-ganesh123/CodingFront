import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PostCard from "./PostCard";
import "./MyPosts.css";
import { FaArrowLeft, FaRegNewspaper, FaExclamationTriangle } from "react-icons/fa";

const MyPostsPage = () => {
    const navigate = useNavigate();

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentUser, setCurrentUser] = useState(null);

    const fetchMyPosts = async () => {

        try {

            setLoading(true);

            const token = localStorage.getItem("token");

            const userRes = await axios.get(
                "https://codecache-13ic.onrender.com/api/users/me",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setCurrentUser(userRes.data);

            const response = await axios.get(
                "https://codecache-13ic.onrender.com/api/posts/mine",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setPosts(response.data);
            setError("");

        } catch (err) {

            console.error(err);
            setError("Unable to load your posts.");

        } finally {

            setLoading(false);

        }
    };

    // Same update-in-place pattern FeedPage uses — PostCard's LikeButton
    // calls this unconditionally, so it has to exist here too.
    const updatePost = (postId, updater) => {
        setPosts((prev) =>
            prev.map((p) => (p.id === postId ? updater(p) : p))
        );
    };

    useEffect(() => {

        fetchMyPosts();

    }, []);

    if (loading) {
        return (
            <div className="mp-page">
                <div className="mp-header">
                    <button className="mp-back" onClick={() => navigate(-1)}>
                        <FaArrowLeft />
                        Back
                    </button>
                    <span className="mp-kicker">$ posts --mine</span>
                    <h1 className="mp-title">My posts</h1>
                    <p className="mp-subtitle">Problems solved</p>
                </div>

                <div className="mp-skeleton-list" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                        <div className="mp-skeleton-card" key={i} style={{ animationDelay: `${i * 90}ms` }}>
                            <div className="mp-skeleton-header">
                                <div className="mp-skeleton-avatar" />
                                <div className="mp-skeleton-lines">
                                    <div className="mp-skeleton-bar mp-skeleton-bar--name" />
                                    <div className="mp-skeleton-bar mp-skeleton-bar--time" />
                                </div>
                            </div>
                            <div className="mp-skeleton-bar mp-skeleton-bar--title" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mp-page">
                <div className="mp-header">
                    <button className="mp-back" onClick={() => navigate(-1)}>
                        <FaArrowLeft />
                        Back
                    </button>
                </div>
                <div className="mp-state">
                    <FaExclamationTriangle className="mp-state-icon" />
                    <p className="mp-state-title">{error}</p>
                    <button className="mp-retry-btn" onClick={fetchMyPosts}>
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mp-page">
            <div className="mp-header">
                <button className="mp-back" onClick={() => navigate(-1)}>
                    <FaArrowLeft />
                    Back
                </button>
                <span className="mp-kicker">$ posts --mine</span>
                <h1 className="mp-title">My posts</h1>
                <p className="mp-subtitle">Problems solved</p>
            </div>

            {posts.length === 0 ? (
                <div className="mp-state">
                    <FaRegNewspaper className="mp-state-icon" />
                    <p className="mp-state-title">You haven't created any posts yet</p>
                    <p className="mp-state-copy">Log a problem and share it to see it here.</p>
                </div>
            ) : (
                <div className="mp-list">
                    {posts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            updatePost={updatePost}
                            refreshFeed={fetchMyPosts}
                            profilePicture={post.profilePicture}
                            currentUser={currentUser}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyPostsPage;
