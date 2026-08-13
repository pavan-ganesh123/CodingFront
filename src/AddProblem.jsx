import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaLink,
  FaLightbulb,
  FaClock,
  FaDatabase,
  FaGlobeAmericas,
  FaUserFriends,
  FaLock,
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
  FaSeedling,
  FaBolt,
  FaFire,
  FaCode,
  FaTags,
  FaTimes,
} from "react-icons/fa";
import "./AddProblem.css";

const VISIBILITY_OPTIONS = [
  { value: "PUBLIC", label: "Public", hint: "Anyone on code-cache", icon: FaGlobeAmericas },
  { value: "FRIENDS", label: "Friends", hint: "Only people you follow", icon: FaUserFriends },
  { value: "PRIVATE", label: "Only me", hint: "Private log entry", icon: FaLock },
];

// Reuses the same ap-visibility-* classes as VISIBILITY_OPTIONS below —
// same button-group look, no new CSS needed. Names are visibility-
// flavored purely because that's the CSS that already exists; rename
// the classes later if you want that to read cleaner in the stylesheet.
const DIFFICULTY_OPTIONS = [
  { value: "EASY", label: "Easy", hint: "Warm-up", icon: FaSeedling },
  { value: "MEDIUM", label: "Medium", hint: "Took some thought", icon: FaBolt },
  { value: "HARD", label: "Hard", hint: "Real grind", icon: FaFire },
];

// A continuously scrolling "activity feed" — purely illustrative demo
// rows. The array is rendered twice back-to-back so the scroll can loop
// seamlessly at the halfway point, and it fills whatever height the
// panel ends up at instead of needing to be sized just right.
const FEED_ENTRIES = [
  { name: "two-sum", meta: "O(n)", accent: "primary" },
  { name: "valid-parentheses", meta: "O(n)", accent: "teal" },
  { name: "binary-search", meta: "O(log n)", accent: "rose" },
  { name: "merge-intervals", meta: "O(n log n)", accent: "primary" },
  { name: "lru-cache", meta: "O(1)", accent: "teal" },
  { name: "course-schedule", meta: "O(V+E)", accent: "rose" },
  { name: "word-ladder", meta: "O(n·L)", accent: "primary" },
  { name: "kth-largest-element", meta: "O(n log k)", accent: "teal" },
  { name: "trapping-rain-water", meta: "O(n)", accent: "rose" },
  { name: "number-of-islands", meta: "O(m·n)", accent: "primary" },
];

// Strips case and separator differences ("two-pointers" / "two_pointers" /
// "Two Pointers") down to one comparable form, so suggestion matching
// isn't fooled by which delimiter someone happened to type.
const normalizeTopic = (value) => value.trim().toLowerCase().replace(/[\s_-]+/g, "");

