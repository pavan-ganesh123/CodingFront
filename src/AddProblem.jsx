import React, { useState } from "react";

function AddProblem() {
  const [questionName, setQuestionName] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [platformName, setPlatform] = useState("");
  const [questionId, setQuestionId] = useState("");
  const [link, setLink] = useState("");
  const [intuition, setIntuition] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

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
              $questionId: Int!,
              $link: String!,
              $intuition: String!,
              $code: String!
            ) {
              addProblem(
                questionName: $questionName,
                difficulty: $difficulty,
                platformName: $platformName,
                questionId: $questionId,
                link: $link,
                intuition: $intuition,
                code: $code
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
          },
        }),
      });

      const data = await response.json();

      if (data.errors) {
        console.error("GraphQL Errors:", JSON.stringify(data.errors, null, 2));
        setMessage("❌ Failed to save problem");
      } else {
        console.log("Saved:", data);
        setMessage("✅ Problem added successfully!");

        // ✅ Clear form
        setQuestionName("");
        setDifficulty("");
        setPlatform("");
        setQuestionId("");
        setLink("");
        setIntuition("");
        setCode("");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("❌ Server error");
    }
  };

  return (
    <div className="container">
      <h2 className="title">Add Problem</h2>

      <div className="card" style={{ maxWidth: "500px" }}>
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
          placeholder="Code"
          rows="6"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <button className="button button-accent" onClick={handleSubmit}>
          Add Problem
        </button>

        {message && (
          <p style={{ marginTop: "10px", fontSize: "14px" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default AddProblem;