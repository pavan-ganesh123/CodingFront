import { useState, useEffect } from "react";
import "./FindQuestion.css";

function FindQuestion() {
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

        const res = await fetch("https://codecache-13ic.onrender.com/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            variables: { questionName: debouncedText }, // ✅ FIXED
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

  return (
  <div className="find-question-container">

    <h2 className="find-question-heading">
      Find Questions
    </h2>

    <input
      type="text"
      placeholder="Search by problem name..."
      value={text}
      onChange={(e) => setText(e.target.value)}
      className="find-question-input"
    />

    {loading && (
      <p className="loading-text">
        Searching...
      </p>
    )}

    <div className="results-container">

      {problems.length === 0 && debouncedText && !loading && (
        <p className="no-result">
          No results found
        </p>
      )}

      {problems.map((p) => (

        <div
          key={p.id}
          className="problem-card"
        >

          <div className="problem-header">

            <h3 className="problem-title">
              {p.questionName}
            </h3>

            <span className="platform-badge">
              {p.platformName}
            </span>

          </div>

          <a
            href={p.link}
            target="_blank"
            rel="noopener noreferrer"
            className="problem-link"
          >
            Solve Problem ↗
          </a>

        </div>

      ))}

    </div>

  </div>
);
}

export default FindQuestion;
