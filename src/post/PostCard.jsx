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
import { FaRegComment, FaShareNodes } from "react-icons/fa6";
import { FaTimes, FaPaperPlane } from "react-icons/fa";

const AVATAR_ACCENTS = ["primary", "teal", "rose"];

function accentFor(name) {
    const code = (name || "?").charCodeAt(0) || 0;
    return AVATAR_ACCENTS[code % AVATAR_ACCENTS.length];
}

// Relative timestamp ("2h", "3d") like most feed UIs use, with the
// exact date still available on hover via the title attribute.
function timeAgo(dateString) {
    if (!dateString) return "";

    try {
        const date = new Date(dateString);
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

        if (seconds < 60) return "just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d`;

        return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
        return "";
    }
}

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
        <div className="pc-card">
            <div className="pc-header">
                <div className="pc-avatar">
                    {profilePicture ? (
                        <img src={profilePicture} alt={post.userName} className="pc-avatar-img" />
                    ) : (
                        <span className={`pc-avatar-placeholder pc-avatar--${accentFor(post.userName)}`}>
                            {post.userName?.charAt(0)?.toUpperCase()}
                        </span>
                    )}
                </div>

                <div className="pc-header-copy">
                    <span className="pc-username">{post.userName}</span>
                    <span className="pc-time" title={new Date(post.createdAt).toLocaleString()}>
                        {timeAgo(post.createdAt)}
                    </span>
                </div>
            </div>

            <div className="pc-content">
                <div
                    className="pc-title"
                    onClick={() => {
                        navigate(`/post/${post.id}`);
                    }}
                >
                    {post.questionTitle}
                </div>

                <div className="pc-image-area">
                    <input
                        id={`image-input-${post.id}`}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                        disabled={uploadingImage}
                    />

                    {post.imageUrl ? (
                        <div className="pc-image-wrap">
                            <img
                                src={post.imageUrl}
                                alt={post.questionTitle}
                                loading="lazy"
                                className="pc-image"
                            />

                            {canUploadImage && (
                                <button
                                    className="pc-image-edit-btn"
                                    disabled={uploadingImage}
                                    onClick={() =>
                                        document
                                            .getElementById(`image-input-${post.id}`)
                                            .click()
                                    }
                                    aria-label="Change image"
                                >
                                    <FiCamera />
                                </button>
                            )}
                        </div>
                    ) : canUploadImage ? (
                        <div
                            className="pc-image-placeholder"
                            onClick={() =>
                                document
                                    .getElementById(`image-input-${post.id}`)
                                    .click()
                            }
                        >
                            <FiCamera className="pc-image-placeholder-icon" />
                            <span>{uploadingImage ? "Uploading..." : "Add image"}</span>
                        </div>
                    ) : null}

                    {uploadMessage && <div className="pc-upload-message">{uploadMessage}</div>}
                </div>
            </div>

            <div className="pc-actions">
                <LikeButton
                    postId={post.id}
                    initialCount={post.likesCount}
                    initiallyLiked={post.likedByCurrentUser}
                    onToggle={(nowLiked) =>
                        updatePost(post.id, p => ({
                            ...p,
                            likesCount: p.likesCount + (nowLiked ? 1 : -1)
                        }))
                    }
                />

                <button className="pc-action-btn" onClick={toggleComments}>
                    <FaRegComment />
                </button>

                <button className="pc-action-btn" onClick={openShareModal}>
                    <FaShareNodes />
                </button>
            </div>

            {showComments && (
                <div className="pc-comments">
                    <div className="pc-comment-input-row">
                        <input
                            type="text"
                            placeholder="Write a comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleCommentSubmit();
                            }}
                            className="pc-comment-input"
                        />

                        <button className="pc-comment-send" onClick={handleCommentSubmit} aria-label="Post comment">
                            <FaPaperPlane />
                        </button>
                    </div>

                    {loadingComments ? (
                        <div className="pc-comments-loading">Loading comments...</div>
                    ) : comments.length === 0 ? (
                        <div className="pc-comments-empty">No comments yet — be the first.</div>
                    ) : (
                        comments.map((comment) => <CommentCard key={comment.id} comment={comment} />)
                    )}
                </div>
            )}

            {showShareModal && (
                <div
                    className="pc-share-overlay"
                    onClick={() => {
                        setShowShareModal(false);
                        setSelectedFriends([]);
                    }}
                >
                    <div className="pc-share-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="pc-share-header">
                            <h3 className="pc-share-title">Share post</h3>
                            <button
                                className="pc-share-close"
                                onClick={() => {
                                    setShowShareModal(false);
                                    setSelectedFriends([]);
                                }}
                                aria-label="Close"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="pc-share-friends-list">
                            {friends.length === 0 ? (
                                <p className="pc-share-empty">Add some friends to share posts with them.</p>
                            ) : (
                                friends.map((friend) => {
                                    const checked = selectedFriends.includes(friend.id);
                                    return (
                                        <label
                                            key={friend.id}
                                            className={`pc-share-friend ${checked ? "pc-is-checked" : ""}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => {
                                                    if (checked) {
                                                        setSelectedFriends(
                                                            selectedFriends.filter((id) => id !== friend.id)
                                                        );
                                                    } else {
                                                        setSelectedFriends([...selectedFriends, friend.id]);
                                                    }
                                                }}
                                            />
                                            <span
                                                className={`pc-share-avatar pc-avatar--${accentFor(friend.userName)}`}
                                            >
                                                {friend.userName?.charAt(0)?.toUpperCase()}
                                            </span>
                                            <span className="pc-share-name">{friend.userName}</span>
                                        </label>
                                    );
                                })
                            )}
                        </div>

                        <div className="pc-share-actions">
                            <button
                                className="pc-share-cancel"
                                onClick={() => {
                                    setShowShareModal(false);
                                    setSelectedFriends([]);
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                className="pc-share-send"
                                onClick={handleShare}
                                disabled={selectedFriends.length === 0}
                            >
                                Send{selectedFriends.length > 0 ? ` (${selectedFriends.length})` : ""}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
    
};

export default PostCard;
