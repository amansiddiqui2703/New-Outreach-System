import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
    Plus, Send, Search, MoreVertical, Archive, RotateCcw, Trash2,
    Play, Pause, Copy, FolderKanban, Users, ChevronRight, X
} from 'lucide-react';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#6366F1'];

const statusColors = {
    draft: 'badge-purple', scheduled: 'badge-info', running: 'badge-success',
    paused: 'badge-warning', completed: 'badge-info',
};

export default function Campaigns() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [search, setSearch] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [menuOpen, setMenuOpen] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', color: '#3B82F6', targetLists: '' });

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/campaigns?isArchived=${showArchived}`);
            setCampaigns(res.data.campaigns);
        } catch (e) {
            toast.error('Failed to load campaigns');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCampaigns(); }, [showArchived]);

    const createCampaign = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        try {
            const payload = {
                ...form,
                targetLists: form.targetLists ? form.targetLists.split(',').map(s => s.trim()) : []
            };
            await api.post('/campaigns', payload);
            toast.success('Campaign created!');
            setShowCreate(false);
            setForm({ name: '', description: '', color: '#3B82F6', targetLists: '' });
            fetchCampaigns();
        } catch { toast.error('Failed to create campaign'); }
    };

    const toggleArchive = async (id) => {
        try {
            await api.patch(`/campaigns/${id}/archive`);
            toast.success(showArchived ? 'Campaign restored' : 'Campaign archived');
            fetchCampaigns();
        } catch { toast.error('Failed'); }
        setMenuOpen(null);
    };

    const deleteCampaign = async (id) => {
        if (!confirm('Delete this campaign permanently?')) return;
        try {
            await api.delete(`/campaigns/${id}`);
            toast.success('Campaign deleted');
            fetchCampaigns();
        } catch { toast.error('Failed'); }
        setMenuOpen(null);
    };

    const duplicateCampaign = async (id) => {
        try {
            await api.post(`/campaigns/${id}/duplicate`);
            toast.success('Campaign duplicated');
            fetchCampaigns();
        } catch { toast.error('Failed'); }
        setMenuOpen(null);
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

    if (loading && campaigns.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Campaigns</h1>
                    <p className="text-surface-500 mt-1">Manage your outreach pipelines and email campaigns</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`btn-secondary text-sm ${showArchived ? '!bg-amber-50 !text-amber-600 dark:!bg-amber-500/10' : ''}`}
                    >
                        <Archive className="w-4 h-4" />
                        {showArchived ? 'Archived' : 'Show Archived'}
                    </button>
                    <button onClick={() => setShowCreate(true)} className="btn-primary">
                        <Plus className="w-4 h-4" /> New Campaign
                    </button>
                </div>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns..." className="input pl-10" />
            </div>

            {filtered.length === 0 ? (
                <div className="glass-card p-16 text-center">
                    <Send className="w-16 h-16 text-surface-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-surface-700 dark:text-surface-300 mb-2">
                        {showArchived ? 'No archived campaigns' : 'No campaigns yet'}
                    </h3>
                    <p className="text-surface-400 mb-6">Create a campaign to start your outreach journey</p>
                    {!showArchived && (
                        <button onClick={() => setShowCreate(true)} className="btn-primary">
                            <Plus className="w-4 h-4" /> Create Your First Campaign
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map(c => (
                        <div key={c._id} className="glass-card p-5 group hover:shadow-lg transition-all relative">
                            {/* Menu */}
                            <div className="absolute top-4 right-4 z-10">
                                <button onClick={() => setMenuOpen(menuOpen === c._id ? null : c._id)}
                                    className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="w-4 h-4 text-surface-400" />
                                </button>
                                {menuOpen === c._id && (
                                    <div className="absolute right-0 top-8 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl p-1.5 z-20 min-w-[150px]">
                                        <button onClick={() => duplicateCampaign(c._id)}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg">
                                            <Copy className="w-4 h-4" /> Duplicate
                                        </button>
                                        <button onClick={() => toggleArchive(c._id)}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg">
                                            {showArchived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                                            {showArchived ? 'Restore' : 'Archive'}
                                        </button>
                                        <button onClick={() => deleteCampaign(c._id)}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                                            <Trash2 className="w-4 h-4" /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Campaign Info */}
                            <Link to={`/campaigns/${c._id}`} className="block">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: (c.color || '#3B82F6') + '20' }}>
                                        <Send className="w-5 h-5" style={{ color: c.color || '#3B82F6' }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-surface-900 dark:text-white truncate max-w-[140px]">{c.name}</h3>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${statusColors[c.status]}`}>{c.status}</span>
                                        </div>
                                        {c.description && <p className="text-xs text-surface-400 truncate">{c.description}</p>}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-surface-50 dark:bg-surface-800/50 p-2 rounded-lg">
                                        <div className="text-[10px] text-surface-400 uppercase font-bold mb-0.5">Contacts</div>
                                        <div className="text-sm font-bold text-surface-700 dark:text-surface-200">{c.stats?.total || 0}</div>
                                    </div>
                                    <div className="bg-surface-50 dark:bg-surface-800/50 p-2 rounded-lg">
                                        <div className="text-[10px] text-surface-400 uppercase font-bold mb-0.5">Sent</div>
                                        <div className="text-sm font-bold text-surface-700 dark:text-surface-200">{c.stats?.sent || 0}</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-surface-500">
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-green-500" />
                                            {c.stats?.opened || 0} Open
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                                            {c.stats?.clicked || 0} Click
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-primary-500 font-medium opacity-0 group-hover:opacity-100 transition-all">
                                        Details <ChevronRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </Link>

                            {/* Quick Actions Footer */}
                            {!showArchived && (
                                <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-800 flex items-center gap-2">
                                    {c.status === 'draft' && (
                                        <button onClick={() => sendCampaign(c._id)} className="flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-500/10 rounded-lg hover:bg-green-100 transition-colors">
                                            <Play className="w-3.5 h-3.5" /> Start
                                        </button>
                                    )}
                                    {c.status === 'running' && (
                                        <button onClick={() => pauseCampaign(c._id)} className="flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-500/10 rounded-lg hover:bg-amber-100 transition-colors">
                                            <Pause className="w-3.5 h-3.5" /> Pause
                                        </button>
                                    )}
                                    {c.status === 'paused' && (
                                        <button onClick={() => sendCampaign(c._id)} className="flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-500/10 rounded-lg hover:bg-green-100 transition-colors">
                                            <Play className="w-3.5 h-3.5" /> Resume
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
                    <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-surface-900 dark:text-white">New Campaign</h2>
                            <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg">
                                <X className="w-5 h-5 text-surface-400" />
                            </button>
                        </div>
                        <form onSubmit={createCampaign} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Campaign Name *</label>
                                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Outreach Pipeline - Q1"
                                    className="input-field w-full" autoFocus required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Goals or notes for this campaign" rows={3}
                                    className="input-field w-full resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Target Lists (Comma separated)</label>
                                <input type="text" value={form.targetLists} onChange={e => setForm({ ...form, targetLists: e.target.value })}
                                    placeholder="SEO Leads, Guest Posts"
                                    className="input-field w-full" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Color</label>
                                <div className="flex gap-2 flex-wrap">
                                    {COLORS.map(c => (
                                        <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                                            className={`w-8 h-8 rounded-lg transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : 'hover:scale-105'}`}
                                            style={{ background: c }} />
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
