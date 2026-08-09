/* eslint-disable no-unused-vars */
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Leetcode from "./Leetcode";
import Codechef from "./Codechef";
import AddProblem from "./AddProblem";
import FindQuestion from "./FindQuestion";
import CSES from "./CSES";
import Codeforces from "./Codeforces";

import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import Profile from "./pages/Profile";

import FriendsLayout from "./pages/FriendsLayout";
import FriendRequests from "./pages/FriendRequests";
import FindFriends from "./pages/FindFriends";
import ChatPage from "./pages/ChatPage";
import Blocked from "./pages/Blocked";
import Notifications from "./pages/Notifications";

import { ToastProvider } from "./notifications/ToastContext";

import MyPostsPage from "./post/MyPostsPage";
import PostDetailsPage from "./post/PostDetailsPage";
import FeedPage from "./post/FeedPage";

import {
    WebSocketProvider
} from "./context/WebSocketContext";

function isTokenExpired(token) {
    try {
        const payload = JSON.parse(
            atob(token.split(".")[1])
        );

        if (!payload.exp) {
            return false;
        }

        return Date.now() >= payload.exp * 1000;

    } catch (err) {
        return true;
    }
}

function hasValidToken() {
    const token = localStorage.getItem("token");
    return Boolean(token) && !isTokenExpired(token);
}

function ProtectedRoute({ children }) {

    const token = localStorage.getItem("token");

    if (!token || isTokenExpired(token)) {
        localStorage.removeItem("token");
        window.dispatchEvent(new Event("auth-changed"));
        return <Navigate to="/" replace />;
    }

    return children;
}

function App() {

    const isLoggedIn = hasValidToken();

    return (
        <BrowserRouter>

            <ToastProvider>

                <WebSocketProvider>

                    <Routes>

                        {/* Login page */}
                        <Route
                            path="/"
                            element={
                                isLoggedIn
                                    ? <Navigate to="/home" replace />
                                    : <AuthPage />
                            }
                        />

                        <Route
                            path="/home"
                            element={
                                <ProtectedRoute>
                                    <Home />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/leetcode"
                            element={
                                <ProtectedRoute>
                                    <Leetcode />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/codechef"
                            element={
                                <ProtectedRoute>
                                    <Codechef />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/codeforces"
                            element={
                                <ProtectedRoute>
                                    <Codeforces />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/cses"
                            element={
                                <ProtectedRoute>
                                    <CSES />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/addProblem"
                            element={
                                <ProtectedRoute>
                                    <AddProblem />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/find"
                            element={
                                <ProtectedRoute>
                                    <FindQuestion />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            }
                        />

                        {/* Someone else's profile — Profile.jsx reads
                            :username via useParams() and switches to
                            view-only mode when it's present. */}
                        <Route
                            path="/profile/:username"
                            element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/friends"
                            element={
                                <ProtectedRoute>
                                    <FriendsLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route
                                index
                                element={<Navigate to="requests" replace />}
                            />

                            <Route
                                path="requests"
                                element={<FriendRequests />}
                            />

                            <Route
                                path="find-friends"
                                element={<FindFriends />}
                            />
                        </Route>

                        <Route
                            path="/chat"
                            element={
                                <ProtectedRoute>
                                    <ChatPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/notifications"
                            element={
                                <ProtectedRoute>
                                    <Notifications />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/blocked-users"
                            element={
                                <ProtectedRoute>
                                    <Blocked />
                                </ProtectedRoute>
                            }
                        />

                        {/* Was "/myposts" (lowercase) — FeedPage's "My
                            Posts" button calls navigate("/myPosts"),
                            and route paths are case-sensitive by
                            default, so that click was falling through
                            to the catch-all route below and bouncing
                            to /home instead of opening this page. */}
                        <Route
                            path="/myPosts"
                            element={
                                <ProtectedRoute>
                                    <MyPostsPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/post/:postId"
                            element={
                                <ProtectedRoute>
                                    <PostDetailsPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/feed"
                            element={
                                <ProtectedRoute>
                                    <FeedPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Unknown route */}
                        <Route
                            path="*"
                            element={
                                <Navigate
                                    to={isLoggedIn ? "/home" : "/"}
                                    replace
                                />
                            }
                        />

                    </Routes>

                </WebSocketProvider>

            </ToastProvider>

        </BrowserRouter>
    );
}

export default App;
