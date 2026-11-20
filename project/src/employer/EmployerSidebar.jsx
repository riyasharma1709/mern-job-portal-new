import { Link, useNavigate, useLocation } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import "./styles/employerSidebar.css";

export default function EmployerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("employerToken");
    localStorage.removeItem("employerInfo");
    navigate("/employer/login");
  };

  const navItems = [
    {
      to: "/employer/dashboard",
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
      to: "/employer/add-job",
      label: "Add Job",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      )
    },
    {
      to: "/employer/jobs",
      label: "My Jobs",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      )
    },
    {
      to: "/employer/applicants",
      label: "Applicants",
      badge: "Tracker",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      to: "/employer/profile",
      label: "Company Profile",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01" />
          <path d="M16 6h.01" />
          <path d="M12 6h.01" />
          <path d="M12 10h.01" />
          <path d="M12 14h.01" />
          <path d="M16 10h.01" />
          <path d="M16 14h.01" />
          <path d="M8 10h.01" />
          <path d="M8 14h.01" />
        </svg>
      )
    }
  ];

  return (
    <div className="emp-sidebar">
      <div>
        <div className="emp-sidebar-brand-wrapper">
          <h2 className="emp-logo">CareerQuest</h2>
          <span className="emp-sidebar-subtitle">EMPLOYER PORTAL</span>
        </div>

        <ul className="emp-sidebar-nav-list">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <li key={item.to} className={isActive ? "active" : ""}>
                <Link to={item.to}>
                  <span className="emp-sidebar-icon">{item.icon}</span>
                  <span className="emp-sidebar-label">{item.label}</span>
                  {item.badge && (
                    <span className="emp-sidebar-pill">{item.badge}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="emp-sidebar-footer">
        <div style={{ padding: '0 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <ThemeToggle showLabel />
        </div>
        <button 
          type="button"
          onClick={handleLogout} 
          className="emp-logout-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}
