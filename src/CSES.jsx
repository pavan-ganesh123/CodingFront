import React, { useEffect, useState } from "react";
import { FaExternalLinkAlt, FaChevronDown, FaCopy, FaCheck } from "react-icons/fa";
import "./CSES.css";

const DIFFICULTIES = [
  { label: "All", value: "" },
  { label: "Easy", value: "Easy" },
  { label: "Medium", value: "Medium" },
  { label: "Hard", value: "Hard" },
];

function CSES() {
  const [problems, setProblems] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [difficulty, setDifficulty] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    const fetchProblems = async () => {
      setIsLoading(true);
      setLoadError(false);

      try {
        const token = localStorage.getItem("token");

        const params = new URLSearchParams();
        params.append("platform", "CSES");

        if (difficulty) {
          params.append("difficulty", difficulty);
        }

        const response = await fetch(
          `http://localhost:8080/api/problems/my/problems?${params.toString()}`,
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
        console.error("Error fetching problems:", error);
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProblems();
  }, [difficulty]);

  const toggleExpand = (index) => {
    setExpanded((current) => (current === index ? null : index));
  };

  const handleCopy = async (code, index) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex((current) => (current === index ? null : current)), 1800);
    } catch (error) {
      console.error("Error copying code:", error);
    }
  };

  return (
    <div className="platform-page">
      <div className="page-mesh" aria-hidden="true" />
      <div className="page-grain" aria-hidden="true" />

      <header className="platform-header">
        <div>
          <p className="platform-eyebrow">Platform</p>
          <h1 className="platform-heading">CSES</h1>
          <p className="platform-subtitle">
            {isLoading
              ? "Loading your problems…"
              : `${problems.length} problem${problems.length === 1 ? "" : "s"} logged${
                  difficulty ? ` · ${difficulty}` : ""
                }`}
          </p>
        </div>

        <div className="difficulty-filter" role="tablist" aria-label="Filter by difficulty">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value || "all"}
              role="tab"
              aria-selected={difficulty === d.value}
              className={`difficulty-filter-btn ${difficulty === d.value ? "is-active" : ""} ${
                d.value ? d.value.toLowerCase() : ""
              }`}
              onClick={() => setDifficulty(d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </header>

      <div className="cses-container">
        {isLoading ? (
          <div className="cses-list">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-card" style={{ "--i": i }} aria-hidden="true" />
            ))}
          </div>
        ) : loadError ? (
          <div className="state-panel state-panel--error">
            <p>Couldn&apos;t load your problems. Check your connection and try again.</p>
          </div>
        ) : problems.length === 0 ? (
          <div className="state-panel">
            <p>No problems logged yet{difficulty ? ` for ${difficulty}` : ""}.</p>
          </div>
        ) : (
          <div className="cses-list">
            {problems.map((p, index) => {
              const isOpen = expanded === index;
              const difficultyClass = p.difficulty?.toLowerCase() || "";

              return (
                <article
                  key={p.problemId ?? index}
                  className={`cses-card ${difficultyClass} ${isOpen ? "expanded" : ""}`}
                  style={{ "--i": index }}
                >
                  <div className="card-top">
                    <div className="card-top-main">
                      <span className="problem-index">{p.problemId}</span>
                      <h2 className="title">{p.questionName}</h2>
                    </div>

                    <div className="actions">
                      <a href={p.link} target="_blank" rel="noreferrer" className="view-btn">
                        View <FaExternalLinkAlt />
                      </a>

                      <button
                        className={`expand-btn ${isOpen ? "is-open" : ""}`}
                        onClick={() => toggleExpand(index)}
                        aria-expanded={isOpen}
                        aria-label={isOpen ? "Collapse details" : "Expand details"}
                      >
                        <FaChevronDown />
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="expanded-content">
                      <div className="section">
                        <div className="section-title">Intuition</div>
                        <div className="section-content">
                          {p.intuition
                            ?.split("\n")
                            .map((line, i) => {
                              const text = line.trim();
                              if (!text) return null;
                              return <p key={i}>{text}</p>;
                            })}
                        </div>
                      </div>

                      <div className="section">
                        <div className="section-title-row">
                          <div className="section-title">Code</div>
                          <button className="copy-btn" onClick={() => handleCopy(p.solutionCode, index)}>
                            {copiedIndex === index ? (
                              <>
                                <FaCheck /> Copied
                              </>
                            ) : (
                              <>
                                <FaCopy /> Copy
                              </>
                            )}
                          </button>
                        </div>
                        <pre>
                          <code>{p.solutionCode}</code>
                        </pre>
                      </div>

                      <div className="complexities">
                        <div className="tag complexity">
                          <span>Time</span>
                          {p.timeComplexity}
                        </div>
                        <div className="tag complexity">
                          <span>Space</span>
                          {p.spaceComplexity}
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CSES;
