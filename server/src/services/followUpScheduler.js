import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import FollowUpSequence from '../models/FollowUpSequence.js';
import EmailLog from '../models/EmailLog.js';
import GmailAccount from '../models/GmailAccount.js';
import TrackingEvent from '../models/TrackingEvent.js';
import { replyViaScript } from './gmailScript.js';
import env from '../config/env.js';

/**
 * Check if a recipient has replied to the original email thread.
 * We check tracking events for 'reply' type, or check if the
 * campaign recipient status is 'replied'.
 */
const hasRecipientReplied = async (originalEmailLogId, recipientEmail, userId) => {
    // Check tracking events for reply
    const replyEvent = await TrackingEvent.findOne({
        emailLogId: originalEmailLogId,
        type: 'reply',
    });
    if (replyEvent) return true;

    // Also check if any email log from the recipient shows a reply
    const originalLog = await EmailLog.findById(originalEmailLogId);
    if (!originalLog) return false;

    // If the original email's campaign has this recipient marked as 'replied'
    if (originalLog.campaignId) {
        const Campaign = (await import('../models/Campaign.js')).default;
        const campaign = await Campaign.findById(originalLog.campaignId);
        if (campaign) {
            const recipient = campaign.recipients.find(
                r => r.email.toLowerCase() === recipientEmail.toLowerCase()
            );
            if (recipient && recipient.status === 'replied') return true;
        }
    }

    return false;
};

/**
 * Process a single follow-up sequence: send the next follow-up email.
 */
const processSequence = async (sequence) => {
    try {
        // 1. Check if recipient has replied → auto-stop
        const replied = await hasRecipientReplied(
            sequence.originalEmailLogId,
            sequence.recipientEmail,
            sequence.userId
        );

        if (replied) {
            sequence.status = 'stopped_reply';
            await sequence.save();
            console.log(`🛑 Follow-up stopped (reply detected): ${sequence.recipientEmail}`);
            return;
        }

        // 2. Get the Gmail account
        const account = await GmailAccount.findById(sequence.accountId);
        if (!account || !account.isActive) {
            console.warn(`⚠ Follow-up skipped (account unavailable): ${sequence.recipientEmail}`);
            return; // Don't fail the sequence, just skip this cycle
        }

        // 3. Check daily limit
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastReset = new Date(account.lastResetDate);
        lastReset.setHours(0, 0, 0, 0);
        if (lastReset < today) {
            account.dailySentCount = 0;
            account.lastResetDate = new Date();
            await account.save();
        }
        if (account.dailySentCount >= account.dailyLimit) {
            console.warn(`⚠ Follow-up delayed (daily limit): ${sequence.recipientEmail}`);
            return; // Will be retried on next scheduler cycle
        }

        // 4. Build the tracked follow-up email
        const trackingId = uuidv4();
        const trackingPixel = `<img src="${env.SERVER_URL}/t/${trackingId}/open" width="1" height="1" style="display:none" alt="" />`;
        let trackedHtml = sequence.followUpTemplate.replace(
            /href="(https?:\/\/[^"]+)"/g,
            (match, url) => `href="${env.SERVER_URL}/t/${trackingId}/click?url=${encodeURIComponent(url)}"`
        );
        trackedHtml += trackingPixel;

        const plainBody = sequence.followUpTemplate
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<[^>]+>/g, '')
            .trim();

        // 5. Create email log
        const followUpLog = new EmailLog({
            contactId: (await EmailLog.findById(sequence.originalEmailLogId))?.contactId,
            accountId: account._id,
            userId: sequence.userId,
            to: sequence.recipientEmail,
            subject: `Re: ${sequence.originalSubject.replace(/^Re:\s*/i, '')}`,
            trackingId,
            status: 'queued',
            isFollowUp: true,
            followUpIndex: sequence.sentCount + 1,
        });
        await followUpLog.save();

        // 6. Send via Google Apps Script (threaded reply)
        const result = await replyViaScript(account.scriptUrl, {
            to: sequence.recipientEmail,
            originalSubject: sequence.originalSubject,
            htmlBody: trackedHtml,
            plainBody,
            displayName: account.displayName || account.email,
        });

        // 7. Update email log
        followUpLog.status = 'sent';
        followUpLog.sentAt = new Date();
        followUpLog.messageId = result.messageId;
        await followUpLog.save();

        // 8. Update account stats
        account.dailySentCount += 1;
        account.totalSent += 1;
        await account.save();

        // 9. Update the sequence
        sequence.sentCount += 1;
        sequence.history.push({
            sentAt: new Date(),
            trackingId,
            emailLogId: followUpLog._id,
            status: 'sent',
        });

        if (sequence.sentCount >= sequence.maxFollowUps) {
            sequence.status = 'completed';
            console.log(`✅ Follow-up sequence completed: ${sequence.recipientEmail} (${sequence.sentCount}/${sequence.maxFollowUps})`);
        } else {
            // Schedule the next follow-up
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + sequence.intervalDays);
            sequence.nextSendAt = nextDate;
            console.log(`📧 Follow-up #${sequence.sentCount} sent to ${sequence.recipientEmail} — next in ${sequence.intervalDays} days`);
        }

        await sequence.save();

    } catch (error) {
        console.error(`✗ Follow-up failed for ${sequence.recipientEmail}:`, error.message);

        // Log the failure in history
        sequence.history.push({
            sentAt: new Date(),
            status: 'failed',
            error: error.message,
        });
        await sequence.save();
    }
};

/**
 * Main scheduler tick: find all due sequences and process them.
 */
const runScheduler = async () => {
    try {
        const now = new Date();
        const dueSequences = await FollowUpSequence.find({
            status: 'active',
            nextSendAt: { $lte: now },
        });

        if (dueSequences.length === 0) return;

        console.log(`⏰ Follow-up scheduler: ${dueSequences.length} sequence(s) due`);

        for (const sequence of dueSequences) {
            await processSequence(sequence);
            // Small delay between sends
            await new Promise(r => setTimeout(r, 1000));
        }
    } catch (error) {
        console.error('✗ Follow-up scheduler error:', error.message);
    }
};

/**
 * Start the follow-up scheduler cron job.
 * Runs every 15 minutes to check for due follow-ups.
 */
export const startFollowUpScheduler = () => {
    // Run every 15 minutes
    cron.schedule('*/15 * * * *', () => {
        runScheduler();
    });

    console.log('✓ Follow-up scheduler started (checks every 15 min)');

    // Also run once immediately on startup (after a short delay)
    setTimeout(() => runScheduler(), 5000);
};
