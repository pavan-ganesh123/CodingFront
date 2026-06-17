import React, { useState } from "react";
import "./AddProblem.css";

function AddProblem() {
  const [questionName, setQuestionName] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [questionId, setQuestionId] = useState("");
  const [link, setLink] = useState("");
  const [intuition, setIntuition] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [timeComplexity, setTimeComplexity] = useState("");
  const [spaceComplexity, setSpaceComplexity] = useState("");
  const [visibility, setVisibility] = useState("FRIENDS");

  const handleSubmit = async () => {
    if (!questionId || isNaN(Number(questionId))) {
      setMessage("Question ID must be a valid number");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      let platformName = "";

      const lowerLink = link.toLowerCase();

      if (lowerLink.includes("leetcode")) {
        platformName = "Leetcode";
      } else if (lowerLink.includes("codechef")) {
        platformName = "Codechef";
      } else if (lowerLink.includes("codeforces")) {
        platformName = "Codeforces";
      } else if (lowerLink.includes("cses")) {
        platformName = "CSES";
      } else {
        platformName = "Other";
      }
      const createResponse = await fetch("http://localhost:8080/api/problems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
        problem: {
          questionName,
          difficulty,
          platformName,
          questionId: Number(questionId),
          link,
          intuition,
          code,
          timeComplexity,
          spaceComplexity,
        },
        visibility,
      }),
      });

      if (!createResponse.ok) {
        setMessage("Failed to save problem");
        return;
      }

      const createdProblem = await createResponse.json();
      const problemId = createdProblem.id;

      const solveResponse = await fetch(
        `http://localhost:8080/api/problems/my/solve?problemId=${problemId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            solutionCode: code,
            intuition: intuition,
            timeComplexity: timeComplexity,
            spaceComplexity: spaceComplexity,
          }),
        }
      );

      if (!solveResponse.ok) {
        setMessage("Problem saved but marking as solved failed");
        return;
      }

      setMessage("✅ Problem added and marked as solved!");

      setQuestionName("");
      setDifficulty("");
      setQuestionId("");
      setLink("");
      setIntuition("");
      setCode("");
      setTimeComplexity("");
      setSpaceComplexity("");
    } catch (error) {
      console.error("Error:", error);
      setMessage("Server error");
    }
  };

  return (
    <div className="adding_container">
      <h2 className="title">Add Problem</h2>

      <div className="adding_card" style={{ maxWidth: "450px" }}>
        <input
          className="input"
          placeholder="Question Name"
          value={questionName}
          onChange={(e) => setQuestionName(e.target.value)}
        />

        <input
          className="input"
          placeholder="Question Id (number)"
          value={questionId}
          onChange={(e) => setQuestionId(e.target.value)}
        />

        <input
          className="input"
          placeholder="Difficulty (easy / medium / hard)"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        />

        <input
          className="input"
          placeholder="Link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />

        <textarea
          className="input"
          placeholder="Intuition"
          rows="4"
          value={intuition}
          onChange={(e) => setIntuition(e.target.value)}
        />

        <textarea
          className="input"
          placeholder="Code"
          rows="6"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <input
          className="input"
          placeholder="Time Complexity"
          value={timeComplexity}
          onChange={(e) => setTimeComplexity(e.target.value)}
        />

        <input
          className="input"
          placeholder="Space Complexity"
          value={spaceComplexity}
          onChange={(e) => setSpaceComplexity(e.target.value)}
        />
        
        <div className="visibility-section">

          <label className="visibility-label">
            Post Visibility
          </label>

          <select
            className="visibility-input"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <option value="PUBLIC">Public</option>
            <option value="FRIENDS">Friends Only</option>
            <option value="PRIVATE">Only Me</option>
          </select>

        </div>

        <button className="button button-accent" onClick={handleSubmit}>
          Add Problem
        </button>

        {message && (
          <p
            className={`message ${
              message.includes("❌") ? "error" : "success"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default AddProblem;