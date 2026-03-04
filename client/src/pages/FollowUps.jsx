import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
    Timer, Plus, Pause, Play, Trash2, Mail, CheckCircle, StopCircle,
    Clock, Send, AlertCircle, Loader2, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';

const STATUS_CONFIG = {
    active: { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: Play },
    paused: { label: 'Paused', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Pause },
    completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle },
    stopped_reply: { label: 'Replied', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: StopCircle },
};

export default function FollowUps() {
    const [sequences, setSequences] = useState([]);
    const [sentEmails, setSentEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    // Create form state
    const [selectedEmailId, setSelectedEmailId] = useState('');
    const [followUpTemplate, setFollowUpTemplate] = useState('');
    const [intervalDays, setIntervalDays] = useState(3);
    const [maxFollowUps, setMaxFollowUps] = useState(4);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadSequences();
    }, []);

    const loadSequences = async () => {
        try {
            setLoading(true);
            const res = await api.get('/followups');
            setSequences(res.data.sequences || []);
        } catch {
            toast.error('Failed to load follow-up sequences');
        } finally {
            setLoading(false);
        }
    };

    const loadSentEmails = async () => {
        try {
            const res = await api.get('/followups/sent-emails');
            setSentEmails(res.data.emails || []);
        } catch {
            toast.error('Failed to load sent emails');
        }
    };

    const handleCreate = async () => {
        if (!selectedEmailId) return toast.error('Select an email first');
        if (!followUpTemplate.trim()) return toast.error('Paste a follow-up template');

        try {
            setCreating(true);
            const res = await api.post('/followups', {
                originalEmailLogId: selectedEmailId,
                followUpTemplate,
                intervalDays,
                maxFollowUps,
            });
            toast.success(res.data.message);
            setShowCreate(false);
            setSelectedEmailId('');
            setFollowUpTemplate('');
            setIntervalDays(3);
            setMaxFollowUps(4);
            loadSequences();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to create sequence');
        } finally {
            setCreating(false);
        }
    };

    const handlePause = async (id) => {
        try {
            await api.put(`/followups/${id}/pause`);
            toast.success('Sequence paused');
            loadSequences();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to pause');
        }
    };

    const handleResume = async (id) => {
        try {
            await api.put(`/followups/${id}/resume`);
            toast.success('Sequence resumed');
            loadSequences();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to resume');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this follow-up sequence?')) return;
        try {
            await api.delete(`/followups/${id}`);
            toast.success('Sequence deleted');
            loadSequences();
        } catch {
            toast.error('Failed to delete');
        }
    };

    const openCreatePanel = () => {
        setShowCreate(true);
        loadSentEmails();
    };

    const formatDate = (date) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    };

    // Stats
    const activeCount = sequences.filter(s => s.status === 'active').length;
    const completedCount = sequences.filter(s => s.status === 'completed').length;
    const replyStoppedCount = sequences.filter(s => s.status === 'stopped_reply').length;
    const totalSent = sequences.reduce((sum, s) => sum + s.sentCount, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Automated Follow-Ups</h1>
                    <p className="text-surface-500 mt-1">Schedule automatic follow-up sequences for your outreach emails.</p>
                </div>
                <button onClick={openCreatePanel} className="btn-primary px-6">
                    <Plus className="w-4 h-4 mr-2" /> New Sequence
                </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-4">
                    <div className="text-xs text-surface-500 uppercase tracking-wider font-semibold">Active</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{activeCount}</div>
                </div>
                <div className="glass-card p-4">
                    <div className="text-xs text-surface-500 uppercase tracking-wider font-semibold">Completed</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{completedCount}</div>
                </div>
                <div className="glass-card p-4">
                    <div className="text-xs text-surface-500 uppercase tracking-wider font-semibold">Stopped (Reply)</div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{replyStoppedCount}</div>
                </div>
                <div className="glass-card p-4">
                    <div className="text-xs text-surface-500 uppercase tracking-wider font-semibold">Total Sent</div>
                    <div className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{totalSent}</div>
                </div>
            </div>

            {/* Create Sequence Panel */}
            {showCreate && (
                <div className="glass-card p-6 border-l-4 border-l-primary-500 animate-in slide-in-from-top">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                            <Timer className="w-5 h-5 text-primary-500" />
                            Create Follow-Up Sequence
                        </h3>
                        <button onClick={() => setShowCreate(false)} className="text-surface-400 hover:text-surface-600">
                            <XCircle className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-5">
                        {/* Select Email */}
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Select Sent Email to Follow Up
                            </label>
                            <select
                                value={selectedEmailId}
                                onChange={e => setSelectedEmailId(e.target.value)}
                                className="input"
                            >
                                <option value="">— Choose an email —</option>
                                {sentEmails.map(email => (
                                    <option key={email._id} value={email._id}>
                                        {email.to} — "{email.subject}" ({formatDate(email.sentAt)})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Template */}
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Follow-Up Email Template (HTML or plain text)
                            </label>
                            <textarea
                                value={followUpTemplate}
                                onChange={e => setFollowUpTemplate(e.target.value)}
                                className="input resize-y min-h-[150px] font-mono text-sm"
                                placeholder="Hi,&#10;&#10;Just following up on my previous email regarding...&#10;&#10;Best regards"
                                rows={6}
                            />
                        </div>

                        {/* Interval + Max */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                    Interval Between Follow-Ups
                                </label>
                                <select value={intervalDays} onChange={e => setIntervalDays(Number(e.target.value))} className="input">
                                    <option value={2}>Every 2 Days</option>
                                    <option value={3}>Every 3 Days</option>
                                    <option value={4}>Every 4 Days</option>
                                    <option value={5}>Every 5 Days</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                    Number of Follow-Ups
                                </label>
                                <select value={maxFollowUps} onChange={e => setMaxFollowUps(Number(e.target.value))} className="input">
                                    <option value={1}>1 Follow-Up</option>
                                    <option value={2}>2 Follow-Ups</option>
                                    <option value={3}>3 Follow-Ups</option>
                                    <option value={4}>4 Follow-Ups</option>
                                </select>
                            </div>
                        </div>

                        <button onClick={handleCreate} disabled={creating} className="btn-primary w-full">
                            {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                            {creating ? 'Creating...' : 'Create Follow-Up Sequence'}
                        </button>
                    </div>
                </div>
            )}

            {/* Sequences List */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : sequences.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <Timer className="w-12 h-12 text-surface-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-2">No Follow-Up Sequences</h3>
                    <p className="text-surface-500 max-w-md mx-auto">
                        Send an outreach email first, then create a follow-up sequence to automatically follow up if they don't reply.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sequences.map(seq => {
                        const config = STATUS_CONFIG[seq.status] || STATUS_CONFIG.active;
                        const StatusIcon = config.icon;
                        const isExpanded = expandedId === seq._id;

                        return (
                            <div key={seq._id} className="glass-card overflow-hidden">
                                <div className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Mail className="w-5 h-5 text-primary-500 shrink-0" />
                                            <div className="min-w-0">
                                                <div className="font-semibold text-surface-900 dark:text-white truncate">
                                                    {seq.recipientEmail}
                                                </div>
                                                <div className="text-xs text-surface-500 truncate">
                                                    Re: {seq.originalSubject}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            {/* Progress */}
                                            <div className="text-sm text-surface-600 dark:text-surface-400 font-medium hidden sm:block">
                                                {seq.sentCount}/{seq.maxFollowUps}
                                            </div>
                                            <div className="w-20 h-2 bg-surface-200 dark:bg-surface-700 rounded-full hidden sm:block">
                                                <div
                                                    className="h-2 bg-primary-500 rounded-full transition-all"
                                                    style={{ width: `${(seq.sentCount / seq.maxFollowUps) * 100}%` }}
                                                />
                                            </div>

                                            {/* Status badge */}
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {config.label}
                                            </span>

                                            {/* Actions */}
                                            {seq.status === 'active' && (
                                                <button onClick={() => handlePause(seq._id)} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500" title="Pause">
                                                    <Pause className="w-4 h-4" />
                                                </button>
                                            )}
                                            {seq.status === 'paused' && (
                                                <button onClick={() => handleResume(seq._id)} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-green-600" title="Resume">
                                                    <Play className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(seq._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setExpandedId(isExpanded ? null : seq._id)} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400">
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Compact info row */}
                                    <div className="flex items-center gap-4 mt-3 text-xs text-surface-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Every {seq.intervalDays} days
                                        </span>
                                        {seq.status === 'active' && seq.nextSendAt && (
                                            <span className="flex items-center gap-1">
                                                <Timer className="w-3 h-3" /> Next: {formatDate(seq.nextSendAt)}
                                            </span>
                                        )}
                                        <span>Created: {formatDate(seq.createdAt)}</span>
                                    </div>
                                </div>

                                {/* Expanded History */}
                                {isExpanded && seq.history?.length > 0 && (
                                    <div className="border-t border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50 p-4">
                                        <h4 className="text-xs font-semibold uppercase text-surface-500 mb-3">Send History</h4>
                                        <div className="space-y-2">
                                            {seq.history.map((h, i) => (
                                                <div key={i} className="flex items-center justify-between text-sm">
                                                    <span className="flex items-center gap-2">
                                                        {h.status === 'sent'
                                                            ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                                            : <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                                                        }
                                                        <span className="text-surface-700 dark:text-surface-300">
                                                            Follow-up #{i + 1}
                                                        </span>
                                                    </span>
                                                    <span className="text-surface-500 text-xs">{formatDate(h.sentAt)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {isExpanded && (!seq.history || seq.history.length === 0) && (
                                    <div className="border-t border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50 p-4 text-sm text-surface-500 text-center">
                                        No follow-ups sent yet. First follow-up scheduled for {formatDate(seq.nextSendAt)}.
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
