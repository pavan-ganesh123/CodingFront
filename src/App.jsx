import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Leetcode from "./Leetcode";
import AddProblem from "./AddProblem";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import "./App.css";

function Home() {
  const navigate = useNavigate();

  const buttonStyle =
    "bg-white/10 backdrop-blur-lg text-white px-8 py-4 rounded-2xl shadow-lg border border-white/20 hover:bg-white/20 transition-all duration-300";

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-purple-900 to-gray-900">
      <h1 className="text-4xl font-bold text-white mb-10">What's in Mind</h1>

      <div className="flex gap-6">
        <motion.button
          whileHover={{ scale: 1.1, y: -5 }}
          whileTap={{ scale: 0.95 }}
          className={buttonStyle}
          onClick={() => navigate("/leetcode")}
        >
          LeetCode
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1, y: -5 }}
          whileTap={{ scale: 0.95 }}
          className="bg-purple-600 text-white px-8 py-4 rounded-2xl shadow-xl hover:bg-purple-700 transition-all duration-300"
          onClick={() => navigate("/addProblem")}
        >
          + Add Problem
        </motion.button>
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