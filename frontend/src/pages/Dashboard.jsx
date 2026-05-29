import { useState, useEffect } from 'react';
import api from '../api/client';
import Header   from '../components/Header';
import FormCard from '../components/FormCard';
import FormModal from '../components/FormModal';

export default function Dashboard() {
  const [forms,   setForms]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShow]  = useState(false);

  useEffect(() => {
    api.get('/forms')
      .then(r => setForms(r.data))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(data) {
    const res = await api.post('/forms', data);
    setForms(p => [res.data, ...p]);
    setShow(false);
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}" and all its submissions? This cannot be undone.`)) return;
    await api.delete(`/forms/${id}`);
    setForms(p => p.filter(f => f.id !== id));
  }

  const totalSubmissions = forms.reduce((a, f) => a + parseInt(f.submission_count || 0), 0);
  const totalUnread      = forms.reduce((a, f) => a + parseInt(f.unread_count || 0), 0);

  return (
    <div className="min-h-screen bg-indigo-50">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-10">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <Stat label="Forms"       value={forms.length} />
          <Stat label="Submissions" value={totalSubmissions.toLocaleString()} />
          <Stat label="Unread"      value={totalUnread} accent={totalUnread > 0} />
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-display font-bold text-xl text-indigo-900">Your forms</h1>
          <button
            onClick={() => setShow(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New form
          </button>
        </div>

        {/* List */}
        {loading ? (
          <Skeleton />
        ) : forms.length === 0 ? (
          <EmptyState onNew={() => setShow(true)} />
        ) : (
          <div className="space-y-3">
            {forms.map(f => (
              <FormCard
                key={f.id}
                form={f}
                onDelete={() => handleDelete(f.id, f.name)}
              />
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <FormModal onSave={handleCreate} onClose={() => setShow(false)} />
      )}
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="bg-white border border-indigo-100 rounded-xl px-5 py-4">
      <p className="text-indigo-400 text-xs uppercase tracking-wider font-medium">{label}</p>
      <p className={`font-mono text-3xl font-bold mt-1 ${accent ? 'text-indigo-600' : 'text-indigo-900'}`}>
        {value}
      </p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[1,2,3].map(i => (
        <div key={i} className="bg-white border border-indigo-100 rounded-xl p-5 animate-pulse">
          <div className="h-4 bg-indigo-100 rounded w-1/3 mb-2" />
          <div className="h-3 bg-indigo-50 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onNew }) {
  return (
    <div className="text-center py-24 border-2 border-dashed border-indigo-200 rounded-2xl bg-white">
      <div className="text-5xl mb-4 select-none">🔧</div>
      <h3 className="font-display font-semibold text-indigo-800 text-lg mb-1.5">No forms yet</h3>
      <p className="text-indigo-400 text-sm mb-6 max-w-xs mx-auto">
        Create your first form endpoint and start collecting submissions in minutes.
      </p>
      <button onClick={onNew}
        className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
        Create your first form
      </button>
    </div>
  );
}
