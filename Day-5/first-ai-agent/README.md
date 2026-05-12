# HR-Pulse: AI-Powered Talent Intelligence Platform

HR-Pulse is an enterprise-grade applicant tracking and intelligence system that leverages AI agents to autonomously audit, score, and communicate with candidates.

## 🚀 Key Features

- **Autonomous AI Agent**: Automatically reviews resumes, calculates talent scores (0-100%), and drafts professional emails.
- **Job-Specific Intelligence**: Define granular job roles with skills and descriptions to guide the AI.
- **Real-time Dashboard**: Monitor your hiring pipeline, top talent picks, and agent activity in one place.
- **Automated Communication**: Integrated Nodemailer support for sending Selection and Rejection notices using professional Master Templates.
- **Privacy First**: Sensitive data and candidate resumes are excluded from version control.

## 🛠 Tech Stack

- **Frontend**: React.js, Vite, Vanilla CSS (Glassmorphism UI)
- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **AI Engine**: Groq SDK (Llama 3.1)
- **Mail Service**: Nodemailer

## 🔧 Installation & Setup

### 1. Prerequisites
- Node.js installed
- MongoDB running locally or on Atlas

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Update .env with your GROQ_API_KEY and SMTP credentials
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Initial Seeding
To populate the platform with professional job openings:
```bash
cd backend/scripts
node seed.js
```

## 🔒 Security
Ensure your `.env` file is never committed. A `.env.example` is provided for reference. Candidate resumes are stored in `backend/uploads/` which is ignored by Git.

---
Built with ❤️ for HR Professionals.
