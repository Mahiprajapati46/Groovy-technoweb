/**
 * Step 2 smoke test: connect, create Job + Application, assert count, cleanup.
 * Run from backend folder: npm run seed:smoke
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { connectMongo } = require('../db');
const { Job, Application } = require('../models');

async function main() {
    await connectMongo();

    const job = await Job.create({
        title: 'Smoke Test Job',
        description: 'Temporary row for Step 2 verification',
        requiredSkills: ['node'],
        isActive: true
    });

    const application = await Application.create({
        job: job._id,
        candidateEmail: 'smoke@example.com',
        candidateName: 'Smoke Candidate',
        resumeText: 'Node.js developer',
        status: 'draft',
        emailDraft: ''
    });

    const count = await Application.countDocuments({ job: job._id });
    if (count !== 1) {
        throw new Error(`Expected 1 application for job, got ${count}`);
    }

    console.log('OK: Job', job._id.toString(), 'Application', application._id.toString());

    await Application.deleteOne({ _id: application._id });
    await Job.deleteOne({ _id: job._id });
    console.log('Cleaned up smoke test documents.');
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
