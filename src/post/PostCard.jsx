/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState } from "react";
import axios from "axios";
import "./PostCard.css";
import LikeButton from "./LikeButton";
import CommentCard from "./CommentCard";
import { useNavigate } from "react-router-dom";
import { useFriends } from "../hooks/useFriends";
import { getUserFromToken } from "../utils/auth";
import { FiCamera } from "react-icons/fi";
import {
    useWebSocket
} from "../context/WebSocketContext";
import { FaRegThumbsDown, FaRegComment, FaShareNodes } from "react-icons/fa6";

const PostCard = ({ post, updatePost, profilePicture, currentUser }) => {
    const [comments, setComments] = useState([]);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const [, setSelectedFile] = useState(null);
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
                `https://codecache-13ic.onrender.com/api/posts/${post.id}/comments`,
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
                `https://codecache-13ic.onrender.com/api/posts/${post.id}/like`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            updatePost(post.id, p => ({
                ...p,
                likesCount: Math.max(0, p.likesCount - 1)
            }));
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
                `https://codecache-13ic.onrender.com/api/posts/${post.id}/comments`,
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
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file); // optional, if you need it elsewhere

        handleImageUpload(file, !!post.imageUrl);
    };

    const handleImageUpload = async (file, isUpdate = false) => {
        if (!file) {
            setUploadMessage("Please select an image first.");
            return;
        }

        try {
            setUploadingImage(true);
            setUploadMessage("");

            const formData = new FormData();
            formData.append("file", file);

            const endpoint = isUpdate ? "updateimages" : "images";

            await axios.post(
                `https://codecache-13ic.onrender.com/api/posts/${post.id}/${endpoint}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setSelectedFile(null);

            setUploadMessage(
                isUpdate
                    ? "Image updated successfully. It is pending approval."
                    : "Image uploaded successfully. It is pending approval."
            );

        } catch (error) {
            console.error(error);
            setUploadMessage(
                isUpdate
                    ? "Image update failed."
                    : "Image upload failed."
            );
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
                        onClick={() => {
                        navigate(
                            `/post/${post.id}`
                        );
                    }}
                    >
                        {post.questionTitle}
                    </div>
                </div>

                <div className="post-image-container">
                    <input
                        id={`image-input-${post.id}`}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                        disabled={uploadingImage}
                    />

                    {post.imageUrl ? (
                        <div className="post-image-wrapper">
                            <img
                                src={post.imageUrl}
                                alt={post.questionTitle}
                                loading="lazy"
                                className="post-image"
                            />

                            {canUploadImage && (
                                <button
                                    className="image-edit-btn"
                                    disabled={uploadingImage}
                                    onClick={() =>
                                        document
                                            .getElementById(`image-input-${post.id}`)
                                            .click()
                                    }
                                >
                                    <FiCamera />
                                </button>
                            )}
                        </div>
                    ) : canUploadImage ? (
                        <div
                            className="image-upload-placeholder"
                            onClick={() =>
                                document
                                    .getElementById(`image-input-${post.id}`)
                                    .click()
                            }
                        >
                            <FiCamera className="upload-camera-icon" />

                            <span>
                                {uploadingImage ? "Uploading..." : "Add Image"}
                            </span>
                        </div>
                    ) : null}

                    {uploadMessage && (
                        <div className="upload-message">
                            {uploadMessage}
                        </div>
                    )}
                </div>
            </div>

            <div className="post-actions">
                <LikeButton
                    postId={post.id}
                    initialCount={post.likesCount}
                    onLiked={() =>
                        updatePost(post.id, p => ({ ...p, likesCount: p.likesCount + 1 }))
                    }
                />

                <button className="action-btn" onClick={handleUnlike}>
                    <FaRegThumbsDown /> 
                </button>

                <button className="action-btn" onClick={toggleComments}>
                    <FaRegComment /> 
                </button>

                <button className="action-btn" onClick={openShareModal}>
                    <FaShareNodes /> 
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