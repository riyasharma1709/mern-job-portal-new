import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../styles/assistant.css";

// typewriter component
function TypewriterText({ text, speed = 15, onTyping, onDone }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let index = 0;
    setDisplayedText("");
    setIsDone(false);

    if (!text) {
      setIsDone(true);
      if (onDone) onDone();
      return;
    }

    // Dynamic typing speed: snappy and natural
    const effectiveSpeed = text.length > 250 ? 8 : (text.length > 120 ? 12 : speed);

    const timer = setInterval(() => {
      index += 1;
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index));
        if (onTyping) onTyping();
      } else {
        clearInterval(timer);
        setIsDone(true);
        if (onDone) onDone();
      }
    }, effectiveSpeed);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed]);

  return (
    <span className="typewriter-content" style={{ whiteSpace: "pre-wrap" }}>
      {displayedText}
      {!isDone && <span className="typewriter-cursor" />}
    </span>
  );
}

//bullet points
function FormattedMessageText({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className="formatted-msg-container">
      {lines.map((line, lIdx) => {
        if (!line.trim()) {
          return <div key={lIdx} className="formatted-spacer" />;
        }
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <div key={lIdx} className="formatted-line">
            {parts.map((part, pIdx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={pIdx} className="msg-bold">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return <span key={pIdx}>{part}</span>;
            })}
          </div>
        );
      })}
    </div>
  );
}

