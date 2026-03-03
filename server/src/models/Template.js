import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    subject: { type: String, default: '' },
    htmlBody: { type: String, default: '' },
    plainBody: { type: String, default: '' },
    category: {
        type: String,
        enum: ['cold-outreach', 'follow-up', 'newsletter', 'transactional', 'custom'],
        default: 'custom',
    },
    tags: [String],
}, {
    timestamps: true,
});

const Template = mongoose.model('Template', templateSchema);

export default Template;
