import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import PostCard from "./PostCard";
import "./FeedPage.css";

const PAGE_SIZE = 10;

const FeedPage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const observer = useRef();
    const token = localStorage.getItem("token");
    const pageRef = useRef(0);

    const fetchFeed = async (pageNumber = 0) => {
        try {
            if (pageNumber === 0) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const response = await axios.get(
                `http://localhost:8080/api/posts/feed?page=${pageNumber}&size=${PAGE_SIZE}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const newPosts = response.data.content;

            if (pageNumber === 0) {
                setPosts(newPosts);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
            }

            setHasMore(!response.data.last);
            setError("");
        } catch (err) {
            console.error(err);
            setError("Unable to load feed.");
        } finally {
            if (pageNumber === 0) {
                setLoading(false);
            } else {
                setLoadingMore(false);
            }
        }
    };

    const refreshFeed = async () => {
        pageRef.current = 0;
        setPage(0);
        setHasMore(true);

        await fetchFeed(0);
    };

    const loadMore = async () => {

        if (loadingMore || !hasMore) {
            return;
        }

        const nextPage = pageRef.current + 1;

        pageRef.current = nextPage;
        setPage(nextPage);

        await fetchFeed(nextPage);
    };

    const lastPostRef = useCallback((node) => {

        if (loadingMore) return;

        if (observer.current) {
            observer.current.disconnect();
        }

        observer.current = new IntersectionObserver(
            entries => {
                if (
                    entries[0].isIntersecting &&
                    hasMore
                ) {
                    loadMore();
                }
            },
            {
                threshold: 0.5
            },
            {
                rootMargin: "300px"
            }
        );

        if (node) {
            observer.current.observe(node);
        }

    }, [loadingMore, hasMore]);

    useEffect(() => {
        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, []);
    useEffect(() => {
        const loadAll = async () => {
            try {
                const userRes = await axios.get(
                    "http://localhost:8080/api/users/me",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                pageRef.current = 0;
                setPage(0);
                setCurrentUser(userRes.data);

                await fetchFeed(0);
            } catch (error) {
                console.error(
                    "Failed to load current user",
                    error
                );
            }
        };

        if (token) {
            loadAll();
        }
    }, [token]);

    if (loading || !currentUser) {
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
                <p>Posts</p>
            </div>

            <div className="feed-content">
                {posts.length === 0 ? (
                    <div className="empty-feed">
                        No posts available.
                    </div>
                ) : (
                    <>
                        {posts.map((post, index) => {

                            const isLastPost =
                                index === posts.length - 1;

                            return (
                                <div
                                    key={post.id}
                                    ref={
                                        isLastPost
                                            ? lastPostRef
                                            : null
                                    }
                                >
                                    <PostCard
                                        post={post}
                                        refreshFeed={refreshFeed}
                                        profilePicture={
                                            post.profilePicture
                                        }
                                        currentUser={currentUser}
                                    />
                                </div>
                            );
                        })}

                        {loadingMore && (
                            <div className="feed-loading-more">
                                Loading more posts...
                            </div>
                        )}
                        
                    </>
                )}
            </div>
        </div>
    );
};

export default FeedPage;