// Domain role definitions with strict positive matchers and negative software exclusions
const ROLE_DEFINITIONS = [
  {
    id: "ai_ml",
    name: "AI & Machine Learning (AI/ML)",
    displayName: "AI & Machine Learning (AI/ML)",
    testRegex: /\b(ai|ml|ai\/ml|artificial\s*intelligence|machine\s*learning|deep\s*learning|nlp|computer\s*vision|data\s*scien\w*|pytorch|tensorflow|keras|llm|genai|generative\s*ai|data\s*analyst|neural\s*network)\b/i,
    isMatch: (job) => {
      const combined = `${job.title || ""} ${job.skills || ""}`.toLowerCase();
      // Must have positive AI / ML / Data Science signal in title or required skills
      return /\b(ai|ml|ai\/ml|artificial\s*intelligence|machine\s*learning|deep\s*learning|nlp|computer\s*vision|data\s*scien\w*|pytorch|tensorflow|keras|llm|genai|scikit|pandas|data\s*analyst)\b/i.test(combined);
    }
  },
  {
    id: "hr",
    name: "Human Resources (HR)",
    displayName: "Human Resources (HR)",
    testRegex: /\b(hr|human\s*resources?|recruiter|recruitment|talent\s*acquisition|people\s*ops|talent)\b/i,
    isMatch: (job) => {
      const title = (job.title || "").toLowerCase();
      const skills = (job.skills || "").toLowerCase();
      const isHR = /\b(hr|human\s*resources?|recruiter|recruitment|talent\s*acquisition|people\s*ops|payroll)\b/i.test(title) ||
                   /\b(talent\s*acquisition|recruitment|human\s*resources?|payroll)\b/i.test(skills);
      const isTech = /\b(dev|developer|software|engineer|programmer|coder|frontend|backend|full\s*stack|react|node|python|java|web|mern)\b/i.test(title);
      return isHR && !isTech;
    }
  },
  {
    id: "mobile",
    name: "Mobile App Development",
    displayName: "Mobile App Development (Android/iOS/Flutter)",
    testRegex: /\b(flutter|android|ios|react\s*native|mobile|swift|kotlin|mobile\s*app)\b/i,
    isMatch: (job) => {
      const combined = `${job.title || ""} ${job.skills || ""}`.toLowerCase();
      return /\b(flutter|android|ios|react\s*native|mobile|swift|kotlin)\b/i.test(combined);
    }
  },
  {
    id: "design",
    name: "UI/UX & Product Design",
    displayName: "UI/UX & Product Design",
    testRegex: /\b(ui|ux|ui\/ux|design|designer|graphic|figma|photoshop|illustrator)\b/i,
    isMatch: (job) => {
      const title = (job.title || "").toLowerCase();
      const skills = (job.skills || "").toLowerCase();
      const combined = `${title} ${skills}`;
      const isDesign = /\b(design|designer|ui|ux|ui\/ux|graphic|figma)\b/i.test(combined);
      const isDev = /\b(developer|software\s*engineer|programmer|backend|full\s*stack)\b/i.test(title);
      return isDesign && !isDev;
    }
  },
  {
    id: "qa",
    name: "Quality Assurance (QA / Testing)",
    displayName: "Quality Assurance (QA / Testing)",
    testRegex: /\b(qa|quality\s*assurance|tester|testing|selenium|manual\s*tester|automation\s*tester)\b/i,
    isMatch: (job) => {
      const combined = `${job.title || ""} ${job.skills || ""}`.toLowerCase();
      return /\b(qa|quality\s*assurance|tester|testing|selenium)\b/i.test(combined);
    }
  },
  {
    id: "marketing",
    name: "Marketing & Sales",
    displayName: "Marketing & Sales",
    testRegex: /\b(marketing|sales|seo|digital\s*marketing|social\s*media|content|bde|business\s*development)\b/i,
    isMatch: (job) => {
      const combined = `${job.title || ""} ${job.skills || ""}`.toLowerCase();
      return /\b(marketing|sales|seo|digital\s*marketing|social\s*media|content|bde|business\s*development)\b/i.test(combined);
    }
  },
  {
    id: "finance",
    name: "Finance & Accounting",
    displayName: "Finance & Accounting",
    testRegex: /\b(account|accountant|accounting|finance|audit|banking|tax|ca|tally)\b/i,
    isMatch: (job) => {
      const combined = `${job.title || ""} ${job.skills || ""}`.toLowerCase();
      return /\b(account|accountant|accounting|finance|audit|banking|tax|ca|tally)\b/i.test(combined);
    }
  },
  {
    id: "dev",
    name: "Software & Web Development",
    displayName: "Software & Web Development",
    testRegex: /\b(dev|developer|software|engineer|programmer|coder|frontend|backend|full\s*stack|web|react|node|javascript|python|java|php|mern|mean)\b/i,
    isMatch: (job) => {
      const combined = `${job.title || ""} ${job.skills || ""}`.toLowerCase();
      return /\b(dev|developer|software|engineer|programmer|coder|frontend|backend|full\s*stack|web|react|node|javascript|python|java|php|mern)\b/i.test(combined);
    }
  }
];

// Helper to extract location variations & Indian tech hubs
const extractLocation = (query) => {
  const q = (query || "").toLowerCase();
  if (/\b(ahmedabad|ahemdab\w*|ahmed\w*|amd|ahmd)\b/i.test(q)) return "Ahmedabad";
  if (/\b(mumbai|bombay)\b/i.test(q)) return "Mumbai";
  if (/\b(bangalore|bengaluru|blr)\b/i.test(q)) return "Bangalore";
  if (/\b(pune)\b/i.test(q)) return "Pune";
  if (/\b(delhi|ncr|gurgaon|gurugram|noida)\b/i.test(q)) return "Delhi NCR";
  if (/\b(surat)\b/i.test(q)) return "Surat";
  if (/\b(vadodara|baroda)\b/i.test(q)) return "Vadodara";
  if (/\b(hyderabad|hyd)\b/i.test(q)) return "Hyderabad";
  if (/\b(chennai|madras)\b/i.test(q)) return "Chennai";
  if (/\b(kolkata|calcutta)\b/i.test(q)) return "Kolkata";
  if (/\b(remote|wfh|work\s*from\s*home|hybrid)\b/i.test(q)) return "Remote";
  return null;
};

