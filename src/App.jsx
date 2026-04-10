import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Leetcode from "./Leetcode";
import AddProblem from "./AddProblem";
import HomePage from "./HomePage";
import FindQuestion from "./FindQuestion";
import { useRef, useEffect, useState } from "react";
import "./App.css";

function Home() {
  const navigate = useNavigate();

  const buttonStyle =
    "bg-white/10 backdrop-blur-lg text-white px-8 py-4 rounded-2xl shadow-lg border border-white/20 hover:bg-white/20 transition-all duration-300";

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-purple-900 to-gray-900">
      <h1 className="text-4xl font-bold text-white mb-10">What's in Mind</h1>

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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/leetcode" element={<Leetcode />} />
        <Route path="/addProblem" element={<AddProblem />} />
        <Route path="/find" element={<FindQuestion />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;