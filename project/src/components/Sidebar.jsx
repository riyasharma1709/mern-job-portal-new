import { Link, useLocation } from "react-router-dom";
import "../styles/sidebar.css";

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      )
    },
    {
      to: "/find-jobs",
      label: "Find Jobs",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      )
    },
    {
      to: "/jobs",
      label: "My Jobs",
      badge: "Tracker",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      )
    },
    {
      to: "/applied-jobs",
      label: "Applied Jobs",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </svg>
      )
    },
    {
      to: "/saved-jobs",
      label: "Saved Jobs",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        </svg>
      )
    },
    {
      to: "/suggested-jobs",
      label: "Suggested Jobs",
      badge: "AI",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
        </svg>
      )
    },
    {
      to: "/job-assistant",
      label: "Job Assistant",
      badge: "AI Chat",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="12" x="3" y="7" rx="2" />
          <path d="M9 11v2" />
          <path d="M15 11v2" />
          <path d="M12 2v5" />
          <path d="M7 19v3" />
          <path d="M17 19v3" />
        </svg>
      )
    },
    {
      to: "/profile",
      label: "Profile",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    }
  ];

  return (
    <div className="sidebar">
      <div>
        <div className="sidebar-brand-wrapper">
          <h3 className="logo">CareerQuest</h3>
          <span className="sidebar-subtitle">CANDIDATE PORTAL</span>
        </div>

        <ul className="sidebar-nav-list">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <li key={item.to} className={isActive ? "active" : ""}>
                <Link to={item.to}>
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.label}</span>
                  {item.badge && (
                    <span className={`sidebar-pill ${item.badge === "AI" ? "ai-pill" : ""}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="sidebar-footer-hint">
        <div className="sidebar-hint-content">
          <span className="hint-icon">🎯</span>
          <div className="hint-text">
            <strong>Track Applications</strong>
            <p>Keep your statuses updated</p>
          </div>
        </div>
      </div>
    </div>
  );
}
