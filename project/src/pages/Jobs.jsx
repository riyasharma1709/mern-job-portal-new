import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import JobCard from "../components/JobCard";
import "../styles/jobs.css";

export default function Jobs() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'pending' | 'interviewing' | 'offered' | 'rejected'

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem("employeeToken");
      if (!token) throw new Error("You must be logged in to view your tracked jobs.");

      const response = await fetch("http://localhost:5000/api/applications/employee", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch jobs from server");

      const data = await response.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      const token = localStorage.getItem("employeeToken");
      const response = await fetch(`http://localhost:5000/api/applications/employee/${appId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error("Failed to update status on server");
      }

      const { application } = await response.json();
      setApplications((prev) =>
        prev.map((app) =>
          app._id === appId ? { ...app, status: application.status } : app
        )
      );
    } catch (err) {
      console.error(err);
      alert("Error updating status: " + err.message);
    }
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const total = applications.length;
    const inReview = applications.filter((app) => {
      const st = (app.status || "").toLowerCase();
      return st === "pending" || st === "applied" || st === "reviewed";
    }).length;
    const interviewing = applications.filter((app) =>
      (app.status || "").toLowerCase().includes("interview")
    ).length;
    const offered = applications.filter((app) => {
      const st = (app.status || "").toLowerCase();
      return st.includes("offer") || st.includes("hired") || st.includes("accepted");
    }).length;
    const rejected = applications.filter((app) => {
      const st = (app.status || "").toLowerCase();
      return st.includes("reject") || st.includes("not-selected") || st.includes("not selected");
    }).length;

    return { total, inReview, interviewing, offered, rejected };
  }, [applications]);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const company = (app.employerId?.companyName || app.companyName || "").toLowerCase();
      const role = (app.jobId?.title || app.title || "").toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || company.includes(q) || role.includes(q);
      if (!matchesSearch) return false;

      const st = (app.status || "").toLowerCase();
      if (activeTab === "all") return true;
      if (activeTab === "pending") return st === "pending" || st === "applied" || st === "reviewed";
      if (activeTab === "interviewing") return st.includes("interview");
      if (activeTab === "offered") return st.includes("offer") || st.includes("hired") || st.includes("accepted");
      if (activeTab === "rejected") return st.includes("reject") || st.includes("not selected") || st.includes("not-selected");

      return true;
    });
  }, [applications, searchQuery, activeTab]);

  return (
    <>
      <Navbar />
      <div className="main">
        <Sidebar />
        <div className="content">
          {/* Header */}
          <div className="tracker-header">
            <div className="tracker-title-row">
              <h2>
                My Job Tracker
                <span className="tracker-badge">{applications.length} Tracked</span>
              </h2>
            </div>
            <p className="tracker-subtitle">
              Monitor your job application pipelines, update interview milestones, and organize your career search.
            </p>
          </div>

          {/* Metric Bar */}
          <div className="tracker-metrics-grid">
            <div className="tracker-metric-card">
              <div className="tracker-metric-icon total">💼</div>
              <div className="tracker-metric-info">
                <h4>{metrics.total}</h4>
                <p>Total Tracked</p>
              </div>
            </div>

            <div className="tracker-metric-card">
              <div className="tracker-metric-icon pending">⏳</div>
              <div className="tracker-metric-info">
                <h4>{metrics.inReview}</h4>
                <p>In Review</p>
              </div>
            </div>

            <div className="tracker-metric-card">
              <div className="tracker-metric-icon interviewing">🎙️</div>
              <div className="tracker-metric-info">
                <h4>{metrics.interviewing}</h4>
                <p>Interviewing</p>
              </div>
            </div>

            <div className="tracker-metric-card">
              <div className="tracker-metric-icon offered">🎉</div>
              <div className="tracker-metric-info">
                <h4>{metrics.offered}</h4>
                <p>Offers & Hired</p>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="tracker-filter-bar">
            <div className="tracker-search-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Filter by company or role title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "14px" }}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="tracker-tabs">
              <button
                type="button"
                className={`tracker-tab-btn ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                All ({metrics.total})
              </button>
              <button
                type="button"
                className={`tracker-tab-btn ${activeTab === "pending" ? "active" : ""}`}
                onClick={() => setActiveTab("pending")}
              >
                In Review ({metrics.inReview})
              </button>
              <button
                type="button"
                className={`tracker-tab-btn ${activeTab === "interviewing" ? "active" : ""}`}
                onClick={() => setActiveTab("interviewing")}
              >
                Interviewing ({metrics.interviewing})
              </button>
              <button
                type="button"
                className={`tracker-tab-btn ${activeTab === "offered" ? "active" : ""}`}
                onClick={() => setActiveTab("offered")}
              >
                Offers ({metrics.offered})
              </button>
              <button
                type="button"
                className={`tracker-tab-btn ${activeTab === "rejected" ? "active" : ""}`}
                onClick={() => setActiveTab("rejected")}
              >
                Closed ({metrics.rejected})
              </button>
            </div>
          </div>

          {/* Job Applications List */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: "16px" }}>
              Loading your tracked applications...
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--danger)" }}>
              Error loading tracker: {error}
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="tracker-empty-state">
              <div className="tracker-empty-icon">📋</div>
              <h3>
                {searchQuery || activeTab !== "all"
                  ? "No matching tracked jobs found"
                  : "You haven't tracked any jobs yet"}
              </h3>
              <p>
                {searchQuery || activeTab !== "all"
                  ? "Try adjusting your search keywords or switching to the 'All' tab."
                  : "Discover opportunities from verified employers and track your entire interview journey in one place."}
              </p>
              <Link to="/find-jobs" className="tracker-explore-btn">
                Browse Open Jobs →
              </Link>
            </div>
          ) : (
            <div className="job-list">
              {filteredApplications.map((app) => (
                <JobCard
                  key={app._id}
                  application={app}
                  onStatusChange={(newStatus) => handleStatusChange(app._id, newStatus)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
