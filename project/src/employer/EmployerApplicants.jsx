import { useState, useEffect } from "react";
import EmployerSidebar from "./EmployerSidebar";
import "./styles/employerApplicants.css";

export default function EmployerApplicants() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState("all");

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    try {
      const token = localStorage.getItem("employerToken");
      if (!token) {
        throw new Error("You must be logged in to view applicants.");
      }

      const response = await fetch("http://localhost:5000/api/applications/employer", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch applicants");
      }
      
      const data = await response.json();
      setApplicants(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScreenResume = (app) => {
    setSelectedApp(app);
  };

  const closeProfileModal = () => {
    setSelectedApp(null);
  };

  const handleStatusUpdate = async (appId, newStatus) => {
    try {
      const token = localStorage.getItem("employerToken");
      if (!token) return;
      
      const response = await fetch(`http://localhost:5000/api/applications/employee/${appId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        setApplicants(applicants.map(app => 
          app._id === appId ? { ...app, status: newStatus } : app
        ));
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating status");
    }
  };

  // Derive unique jobs from applicants to build the filter dropdown
  const uniqueJobs = [];
  applicants.forEach(app => {
    if (app.jobId && !uniqueJobs.find(j => j._id === app.jobId._id)) {
      uniqueJobs.push(app.jobId);
    }
  });

  const filteredApplicants = selectedJobId === "all" 
      ? applicants 
      : applicants.filter(app => app.jobId && app.jobId._id === selectedJobId);

  const getStatusClass = (status = "") => {
    return `status-${status.toLowerCase().replace(/\s+/g, '-')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="emp-page-layout">
      <EmployerSidebar />

      <div className="emp-content applicants-container">
        {/* Header Bar */}
        <div className="applicants-header">
          <div>
            <div className="applicants-title-row">
              <h2>Applicant Tracker</h2>
              <span className="applicant-count-pill">{filteredApplicants.length} Candidates</span>
            </div>
            <p className="applicants-subtitle">Review, update status, and screen incoming applications</p>
          </div>
          
          {uniqueJobs.length > 0 && (
            <div className="job-filter-wrapper">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="filter-icon">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <select 
                className="job-filter"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
              >
                <option value="all">All Jobs ({applicants.length})</option>
                {uniqueJobs.map(job => (
                  <option key={job._id} value={job._id}>{job.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Content State */}
        {loading ? (
          <div className="applicants-loading-state">
            <div className="emp-spinner"></div>
            <p>Loading candidate applications...</p>
          </div>
        ) : error ? (
          <div className="applicants-error-state">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        ) : filteredApplicants.length === 0 ? (
          <div className="applicants-empty-state">
            <div className="empty-icon-circle">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <h3>No Applicants Found</h3>
            <p>Candidates applying to your posted roles will appear here instantly.</p>
          </div>
        ) : (
          <div className="applicant-grid">
            {filteredApplicants.map((app, index) => {
              const name = app.employeeProfile?.name || app.employeeId?.name || "Applicant";
              const initial = name.charAt(0).toUpperCase();
              const email = app.employeeProfile?.email || app.employeeId?.email || "No email";
              const jobTitle = app.jobId?.title || "Role Not Specified";
              const skills = app.employeeProfile?.skills || [];
              
              return (
                <div 
                  key={app._id} 
                  className="applicant-card"
                  style={{ animationDelay: `${Math.min(index * 0.05, 0.4)}s` }}
                >
                  {/* Card Top: Avatar + Candidate Info */}
                  <div className="applicant-card-header">
                    <div className="applicant-avatar">
                      {app.employeeProfile?.profileImage ? (
                        <img src={`http://localhost:5000/${app.employeeProfile.profileImage}`} alt={name} />
                      ) : (
                        <span>{initial}</span>
                      )}
                    </div>
                    <div className="applicant-info">
                      <h4 className="applicant-name" title={name}>{name}</h4>
                      <p className="applicant-email" title={email}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        <span>{email}</span>
                      </p>
                    </div>
                  </div>

                  {/* Card Body: Role & Date */}
                  <div className="applicant-card-body">
                    <div className="applicant-role-badge" title={jobTitle}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="14" x="2" y="7" rx="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                      <span className="applicant-role-text">{jobTitle}</span>
                    </div>

                    <div className="applicant-meta-row">
                      <span className="applicant-meta-date">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>Applied {formatDate(app.createdAt)}</span>
                      </span>

                      {skills.length > 0 && (
                        <span className="applicant-skill-pill">
                          {skills[0]}{skills.length > 1 ? ` +${skills.length - 1}` : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Status Select + Screen Button */}
                  <div className="applicant-card-footer">
                    <div className="applicant-status-select-wrap">
                      <select 
                        className={`status-select-badge ${getStatusClass(app.status)}`}
                        value={app.status}
                        onChange={(e) => handleStatusUpdate(app._id, e.target.value)}
                        title="Update applicant stage"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Reviewed">Reviewed</option>
                        <option value="Interviewing">Interviewing</option>
                        <option value="Offer Received">Offer Received</option>
                        <option value="Hired">Hired</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    <button 
                      type="button"
                      className="screen-btn"
                      onClick={() => handleScreenResume(app)}
                      title="Screen & Review Candidate"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Screen Review
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal for viewing Resume / Profile */}
        {selectedApp && (
          <div className="modal-overlay" onClick={closeProfileModal}>
            <div className="resume-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={closeProfileModal} aria-label="Close modal">×</button>
              
              <div className="profile-header">
                <div className="applicant-avatar modal-avatar">
                  {selectedApp.employeeProfile?.profileImage ? (
                    <img src={`http://localhost:5000/${selectedApp.employeeProfile.profileImage}`} alt="Profile" />
                  ) : (
                    <span>{(selectedApp.employeeProfile?.name || selectedApp.employeeId?.name || "U").charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h3>{selectedApp.employeeProfile?.name || selectedApp.employeeId?.name || "Candidate Profile"}</h3>
                  <span className={`status-select-badge ${getStatusClass(selectedApp.status)} modal-status`}>
                    Stage: {selectedApp.status}
                  </span>
                </div>
              </div>

              <div className="profile-details">
                <p><b>Email:</b> <span>{selectedApp.employeeProfile?.email || selectedApp.employeeId?.email}</span></p>
                <p><b>Phone:</b> <span>{selectedApp.employeeProfile?.phone || selectedApp.employeeId?.phone || "Not provided"}</span></p>
                <p><b>Target Job:</b> <span>{selectedApp.jobId?.title || "N/A"}</span></p>
                <p><b>Applied On:</b> <span>{formatDate(selectedApp.createdAt)}</span></p>
                
                {selectedApp.employeeProfile ? (
                  <>
                    {selectedApp.employeeProfile.location && (
                      <p><b>Location:</b> <span>{selectedApp.employeeProfile.location}</span></p>
                    )}
                    {selectedApp.employeeProfile.qualification && (
                      <p><b>Education:</b> <span>{selectedApp.employeeProfile.qualification}</span></p>
                    )}
                    {selectedApp.employeeProfile.skills && selectedApp.employeeProfile.skills.length > 0 && (
                      <div className="skills-section">
                        <b>Skills:</b>
                        <div className="skills-tags">
                          {selectedApp.employeeProfile.skills.map((skill, i) => (
                            <span key={i} className="skill-tag">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="profile-incomplete-notice">
                    <p>This candidate has applied with their basic account information.</p>
                  </div>
                )}

                {selectedApp.employeeProfile?.resume && (
                  <a 
                    href={`http://localhost:5000/${selectedApp.employeeProfile.resume}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="resume-btn"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="12" y2="18" />
                      <line x1="15" y1="15" x2="12" y2="18" />
                    </svg>
                    Download Resume PDF
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
