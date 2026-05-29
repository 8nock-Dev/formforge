import { useState } from 'react';
import api from '../api/client';

export default function SubmissionTable({ submissions, formId, onDelete, onMarkRead }) {
  const [expanded, setExpanded] = useState(null);

  if (!submissions.length) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3 select-none">📭</div>
        <p className="text-indigo-400 text-sm">No submissions yet.</p>
        <p className="text-indigo-300 text-xs mt-1">
          Submissions will appear here as soon as your form receives them.
        </p>
      </div>
    );
  }

  // Collect all unique data keys from all submissions (for column headers)
  const allKeys = [...new Set(
    submissions.flatMap(s => Object.keys(s.data).filter(k => !k.startsWith('_')))
  )].slice(0, 6); // cap at 6 columns to avoid table overflow

  return (
    <div className="overflow-x-auto rounded-xl border border-indigo-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-indigo-50 border-b border-indigo-100">
            <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-500 uppercase tracking-wide w-32">
              Date
            </th>
            {allKeys.map(k => (
              <th key={k} className="px-4 py-3 text-left text-xs font-semibold text-indigo-500 uppercase tracking-wide max-w-[160px]">
                {k}
              </th>
            ))}
            <th className="px-4 py-3 w-20" />
          </tr>
        </thead>
        <tbody className="divide-y divide-indigo-50">
          {submissions.map(s => (
            <>
              <tr
                key={s.id}
                onClick={() => {
                  setExpanded(expanded === s.id ? null : s.id);
                  if (!s.is_read) {
                    api.patch(`/forms/${formId}/submissions/${s.id}/read`).catch(() => {});
                    onMarkRead?.(s.id);
                  }
                }}
                className={`cursor-pointer hover:bg-indigo-50/50 transition-colors ${!s.is_read ? 'bg-indigo-50/30' : 'bg-white'}`}
              >
                <td className="px-4 py-3 text-xs text-indigo-400 font-mono whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    {!s.is_read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />}
                    {formatDate(s.created_at)}
                  </div>
                </td>
                {allKeys.map(k => (
                  <td key={k} className="px-4 py-3 text-indigo-800 max-w-[160px]">
                    <span className="truncate block" title={String(s.data[k] ?? '')}>
                      {truncate(String(s.data[k] ?? '—'), 40)}
                    </span>
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(s.id); }}
                    className="p-1 text-indigo-300 hover:text-red-500 rounded transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>

              {/* Expanded row — shows all fields */}
              {expanded === s.id && (
                <tr key={`${s.id}-exp`} className="bg-indigo-50/50">
                  <td colSpan={allKeys.length + 2} className="px-6 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(s.data)
                        .filter(([k]) => !k.startsWith('_'))
                        .map(([k, v]) => (
                          <div key={k} className="bg-white border border-indigo-100 rounded-lg p-3">
                            <p className="text-xs text-indigo-400 uppercase tracking-wide font-medium mb-0.5">{k}</p>
                            <p className="text-sm text-indigo-900 break-words">{String(v ?? '')}</p>
                          </div>
                        ))
                      }
                    </div>
                    <div className="flex gap-4 mt-3 text-xs text-indigo-400 font-mono">
                      {s.submitter_ip && <span>IP: {s.submitter_ip}</span>}
                      {s.referrer     && <span>Ref: {s.referrer}</span>}
                      {s.origin       && <span>Origin: {s.origin}</span>}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + '…' : str;
}