function AddProblem() {
  const navigate = useNavigate();

  const [link, setLink] = useState("");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [code, setCode] = useState("");
  const [intuition, setIntuition] = useState("");
  const [timeComplexity, setTimeComplexity] = useState("");
  const [spaceComplexity, setSpaceComplexity] = useState("");
  const [topics, setTopics] = useState([]);
  const [topicInput, setTopicInput] = useState("");
  const [knownTopics, setKnownTopics] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [visibility, setVisibility] = useState("FRIENDS");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Every topic the user has ever tagged, across all platforms — not
  // filtered to one platform, since "two-pointers" is the same concept
  // whether the problem was solved on LeetCode or Codeforces, and the
  // whole point is reusing it regardless of where it was first typed.
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("https://codecache-13ic.onrender.com/api/problems/my/topics", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load topics"))))
      .then(setKnownTopics)
      .catch((error) => {
        console.error("Error fetching known topics:", error);
        setKnownTopics([]);
      });
  }, []);

  // Prefix matches (on the normalized form) rank first, substring matches
  // fill in after, already-added topics are excluded, capped at 6 so the
  // dropdown stays short.
  const topicSuggestions = (() => {
    const query = normalizeTopic(topicInput);
    if (!query) return [];

    const already = new Set(topics.map((t) => t.toLowerCase()));
    const prefixMatches = [];
    const containsMatches = [];

    for (const known of knownTopics) {
      if (already.has(known.toLowerCase())) continue;
      const normalized = normalizeTopic(known);
      if (normalized.startsWith(query)) prefixMatches.push(known);
      else if (normalized.includes(query)) containsMatches.push(known);
    }

    return [...prefixMatches, ...containsMatches].slice(0, 6);
  })();

  const addTopic = () => {
    const value = topicInput.trim();
    if (!value) return;

    setTopics((prev) =>
      prev.some((t) => t.toLowerCase() === value.toLowerCase()) ? prev : [...prev, value]
    );
    setTopicInput("");
    setHighlightedIndex(-1);
  };

  // Adds a topic by its existing, already-registered spelling — used
  // when the user picks a suggestion instead of typing their own text,
  // so the stored value stays the canonical one rather than forking.
  const selectSuggestion = (topic) => {
    setTopics((prev) =>
      prev.some((t) => t.toLowerCase() === topic.toLowerCase()) ? prev : [...prev, topic]
    );
    setTopicInput("");
    setHighlightedIndex(-1);
  };

  const removeTopic = (value) => {
    setTopics((prev) => prev.filter((t) => t !== value));
  };

  const handleTopicKeyDown = (e) => {
    if (e.key === "ArrowDown" && topicSuggestions.length > 0) {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, topicSuggestions.length - 1));
      return;
    }

    if (e.key === "ArrowUp" && topicSuggestions.length > 0) {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
      return;
    }

    if (e.key === "Escape" && highlightedIndex >= 0) {
      setHighlightedIndex(-1);
      return;
    }

    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      // Only hijacks Enter when a suggestion has actually been navigated
      // to — otherwise Enter still adds whatever was typed, unchanged,
      // so a genuinely new topic that happens to share a prefix with an
      // existing one doesn't get silently swapped out.
      if (e.key === "Enter" && highlightedIndex >= 0 && topicSuggestions[highlightedIndex]) {
        selectSuggestion(topicSuggestions[highlightedIndex]);
      } else {
        addTopic();
      }
      return;
    }

    if (e.key === "Backspace" && !topicInput && topics.length > 0) {
      setTopics((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmit = async () => {
    if (!link.trim()) {
      setMessage("error:Please enter a problem link");
      return;
    }

    if (!code.trim()) {
      setMessage("error:Please paste your solution code");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "https://codecache-13ic.onrender.com/api/problems/my/solve",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            link,
            difficulty,
            code,
            intuition,
            timeComplexity,
            spaceComplexity,
            topics,
            visibility,
            timeTaken: null,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        setMessage(`error:${errorText || "Failed to add problem"}`);
        return;
      }

      setMessage("success:Problem added to your log");

      setLink("");
      setDifficulty("MEDIUM");
      setCode("");
      setIntuition("");
      setTimeComplexity("");
      setSpaceComplexity("");
      setTopics([]);
      setTopicInput("");
      setVisibility("FRIENDS");
    } catch (error) {
      console.error(error);
      setMessage("error:Server error — please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isError = message.startsWith("error:");
  const messageText = message.replace(/^(error|success):/, "");

  return (
    <div className="ap-page">
      <div className="page-mesh" aria-hidden="true" />
      <div className="page-grain" aria-hidden="true" />

      <div className="ap-shell">
        <button className="ap-back" onClick={() => navigate(-1)}>
          <FaArrowLeft />
          Back
        </button>

        <div className="ap-layout">
          <aside className="ap-aside">
            <div className="ap-aside-glow" aria-hidden="true" />

            <div className="ap-aside-head">
              <span className="ap-aside-kicker">$ tail -f problems.log</span>
            </div>

            <div className="ap-feed">
              <div className="ap-feed-track">
                {[...FEED_ENTRIES, ...FEED_ENTRIES].map((entry, i) => (
                  <div className="ap-feed-row" key={i}>
                    <span className={`ap-feed-dot ap-feed-dot--${entry.accent}`} />
                    <span className="ap-feed-name">{entry.name}</span>
                    <span className="ap-feed-meta">{entry.meta}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className="ap-card">
            <div className="ap-card-glow" aria-hidden="true" />

            <span className="ap-kicker ap-kicker--card">$ add --problem</span>
            <h1 className="ap-title">Log a problem</h1>
            <p className="ap-subtitle">
              Capture it while it's fresh — the link, your code, and how you got there.
            </p>

            <div className="ap-form">
            <div className="ap-field">
              <label className="ap-field-label" htmlFor="problem-link">
                <FaLink className="ap-field-icon" />
                Problem link
              </label>
              <input
                id="problem-link"
                className="ap-field-input"
                placeholder="https://leetcode.com/problems/..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>

            <div className="ap-field">
              <span className="ap-field-label">Difficulty</span>
              <div className="ap-visibility-group" role="radiogroup" aria-label="Problem difficulty">
                {DIFFICULTY_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const active = difficulty === option.value;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      role="radio"
                      aria-checked={active}
                      className={`ap-visibility-option ${active ? "ap-is-active" : ""}`}
                      onClick={() => setDifficulty(option.value)}
                    >
                      <Icon className="ap-visibility-icon" />
                      <span className="ap-visibility-copy">
                        <span className="ap-visibility-name">{option.label}</span>
                        <span className="ap-visibility-hint">{option.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="ap-field">
              <label className="ap-field-label" htmlFor="topic-input">
                <FaTags className="ap-field-icon" />
                Topics
              </label>
              <div className="ap-tag-field">
                {topics.map((topic) => (
                  <span className="ap-tag-chip" key={topic}>
                    {topic}
                    <button
                      type="button"
                      className="ap-tag-chip-remove"
                      onClick={() => removeTopic(topic)}
                      aria-label={`Remove ${topic}`}
                    >
                      <FaTimes />
                    </button>
                  </span>
                ))}
                <input
                  id="topic-input"
                  className="ap-tag-input"
                  placeholder={topics.length ? "Add another…" : "e.g. Array, Two Pointers…"}
                  value={topicInput}
                  onChange={(e) => {
                    setTopicInput(e.target.value);
                    setHighlightedIndex(-1);
                  }}
                  onKeyDown={handleTopicKeyDown}
                  onBlur={addTopic}
                  role="combobox"
                  aria-expanded={topicSuggestions.length > 0}
                  aria-autocomplete="list"
                  aria-controls="topic-suggestions"
                  autoComplete="off"
                />

                {topicSuggestions.length > 0 && (
                  <div className="ap-tag-suggestions" id="topic-suggestions" role="listbox">
                    {topicSuggestions.map((topic, i) => (
                      <button
                        type="button"
                        key={topic}
                        role="option"
                        aria-selected={i === highlightedIndex}
                        className={`ap-tag-suggestion ${i === highlightedIndex ? "ap-is-highlighted" : ""}`}
                        // preventDefault on mousedown stops the input from
                        // blurring before this click registers — without
                        // it, onBlur's addTopic() would fire first and add
                        // the raw partial text instead of this suggestion.
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectSuggestion(topic)}
                        onMouseEnter={() => setHighlightedIndex(i)}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="ap-visibility-hint">Press Enter or comma to add · optional</span>
            </div>

            <div className="ap-field">
              <label className="ap-field-label" htmlFor="solution-code">
                <FaCode className="ap-field-icon" />
                Your solution
              </label>
              <textarea
                id="solution-code"
                className="ap-field-input ap-field-textarea ap-field-mono"
                placeholder="Paste the code you submitted..."
                rows="10"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <div className="ap-field">
              <label className="ap-field-label" htmlFor="intuition">
                <FaLightbulb className="ap-field-icon" />
                Intuition
              </label>
              <textarea
                id="intuition"
                className="ap-field-input ap-field-textarea"
                placeholder="What was your approach? Any key insight that cracked it..."
                rows="4"
                value={intuition}
                onChange={(e) => setIntuition(e.target.value)}
              />
            </div>

            <div className="ap-field-row">
              <div className="ap-field">
                <label className="ap-field-label" htmlFor="time-complexity">
                  <FaClock className="ap-field-icon" />
                  Time
                </label>
                <input
                  id="time-complexity"
                  className="ap-field-input ap-field-mono"
                  placeholder="O(n log n)"
                  value={timeComplexity}
                  onChange={(e) => setTimeComplexity(e.target.value)}
                />
              </div>

              <div className="ap-field">
                <label className="ap-field-label" htmlFor="space-complexity">
                  <FaDatabase className="ap-field-icon" />
                  Space
                </label>
                <input
                  id="space-complexity"
                  className="ap-field-input ap-field-mono"
                  placeholder="O(n)"
                  value={spaceComplexity}
                  onChange={(e) => setSpaceComplexity(e.target.value)}
                />
              </div>
            </div>

            <div className="ap-field">
              <span className="ap-field-label">Who can see this</span>
              <div className="ap-visibility-group" role="radiogroup" aria-label="Post visibility">
                {VISIBILITY_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const active = visibility === option.value;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      role="radio"
                      aria-checked={active}
                      className={`ap-visibility-option ${active ? "ap-is-active" : ""}`}
                      onClick={() => setVisibility(option.value)}
                    >
                      <Icon className="ap-visibility-icon" />
                      <span className="ap-visibility-copy">
                        <span className="ap-visibility-name">{option.label}</span>
                        <span className="ap-visibility-hint">{option.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              className="ap-submit-btn"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="ap-submit-spinner" />
                  Saving...
                </>
              ) : (
                "Add problem"
              )}
            </button>

            {message && (
              <p className={`ap-form-message ${isError ? "ap-is-error" : "ap-is-success"}`}>
                {isError ? <FaExclamationCircle /> : <FaCheckCircle />}
                {messageText}
              </p>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddProblem;