// Helper to extract salary expectations
const extractSalary = (query) => {
  const q = (query || "").toLowerCase();
  const asksSalary = /\b(sal|salary|salaries|pay|package|high\s*salary|highest|best\s*salary|good\s*salary|top\s*paying|attractive|money|lakh|lpa|k|\d{4,})\b/i.test(q);
  if (!asksSalary) return null;

  const lpaMatch = q.match(/(\d+(\.\d+)?)\s*(lpa|lakh|lac)/i);
  if (lpaMatch) return `${lpaMatch[1]} LPA+`;
  const kMatch = q.match(/(\d+)\s*k/i);
  if (kMatch) return `₹${kMatch[1]}K+`;
  return "High / Competitive Package";
};

// Numeric salary parsing for sorting
const parseSalaryNumber = (salaryStr) => {
  if (!salaryStr) return 0;
  const cleaned = String(salaryStr).replace(/,/g, "");
  const lpaMatch = cleaned.match(/(\d+(\.\d+)?)\s*(lpa|lakh|lac)/i);
  if (lpaMatch) return parseFloat(lpaMatch[1]) * 100000;
  const kMatch = cleaned.match(/(\d+(\.\d+)?)\s*k/i);
  if (kMatch) return parseFloat(kMatch[1]) * 1000;
  const numMatches = cleaned.match(/\d+/g);
  if (numMatches && numMatches.length > 0) {
    return Math.max(...numMatches.map(Number));
  }
  return 0;
};

