import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Login() {
  const [mode, setMode]   = useState('login');
  const [form, setForm]   = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy]   = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const set = e => { setForm(p => ({ ...p, [e.target.name]: e.target.value })); setError(''); };

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const ep  = mode === 'login' ? '/auth/login' : '/auth/register';
      const pay = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };
      const res = await api.post(ep, pay);
      login(res.data.token, res.data.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-indigo-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 bg-indigo-900 p-12">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔧</span>
          <span className="font-display font-bold text-white text-xl">FormForge</span>
        </div>

        <div>
          <h2 className="text-white font-display font-bold text-3xl leading-tight mb-6">
            A form endpoint<br />for every project.
          </h2>
          <p className="text-indigo-300 text-sm leading-relaxed mb-8">
            Point any HTML form or fetch() call at your FormForge endpoint.
            We handle storage, spam filtering, email notifications, webhooks, and CSV export.
          </p>

          <div className="space-y-3">
            {[
              { icon: '⚡', text: 'Works with plain HTML — no JavaScript required' },
              { icon: '🛡️', text: 'Honeypot spam protection built in' },
              { icon: '📧', text: 'Email + webhook alerts on every submission' },
              { icon: '📊', text: 'CSV export with one click' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-lg">{icon}</span>
                <span className="text-indigo-200 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-indigo-700 text-xs">Self-hostable · No subscription · No limits</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <span className="text-xl">🔧</span>
            <span className="font-display font-bold text-indigo-900 text-lg">FormForge</span>
          </div>

          <h1 className="font-display font-bold text-2xl text-indigo-900 mb-1">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h1>
          <p className="text-indigo-400 text-sm mb-8">
            {mode === 'login' ? 'Access your form dashboard' : 'Start collecting form submissions'}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-5">{error}</div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <input name="name" value={form.name} onChange={set}
                placeholder="Your name" required
                className={inp()} />
            )}
            <input type="email" name="email" value={form.email} onChange={set}
              placeholder="Email" required className={inp()} />
            <input type="password" name="password" value={form.password} onChange={set}
              placeholder="Password" required minLength={mode === 'register' ? 8 : 1}
              className={inp()} />

            <button type="submit" disabled={busy}
              className="w-full py-2.5 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-indigo-400 mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
            <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-indigo-700 font-medium hover:underline">
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

const inp = () =>
  'w-full px-3.5 py-2.5 border border-indigo-200 rounded-lg text-indigo-900 placeholder-indigo-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white transition';
