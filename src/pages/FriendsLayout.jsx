import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { IoNotifications } from "react-icons/io5";
import { MdPersonAdd } from "react-icons/md";
import "./FriendsLayout.css";

function FriendsLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="friends-layout">

      {/* 🔹 Sidebar */}
      <div className="sidebar">

        <button
          className={location.pathname.includes("requests") ? "active" : ""}
          onClick={() => navigate("/friends/requests")}
        >
          <IoNotifications />
        </button>

        <button
          className={location.pathname.includes("find-friends") ? "active" : ""}
          onClick={() => navigate("/friends/find-friends")}
        >
          <MdPersonAdd />
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