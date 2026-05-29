import { useState } from 'react';

export default function CodeSnippet({ token }) {
  const [tab, setTab]     = useState('html');
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/f/${token}`;

  const snippets = {
    html: {
      label: 'HTML',
      code: `<form action="${url}" method="POST">

  <!-- Optional: redirect after submit -->
  <input type="hidden" name="_redirect"
    value="https://yoursite.com/thanks" />

  <!-- Honeypot (leave hidden — catches bots) -->
  <input type="text" name="_honeypot"
    style="display:none" tabindex="-1" />

  <input type="text"  name="name"    placeholder="Your name" required />
  <input type="email" name="email"   placeholder="Email" required />
  <textarea           name="message" placeholder="Message"></textarea>

  <button type="submit">Send message</button>
</form>`,
    },

    fetch: {
      label: 'JavaScript',
      code: `const response = await fetch('${url}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name:    'Alex Johnson',
    email:   'alex@example.com',
    message: 'Hello from JavaScript!',
  }),
});

const result = await response.json();
// → { ok: true, id: 'submission-uuid' }`,
    },

    react: {
      label: 'React',
      code: `import { useState } from 'react';

export default function ContactForm() {
  const [status, setStatus] = useState('idle');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    const data = Object.fromEntries(new FormData(e.target));

    const res = await fetch('${url}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    setStatus(res.ok ? 'success' : 'error');
  }

  if (status === 'success') return <p>Thanks! We'll be in touch.</p>;

  return (
    <form onSubmit={handleSubmit}>
      <input name="name"    required placeholder="Name" />
      <input name="email"   required type="email" placeholder="Email" />
      <textarea name="message" placeholder="Message" />
      <button disabled={status === 'loading'}>
        {status === 'loading' ? 'Sending…' : 'Send'}
      </button>
    </form>
  );
}`,
    },

    curl: {
      label: 'cURL',
      code: `curl -X POST '${url}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "name": "Alex Johnson",
    "email": "alex@example.com",
    "message": "Hello from cURL!"
  }'`,
    },
  };

  async function copy() {
    await navigator.clipboard.writeText(snippets[tab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-3">
        {Object.entries(snippets).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              tab === key
                ? 'bg-indigo-600 text-white'
                : 'text-indigo-500 hover:text-indigo-800 hover:bg-indigo-50'
            }`}
          >
            {label}
          </button>
        ))}

        <div className="ml-auto">
          <button
            onClick={copy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-500 hover:text-indigo-800 border border-indigo-200 rounded-md hover:bg-indigo-50 transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code block */}
      <div className="code-block">
        <pre className="whitespace-pre-wrap break-words">{snippets[tab].code}</pre>
      </div>

      {/* Endpoint pill */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs font-mono text-indigo-400">Endpoint:</span>
        <code className="text-xs font-mono bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded select-all">
          {url}
        </code>
      </div>
    </div>
  );
}
