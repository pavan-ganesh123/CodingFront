import React, { useEffect, useState } from "react";
import "./Codechef.css";

function Codechef() {

  const [problems, setProblems] = useState([]);

  const [expanded, setExpanded] = useState(null);
  const [difficulty, setDifficulty] = useState("");

  useEffect(() => {

  const fetchProblems = async () => {

    try {

      const token = localStorage.getItem("token");

      const params = new URLSearchParams();
      params.append("platform", "Codechef");
      

      if (difficulty) {
        params.append("difficulty", difficulty);
      }

      const response = await fetch(
        `https://codecache-13ic.onrender.com/api/problems/my/problems?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch problems");
      }

      const data = await response.json();

      setProblems(data);

    } catch (error) {

      console.error(
        "Error fetching problems:",
        error
      );

    }
  };

  fetchProblems();

}, [difficulty]);

  const toggleExpand = (index) => {

    if (expanded === index) {
      setExpanded(null);
    } else {
      setExpanded(index);
    }
  };

  return (

    <>
      <h1 className="codechef-main-heading">
        Codechef
        <div className="filters">
          
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

        </div>
      </h1>

      <div className="codechef_container">

        <div className="grid">

          {problems.map((p, index) => {

            const isOpen = expanded === index;

            return (

              <div
                key={index}
                className={`codechef_card ${
                  isOpen ? "expanded" : ""
                }`}
              >

                {/* TOP */}

                <div className="card-top">

                  <div>

                    <h2 className="title">
                      {p.problem.questionId}. {p.problem.questionName}
                    </h2>

                    <span
                      className={`difficulty ${p.problem.difficulty.toLowerCase()}`}
                    >
                      {p.problem.difficulty}
                    </span>

                  </div>

                  <div className="actions">

                    <a
                      href={p.problem.link}
                      target="_blank"
                      rel="noreferrer"
                      className="button"
                    >
                      View Problem
                    </a>

                    <button
                      className="expand-btn"
                      onClick={() => toggleExpand(index)}
                    >
                      {isOpen ? "▲" : "▼"}
                    </button>

                  </div>

                </div>

                {/* EXPANDED CONTENT */}

                {isOpen && (

                  <div className="expanded-content">

                    {/* INTUITION */}

                    <div className="section">

                      <div className="section-title">
                        Intuition
                      </div>

                      <div className="section-content">

                        {p.intuition
                          ?.split("\n")
                          .map((line, i) => {

                            const text = line.trim();

                            if (!text) return null;

                            return (
                              <p key={i}>
                                {text}
                              </p>
                            );
                          })}

                      </div>

                    </div>

                    {/* CODE */}

                    <div className="section">

                      <div className="section-title">
                        Code
                      </div>

                      <pre>
                        <code>
                          {p.solutionCode}
                        </code>
                      </pre>

                    </div>

                    {/* COMPLEXITIES */}

                    <div className="complexities">

                      <div className="tag complexity">
                        Time: {p.timeComplexity}
                      </div>

                      <div className="tag complexity">
                        Space: {p.spaceComplexity}
                      </div>

                    </div>

                  </div>

                )}

              </div>

            );
          })}

        </div>

      </div>
    </>

  );
}

export default Codechef;