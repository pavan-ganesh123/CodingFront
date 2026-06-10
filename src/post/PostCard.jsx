import React, { useState, useEffect } from "react";
import axios from "axios";
import "./PostCard.css";
import LikeButton from "./LikeButton";
import CommentCard from "./CommentCard";
import { useNavigate } from "react-router-dom";

const PostCard = ({ post, refreshFeed, profilePicture }) => {

    const [comments, setComments] = useState([]);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    const fetchComments = async () => {

        try {

            setLoadingComments(true);

            const response = await axios.get(
                `http://localhost:8080/api/posts/${post.id}/comments`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setComments(response.data);

        } catch (error) {

            console.error(error);

        } finally {

            setLoadingComments(false);

        }
    };

    const handleUnlike = async () => {

        try {

            await axios.delete(
                `http://localhost:8080/api/posts/${post.id}/like`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            refreshFeed();

        } catch (error) {

            console.error(error);

        }
    };

    
    const handleCommentSubmit = async () => {

        if (!commentText.trim()) {
            return;
        }

        try {

            await axios.post(
                `http://localhost:8080/api/posts/${post.id}/comments`,
                {
                    comment: commentText
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setCommentText("");

            fetchComments();

            refreshFeed();

        } catch (error) {

            console.error(error);

        }
    };

    const toggleComments = () => {

        const nextState = !showComments;

        setShowComments(nextState);

        if (nextState) {
            fetchComments();
        }
    };

    const formatDate = (dateString) => {

        try {

            return new Date(dateString)
                .toLocaleString();

        } catch {

            return "";
        }
    };

    return (

        <div className="post-card">

            <div className="post-header">

                <div className="avatar">
                    {profilePicture ? (
                        <img
                            src={profilePicture}
                            alt={post.userName}
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                        />
                    ) : (
                        post.userName?.charAt(0)?.toUpperCase()
                    )}
                </div>

                <div>

                    <h3>
                        {post.userName}
                    </h3>

                    <span className="post-time">
                        {formatDate(post.createdAt)}
                    </span>

                </div>

            </div>

            <div className="post-content">

                <div className="post-message">

                    <div
                        className="problem-title"
                        onClick={() =>
                            navigate(`/post/${post.id}`)
                        }
                    >
                        {post.questionTitle}
                    </div>

                </div>


            </div>


            <div className="post-actions">

                <LikeButton
                    postId={post.id}
                    initialCount={post.likesCount}
                    refreshFeed={refreshFeed}
                />

                <button
                    className="action-btn"
                    onClick={handleUnlike}
                >
                    👎 Unlike
                </button>

                <button
                    className="action-btn"
                    onClick={toggleComments}
                >
                    💬 Comments
                </button>

            </div>

            {showComments && (

                <div className="commentws-section">

                    <div className="commentw-input-row">

                        <input
                            type="text"
                            placeholder="Write a comment..."
                            value={commentText}
                            onChange={(e) =>
                                setCommentText(e.target.value)
                            }
                        />

                        <button
                            onClick={handleCommentSubmit}
                        >
                            Post
                        </button>

                    </div>

                    {loadingComments ? (

                        <div className="loading-comments">
                            Loading comments...
                        </div>

                    ) : (

                        comments.map((comment) => (
                            <CommentCard
                                key={comment.id}
                                comment={comment}
                            />

                        ))

                    )}

                </div>

            )}

        </div>

    );
};

export default PostCard;