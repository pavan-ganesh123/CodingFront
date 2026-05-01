import { BrowserRouter, Routes, Route } from "react-router-dom";
import Leetcode from "./Leetcode";
import Codechef from "./Codechef";
import AddProblem from "./AddProblem";
import FindQuestion from "./FindQuestion";

import CSES from "./CSES";
import Codeforces from "./Codeforces";
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import Login from "./pages/Login";
import Profile from "./pages/Profile";

import FriendsLayout from "./pages/FriendsLayout";
import FriendRequests from "./pages/FriendRequests";
import FindFriends from "./pages/FindFriends";
import ChatPage from "./pages/ChatPage";
import { Navigate } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/leetcode" element={<Leetcode />} />
        <Route path="/codechef" element={<Codechef />} />
        <Route path="/codeforces" element={<Codeforces />} />
        <Route path="/cses" element={<CSES />} />
        <Route path="/addProblem" element={<AddProblem />} />
        <Route path="/find" element={<FindQuestion />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="/friends" element={<FriendsLayout />}>
          <Route index element={<Navigate to="requests" />} />
          <Route path="requests" element={<FriendRequests />} />
          <Route path="find-friends" element={<FindFriends />} />
        </Route>

        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;