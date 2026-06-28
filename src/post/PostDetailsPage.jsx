/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import CommentCard from "./CommentCard";
import LikeButton from "./LikeButton";

import "./PostDetailsPage.css";

const PostDetailsPage = () => {

    const { postId } = useParams();

    const [post, setPost] = useState(null);
    const [Userproblem, setUserProblem] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");

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

    useEffect(() => {

        loadPost();
        loadComments();

    }, [postId]);

    useEffect(() => {
        if (post?.questionId && post?.userId) {
            loadUserProblem(post.userId, post.questionId);
        }
    }, [post]);

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

                {Userproblem && (
                    <div className="problem-details">
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
