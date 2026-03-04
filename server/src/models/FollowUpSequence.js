import mongoose from 'mongoose';

const followUpHistorySchema = new mongoose.Schema({
    sentAt: { type: Date, required: true },
    trackingId: String,
    emailLogId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailLog' },
    status: {
        type: String,
        enum: ['sent', 'failed'],
        default: 'sent',
    },
    error: String,
}, { _id: true });

const followUpSequenceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    originalEmailLogId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmailLog',
        required: true,
    },
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GmailAccount',
        required: true,
    },
    recipientEmail: {
        type: String,
        required: true,
    },
    originalSubject: {
        type: String,
        required: true,
    },
    followUpTemplate: {
        type: String,
        required: true,
    },
    intervalDays: {
        type: Number,
        required: true,
        min: 2,
        max: 5,
        default: 3,
    },
    maxFollowUps: {
        type: Number,
        default: 4,
        min: 1,
        max: 4,
    },
    sentCount: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'stopped_reply', 'paused'],
        default: 'active',
    },
    nextSendAt: {
        type: Date,
        required: true,
    },
    history: [followUpHistorySchema],
}, {
    timestamps: true,
});

followUpSequenceSchema.index({ userId: 1, status: 1 });
followUpSequenceSchema.index({ status: 1, nextSendAt: 1 });

const FollowUpSequence = mongoose.model('FollowUpSequence', followUpSequenceSchema);

export default FollowUpSequence;
