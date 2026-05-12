const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        requiredSkills: { type: [String], default: [] },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

jobSchema.index({ isActive: 1, title: 1 });

module.exports = mongoose.models.Job || mongoose.model('Job', jobSchema);
