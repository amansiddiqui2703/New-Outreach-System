import { Router } from 'express';
import auth from '../middleware/auth.js';
import FollowUpSequence from '../models/FollowUpSequence.js';
import EmailLog from '../models/EmailLog.js';
import GmailAccount from '../models/GmailAccount.js';

const router = Router();

// Create a new follow-up sequence
router.post('/', auth, async (req, res) => {
    try {
        const { originalEmailLogId, followUpTemplate, intervalDays, maxFollowUps } = req.body;

        if (!originalEmailLogId || !followUpTemplate) {
            return res.status(400).json({ error: 'Original email and follow-up template are required' });
        }

        const interval = Number(intervalDays) || 3;
        if (interval < 2 || interval > 5) {
            return res.status(400).json({ error: 'Interval must be between 2 and 5 days' });
        }

        const max = Math.min(Math.max(Number(maxFollowUps) || 4, 1), 4);

        // Find the original email
        const originalEmail = await EmailLog.findOne({ _id: originalEmailLogId, userId: req.user.id });
        if (!originalEmail) {
            return res.status(404).json({ error: 'Original email not found' });
        }

        // Verify account exists and is active
        const account = await GmailAccount.findOne({ _id: originalEmail.accountId, userId: req.user.id, isActive: true });
        if (!account) {
            return res.status(400).json({ error: 'Gmail account used for this email is no longer available' });
        }

        // Check if a sequence already exists for this email
        const existing = await FollowUpSequence.findOne({
            originalEmailLogId,
            userId: req.user.id,
            status: { $in: ['active', 'paused'] },
        });
        if (existing) {
            return res.status(409).json({ error: 'A follow-up sequence already exists for this email' });
        }

        // Calculate first follow-up date
        const nextSendAt = new Date();
        nextSendAt.setDate(nextSendAt.getDate() + interval);

        const sequence = new FollowUpSequence({
            userId: req.user.id,
            originalEmailLogId,
            accountId: account._id,
            recipientEmail: originalEmail.to,
            originalSubject: originalEmail.subject,
            followUpTemplate,
            intervalDays: interval,
            maxFollowUps: max,
            nextSendAt,
        });

        await sequence.save();

        res.status(201).json({
            message: `Follow-up sequence created. First follow-up scheduled in ${interval} days.`,
            sequence,
        });
    } catch (error) {
        console.error('Create follow-up error:', error);
        res.status(500).json({ error: 'Failed to create follow-up sequence' });
    }
});

// Get all sequences for the current user
router.get('/', auth, async (req, res) => {
    try {
        const { status } = req.query;
        const filter = { userId: req.user.id };
        if (status) filter.status = status;

        const sequences = await FollowUpSequence.find(filter)
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({ sequences });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sequences' });
    }
});

// Get sent emails (for selecting which email to set up follow-ups for)
router.get('/sent-emails', auth, async (req, res) => {
    try {
        const emails = await EmailLog.find({
            userId: req.user.id,
            status: 'sent',
            isFollowUp: false,
        })
            .sort({ sentAt: -1 })
            .limit(100)
            .select('to subject sentAt trackingId accountId');

        res.json({ emails });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sent emails' });
    }
});

// Pause a sequence
router.put('/:id/pause', auth, async (req, res) => {
    try {
        const sequence = await FollowUpSequence.findOne({ _id: req.params.id, userId: req.user.id });
        if (!sequence) return res.status(404).json({ error: 'Sequence not found' });
        if (sequence.status !== 'active') {
            return res.status(400).json({ error: 'Can only pause active sequences' });
        }

        sequence.status = 'paused';
        await sequence.save();
        res.json({ message: 'Sequence paused', sequence });
    } catch (error) {
        res.status(500).json({ error: 'Failed to pause sequence' });
    }
});

// Resume a paused sequence
router.put('/:id/resume', auth, async (req, res) => {
    try {
        const sequence = await FollowUpSequence.findOne({ _id: req.params.id, userId: req.user.id });
        if (!sequence) return res.status(404).json({ error: 'Sequence not found' });
        if (sequence.status !== 'paused') {
            return res.status(400).json({ error: 'Can only resume paused sequences' });
        }

        // Recalculate next send date from now
        const nextSendAt = new Date();
        nextSendAt.setDate(nextSendAt.getDate() + sequence.intervalDays);
        sequence.nextSendAt = nextSendAt;
        sequence.status = 'active';
        await sequence.save();
        res.json({ message: 'Sequence resumed', sequence });
    } catch (error) {
        res.status(500).json({ error: 'Failed to resume sequence' });
    }
});

// Delete/cancel a sequence
router.delete('/:id', auth, async (req, res) => {
    try {
        const sequence = await FollowUpSequence.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!sequence) return res.status(404).json({ error: 'Sequence not found' });
        res.json({ message: 'Sequence deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete sequence' });
    }
});

export default router;
