import { Router } from 'express';
import auth from '../middleware/auth.js';
import Template from '../models/Template.js';

const router = Router();

// List templates
router.get('/', auth, async (req, res) => {
    try {
        const { category } = req.query;
        const filter = { userId: req.user.id };
        if (category) filter.category = category;

        const templates = await Template.find(filter).sort({ updatedAt: -1 });
        res.json({ templates });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// Get template
router.get('/:id', auth, async (req, res) => {
    try {
        const template = await Template.findOne({ _id: req.params.id, userId: req.user.id });
        if (!template) return res.status(404).json({ error: 'Template not found' });
        res.json({ template });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch template' });
    }
});

// Create template
router.post('/', auth, async (req, res) => {
    try {
        const template = new Template({ ...req.body, userId: req.user.id });
        await template.save();
        res.status(201).json({ template });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create template' });
    }
});

// Update template
router.put('/:id', auth, async (req, res) => {
    try {
        const template = await Template.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            req.body,
            { new: true }
        );
        if (!template) return res.status(404).json({ error: 'Template not found' });
        res.json({ template });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update template' });
    }
});

// Delete template
router.delete('/:id', auth, async (req, res) => {
    try {
        await Template.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        res.json({ message: 'Template deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

export default router;
