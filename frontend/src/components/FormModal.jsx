import { useState, useEffect } from 'react';

const DEFAULTS = {
  name: '', notify_email: '', notify_webhook: '',
  redirect_url: '', allowed_origins: '', spam_protection: true, is_active: true,
};

export default function FormModal({ form, onSave, onClose }) {
  const [f, setF]         = useState(DEFAULTS);
  const [loading, setL]   = useState(false);
  const [error, setErr]   = useState('');
  const isEdit = Boolean(form);

  useEffect(() => {
    if (form) setF({
      name:            form.name || '',
      notify_email:    form.notify_email || '',
      notify_webhook:  form.notify_webhook || '',
      redirect_url:    form.redirect_url || '',
      allowed_origins: (form.allowed_origins || []).join(', '),
      spam_protection: form.spam_protection ?? true,
      is_active:       form.is_active ?? true,
    });
  }, [form]);

  const set = (k, v) => { setF(p => ({ ...p, [k]: v })); setErr(''); };

  async function submit(e) {
    e.preventDefault();
    if (!f.name.trim()) { setErr('Form name is required'); return; }
    setL(true);
    try {
      const origins = f.allowed_origins
        .split(',').map(s => s.trim()).filter(Boolean);
      await onSave({ ...f, allowed_origins: origins });
    } catch (err) {
      setErr(err.response?.data?.error || 'Failed to save form');
    } finally { setL(false); }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-indigo-50">
          <h2 className="font-display font-bold text-lg text-indigo-900">
            {isEdit ? 'Edit form' : 'New form'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-indigo-300 hover:text-indigo-600 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}

          <F label="Form name *">
            <input value={f.name} onChange={e => set('name', e.target.value)}
              placeholder="Contact form" className={inp()} />
          </F>

          <F label="Email notifications" hint="Get emailed on every new submission">
            <input type="email" value={f.notify_email} onChange={e => set('notify_email', e.target.value)}
              placeholder="you@example.com" className={inp()} />
          </F>

          <F label="Webhook URL" hint="Slack, Discord, or any HTTP endpoint">
            <input value={f.notify_webhook} onChange={e => set('notify_webhook', e.target.value)}
              placeholder="https://hooks.slack.com/…" className={inp()} />
          </F>

          <F label="Redirect URL" hint="Where to send users after a successful HTML form submission">
            <input value={f.redirect_url} onChange={e => set('redirect_url', e.target.value)}
              placeholder="https://yoursite.com/thanks" className={inp()} />
          </F>

          <F label="Allowed origins" hint="Comma-separated. Leave blank to allow all. e.g. https://mysite.com">
            <input value={f.allowed_origins} onChange={e => set('allowed_origins', e.target.value)}
              placeholder="https://mysite.com, https://staging.mysite.com" className={inp()} />
          </F>

          <div className="flex items-center gap-6 pt-1">
            <Toggle label="Spam protection" checked={f.spam_protection} onChange={v => set('spam_protection', v)} />
            {isEdit && <Toggle label="Active" checked={f.is_active} onChange={v => set('is_active', v)} />}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-indigo-50">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-indigo-500 hover:text-indigo-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create form'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function F({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-indigo-800 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-indigo-400 mt-1">{hint}</p>}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full transition-colors relative ${checked ? 'bg-indigo-500' : 'bg-stone-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </button>
      <span className="text-sm text-indigo-700">{label}</span>
    </label>
  );
}

const inp = () =>
  'w-full px-3.5 py-2.5 border border-indigo-200 rounded-lg text-indigo-900 placeholder-indigo-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white transition';
