/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { FiEdit2, FiCheck, FiX, FiLoader } from "react-icons/fi";

import CommentCard from "./CommentCard";
import LikeButton from "./LikeButton";

import "./PostDetailsPage.css";

const PostDetailsPage = () => {

    const { postId } = useParams();

    const [post, setPost] = useState(null);
    const [Userproblem, setUserProblem] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");

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
            <div className="post-details-loading">
                Loading...
            </div>
        );
    }

    return (

        <div className="post-details-container">

            <div className="post-details-card">

                <h2>
                    {post.userName}
                </h2>

                <div className="problem-title">
                    {post.questionTitle}
                </div>

                {post.imageUrls && post.imageUrls.length > 0 && (
                    <div className="post-images-gallery">
                        {post.imageUrls.map((url, index) => (
                            <img
                                key={index}
                                src={url}
                                alt={`${post.questionTitle} - image ${index + 1}`}
                                className="post-detail-image"
                            />
                        ))}
                    </div>
                )}

                {Userproblem && !isEditing && (
                    <div className="problem-details">
                        <div className="problem-details-header">
                            <div className="problem-meta">
                                {post.difficulty && (
                                    <div className={`difficulty-badge difficulty-${post.difficulty.toLowerCase()}`}>
                                        {Userproblem.intuition && (
                                            <div className="problem-intuition">
                                                {Userproblem.intuition}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {isOwner && (
                                <button
                                    className="edit-problem-button"
                                    onClick={startEditing}
                                    title="Edit details"
                                >
                                    <FiEdit2 size={14} />
                                    <span>Edit</span>
                                </button>
                            )}
                        </div>

                        {Userproblem.timeComplexity && (
                            <div className="problem-complexity">
                                <strong>Time Complexity:</strong> {Userproblem.timeComplexity}
                            </div>
                        )}

                        {Userproblem.spaceComplexity && (
                            <div className="problem-complexity">
                                <strong>Space Complexity:</strong> {Userproblem.spaceComplexity}
                            </div>
                        )}
                    </div>
                )}

                {Userproblem && isEditing && (
                    <div className="problem-details problem-edit-form">

                        <label className="edit-field-label">
                            Intuition
                            <textarea
                                className="edit-field-input"
                                value={editForm.intuition}
                                onChange={(e) =>
                                    handleEditChange("intuition", e.target.value)
                                }
                                rows={4}
                                placeholder="What's the key insight for this problem?"
                            />
                        </label>

                        <div className="edit-field-row">
                            <label className="edit-field-label">
                                Time Complexity
                                <input
                                    className="edit-field-input"
                                    type="text"
                                    value={editForm.timeComplexity}
                                    onChange={(e) =>
                                        handleEditChange("timeComplexity", e.target.value)
                                    }
                                    placeholder="e.g. O(n)"
                                />
                            </label>

                            <label className="edit-field-label">
                                Space Complexity
                                <input
                                    className="edit-field-input"
                                    type="text"
                                    value={editForm.spaceComplexity}
                                    onChange={(e) =>
                                        handleEditChange("spaceComplexity", e.target.value)
                                    }
                                    placeholder="e.g. O(1)"
                                />
                            </label>
                        </div>

                        {saveError && (
                            <div className="edit-error">
                                {saveError}
                            </div>
                        )}

                        <div className="edit-form-actions">
                            <button
                                className="edit-save-button"
                                onClick={saveProblem}
                                disabled={saving}
                            >
                                {saving ? (
                                    <FiLoader size={14} className="spin-icon" />
                                ) : (
                                    <FiCheck size={14} />
                                )}
                                <span>{saving ? "Saving..." : "Save"}</span>
                            </button>
                            <button
                                className="edit-cancel-button"
                                onClick={cancelEditing}
                                disabled={saving}
                            >
                                <FiX size={14} />
                                <span>Cancel</span>
                            </button>
                        </div>

                    </div>
                )}

                <div className="post-stats">

                    <LikeButton
                        postId={post.id}
                        initialCount={post.likesCount}
                        refreshFeed={loadPost}
                    />

                </div>


            </div>

            <div className="comments-section">

                <h3>
                    Comments
                </h3>

                <div className="comment-input">

                    <input
                        value={commentText}
                        onChange={(e) =>
                            setCommentText(
                                e.target.value
                            )
                        }
                        placeholder="Write a comment..."
                    />

                    <button
                        onClick={addComment}
                    >
                        Post
                    </button>

                </div>

                {comments.map((comment) => (

                    <CommentCard
                        key={comment.id}
                        comment={comment}
                    />

                ))}

            </div>

        </div>

    );
};

export default PostDetailsPage;
