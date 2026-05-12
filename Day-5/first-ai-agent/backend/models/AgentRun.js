const mongoose = require('mongoose');

const agentRunSchema = new mongoose.Schema(
    {
        task: { type: String, required: true }, // e.g., "Process Pending Applications"
        status: {
            type: String,
            enum: ['running', 'completed', 'failed'],
            default: 'running'
        },
        logs: [{
            timestamp: { type: Date, default: Date.now },
            message: String,
            level: { type: String, enum: ['info', 'warn', 'error'], default: 'info' }
        }],
        results: {
            processedCount: { type: Number, default: 0 },
            actionsTaken: { type: Array, default: [] }
        },
        startedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'HrUser' }
    },
    { timestamps: true }
);

module.exports = mongoose.models.AgentRun || mongoose.model('AgentRun', agentRunSchema);
