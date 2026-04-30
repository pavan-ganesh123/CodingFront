import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { FaUserFriends } from "react-icons/fa";
import { IoNotifications } from "react-icons/io5";
import { MdPersonAdd } from "react-icons/md";
import "./Friends.css";

function FriendsLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="friends-layout">

      {/* 🔹 Sidebar */}
      <div className="sidebar">

        <button
          className={location.pathname.includes("chat") ? "active" : ""}
          onClick={() => navigate("/friends/chat")}
        >
          <FaUserFriends /> Chat
        </button>

        <button
          className={location.pathname.includes("requests") ? "active" : ""}
          onClick={() => navigate("/friends/requests")}
        >
          <IoNotifications /> Requests
        </button>

        <button
          className={location.pathname.includes("find-friends") ? "active" : ""}
          onClick={() => navigate("/friends/find-friends")}
        >
          <MdPersonAdd /> Find Friends
        </button>

      </div>

      {/* 🔹 Content Area */}
      <div className="content">
        <Outlet />
      </div>

    </div>
  );
}

export default FriendsLayout;