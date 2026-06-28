/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState } from "react";
import axios from "axios";
import "./PostCard.css";
import LikeButton from "./LikeButton";
import CommentCard from "./CommentCard";
import { useNavigate } from "react-router-dom";
import { useFriends } from "../hooks/useFriends";
import { getUserFromToken } from "../utils/auth";
import {
    useWebSocket
} from "../context/WebSocketContext";

const PostCard = ({ post, refreshFeed, profilePicture, currentUser }) => {
    const [comments, setComments] = useState([]);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadMessage, setUploadMessage] = useState("");
    const [showShareModal, setShowShareModal] = useState(false);
    
    const [selectedFriends, setSelectedFriends] = useState([]);
    const canUploadImage = currentUser && currentUser.id === post.userId;
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const socketRef = useWebSocket();
    const user = getUserFromToken();
    const userId = user?.userId;
    const {
        data: friends = []
    } = useFriends(userId);
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
            return new Date(dateString).toLocaleString();
        } catch {
            return "";
        }
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
        setUploadMessage("");
    };

    const handleImageUpload = async () => {
        if (!selectedFile) {
            setUploadMessage("Please select an image first.");
            return;
        }

        try {
            setUploadingImage(true);
            setUploadMessage("");

            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("userId", localStorage.getItem("userId"));

            await axios.post(
                `http://localhost:8080/api/posts/${post.id}/images`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setSelectedFile(null);
            setUploadMessage("Image uploaded successfully. It is pending approval.");
            refreshFeed();
        } catch (error) {
            console.error(error);
            setUploadMessage("Image upload failed.");
        } finally {
            setUploadingImage(false);
        }
    };

    const openShareModal = async () => {
    try {

        setSelectedFriends([]);
        setShowShareModal(true);

    } catch (err) {

        console.error(err);

        setShowShareModal(false);
    }
};
    
    const handleShare = () => {

    if (
        !socketRef.current ||
        socketRef.current.readyState !==
            WebSocket.OPEN
    ) {
        alert(
            "Chat connection unavailable"
        );
        return;
    }

    selectedFriends.forEach(friendId => {

        socketRef.current.send(
            JSON.stringify({
                type: "share_post",
                to: String(friendId),
                postId: String(post.id),
                postTitle: post.questionTitle,
                postImage: post.imageUrl
            })
        );

    });

    setSelectedFriends([]);
    setShowShareModal(false);
};
    return (
        <div className="post-card">
            <div className="post-header">
                <div className="avatar">
                    {profilePicture ? (
                        <img
                            src={profilePicture}
                            alt={post.userName}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: "50%"
                            }}
                        />
                    ) : (
                        post.userName?.charAt(0)?.toUpperCase()
                    )}
                </div>

                <div>
                    <h3>{post.userName}</h3>
                    <span className="post-time">
                        {formatDate(post.createdAt)}
                    </span>
                </div>
            </div>

            <div className="post-content">
                <div className="post-message">
                    <div
                        className="problem-title"
                        onClick={() => navigate(`/post/${post.id}`)}
                    >
                        {post.questionTitle}
                    </div>
                </div>

                {post.imageUrl ? (
                    <div className="post-image-wrapper">
                        <img
                            src={post.imageUrl}
                            alt={post.questionTitle}
                            loading="lazy"
                            className="post-image"
                        />
                    </div>
                ) : canUploadImage ? (
                    <div className="post-image-upload">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <button
                            className="action-btn"
                            onClick={handleImageUpload}
                            disabled={uploadingImage}
                        >
                            {uploadingImage ? "Uploading..." : "Upload Image"}
                        </button>

                        {uploadMessage && (
                            <div className="upload-message">
                                {uploadMessage}
                            </div>
                        )}
                    </div>
                ) : null}
            </div>

            <div className="post-actions">
                <LikeButton
                    postId={post.id}
                    initialCount={post.likesCount}
                    refreshFeed={refreshFeed}
                />

                <button className="action-btn" onClick={handleUnlike}>
                    👎 Unlike
                </button>

                <button className="action-btn" onClick={toggleComments}>
                    💬 Comments
                </button>
                <button
                    className="action-btn"
                    onClick={openShareModal}
                >
                    📤 Share
                </button>
            </div>

            {showComments && (
                <div className="commentws-section">
                    <div className="commentw-input-row">
                        <input
                            type="text"
                            placeholder="Write a comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        />

                        <button onClick={handleCommentSubmit}>Post</button>
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
            {showShareModal && (
                <div
                    className="share-overlay"
                    onClick={() => {
                        setShowShareModal(false);
                        setSelectedFriends([]);
                    }}
                />
            )}
            {
                showShareModal && (
                    <div className="share-modal">

                        <h3>Share Post</h3>

                        <div className="share-friends-list">
                            {
                                friends.map(friend => (
                                    <label key={friend.id} className="share-friend-item">
                                        <input
                                            type="checkbox"
                                            checked={
                                                selectedFriends.includes(friend.id)
                                            }
                                            onChange={() => {

                                                if (
                                                    selectedFriends.includes(friend.id)
                                                ) {
                                                    setSelectedFriends(
                                                        selectedFriends.filter(
                                                            id => id !== friend.id
                                                        )
                                                    );
                                                } else {
                                                    setSelectedFriends([
                                                        ...selectedFriends,
                                                        friend.id
                                                    ]);
                                                }
                                            }}
                                        />

                                        {friend.userName}
                                    </label>
                                ))
                            }
                        </div>
                        <div className="share-actions">

                            <button className="share-send-btn" 
                                    onClick={handleShare}>
                                Send
                            </button>

                            <button
                                className="share-cancel-btn"
                                onClick={() => {
                                    setShowShareModal(false);
                                    setSelectedFriends([]);
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
    
};

export default PostCard;