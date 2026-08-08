/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiEdit2, FiCheck, FiX, FiLoader } from "react-icons/fi";
import { FaArrowLeft, FaPaperPlane } from "react-icons/fa";

import CommentCard from "./CommentCard";
import LikeButton from "./LikeButton";
import { useUserAvatar } from "../hooks/useUserAvatar";

import "./PostDetailsPage.css";

const AVATAR_ACCENTS = ["primary", "teal", "rose"];

function accentFor(name) {
    const code = (name || "?").charCodeAt(0) || 0;
    return AVATAR_ACCENTS[code % AVATAR_ACCENTS.length];
}

const PostDetailsPage = () => {

    const { postId } = useParams();
    const navigate = useNavigate();

    const [post, setPost] = useState(null);
    const [Userproblem, setUserProblem] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");

    const profilePicture = useUserAvatar(post?.userId);

    const [currentUser, setCurrentUser] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        intuition: "",
        timeComplexity: "",
        spaceComplexity: ""
    });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    const token =
        localStorage.getItem("token");

    const loadPost = async () => {

        try {

            const response =
                await axios.get(
                    `http://localhost:8080/api/posts/${postId}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            setPost(response.data);

        } catch (error) {

            console.error(error);

        }
    };

    const loadComments = async () => {

        try {

            const response =
                await axios.get(
                    `http://localhost:8080/api/posts/${postId}/comments`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            setComments(response.data);

        } catch (error) {

            console.error(error);

        }
    };

    const addComment = async () => {

        if (!commentText.trim())
            return;

        try {

            await axios.post(
                `http://localhost:8080/api/posts/${postId}/comments`,
                {
                    comment: commentText
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            setCommentText("");

            loadComments();

        } catch (error) {

            console.error(error);

        }
    };

    const loadUserProblem = async (postUserId, questionId) => {
        if (!questionId || !postUserId) {
            console.warn("No problemId to load problem with respective User:", questionId);
            return;
        }
        try {
            const response = await axios.get(
                `http://localhost:8080/api/problems/${postUserId}/${questionId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setUserProblem(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const loadCurrentUser = async () => {
        try {
            const response = await axios.get(
                `http://localhost:8080/api/users/me`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setCurrentUser(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {

        loadPost();
        loadComments();
        loadCurrentUser();

    }, [postId]);

    useEffect(() => {
        if (post?.questionId && post?.userId) {
            loadUserProblem(post.userId, post.questionId);
        }
    }, [post]);

    const isOwner =
        currentUser &&
        post &&
        currentUser.id === post.userId;

    const startEditing = () => {
        setSaveError("");
        setEditForm({
            intuition: Userproblem?.intuition || "",
            timeComplexity: Userproblem?.timeComplexity || "",
            spaceComplexity: Userproblem?.spaceComplexity || ""
        });
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setSaveError("");
    };

    const handleEditChange = (field, value) => {
        setEditForm((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const saveProblem = async () => {
        setSaving(true);
        setSaveError("");
        try {
            const response = await axios.put(
                `http://localhost:8080/api/problems/${post.questionId}`,
                {
                    intuition: editForm.intuition,
                    timeComplexity: editForm.timeComplexity,
                    spaceComplexity: editForm.spaceComplexity
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setUserProblem(response.data);
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            setSaveError("Couldn't save changes. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (!post) {
        return (
            <div className="pd-page">
                <div className="pd-shell">
                    <div className="pd-skeleton-card">
                        <div className="pd-skeleton-header">
                            <div className="pd-skeleton-avatar" />
                            <div className="pd-skeleton-bar pd-skeleton-bar--name" />
                        </div>
                        <div className="pd-skeleton-bar pd-skeleton-bar--title" />
                        <div className="pd-skeleton-image" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pd-page">
            <div className="pd-shell">
                <button className="pd-back" onClick={() => navigate(-1)}>
                    <FaArrowLeft />
                    Back
                </button>

                <div className="pd-card">
                    <div className="pd-header">
                        {profilePicture ? (
                            <img src={profilePicture} alt={post.userName} className="pd-avatar-img" />
                        ) : (
                            <span className={`pd-avatar pd-avatar--${accentFor(post.userName)}`}>
                                {post.userName?.charAt(0)?.toUpperCase()}
                            </span>
                        )}
                        <h2 className="pd-username">{post.userName}</h2>
                    </div>

                    <div className="pd-title">{post.questionTitle}</div>

                    {post.imageUrls && post.imageUrls.length > 0 && (
                        <div className="pd-gallery">
                            {post.imageUrls.map((url, index) => (
                                <img
                                    key={index}
                                    src={url}
                                    alt={`${post.questionTitle} - image ${index + 1}`}
                                    className="pd-gallery-image"
                                />
                            ))}
                        </div>
                    )}

                    {Userproblem && !isEditing && (
                        <div className="pd-details">
                            <div className="pd-details-header">
                                {post.difficulty && (
                                    <span
                                        className={`pd-difficulty pd-difficulty--${post.difficulty.toLowerCase()}`}
                                    >
                                        {post.difficulty}
                                    </span>
                                )}

                                {isOwner && (
                                    <button
                                        className="pd-edit-btn"
                                        onClick={startEditing}
                                        title="Edit details"
                                    >
                                        <FiEdit2 size={13} />
                                        <span>Edit</span>
                                    </button>
                                )}
                            </div>

                            {Userproblem.intuition && (
                                <div className="pd-intuition">{Userproblem.intuition}</div>
                            )}

                            {(Userproblem.timeComplexity || Userproblem.spaceComplexity) && (
                                <div className="pd-complexity-row">
                                    {Userproblem.timeComplexity && (
                                        <span className="pd-complexity-pill pd-complexity-pill--time">
                                            time {Userproblem.timeComplexity}
                                        </span>
                                    )}
                                    {Userproblem.spaceComplexity && (
                                        <span className="pd-complexity-pill pd-complexity-pill--space">
                                            space {Userproblem.spaceComplexity}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {Userproblem && isEditing && (
                        <div className="pd-details pd-edit-form">
                            <label className="pd-edit-label">
                                Intuition
                                <textarea
                                    className="pd-edit-input"
                                    value={editForm.intuition}
                                    onChange={(e) =>
                                        handleEditChange("intuition", e.target.value)
                                    }
                                    rows={4}
                                    placeholder="What's the key insight for this problem?"
                                />
                            </label>

                            <div className="pd-edit-row">
                                <label className="pd-edit-label">
                                    Time Complexity
                                    <input
                                        className="pd-edit-input pd-edit-input--mono"
                                        type="text"
                                        value={editForm.timeComplexity}
                                        onChange={(e) =>
                                            handleEditChange("timeComplexity", e.target.value)
                                        }
                                        placeholder="e.g. O(n)"
                                    />
                                </label>

                                <label className="pd-edit-label">
                                    Space Complexity
                                    <input
                                        className="pd-edit-input pd-edit-input--mono"
                                        type="text"
                                        value={editForm.spaceComplexity}
                                        onChange={(e) =>
                                            handleEditChange("spaceComplexity", e.target.value)
                                        }
                                        placeholder="e.g. O(1)"
                                    />
                                </label>
                            </div>

                            {saveError && <div className="pd-edit-error">{saveError}</div>}

                            <div className="pd-edit-actions">
                                <button
                                    className="pd-edit-save"
                                    onClick={saveProblem}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <FiLoader size={14} className="pd-spin-icon" />
                                    ) : (
                                        <FiCheck size={14} />
                                    )}
                                    <span>{saving ? "Saving..." : "Save"}</span>
                                </button>
                                <button
                                    className="pd-edit-cancel"
                                    onClick={cancelEditing}
                                    disabled={saving}
                                >
                                    <FiX size={14} />
                                    <span>Cancel</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="pd-stats">
                        <LikeButton
                            postId={post.id}
                            initialCount={post.likesCount}
                            initiallyLiked={post.likedByCurrentUser}
                            onToggle={(nowLiked) =>
                                setPost((prev) => ({
                                    ...prev,
                                    likesCount: prev.likesCount + (nowLiked ? 1 : -1)
                                }))
                            }
                        />
                    </div>
                </div>

                <div className="pd-comments-card">
                    <h3 className="pd-comments-title">Comments</h3>

                    <div className="pd-comment-input-row">
                        <input
                            className="pd-comment-input"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") addComment();
                            }}
                            placeholder="Write a comment..."
                        />

                        <button className="pd-comment-send" onClick={addComment} aria-label="Post comment">
                            <FaPaperPlane />
                        </button>
                    </div>

                    {comments.length === 0 ? (
                        <div className="pd-comments-empty">No comments yet — be the first.</div>
                    ) : (
                        comments.map((comment) => <CommentCard key={comment.id} comment={comment} />)
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostDetailsPage;
