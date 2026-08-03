import { useEffect, useState } from "react";
import "./ThemeToggle.css";

function getInitialTheme() {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function ThemeToggle({ floating = false }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`theme-toggle ${floating ? "theme-toggle--floating" : ""}`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle color theme"
    >
      <span className="theme-toggle-flag">--theme</span>
      <span className="theme-toggle-track">
        <span className={`theme-toggle-thumb ${isDark ? "is-dark" : ""}`} />
      </span>
      <span className="theme-toggle-value">{isDark ? "dark" : "light"}</span>
    </button>
  );
}

export default ThemeToggle;
