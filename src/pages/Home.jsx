import HomePage from '../HomePage';
import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


function Home() {
  const navigate = useNavigate();

  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  const buttonRef = useRef(null);
  const [lines, setLines] = useState([]);
  const platforms = [
  {
    name: "Leetcode",
    image: "/LeetCode_Image.png",
    route: "/leetcode"
  },
  {
    name: "Codechef",
    image: "/Codechef.jpg",
    route: "/codechef"
  },
  {
    name: "CSES",
    image: "/CSES.png",
    route: "/cses"
  },
  {
    name: "Codeforces",
    image: "/Codeforces.png",
    route: "/codeforces"
  },
];

  useEffect(() => {
    const updateLines = () => {
      if (!buttonRef.current || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const btnRect = buttonRef.current.getBoundingClientRect();

      const newLines = cardRefs.current.map((card) => {
        if (!card) return null;

        const rect = card.getBoundingClientRect();

        return {
          x1: rect.right - containerRect.left,
          y1: rect.top + rect.height / 2 - containerRect.top,
          x2: btnRect.left - containerRect.left,
          y2: btnRect.top + btnRect.height / 2 - containerRect.top,
        };
      }).filter(Boolean);

      setLines(newLines);
    };

    updateLines();

    // Resize + slight delay (for animations/layout shifts)
    window.addEventListener("resize", updateLines);
    const timeout = setTimeout(updateLines, 300);

    return () => {
      window.removeEventListener("resize", updateLines);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="page-container" ref={containerRef}>
      <h1 className="main-title">What's in Mind</h1>

      <div className="content-layout">

        {/* SVG CONNECTIONS */}
        <svg className="connection-layer">
          {lines.map((line, i) => (
            <line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
            />
          ))}
        </svg>

        {/* LEFT: CARDS */}
        <div className="cards-container">
        {platforms.map((platform, i) => (
          <div
            key={i}
            ref={(el) => (cardRefs.current[i] = el)}
            className="image-card"
            onClick={() => navigate(platform.route)}
          >
            <img src={platform.image} alt={platform.name} />
            <p>{platform.name}</p>
          </div>
        ))}
      </div>

        {/* MIDDLE: BUTTON */}
        <div className="right-panel">
          <input
            type="text"
            placeholder="🔍 Search problems..."
            className="search-input"
            onFocus={() => navigate("/find")}
          />
          <button
            ref={buttonRef}
            onClick={() => navigate("/addProblem")}
            className="button button-accent"
          >
            + Add Problem
          </button>
        </div>

        {/* RIGHT: ANIMATION */}
        <div className="animation-container">
          <HomePage />
        </div>

      </div>
    </div>
  );
}

export default Home;