import React, { useEffect, useState } from "react";
import axios from "axios";
import PostCard from "./PostCard";

const MyPostsPage = () => {

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchMyPosts = async () => {

        try {

            setLoading(true);

            const token =
                localStorage.getItem("token");

            const response =
                await axios.get(
                    "http://localhost:8080/api/posts/mine",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            setPosts(response.data);
            setError("");

        } catch (err) {

            console.error(err);

            setError(
                "Unable to load your posts."
            );

        } finally {

            setLoading(false);

        }
    };

    useEffect(() => {

        fetchMyPosts();

    }, []);

    if (loading) {

        return (
            <div className="feed-page">
                Loading your posts...
            </div>
        );
    }

    if (error) {

        return (
            <div className="feed-page">
                {error}
            </div>
        );
    }

    return (

        <div className="feed-page">

            <div className="feed-header">

                <h1>My Posts</h1>

                <p>
                    Problems you've shared.
                </p>

            </div>

            {posts.length === 0 ? (

                <div>
                    You haven't created any posts yet.
                </div>

            ) : (

                posts.map((post) => (

                    <PostCard
                        key={post.id}
                        post={post}
                        refreshFeed={fetchMyPosts}
                    />

                ))

            )}

        </div>

    );
};

export default MyPostsPage;