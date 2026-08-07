import { useState } from "react";
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
} from "react-icons/fa";
import "./AddProblem.css";

const VISIBILITY_OPTIONS = [
  { value: "PUBLIC", label: "Public", hint: "Anyone on code-cache", icon: FaGlobeAmericas },
  { value: "FRIENDS", label: "Friends", hint: "Only people you follow", icon: FaUserFriends },
  { value: "PRIVATE", label: "Only me", hint: "Private log entry", icon: FaLock },
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

function AddProblem() {
  const navigate = useNavigate();

  const [link, setLink] = useState("");
  const [intuition, setIntuition] = useState("");
  const [timeComplexity, setTimeComplexity] = useState("");
  const [spaceComplexity, setSpaceComplexity] = useState("");
  const [visibility, setVisibility] = useState("FRIENDS");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!link.trim()) {
      setMessage("error:Please enter a problem link");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

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
        setMessage(`error:${errorText || "Failed to add problem"}`);
        return;
      }

      setMessage("success:Problem added to your log");

      setLink("");
      setIntuition("");
      setTimeComplexity("");
      setSpaceComplexity("");
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
              Capture it while it's fresh — the link, your approach, and how it ran.
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
