import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import StatsCard from "../components/StatsCard";
import JobCard from "../components/JobCard";
import "../styles/dashboard.css";

export default function Dashboard() {
  const location = useLocation();
  const [employee, setEmployee] = useState(() => {
    try {
      const info = localStorage.getItem("employeeInfo");
      return info ? JSON.parse(info) : null;
    } catch (e) {
      return null;
    }
  });

  const [showWelcomeToast, setShowWelcomeToast] = useState(() => {
    return Boolean(location.state?.justLoggedIn);
  });

  const [recentApplications, setRecentApplications] = useState([]);
  const [stats, setStats] = useState({
    applied: 0,
    interviewing: 0,
    offered: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);

  // Auto-dismiss welcome toast after 4.5 seconds
  useEffect(() => {
    if (showWelcomeToast) {
      const timer = setTimeout(() => {
        setShowWelcomeToast(false);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [showWelcomeToast]);

  useEffect(() => {
    const info = localStorage.getItem("employeeInfo");
    if (info) {
      try {
        setEmployee(JSON.parse(info));
      } catch (e) {
        console.error("Error parsing employee info", e);
      }
    } else {
      const token = localStorage.getItem("employeeToken");
      if (token) {
        fetch("http://localhost:5000/api/employees/me", {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data) {
              setEmployee(data);
              localStorage.setItem("employeeInfo", JSON.stringify(data));
            }
          })
          .catch((err) => console.error("Could not fetch employee profile", err));
      }
    }
    fetchApplicationStats();
  }, []);

  const fetchApplicationStats = async () => {
    try {
      const token = localStorage.getItem("employeeToken");
      if (!token) return;

      const response = await fetch("http://localhost:5000/api/applications/employee", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const applications = await response.json();
        if (Array.isArray(applications)) {
          const applied = applications.length;
          const interviewing = applications.filter((app) => app.status === "Interviewing").length;
          const offered = applications.filter(
            (app) => app.status === "Offer Received" || app.status === "Accepted"
          ).length;
          const rejected = applications.filter(
            (app) => app.status === "Rejected" || app.status === "Not Selected by Employer"
          ).length;

          setStats({ applied, interviewing, offered, rejected });
          setRecentApplications(applications.slice(0, 3));
        }
      }
    } catch (err) {
      console.error("Failed to fetch applications for stats", err);
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

      if (response.ok) {
        const { application } = await response.json();
        setRecentApplications((prev) =>
          prev.map((app) =>
            app._id === appId ? { ...app, status: application.status } : app
          )
        );
        // Refresh counts
        fetchApplicationStats();
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="main">
        <Sidebar />
        <div className="content">
          {/* Floating Login Welcome Toast */}
          {showWelcomeToast && (
            <aside className="dashboard-login-toast" role="status" aria-live="polite">
              <div className="toast-icon-wrapper">
                <span className="toast-wave-emoji" role="img" aria-label="wave">👋</span>
              </div>
              <div className="toast-text-block">
                <span className="toast-bold-title">
                  Welcome back, {employee ? employee.name : "Candidate"}!
                </span>
                <span className="toast-sub-desc">
                  Signed in successfully • Ready to explore today's jobs
                </span>
              </div>
              <button 
                type="button" 
                className="toast-dismiss-btn"
                onClick={() => setShowWelcomeToast(false)}
                title="Dismiss"
                aria-label="Dismiss welcome notification"
              >
                ✕
              </button>
            </aside>
          )}

          {/* Dashboard Hero Header */}
          <section className="dashboard-hero" aria-label="Welcome banner">
            <div className="hero-content-area">
              <div className="hero-badge-chip">
                <span className="hero-badge-icon">⚡</span>
                <span className="hero-badge-title">CANDIDATE PORTAL</span>
                <span className="hero-badge-divider">/</span>
                <span className="hero-live-status">
                  <span className="hero-live-dot"></span>
                  <span>Active</span>
                </span>
              </div>
              <h1 className="hero-heading">
                <span className="hero-greeting-prefix">Welcome back,</span>{" "}
                <span className="hero-name-gradient">
                  {employee ? employee.name : "Candidate"}
                </span>
                <span className="hero-wave" role="img" aria-label="waving hand">
                  👋
                </span>
              </h1>
              <p className="hero-subtext">
                Your personal career hub. Track applications and discover new matching jobs.
              </p>
            </div>
            <div className="hero-actions">
              <Link to="/find-jobs" className="hero-btn primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                Find Jobs
              </Link>
              <Link to="/jobs" className="hero-btn secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
                Job Tracker
              </Link>
            </div>
          </section>

          {/* Quick Metrics */}
          <div className="dashboard-title-row">
            <h2 className="dashboard-title">
              <span>📊</span> Application Overview
            </h2>
          </div>

          {loading ? (
            <div style={{ color: "var(--text-muted)", marginBottom: "30px" }}>Loading your stats...</div>
          ) : (
            <div className="stats">
              <StatsCard title="Applied" count={stats.applied} />
              <StatsCard title="Interviewing" count={stats.interviewing} />
              <StatsCard title="Offered" count={stats.offered} />
              <StatsCard title="Not Selected" count={stats.rejected} />
            </div>
          )}

          {/* Recent In Job Tracker Section */}
          <div className="dashboard-recent-tracker">
            <div className="dashboard-title-row">
              <h2 className="dashboard-title">
                <span>🎯</span> Recent in Job Tracker
              </h2>
              {recentApplications.length > 0 && (
                <Link to="/jobs" className="dashboard-view-all">
                  View All in Tracker →
                </Link>
              )}
            </div>

            {loading ? (
              <div style={{ color: "var(--text-muted)" }}>Loading recent applications...</div>
            ) : recentApplications.length === 0 ? (
              <div style={{
                background: "var(--surface)",
                border: "1.5px dashed var(--border)",
                borderRadius: "16px",
                padding: "36px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>📝</div>
                <h3 style={{ margin: "0 0 6px 0", color: "var(--text-main)" }}>No applications yet</h3>
                <p style={{ margin: "0 0 16px 0", color: "var(--text-muted)", fontSize: "14px" }}>
                  Start applying to exciting roles to track your interview progress here.
                </p>
                <Link to="/find-jobs" className="hero-btn primary">
                  Browse Verified Jobs →
                </Link>
              </div>
            ) : (
              <div className="job-list">
                {recentApplications.map((app) => (
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
      </div>
    </>
  );
}
