import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import Header          from '../components/Header';
import FormModal       from '../components/FormModal';
import SubmissionTable from '../components/SubmissionTable';
import CodeSnippet     from '../components/CodeSnippet';

const TABS = ['submissions', 'integration', 'settings'];

export default function FormDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [form,    setForm]    = useState(null);
  const [subs,    setSubs]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('submissions');
  const [editing, setEditing] = useState(false);

  const load = useCallback(async (p = 1) => {
    try {
      const [formRes, subRes] = await Promise.all([
        api.get(`/forms/${id}`),
        api.get(`/forms/${id}/submissions?page=${p}&limit=25`),
      ]);
      setForm(formRes.data);
      setSubs(subRes.data.submissions);
      setTotal(subRes.data.total);
      setPages(subRes.data.pages);
      setPage(p);
    } catch (err) {
      if (err.response?.status === 404) navigate('/', { replace: true });
    } finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  async function handleUpdate(data) {
    const res = await api.put(`/forms/${id}`, data);
    setForm(res.data);
    setEditing(false);
  }

  async function handleDeleteForm() {
    if (!window.confirm(`Delete "${form.name}" and ALL its submissions? This cannot be undone.`)) return;
    await api.delete(`/forms/${id}`);
    navigate('/', { replace: true });
  }

  async function handleDeleteSub(sid) {
    if (!window.confirm('Delete this submission?')) return;
    await api.delete(`/forms/${id}/submissions/${sid}`);
    setSubs(p => p.filter(s => s.id !== sid));
    setTotal(t => t - 1);
  }

  function handleMarkRead(sid) {
    setSubs(p => p.map(s => s.id === sid ? { ...s, is_read: true } : s));
  }

  function handleExport() {
    const token = localStorage.getItem('ff_token');
    window.open(`/api/forms/${id}/submissions/export?token=${token}`);
  }

  if (loading) return <Shell><Skeleton /></Shell>;
  if (!form)   return null;

  const endpoint = `${window.location.origin}/f/${form.endpoint_token}`;
  const unread   = subs.filter(s => !s.is_read).length;

  return (
    <Shell>
      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-700 mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All forms
      </Link>

      {/* Form header */}
      <div className="bg-white border border-indigo-100 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1 flex-wrap">
              <h1 className="font-display font-bold text-2xl text-indigo-900">{form.name}</h1>
              {!form.is_active && (
                <span className="text-xs bg-stone-100 text-stone-500 border border-stone-200 px-2 py-0.5 rounded-full">Paused</span>
              )}
            </div>
            <code className="text-xs font-mono text-indigo-400 select-all">{endpoint}</code>

            <div className="flex items-center gap-4 mt-3 text-sm text-indigo-400">
              <span className="font-mono font-semibold text-indigo-700">{total.toLocaleString()}</span>
              <span>total submissions</span>
              {unread > 0 && (
                <span className="text-xs bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
                  {unread} unread
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleExport}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV
            </button>
            <button onClick={() => setEditing(true)}
              className="px-3.5 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
              Edit
            </button>
            <button onClick={handleDeleteForm}
              className="px-3.5 py-2 text-sm font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-indigo-100 mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-1 py-2.5 mr-6 text-sm font-medium border-b-2 capitalize transition-colors ${
              tab === t
                ? 'border-indigo-600 text-indigo-900'
                : 'border-transparent text-indigo-400 hover:text-indigo-700'
            }`}>
            {t}
            {t === 'submissions' && total > 0 && (
              <span className="ml-1.5 text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                {total}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'submissions' && (
        <div className="bg-white border border-indigo-100 rounded-2xl p-6">
          <SubmissionTable
            submissions={subs}
            formId={id}
            onDelete={handleDeleteSub}
            onMarkRead={handleMarkRead}
          />

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-indigo-50">
              <p className="text-xs text-indigo-400">
                Page {page} of {pages} · {total} total
              </p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => load(page - 1)}
                  className="px-3 py-1.5 text-xs font-medium border border-indigo-200 rounded-lg text-indigo-600 disabled:opacity-30 hover:bg-indigo-50 transition-colors">
                  ← Prev
                </button>
                <button disabled={page === pages} onClick={() => load(page + 1)}
                  className="px-3 py-1.5 text-xs font-medium border border-indigo-200 rounded-lg text-indigo-600 disabled:opacity-30 hover:bg-indigo-50 transition-colors">
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'integration' && (
        <div className="bg-white border border-indigo-100 rounded-2xl p-6">
          <h2 className="font-display font-semibold text-indigo-900 mb-1">Integration</h2>
          <p className="text-sm text-indigo-400 mb-5">
            Copy any snippet below to start receiving submissions. Works from any website or app.
          </p>
          <CodeSnippet token={form.endpoint_token} />
        </div>
      )}

      {tab === 'settings' && (
        <div className="bg-white border border-indigo-100 rounded-2xl p-6 space-y-4">
          <h2 className="font-display font-semibold text-indigo-900 mb-2">Settings</h2>

          <SettingRow label="Endpoint token" value={form.endpoint_token} mono />
          <SettingRow label="Status"         value={form.is_active ? 'Active' : 'Paused'} />
          <SettingRow label="Spam protection" value={form.spam_protection ? 'Enabled' : 'Disabled'} />
          <SettingRow label="Email alerts"   value={form.notify_email || 'Not configured'} />
          <SettingRow label="Webhook"        value={form.notify_webhook || 'Not configured'} mono />
          <SettingRow label="Redirect URL"   value={form.redirect_url || 'Default thank-you page'} />
          <SettingRow label="Allowed origins"
            value={form.allowed_origins?.length ? form.allowed_origins.join(', ') : 'All origins'} />
          <SettingRow label="Created"        value={new Date(form.created_at).toLocaleDateString()} />

          <div className="pt-2">
            <button onClick={() => setEditing(true)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              Edit settings
            </button>
          </div>
        </div>
      )}

      {editing && (
        <FormModal form={form} onSave={handleUpdate} onClose={() => setEditing(false)} />
      )}
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-indigo-50">
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}

function SettingRow({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-indigo-50 last:border-0">
      <span className="text-sm text-indigo-500 flex-shrink-0 w-36">{label}</span>
      <span className={`text-sm text-indigo-900 text-right break-all ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 bg-indigo-100 rounded w-20" />
      <div className="bg-white border border-indigo-100 rounded-2xl p-6">
        <div className="h-7 bg-indigo-100 rounded w-1/3 mb-3" />
        <div className="h-4 bg-indigo-50 rounded w-1/2" />
      </div>
    </div>
  );
}
