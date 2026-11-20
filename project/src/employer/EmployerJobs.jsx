import React, { useState, useEffect } from "react";
import EmployerSidebar from "./EmployerSidebar";
import "./styles/EmployerJobs.css";

export default function EmployerJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingJob, setEditingJob] = useState(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem("employerToken");
      if (!token) {
        throw new Error("Not logged in");
      }

      const response = await fetch("http://localhost:5000/api/jobs/employer", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      const data = await response.json();
      setJobs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      try {
        const token = localStorage.getItem("employerToken");
        const response = await fetch(`http://localhost:5000/api/jobs/${id}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (response.ok) {
          setJobs(jobs.filter((job) => job._id !== id));
        } else {
          alert("Failed to delete job");
        }
      } catch (error) {
        console.error("Error deleting job:", error);
        alert("Error deleting job");
      }
    }
  };

  const handleEditClick = (job) => {
    setEditingJob({ ...job });
  };

  const handleEditChange = (e) => {
    setEditingJob({
      ...editingJob,
      [e.target.name]: e.target.value
    });
  };

  const handleEditLiveLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
          if (res.ok) {
            const data = await res.json();
            setEditingJob(prev => ({
              ...prev,
              companyLocation: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
              latitude: lat,
              longitude: lng
            }));
          } else {
            setEditingJob(prev => ({
              ...prev,
              companyLocation: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
              latitude: lat,
              longitude: lng
            }));
          }
        } catch (e) {
          setEditingJob(prev => ({
            ...prev,
            companyLocation: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            latitude: lat,
            longitude: lng
          }));
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        alert("Could not get location. You can enter the office location manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleUpdate = async () => {
    const formData = new FormData();
    formData.append("companyName", editingJob.companyName || "");
    formData.append("companyLocation", editingJob.companyLocation || editingJob.location || "");
    if (editingJob.latitude) formData.append("latitude", editingJob.latitude);
    if (editingJob.longitude) formData.append("longitude", editingJob.longitude);
    formData.append("title", editingJob.title || "");
    formData.append("location", editingJob.location || editingJob.companyLocation || "");
    formData.append("salary", editingJob.salary || "");
    formData.append("skills", editingJob.skills || "");
    formData.append("education", editingJob.education || "");
    formData.append("description", editingJob.description || "");

    try {
      const token = localStorage.getItem("employerToken");
      const response = await fetch(`http://localhost:5000/api/jobs/${editingJob._id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      if (response.ok) {
        alert("Job updated successfully ✅");
        setEditingJob(null);
        fetchJobs(); // refresh list
      } else {
        const errorData = await response.json();
        alert("Failed to update job: " + (errorData.message || errorData.error || "Unknown"));
      }
    } catch (error) {
      console.error("Error updating job:", error);
      alert("Error updating job");
    }
  };

  const getMapQuery = (job) => {
    if (!job) return "";
    if (job.latitude && job.longitude) return `${job.latitude},${job.longitude}`;
    return job.companyLocation || job.location || "";
  };

  return (
    <div>
      <EmployerSidebar />

      <div className="emp-content">
        <h2>Manage Jobs</h2>

        <table>
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Title</th>
              <th>Company Location & Map</th>
              <th>Job Location</th>
              <th>Salary</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>Loading jobs...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", color: "red" }}>Error: {error}</td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>No Jobs Posted</td>
              </tr>
            ) : (
              jobs.map((job) => {
                const mapQ = getMapQuery(job);
                return (
                  <tr key={job._id}>
                    <td>{job.companyName || "N/A"}</td>
                    <td>{job.title}</td>
                    <td>
                      <div>
                        <span>📍 {job.companyLocation || job.location || "N/A"}</span>
                        {mapQ && (
                          <div>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQ)}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: '11px', color: '#2563eb', fontWeight: 'bold', textDecoration: 'none' }}
                            >
                              🗺️ Office Map ↗
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{job.location || job.companyLocation || "N/A"}</td>
                    <td>{job.salary}</td>
                    <td>{new Date(job.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="edit-btn"
                          onClick={() => handleEditClick(job)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(job._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {editingJob && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
              <h3>Edit Job</h3>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Company Name</label>
              <input
                name="companyName"
                value={editingJob.companyName || ""}
                onChange={handleEditChange}
                placeholder="Company Name"
              />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Company Office Location / Address</label>
                <button
                  type="button"
                  onClick={handleEditLiveLocation}
                  disabled={locating}
                  style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                  title="If currently at the company office"
                >
                  {locating ? "Pinpointing..." : "📍 If On-Site: Use Location"}
                </button>
              </div>
              <input
                name="companyLocation"
                value={editingJob.companyLocation || ""}
                onChange={(e) => {
                  setEditingJob({
                    ...editingJob,
                    companyLocation: e.target.value,
                    latitude: null,
                    longitude: null
                  });
                }}
                placeholder="Enter company office address, city, or tech park"
              />

              {getMapQuery(editingJob) && (
                <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                  <iframe
                    title="Edit Map Preview"
                    width="100%"
                    height="160"
                    style={{ border: 0, borderRadius: '8px' }}
                    loading="lazy"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(getMapQuery(editingJob))}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  />
                </div>
              )}

              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginTop: '8px' }}>Job Title</label>
              <input
                name="title"
                value={editingJob.title || ""}
                onChange={handleEditChange}
                placeholder="Job Title"
              />
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginTop: '8px' }}>Job Location</label>
              <input
                name="location"
                value={editingJob.location || ""}
                onChange={handleEditChange}
                placeholder="Job Location"
              />
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginTop: '8px' }}>Salary</label>
              <input
                name="salary"
                value={editingJob.salary || ""}
                onChange={handleEditChange}
                placeholder="Salary"
              />
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginTop: '8px' }}>Skills</label>
              <input
                name="skills"
                value={editingJob.skills || ""}
                onChange={handleEditChange}
                placeholder="Skills"
              />
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginTop: '8px' }}>Education</label>
              <input
                name="education"
                value={editingJob.education || ""}
                onChange={handleEditChange}
                placeholder="Education"
              />
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginTop: '8px' }}>Job Description</label>
              <textarea
                name="description"
                value={editingJob.description || ""}
                onChange={handleEditChange}
                placeholder="Job Description"
                rows="4"
              />
              
              <div className="modal-actions" style={{ marginTop: '15px' }}>
                <button className="cancel-btn" onClick={() => setEditingJob(null)}>
                  Cancel
                </button>
                <button className="save-btn" onClick={handleUpdate}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
