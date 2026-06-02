import React, { useEffect, useState } from "react";
import axios from "axios";
import PostCard from "./PostCard";
import "./FeedPage.css";

const FeedPage = () => {

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchFeed = async () => {

        try {

            
            const token =
                localStorage.getItem("token");

            console.log("Token:", token);
            const response =
                await axios.get(
                    "http://localhost:8080/api/posts/feed",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            console.log("Feed Response:");
            console.log(response.data);

            setPosts(response.data);
            setError("");

        } catch (err) {

            console.error(err);

            setError(
                "Unable to load feed."
            );

        } finally {

            setLoading(false);

        }
    };

    useEffect(() => {

        fetchFeed();

    }, []);

    if (loading) {

        return (
            <div className="feed-page">

                <div className="feed-loading">
                    Loading feed...
                </div>

            </div>
        );
    }

    if (error) {

        return (
            <div className="feed-page">

                <div className="feed-error">
                    {error}
                </div>

            </div>
        );
    }

    return (
        <div className="feed-page">

            <div className="feed-header">

                <h1>
                    Friends Activity Feed
                </h1>

                <p>
                    See what your friends
                    are solving.
                </p>

            </div>

            <div className="feed-content">

                {posts.length === 0 ? (

                    <div className="empty-feed">

                        No posts available.

                    </div>

                ) : (

                    posts.map((post) => (

                        <PostCard
                            key={post.id}
                            post={post}
                            refreshFeed={fetchFeed}
                        />

                    ))

                )}

            </div>

        </div>
    );
};

export default FeedPage;