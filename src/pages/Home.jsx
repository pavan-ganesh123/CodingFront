import HomePage from '../HomePage';
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  const buttonRef = useRef(null);
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


  return (
    <div className="page-container" ref={containerRef}>
      <div className="brand">
        <h2>Code Cache</h2>
        
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
            <img src={platform.image} alt={platform.name} />
            <p>{platform.name}</p>
          </div>
        ))}
      </div>

        {/* MIDDLE: BUTTON */}
        <div className="top-right-container">
          <input
            type="text"
            placeholder="Search.."
            className="search-input"
            onFocus={() => navigate("/find")}
          />

          <button
            ref={buttonRef}
            onClick={() => navigate("/addProblem")}
            className="addProblem-button button-accent"
          >
            +
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