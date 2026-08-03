import HomePage from '../HomePage';
import { useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUserCircle, FaUserFriends, FaPlus, FaComments } from "react-icons/fa";
import { FaTimeline } from "react-icons/fa6";
import ThemeToggle from "../components/ThemeToggle";
import "./Home.css";
import Logout from "./Logout";

function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  const containerRef = useRef(null);
  const cardRefs = useRef([]);

  // imageLight is optional per platform — falls back to the dark-theme
  // image below until you supply a real light-variant asset for that logo.
  const platforms = [
    { name: "Leetcode", image: "/LeetCode_Image.png", imageLight: "/LeetCode_Image.png", route: "/leetcode" },
    { name: "Codechef", image: "/Codechef.jpg", imageLight: "/Codechef.jpg", route: "/codechef" },
    { name: "CSES", image: "/CSES.png", imageLight: "/CSES.png", route: "/cses" },
    { name: "Codeforces", image: "/Codeforces.png", imageLight: "/Codeforces.png", route: "/codeforces" },
  ];

  return (
    <div className="page-container" ref={containerRef}>

      <div className="navbar">
        <div className="nav-left">
          <p className="brand-prompt">
            <span className="brand-chevron">&gt;</span>
            code-cache
            <span className="brand-cursor" />
          </p>
        </div>

        <div className="nav-right">
          <input
            type="text"
            placeholder="Search..."
            className="problem-search-input"
            onFocus={() => navigate("/find")}
          />

          <FaPlus className="nav-icon" onClick={() => navigate("/addProblem")} />
          <FaUserFriends className="nav-icon" onClick={() => navigate("/friends")} />
          <FaComments
            className={`nav-icon ${location.pathname.includes("/friends/chat") ? "active-icon" : ""}`}
            onClick={() => navigate("/chat")}
          />
          <FaUserCircle className="nav-icon" onClick={() => navigate("/profile")} />
          <FaTimeline className="nav-icon" onClick={() => navigate("/feed")} />
          <Logout />
          <ThemeToggle />
        </div>
      </div>

      <div className="content-layout">
        <div className="cards-container">
          {platforms.map((platform, i) => (
            <div
              key={i}
              ref={(el) => (cardRefs.current[i] = el)}
              className="image-card"
              onClick={() => navigate(platform.route)}
            >
              <img src={platform.image} alt={platform.name} className="platform-logo platform-logo--dark" />
              <img src={platform.imageLight} alt="" aria-hidden="true" className="platform-logo platform-logo--light" />
              <p>{platform.name}</p>
            </div>
          ))}
        </div>

        <div className="animation-container">
          <HomePage />
        </div>
      </div>
    </div>
  );
}

export default Home;
