import PostJob from "../models/PostJob.js";
import EmployeeProfile from "../models/EmployeeProfile.js";
import Employee from "../models/Employee.js"; // Added Employee model import
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// Helper to extract JSON from AI response
const extractJSON = (text) => {
  try {
    // 1. Clean markdown code blocks if present
    let cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // 2. Attempt to find the first '{' or '[' and the last '}' or ']'
    const jsonStart = cleanedText.indexOf('[');
    const jsonEnd = cleanedText.lastIndexOf(']');

    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonContent = cleanedText.substring(jsonStart, jsonEnd + 1);
      return JSON.parse(jsonContent);
    }

    // Fallback for objects
    const objStart = cleanedText.indexOf('{');
    const objEnd = cleanedText.lastIndexOf('}');
    if (objStart !== -1 && objEnd !== -1) {
      const objContent = cleanedText.substring(objStart, objEnd + 1);
      return JSON.parse(objContent);
    }

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Failed to parse JSON from AI response. Response text was:", text);
    throw new Error("AI returned invalid data format. Please try again.");
  }
};


// CREATE JOB
export const createJob = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    const {
      companyName,
      title,
      location,
      companyLocation,
      latitude,
      longitude,
      salary,
      skills,
      education,
      description
    } = req.body;

    //correct for upload.fields()
    const photos = req.files["photos"]?.map(file => file.path) || [];
    const video = req.files["video"]?.[0]?.path || "";

    // The protect middleware sets req.user
    const employerId = req.user.id;

    const resolvedCompanyLocation = companyLocation || location || "Not Specified";
    const resolvedJobLocation = location || companyLocation || "Not Specified";

    const job = new PostJob({
      employerId,
      companyName,
      title,
      location: resolvedJobLocation,
      companyLocation: resolvedCompanyLocation,
      latitude: latitude && !isNaN(Number(latitude)) ? Number(latitude) : null,
      longitude: longitude && !isNaN(Number(longitude)) ? Number(longitude) : null,
      salary,
      skills,
      education,
      description,
      photos,
      video
    });

    await job.save();

    res.status(201).json({
      message: "Job created successfully",
      job
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET JOBS FOR SPECIFIC EMPLOYER
export const getEmployerJobs = async (req, res) => {
  try {
    const jobs = await PostJob.find({ employerId: req.user.id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// GET ALL JOBS
export const getJobs = async (req, res) => {
  try {
    const jobs = await PostJob.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//GET SINGLE JOB
export const getJobById = async (req, res) => {
  try {
    const job = await PostJob.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//UPDATE JOB
export const updateJob = async (req, res) => {
  try {
    const {
      companyName,
      title,
      location,
      companyLocation,
      latitude,
      longitude,
      salary,
      skills,
      education,
      description
    } = req.body;

    const resolvedCompanyLocation = companyLocation || location || "";
    const resolvedJobLocation = location || companyLocation || "";

    let updateData = {
      companyName,
      title,
      location: resolvedJobLocation,
      companyLocation: resolvedCompanyLocation,
      salary,
      skills,
      education,
      description
    };

    if (latitude !== undefined) {
      updateData.latitude = latitude && !isNaN(Number(latitude)) ? Number(latitude) : null;
    }
    if (longitude !== undefined) {
      updateData.longitude = longitude && !isNaN(Number(longitude)) ? Number(longitude) : null;
    }

    // update photos if new uploaded
    if (req.files && req.files["photos"]) {
      updateData.photos = req.files["photos"].map(file => file.path);
    }

    // update video if new uploaded
    if (req.files && req.files["video"]) {
      updateData.video = req.files["video"][0].path;
    }

    const job = await PostJob.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({
      message: "Job updated successfully",
      job
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//  DELETE JOB
export const deleteJob = async (req, res) => {
  try {
    await PostJob.findByIdAndDelete(req.params.id);

    res.json({ message: "Job deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// AI JOB SUGGESTIONS
export const getSuggestedJobs = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get the User to find their email (since email isn't in the token)
    const user = await Employee.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // 2. Get Employee Profile using the found email
    const employee = await EmployeeProfile.findOne({ email: user.email });

    if (!employee) {
      return res.status(404).json({ message: "Profile not found. Please complete your profile first." });
    }

    // 3. Get All Jobs
    const allJobs = await PostJob.find().lean();

    if (allJobs.length === 0) {
      return res.status(200).json([]);
    }

    const employeeSkills = Array.isArray(employee.skills)
      ? employee.skills
      : (typeof employee.skills === "string" ? employee.skills.split(",").map(s => s.trim()) : []);

    let suggestedJobs = [];

    // 4. Try Gemini AI Model
    try {
      if (process.env.GEMINI_API_KEY) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
          You are an expert recruitment assistant for the CareerQuest Job Portal.
          Your task is to match the following Employee Profile with the most suitable Jobs from the provided list.
          
          Employee Details:
          - Skills: ${employeeSkills.join(", ")}
          - Qualification: ${employee.qualification}
          
          Jobs List (JSON format):
          ${JSON.stringify(allJobs.map(j => ({
            jobId: j._id.toString(),
            title: j.title,
            company: j.companyName,
            location: j.companyLocation || j.location,
            skillsRequired: j.skills,
            description: j.description ? j.description.substring(0, 180) : ""
          })))}
          
          Instructions:
          1. Analyze the employee's skills and qualification against each job's requirements.
          2. Select up to 6 jobs that are the best matches.
          3. For each match, provide a concise, professional 1-sentence "reason" emphasizing the specific skill match.
          4. Return ONLY a valid JSON array of objects. Do not include any markdown outside or conversational text.
          
          Required JSON Schema:
          [
            {
              "jobId": "the_exact_jobId_from_the_list",
              "reason": "Professional explanation of why they matched."
            }
          ]
        `;

        const result = await model.generateContent(prompt);
        const aiResponseText = result.response.text();
        const suggestedMatches = extractJSON(aiResponseText);

        if (Array.isArray(suggestedMatches) && suggestedMatches.length > 0) {
          suggestedJobs = suggestedMatches.map(match => {
            const jobDetails = allJobs.find(j => j._id.toString() === match.jobId);
            return jobDetails ? { ...jobDetails, matchReason: match.reason } : null;
          }).filter(Boolean);
        }
      }
    } catch (aiError) {
      console.warn("Gemini AI Suggestions failed, falling back to smart profile matching:", aiError.message);
    }

    // 5. Intelligent Fallback Matching Engine (guarantees results if AI fails or network error occurs)
    if (!suggestedJobs || suggestedJobs.length === 0) {
      const normalizedSkills = employeeSkills.map(s => s.toLowerCase().trim()).filter(Boolean);
      const qualLower = (employee.qualification || "").toLowerCase().trim();

      const scoredJobs = allJobs.map(job => {
        let score = 0;
        let matchedSkills = [];

        const jobTitle = (job.title || "").toLowerCase();
        const jobSkillsStr = (job.skills || "").toLowerCase();
        const jobDesc = (job.description || "").toLowerCase();
        const jobEdu = (job.education || "").toLowerCase();

        // Skill matches
        normalizedSkills.forEach(skill => {
          if (jobSkillsStr.includes(skill) || jobTitle.includes(skill) || jobDesc.includes(skill)) {
            score += 3;
            matchedSkills.push(skill);
          }
        });

        // Qualification match
        if (qualLower && jobEdu) {
          const qualWords = qualLower.split(/[\s,./-]+/).filter(w => w.length > 2);
          qualWords.forEach(w => {
            if (jobEdu.includes(w)) {
              score += 2;
            }
          });
        }

        // Formulate personalized match reason
        let matchReason = "";
        if (matchedSkills.length > 0) {
          const topSkills = matchedSkills.slice(0, 3).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(", ");
          matchReason = `Direct match for your skills in ${topSkills} based on role requirements.`;
        } else if (employee.qualification) {
          matchReason = `Well suited for your ${employee.qualification} educational background and career profile.`;
        } else {
          matchReason = `Recommended based on active market demand for ${job.title}.`;
        }

        return {
          ...job,
          matchScore: score,
          matchReason
        };
      });

      // Sort by score descending (best matches first)
      scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

      suggestedJobs = scoredJobs.slice(0, 6);
    }

    return res.status(200).json(suggestedJobs);

  } catch (error) {
    console.error("AI Suggestions Error Details:", error);
    res.status(500).json({ message: "Failed to generate job suggestions", error: error.message });
  }
};

// Helper for salary parsing
const parseSalaryNumber = (salaryStr) => {
  if (!salaryStr) return 0;
  const cleaned = String(salaryStr).replace(/,/g, '');
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

// AI JOB SEARCH ASSISTANT CHATBOT
export const jobSearchAssistant = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required." });
    }

    const userQuery = message.trim();

    // 1. Fetch all active jobs from DB
    const allJobs = await PostJob.find().sort({ createdAt: -1 }).lean();

    if (!allJobs || allJobs.length === 0) {
      return res.status(200).json({
        reply: "Hello! Welcome to CareerQuest. Currently, there are no job openings posted in the database. Please check back soon or ask employer to post jobs!",
        jobs: []
      });
    }

    // 2. Prepare jobs list for AI prompt
    const jobSummaries = allJobs.map(j => ({
      jobId: j._id.toString(),
      title: j.title || "",
      company: j.companyName || "",
      location: j.location || j.companyLocation || "",
      companyLocation: j.companyLocation || "",
      workLocation: j.location || "",
      salary: j.salary || "Not Specified",
      skills: j.skills || "",
      education: j.education || "",
      description: j.description ? j.description.substring(0, 180) : ""
    }));

    // 3. Try Gemini AI Model
    let aiResponse = null;
    try {
      if (process.env.GEMINI_API_KEY) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
You are the AI Job Search Assistant for CareerQuest (an intelligent job recruitment platform).
The employee has sent the following query:
"${userQuery}"

Recent conversation history:
${Array.isArray(history) ? JSON.stringify(history.slice(-4)) : "None"}

Here are ALL the available jobs currently posted on CareerQuest:
${JSON.stringify(jobSummaries)}

CRITICAL INSTRUCTIONS - STRICT ROLE & CATEGORY RELEVANCE:
1. Understand the employee's intent, desired role/title, target location, and salary preferences.
   - Handle common location misspellings (e.g., "ahemdab", "amd", "ahmedbad" -> "Ahmedabad").
2. STRICT ROLE ISOLATION:
   - Check if the user is asking for a specific role or domain:
     * AI/ML (Artificial Intelligence, Machine Learning, Deep Learning, NLP, Data Science, LLM).
     * HR (Human Resources, Recruiter, Talent Acquisition).
     * UI/UX / Design (Figma, Designer, Graphic).
     * Mobile (Android, iOS, Flutter, React Native).
     * Developer / Software Engineer (Frontend, Backend, Full Stack, Web, React, Node).
   - ONLY match jobs whose title or required skills specifically belong to the requested domain.
   - NEVER return Web/Full-Stack Developer jobs for an AI/ML query unless AI/ML is an explicit requirement!
   - NEVER return Developer jobs for an HR query!
   - NEVER return Developer jobs for a Designer or Finance query!
3. IF NO JOBS EXIST FOR THE REQUESTED ROLE:
   - Return "matches": [] (empty array). Do NOT return unrelated jobs.
   - In "reply", format the criteria summary and explain that there are no openings currently posted for that role.
4. Response Format in "reply":
   Always start your reply with a neat summary of the user's search criteria:
   📋 **Your Search Criteria:**
   • **Role:** [Requested Role, e.g. AI & Machine Learning (AI/ML)]
   • **Location:** [Target Location, e.g. Ahmedabad]
   • **Salary:** [Salary expectation, e.g. High / Competitive Package]
   
   Followed by your helpful explanation or list intro.

REQUIRED JSON FORMAT (Return ONLY this JSON, no markdown outside):
{
  "reply": "Conversational reply with criteria summary.",
  "matches": [
    {
      "jobId": "exact_jobId_from_list",
      "highlight": "Role match summary",
      "salaryNote": "Salary highlight"
    }
  ]
}
`;

        const result = await model.generateContent(prompt);
        const aiText = result.response.text();
        aiResponse = extractJSON(aiText);
      }
    } catch (aiErr) {
      console.warn("Gemini AI Assistant generation failed, falling back to smart local search:", aiErr.message);
    }

    // Role definitions for detection and strict verification (Specific domains first)
    const roleDefinitions = [
      {
        id: "ai_ml",
        name: "AI & Machine Learning (AI/ML)",
        testRegex: /\b(ai|ml|ai\/ml|artificial\s*intelligence|machine\s*learning|deep\s*learning|nlp|computer\s*vision|data\s*scien\w*|pytorch|tensorflow|keras|llm|genai|generative\s*ai)\b/i
      },
      {
        id: "hr",
        name: "Human Resources (HR)",
        testRegex: /\b(hr|human\s*resources?|recruiter|recruitment|talent\s*acquisition|people\s*ops|hiring|talent)\b/i
      },
      {
        id: "mobile",
        name: "Mobile App Development",
        testRegex: /\b(flutter|android|ios|react\s*native|mobile\s*app|swift|kotlin)\b/i
      },
      {
        id: "design",
        name: "UI/UX & Product Design",
        testRegex: /\b(design|designer|ui|ux|ui\/ux|graphic|illustrat|figma|photoshop)\b/i
      },
      {
        id: "qa",
        name: "Quality Assurance (QA / Testing)",
        testRegex: /\b(qa|quality\s*assurance|tester|testing|automation\s*tester|manual\s*tester)\b/i
      },
      {
        id: "marketing",
        name: "Marketing & Sales",
        testRegex: /\b(marketing|sales|seo|digital\s*marketing|social\s*media|content|bde|business\s*development|telecall)\b/i
      },
      {
        id: "finance",
        name: "Finance & Accounting",
        testRegex: /\b(account|accountant|accounting|finance|audit|banking|tax|ca|tally)\b/i
      },
      {
        id: "dev",
        name: "Software & Web Development",
        testRegex: /\b(dev|developer|software|engineer|programmer|coder|frontend|backend|full\s*stack|web|react|node|javascript|python|java|php|mern|mean)\b/i
      }
    ];

    const isJobMatchingRole = (job, roleCategory) => {
      if (!roleCategory) return true;
      const title = (job.title || "").toLowerCase();
      const skills = (job.skills || "").toLowerCase();
      const combined = `${title} ${skills}`;

      if (roleCategory.id === "ai_ml") {
        // Must specifically require AI, ML, Data Science, or Machine Learning skills/title
        const isAI = /\b(ai|ml|ai\/ml|artificial\s*intelligence|machine\s*learning|deep\s*learning|nlp|computer\s*vision|data\s*scien\w*|pytorch|tensorflow|keras|llm|genai|scikit)\b/i.test(combined);
        return isAI;
      }

      if (roleCategory.id === "hr") {
        const isHR = /\b(hr|human\s*resources?|recruiter|recruitment|talent\s*acquisition|people\s*ops|payroll)\b/i.test(title) ||
                     /\b(talent\s*acquisition|recruitment|human\s*resources?|payroll)\b/i.test(skills);
        const isTechTitle = /\b(dev|developer|software|engineer|programmer|coder|frontend|backend|full\s*stack|react|node|python|java)\b/i.test(title);
        // Exclude software and web developer jobs that merely mention 'hr' in description or shift hours
        return isHR && !isTechTitle;
      }

      if (roleCategory.id === "mobile") {
        return /\b(flutter|android|ios|react\s*native|mobile|swift|kotlin)\b/i.test(combined);
      }

      if (roleCategory.id === "design") {
        const isDesign = /\b(design|designer|ui|ux|ui\/ux|graphic|figma|illustrat)\b/i.test(combined);
        const isDev = /\b(developer|software\s*engineer|programmer|backend|full\s*stack)\b/i.test(title);
        return isDesign && !isDev;
      }

      if (roleCategory.id === "marketing") {
        return /\b(marketing|sales|seo|digital\s*marketing|social\s*media|content|bde|business\s*development)\b/i.test(combined);
      }

      if (roleCategory.id === "finance") {
        return /\b(account|accountant|accounting|finance|audit|banking|tax|ca|tally)\b/i.test(combined);
      }

      if (roleCategory.id === "qa") {
        return /\b(qa|quality\s*assurance|tester|testing)\b/i.test(combined);
      }

      if (roleCategory.id === "dev") {
        return /\b(dev|developer|software|engineer|programmer|coder|frontend|backend|full\s*stack|web|react|node|javascript|python|java|php|mern)\b/i.test(combined);
      }

      return true;
    };

    const lowerQuery = userQuery.toLowerCase();
    const detectedRole = roleDefinitions.find(r => r.testRegex.test(lowerQuery));

    // Location detection
    let targetLocation = "";
    if (/ahemd|ahmed|amd/i.test(lowerQuery)) {
      targetLocation = "Ahmedabad";
    } else if (/mumb/i.test(lowerQuery)) {
      targetLocation = "Mumbai";
    } else if (/bangal|bengal/i.test(lowerQuery)) {
      targetLocation = "Bangalore";
    } else if (/pune/i.test(lowerQuery)) {
      targetLocation = "Pune";
    } else if (/delhi/i.test(lowerQuery)) {
      targetLocation = "Delhi NCR";
    } else if (/surat/i.test(lowerQuery)) {
      targetLocation = "Surat";
    } else if (/vadodara|baroda/i.test(lowerQuery)) {
      targetLocation = "Vadodara";
    } else if (/hyderabad/i.test(lowerQuery)) {
      targetLocation = "Hyderabad";
    } else if (/remote|wfh|work\s*from\s*home/i.test(lowerQuery)) {
      targetLocation = "Remote";
    }

    const asksSalary = /sal|pay|highest|best|money|lakh|lpa|k|\d{4,}/i.test(lowerQuery);

    // Build user criteria summary for reply
    const criteriaLines = [];
    if (detectedRole) criteriaLines.push(`• **Role:** ${detectedRole.name}`);
    if (targetLocation) criteriaLines.push(`• **Location:** ${targetLocation}`);
    if (asksSalary) criteriaLines.push(`• **Salary:** High / Competitive Package`);
    const criteriaHeader = criteriaLines.length > 0 ? `📋 **Your Search Criteria:**\n${criteriaLines.join("\n")}\n\n` : "";

    // 4. If AI succeeded with matches, verify strict role relevance before returning
    if (aiResponse && (aiResponse.reply || Array.isArray(aiResponse.matches))) {
      let matchedJobs = [];
      if (Array.isArray(aiResponse.matches)) {
        matchedJobs = aiResponse.matches.map(m => {
          const found = allJobs.find(j => j._id.toString() === m.jobId);
          if (found) {
            // Strict role guard: reject irrelevant matches from AI
            if (detectedRole && !isJobMatchingRole(found, detectedRole)) {
              return null; // Reject irrelevant match
            }
            return {
              ...found,
              highlight: m.highlight,
              salaryNote: m.salaryNote || found.salary
            };
          }
          return null;
        }).filter(Boolean);
      }

      // If user asked for a specific role but zero genuine matches exist for that role
      if (detectedRole && matchedJobs.length === 0) {
        const locNote = targetLocation ? ` in **${targetLocation}**` : "";
        const salNote = asksSalary ? ` with competitive salary` : "";

        let roleMsg = `Currently, there are **no active ${detectedRole.name}** job openings${locNote}${salNote} in our database.`;
        if (detectedRole.id === "ai_ml") {
          roleMsg += `\n\nOur current technical listings are focused on **Web & Full-Stack Development** (e.g. React.js, Node.js, MERN stack). We will alert you immediately as soon as AI/ML and Data Science positions are posted by employers!`;
        } else if (detectedRole.id === "hr") {
          roleMsg += `\n\nOur current database primarily features **Engineering, Development, and Tech** roles. New HR and Talent Acquisition positions are frequently posted by recruiting partners, so please check back soon!`;
        } else {
          roleMsg += `\n\nEmployers frequently post new vacancies on CareerQuest. Please check back soon or explore our active software developer openings!`;
        }

        return res.status(200).json({
          reply: `${criteriaHeader}${roleMsg}`,
          jobs: []
        });
      }

      return res.status(200).json({
        reply: aiResponse.reply || `${criteriaHeader}Here are the matching jobs based on your criteria:`,
        jobs: matchedJobs
      });
    }

    // 5. SMART LOCAL SEARCH ENGINE (with strict role guarding)

    // Filter jobs strictly based on detected role & location
    let filteredJobs = allJobs.filter(job => {
      const jobLoc = `${job.location || ""} ${job.companyLocation || ""}`.toLowerCase();

      let locationMatch = true;
      if (targetLocation) {
        locationMatch = jobLoc.includes(targetLocation.toLowerCase());
      }

      let roleMatch = true;
      if (detectedRole) {
        roleMatch = isJobMatchingRole(job, detectedRole);
      }

      return locationMatch && roleMatch;
    });

    // If role was specified, and no jobs matched that role: NEVER fallback to unrelated jobs!
    if (detectedRole && filteredJobs.length === 0) {
      const locText = targetLocation ? ` in **${targetLocation}**` : "";
      const salText = asksSalary ? ` with competitive salary` : "";

      let roleMsg = `Currently, there are **no active ${detectedRole.name}** job openings${locText}${salText} in our database.`;
      if (detectedRole.id === "ai_ml") {
        roleMsg += `\n\nOur current technical listings are focused on **Web & Full-Stack Development** (e.g. React.js, Node.js, MERN stack). We will alert you immediately as soon as AI/ML and Data Science positions are posted by employers!`;
      } else if (detectedRole.id === "hr") {
        roleMsg += `\n\nOur current database primarily features **Engineering, Development, and Tech** roles. New HR and Talent Acquisition positions are frequently posted by recruiting partners, so please check back soon!`;
      } else {
        roleMsg += `\n\nEmployers frequently post new vacancies on CareerQuest. Please check back soon or explore our active software developer openings!`;
      }

      return res.status(200).json({
        reply: `${criteriaHeader}${roleMsg}`,
        jobs: []
      });
    }

    // If query was generic (no role specified) and location had no jobs, relax location
    if (!detectedRole && filteredJobs.length === 0 && targetLocation) {
      filteredJobs = allJobs;
    }

    // Sort by salary if requested or by default
    filteredJobs.sort((a, b) => {
      const salA = parseSalaryNumber(a.salary);
      const salB = parseSalaryNumber(b.salary);
      return salB - salA; // highest salary first
    });

    const isGreeting = /^(hi|hello|hey|welcome|how are you|good morning|good evening)/i.test(lowerQuery.trim());
    if (isGreeting && !detectedRole && !targetLocation) {
      return res.status(200).json({
        reply: "Hello! Welcome to CareerQuest. How can I help you today?\n\nYou can search by:\n• **Role:** Developer, AI/ML, HR, UI/UX Designer, QA, etc.\n• **Location:** Ahmedabad, Mumbai, Remote, etc.\n• **Salary:** High salary or attractive package\n\nTry asking: *'Find me developer job in Ahmedabad with good salary'*",
        jobs: []
      });
    }

    let reply = "";
    if (filteredJobs.length > 0) {
      const locText = targetLocation ? ` in **${targetLocation}**` : "";
      const roleText = detectedRole ? ` for **${detectedRole.name}**` : "";
      const salText = asksSalary ? ` with competitive salary` : "";
      reply = `${criteriaHeader}I found **${filteredJobs.length} position(s)**${roleText}${locText}${salText}! ${asksSalary ? "Ranked based on attractive salary packages:" : "Here are the top openings with their salary details:"}`;
    } else {
      const locText = targetLocation ? ` in **${targetLocation}**` : "";
      reply = `${criteriaHeader}I couldn't find any job matches${locText} for your search. Try searching for roles like **Developer** or locations like **Ahmedabad**!`;
      filteredJobs = [];
    }

    return res.status(200).json({
      reply,
      jobs: filteredJobs.slice(0, 8).map(j => ({
        ...j,
        salaryNote: j.salary ? `Salary: ${j.salary}` : "Salary: Negotiable"
      }))
    });

  } catch (error) {
    console.error("Job Search Assistant Error:", error);
    res.status(500).json({
      message: "Job Search Assistant encountered an error.",
      error: error.message
    });
  }
};
