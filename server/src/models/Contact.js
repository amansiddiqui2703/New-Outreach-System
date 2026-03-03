import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    name: { type: String, default: '', trim: true },
    company: { type: String, default: '', trim: true },
    customFields: {
        type: Map,
        of: String,
        default: {},
    },
    tags: [String],
    source: {
        type: String,
        enum: ['csv', 'manual', 'finder', 'api'],
        default: 'manual',
    },
    isUnsubscribed: { type: Boolean, default: false },
    unsubscribedAt: Date,
    lastEmailed: Date,
    emailCount: { type: Number, default: 0 },
}, {
    timestamps: true,
});

contactSchema.index({ userId: 1, email: 1 }, { unique: true });

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;
