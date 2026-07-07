import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Wrench, Lightbulb, SprayCan, ArrowRight, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) navigate('/app', { state: { initialMessage: query.trim() } });
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 font-bold text-white">
          <Zap size={20} className="text-amber-400 fill-amber-400" />
          <span className="text-lg tracking-tight">Dispatch</span>
        </div>
        {user ? (
          <Link
            to="/app"
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
          >
            Go to app
            <ArrowRight size={14} />
          </Link>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-medium text-sm px-4 py-2 rounded-xl transition-colors"
          >
            <LogIn size={14} />
            Sign in
          </Link>
        )}
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-amber-400/10 border border-amber-400/20 rounded-2xl px-4 py-1.5">
            <span className="text-amber-400 text-xs font-semibold tracking-wider uppercase">AI Home Services</span>
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white text-center leading-[1.1] max-w-3xl mb-4">
          Don't search.<br />
          <span className="text-amber-400">Just ask.</span>
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl text-center max-w-xl mb-10 leading-relaxed">
          Describe the problem — our AI finds, compares and books local pros for you.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-2xl">
          <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl focus-within:border-amber-400/60 transition-colors shadow-2xl shadow-zinc-950/50">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="My kitchen sink is leaking and I need someone tomorrow morning…"
              className="flex-1 bg-transparent text-white placeholder:text-zinc-500 text-base px-5 py-4 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="mr-2 flex items-center gap-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-zinc-950 font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
            >
              Find a pro
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        {/* Category chips */}
        <div className="flex gap-3 mt-8 flex-wrap justify-center">
          <Link
            to="/browse?category=plumber"
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-sm px-4 py-2 rounded-xl transition-all"
          >
            <Wrench size={15} className="text-blue-400" />
            Plumbers
          </Link>
          <Link
            to="/browse?category=electrician"
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-sm px-4 py-2 rounded-xl transition-all"
          >
            <Lightbulb size={15} className="text-yellow-400" />
            Electricians
          </Link>
          <Link
            to="/browse?category=cleaner"
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-sm px-4 py-2 rounded-xl transition-all"
          >
            <SprayCan size={15} className="text-emerald-400" />
            Cleaners
          </Link>
        </div>
      </div>

      {/* Feature strip */}
      <div className="border-t border-zinc-900 py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: 'Instant matching', desc: 'AI scans vetted local pros in seconds and picks the best fit.' },
            { icon: Lightbulb, title: 'Smart ranking', desc: 'Ranked by distance, rating, price and emergency availability.' },
            { icon: Wrench, title: 'One-tap booking', desc: 'Confirm date, address and go — no phone calls, no hold music.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-3">
              <div className="w-9 h-9 bg-amber-400/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon size={18} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
