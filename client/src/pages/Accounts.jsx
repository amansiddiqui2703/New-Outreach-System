import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
    Mail, Plus, Trash2, Activity, Shield, Code, Copy, Check, ChevronDown, ChevronUp, ExternalLink, Zap
} from 'lucide-react';

const GOOGLE_APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    if (data.action === 'test') {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        email: Session.getActiveUser().getEmail()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'send') {
      var options = {};
      if (data.htmlBody) options.htmlBody = data.htmlBody;
      if (data.cc) options.cc = data.cc;
      if (data.bcc) options.bcc = data.bcc;
      if (data.name) options.name = data.name;
      
      GmailApp.sendEmail(data.to, data.subject, data.plainBody || '', options);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        messageId: Utilities.getUuid()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Threaded follow-up reply
    if (data.action === 'reply') {
      var subject = (data.originalSubject || '').replace(/^Re:\\s*/i, '');
      var threads = GmailApp.search('to:' + data.to + ' subject:"' + subject + '" in:sent', 0, 1);
      
      if (threads.length > 0) {
        var thread = threads[0];
        var lastMsg = thread.getMessages()[thread.getMessageCount() - 1];
        var replyOpts = {};
        if (data.htmlBody) replyOpts.htmlBody = data.htmlBody;
        if (data.name) replyOpts.name = data.name;
        lastMsg.reply(data.plainBody || '', replyOpts);
      } else {
        var opts = {};
        if (data.htmlBody) opts.htmlBody = data.htmlBody;
        if (data.name) opts.name = data.name;
        GmailApp.sendEmail(data.to, 'Re: ' + subject, data.plainBody || '', opts);
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        messageId: Utilities.getUuid(),
        threaded: threads.length > 0
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Unknown action'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'AutoMindz Gmail Script is active',
    email: Session.getActiveUser().getEmail()
  })).setMimeType(ContentService.MimeType.JSON);
}`;

export default function Accounts() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showScript, setShowScript] = useState(false);
    const [showConnect, setShowConnect] = useState(false);
    const [copied, setCopied] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [form, setForm] = useState({ email: '', displayName: '', scriptUrl: '' });

    const fetchAccounts = () => {
        setLoading(true);
        api.get('/accounts')
            .then(r => setAccounts(r.data.accounts))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const copyScript = async () => {
        try {
            await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
            setCopied(true);
            toast.success('Script copied to clipboard!');
            setTimeout(() => setCopied(false), 3000);
        } catch {
            toast.error('Failed to copy. Please select and copy manually.');
        }
    };

    const connectGmail = async (e) => {
        e.preventDefault();
        if (!form.email || !form.scriptUrl) {
            toast.error('Email and Script URL are required');
            return;
        }
        setConnecting(true);
        try {
            const res = await api.post('/accounts/connect-script', {
                email: form.email,
                displayName: form.displayName,
                scriptUrl: form.scriptUrl,
            });
            toast.success(res.data.message || 'Gmail account connected!');
            setForm({ email: '', displayName: '', scriptUrl: '' });
            setShowConnect(false);
            fetchAccounts();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to connect account');
        } finally {
            setConnecting(false);
        }
    };

    const deleteAccount = async (id) => {
        if (!confirm('Disconnect this Gmail account?')) return;
        try {
            await api.delete(`/accounts/${id}`);
            toast.success('Account disconnected');
            fetchAccounts();
        } catch { toast.error('Failed'); }
    };

    const updateLimit = async (id, dailyLimit) => {
        try {
            await api.patch(`/accounts/${id}`, { dailyLimit: parseInt(dailyLimit) });
            toast.success('Limit updated');
            fetchAccounts();
        } catch { toast.error('Failed'); }
    };

    const healthBg = (h) => h === 'good' ? 'badge-success' : h === 'warning' ? 'badge-warning' : 'badge-danger';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Gmail Accounts</h1>
                    <p className="text-surface-500 mt-1">Manage your connected Gmail accounts via Google Apps Script</p>
                </div>
                <button onClick={() => setShowConnect(!showConnect)} className="btn-primary" id="connect-gmail-btn">
                    <Plus className="w-4 h-4" /> Connect Gmail
                </button>
            </div>

            {/* Google Apps Script Section */}
            <div className="glass-card overflow-hidden">
                <button
                    onClick={() => setShowScript(!showScript)}
                    className="w-full flex items-center justify-between p-5 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <Code className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                            <div className="font-semibold text-surface-900 dark:text-white">Google Apps Script</div>
                            <div className="text-xs text-surface-500">Copy this script and deploy it in your Google account</div>
                        </div>
                    </div>
                    {showScript ? <ChevronUp className="w-5 h-5 text-surface-400" /> : <ChevronDown className="w-5 h-5 text-surface-400" />}
                </button>

                {showScript && (
                    <div className="px-5 pb-5 space-y-4">
                        {/* Step-by-step instructions */}
                        <div className="p-4 rounded-xl bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-500/5 dark:to-accent-500/5">
                            <p className="font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-primary-500" /> Setup Instructions
                            </p>
                            <ol className="text-sm text-surface-600 dark:text-surface-400 space-y-2 list-decimal list-inside">
                                <li>Go to <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline inline-flex items-center gap-1">
                                    script.google.com <ExternalLink className="w-3 h-3" />
                                </a></li>
                                <li>Click <strong>"New Project"</strong> to create a new script</li>
                                <li>Delete the default code and <strong>paste the script below</strong></li>
                                <li>Click <strong>Deploy → New Deployment</strong></li>
                                <li>Select type <strong>"Web app"</strong></li>
                                <li>Set <strong>"Who has access"</strong> to <strong>"Anyone"</strong></li>
                                <li>Click <strong>"Deploy"</strong> and authorize when prompted</li>
                                <li><strong>Copy the Web App URL</strong> and paste it in the connection form below</li>
                            </ol>
                        </div>

                        {/* Script code block */}
                        <div className="relative">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-mono text-surface-500">Code.gs</span>
                                <button
                                    onClick={copyScript}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                        bg-primary-500 text-white hover:bg-primary-600 active:scale-95"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? 'Copied!' : 'Copy Script'}
                                </button>
                            </div>
                            <pre className="p-4 rounded-xl bg-surface-900 dark:bg-surface-950 text-green-400 text-xs font-mono overflow-x-auto max-h-80 overflow-y-auto leading-relaxed scrollbar-thin">
                                <code>{GOOGLE_APPS_SCRIPT_CODE}</code>
                            </pre>
                        </div>
                    </div>
                )}
            </div>

            {/* Connection Form */}
            {showConnect && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-primary-500" /> Connect Gmail Account
                    </h3>
                    <form onSubmit={connectGmail} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-surface-700 dark:text-surface-300 block mb-1.5">
                                    Gmail Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    placeholder="your.email@gmail.com"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-surface-700 dark:text-surface-300 block mb-1.5">
                                    Display Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    value={form.displayName}
                                    onChange={e => setForm({ ...form, displayName: e.target.value })}
                                    className="input"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-surface-700 dark:text-surface-300 block mb-1.5">
                                Google Apps Script Web App URL <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="url"
                                placeholder="https://script.google.com/macros/s/AKfyc.../exec"
                                value={form.scriptUrl}
                                onChange={e => setForm({ ...form, scriptUrl: e.target.value })}
                                className="input"
                                required
                            />
                            <p className="text-xs text-surface-400 mt-1">Paste the Web App URL from your deployed Google Apps Script</p>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={connecting}
                                className="btn-primary"
                            >
                                {connecting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Testing & Connecting...
                                    </>
                                ) : (
                                    <><Zap className="w-4 h-4" /> Connect Account</>
                                )}
                            </button>
                            <button type="button" onClick={() => setShowConnect(false)} className="btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Info card */}
            <div className="glass-card p-5 flex items-start gap-3 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-500/5 dark:to-accent-500/5">
                <Shield className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-surface-700 dark:text-surface-300">
                    <p className="font-medium mb-1">Google Apps Script Security</p>
                    <p className="text-surface-500 text-xs">Emails are sent directly from your Google account via Apps Script. No OAuth client credentials are needed — the script runs with your own Google permissions. Your script URL is stored securely.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : accounts.length === 0 ? (
                <div className="text-center py-16 glass-card">
                    <Mail className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300">No Gmail accounts connected</h3>
                    <p className="text-surface-400 mt-1 mb-4">Deploy the Google Apps Script above, then connect your Gmail account</p>
                    <button onClick={() => { setShowConnect(true); setShowScript(true); }} className="btn-primary">
                        <Plus className="w-4 h-4" /> Get Started
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {accounts.map(a => (
                        <div key={a._id} className="glass-card p-6 hover:shadow-lg transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-surface-900 dark:text-white">{a.email}</div>
                                        <div className="text-xs text-surface-400">{a.displayName || 'Gmail Account'} • via Google Apps Script</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`badge ${healthBg(a.health)}`}>
                                        <Activity className="w-3 h-3 mr-1" />{a.health}
                                    </span>
                                    <button onClick={() => deleteAccount(a._id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Quota */}
                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="text-surface-500">Daily Quota</span>
                                    <span className="font-medium text-surface-900 dark:text-white">{a.dailySentCount} / {a.dailyLimit}</span>
                                </div>
                                <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2.5">
                                    <div className={`h-2.5 rounded-full transition-all ${a.dailySentCount / a.dailyLimit > 0.9 ? 'bg-red-500' : a.dailySentCount / a.dailyLimit > 0.7 ? 'bg-yellow-500' : 'bg-gradient-to-r from-primary-500 to-accent-500'}`}
                                        style={{ width: `${Math.min((a.dailySentCount / a.dailyLimit) * 100, 100)}%` }} />
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                                    <div className="text-lg font-bold text-surface-900 dark:text-white">{a.totalSent || 0}</div>
                                    <div className="text-xs text-surface-500">Total Sent</div>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                                    <div className="text-lg font-bold text-surface-900 dark:text-white">{a.bounceCount || 0}</div>
                                    <div className="text-xs text-surface-500">Bounces</div>
                                </div>
                                <div>
                                    <label className="text-xs text-surface-500 block mb-1">Daily Limit</label>
                                    <input type="number" defaultValue={a.dailyLimit} onBlur={e => updateLimit(a._id, e.target.value)}
                                        className="input !text-sm !py-1.5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
