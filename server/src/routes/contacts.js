import { Router } from 'express';
import multer from 'multer';
import auth from '../middleware/auth.js';
import Contact from '../models/Contact.js';
import Suppression from '../models/Suppression.js';
import { parseCSV, deduplicateByEmail } from '../utils/csv.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// List contacts
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 50, search, tag, source } = req.query;
        const filter = { userId: req.user.id };
        if (search) filter.$or = [
            { email: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } },
        ];
        if (tag) filter.tags = tag;
        if (source) filter.source = source;

        const contacts = await Contact.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Contact.countDocuments(filter);

        res.json({ contacts, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});

// Create contact
router.post('/', auth, async (req, res) => {
    try {
        const { email, name, company, customFields, tags } = req.body;
        const cleanEmail = (email || '').trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
            return res.status(400).json({ error: 'Please enter a valid email address' });
        }

        const contact = new Contact({ userId: req.user.id, email: cleanEmail, name, company, customFields, tags, source: 'manual' });
        await contact.save();
        res.status(201).json({ contact });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ error: 'This contact already exists' });
        res.status(500).json({ error: 'Failed to create contact' });
    }
});

// Upload CSV
router.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const rows = await parseCSV(req.file.buffer);
        const deduplicated = deduplicateByEmail(rows);

        let imported = 0;
        let skipped = 0;
        const errors = [];

        for (const row of deduplicated) {
            const email = (row.email || row.Email || row.EMAIL || '').toLowerCase().trim();
            if (!email || !email.includes('@') || !email.includes('.')) { skipped++; continue; }

            // Check suppression
            const suppressed = await Suppression.findOne({ userId: req.user.id, email });
            if (suppressed) { skipped++; continue; }

            try {
                await Contact.findOneAndUpdate(
                    { userId: req.user.id, email },
                    {
                        userId: req.user.id,
                        email,
                        name: row.name || row.Name || row.NAME || '',
                        company: row.company || row.Company || row.COMPANY || '',
                        source: 'csv',
                        customFields: Object.fromEntries(
                            Object.entries(row).filter(([k]) =>
                                !['email', 'name', 'company'].includes(k.toLowerCase())
                            )
                        ),
                    },
                    { upsert: true, new: true }
                );
                imported++;
            } catch (err) {
                errors.push({ email, error: err.message });
            }
        }

        res.json({ imported, skipped, errors: errors.length, total: rows.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to import contacts' });
    }
});

// Bulk paste
router.post('/bulk', auth, async (req, res) => {
    try {
        const { emails } = req.body; // array of { email, name?, company? }
        if (!Array.isArray(emails)) return res.status(400).json({ error: 'Emails array required' });

        let imported = 0;
        for (const item of emails) {
            const email = (typeof item === 'string' ? item : item.email || '').toLowerCase().trim();
            if (!email || !email.includes('@') || !email.includes('.')) continue;

            await Contact.findOneAndUpdate(
                { userId: req.user.id, email },
                {
                    userId: req.user.id,
                    email,
                    name: item.name || '',
                    company: item.company || '',
                    source: 'manual',
                },
                { upsert: true }
            );
            imported++;
        }

        res.json({ imported });
    } catch (error) {
        res.status(500).json({ error: 'Failed to import contacts' });
    }
});

// Get single contact with full timeline
router.get('/:id', auth, async (req, res) => {
    try {
        const contact = await Contact.findOne({ _id: req.params.id, userId: req.user.id }).lean();
        if (!contact) return res.status(404).json({ error: 'Contact not found' });

        // Fetch all email logs for this specific email address for this user
        const { EmailLog, TrackingEvent } = await import('../models/index.js').catch(async () => {
            // Fallback if index.js doesn't export them correctly yet
            const el = await import('../models/EmailLog.js');
            const te = await import('../models/TrackingEvent.js');
            return { EmailLog: el.default, TrackingEvent: te.default };
        });

        const emails = await EmailLog.find({ userId: req.user.id, to: contact.email }).lean();

        // Fetch all tracking events related to these emails
        const trackingIds = emails.map(e => e.trackingId).filter(Boolean);
        const trackingEvents = trackingIds.length > 0
            ? await TrackingEvent.find({ trackingId: { $in: trackingIds } }).lean()
            : [];

        // Build the unified timeline
        const timeline = [];

        // Add contact creation as the first event
        timeline.push({
            id: `create-${contact._id}`,
            type: 'contact_created',
            title: `Contact added via ${contact.source}`,
            timestamp: contact.createdAt,
            data: contact
        });

        // Add email send events
        for (const email of emails) {
            timeline.push({
                id: `email-${email._id}`,
                type: 'email_sent',
                title: `Sent: ${email.subject || 'No Subject'}`,
                timestamp: email.sentAt || email.createdAt,
                data: email,
                trackingId: email.trackingId
            });
        }

        // Add tracking events (opens, clicks, bounces, etc)
        for (const event of trackingEvents) {
            timeline.push({
                id: `track-${event._id}`,
                type: `tracking_${event.type}`, // tracking_open, tracking_click, etc.
                title: `${event.type.charAt(0).toUpperCase() + event.type.slice(1)} tracked`,
                timestamp: event.createdAt,
                data: event,
                trackingId: event.trackingId
            });
        }

        // Sort by timestamp descending (newest first)
        timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({ contact, timeline });
    } catch (error) {
        console.error('Contact detail error:', error);
        res.status(500).json({ error: 'Failed to fetch contact details' });
    }
});

// Update contact
router.put('/:id', auth, async (req, res) => {
    try {
        const contact = await Contact.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            req.body,
            { new: true }
        );
        if (!contact) return res.status(404).json({ error: 'Contact not found' });
        res.json({ contact });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update contact' });
    }
});

// GDPR delete
router.delete('/:id', auth, async (req, res) => {
    try {
        const contact = await Contact.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!contact) return res.status(404).json({ error: 'Contact not found' });
        res.json({ message: 'Contact permanently deleted (GDPR)' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete contact' });
    }
});

// Export CSV
router.get('/export', auth, async (req, res) => {
    try {
        const contacts = await Contact.find({ userId: req.user.id }).lean();
        const csvData = contacts.map(c => ({
            email: c.email,
            name: c.name,
            company: c.company,
            source: c.source,
            tags: (c.tags || []).join(';'),
        }));

        const headers = 'email,name,company,source,tags\n';
        const rows = csvData.map(c => `${c.email},${c.name},${c.company},${c.source},${c.tags}`).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
        res.send(headers + rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to export contacts' });
    }
});

export default router;
