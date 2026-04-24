import { useState, useEffect } from "react";

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
              platformName
              code
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
            variables: { questionName: debouncedText }, // ✅ FIXED
          }),
        });

        const data = await res.json();

        console.log("GraphQL Response:", data); // 🔍 debug

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
    <div style={styles.container}>
      <h2 style={styles.heading}>Find Questions</h2>

      {/* 🔹 Search Box */}
      <input
        type="text"
        placeholder="Search by problem name..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={styles.input}
      />

      {/* 🔹 Loading */}
      {loading && <p style={styles.loading}>Searching...</p>}

      {/* 🔹 Results */}
      <div style={styles.results}>
        {problems.length === 0 && debouncedText && !loading && (
          <p style={styles.noResult}>No results found</p>
        )}

        {problems.map((p) => (
          <div key={p.id} style={styles.card}>
            <h3 style={styles.title}>{p.name}</h3>
            <p style={styles.platform}>{p.platformName}</p>
            <p style={{ fontSize: "12px", opacity: 0.6 }}>
              Code: {p.code}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FindQuestion;

const styles = {
  container: {
    maxWidth: "700px",
    margin: "40px auto",
    padding: "20px",
    textAlign: "center",
  },
  heading: {
    marginBottom: "20px",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    fontSize: "16px",
  },
  loading: {
    marginTop: "10px",
    color: "#888",
  },
  results: {
    marginTop: "20px",
  },
  card: {
    padding: "15px",
    marginBottom: "10px",
    borderRadius: "12px",
    background: "#1e293b",
    color: "white",
    textAlign: "left",
  },
  title: {
    margin: 0,
  },
  platform: {
    fontSize: "14px",
    opacity: 0.7,
  },
  noResult: {
    marginTop: "15px",
    color: "#999",
  },
};