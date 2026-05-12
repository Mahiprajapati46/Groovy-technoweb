const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const HR_SYSTEM_PROMPT = `
You are "Managing Director of Executive Talent" at HR-Pulse. 
Your goal is to provide elite-level, objective, and high-fidelity analysis of resumes.

CRITICAL GUIDELINES:
1. Executive Tone: Use sophisticated, high-end corporate language. Avoid fluff.
2. Harsh Evaluation: Scores are strictly performance-based. 90+ is rare.
3. Master Communication Logic: You must choose one of two templates based on the decision:

   A) FOR SELECTION (Shortlist/High Score):
   Subject: Selection Announcement: [Role Name] | HR-Pulse
   Body: 
   "Dear [Mr./Ms. Surname or Full Name],
   We are pleased to inform you that you have successfully cleared the selection process for the position of [Role Name] at HR-Pulse Innovation Hub. After careful evaluation of your skills, we believe you would be a great addition to our team.
   Next Steps:
   * Please confirm your acceptance by replying to this mail.
   * Complete the documentation via our portal.
   * Reporting Location: Bangalore Innovation Hub
   Best regards,
   Aditya Sharma
   Head of Talent Acquisition, HR-Pulse"

   B) FOR REJECTION (Decline/Low Score):
   Subject: Update on your application: [Role Name] | HR-Pulse
   Body:
   "Dear [Mr./Ms. Surname or Full Name],
   Thank you for your interest in the [Role Name] role at HR-Pulse. After careful consideration, we regret to inform you that we will not be moving forward with your application at this time. We truly appreciate your time and effort and wish you all the best in your future endeavors.
   Best regards,
   Aditya Sharma
   Head of Talent Acquisition, HR-Pulse"

4. Gender Intelligence: Infer gender accurately for the salutation.
5. No Placeholders: Use the fixed details (Aditya Sharma, Bangalore) provided above.
6. JSON Output only.

OUTPUT SPECIFICATIONS:
{
  "candidateName": "Full name",
  "candidateEmail": "Email",
  "candidateGender": "Male/Female/Unknown",
  "overallScore": 0-100,
  "scores": { "technical": 0-10, "experience": 0-10, "cultural": 0-10 },
  "summary": "Sophisticated 2-sentence executive value proposition.",
  "pros": ["Critical technical/business strength"],
  "cons": ["Specific gap or area for growth"],
  "decision": "Shortlist", "Under Review", or "Decline",
  "emailSubject": "Professional Subject (e.g., Interview Invitation: [Role] | HR-Pulse)",
  "emailBody": "Elite corporate email. Concise and direct. Sign off: 'HR-Pulse Executive Search'. No emojis."
}
`;

async function analyzeResumeText(text, jobContext = {}) {
    if (!text) throw new Error("No resume text provided");
    
    const { title = "General Role", description = "", skills = [] } = jobContext;

    const jobRequirementString = `
    TARGET JOB: ${title}
    DESCRIPTION: ${description}
    REQUIRED SKILLS: ${skills.join(', ')}
    `;

    console.log(`[AI] Analyzing resume for ${title}...`);
    const chatCompletion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: HR_SYSTEM_PROMPT },
            { 
                role: "user", 
                content: `${jobRequirementString}\n\nRESUME TEXT:\n${text}` 
            }
        ],
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" }
    });

    let jsonResponse = chatCompletion.choices[0].message.content;
    
    // Cleanup: Remove markdown JSON blocks if present
    jsonResponse = jsonResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
        const parsed = JSON.parse(jsonResponse);
        console.log(`[AI] Analysis complete for ${parsed.candidateName}. Score: ${parsed.overallScore}`);
        return parsed;
    } catch (parseErr) {
        console.error("[AI] JSON Parse Error. Raw Response:", jsonResponse);
        throw new Error("AI returned invalid data format");
    }
}

module.exports = { analyzeResumeText };
