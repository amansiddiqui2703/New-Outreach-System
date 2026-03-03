import { Router } from 'express';
import multer from 'multer';
import auth from '../middleware/auth.js';
import { crawlDomain, crawlDomains } from '../services/crawler.js';
import { parseCSV } from '../utils/csv.js';
import Contact from '../models/Contact.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Search single domain
router.post('/search', auth, async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain) return res.status(400).json({ error: 'Domain required' });

        const result = await crawlDomain(domain);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

// Search multiple domains
router.post('/search-bulk', auth, async (req, res) => {
    try {
        const { domains } = req.body;
        if (!Array.isArray(domains) || !domains.length) {
            return res.status(400).json({ error: 'Domains array required' });
        }

        const results = await crawlDomains(domains.slice(0, 50)); // max 50
        res.json({ results });
    } catch (error) {
        res.status(500).json({ error: 'Bulk search failed' });
    }
});

// Search from CSV
router.post('/search-csv', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const rows = await parseCSV(req.file.buffer);
        const domains = rows
            .map(r => r.domain || r.Domain || r.website || r.Website || r.url || r.URL || '')
            .filter(Boolean);

        if (!domains.length) return res.status(400).json({ error: 'No domains found in CSV' });

        const results = await crawlDomains(domains.slice(0, 50));
        res.json({ results });
    } catch (error) {
        res.status(500).json({ error: 'CSV search failed' });
    }
});

// Add found emails to contacts
router.post('/add-to-contacts', auth, async (req, res) => {
    try {
        const { emails } = req.body; // array of { email, domain }
        if (!Array.isArray(emails)) return res.status(400).json({ error: 'Emails array required' });

        let added = 0;
        for (const item of emails) {
            try {
                await Contact.findOneAndUpdate(
                    { userId: req.user.id, email: item.email.toLowerCase() },
                    {
                        userId: req.user.id,
                        email: item.email.toLowerCase(),
                        company: item.domain || '',
                        source: 'finder',
                    },
                    { upsert: true }
                );
                added++;
            } catch { /* skip duplicates */ }
        }

        res.json({ added });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add contacts' });
    }
});

export default router;
