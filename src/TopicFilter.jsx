import { useEffect, useRef, useState } from "react";
import { FaTags, FaTimes } from "react-icons/fa";
import "./TopicFilter.css";

function TopicFilter({ platform, selected, onChange }) {
  const [available, setAvailable] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchTopics = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const params = new URLSearchParams();
        if (platform) params.append("platform", platform);

        const response = await fetch(
          `https://codecache-13ic.onrender.com/api/problems/my/topics?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) throw new Error("Failed to fetch topics");
        setAvailable(await response.json());
      } catch (error) {
        console.error("Error fetching topics:", error);
        setAvailable([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopics();
  }, [platform]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleTopic = (topic) => {
    onChange(
      selected.includes(topic)
        ? selected.filter((t) => t !== topic)
        : [...selected, topic]
    );
  };

  if (!isLoading && available.length === 0) return null;

  return (
    <div className="topic-filter" ref={containerRef}>
      {/* Anchor wraps just the toggle + dropdown panel, so this stays a
          small, compact footprint next to the difficulty pills, and so
          the panel (position:absolute) still has something to anchor
          to now that .topic-filter itself is display:contents. */}
      <div className="topic-filter-anchor">
        <button
          type="button"
          className={`topic-filter-toggle ${selected.length ? "is-active" : ""}`}
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
        >
          <FaTags />
          {selected.length ? `${selected.length} topic${selected.length === 1 ? "" : "s"}` : "Topics"}
        </button>

        {isOpen && (
          <div className="topic-filter-panel">
            {available.map((topic) => (
              <label className="topic-filter-option" key={topic}>
                <input
                  type="checkbox"
                  checked={selected.includes(topic)}
                  onChange={() => toggleTopic(topic)}
                />
                {topic}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TopicFilter;
