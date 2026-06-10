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
    const [problem, setProblem] = useState(null);
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
    const loadProblem = async (questionId) => {
        if (!questionId) {
            console.warn("No problemId to load problem:", questionId);
            return;
        }
        try {
            const response = await axios.get(
                `http://localhost:8080/api/problems/${questionId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setProblem(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {

        loadPost();
        loadComments();

    }, [postId]);

    useEffect(() => {
        if (post?.questionId) {
            loadProblem(post.questionId);
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


                {problem && (
                    <div className="problem-details">
                        <div className="problem-meta">
                            {problem.difficulty && (
                                <div className={`difficulty-badge difficulty-${problem.difficulty.toLowerCase()}`}>
                                    {problem.intuition}
                                </div>
                            )}
                        </div>


                        {problem.timeComplexity && (
                            <div className="problem-complexity">
                                <strong>Time Complexity:</strong> {problem.timeComplexity}
                            </div>
                        )}

                        {problem.spaceComplexity && (
                            <div className="problem-complexity">
                                <strong>Space Complexity:</strong> {problem.spaceComplexity}
                            </div>
                        )}

                        {problem.description && (
                            <div className="problem-description">
                                <strong>Description:</strong>
                                <p>{problem.description}</p>
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