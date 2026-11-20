import React, { useState, useEffect } from "react";
import EmployerSidebar from "./EmployerSidebar";
import "./styles/EmployerAddJob.css";

export default function EmployerAddJob() {

  const [jobData, setJobData] = useState({
    companyName: "",
    companyLocation: "",
    latitude: null,
    longitude: null,
    title: "",
    location: "",
    salary: "",
    description: "",
    photos: [],
    photoFiles: [],
    video: "",
    videoFile: null,
    skills: "",
    education: ""
  });

  const [errors, setErrors] = useState({});
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");

  useEffect(() => {
    const prefillCompanyData = async () => {
      try {
        const info = localStorage.getItem("employerInfo");
        const token = localStorage.getItem("employerToken");
        let parsedEmployer = null;
        if (info) {
          parsedEmployer = JSON.parse(info);
        }

        let prefilledName = parsedEmployer?.companyName || "";
        let prefilledLocation = "";

        if (token && parsedEmployer?._id) {
          try {
            const res = await fetch(`http://localhost:5000/api/employer-profile/employer/${parsedEmployer._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const profileData = await res.json();
              if (profileData) {
                if (profileData.companyName) prefilledName = profileData.companyName;
                if (profileData.location) prefilledLocation = profileData.location;
              }
            }
          } catch (e) {
            console.log("Could not fetch employer profile for prefill:", e);
          }
        }

        setJobData(prev => ({
          ...prev,
          companyName: prev.companyName || prefilledName,
          companyLocation: prev.companyLocation || prefilledLocation
        }));
      } catch (err) {
        console.error("Prefill error:", err);
      }
    };

    prefillCompanyData();
  }, []);

  const handleChange = (e) => {
    setJobData({
      ...jobData,
      [e.target.name]: e.target.value
    });
  };

  // Optional: only if the employer happens to be on-site at the company office
  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser. Please type the company office location manually.");
      return;
    }

    setLocating(true);
    setLocationStatus("Detecting on-site GPS location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
          );

          if (response.ok) {
            const data = await response.json();
            const fullAddress = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            setJobData(prev => ({
              ...prev,
              companyLocation: fullAddress,
              latitude: lat,
              longitude: lng
            }));
            setLocationStatus("📍 Office location captured from on-site GPS!");
          } else {
            setJobData(prev => ({
              ...prev,
              companyLocation: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
              latitude: lat,
              longitude: lng
            }));
            setLocationStatus("📍 GPS coordinates captured!");
          }
        } catch (error) {
          setJobData(prev => ({
            ...prev,
            companyLocation: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            latitude: lat,
            longitude: lng
          }));
          setLocationStatus("📍 GPS coordinates captured!");
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocating(false);
        setLocationStatus("");
        if (error.code === error.PERMISSION_DENIED) {
          alert("Location permission was denied. You can simply type the company office address.");
        } else {
          alert("Could not detect location. You can type the company office address manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const previewUrls = files.map((file) => URL.createObjectURL(file));

    setJobData({
      ...jobData,
      photoFiles: files,
      photos: previewUrls
    });
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Video must be less than 5MB");
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setJobData({
      ...jobData,
      videoFile: file,
      video: previewUrl
    });
  };

  const validate = () => {
    let newErrors = {};

    if (!jobData.companyName?.trim()) newErrors.companyName = "Company name is required";
    if (!jobData.companyLocation?.trim()) newErrors.companyLocation = "Company office location is required";
    if (!jobData.title?.trim()) newErrors.title = "Job title is required";
    if (!jobData.location?.trim() && !jobData.companyLocation?.trim()) newErrors.location = "Job location is required";
    if (!jobData.salary?.trim()) newErrors.salary = "Salary is required";
    if (!jobData.skills?.trim()) newErrors.skills = "Skills are required";
    if (!jobData.education?.trim()) newErrors.education = "Education requirement is required";
    if (!jobData.description?.trim()) newErrors.description = "Job description is required";
    if (jobData.photos.length === 0) newErrors.photos = "Upload at least one company photo";
    if (!jobData.video) newErrors.video = "Upload company video";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleAddJob = async () => {
    if (!validate()) return;

    const formData = new FormData();
    formData.append("companyName", jobData.companyName);
    formData.append("companyLocation", jobData.companyLocation);
    if (jobData.latitude) formData.append("latitude", jobData.latitude);
    if (jobData.longitude) formData.append("longitude", jobData.longitude);
    formData.append("title", jobData.title);
    formData.append("location", jobData.location || jobData.companyLocation);
    formData.append("salary", jobData.salary);
    formData.append("skills", jobData.skills);
    formData.append("education", jobData.education);
    formData.append("description", jobData.description);

    if (jobData.photoFiles && jobData.photoFiles.length > 0) {
      jobData.photoFiles.forEach(file => {
        formData.append("photos", file);
      });
    }

    if (jobData.videoFile) {
      formData.append("video", jobData.videoFile);
    }

    try {
      const token = localStorage.getItem("employerToken");
      if (!token) {
        alert("You must be logged in to post a job!");
        return;
      }

      const response = await fetch("http://localhost:5000/api/jobs", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      if (response.ok) {
        alert("Job Added Successfully with Company Office Location & Map ✅");
        setJobData(prev => ({
          companyName: prev.companyName,
          companyLocation: prev.companyLocation,
          latitude: prev.latitude,
          longitude: prev.longitude,
          title: "",
          location: "",
          salary: "",
          description: "",
          photos: [],
          photoFiles: [],
          video: "",
          videoFile: null,
          skills: "",
          education: ""
        }));
        setLocationStatus("");
        setErrors({});
      } else {
        const errorData = await response.json();
        alert("Error adding job: " + (errorData.message || errorData.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error submitting job:", error);
      alert("Failed to submit job. Please check your backend connection.");
    }
  };

  // Determine query string for live map
  const mapQuery = (jobData.latitude && jobData.longitude)
    ? `${jobData.latitude},${jobData.longitude}`
    : jobData.companyLocation?.trim();

  return (
    <div>
      <EmployerSidebar />
      <div className="emp-content add-job-content">
        <div className="add-job-header">
          <h2>Post a New Job</h2>
          <p>Fill out the company and job details below with company office map preview.</p>
        </div>

        <div className="add-job-wrapper">

          <div className="form-group">
            <label>Company Name *</label>
            <input
              name="companyName"
              placeholder="e.g. Acme Technologies"
              value={jobData.companyName}
              onChange={handleChange}
            />
            {errors.companyName && <p className="error">{errors.companyName}</p>}
          </div>

          <div className="form-group">
            <label>Job Title *</label>
            <input
              name="title"
              placeholder="e.g. Full Stack Developer"
              value={jobData.title}
              onChange={handleChange}
            />
            {errors.title && <p className="error">{errors.title}</p>}
          </div>

          {/* Company Office Location with Live Interactive Map */}
          <div className="form-group full-width">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <label style={{ margin: 0 }}>Company Office Location / Address *</label>
              <button
                type="button"
                onClick={handleGetLiveLocation}
                className="live-location-btn"
                disabled={locating}
                title="Optional: If you are physically at the company office, auto-detect address"
              >
                {locating ? "⏳ Pinpointing..." : "📍 If On-Site: Use Current Location"}
              </button>
            </div>
            
            <input
              name="companyLocation"
              placeholder="Enter company office address, city, or tech park (e.g. Bandra Kurla Complex, Mumbai or DLF Cyber City, Gurugram)"
              value={jobData.companyLocation}
              onChange={(e) => {
                setJobData({
                  ...jobData,
                  companyLocation: e.target.value,
                  latitude: null, // Reset coordinates if manually typed
                  longitude: null
                });
                setLocationStatus("");
              }}
            />
            <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '12px' }}>
              Type any company office address or city. The map below automatically pins that company location in real time.
            </p>
            {locationStatus && <p style={{ margin: '2px 0 0 0', color: '#10b981', fontSize: '13px', fontWeight: '600' }}>{locationStatus}</p>}
            {errors.companyLocation && <p className="error">{errors.companyLocation}</p>}

            {/* Live Interactive Map Preview for Company Office */}
            {mapQuery && (
              <div className="live-map-card">
                <div className="live-map-header">
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🏢 Company Office Map: <i>{jobData.companyLocation}</i>
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}
                  >
                    View on Google Maps ↗
                  </a>
                </div>
                <iframe
                  title="Company Location Map"
                  width="100%"
                  height="230"
                  style={{ border: 0, borderRadius: '12px', marginTop: '8px' }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Job / Work Location</label>
            <input
              name="location"
              placeholder="e.g. Remote, On-site, Hybrid, or City"
              value={jobData.location}
              onChange={handleChange}
            />
            {errors.location && <p className="error">{errors.location}</p>}
          </div>

          <div className="form-group">
            <label>Salary *</label>
            <input
              name="salary"
              placeholder="e.g. ₹50,000 / month or ₹8-10 LPA"
              value={jobData.salary}
              onChange={handleChange}
            />
            {errors.salary && <p className="error">{errors.salary}</p>}
          </div>

          <div className="form-group">
            <label>Skills *</label>
            <input
              name="skills"
              placeholder="e.g. React, Node.js, MongoDB"
              value={jobData.skills}
              onChange={handleChange}
            />
            {errors.skills && <p className="error">{errors.skills}</p>}
          </div>

          <div className="form-group">
            <label>Education Requirements *</label>
            <input
              name="education"
              placeholder="e.g. B.Tech, BCA, MCA, or Any Graduate"
              value={jobData.education}
              onChange={handleChange}
            />
            {errors.education && <p className="error">{errors.education}</p>}
          </div>

          <div className="form-group full-width">
            <label>Job Description *</label>
            <textarea
              name="description"
              placeholder="Describe the job role, day-to-day responsibilities, and requirements..."
              value={jobData.description}
              onChange={handleChange}
            />
            {errors.description && <p className="error">{errors.description}</p>}
          </div>

          <div className="form-group full-width">
            <label>Upload Company Photos *</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
            />
            {errors.photos && <p className="error">{errors.photos}</p>}

            {jobData.photos.length > 0 && (
              <div className="photo-preview" style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                {jobData.photos.map((img, i) => (
                  <img key={i} src={img} width="90" height="70" alt="preview" style={{ borderRadius: '8px', objectFit: 'cover', border: '1px solid #cbd5e1' }} />
                ))}
              </div>
            )}
          </div>

          <div className="form-group full-width">
            <label>Upload Company Video * (Max 5MB)</label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
            />
            {errors.video && <p className="error">{errors.video}</p>}

            {jobData.video && (
              <video width="280" controls style={{ borderRadius: '8px', marginTop: '10px', border: '1px solid #cbd5e1' }}>
                <source src={jobData.video} />
              </video>
            )}
          </div>

          <button onClick={handleAddJob}>
            Add Job
          </button>

        </div>
      </div>
    </div>
  );
}
