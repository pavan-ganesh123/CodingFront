/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import PostCard from "./PostCard";
import "./FeedPage.css";
import { useNavigate } from "react-router-dom";
import { FaRegNewspaper, FaExclamationTriangle } from "react-icons/fa";

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
    const updatePost = (postId, updater) => {
        setPosts(prev =>
            prev.map(p => (p.id === postId ? updater(p) : p))
        );
    };
    const [feedSeed] = useState(() => {
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
                `https://codecache-13ic.onrender.com/api/posts/feed?page=${pageNumber}&size=${PAGE_SIZE}&seed=${seed}`,
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
                    "https://codecache-13ic.onrender.com/api/users/me",
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
            <div className="fd-page">
                <div className="fd-shell">
                    <div className="fd-header">
                        <h1 className="fd-title">Posts</h1>
                    </div>
                    <div className="fd-skeleton-list" aria-hidden="true">
                        {[0, 1, 2].map((i) => (
                            <div className="fd-skeleton-card" key={i} style={{ animationDelay: `${i * 90}ms` }}>
                                <div className="fd-skeleton-header">
                                    <div className="fd-skeleton-avatar" />
                                    <div className="fd-skeleton-lines">
                                        <div className="fd-skeleton-bar fd-skeleton-bar--name" />
                                        <div className="fd-skeleton-bar fd-skeleton-bar--time" />
                                    </div>
                                </div>
                                <div className="fd-skeleton-bar fd-skeleton-bar--title" />
                                <div className="fd-skeleton-image" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fd-page">
                <div className="fd-shell">
                    <div className="fd-state">
                        <FaExclamationTriangle className="fd-state-icon" />
                        <p className="fd-state-title">{error}</p>
                        <button className="fd-retry-btn" onClick={() => fetchFeed(0)}>
                            Try again
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="fd-page">
            <div className="fd-shell">
                <div className="fd-header">
                    <h1 className="fd-title">Posts</h1>
                    <button
                        className="fd-my-posts-btn"
                        onClick={() => navigate("/myPosts")}
                    >
                        My Posts
                    </button>
                </div>

                <div className="fd-content">
                    {posts.length === 0 ? (
                        <div className="fd-state">
                            <FaRegNewspaper className="fd-state-icon" />
                            <p className="fd-state-title">No posts available</p>
                            <p className="fd-state-copy">Check back later, or follow more friends.</p>
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
                                            updatePost={updatePost}
                                            profilePicture={
                                                post.profilePicture
                                            }
                                            currentUser={currentUser}
                                        />
                                    </div>
                                );
                            })}

                            {loadingMore && (
                                <div className="fd-skeleton-list" aria-hidden="true">
                                    <div className="fd-skeleton-card">
                                        <div className="fd-skeleton-header">
                                            <div className="fd-skeleton-avatar" />
                                            <div className="fd-skeleton-lines">
                                                <div className="fd-skeleton-bar fd-skeleton-bar--name" />
                                                <div className="fd-skeleton-bar fd-skeleton-bar--time" />
                                            </div>
                                        </div>
                                        <div className="fd-skeleton-bar fd-skeleton-bar--title" />
                                    </div>
                                </div>
                            )}
                            
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeedPage;