export default function JobAssistant() {
  const welcomeText =
    "Hello! Welcome to CareerQuest. How can I help you today?\n\nYou can search for jobs by:\n• **Role:** Developer, AI/ML, HR, UI/UX Designer, QA, etc.\n• **Location:** Ahmedabad, Mumbai, Remote, etc.\n• **Salary:** High salary or attractive package\n\nTry asking: *'Find me developer job in Ahmedabad with good salary'*";

  const [messages, setMessages] = useState([
    {
      id: "welcome-init",
      sender: "bot",
      text: welcomeText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      jobs: []
    }
  ]);

  // Track which bot messages have finished their typewriter animation
  const [typedMessageIds, setTypedMessageIds] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [dynamicLoadingText, setDynamicLoadingText] = useState("Analyzing opportunities in real time...");
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [selectedJobModal, setSelectedJobModal] = useState(null);
  const [toast, setToast] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const quickPrompts = [
    "Find me developer job in Ahmedabad",
    "Find me AI/ML job in Ahmedabad",
    "Find me HR job in Ahmedabad",
    "Developer jobs based on high salary",
    "Jobs in Ahmedabad with good salary"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchAppliedJobs();
    fetchSavedJobs();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleTypeDone = (msgId) => {
    setTypedMessageIds(prev => (prev.includes(msgId) ? prev : [...prev, msgId]));
    setTimeout(scrollToBottom, 60);
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const fetchAppliedJobs = async () => {
    try {
      const token = localStorage.getItem("employeeToken");
      if (!token) return;

      const response = await fetch("http://localhost:5000/api/applications/employee", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const ids = data
          .map(app => (app.jobId?._id ? app.jobId._id : app.jobId))
          .filter(Boolean);
        setAppliedJobIds(ids);
      }
    } catch (err) {
      console.error("Failed to load applied jobs in assistant:", err);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const token = localStorage.getItem("employeeToken");
      if (!token) return;

      const response = await fetch("http://localhost:5000/api/employees/saved-jobs/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSavedJobIds(data.map(job => (typeof job === "object" ? job._id : job)));
      }
    } catch (err) {
      console.error("Failed to load saved jobs:", err);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query || loading) return;

    const userMessage = {
      id: "user-" + Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      jobs: []
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    const lowerQ = query.toLowerCase();
    const detectedRole = ROLE_DEFINITIONS.find(r => r.testRegex.test(lowerQ));
    const detectedLocation = extractLocation(query);
    const detectedSalary = extractSalary(query);
    const isGreeting = /^(hi|hello|hey|welcome|good\s*morning|good\s*afternoon|good\s*evening|namaste|greetings)\b/i.test(query.trim());

    // Dynamic thinking beacon label
    let loadingText = "Searching active opportunities in real time...";
    if (detectedRole && detectedLocation) {
      loadingText = `Analyzing ${detectedRole.displayName} roles in ${detectedLocation}...`;
    } else if (detectedRole) {
      loadingText = `Analyzing ${detectedRole.displayName} roles & salary packages...`;
    } else if (detectedLocation) {
      loadingText = `Filtering active jobs in ${detectedLocation}...`;
    }
    setDynamicLoadingText(loadingText);

    try {
      const token = localStorage.getItem("employeeToken");
      const headers = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Build context history
      const history = messages.slice(-4).map(m => ({
        role: m.sender === "user" ? "user" : "model",
        text: m.text
      }));

      let candidateJobs = [];
      let backendCalledSuccessfully = false;

      // 1. Fetch from backend assistant
      try {
        const response = await fetch("http://localhost:5000/api/jobs/assistant", {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: query,
            history
          })
        });

        if (response.ok) {
          const data = await response.json();
          backendCalledSuccessfully = true;
          if (Array.isArray(data.jobs)) {
            candidateJobs = data.jobs;
          }
        }
      } catch (errApi) {
        console.warn("Assistant backend fetch error, trying direct fallback:", errApi.message);
      }

      // 2. Direct database fallback if backend assistant didn't return jobs
      if (!backendCalledSuccessfully || candidateJobs.length === 0) {
        try {
          const fallbackRes = await fetch("http://localhost:5000/api/jobs");
          if (fallbackRes.ok) {
            const allDbJobs = await fallbackRes.json();
            if (Array.isArray(allDbJobs) && allDbJobs.length > 0) {
              candidateJobs = allDbJobs;
            }
          }
        } catch (errDb) {
          console.warn("Fallback /api/jobs fetch error:", errDb.message);
        }
      }

      // 3. STRICT CLIENT-SIDE ROLE FILTERING (prevents cross-domain mismatches 100%)
      if (detectedRole) {
        candidateJobs = candidateJobs.filter(j => detectedRole.isMatch(j));
      }

      // 4. STRICT CLIENT-SIDE LOCATION FILTERING (if location explicitly requested)
      if (detectedLocation) {
        const locLower = detectedLocation.toLowerCase();
        candidateJobs = candidateJobs.filter(j => {
          const jobLoc = `${j.location || ""} ${j.companyLocation || ""}`.toLowerCase();
          return jobLoc.includes(locLower);
        });
      }

      // 5. SORT BY SALARY
      candidateJobs.sort((a, b) => {
        const salA = parseSalaryNumber(a.salary);
        const salB = parseSalaryNumber(b.salary);
        return salB - salA;
      });

      // 6. BUILD CRITERIA SUMMARY FOR ASSISTANT RESPONSE
      const criteriaLines = [];
      if (detectedRole) criteriaLines.push(`• **Role:** ${detectedRole.displayName}`);
      if (detectedLocation) criteriaLines.push(`• **Location:** ${detectedLocation}`);
      if (detectedSalary) criteriaLines.push(`• **Salary:** ${detectedSalary}`);

      const criteriaHeader = criteriaLines.length > 0
        ? `📋 **Your Search Criteria:**\n${criteriaLines.join("\n")}\n\n`
        : "";

      let finalReply = "";
      let finalJobs = [];

      if (isGreeting && !detectedRole && !detectedLocation) {
        finalReply = `Hello! Welcome to CareerQuest. How can I help you today?\n\nYou can search for jobs by:\n• **Role:** Developer, AI/ML, HR, UI/UX Designer, QA, etc.\n• **Location:** Ahmedabad, Mumbai, Remote, etc.\n• **Salary:** High salary or attractive package\n\nTry asking: *"Find me developer job in Ahmedabad with good salary"*`;
        finalJobs = [];
      } else if (detectedRole && candidateJobs.length === 0) {
        const locText = detectedLocation ? ` in **${detectedLocation}**` : "";
        const salText = detectedSalary ? ` with **${detectedSalary}**` : "";

        let roleExplanation = `Currently, there are **no active ${detectedRole.displayName}** job openings${locText}${salText} in our database.`;
        if (detectedRole.id === "ai_ml") {
          roleExplanation += `\n\nOur current technical listings are focused on **Web & Full-Stack Development** (e.g. React.js, Node.js, MERN stack). We will alert you immediately as soon as AI/ML and Data Science positions are posted by employers!`;
        } else if (detectedRole.id === "hr") {
          roleExplanation += `\n\nOur current database primarily features **Engineering, Development, and Tech** roles. New HR and Talent Acquisition positions are frequently posted by recruiting partners, so please check back soon!`;
        } else {
          roleExplanation += `\n\nEmployers frequently post new vacancies on CareerQuest. Please check back soon or explore our active software developer openings!`;
        }

        finalReply = `${criteriaHeader}${roleExplanation}`;
        finalJobs = [];
      } else if (candidateJobs.length > 0) {
        const roleText = detectedRole ? ` for **${detectedRole.name}**` : "";
        const locText = detectedLocation ? ` in **${detectedLocation}**` : "";
        const salText = detectedSalary ? ` with **${detectedSalary}**` : "";

        finalReply = `${criteriaHeader}I found **${candidateJobs.length} position(s)**${roleText}${locText}${salText}! ${detectedSalary ? "Ranked based on attractive salary packages:" : "Here are the top openings with their salary details:"}`;
        finalJobs = candidateJobs.slice(0, 8);
      } else {
        const locText = detectedLocation ? ` in **${detectedLocation}**` : "";
        finalReply = `${criteriaHeader}I couldn't find any job matches${locText} for your search. Try searching for roles like **Developer** or locations like **Ahmedabad**!`;
        finalJobs = [];
      }

      const botMessage = {
        id: "bot-" + Date.now().toString(),
        sender: "bot",
        text: finalReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        jobs: finalJobs
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error("Assistant chat error:", err);
      const errorMessage = {
        id: "bot-err-" + Date.now().toString(),
        sender: "bot",
        text: "I'm having a little trouble connecting to the server. Please ensure the backend is running and try again in a moment!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        jobs: []
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleApply = async (job) => {
    try {
      const token = localStorage.getItem("employeeToken");
      if (!token) {
        showToast("Please login as an employee to apply.", "error");
        return;
      }

      if (appliedJobIds.includes(job._id)) {
        showToast("You have already applied for this job!", "info");
        return;
      }

      const response = await fetch("http://localhost:5000/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId: job._id,
          employerId: job.employerId
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAppliedJobIds(prev => [...prev, job._id]);
        showToast(`🎉 Successfully applied to ${job.title} at ${job.companyName || "company"}!`, "success");
      } else {
        showToast(data.message || "Failed to apply. Please try again.", "error");
      }
    } catch (err) {
      console.error("Apply error:", err);
      showToast("Error while submitting application", "error");
    }
  };

  const handleSaveToggle = async (jobId) => {
    try {
      const token = localStorage.getItem("employeeToken");
      if (!token) {
        showToast("Please login as an employee to save jobs.", "error");
        return;
      }

      const isSaved = savedJobIds.includes(jobId);
      const response = await fetch(`http://localhost:5000/api/employees/save-job/${jobId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        if (isSaved) {
          setSavedJobIds(prev => prev.filter(id => id !== jobId));
          showToast("Job removed from saved list", "info");
        } else {
          setSavedJobIds(prev => [...prev, jobId]);
          showToast("Job saved to your bookmarks ❤️", "success");
        }
      }
    } catch (err) {
      console.error("Save job error:", err);
      showToast("Network error while saving job", "error");
    }
  };

  const handleClearChat = () => {
    const newWelcomeId = "welcome-" + Date.now();
    setMessages([
      {
        id: newWelcomeId,
        sender: "bot",
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        jobs: []
      }
    ]);
    // Reset typed IDs so it types out fresh
    setTypedMessageIds([]);
  };

  return (
    <>
      <Navbar />

      <div className="main">
        <Sidebar />

        <div className="content" style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
          
          <div className="assistant-container">
            {/* Real-Time Assistant Header */}
            <div className="assistant-header">
              <div className="assistant-header-left">
                <div className="bot-avatar-header">🤖</div>
                <div className="assistant-title-group">
                  <h2>CareerQuest Job Search Assistant</h2>
                  <p className="assistant-status">
                    <span className="status-beacon-wrapper">
                      <span className={`status-beacon ${loading ? "typing" : "active"}`}></span>
                      <span className={`status-beacon-ring ${loading ? "typing" : ""}`}></span>
                    </span>
                    {loading ? "AI is analyzing opportunities in real time..." : "Active Now • CareerQuest AI"}
                  </p>
                </div>
              </div>

              <div className="assistant-header-right">
                <button className="clear-chat-btn" onClick={handleClearChat} title="Reset chat conversation">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  Reset Chat
                </button>
              </div>
            </div>

            {/* Quick Suggestions Bar */}
            <div className="quick-prompts-bar">
              <span className="quick-prompts-label">
                <span>⚡</span> Try Asking:
              </span>
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  className="prompt-chip"
                  onClick={() => handleSendMessage(prompt)}
                  disabled={loading}
                >
                  <span>✨</span> {prompt}
                </button>
              ))}
            </div>

            {/* Messages Area */}
            <div className="chat-messages">
              {messages.map((msg) => {
                const isBot = msg.sender === "bot";
                const isAlreadyTyped = typedMessageIds.includes(msg.id);

                return (
                  <div key={msg.id} className={`message-row ${msg.sender}`}>
                    <div className={`message-avatar ${msg.sender}`}>
                      {isBot ? "🤖" : "👤"}
                    </div>

                    <div className="message-bubble-wrapper">
                      <div className="message-bubble">
                        {isBot ? (
                          isAlreadyTyped ? (
                            <FormattedMessageText text={msg.text} />
                          ) : (
                            <TypewriterText
                              text={msg.text}
                              onTyping={scrollToBottom}
                              onDone={() => handleTypeDone(msg.id)}
                            />
                          )
                        ) : (
                          <FormattedMessageText text={msg.text} />
                        )}

                        {/* Matched Jobs Cards appear after typing finishes */}
                        {isBot && isAlreadyTyped && msg.jobs && msg.jobs.length > 0 && (
                          <div className="chat-jobs-grid">
                            {msg.jobs.map((job) => {
                              const isApplied = appliedJobIds.includes(job._id);
                              const isSaved = savedJobIds.includes(job._id);
                              const jobLocation = job.companyLocation || job.location || "Ahmedabad";
                              const formattedSalary = job.salary 
                                ? (job.salary.includes("₹") || job.salary.includes("Rs") ? job.salary : `₹${job.salary}`) 
                                : "Attractive Package";

                              return (
                                <div key={job._id} className="chat-job-card">
                                  <div>
                                    <div className="job-card-top">
                                      {job.photos && job.photos.length > 0 ? (
                                        <img
                                          src={`http://localhost:5000/${job.photos[0]}`}
                                          alt={job.companyName}
                                          className="job-company-logo"
                                        />
                                      ) : (
                                        <div className="job-company-placeholder">
                                          {job.companyName ? job.companyName.charAt(0) : "J"}
                                        </div>
                                      )}

                                      <div className="job-info-header">
                                        <h4 className="job-title-chat">{job.title}</h4>
                                        <p className="job-company-chat">{job.companyName}</p>
                                      </div>
                                    </div>

                                    {/* Meta Badges */}
                                    <div className="job-meta-badges">
                                      <span className="meta-badge location" title="Job Location">
                                        📍 {jobLocation}
                                      </span>
                                      <span className="meta-badge salary" title="Salary Package">
                                        💰 {formattedSalary}
                                      </span>
                                    </div>

                                    {/* Salary / Match Highlight */}
                                    <div className="salary-highlight-banner">
                                      <span>💡</span>
                                      <span>{job.salaryNote || job.highlight || `Great opportunity offering ${formattedSalary}`}</span>
                                    </div>

                                    {/* Skills */}
                                    {job.skills && (
                                      <div className="job-skills-row">
                                        {job.skills
                                          .split(",")
                                          .slice(0, 3)
                                          .map((s, idx) => (
                                            <span key={idx} className="job-skill-chip">
                                              {s.trim()}
                                            </span>
                                          ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <div className="job-actions-row">
                                    <button
                                      className="chat-apply-btn"
                                      onClick={() => handleApply(job)}
                                      disabled={isApplied}
                                    >
                                      {isApplied ? "Applied ✓" : "Apply Now"}
                                    </button>

                                    <button
                                      className={`chat-save-btn ${isSaved ? "saved" : ""}`}
                                      onClick={() => handleSaveToggle(job._id)}
                                      title={isSaved ? "Remove from saved" : "Save this job"}
                                    >
                                      {isSaved ? "❤️" : "🤍"}
                                    </button>

                                    <button
                                      className="chat-save-btn"
                                      onClick={() => setSelectedJobModal(job)}
                                      title="View full details"
                                    >
                                      👁️
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <span className="message-time">{msg.timestamp}</span>
                    </div>
                  </div>
                );
              })}

              {/* Real-Time Thinking Bubble */}
              {loading && (
                <div className="message-row bot">
                  <div className="message-avatar bot">🤖</div>
                  <div className="typing-bubble">
                    <div className="typing-dots-wave">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                    <span className="typing-text">{dynamicLoadingText}</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="assistant-input-area">
              <form
                className="assistant-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  className="assistant-input"
                  placeholder="e.g. Find me developer job in Ahmedabad with good salary..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="assistant-send-btn"
                  disabled={loading || !inputValue.trim()}
                  title="Send message"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>

      {/* Modal for Job Details */}
      {selectedJobModal && (
        <div className="job-details-modal-overlay" onClick={() => setSelectedJobModal(null)}>
          <div className="job-details-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedJobModal(null)}>✕</button>
            <h3 style={{ margin: "0 0 6px", fontSize: "22px", color: "#0f172a" }}>
              {selectedJobModal.title}
            </h3>
            <h4 style={{ margin: "0 0 16px", color: "#2563eb", fontWeight: 600 }}>
              {selectedJobModal.companyName}
            </h4>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "18px" }}>
              <span className="meta-badge location">📍 {selectedJobModal.companyLocation || selectedJobModal.location}</span>
              <span className="meta-badge salary">💰 {selectedJobModal.salary}</span>
              {selectedJobModal.education && (
                <span className="meta-badge location">🎓 {selectedJobModal.education}</span>
              )}
            </div>

            <div style={{ marginBottom: "18px" }}>
              <h5 style={{ margin: "0 0 6px", color: "#334155" }}>Required Skills:</h5>
              <p style={{ margin: 0, color: "#475569" }}>{selectedJobModal.skills}</p>
            </div>

            <div style={{ marginBottom: "22px" }}>
              <h5 style={{ margin: "0 0 6px", color: "#334155" }}>Description:</h5>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                {selectedJobModal.description}
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                className="chat-apply-btn"
                style={{ padding: "12px" }}
                onClick={() => {
                  handleApply(selectedJobModal);
                  setSelectedJobModal(null);
                }}
                disabled={appliedJobIds.includes(selectedJobModal._id)}
              >
                {appliedJobIds.includes(selectedJobModal._id) ? "Already Applied ✓" : "Apply for this Job"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`assistant-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </>
  );
}
