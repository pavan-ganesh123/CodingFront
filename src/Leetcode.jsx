import React, { useEffect, useState } from "react";
import "./Leetcode.css";

function Leetcode() {

  const [problems, setProblems] = useState([]);

  const [expanded, setExpanded] = useState(null);

  useEffect(() => {

    fetch("http://localhost:8080/graphql", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        query: `
          query {
            getLeetcode {
              questionName
              questionId
              difficulty
              link
              intuition
              keyIdea
              approach
              mistakes
              code
              timeComplexity
              spaceComplexity
            }
          }
        `,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setProblems(data?.data?.getLeetcode || []);
      });

  }, []);

  const toggleExpand = (index) => {

    if (expanded === index) {
      setExpanded(null);
    } else {
      setExpanded(index);
    }
  };

  return (

    <>
      <h1 className="leetcode-main-heading">
        Leetcode
      </h1>

      <div className="leetcode_container">

        <div className="grid">

          {problems.map((p, index) => {

            const isOpen = expanded === index;

            return (

              <div
                key={index}
                className={`leetcode_card ${
                  isOpen ? "expanded" : ""
                }`}
              >

                {/* TOP */}

                <div className="card-top">

                  <div>

                    <h2 className="title">
                      {p.questionId}. {p.questionName}
                    </h2>

                    <span
                      className={`difficulty ${p.difficulty.toLowerCase()}`}
                    >
                      {p.difficulty}
                    </span>

                  </div>

                  <div className="actions">

                    <a
                      href={p.link}
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
                          {p.code}
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

export default Leetcode;