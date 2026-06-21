import React, { useState } from "react";
import "./AddProblem.css";

function AddProblem() {
  const [link, setLink] = useState("");
  const [intuition, setIntuition] = useState("");
  const [timeComplexity, setTimeComplexity] = useState("");
  const [spaceComplexity, setSpaceComplexity] = useState("");
  const [visibility, setVisibility] = useState("FRIENDS");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!link.trim()) {
      setMessage("Please enter a problem link");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:8080/api/problems/my/solve",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            link,
            intuition,
            timeComplexity,
            spaceComplexity,
            visibility,
            timeTaken: null,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        setMessage(
          errorText || "❌ Failed to add problem"
        );

        return;
      }

      setMessage("✅ Problem added successfully!");

      setLink("");
      setIntuition("");
      setTimeComplexity("");
      setSpaceComplexity("");
      setVisibility("FRIENDS");

    } catch (error) {
      console.error(error);
      setMessage("❌ Server error");
    }
  };

  return (
    <div className="adding_container">
      <h2 className="title">Add Problem</h2>

      <div className="adding_card" style={{ maxWidth: "450px" }}>
        <input
          className="input"
          placeholder="Problem Link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />

        <textarea
          className="input"
          placeholder="Intuition"
          rows="5"
          value={intuition}
          onChange={(e) => setIntuition(e.target.value)}
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

        <button
          className="button button-accent"
          onClick={handleSubmit}
        >
          Add Problem
        </button>

        {message && (
          <p
            className={`message ${
              message.startsWith("❌") ? "error" : "success"
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