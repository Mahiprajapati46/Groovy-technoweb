const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParser = require('pdf-parse');
const { requireHr } = require('../middleware/requireHr');
const { Application } = require('../models');
const { analyzeResumeText } = require('../lib/ai');
const { sendEmail } = require('../lib/mailer');

const upload = multer({
    dest: path.join(__dirname, '../uploads/'),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/** List all applications */
router.get('/', requireHr, async (req, res) => {
    try {
        const apps = await Application.find().populate('job', 'title').sort({ createdAt: -1 });
        res.json(apps);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/** Create Application with Text */
router.post('/', requireHr, async (req, res) => {
    try {
        const { email, resumeText, jobId } = req.body;
        if (!email || !resumeText) {
            return res.status(400).json({ error: "Email and Resume Text are required" });
        }

        let targetJobId = jobId;
        if (!targetJobId) {
            const firstJob = await Application.findOne({ isActive: true });
            if (!firstJob) return res.status(400).json({ error: "No active jobs found." });
            targetJobId = firstJob._id;
        }

        const job = await Application.findById(targetJobId);
        const analysis = await analyzeResumeText(resumeText, {
            title: job?.title,
            description: job?.description,
            skills: job?.requiredSkills
        });

        const application = await Application.create({
            job: targetJobId,
            candidateEmail: email.trim().toLowerCase(),
            candidateName: analysis.candidateName || '',
            resumeText: resumeText.trim(),
            analysis,
            emailSubject: analysis.emailSubject || '',
            emailDraft: analysis.emailBody || '',
            status: 'pending_send'
        });

        res.status(201).json(application);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/** Get single application */
router.get('/:id', requireHr, async (req, res) => {
    try {
        const app = await Application.findById(req.params.id);
        if (!app) return res.status(404).json({ error: "Application not found" });
        res.json(app);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/** Upload & Analyze Application */
router.post('/upload', requireHr, upload.single('resume'), async (req, res) => {
    try {
        const { email, jobId } = req.body;
        const file = req.file;

        if (!email) return res.status(400).json({ error: "Candidate email is required" });
        if (!file) return res.status(400).json({ error: "Resume file is required" });

        let targetJobId = jobId;
        if (!targetJobId) {
            const firstJob = await Application.findOne({ isActive: true });
            if (!firstJob) {
                return res.status(400).json({ error: "No active jobs found. Please create a job first." });
            }
            targetJobId = firstJob._id;
        }

        let extractedText = '';
        if (file.mimetype === 'application/pdf') {
            const dataBuffer = fs.readFileSync(file.path);
            const pdfData = await pdfParser(dataBuffer);
            extractedText = pdfData.text;
        } else if (file.mimetype === 'text/plain') {
            extractedText = fs.readFileSync(file.path, 'utf8');
        } else {
            return res.status(400).json({ error: "Unsupported file type. Please upload PDF or TXT." });
        }

        if (!extractedText || !extractedText.trim()) {
            return res.status(400).json({ error: "Could not extract text from the uploaded file." });
        }

        const job = await Application.findById(targetJobId);
        const analysis = await analyzeResumeText(extractedText, {
            title: job?.title,
            description: job?.description,
            skills: job?.requiredSkills
        });

        const application = await Application.create({
            job: targetJobId,
            candidateEmail: email.trim().toLowerCase(),
            candidateName: analysis.candidateName || '',
            resumeText: extractedText.trim(),
            originalFileName: file.originalname,
            fileStoragePath: file.path,
            analysis,
            emailSubject: analysis.emailSubject || '',
            emailDraft: analysis.emailBody || '',
            status: 'pending_send'
        });

        res.status(201).json(application);
    } catch (error) {
        console.error("UPLOAD ERROR:", error);
        res.status(500).json({ error: "Failed to process upload: " + error.message });
    }
});

/** Update Email Draft */
router.patch('/:id/email-draft', requireHr, async (req, res) => {
    try {
        const { emailDraft } = req.body;
        const application = await Application.findById(req.params.id);
        if (!application) return res.status(404).json({ error: "Application not found" });

        application.emailDraft = emailDraft;
        await application.save();
        res.json({ ok: true, emailDraft: application.emailDraft });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/** Bulk Autonomous Upload */
router.post('/bulk-upload', requireHr, upload.array('resumes', 20), async (req, res) => {
    try {
        const { jobId } = req.body;
        const files = req.files;
        if (!files || files.length === 0) return res.status(400).json({ error: "No files provided" });

        let targetJobId = jobId;
        if (!targetJobId) {
            const firstJob = await Application.findOne({ isActive: true });
            if (!firstJob) return res.status(400).json({ error: "No active jobs found." });
            targetJobId = firstJob._id;
        }

        const job = await Application.findById(targetJobId);
        const results = [];
        let successCount = 0;

        for (const file of files) {
            try {
                let text = '';
                if (file.mimetype === 'application/pdf') {
                    const dataBuffer = fs.readFileSync(file.path);
                    const pdfData = await pdfParser(dataBuffer);
                    text = pdfData.text;
                } else {
                    text = fs.readFileSync(file.path, 'utf8');
                }

                if (!text || text.trim().length < 10) {
                    throw new Error("Could not extract meaningful text from file.");
                }

                const analysis = await analyzeResumeText(text, {
                    title: job?.title,
                    description: job?.description,
                    skills: job?.requiredSkills
                });

                const email = analysis.candidateEmail || `no-email-${Date.now()}@example.com`;
                const name = analysis.candidateName || file.originalname;

                await Application.create({
                    job: targetJobId,
                    candidateEmail: email.trim().toLowerCase(),
                    candidateName: name,
                    resumeText: text,
                    analysis,
                    emailSubject: analysis.emailSubject || '',
                    emailDraft: analysis.emailBody || '',
                    status: 'pending_send'
                });
                successCount++;
                results.push({ name: file.originalname, status: 'success' });
            } catch (err) {
                console.error(`Bulk Error [${file.originalname}]:`, err.message);
                results.push({ name: file.originalname, status: 'failed', error: err.message });
            }
        }

        res.json({
            ok: true,
            total: files.length,
            success: successCount,
            failed: files.length - successCount,
            results
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/** Mark as Sent (Mock) */
router.post('/:id/send', requireHr, async (req, res) => {
    try {
        const { emailSubject, emailDraft } = req.body;
        const application = await Application.findById(req.params.id);
        if (!application) return res.status(404).json({ error: "Application not found" });

        if (emailSubject) application.emailSubject = emailSubject;
        if (emailDraft) application.emailDraft = emailDraft;

        // --- REAL SEND VIA NODEMAILER ---
        await sendEmail(application.candidateEmail, application.emailSubject, application.emailDraft);
        // ---------------------------------

        application.status = 'sent';
        application.sentAt = new Date();
        await application.save();

        console.log(`[MOCK SEND] To: ${application.candidateEmail}\nSubject: ${application.emailSubject}\nBody: ${application.emailDraft}`);
        res.json({ ok: true, sentAt: application.sentAt });
    } catch (error) {
    }
});

router.delete('/:id', requireHr, async (req, res) => {
    try {
        const app = await Application.findById(req.params.id);
        if (app) console.log(`[DB] PERMANENTLY DELETING candidate: ${app.candidateEmail}`);
        await Application.findByIdAndDelete(req.params.id);
        res.json({ ok: true, message: "Application deleted permanently." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;