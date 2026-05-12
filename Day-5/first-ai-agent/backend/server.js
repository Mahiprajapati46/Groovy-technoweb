require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectMongo, mongoose } = require('./db');
const { requireHr } = require('./middleware/requireHr');

// Routes
const authRoutes = require('./routes/auth');
const agentRoutes = require('./routes/agent');
const applicationRoutes = require('./routes/applications');
const { Job, Application } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Test route
app.get('/', (req, res) => res.send('HR-Pulse Autonomous Backend is LIVE!'));

/** MongoDB Health Check */
app.get('/api/health/db', async (_req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ ok: false, error: 'MongoDB not connected' });
        }
        await mongoose.connection.db.admin().command({ ping: 1 });
        res.json({ ok: true, ping: 'ok', database: mongoose.connection.name });
    } catch (err) {
        res.status(503).json({ ok: false, error: err.message });
    }
});

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/applications', applicationRoutes);

/** Job Management */
app.get('/api/jobs', requireHr, async (req, res) => {
    try {
        const jobs = await Job.find().sort({ createdAt: -1 }).lean();
        // Add application count for each job
        const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
            const count = await Application.countDocuments({ job: job._id });
            return { ...job, appCount: count };
        }));
        res.json(jobsWithCounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/jobs', requireHr, async (req, res) => {
    try {
        const { title, description, requiredSkills } = req.body;
        if (!title) return res.status(400).json({ error: "Job title is required" });
        const job = await Job.create({
            title,
            description: description || '',
            requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : []
        });
        res.status(201).json(job);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/jobs/:id', requireHr, async (req, res) => {
    try {
        await Job.findByIdAndDelete(req.params.id);
        // Optional: Delete associated applications
        await Application.deleteMany({ job: req.params.id });
        res.json({ ok: true, message: "Job and associated applications deleted." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/** Dashboard Stats (Intelligence Data) */
app.get('/api/stats', requireHr, async (req, res) => {
    try {
        const [jobCount, appCount, pendingCount, sentCount, rejectedCount] = await Promise.all([
            Job.countDocuments({ isActive: true }),
            Application.countDocuments(),
            Application.countDocuments({ status: 'pending_send' }),
            Application.countDocuments({ status: 'sent' }),
            Application.countDocuments({ status: 'rejected' })
        ]);

        const recentApps = await Application.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('job', 'title')
            .select('candidateName candidateEmail status createdAt analysis.overallScore job');

        const topCandidates = await Application.find({ 'analysis.overallScore': { $exists: true } })
            .sort({ 'analysis.overallScore': -1 })
            .limit(3)
            .populate('job', 'title')
            .select('candidateName candidateEmail analysis.overallScore status job');

        // Pipeline stats
        const pipeline = {
            total: appCount,
            shortlisted: pendingCount,
            invited: sentCount,
            rejected: rejectedCount,
            analyzed: await Application.countDocuments({ status: 'analyzed' })
        };

        res.json({
            jobCount,
            appCount,
            pendingCount,
            sentCount,
            recentApps,
            topCandidates,
            pipeline
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/** Legacy/Compatibility route for local fake resumes */
app.get('/api/fake-resumes', requireHr, (req, res) => {
    const fs = require('fs');
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) return res.json([]);
    const files = fs.readdirSync(dataDir);
    const resumes = files.map(file => ({
        name: file,
        content: fs.readFileSync(path.join(dataDir, file), 'utf-8')
    }));
    res.json(resumes);
});

const PORT = Number(process.env.PORT) || 5001;

async function start() {
    try {
        await connectMongo();
        console.log(`MongoDB: connected (${mongoose.connection.name})`);
        app.listen(PORT, () => console.log(`HR-Pulse server on port ${PORT}`));
    } catch (err) {
        console.error('MongoDB connection failed:', err.message);
        process.exit(1);
    }
}

start();
