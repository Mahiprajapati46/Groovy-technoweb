require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const path = require('path');

// Models
// We need to point to the models correctly.
// Since we are in backend/scripts, we go up one level.
const { Job, Application } = require('../models');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hr_pulse';

const JOBS = [
    {
        title: "Senior Full Stack Developer",
        description: "We are looking for a Senior Full Stack Engineer to join our core product team. You will be responsible for building scalable features from the ground up using the MERN stack. Requirements include 5+ years of experience, strong architectural knowledge, and a passion for clean code.",
        requiredSkills: ["React", "Node.js", "Express", "MongoDB", "Redux", "AWS"],
        isActive: true
    },
    {
        title: "AI Strategy & Integration Lead",
        description: "As an AI Strategy Lead, you will architect our next-generation agentic workflows. You must have deep experience with OpenAI APIs, LangChain, and vector databases. You will be responsible for prompt engineering and RAG pipeline optimization.",
        requiredSkills: ["Python", "LangChain", "OpenAI API", "Vector Databases", "Node.js", "Agentic Design"],
        isActive: true
    },
    {
        title: "Staff Frontend Architect",
        description: "Lead our frontend technical strategy. We need someone who can architect complex micro-frontends and maintain our high-performance design system. Expert knowledge of React, TypeScript, and modern build tools is a must.",
        requiredSkills: ["React", "TypeScript", "Next.js", "Module Federation", "Tailwind CSS", "Architecture"],
        isActive: true
    },
    {
        title: "Backend Platform Engineer",
        description: "Focus on the backbone of our systems. You will design high-performance REST and gRPC APIs, manage our PostgreSQL databases, and ensure our Dockerized microservices are running smoothly in a Kubernetes environment.",
        requiredSkills: ["Node.js", "PostgreSQL", "Redis", "Docker", "Kubernetes", "gRPC"],
        isActive: true
    },
    {
        title: "Product Design Manager",
        description: "Bridge the gap between design and engineering. You will lead the design strategy for our Talent Intelligence platform, ensuring a premium user experience across all modules. Must have experience with Figma and React design systems.",
        requiredSkills: ["Figma", "UI/UX Design", "Design Systems", "Prototyping", "User Research"],
        isActive: true
    }
];

async function seed() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        // Clear existing jobs (Optional, but user wanted a fresh start)
        // console.log("Cleaning existing jobs...");
        // await Job.deleteMany({});

        console.log("Seeding jobs...");
        for (const jobData of JOBS) {
            const exists = await Job.findOne({ title: jobData.title });
            if (!exists) {
                await Job.create(jobData);
                console.log(`Created: ${jobData.title}`);
            } else {
                console.log(`Skipped (exists): ${jobData.title}`);
            }
        }

        console.log("Seeding complete!");
        process.exit(0);
    } catch (err) {
        console.error("Seed failed:", err);
        process.exit(1);
    }
}

seed();
