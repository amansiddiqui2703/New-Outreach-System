import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Plus, Copy, Trash2, Play, Pause, Send, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const statusColors = {
    draft: 'badge-purple', scheduled: 'badge-info', running: 'badge-success',
    paused: 'badge-warning', completed: 'badge-info',
};

export default function Campaigns() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [newName, setNewName] = useState('');

    const fetchCampaigns = () => {
        setLoading(true);
        api.get('/campaigns').then(r => setCampaigns(r.data.campaigns)).catch(() => { }).finally(() => setLoading(false));
    };

    useEffect(() => { fetchCampaigns(); }, []);

    const createCampaign = async () => {
        if (!newName.trim()) return;
        try {
            await api.post('/campaigns', { name: newName });
            toast.success('Campaign created');
            setNewName('');
            setShowNew(false);
            fetchCampaigns();
        } catch { toast.error('Failed to create campaign'); }
    };

    const duplicateCampaign = async (id) => {
        try {
            await api.post(`/campaigns/${id}/duplicate`);
            toast.success('Campaign duplicated');
            fetchCampaigns();
        } catch { toast.error('Failed'); }
    };

    const deleteCampaign = async (id) => {
        if (!confirm('Delete this campaign?')) return;
        try {
            await api.delete(`/campaigns/${id}`);
            toast.success('Deleted');
            fetchCampaigns();
        } catch { toast.error('Failed'); }
    };

    const sendCampaign = async (id) => {
        try {
            await api.post(`/campaigns/${id}/send`);
            toast.success('Campaign started!');
            fetchCampaigns();
        } catch (e) { toast.error(e.response?.data?.error || 'Failed to start'); }
    };

    const pauseCampaign = async (id) => {
        try {
            await api.post(`/campaigns/${id}/pause`);
            toast.success('Campaign paused');
            fetchCampaigns();
        } catch { toast.error('Failed'); }
    };

    const filtered = campaigns.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Campaigns</h1>
                    <p className="text-surface-500 mt-1">Manage your email campaigns</p>
                </div>
                <button onClick={() => setShowNew(true)} className="btn-primary" id="new-campaign-btn">
                    <Plus className="w-4 h-4" /> New Campaign
                </button>
            </div>

            {showNew && (
                <div className="glass-card p-6 flex items-end gap-4 animate-in">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Campaign Name</label>
                        <input value={newName} onChange={e => setNewName(e.target.value)} className="input" placeholder="My Outreach Campaign" autoFocus id="campaign-name-input" />
                    </div>
                    <button onClick={createCampaign} className="btn-primary">Create</button>
                    <button onClick={() => setShowNew(false)} className="btn-secondary">Cancel</button>
                </div>
            )}

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns..." className="input pl-10" />
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 glass-card">
                    <Send className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300">No campaigns</h3>
                    <p className="text-surface-400 mt-1">Create your first campaign to get started</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filtered.map(c => (
                        <div key={c._id} className="glass-card p-5 flex items-center justify-between hover:shadow-lg transition-all group">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                    <Link to={`/campaigns/${c._id}`} className="text-lg font-semibold text-surface-900 dark:text-white hover:text-primary-500 truncate">{c.name}</Link>
                                    <span className={`badge ${statusColors[c.status]}`}>{c.status}</span>
                                </div>
                                <div className="flex gap-6 mt-2 text-sm text-surface-500">
                                    <span>{c.stats?.total || 0} recipients</span>
                                    <span>{c.stats?.sent || 0} sent</span>
                                    <span>{c.stats?.opened || 0} opened</span>
                                    <span>{c.stats?.clicked || 0} clicked</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {c.status === 'draft' && (
                                    <button onClick={() => sendCampaign(c._id)} className="p-2 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg text-green-500" title="Send">
                                        <Play className="w-4 h-4" />
                                    </button>
                                )}
                                {c.status === 'running' && (
                                    <button onClick={() => pauseCampaign(c._id)} className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 rounded-lg text-yellow-500" title="Pause">
                                        <Pause className="w-4 h-4" />
                                    </button>
                                )}
                                <button onClick={() => duplicateCampaign(c._id)} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg text-surface-500" title="Duplicate">
                                    <Copy className="w-4 h-4" />
                                </button>
                                <button onClick={() => deleteCampaign(c._id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-red-500" title="Delete">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
