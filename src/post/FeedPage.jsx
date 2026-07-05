/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import PostCard from "./PostCard";
import "./FeedPage.css";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 10;
let hasHandledReload = false;
{
    const navEntry = performance.getEntriesByType("navigation")[0];
    if (navEntry?.type === "reload" && !hasHandledReload) {
        sessionStorage.removeItem("feedPosts");
        sessionStorage.removeItem("feedPage");
        sessionStorage.removeItem("feedHasMore");
        sessionStorage.removeItem("feedScrollY");
        sessionStorage.removeItem("feedSeed");
        hasHandledReload = true;
    }
}
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
    const navigate = useNavigate();
    const [feedSeed, setFeedSeed] = useState(() => {
    const savedSeed =
        sessionStorage.getItem(
            "feedSeed"
        );

        if (savedSeed) {
            return Number(savedSeed);
        }

        const newSeed =
            Math.floor(
                Math.random() * 1000000000
            );

        sessionStorage.setItem(
            "feedSeed",
            newSeed
        );

        return newSeed;
    });
    const fetchFeed = async (pageNumber = 0, seed = feedSeed) => {
        try {
            if (pageNumber === 0) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const response = await axios.get(
                `http://localhost:8080/api/posts/feed?page=${pageNumber}&size=${PAGE_SIZE}&seed=${seed}`,
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

        const newSeed =
            Math.floor(
                Math.random() * 1000000000
            );

        setFeedSeed(newSeed);

        sessionStorage.setItem(
            "feedSeed",
            newSeed
        );

        sessionStorage.removeItem("feedPosts");
        sessionStorage.removeItem("feedPage");
        sessionStorage.removeItem("feedHasMore");
        sessionStorage.removeItem("feedScrollY");

        pageRef.current = 0;

        setPage(0);

        setHasMore(true);

        await fetchFeed(
            0,
            newSeed
        );
    };

    const loadMore = async () => {

        if (loadingMore || !hasMore) {
            return;
        }

        const nextPage = pageRef.current + 1;

        pageRef.current = nextPage;

        sessionStorage.setItem(
            "feedPage",
            nextPage
        );

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
                threshold: 0.5,
                rootMargin: "300px"
            }
        );

        if (node) {
            observer.current.observe(node);
        }

    }, [loadingMore, hasMore]);

    useEffect(() => {

        const saveScrollPosition = () => {
            sessionStorage.setItem(
                "feedScrollY",
                window.scrollY
            );
        };

        window.addEventListener(
            "scroll",
            saveScrollPosition
        );

        return () => {
            window.removeEventListener(
                "scroll",
                saveScrollPosition
            );
        };

    }, []);
    useEffect(() => {
        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, []);
    
    useEffect(() => {

        const initializeFeed = async () => {

            try {

                const userRes = await axios.get(
                    "http://localhost:8080/api/users/me",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setCurrentUser(userRes.data);

                const cachedPosts =
                    sessionStorage.getItem(
                        "feedPosts"
                    );
                const parsedPosts =
                    cachedPosts
                        ? JSON.parse(cachedPosts)
                        : [];

                if (parsedPosts.length > 0) {

                    setPosts(
                        parsedPosts
                    );

                    pageRef.current = Number(
                        sessionStorage.getItem(
                            "feedPage"
                        ) || 0
                    );

                    setPage(pageRef.current);

                    setHasMore(
                        sessionStorage.getItem(
                            "feedHasMore"
                        ) === "true"
                    );

                    setLoading(false);

                    setTimeout(() => {
                        window.scrollTo(
                            0,
                            Number(
                                sessionStorage.getItem(
                                    "feedScrollY"
                                ) || 0
                            )
                        );
                    }, 100);

                } else {

                    pageRef.current = 0;
                    setPage(0);

                    await fetchFeed(0);

                }

            } catch (error) {

                console.error(
                    "Failed to initialize feed",
                    error
                );

            }
        };

        if (token) {
            initializeFeed();
        }

    }, [token]);

    useEffect(() => {

        if (posts.length > 0) {
            sessionStorage.setItem(
                "feedPosts",
                JSON.stringify(posts)
            );
        }

    }, [posts]);

    useEffect(() => {
        sessionStorage.setItem(
            "feedHasMore",
            hasMore
        );
    }, [hasMore]);

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
                <div className="feed-header-top">
                    <h4>Posts</h4>
                <button
                    className="my-posts-btn"
                    onClick={() => navigate("/myPosts")}
                >
                    My Posts
                </button>

            </div>

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