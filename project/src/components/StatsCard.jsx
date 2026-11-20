import React from "react";
import "../styles/dashboard.css";

export default function StatsCard({ title, count, icon }) {
  // Determine icon & theme color based on title if not passed
  const titleLower = (title || "").toLowerCase();

  const getCardDetails = () => {
    if (titleLower.includes("applied")) {
      return {
        icon: icon || (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        ),
        type: "applied",
        hint: "Total submitted"
      };
    }
    if (titleLower.includes("interview")) {
      return {
        icon: icon || (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        ),
        type: "interviewing",
        hint: "Active discussions"
      };
    }
    if (titleLower.includes("offer")) {
      return {
        icon: icon || (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
        ),
        type: "offered",
        hint: "Successful offers"
      };
    }
    return {
      icon: icon || (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" x2="9" y1="9" y2="15" />
          <line x1="9" x2="15" y1="9" y2="15" />
        </svg>
      ),
      type: "rejected",
      hint: "Archived & closed"
    };
  };

  const details = getCardDetails();

  return (
    <div className={`stats-card card-${details.type}`}>
      <div className="stats-card-top">
        <span className="stats-card-icon">{details.icon}</span>
        <span className="stats-card-title">{title}</span>
      </div>
      <div className="stats-card-body">
        <h3 className="stats-card-number">{count}</h3>
        <p className="stats-card-hint">{details.hint}</p>
      </div>
    </div>
  );
}
