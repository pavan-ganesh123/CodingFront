import React, { useEffect, useState } from "react";
import axios from "axios";
import PostCard from "./PostCard";
import "./FeedPage.css";

const FeedPage = () => {

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [profilePictures, setProfilePictures] = useState({});
    const fetchFeed = async () => {

        try {

            
            const token =
                localStorage.getItem("token");

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


            setPosts(response.data);
            const userIds = [...new Set(response.data.map(post => post.userId))];
            const pictureMap = {};

            await Promise.all(
                userIds.map(async (userId) => {
                    try {
                        const picResponse = await axios.get(
                            `http://localhost:8080/api/users/${userId}/profile-picture`,
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`
                                }
                            }
                        );
                        pictureMap[userId] = picResponse.data.profilePicture;
                    } catch (err) {
                        console.error(`Failed to fetch picture for user ${userId}`, err);
                        pictureMap[userId] = null;
                    }
                })
            );
            setProfilePictures(pictureMap);
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
                <p>
                    Posts
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
                            profilePicture={profilePictures[post.userId]}
                        />

                    ))

                )}

            </div>

        </div>
    );
};

export default FeedPage;