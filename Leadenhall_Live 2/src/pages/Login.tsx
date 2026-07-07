import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
      navigate('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-amber-400 font-bold text-2xl">
            <span className="text-2xl">⚡</span>
            Dispatch
          </Link>
          <p className="text-zinc-400 mt-2 text-sm">Home services, handled.</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-zinc-800">
            {(['signin', 'signup'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                  tab === t ? 'text-amber-400 border-b-2 border-amber-400 -mb-px' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400 placeholder:text-zinc-600"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400 placeholder:text-zinc-600"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded-xl px-3 py-2">{error}</p>
            )}

            {/* Email confirmation must be disabled in Supabase dashboard for instant demo signups */}
            <button
              type="submit"
              disabled={loading}
              className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-zinc-950 font-semibold py-3 rounded-xl transition-colors mt-1"
            >
              {loading ? 'Please wait…' : tab === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
