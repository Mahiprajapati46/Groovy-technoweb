const mongoose = require('mongoose');

const APPLICATION_STATUSES = ['draft', 'analyzed', 'pending_send', 'sent', 'rejected'];

const applicationSchema = new mongoose.Schema(
    {
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
            required: true,
            index: true
        },
        candidateEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        candidateName: { type: String, default: '' },
        resumeText: { type: String, default: '' },
        extractedText: { type: String, default: '' },
        originalFileName: { type: String, default: '' },
        fileStoragePath: { type: String, default: '' },
        analysis: { type: mongoose.Schema.Types.Mixed, default: null },
        emailSubject: { type: String, default: '' },
        emailDraft: { type: String, default: '' },
        status: {
            type: String,
            enum: APPLICATION_STATUSES,
            default: 'draft',
            index: true
        },
        sentAt: { type: Date, default: null }
    },
    { timestamps: true }
);

applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ candidateEmail: 1 });
applicationSchema.index({ createdAt: -1 });

module.exports =
    mongoose.models.Application || mongoose.model('Application', applicationSchema);
