import AdminSidebar from "./components/AdminSidebar";

import "./styles/adminForm.css";

export default function AdminAddJob() {
  return (
    <div className="admin-main">
      <AdminSidebar />

      <div className="admin-content">
        <h2>Add Job</h2>

        <div className="admin-form">
          <input placeholder="Company Name" />
          <input placeholder="Company Location" />
          <input placeholder="Role" />
          <input placeholder="Job Location" />
          <textarea placeholder="Description"></textarea>

          <button>Add Job</button>
        </div>
      </div>
    </div>
  );
}
