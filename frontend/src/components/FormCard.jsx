import { Link } from 'react-router-dom';

export default function FormCard({ form, onDelete }) {
  const endpoint = `${window.location.origin}/f/${form.endpoint_token}`;
  const total    = parseInt(form.submission_count || 0);
  const unread   = parseInt(form.unread_count || 0);

  return (
    <div className="bg-white border border-indigo-100 rounded-xl p-5 hover:border-indigo-300 transition-all animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              to={`/forms/${form.id}`}
              className="font-display font-semibold text-indigo-900 hover:text-indigo-600 transition-colors"
            >
              {form.name}
            </Link>
            {!form.is_active && (
              <span className="text-xs bg-stone-100 text-stone-500 border border-stone-200 px-2 py-0.5 rounded-full">
                Paused
              </span>
            )}
            {unread > 0 && (
              <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium">
                {unread} new
              </span>
            )}
          </div>

          {/* Endpoint token — monospace, copyable feel */}
          <p className="font-mono text-xs text-indigo-300 mt-1 truncate">
            POST {endpoint}
          </p>

          <div className="flex items-center gap-4 mt-2 text-xs text-indigo-400">
            <span>{total.toLocaleString()} submission{total !== 1 ? 's' : ''}</span>
            {form.notify_email && <span>· Email alerts</span>}
            {form.notify_webhook && <span>· Webhook</span>}
            {form.spam_protection && <span>· Spam protection</span>}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Link
            to={`/forms/${form.id}`}
            className="px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Open
          </Link>
          <button
            onClick={onDelete}
            className="p-2 text-indigo-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete form"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
