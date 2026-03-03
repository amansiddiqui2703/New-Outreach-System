import mongoose from 'mongoose';

const suppressionSchema = new mongoose.Schema({
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
    reason: {
        type: String,
        enum: ['unsubscribe', 'bounce', 'manual', 'complaint'],
        default: 'manual',
    },
}, {
    timestamps: true,
});

suppressionSchema.index({ userId: 1, email: 1 }, { unique: true });

const Suppression = mongoose.model('Suppression', suppressionSchema);

export default Suppression;
