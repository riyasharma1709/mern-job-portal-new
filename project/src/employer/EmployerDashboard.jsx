import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EmployerSidebar from "./EmployerSidebar";
import "./styles/employerDashboard.css";

export default function EmployerDashboard() {
  const [employer, setEmployer] = useState(null);
  const [jobCount, setJobCount] = useState(0);
  const [applicantCount, setApplicantCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initDashboard = async () => {
      const info = localStorage.getItem("employerInfo");
      const token = localStorage.getItem("employerToken");
      if (info) {
        setEmployer(JSON.parse(info));
      }

      if (token) {
        try {
          const headers = { Authorization: `Bearer ${token}` };
          const [jobsRes, appsRes] = await Promise.all([
            fetch("http://localhost:5000/api/jobs/employer", { headers }),
            fetch("http://localhost:5000/api/applications/employer", { headers })
          ]);

          if (jobsRes.ok) {
            const jobsData = await jobsRes.json();
            setJobCount(jobsData.length);
          }
          if (appsRes.ok) {
            const appsData = await appsRes.json();
            setApplicantCount(appsData.length);
          }
        } catch (error) {
          console.error("Error fetching dashboard counts:", error);
        }
      }
      setLoading(false);
    };

    initDashboard();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background, #f8fafc)' }}>
      <EmployerSidebar />
      <div className="emp-content" style={{ flex: 1 }}>
        
        {/* Welcome Banner */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '2.1rem', color: 'var(--text-main, #0f172a)', fontWeight: '800', letterSpacing: '-0.5px' }}>
            Welcome back, {employer ? `${employer.firstName || ''} ${employer.lastName || ''}`.trim() : 'Employer'}!
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted, #64748b)', fontSize: '1.02rem' }}>
            Manage {employer && employer.companyName ? employer.companyName : 'your company'} job postings and applicants efficiently.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <h2 style={{ margin: 0, color: 'var(--text-main, #0f172a)', fontWeight: '700', fontSize: '1.35rem' }}>Overview</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link 
              to="/employer/add-job" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Post New Job
            </Link>
          </div>
        </div>
        
        {loading ? (
          <div style={{ color: 'var(--text-muted, #64748b)', fontSize: '1rem', padding: '20px 0' }}>Loading statistics...</div>
        ) : (
          <div className="emp-cards">
            
            {/* Total Jobs Card */}
            <div className="emp-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <p style={{ fontSize: '0.9rem', margin: 0, color: 'var(--text-muted, #64748b)', fontWeight: '600' }}>Active Jobs</p>
                <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
              </div>
              <h2 style={{ fontSize: '2.5rem', margin: '0 0 14px 0', color: '#10b981' }}>
                {jobCount}
              </h2>
              <Link 
                to="/employer/jobs" 
                style={{ 
                  color: 'var(--primary, #10b981)', 
                  textDecoration: 'none', 
                  fontSize: '12.5px', 
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Manage jobs →
              </Link>
            </div>
            
            {/* Total Applicants Card */}
            <div className="emp-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <p style={{ fontSize: '0.9rem', margin: 0, color: 'var(--text-muted, #64748b)', fontWeight: '600' }}>Total Applicants</p>
                <div style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
              </div>
              <h2 style={{ fontSize: '2.5rem', margin: '0 0 14px 0', color: '#3b82f6' }}>
                {applicantCount}
              </h2>
              <Link 
                to="/employer/applicants" 
                style={{ 
                  color: '#3b82f6', 
                  textDecoration: 'none', 
                  fontSize: '12.5px', 
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Open Applicant Tracker →
              </Link>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
