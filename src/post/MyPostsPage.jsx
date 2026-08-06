import React, { useEffect, useState } from "react";
import axios from "axios";
import PostCard from "./PostCard";
import "./MyPosts.css";

const MyPostsPage = () => {

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentUser, setCurrentUser] = useState(null);

    const fetchMyPosts = async () => {

        try {

            setLoading(true);

            const token = localStorage.getItem("token");

            const userRes = await axios.get(
                "http://localhost:8080/api/users/me",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setCurrentUser(userRes.data);

            const response = await axios.get(
                "http://localhost:8080/api/posts/mine",
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

    useEffect(() => {

        fetchMyPosts();

    }, []);

    if (loading) {

        return (
            <div className="my-posts-page">
                <div className="my-posts-status">
                    Loading your posts...
                </div>
            </div>
        );
    }

    if (error) {

        return (
            <div className="my-posts-page">
                <div className="my-posts-status error">
                    {error}
                </div>
            </div>
        );
    }

    return (

        <div className="my-posts-page">

            <div className="my-posts-header">

                <h2>My Posts</h2>

                <p>
                    Problems solved
                </p>

            </div>

            {posts.length === 0 ? (

                <div className="my-posts-empty">
                    You haven't created any posts yet.
                </div>

            ) : (

                <div className="my-posts-list">

                    {posts.map((post) => (

                        <PostCard
                            key={post.id}
                            post={post}
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