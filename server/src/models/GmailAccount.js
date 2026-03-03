import mongoose from 'mongoose';

const gmailAccountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
    },
    displayName: String,
    scriptUrl: {
        type: String,
        required: true,
    },
    connectionType: {
        type: String,
        default: 'script',
    },
    dailySentCount: {
        type: Number,
        default: 0,
    },
    dailyLimit: {
        type: Number,
        default: 200,
    },
    lastResetDate: {
        type: Date,
        default: Date.now,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    health: {
        type: String,
        enum: ['good', 'warning', 'critical'],
        default: 'good',
    },
    bounceCount: { type: Number, default: 0 },
    totalSent: { type: Number, default: 0 },
}, {
    timestamps: true,
});

gmailAccountSchema.index({ userId: 1, email: 1 }, { unique: true });

const GmailAccount = mongoose.model('GmailAccount', gmailAccountSchema);

export default GmailAccount;
