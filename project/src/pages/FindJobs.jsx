import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../styles/findjob.css";

export default function FindJobs() {
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filter States
  const [searchRole, setSearchRole] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Expanded descriptions and maps
  const [expandedMapJobId, setExpandedMapJobId] = useState(null);
  const [expandedDescIds, setExpandedDescIds] = useState({});

  // Company Details Modal
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [jobForApply, setJobForApply] = useState(null);

  // Video Preview Modal
  const [videoModalJob, setVideoModalJob] = useState(null);

  // In-App Toast
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchJobs();
    fetchSavedJobs();
    fetchAppliedJobs();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/jobs");
      if (!response.ok) {
        throw new Error("Failed to load jobs. Make sure backend server is running.");
      }
      const data = await response.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const token = localStorage.getItem("employeeToken");
      if (!token) return;

      const response = await fetch("http://localhost:5000/api/employees/saved-jobs/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSavedJobs(data.map(job => (typeof job === "object" ? job._id : job)));
      }
    } catch (err) {
      console.error("Failed to fetch saved jobs:", err);
    }
  };

  const fetchAppliedJobs = async () => {
    try {
      const token = localStorage.getItem("employeeToken");
      if (!token) return;

      const response = await fetch("http://localhost:5000/api/applications/employee", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const ids = data
          .map(app => (app.jobId?._id ? app.jobId._id : app.jobId))
          .filter(Boolean);
        setAppliedJobIds(ids);
      }
    } catch (err) {
      console.error("Failed to fetch applied jobs:", err);
    }
  };

  const handleSaveJob = async (jobId) => {
    try {
      const token = localStorage.getItem("employeeToken");
      if (!token) {
        showToast("Please login as an employee to save jobs.", "error");
        return;
      }

      const isSaved = savedJobs.includes(jobId);
      const response = await fetch(`http://localhost:5000/api/employees/save-job/${jobId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        if (isSaved) {
          setSavedJobs(savedJobs.filter(id => id !== jobId));
          showToast("Job removed from saved list", "info");
        } else {
          setSavedJobs([...savedJobs, jobId]);
          showToast("Job saved to your bookmarks ❤️", "success");
        }
      } else {
        showToast("Failed to update saved job", "error");
      }
    } catch (err) {
      console.error("Error saving job:", err);
      showToast("Network error while saving job", "error");
    }
  };

  const handleApply = async (job) => {
    try {
      const token = localStorage.getItem("employeeToken");
      if (!token) {
        showToast("Please login as an employee to apply.", "error");
        return;
      }

      if (appliedJobIds.includes(job._id)) {
        showToast("You have already applied for this job!", "info");
        return;
      }

      const response = await fetch("http://localhost:5000/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId: job._id,
          employerId: job.employerId
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAppliedJobIds([...appliedJobIds, job._id]);
        showToast(`🎉 Successfully applied to ${job.title} at ${job.companyName || "company"}!`, "success");
        setIsCompanyModalOpen(false);
      } else {
        showToast(data.message || "Failed to submit application", "error");
      }
    } catch (err) {
      console.error("Error applying to job:", err);
      showToast("Error connecting to server. Please try again.", "error");
    }
  };

  const handleSeeCompanyDetails = async (job) => {
    setJobForApply(job);
    setIsCompanyModalOpen(true);
    setModalLoading(true);

    try {
      const resp = await fetch(`http://localhost:5000/api/employer-profile/employer/${job.employerId}`);
      if (resp.ok) {
        const data = await resp.json();
        setSelectedCompany(data);
      } else {
        setSelectedCompany(null);
      }
    } catch (err) {
      console.error("Error fetching company details:", err);
      setSelectedCompany(null);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setIsCompanyModalOpen(false);
    setSelectedCompany(null);
    setJobForApply(null);
  };

  const toggleCardMap = (jobId) => {
    setExpandedMapJobId(prev => (prev === jobId ? null : jobId));
  };

  const toggleDescription = (jobId) => {
    setExpandedDescIds(prev => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  const getMapQuery = (job) => {
    if (!job) return "";
    if (job.latitude && job.longitude) return `${job.latitude},${job.longitude}`;
    return job.companyLocation || job.location || "";
  };

  const normalizeMediaUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const cleanPath = path.replace(/\\/g, "/");
    return `http://localhost:5000/${cleanPath.startsWith("/") ? cleanPath.slice(1) : cleanPath}`;
  };

  const getInitials = (companyName, title) => {
    if (companyName && companyName.trim()) {
      const parts = companyName.trim().split(" ");
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return companyName.substring(0, 2).toUpperCase();
    }
    if (title && title.trim()) return title.substring(0, 2).toUpperCase();
    return "CQ";
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return "Recently posted";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      if (diffInDays <= 0) return "Posted today";
      if (diffInDays === 1) return "Posted 1 day ago";
      if (diffInDays < 30) return `Posted ${diffInDays} days ago`;
      return `Posted on ${date.toLocaleDateString()}`;
    } catch {
      return "Recently posted";
    }
  };

  // Filter jobs based on search inputs and quick chips
  const filteredJobs = jobs.filter(job => {
    const roleTerm = searchRole.trim().toLowerCase();
    const matchRole =
      !roleTerm ||
      (job.title && job.title.toLowerCase().includes(roleTerm)) ||
      (job.skills && job.skills.toLowerCase().includes(roleTerm)) ||
      (job.companyName && job.companyName.toLowerCase().includes(roleTerm)) ||
      (job.description && job.description.toLowerCase().includes(roleTerm));

    const locationTerm = searchLocation.trim().toLowerCase();
    const matchLocation =
      !locationTerm ||
      (job.location && job.location.toLowerCase().includes(locationTerm)) ||
      (job.companyLocation && job.companyLocation.toLowerCase().includes(locationTerm));

    let matchCategory = true;
    if (filterCategory === "saved") {
      matchCategory = savedJobs.includes(job._id);
    } else if (filterCategory === "remote") {
      const loc = `${job.location || ""} ${job.companyLocation || ""}`.toLowerCase();
      matchCategory = loc.includes("remote") || loc.includes("wfh") || loc.includes("work from home");
    } else if (filterCategory === "high-salary") {
      const sal = (job.salary || "").toLowerCase();
      const num = parseInt(sal.replace(/[^0-9]/g, ""), 10);
      matchCategory =
        sal.includes("lpa") ||
        sal.includes("lakh") ||
        num >= 800000 ||
        (num >= 60000 && num <= 300000 && (sal.includes("month") || sal.includes("pm")));
    }

    return matchRole && matchLocation && matchCategory;
  });

  const resetFilters = () => {
    setSearchRole("");
    setSearchLocation("");
    setFilterCategory("all");
  };

  // Count helper for category chips
  const remoteCount = jobs.filter(j =>
    `${j.location || ""} ${j.companyLocation || ""}`.toLowerCase().match(/remote|wfh|work from home/)
  ).length;

  const renderJobCard = (job, isFeatured = false) => {
    const mapQ = getMapQuery(job);
    const isSaved = savedJobs.includes(job._id);
    const isApplied = appliedJobIds.includes(job._id);
    const isMapOpen = expandedMapJobId === job._id;
    const isDescExpanded = !!expandedDescIds[job._id];
    const hasLongDesc = job.description && job.description.length > 180;

    return (
      <div className={`job-card ${isFeatured ? "promoted" : ""}`} key={job._id}>
        {/* Featured Ribbon */}
        {isFeatured && (
          <div className="featured-badge">
            <span>⭐</span> Featured Opportunity
          </div>
        )}

        {/* Card Header */}
        <div className="job-card-header">
          {job.photos && job.photos.length > 0 ? (
            <img
              src={normalizeMediaUrl(job.photos[0])}
              alt={job.companyName || "Company"}
              className="job-media"
              onError={e => {
                e.target.style.display = "none";
                const fallback = e.target.nextSibling;
                if (fallback) fallback.style.display = "flex";
              }}
            />
          ) : null}

          <div
            className={`job-media fallback-media ${isFeatured ? "fallback-media-featured" : ""}`}
            style={{ display: job.photos && job.photos.length > 0 ? "none" : "flex" }}
          >
            {getInitials(job.companyName, job.title)}
          </div>

          <div className="job-header-info">
            <div className="job-title-row">
              <h3>{job.title}</h3>
              <div className="job-top-actions">
                {isApplied && (
                  <span className="applied-pill">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Applied
                  </span>
                )}
                <button
                  type="button"
                  className={`save-btn-round ${isSaved ? "saved" : ""}`}
                  onClick={() => handleSaveJob(job._id)}
                  title={isSaved ? "Remove from saved" : "Save this job"}
                >
                  {isSaved ? "♥" : "♡"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px", flexWrap: "wrap" }}>
              {job.companyName && (
                <span className="company-badge-name">
                  🏢 {job.companyName}
                </span>
              )}
              <span className="posted-time">🕒 {getTimeAgo(job.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className={`job-desc ${hasLongDesc && !isDescExpanded ? "clamped" : ""}`}>
          {job.description}
        </p>
        {hasLongDesc && (
          <button
            type="button"
            className="desc-toggle-btn"
            onClick={() => toggleDescription(job._id)}
          >
            {isDescExpanded ? "Show less ▲" : "Read more ▼"}
          </button>
        )}

        {/* Meta Info Pills */}
        <div className="job-meta">
          <span className="meta-item" title="Company Location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            {job.companyLocation || job.location || "Location Flexible"}
          </span>

          {job.location && job.companyLocation && job.location !== job.companyLocation && (
            <span className="meta-item work-location" title="Work / Job Location">
              📍 Work: {job.location}
            </span>
          )}

          {job.education && (
            <span className="meta-item" title="Required Education">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
              {job.education}
            </span>
          )}

          <span className="meta-item salary" title="Offered Salary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12" y2="18"></line>
              <line x1="12" y1="14" x2="12" y2="10"></line>
            </svg>
            {job.salary ? (job.salary.includes("₹") || job.salary.includes("Rs") ? job.salary : `₹${job.salary}`) : "Not Disclosed"}
          </span>
        </div>

        {/* Skills Tags */}
        {job.skills && (
          <div className="job-skills-wrapper">
            <div className="job-skills">
              {job.skills.split(",").map((skill, index) => {
                const trimmed = skill.trim();
                return trimmed ? (
                  <span key={index} className="skill-pill">
                    {trimmed}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Interactive Map Accordion */}
        {isMapOpen && mapQ && (
          <div className="inline-map-card">
            <div className="inline-map-header">
              <span>📍 Location: {job.companyLocation || job.location}</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQ)}`}
                target="_blank"
                rel="noreferrer"
                className="directions-link"
              >
                Open in Google Maps ↗
              </a>
            </div>
            <iframe
              title={`Map preview for ${job.title}`}
              loading="lazy"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQ)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
            />
          </div>
        )}

        {/* Card Bottom Actions */}
        <div className="job-bottom-row">
          <div className="card-left-actions">
            {mapQ && (
              <button
                type="button"
                className={`btn-map-toggle ${isMapOpen ? "active" : ""}`}
                onClick={() => toggleCardMap(job._id)}
              >
                🗺️ {isMapOpen ? "Hide Map" : "Location Map"}
              </button>
            )}

            {job.video && (
              <button
                type="button"
                className="btn-video-preview"
                onClick={() => setVideoModalJob(job)}
              >
                🎬 Watch Video
              </button>
            )}
          </div>

          <div className="card-right-actions">
            <button
              type="button"
              onClick={() => handleSeeCompanyDetails(job)}
              className="icon-button-details"
            >
              🏢 Company Details
            </button>

            {isApplied ? (
              <button
                type="button"
                className="icon-button-apply applied"
                disabled
              >
                ✓ Applied
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleApply(job)}
                className="icon-button-apply"
              >
                Apply Now →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />

      <div className="main">
        <Sidebar />

        <div className="content">
          {/* Header */}
          <div className="find-jobs-header">
            <div className="find-jobs-title-row">
              <h2>
                Find Your <span className="highlight-gradient">Dream Job</span>
              </h2>
            </div>
            <p className="find-jobs-subtitle">
              Explore verified opportunities from top employers, startups, and remote companies.
            </p>
          </div>

          {/* Search & Filter Card */}
          <div className="search-filter-card">
            <div className="search-inputs-wrapper">
              {/* Role / Skill Search */}
              <div className="search-input-group">
                <span className="search-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Job title, skills (e.g. React, Python), or company..."
                  value={searchRole}
                  onChange={e => setSearchRole(e.target.value)}
                />
                {searchRole && (
                  <button
                    type="button"
                    className="clear-input-btn"
                    onClick={() => setSearchRole("")}
                    title="Clear"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Location Search */}
              <div className="search-input-group">
                <span className="search-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="City, location, or 'Remote'..."
                  value={searchLocation}
                  onChange={e => setSearchLocation(e.target.value)}
                />
                {searchLocation && (
                  <button
                    type="button"
                    className="clear-input-btn"
                    onClick={() => setSearchLocation("")}
                    title="Clear"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Quick Filters Row */}
            <div className="quick-filters-row">
              <span className="quick-filter-label">Quick Filters:</span>

              <button
                type="button"
                className={`filter-chip ${filterCategory === "all" ? "active" : ""}`}
                onClick={() => setFilterCategory("all")}
              >
                All Jobs
                <span className="chip-count">{jobs.length}</span>
              </button>

              <button
                type="button"
                className={`filter-chip ${filterCategory === "remote" ? "active" : ""}`}
                onClick={() => setFilterCategory("remote")}
              >
                🏠 Remote
                {remoteCount > 0 && <span className="chip-count">{remoteCount}</span>}
              </button>

              <button
                type="button"
                className={`filter-chip ${filterCategory === "high-salary" ? "active" : ""}`}
                onClick={() => setFilterCategory("high-salary")}
              >
                💰 High Salary
              </button>

              <button
                type="button"
                className={`filter-chip ${filterCategory === "saved" ? "active" : ""}`}
                onClick={() => setFilterCategory("saved")}
              >
                ❤️ Saved Only
                {savedJobs.length > 0 && <span className="chip-count">{savedJobs.length}</span>}
              </button>

              {(searchRole || searchLocation || filterCategory !== "all") && (
                <button
                  type="button"
                  className="reset-filters-btn"
                  onClick={resetFilters}
                >
                  ✕ Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Results Status Bar */}
          {!loading && !error && (
            <div className="results-status-bar">
              <span className="results-count">
                Showing <strong>{filteredJobs.length}</strong> {filteredJobs.length === 1 ? "opportunity" : "opportunities"}
                {(searchRole || searchLocation || filterCategory !== "all") && " matching your criteria"}
              </span>
            </div>
          )}

          {/* Main Job Feed */}
          {loading ? (
            <div className="job-list">
              {[1, 2, 3].map(n => (
                <div className="skeleton-card" key={n}>
                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <div className="skeleton-shimmer" style={{ width: "58px", height: "58px", borderRadius: "14px" }}></div>
                    <div style={{ flex: 1 }}>
                      <div className="skeleton-shimmer" style={{ width: "40%", height: "20px", marginBottom: "8px" }}></div>
                      <div className="skeleton-shimmer" style={{ width: "25%", height: "14px" }}></div>
                    </div>
                  </div>
                  <div className="skeleton-shimmer" style={{ width: "100%", height: "40px" }}></div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <div className="skeleton-shimmer" style={{ width: "100px", height: "28px" }}></div>
                    <div className="skeleton-shimmer" style={{ width: "120px", height: "28px" }}></div>
                    <div className="skeleton-shimmer" style={{ width: "90px", height: "28px" }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="loading-state" style={{ color: "#ef4444", borderColor: "#fca5a5" }}>
              <h3>Unable to load jobs</h3>
              <p>{error}</p>
              <button
                type="button"
                className="empty-state-btn"
                onClick={fetchJobs}
              >
                Retry Loading
              </button>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>🔍</div>
              <h3>No jobs found matching your criteria</h3>
              <p>Try searching with different keywords, relaxing your location, or clearing filters.</p>
              <button
                type="button"
                className="empty-state-btn"
                onClick={resetFilters}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="job-list">
              {/* If no search term is entered and viewing "all", we highlight the first job as featured */}
              {filterCategory === "all" && !searchRole && !searchLocation ? (
                <>
                  <div className="section-heading">⭐ Featured Opening</div>
                  {renderJobCard(filteredJobs[0], true)}

                  {filteredJobs.length > 1 && (
                    <>
                      <div className="section-heading" style={{ marginTop: "24px" }}>
                        All Available Openings ({filteredJobs.length - 1})
                      </div>
                      {filteredJobs.slice(1).map(job => renderJobCard(job, false))}
                    </>
                  )}
                </>
              ) : (
                filteredJobs.map((job, idx) => renderJobCard(job, idx === 0 && filterCategory === "all"))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Video Modal */}
      {videoModalJob && (
        <div className="company-modal-overlay" onClick={() => setVideoModalJob(null)}>
          <div className="company-modal-content video-modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setVideoModalJob(null)}>
              &times;
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <span style={{ fontSize: "24px" }}>🎬</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                  {videoModalJob.title}
                </h3>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  {videoModalJob.companyName} Introduction Video
                </span>
              </div>
            </div>

            <video
              src={normalizeMediaUrl(videoModalJob.video)}
              className="video-modal-player"
              controls
              autoPlay
            />
          </div>
        </div>
      )}

      {/* Company Details Modal */}
      {isCompanyModalOpen && (
        <div className="company-modal-overlay" onClick={closeModal}>
          <div className="company-modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={closeModal}>
              &times;
            </button>

            {modalLoading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <p>Loading company information...</p>
              </div>
            ) : selectedCompany ? (
              <div className="company-info-wrapper">
                {selectedCompany.logo && (
                  <img
                    src={normalizeMediaUrl(selectedCompany.logo)}
                    alt="Company Logo"
                    className="company-modal-logo"
                  />
                )}
                <h2>{selectedCompany.companyName}</h2>

                <div className="company-meta">
                  {selectedCompany.industry && <span>🏢 {selectedCompany.industry}</span>}
                  {(selectedCompany.location || jobForApply?.companyLocation) && (
                    <span>📍 {selectedCompany.location || jobForApply?.companyLocation}</span>
                  )}
                  {selectedCompany.website && (
                    <span>
                      🌐{" "}
                      <a href={selectedCompany.website} target="_blank" rel="noreferrer">
                        {selectedCompany.website}
                      </a>
                    </span>
                  )}
                </div>

                {/* Interactive Map in Modal */}
                {getMapQuery(jobForApply) && (
                  <div className="inline-map-card" style={{ marginTop: "16px" }}>
                    <div className="inline-map-header">
                      <span>🗺️ Company Headquarters</span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getMapQuery(jobForApply))}`}
                        target="_blank"
                        rel="noreferrer"
                        className="directions-link"
                      >
                        Open in Google Maps ↗
                      </a>
                    </div>
                    <iframe
                      title="Company Map"
                      loading="lazy"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(getMapQuery(jobForApply))}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    />
                  </div>
                )}

                <div className="company-description" style={{ marginTop: "18px" }}>
                  <h3>About Us</h3>
                  <p>{selectedCompany.description || "No company description provided yet."}</p>
                </div>

                {selectedCompany.photos && selectedCompany.photos.length > 0 && (
                  <div className="company-photos">
                    <h3>Office Gallery</h3>
                    <div className="photo-grid">
                      {selectedCompany.photos.map((photo, i) => (
                        <img
                          key={i}
                          src={normalizeMediaUrl(photo)}
                          alt={`Office workspace ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {selectedCompany.video && (
                  <div className="company-video-wrapper">
                    <h3>Company Culture Video</h3>
                    <video src={normalizeMediaUrl(selectedCompany.video)} controls />
                  </div>
                )}

                <div className="modal-actions">
                  {appliedJobIds.includes(jobForApply?._id) ? (
                    <button
                      type="button"
                      className="modal-apply-btn"
                      style={{ background: "#e2e8f0", color: "#64748b", cursor: "not-allowed" }}
                      disabled
                    >
                      ✓ Already Applied
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="modal-apply-btn"
                      onClick={() => handleApply(jobForApply)}
                    >
                      Apply Now for {jobForApply?.title} →
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="company-no-data">
                <h2>{jobForApply?.companyName || "Company Details"}</h2>
                {jobForApply?.companyLocation && (
                  <p style={{ color: "#2563eb", fontWeight: "bold" }}>
                    📍 Location: {jobForApply.companyLocation}
                  </p>
                )}

                {getMapQuery(jobForApply) && (
                  <div style={{ marginTop: "15px", marginBottom: "15px" }}>
                    <iframe
                      title="Job Location Map"
                      width="100%"
                      height="200"
                      style={{ border: 0, borderRadius: "10px" }}
                      loading="lazy"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(getMapQuery(jobForApply))}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    />
                  </div>
                )}

                <p>This employer has not added extended gallery photos or descriptions yet.</p>
                <div className="modal-actions" style={{ marginTop: "20px" }}>
                  {appliedJobIds.includes(jobForApply?._id) ? (
                    <button
                      type="button"
                      className="modal-apply-btn"
                      style={{ background: "#e2e8f0", color: "#64748b", cursor: "not-allowed" }}
                      disabled
                    >
                      ✓ Already Applied
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="modal-apply-btn"
                      onClick={() => handleApply(jobForApply)}
                    >
                      Apply Now for {jobForApply?.title} →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating In-App Toast */}
      {toast && (
        <div className={`findjobs-toast ${toast.type}`}>
          {toast.type === "success" && "✓"}
          {toast.type === "error" && "⚠️"}
          {toast.type === "info" && "ℹ️"}
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );
}
