import { useState, useEffect } from 'react';
import api from '../api/client';
import {
    Users, Send, TrendingUp, AlertTriangle, Eye, MousePointerClick, Forward
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ROLE_BADGES = {
    admin: 'badge-purple',
    manager: 'badge-info',
    user: 'badge-success',
    agent: 'badge-warning'
};

export default function TeamReports() {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/analytics/team')
            .then(res => setTeam(res.data.team || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary-500" />
                        Team Productivity Reports
                    </h1>
                    <p className="text-surface-500 mt-1">Leaderboard and performance metrics for all team members.</p>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700">
                                <th className="p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Agent</th>
                                <th className="p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider text-right">Emails Sent</th>
                                <th className="p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider text-right">Open Rate</th>
                                <th className="p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider text-right">Reply Rate</th>
                                <th className="p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider text-right">Links Won</th>
                                <th className="p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider text-right">Conversion Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                            {team.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-surface-500 italic">No team data found.</td>
                                </tr>
                            ) : (
                                team.sort((a, b) => b.metrics.linksBuilt - a.metrics.linksBuilt).map((member) => (
                                    <tr key={member.userId} className="hover:bg-surface-50 dark:hover:bg-surface-800/20 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-surface-900 dark:text-white">{member.name}</div>
                                                    <div className="text-xs text-surface-500 mt-0.5 flex items-center gap-2">
                                                        {member.email}
                                                        <span className={`badge text-[9px] ${ROLE_BADGES[member.role] || 'badge-surface'}`}>
                                                            {member.role}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="font-semibold text-surface-900 dark:text-white">{member.metrics.sent}</div>
                                            <div className="text-xs text-red-500 mt-0.5">{member.metrics.bounced} bounced</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="font-semibold text-surface-900 dark:text-white">{member.metrics.openRate}%</div>
                                            <div className="text-xs text-surface-500 mt-0.5">{member.metrics.opens} opens</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="font-semibold text-surface-900 dark:text-white">{member.metrics.replyRate}%</div>
                                            <div className="text-xs text-surface-500 mt-0.5">{member.metrics.replies} replies</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="inline-flex items-center justify-center min-w-[2.5rem] h-8 px-2 rounded-lg bg-green-500 text-white font-bold shadow-sm shadow-green-500/20">
                                                {member.metrics.linksBuilt}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="font-semibold text-green-600 dark:text-green-400">{member.metrics.conversionRate}%</div>
                                            <div className="text-[10px] text-surface-400 mt-0.5 whitespace-nowrap">won / sent</div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
