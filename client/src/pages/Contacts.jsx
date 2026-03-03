import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { Plus, Upload, Download, Trash2, Search, Users, X } from 'lucide-react';

export default function Contacts() {
    const navigate = useNavigate();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ email: '', name: '', company: '' });

    const fetchContacts = () => {
        setLoading(true);
        api.get('/contacts', { params: { page, search, limit: 50 } })
            .then(r => { setContacts(r.data.contacts); setTotal(r.data.total); })
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchContacts(); }, [page, search]);

    const addContact = async () => {
        if (!form.email) return;
        try {
            await api.post('/contacts', form);
            toast.success('Contact added');
            setForm({ email: '', name: '', company: '' });
            setShowAdd(false);
            fetchContacts();
        } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    };

    const deleteContact = async (id) => {
        if (!confirm('Delete contact permanently (GDPR)?')) return;
        try {
            await api.delete(`/contacts/${id}`);
            toast.success('Contact deleted');
            fetchContacts();
        } catch { toast.error('Failed'); }
    };

    const onDrop = useCallback(async (files) => {
        if (!files.length) return;
        const formData = new FormData();
        formData.append('file', files[0]);
        try {
            const res = await api.post('/contacts/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success(`Imported ${res.data.imported} contacts (${res.data.skipped} skipped)`);
            fetchContacts();
        } catch { toast.error('Upload failed'); }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'] }, maxFiles: 1 });

    const exportCSV = async () => {
        try {
            const res = await api.get('/contacts/export', { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url; a.download = 'contacts.csv'; a.click();
            URL.revokeObjectURL(url);
            toast.success('Contacts exported');
        } catch { toast.error('Export failed'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Contacts</h1>
                    <p className="text-surface-500 mt-1">{total} total contacts</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={exportCSV} className="btn-secondary"><Download className="w-4 h-4" /> Export</button>
                    <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Contact</button>
                </div>
            </div>

            {/* CSV Upload */}
            <div {...getRootProps()} className={`glass-card p-8 text-center cursor-pointer border-2 border-dashed transition-all ${isDragActive ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-500/5' : 'border-surface-300 dark:border-surface-600'}`}>
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-surface-400 mx-auto mb-3" />
                <p className="text-surface-600 dark:text-surface-300 text-sm font-medium">
                    {isDragActive ? 'Drop CSV file here...' : 'Drag & drop CSV file here, or click to browse'}
                </p>
                <p className="text-surface-400 text-xs mt-1">Columns: email, name, company (+ any custom fields)</p>
            </div>

            {/* Add manual contact */}
            {showAdd && (
                <div className="glass-card p-6 animate-in">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-surface-900 dark:text-white">Add Contact</h3>
                        <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-surface-400" /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" placeholder="Any email address" />
                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="Name (optional)" />
                        <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="input" placeholder="Company (optional)" />
                    </div>
                    <button onClick={addContact} className="btn-primary mt-4">Add Contact</button>
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search contacts..." className="input pl-10" />
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : contacts.length === 0 ? (
                <div className="text-center py-16 glass-card">
                    <Users className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300">No contacts</h3>
                    <p className="text-surface-400 mt-1">Upload a CSV or add contacts manually</p>
                </div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Email</th><th>Name</th><th>Company</th><th>Source</th><th>Status</th><th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.map(c => (
                                <tr
                                    key={c._id}
                                    onClick={() => navigate(`/contacts/${c._id}`)}
                                    className="cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group"
                                >
                                    <td className="font-medium text-primary-600 dark:text-primary-400 group-hover:underline">{c.email}</td>
                                    <td>{c.name || '—'}</td>
                                    <td>{c.company || '—'}</td>
                                    <td><span className="badge badge-info">{c.source}</span></td>
                                    <td>{c.isUnsubscribed ? <span className="badge badge-danger">Unsubscribed</span> : <span className="badge badge-success">Active</span>}</td>
                                    <td>
                                        <button onClick={() => deleteContact(c._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {total > 50 && (
                <div className="flex justify-center gap-2">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary !text-sm">Previous</button>
                    <span className="px-4 py-2 text-sm text-surface-500">Page {page}</span>
                    <button disabled={contacts.length < 50} onClick={() => setPage(p => p + 1)} className="btn-secondary !text-sm">Next</button>
                </div>
            )}
        </div>
    );
}
