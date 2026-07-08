import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BadgeCheck, ShieldCheck, Languages, ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo';

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
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-agave text-white p-12 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-16 bottom-10 w-64 h-64 rounded-full bg-marigold/20 blur-3xl" />
        <Logo size={32} tone="onDark" />
        <div className="relative">
          <h1 className="font-display text-5xl font-semibold leading-[1.05]">Good hands,<br />close to home.</h1>
          <p className="text-white/80 mt-4 max-w-sm leading-relaxed">Join thousands of neighbours booking trusted local pros — plumbers, electricians and cleaners — in just a few taps.</p>
          <div className="mt-8 space-y-3">
            {[
              { icon: ShieldCheck, t: 'Every pro is ID-checked & reviewed' },
              { icon: BadgeCheck, t: 'Secure payments, protected until done' },
              { icon: Languages, t: 'Chat in any language, translated live' },
            ].map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.t} className="flex items-center gap-3 text-white/90 text-sm">
                  <span className="w-9 h-9 rounded-2xl bg-white/15 grid place-items-center flex-shrink-0"><Icon size={17} /></span>
                  {v.t}
                </div>
              );
            })}
          </div>
        </div>
        <p className="relative text-white/60 text-sm">Made with care in Liverpool.</p>
      </div>

      {/* Form */}
      <div className="flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden inline-flex items-center gap-1.5 text-ink-soft hover:text-ink text-sm mb-8">
            <ArrowLeft size={16} /> Back home
          </Link>
          <div className="lg:hidden mb-6"><Logo size={30} /></div>

          <h2 className="font-display text-3xl font-semibold text-ink">
            {tab === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-ink-soft text-sm mt-1.5 mb-6">
            {tab === 'signin' ? 'Sign in to book pros and manage your jobs.' : 'It’s free — book a pro or offer your services.'}
          </p>

          {/* Tabs */}
          <div className="inline-flex bg-sand rounded-full p-1 mb-6 w-full">
            {(['signin', 'signup'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  tab === t ? 'bg-surface text-ink shadow-soft' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {t === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-ink font-semibold text-sm mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="field" />
            </div>
            <div>
              <label className="text-ink font-semibold text-sm mb-1.5 block">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="field" />
            </div>

            {error && <p className="text-coral text-sm bg-coral-tint border border-coral/20 rounded-2xl px-3 py-2.5">{error}</p>}

            <button type="submit" disabled={loading} className="btn-clay py-3.5 text-base mt-1">
              {loading ? 'Please wait…' : tab === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-ink-faint text-xs text-center mt-5">
            By continuing you agree to Manos’ Terms & Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
