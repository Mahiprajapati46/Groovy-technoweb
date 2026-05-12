const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { Job, Application } = require('../models');
const { analyzeResumeText } = require('../lib/ai');

async function seedFrontendTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB...");

        // 1. Create the Job
        const job = await Job.create({
            title: "Frontend Lead (React & TypeScript)",
            description: "We are looking for a Staff-level Frontend Engineer to lead our core UI team. Must have 8+ years of experience, expert knowledge of React/TypeScript, and experience architecting micro-frontends.",
            requiredSkills: ["React", "TypeScript", "Next.js", "Module Federation", "Architecture", "Mentorship"],
            isActive: true
        });
        console.log(`Created Job: ${job.title}`);

        // 2. Load Resumes
        const matchText = fs.readFileSync(path.join(__dirname, '../../data/frontend_lead_match.txt'), 'utf8');
        const failText = fs.readFileSync(path.join(__dirname, '../../data/frontend_lead_fail.txt'), 'utf8');

        // 3. Process Match
        console.log("Analyzing Matching Candidate...");
        const matchAnalysis = await analyzeResumeText(matchText, {
            title: job.title,
            description: job.description,
            skills: job.requiredSkills
        });
        await Application.create({
            job: job._id,
            candidateEmail: "rahul.lead@example.com",
            candidateName: matchAnalysis.candidateName || "Rahul Verma",
            resumeText: matchText,
            analysis: matchAnalysis,
            emailDraft: matchAnalysis.inviteDraft,
            status: "analyzed" // Keep it analyzed so Agent can process it
        });

        // 4. Process Fail
        console.log("Analyzing Non-Matching Candidate...");
        const failAnalysis = await analyzeResumeText(failText, {
            title: job.title,
            description: job.description,
            skills: job.requiredSkills
        });
        await Application.create({
            job: job._id,
            candidateEmail: "kevin.beginner@example.com",
            candidateName: failAnalysis.candidateName || "Kevin Smith",
            resumeText: failText,
            analysis: failAnalysis,
            emailDraft: failAnalysis.inviteDraft,
            status: "analyzed"
        });

        console.log("Seed Successful! You now have 1 Job and 2 Candidates ready for the Agent.");
        process.exit(0);
    } catch (err) {
        console.error("Seed Error:", err);
        process.exit(1);
    }
}

seedFrontendTest();
