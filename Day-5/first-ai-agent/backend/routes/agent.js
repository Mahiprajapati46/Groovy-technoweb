const express = require('express');
const router = express.Router();
const { requireHr } = require('../middleware/requireHr');
const { analyzeResumeText } = require('../lib/ai');

/** Trigger an autonomous agent run */
router.post('/run', requireHr, async (req, res) => {
    const { task, jobId } = req.body;
    
    let taskName = task || 'Autonomous Talent Pipeline Audit';
    
    if (jobId) {
        const targetJob = await AgentRun.findById(jobId);
        if (targetJob) {
            taskName = `Job Audit: ${targetJob.title}`;
        }
    }

    const run = await AgentRun.create({
        task: taskName,
        startedBy: req.hrUser._id,
        logs: [{ message: `Agent waking up. Target: ${taskName}` }]
    });

    // Run the agent logic in the "background"
    processApplications(run._id, jobId).catch(err => {
        console.error("Agent process failed:", err);
    });

    res.json({ ok: true, runId: run._id, message: "Autonomous agent run started." });
});

router.get('/runs', requireHr, async (req, res) => {
    try {
        const runs = await AgentRun.find({ startedBy: req.hrUser._id }).sort({ createdAt: -1 }).limit(10);
        res.json(runs);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/runs', requireHr, async (req, res) => {
    try {
        await AgentRun.deleteMany({ startedBy: req.hrUser._id });
        res.json({ ok: true, message: "Agent history cleared." });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

async function processApplications(runId, jobId = null) {
    const run = await AgentRun.findById(runId);
    if (!run) {
        console.error("Run not found:", runId);
        return;
    }
    try {
        // Find applications that need processing
        let query = {};
        if (jobId) {
            // For specific job runs, we analyze ALL candidates (including rejected ones) to get fresh scores
            query.job = jobId;
        } else {
            // For global runs, we only process new or pending ones to save tokens
            query.status = { $in: ['draft', 'analyzed', 'pending_send'] };
        }

        let targetLabel = 'all jobs';
        if (jobId) {
            const j = await AgentRun.findById(jobId);
            if (j) targetLabel = `Job ${j.title}`;
        }
        
        const apps = await Application.find(query);
        
        run.logs.push({ message: `Found ${apps.length} applications to review for ${targetLabel}.` });
        await run.save();

        let processed = 0;
        for (const app of apps) {
            run.logs.push({ message: `Reviewing candidate: ${app.candidateEmail}` });
            
            // 1. Analysis (Force re-analysis if jobId is provided or analysis is missing)
            if (!app.analysis || jobId) {
                run.logs.push({ message: `Analyzing resume for ${app.candidateEmail}...` });
                try {
                    app.analysis = await analyzeResumeText(app.resumeText, {
                        title: '',
                        description: '',
                        skills: []
                    });
                    app.candidateName = app.analysis.candidateName || app.candidateName;
                    app.emailSubject = app.analysis.emailSubject || '';
                    app.emailDraft = app.analysis.emailBody || '';
                    // Reset status to analyzed so decision logic can re-run
                    if (app.status === 'draft') app.status = 'analyzed';
                    await app.save();
                } catch (aiErr) {
                    run.logs.push({ message: `AI Analysis failed for ${app.candidateEmail}: ${aiErr.message}`, level: 'error' });
                    continue;
                }
            }

            // 2. Autonomous Decision Logic (Controlled)
            const score = app.analysis.overallScore || 0;
            
            if (score >= 85) {
                // Prepare Draft, but wait for HR permission
                if (app.status !== 'pending_send') {
                    app.status = 'pending_send';
                    run.results.actionsTaken.push(`DRAFT READY: ${app.candidateEmail} (Score: ${score}%)`);
                    run.logs.push({ message: `High match (${score}%). I've drafted an invite for your review.` });
                }
            } else if (score < 30) {
                // Auto-Reject (Archived for review)
                if (app.status !== 'rejected') {
                    app.status = 'rejected';
                    run.results.actionsTaken.push(`AUTO-REJECTED: ${app.candidateEmail} (Score: ${score}%)`);
                    run.logs.push({ message: `Low relevance (${score}%). Profile archived automatically.` });
                }
            } else {
                // Normal Review Needed
                app.status = 'analyzed';
                run.logs.push({ message: `Candidate ${app.candidateEmail} (Score: ${score}%) requires manual check.` });
            }

            await app.save();
            processed++;
            run.results.processedCount = processed;
            await run.save();
        }

        run.status = 'completed';
        run.logs.push({ message: "Agent run completed successfully. Pipeline updated." });
        await run.save();
    } catch (error) {
        run.status = 'failed';
        run.logs.push({ message: `CRITICAL ERROR: ${error.message}`, level: 'error' });
        await run.save();
    }
}

module.exports = router;