import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Leetcode from "./Leetcode";
import AddProblem from "./AddProblem";
import HomePage from "./HomePage";
import "./App.css";

function Home() {
  const navigate = useNavigate();


  return (
    <div className="page-container">
      
      <h1 className="main-title">What's in Mind</h1>

      <div className="content-layout">

      {/* LEFT: Cards */}
      <div className="cards-container">
        {[1, 2, 3, 4].map((_, i) => (
          <div
            key={i}
            className="image-card"
            onClick={() => navigate("/leetcode")}
          >
            <img src="/LeetCode_Image.png" alt="LeetCode" />
            <p>Leetcode</p>
          </div>
        ))}
      </div>

      {/* MIDDLE: Button */}
      <div className="right-panel">
        <button
          onClick={() => navigate("/addProblem")}
          className="button button-accent"
        >
          + Add Problem
        </button>
      </div>

      {/* RIGHT: Animation */}
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;