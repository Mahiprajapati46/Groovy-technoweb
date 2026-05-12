const mongoose = require('mongoose');

const hrUserSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        passwordHash: { type: String, required: true },
        name: { type: String, default: '' },
        role: { type: String, default: 'hr' }
    },
    { timestamps: true, collection: 'hr_users' }
);

module.exports = mongoose.models.HrUser || mongoose.model('HrUser', hrUserSchema);
