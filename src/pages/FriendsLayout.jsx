import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { IoNotifications } from "react-icons/io5";
import { MdPersonAdd } from "react-icons/md";
import { FaArrowLeft } from "react-icons/fa";
import "./FriendsLayout.css";

function FriendsLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const onFind = location.pathname.includes("find-friends");

  return (
    <div className="fr-shell">
      <div className="page-mesh" aria-hidden="true" />
      <div className="page-grain" aria-hidden="true" />

      <div className="fr-body">
        <div className="fr-topbar">
          <button className="fr-back" onClick={() => navigate("/home")}>
            <FaArrowLeft />
            Back
          </button>

          <div className={`fr-tabs ${onFind ? "fr-tabs--find" : "fr-tabs--requests"}`}>
            <span className="fr-tabs-indicator" aria-hidden="true" />
            <button
              className={`fr-tab ${!onFind ? "fr-is-active" : ""}`}
              onClick={() => navigate("/friends/requests")}
            >
              <IoNotifications />
              Requests
            </button>
            <button
              className={`fr-tab ${onFind ? "fr-is-active" : ""}`}
              onClick={() => navigate("/friends/find-friends")}
            >
              <MdPersonAdd />
              Find
            </button>
          </div>

          <span className="fr-topbar-spacer" aria-hidden="true" />
        </div>

        <div className="fr-card">
          <div className="fr-card-glow" aria-hidden="true" />
          <div className="fr-card-inner" key={location.pathname}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default FriendsLayout;

