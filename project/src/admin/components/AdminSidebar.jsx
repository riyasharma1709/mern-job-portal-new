import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "../../components/ThemeToggle";
import "../styles/adminSidebar.css";

export default function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isAdminAuth");
    navigate("/admin/login");
  };

  return (
    <div className="admin-sidebar">
      <h2>Admin Panel</h2>

      <Link to="/admin/dashboard">Dashboard</Link>
      <Link to="/admin/jobs">Manage Jobs</Link>
      <Link to="/admin/employer">Employers</Link>
      <Link to="/admin/users">Users</Link>

      <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ padding: '0 8px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <ThemeToggle showLabel />
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
