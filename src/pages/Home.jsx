import { useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUserCircle, FaUserFriends, FaPlus, FaComments, FaSearch, FaArrowRight } from "react-icons/fa";
import { FaTimeline } from "react-icons/fa6";
import "./Home.css";
import Logout from "./Logout";

function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  const containerRef = useRef(null);
  const cardRefs = useRef([]);

  // imageLight is optional per platform — falls back to the dark-theme
  // image below until you supply a real light-variant asset for that logo.
  // `accent` ties each card to that platform's own brand color instead of
  // one generic purple, so the grid reads like a set of distinct tools
  // rather than four copies of the same card.
  const platforms = [
    { name: "Leetcode", slug: "leetcode", image: "/LeetCode_Image.png", imageLight: "/LeetCode_Image.png", route: "/leetcode", platformLink: "https://leetcode.com/", accent: "--acc-leetcode" },
    { name: "Codechef", slug: "codechef", image: "/Codechef.jpg", imageLight: "/Codechef.jpg", route: "/codechef", platformLink: "https://www.codechef.com/", accent: "--acc-codechef" },
    { name: "CSES", slug: "cses", image: "/CSES.png", imageLight: "/CSES.png", route: "/cses", platformLink: "https://cses.fi/problemset/", accent: "--acc-cses" },
    { name: "Codeforces", slug: "codeforces", image: "/Codeforces.png", imageLight: "/Codeforces.png", route: "/codeforces", platformLink: "https://codeforces.com/", accent: "--acc-codeforces" },
  ];

  return (
    <div className="page-container" ref={containerRef}>
      <div className="page-mesh" aria-hidden="true" />
      <div className="page-grain" aria-hidden="true" />

      <div className="navbar">
        <div className="nav-left">
          <p className="brand-prompt">
            <span className="brand-chevron">&gt;</span>
            code-cache
            <span className="brand-cursor" />
          </p>
        </div>

        <div className="nav-center">
          <div className="search-wrap">
            <FaSearch className="search-icon" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search a problem, tag, or platform…"
              className="problem-search-input"
              onFocus={() => navigate("/find")}
            />
            <span className="search-kbd">/</span>
          </div>
        </div>

        <div className="nav-right">
          <button className="nav-icon-btn" onClick={() => navigate("/friends")} aria-label="Friends" title="Friends">
            <FaUserFriends className="nav-icon" />
          </button>
          <button
            className={`nav-icon-btn ${location.pathname.includes("/friends/chat") ? "is-active" : ""}`}
            onClick={() => navigate("/chat")}
            aria-label="Chat"
            title="Chat"
          >
            <FaComments className="nav-icon" />
          </button>
          <button className="nav-icon-btn" onClick={() => navigate("/profile")} aria-label="Profile" title="Profile">
            <FaUserCircle className="nav-icon" />
          </button>
          <button className="nav-icon-btn" onClick={() => navigate("/feed")} aria-label="Feed" title="Feed">
            <FaTimeline className="nav-icon" />
          </button>

          <span className="nav-divider" aria-hidden="true" />

          <Logout />
        </div>
      </div>

      <div className="content-layout">
        <section className="cards-panel">
          <div className="panel-heading">
            <h2>Notes</h2>
          </div>

          <div className="cards-container">
            {platforms.map((platform, i) => (
              <div
                key={platform.name}
                ref={(el) => (cardRefs.current[i] = el)}
                className="image-card"
                style={{ "--i": i, "--accent": `var(${platform.accent})` }}
                onClick={() => navigate(platform.route)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") navigate(platform.route);
                }}
              >
                <div className="image-card-glow" aria-hidden="true" />
                <span className="image-card-eyebrow">~/{platform.slug}</span>
                <div className="image-card-media">
                  <img src={platform.image} alt="" className="platform-logo platform-logo--dark" />
                  <img src={platform.imageLight} alt="" aria-hidden="true" className="platform-logo platform-logo--light" />
                </div>
                <p className="image-card-label">{platform.name}</p>
                <span className="image-card-arrow" aria-hidden="true">
                  <FaArrowRight />
                </span>
              </div>
            ))}
          </div>
        </section>

        <aside className="quick-add-panel">
          <div className="quick-add-glow" aria-hidden="true" />

          <span className="quick-add-kicker">$ track --new</span>
          <h2 className="quick-add-heading">Add a problem</h2>
          <p className="quick-add-subtitle">
            Keep your log current — save a problem the moment you solve it.
          </p>

          <button className="btn btn-primary quick-add-btn" onClick={() => navigate("/addProblem")}>
            <FaPlus /> Log new problem
          </button>

          <div className="quick-add-divider">
            <span>or jump to a platform</span>
          </div>

          <div className="quick-add-shortcuts">
            {platforms.map((platform) => (
              <a
                key={platform.name}
                className="quick-add-shortcut"
                style={{ "--accent": `var(${platform.accent})` }}
                href={platform.platformLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${platform.name} in a new tab`}
                title={platform.name}
              >
                <img src={platform.image} alt="" className="platform-logo platform-logo--dark" />
                <img src={platform.imageLight} alt="" aria-hidden="true" className="platform-logo platform-logo--light" />
              </a>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Home;
