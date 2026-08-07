import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaTimes,
  FaArrowLeft,
  FaExternalLinkAlt,
  FaSearchMinus,
} from "react-icons/fa";
import "./FindQuestion.css";

const PLATFORM_ACCENTS = {
  leetcode: "var(--acc-leetcode)",
  codechef: "var(--acc-codechef)",
  cses: "var(--acc-cses)",
  codeforces: "var(--acc-codeforces)",
};

function getAccent(platformName) {
  return PLATFORM_ACCENTS[(platformName || "").toLowerCase()] || "var(--primary-fg)";
}

function FindQuestion() {
  const navigate = useNavigate();

  const [text, setText] = useState("");
  const [debouncedText, setDebouncedText] = useState("");
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(text);
    }, 400);

    return () => clearTimeout(timer);
  }, [text]);

  // 🔹 Fetch data
  useEffect(() => {
    if (!debouncedText) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProblems([]);
      return;
    }

    const fetchProblems = async () => {
      setLoading(true);

      try {
        const query = `
          query($questionName: String!) {
            getByquestionName(questionName: $questionName) {
              id
              questionName
              platformName
              link
            }
          }
        `;

        const res = await fetch("http://localhost:8080/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            variables: { questionName: debouncedText },
          }),
        });

        const data = await res.json();

        if (data.errors) {
          console.error("GraphQL Errors:", data.errors);
          setProblems([]);
        } else {
          setProblems(data?.data?.getByquestionName || []);
        }
      } catch (err) {
        console.error("Error fetching problems:", err);
      }

      setLoading(false);
    };

    fetchProblems();
  }, [debouncedText]);

  const showIdle = !loading && !debouncedText;
  const showEmpty = !loading && debouncedText && problems.length === 0;
  const showResults = !loading && problems.length > 0;

  return (
    <div className="fq-page">
      <div className="page-mesh" aria-hidden="true" />
      <div className="page-grain" aria-hidden="true" />

      <div className="fq-shell">
        <button className="fq-back" onClick={() => navigate(-1)}>
          <FaArrowLeft />
          Back
        </button>

        <div className="fq-header">
          <span className="fq-kicker">$ find --problem</span>
          <h1 className="fq-title">Find a problem</h1>
          <p className="fq-subtitle">
            Search across every problem you've logged.
          </p>
        </div>

        <div className="fq-search-wrap">
          <FaSearch className="fq-search-icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by problem name..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="fq-search-input"
            autoFocus
          />
          {text && (
            <button
              className="fq-clear-btn"
              onClick={() => setText("")}
              aria-label="Clear search"
            >
              <FaTimes />
            </button>
          )}
        </div>

        <div className="fq-results">
          {loading && (
            <div className="fq-skeleton-list" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div className="fq-skeleton" key={i} style={{ animationDelay: `${i * 90}ms` }}>
                  <div className="fq-skeleton-bar fq-skeleton-bar--title" />
                  <div className="fq-skeleton-bar fq-skeleton-bar--badge" />
                </div>
              ))}
            </div>
          )}

          {showIdle && (
            <div className="fq-state">
              <FaSearch className="fq-state-icon" />
              <p className="fq-state-title">Start typing to search</p>
              <p className="fq-state-copy">Try a problem name like "3sum" or "Monsters".</p>
            </div>
          )}

          {showEmpty && (
            <div className="fq-state">
              <FaSearchMinus className="fq-state-icon" />
              <p className="fq-state-title">No results for "{debouncedText}"</p>
              <p className="fq-state-copy">Try a different name, or check the spelling.</p>
            </div>
          )}

          {showResults &&
            problems.map((p, i) => (
              <a
                key={p.id}
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                className="fq-card"
                style={{ "--accent": getAccent(p.platformName), animationDelay: `${i * 45}ms` }}
              >
                <span className="fq-card-accent" aria-hidden="true" />
                <div className="fq-card-body">
                  <h3 className="fq-card-title">{p.questionName}</h3>
                  <span className="fq-card-badge">{p.platformName}</span>
                </div>
                <span className="fq-card-go">
                  Solve
                  <FaExternalLinkAlt />
                </span>
              </a>
            ))}
        </div>
      </div>
    </div>
  );
}

export default FindQuestion;
