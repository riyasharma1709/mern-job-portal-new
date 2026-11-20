import React from "react";
import { useTheme } from "../context/ThemeContext";
import "../styles/themeToggle.css";

export default function ThemeToggle({ showLabel = false, floating = false, className = "" }) {
  const { toggleTheme, isDark } = useTheme();

  return (
    <div className={`theme-toggle-wrapper ${floating ? "floating" : ""} ${className}`}>
      {showLabel && (
        <span className="theme-toggle-label" onClick={toggleTheme}>
          {isDark ? "Dark Mode" : "Light Mode"}
        </span>
      )}
      <button
        type="button"
        className={`theme-toggle-btn ${isDark ? "dark" : "light"}`}
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
      >
        {/* Track icons */}
        <span className="track-icon sun" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <span className="track-icon moon" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </span>

        {/* Sliding Thumb */}
        <span className="theme-toggle-thumb">
          {isDark ? (
            <span className="thumb-icon moon-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </span>
          ) : (
            <span className="thumb-icon sun-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" fill="#f59e0b" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            </span>
          )}
        </span>
      </button>
    </div>
  );
}
