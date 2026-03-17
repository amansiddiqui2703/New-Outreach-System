import mongoose from 'mongoose';

const stepSchema = new mongoose.Schema({
    stepNumber: { type: Number, required: true },
    delayDays: { type: Number, required: true, default: 0 },
    subject: { type: String, trim: true }, // Optional for follow-ups
    body: { type: String, required: true },
}, { _id: true });

const sequenceSchema = new mongoose.Schema({
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
    steps: [stepSchema],
    isArchived: { type: Boolean, default: false },
}, {
    timestamps: true,
});

sequenceSchema.index({ userId: 1, isArchived: 1 });

const Sequence = mongoose.model('Sequence', sequenceSchema);

export default Sequence;
