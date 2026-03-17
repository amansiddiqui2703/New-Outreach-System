import { Router } from 'express';
import auth from '../middleware/auth.js';
import Project from '../models/Project.js';
import Contact from '../models/Contact.js';
import Campaign from '../models/Campaign.js';
import GmailAccount from '../models/GmailAccount.js';
import { enqueueCampaign } from '../services/queue.js';

const router = Router();

// List all projects
router.get('/', auth, async (req, res) => {
    try {
        const { archived } = req.query;
        const filter = { userId: req.user.id };
        if (archived === 'true') filter.isArchived = true;
        else filter.isArchived = false;

        const projects = await Project.find(filter)
            .sort({ updatedAt: -1 })
            .populate('sequenceId', 'name')
            .lean();

        // Get live stats for each project
        const projectsWithStats = await Promise.all(projects.map(async (p) => {
            const [contactCount, campaignCount] = await Promise.all([
                Contact.countDocuments({ userId: req.user.id, projectId: p._id }),
                Campaign.countDocuments({ userId: req.user.id, projectId: p._id }),
            ]);
            return { ...p, stats: { ...p.stats, contacts: contactCount, campaigns: campaignCount } };
        }));

        res.json(projectsWithStats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Create project
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, color, icon, sequenceId, targetLists } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: 'Project name is required' });

        const project = await Project.create({
            userId: req.user.id,
            name: name.trim(),
            description: description || '',
            color: color || '#435AFF',
            icon: icon || 'folder',
            sequenceId: sequenceId || null,
            targetLists: Array.isArray(targetLists) ? targetLists : [],
        });

        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Get single project with pipeline stats
router.get('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.user.id })
            .populate('sequenceId', 'name steps')
            .lean();
        if (!project) return res.status(404).json({ error: 'Project not found' });

        // Get pipeline stage counts
        const stageCounts = await Contact.aggregate([
            { $match: { userId: project.userId, projectId: project._id } },
            { $group: { _id: '$pipelineStage', count: { $sum: 1 } } },
        ]);

        const pipeline = project.pipelineStages.map(stage => ({
            ...stage,
            count: stageCounts.find(s => s._id === stage.name)?.count || 0,
        }));

        // Get recent contacts
        const recentContacts = await Contact.find({ userId: req.user.id, projectId: project._id })
            .sort({ updatedAt: -1 })
            .limit(10)
            .lean();

        res.json({ project, pipeline, recentContacts });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// Update project
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, description, color, icon, sequenceId, targetLists, pipelineStages } = req.body;
        const update = {};
        if (name !== undefined) update.name = name.trim();
        if (description !== undefined) update.description = description;
        if (color !== undefined) update.color = color;
        if (icon !== undefined) update.icon = icon;
        if (sequenceId !== undefined) update.sequenceId = sequenceId || null;
        if (targetLists !== undefined) update.targetLists = targetLists;
        if (pipelineStages !== undefined) update.pipelineStages = pipelineStages;

        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            update,
            { new: true }
        );
        if (!project) return res.status(404).json({ error: 'Project not found' });

        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// Archive/unarchive project
router.patch('/:id/archive', auth, async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.user.id });
        if (!project) return res.status(404).json({ error: 'Project not found' });

        project.isArchived = !project.isArchived;
        await project.save();

        res.json({ message: project.isArchived ? 'Project archived' : 'Project restored', project });
    } catch (error) {
        res.status(500).json({ error: 'Failed to archive project' });
    }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!project) return res.status(404).json({ error: 'Project not found' });

        // Remove project reference from contacts (don't delete contacts)
        await Contact.updateMany(
            { userId: req.user.id, projectId: project._id },
            { $unset: { projectId: 1 } }
        );

        res.json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// Get pipeline (Kanban) data for a project
router.get('/:id/pipeline', auth, async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.user.id }).lean();
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const contacts = await Contact.find({ userId: req.user.id, projectId: project._id })
            .sort({ pipelineStageMovedAt: -1, updatedAt: -1 })
            .lean();

        // Group contacts by pipeline stage
        const columns = project.pipelineStages.map(stage => ({
            ...stage,
            contacts: contacts.filter(c => c.pipelineStage === stage.name),
        }));

        res.json({ project, columns });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pipeline' });
    }
});

// Move contact to a different pipeline stage
router.patch('/:id/pipeline/move', auth, async (req, res) => {
    try {
        const { contactId, stage } = req.body;
        if (!contactId || !stage) return res.status(400).json({ error: 'contactId and stage are required' });

        const contact = await Contact.findOneAndUpdate(
            { _id: contactId, userId: req.user.id, projectId: req.params.id },
            { pipelineStage: stage, pipelineStageMovedAt: new Date() },
            { new: true }
        );
        if (!contact) return res.status(404).json({ error: 'Contact not found in this project' });

        res.json(contact);
    } catch (error) {
        res.status(500).json({ error: 'Failed to move contact' });
    }
});

// Launch Project as Campaign
router.post('/:id/send', auth, async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.user.id })
            .populate('sequenceId');
        
        if (!project) return res.status(404).json({ error: 'Project not found' });
        if (!project.sequenceId) return res.status(400).json({ error: 'Please edit the campaign and assign a Sequence first' });

        // Find target audience
        const filter = { userId: req.user.id };
        
        // If they provided lists, use it, else default to kanban contacts in project
        if (project.targetLists && project.targetLists.length > 0) {
            filter.$or = [
                { tags: { $in: project.targetLists } },
                { lists: { $in: project.targetLists } } // Match custom lists added in Master Audience
            ];
        } else {
            filter.projectId = project._id;
        }

        const contacts = await Contact.find(filter).lean();
        if (contacts.length === 0) return res.status(400).json({ error: 'No matching contacts found in the specified list or project' });

        // Get connected email accounts
        const accounts = await GmailAccount.find({ userId: req.user.id, status: 'connected' }).lean();
        if (accounts.length === 0) return res.status(400).json({ error: 'No connected email accounts to send from. Please connect one in Accounts.' });

        // Map Sequence into Campaign format
        const sequence = project.sequenceId;
        const mainStep = sequence.steps.find(s => s.stepNumber === 1) || sequence.steps[0];
        const followUps = sequence.steps.filter(s => s.stepNumber > 1).map(s => ({
            delayDays: s.delayDays || 3,
            body: s.body,
        }));

        const newCampaign = await Campaign.create({
            userId: req.user.id,
            projectId: project._id,
            name: `${project.name} - Run ${new Date().toISOString().split('T')[0]}`,
            subject: mainStep.subject,
            htmlBody: mainStep.body,
            plainBody: mainStep.body,
            accountIds: accounts.map(a => a._id),
            recipients: contacts.map(c => ({
                email: c.email,
                name: c.name,
                contactId: c._id,
                status: 'pending'
            })),
            followUps,
            status: 'running'
        });

        // Enqueue sending
        await enqueueCampaign(newCampaign);

        // Update basic stats so it reflects in the visual overview
        project.stats.campaigns = (project.stats.campaigns || 0) + 1;
        await project.save();

        res.json({ message: `Sequence launched for ${contacts.length} contacts!`, campaignId: newCampaign._id });
    } catch (error) {
        console.error('Launch Error:', error);
        res.status(500).json({ error: 'Failed to launch sequence.' });
    }
});

export default router;
