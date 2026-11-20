import React, { useState } from "react";
import "../styles/jobs.css";

export default function JobCard({
  application,
  company,
  role,
  status,
  onStatusChange
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract fields gracefully whether passed as full application object or standalone props
  const appData = application || {};
  const job = appData.jobId || {};
  const employer = appData.employerId || {};

  const displayCompany = employer.companyName || job.companyName || company || "Company";
  const displayRole = job.title || role || "Job Position";
  const currentStatus = appData.status || status || "Pending";
  const appliedDate = appData.createdAt
    ? new Date(appData.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : null;

  const location = job.companyLocation || job.location || "";
  const salary = job.salary || "";
  const jobType = job.jobType || "";
  const skills = Array.isArray(job.skills) ? job.skills : [];
  const description = job.description || "";
  const photo = job.photos && job.photos.length > 0 ? job.photos[0] : null;

  // Statuses supported
  const statusOptions = [
    "Pending",
    "Reviewed",
    "Interviewing",
    "Offer Received",
    "Accepted",
    "Hired",
    "Rejected",
    "Not Selected by Employer"
  ];

  // Helper to normalize status for CSS classes
  const normalizedStatus = (currentStatus || "pending").toLowerCase().replace(/\s+/g, "-");

  // Determine stage progress for the stepper
  // Step 1: Applied | Step 2: In Review | Step 3: Interviewing | Step 4: Offer / Final
  let stepIndex = 1;
  let isRejected = false;
  let isOffer = false;

  if (["reviewed"].includes(normalizedStatus)) {
    stepIndex = 2;
  } else if (["interviewing"].includes(normalizedStatus)) {
    stepIndex = 3;
  } else if (["offer-received", "accepted", "hired"].includes(normalizedStatus)) {
    stepIndex = 4;
    isOffer = true;
  } else if (["rejected", "not-selected-by-employer"].includes(normalizedStatus)) {
    stepIndex = 4;
    isRejected = true;
  }

  // Calculate percentage for progress line
  const progressPercent = ((stepIndex - 1) / 3) * 100;

  const handleSelectChange = (e) => {
    if (onStatusChange) {
      onStatusChange(e.target.value);
    }
  };

  return (
    <div className={`job-tracker-card status-${normalizedStatus}`}>
      {/* Card Header */}
      <div className="jt-card-header">
        <div className="jt-company-info">
          {photo ? (
            <img
              src={`http://localhost:5000/${photo}`}
              alt={displayCompany}
              className="jt-logo"
            />
          ) : (
            <div className="jt-logo">
              {displayCompany.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="jt-title-group">
            <h3>{displayRole}</h3>
            <div className="jt-company-row">
              <span className="jt-company-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
                  <path d="M9 22v-4h6v4"/>
                  <path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/>
                  <path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
                </svg>
                {displayCompany}
              </span>

              {appliedDate && (
                <span className="jt-applied-time">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                    <line x1="16" x2="16" y1="2" y2="6"/>
                    <line x1="8" x2="8" y1="2" y2="6"/>
                    <line x1="3" x2="21" y1="10" y2="10"/>
                  </svg>
                  Applied: {appliedDate}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge & Dropdown */}
        <div className="jt-status-box">
          <span className={`jt-status-badge ${normalizedStatus}`}>
            {normalizedStatus.includes("offer") || normalizedStatus.includes("hired") || normalizedStatus.includes("accepted") ? (
              <span>🎉 {currentStatus}</span>
            ) : normalizedStatus.includes("interview") ? (
              <span>🎙️ {currentStatus}</span>
            ) : normalizedStatus.includes("reject") || normalizedStatus.includes("not-selected") ? (
              <span>❌ {currentStatus}</span>
            ) : normalizedStatus.includes("review") ? (
              <span>👁️ {currentStatus}</span>
            ) : (
              <span>⏳ {currentStatus}</span>
            )}
          </span>

          <div className="jt-status-updater">
            <label htmlFor={`status-${appData._id || displayCompany}`}>Update:</label>
            <select
              id={`status-${appData._id || displayCompany}`}
              className="jt-select-dropdown"
              value={currentStatus}
              onChange={handleSelectChange}
            >
              {statusOptions.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Progress Milestone Stepper */}
      <div className="jt-stepper-wrapper">
        <div className="jt-stepper">
          <div className="jt-step-line">
            <div
              className="jt-step-line-fill"
              style={{
                width: `${progressPercent}%`,
                background: isRejected ? "#ef4444" : undefined
              }}
            />
          </div>

          {/* Step 1: Applied */}
          <div className={`jt-step ${stepIndex >= 1 ? "completed" : ""}`}>
            <div className="jt-step-circle">✓</div>
            <span className="jt-step-label">Applied</span>
          </div>

          {/* Step 2: Under Review */}
          <div className={`jt-step ${stepIndex > 2 ? "completed" : stepIndex === 2 ? "active" : ""}`}>
            <div className="jt-step-circle">{stepIndex > 2 ? "✓" : "2"}</div>
            <span className="jt-step-label">Reviewing</span>
          </div>

          {/* Step 3: Interviewing */}
          <div className={`jt-step ${stepIndex > 3 ? "completed" : stepIndex === 3 ? "active" : ""}`}>
            <div className="jt-step-circle">{stepIndex > 3 ? "✓" : "3"}</div>
            <span className="jt-step-label">Interview</span>
          </div>

          {/* Step 4: Decision */}
          <div className={`jt-step ${isRejected ? "rejected" : isOffer ? "completed" : stepIndex === 4 ? "active" : ""}`}>
            <div className="jt-step-circle">{isRejected ? "✕" : isOffer ? "★" : "4"}</div>
            <span className="jt-step-label">
              {isRejected ? "Declined" : isOffer ? "Offer" : "Decision"}
            </span>
          </div>
        </div>
      </div>

      {/* Tags / Meta row */}
      {(location || salary || jobType || skills.length > 0) && (
        <div className="jt-meta-row">
          {location && (
            <span className="jt-meta-tag location">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {location}
            </span>
          )}

          {salary && (
            <span className="jt-meta-tag salary">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" x2="12" y1="2" y2="22"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              {salary}
            </span>
          )}

          {jobType && (
            <span className="jt-meta-tag">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              {jobType}
            </span>
          )}

          {skills.slice(0, 4).map((sk, idx) => (
            <span key={idx} className="jt-skill-chip">
              {sk}
            </span>
          ))}
        </div>
      )}

      {/* Expandable Description */}
      {isExpanded && description && (
        <div className="jt-desc-box">
          <strong>Job Description:</strong>
          <p style={{ margin: "6px 0 0" }}>{description}</p>
        </div>
      )}

      {/* Card Footer Actions */}
      <div className="jt-card-footer">
        {description ? (
          <button
            type="button"
            className="jt-details-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "▲ Hide Description" : "▼ View Job Description"}
          </button>
        ) : (
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Application ID: {appData._id ? appData._id.slice(-6).toUpperCase() : "Active"}
          </span>
        )}

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {stepIndex < 3 && !isRejected && (
            <button
              type="button"
              className="jt-details-btn"
              style={{ color: "#8b5cf6" }}
              onClick={() => onStatusChange && onStatusChange("Interviewing")}
            >
              🎙️ Move to Interview
            </button>
          )}

          {stepIndex < 4 && !isRejected && (
            <button
              type="button"
              className="jt-details-btn"
              style={{ color: "#10b981" }}
              onClick={() => onStatusChange && onStatusChange("Offer Received")}
            >
              🏆 Mark as Offered
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
