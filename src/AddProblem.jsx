import React, { useState } from "react";
import "./AddProblem.css";
import { ToastProvider, useToast } from "./notifications/ToastContext";

function AddProblem() {
  const [questionName, setQuestionName] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [platformName, setPlatform] = useState("");
  const [questionId, setQuestionId] = useState("");
  const [link, setLink] = useState("");
  const [intuition, setIntuition] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [keyIdea, setKeyIdea] = useState("");
  const [approach, setApproach] = useState("");
  const [mistakes, setMistakes] = useState("");
  const [timeComplexity, setTimeComplexity] = useState("");
  const [spaceComplexity, setSpaceComplexity] = useState("");
  const { showToast } = useToast();

  const handleSubmit = async () => {
    // ✅ Validation
    if (!questionId || isNaN(Number(questionId))) {
      setMessage("❌ Question ID must be a valid number");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            mutation AddProblem(
              $questionName: String!,
              $difficulty: String!,
              $platformName: String!,
              $questionId: Int,
              $link: String!,
              $intuition: String!,
              $code: String!
              $keyIdea: String
              $approach: String
              $mistakes: String
              $timeComplexity: String
              $spaceComplexity: String
            ) {
              addProblem(
                questionName: $questionName,
                difficulty: $difficulty,
                platformName: $platformName,
                questionId: $questionId,
                link: $link,
                intuition: $intuition,
                code: $code
                keyIdea: $keyIdea
                approach: $approach
                mistakes: $mistakes
                timeComplexity: $timeComplexity
                spaceComplexity: $spaceComplexity
              ) {
                id
              }
            }
          `,
          variables: {
            questionName,
            difficulty: difficulty.toUpperCase(), // ✅ enum safety
            platformName,
            questionId: Number(questionId),       // ✅ FIX HERE
            link,
            intuition,
            code,
            keyIdea,
            approach,
            mistakes,
            timeComplexity,
            spaceComplexity,
          },
        }),
      });

      const data = await response.json();

      if (data.errors) {
        console.error("GraphQL Errors:", JSON.stringify(data.errors, null, 2));
        setMessage("❌ Failed to save problem");
        showToast("Error occurred","error");
      } else {
        console.log("Saved:", data);
        setMessage("✅ Problem added successfully!");
        showToast("Notes Added","info");
        // ✅ Clear form
        setQuestionName("");
        setDifficulty("");
        setPlatform("");
        setQuestionId("");
        setLink("");
        setIntuition("");
        setCode("");
        setKeyIdea("");
        setApproach("");
        setMistakes("");
        setTimeComplexity("");
        setSpaceComplexity("");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("❌ Server error");
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
          placeholder="Platform Name (Leetcode / CodeChef)"
          value={platformName}
          onChange={(e) => setPlatform(e.target.value)}
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
          placeholder="KeyIdea"
          rows="3"
          value={keyIdea}
          onChange={(e) => setKeyIdea(e.target.value)}
        />

        <textarea
          className="input"
          placeholder="Approach"
          rows="3"
          value={approach}
          onChange={(e) => setApproach(e.target.value)}
        />

        <textarea
          className="input"
          placeholder="Common Mistakes"
          rows="2"
          value={mistakes}
          onChange={(e) => setMistakes(e.target.value)}
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