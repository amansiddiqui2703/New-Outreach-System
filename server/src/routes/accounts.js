import { Router } from 'express';
import auth from '../middleware/auth.js';
import GmailAccount from '../models/GmailAccount.js';
import { testScriptConnection } from '../services/gmailScript.js';

const router = Router();

// Connect Gmail via Google Apps Script
router.post('/connect-script', auth, async (req, res) => {
    try {
        const { email, displayName, scriptUrl } = req.body;

        if (!email || !scriptUrl) {
            return res.status(400).json({ error: 'Email and Script URL are required' });
        }

        // Validate the script URL format
        if (!scriptUrl.includes('script.google.com')) {
            return res.status(400).json({ error: 'Invalid Google Apps Script URL' });
        }

        // Test the script connection
        const testResult = await testScriptConnection(scriptUrl);

        // Save the account
        const existing = await GmailAccount.findOne({ userId: req.user.id, email: email.toLowerCase() });

        if (existing) {
            existing.scriptUrl = scriptUrl;
            existing.displayName = displayName || existing.displayName;
            existing.isActive = true;
            existing.health = 'good';
            existing.connectionType = 'script';
            await existing.save();
            return res.json({
                message: 'Account updated successfully',
                account: { ...existing.toObject(), scriptUrl: undefined },
            });
        }

        const account = new GmailAccount({
            userId: req.user.id,
            email: email.toLowerCase(),
            displayName: displayName || email,
            scriptUrl,
            connectionType: 'script',
        });

        await account.save();
        res.json({
            message: 'Gmail account connected via Google Apps Script',
            account: { ...account.toObject(), scriptUrl: undefined },
        });
    } catch (error) {
        console.error('Script connection error:', error);
        res.status(500).json({ error: error.message || 'Failed to connect Gmail account' });
    }
});

// List accounts
router.get('/', auth, async (req, res) => {
    try {
        const accounts = await GmailAccount.find({ userId: req.user.id })
            .select('-scriptUrl');
        res.json({ accounts });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});

// Update account settings
router.patch('/:id', auth, async (req, res) => {
    try {
        const { dailyLimit, isActive } = req.body;
        const account = await GmailAccount.findOne({ _id: req.params.id, userId: req.user.id });
        if (!account) return res.status(404).json({ error: 'Account not found' });

        if (dailyLimit !== undefined) account.dailyLimit = dailyLimit;
        if (isActive !== undefined) account.isActive = isActive;
        await account.save();

        res.json({ account: { ...account.toObject(), scriptUrl: undefined } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update account' });
    }
});

// Disconnect account
router.delete('/:id', auth, async (req, res) => {
    try {
        await GmailAccount.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        res.json({ message: 'Account disconnected' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to disconnect account' });
    }
});

export default router;
